/** Shared read-only input policy for model and real keyboard playthroughs. */
const {OceanLevel}=require('../.test-build/assets/scripts/ocean/OceanLevel.js');
const {segmentRect}=require('../.test-build/assets/scripts/core/Types.js');
class OceanBrain {
  next(s) {
    const p = s.player;
    if (s.stage === "shore")
      return { axis: 1, vertical: 0, shoot: false, jump: false };
    if (s.stage !== "swimming" || s.victory.active)
      return { axis: 0, vertical: 0, shoot: false, jump: false };
    let axis = 1,
      targetY = 350;
    if (p.x > 6400 && p.x < 7050) targetY = 405;
    const enemy = s.enemies
      .filter(
        (e) =>
          e.hp > 0 &&
          !OceanLevel.obstacles.some(r=>segmentRect({x:p.x,y:p.y+35},{x:e.x,y:e.y+32},r)!==null) &&
          e.kind !== "kelp" &&
          e.kind !== "mine" &&
          !(p.x > 9100 && p.x < 9750 && p.y < 420 && e.y >= 480) &&
          e.x > p.x - 30 &&
          e.x - p.x < 540,
      )
      .sort((a, b) => a.x - b.x)[0];
    if (enemy) {
      const gap = enemy.x - p.x;
      targetY = enemy.y + (enemy.kind === 'captain' ? 25 : 5);
      if (gap < 340) axis = 0;
      if (gap < 210) axis = -1;
      if (enemy.mode === "tell" && enemy.locked && this.dodgeKey !== `${enemy.id}/${enemy.serial}`) {
        this.dodgeKey=`${enemy.id}/${enemy.serial}`;
        const preferred=enemy.y+(p.y>enemy.y?150:-150);
        // Choose a lane with actual room; the faster submarine can now follow
        // into a top/bottom corner where the previous outward dodge hit bounds.
        this.dodgeY=preferred>510?enemy.y-150:preferred<100?enemy.y+150:preferred;
        // Hold the chosen lane until the already-committed projectile passes.
        // Returning during the enemy's recovery walks back into its old shot.
        this.dodgeUntil=s.time+enemy.timer+Math.max(.9,gap/220+.2);
      }
      if(s.time<this.dodgeUntil)targetY=this.dodgeY;
    }
    if (s.boss.active && s.boss.hp > 0) {
      axis = p.x < s.boss.x-490 ? 1 : p.x > s.boss.x-410 ? -1 : 0;
      targetY = 340;
      if (
        ["laser", "cannon", "fan", "torpedo"].includes(s.boss.attack) &&
        ["tell", "fire"].includes(s.boss.mode)
      ) {
        // Let the warning acquire, then leave the committed ray. Moving during
        // tracking and immediately returning walked into the later fan volley.
        if(s.boss.locked&&this.bossDodgeSerial!==s.boss.serial){
          this.bossDodgeSerial=s.boss.serial;
          this.bossDodgeY=Math.sin(s.boss.angle)<0?600:85;
          this.bossDodgeUntil=s.time+s.boss.timer+1.5;
        }
      }
      if(s.time<this.bossDodgeUntil)targetY=this.bossDodgeY;
      if (s.boss.attack === "sweep") targetY = s.boss.angleStart > Math.PI ? 510 : 190;
      if (s.boss.attack === "ring") {
        const dx = p.x - (s.boss.x - 220);
        targetY = s.boss.y + Math.tan(s.boss.ringGap) * dx - 35;
      }
    }
    // Use authored recovery drops with ordinary movement. Ignoring medical
    // breaks made visual regression runs depend on the phase of one late shot.
    const medical=p.health<=3&&s.pickups?.filter(d=>d.kind==='medkit'&&d.active&&Math.abs(d.x-p.x)<360)
      .sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0];
    if(medical&&!s.boss.active&&(!enemy||Math.abs(enemy.x-p.x)>180)){
      axis=Math.abs(medical.x-p.x)>24?Math.sign(medical.x-p.x):0;
      targetY=medical.y-30;
    }
    targetY = Math.max(80, Math.min(s.boss.active?600:530, targetY));
    // Steer around authored solid decks, rather than teleporting through the map.
    if (p.x > 4280 && p.x < 4920) targetY = Math.max(350, targetY);
    if (p.x > 6500 && p.x < 6980) targetY = Math.max(370, targetY);
    if (p.x > 7160 && p.x < 7660) targetY = Math.min(390, targetY);
    if (p.x > 9100 && p.x < 9750) targetY = Math.min(350, targetY);
    if (p.x > 10750 && p.x < 11490) targetY = Math.max(335, targetY);
    if (p.x > 11380 && p.x < 12100) targetY = Math.min(370, targetY);
    if (p.x > 12000 && p.x < 12760) targetY = Math.max(355, targetY);
    if (p.x > 12850 && p.x < 13500) targetY = Math.min(285, targetY);
    if (p.x > 13430 && p.x < 14030) targetY = Math.max(330, targetY);
    if (p.x > 14070 && p.x < 14650) targetY = Math.min(355, targetY);
    // A defeated shooter leaves its projectile in flight. React to visible
    // approaching shots as well as the living enemy's warning; input only.
    if(!s.boss.active) {
      let nearest=.55, threat;
      for(const shot of s.projectileStates??[]) {
        if(shot.owner!=='enemy'||Math.abs(shot.x-p.x)>280)continue;
        const dx=p.x-shot.x,dy=p.y+35-shot.y,v2=shot.vx**2+shot.vy**2;
        const t=(dx*shot.vx+dy*shot.vy)/v2;
        if(t<.08||t>=nearest)continue;
        if(Math.hypot(dx-shot.vx*t,dy-shot.vy*t)>35)continue;
        nearest=t;threat=shot;
      }
      if(threat){
        const dir=threat.y>p.y+35?-1:1;
        for(const sign of [dir,-dir]){
          const lane=p.y+sign*100;
          if(lane<85||lane>530)continue;
          if(OceanLevel.obstacles.some(r=>segmentRect({x:p.x,y:p.y+35},{x:p.x,y:lane+35},r,22)!==null))continue;
          this.shotDodgeY=lane;this.shotDodgeUntil=s.time+.52;break;
        }
      }
      if(s.time<this.shotDodgeUntil)targetY=this.shotDodgeY;
    }
    const vertical =
      Math.abs(targetY - p.y) < 14 ? 0 : Math.sign(targetY - p.y);
    // A released/re-pressed trigger is an ordinary player's transition from
    // safe box cutting to ranged fire; don't hold the protected press forever.
    const finishedBox=s.protectedPress&&!s.objects?.some(c=>c.hp>0&&Math.hypot(c.x-p.x,c.y+26-p.y-34)<115);
    // Water firing keeps the current facing for strafing. After swimming back
    // without firing, release the trigger and face the boss before resuming.
    const face=s.boss.active&&s.boss.hp>0?Math.sign(s.boss.x-p.x):enemy?Math.sign(enemy.x-p.x):axis>0?1:p.facing;
    if(p.facing!==face)
      return {axis:face,vertical,shoot:false,jump:false};
    const heavy=(enemy?.kind==='captain'&&Math.abs(enemy.x-p.x)<480)||(s.boss.active&&s.boss.hp>0);
    const grenade=heavy&&s.grenades>0&&Math.floor(s.time/1.4)%2===0;
    return { axis, vertical, shoot: !finishedBox, grenade, jump: false };
  }
}
module.exports = { OceanBrain };

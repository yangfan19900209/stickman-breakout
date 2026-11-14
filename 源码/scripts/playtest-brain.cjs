/** Read-only playtest policy shared by model and real-keyboard browser runs. */
const {DeckTraversal}=require('./deck-traversal.cjs');
class PlaytestBrain {
  decks=new DeckTraversal();
  constructor({ healthThreshold = 3 } = {}) {
    this.healthThreshold = healthThreshold;
  }
  jumpUntil = 0;
  lastGrenade = -10;
  next(s) {
    const p = s.player,
      time = s.time,
      enemy = s.enemies
        .filter(
          (e) =>
            e.health > 0 &&
            e.kind !== "colossus" &&
            !(e.kind === "guard" && s.boss?.kind !== "colossus"),
        )
        .sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
    let axis = 1,
      shoot = false,
      crouch = false,
      aimY = 0,
      grenade = false;
    let wantsJump = false;
    const weaponRange =
      s.weapon === "shotgun" ? 430 : s.weapon === "rocket" ? 900 : 860;
    const useful = s.pickups?.filter(
      (i) =>
        i.x >= (s.progression?.retreatLimit ?? 0) + 13 &&
        Math.abs(i.x - p.x) < (i.kind === "health" && p.health <= this.healthThreshold ? ((s.boss?.active || s.arenaEntered) ? 1000 : 600) : 330) &&
        Math.abs(i.y - p.y - 25) < 100 &&
        // Do not turn back for a pickup on a roof that is still above our feet.
        // Climb via the route first; reversing mid-jump below it only oscillates.
        !s.terrain?.some(r => r.kind === "platform" && i.x >= r.x && i.x <= r.x + r.w &&
          Math.abs(i.y - (r.y + r.h) - 10) < 3 && p.y < r.y + r.h - 12) &&
        (i.kind !== "health" || p.health <= this.healthThreshold) &&
        (i.kind !== "grenades" || s.grenades < 6) &&
        (i.kind !== "ammo" || s.weapon === "rocket" && s.ammo < 6 || s.weapon === "shotgun" && s.ammo < 18),
    ).sort((a, b) => Number(b.kind === "health") - Number(a.kind === "health") || Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
    const mini = s.miniBoss;
    const bossAftermath=s.guardHealth===0&&(s.boss?.active || s.arenaEntered)&&s.projectileStates?.some(b=>b.owner==='enemy'&&b.x>p.x-250&&b.x<p.x+1000);
    const miniFight = mini?.health > 0 && Math.abs(mini.x - p.x) < 680 && !(s.boss?.active || s.arenaEntered);
    if (miniFight) this.sawMiniAlive = true;
    if (mini?.health === 0 && this.sawMiniAlive && this.miniDefeatedAt === undefined)
      this.miniDefeatedAt = time;
    // A kill does not remove the tank's already airborne rounds. Do not jump
    // onto its supply step while the final shells are still passing overhead.
    const miniAftermath = mini?.health === 0 && !(s.boss?.active || s.arenaEntered) &&
      time-(this.miniDefeatedAt??-10)<3 && Math.abs(mini.x-p.x)<850 &&
      s.projectileStates?.some(b => b.owner === "enemy" && b.x>mini.x-1000 && b.x<mini.x+150 &&
        (b.kind === "cannon" || b.visual === "mech-round"));
    const healthCache = p.health <= this.healthThreshold && s.objects?.find(o =>
      o.x + o.w >= (s.progression?.retreatLimit ?? 0) + 13 && o.alive && o.kind === "wood" && o.id.startsWith("health-") &&
      Math.abs(o.x + o.w / 2 - p.x) < 520 && o.y < p.y + 20);
    if (useful?.kind === "health" && !miniAftermath) {
      axis = Math.abs(useful.x - p.x) < 18 ? 0 : useful.x > p.x ? 1 : -1;
      shoot = true;
    } else if (healthCache && !miniAftermath) {
      // Take the authored medical break before advancing into another fight.
      // Land and open the crate with ordinary crouched shots, then collect it.
      const center = healthCache.x + healthCache.w / 2;
      const spots = [healthCache.x + healthCache.w + 45, healthCache.x - 45,
        healthCache.x + healthCache.w + 90, healthCache.x - 90].filter(x =>
        s.terrain?.some(r => r.kind === "ground" && x >= r.x && x <= r.x+r.w &&
          Math.abs((r.slope?.left ?? r.y+r.h)-healthCache.y)<4) &&
        !s.terrain?.some(r => r.kind !== "ground" && x+13>r.x && x-13<r.x+r.w &&
          r.y < healthCache.y+74 && r.y+r.h>healthCache.y+2));
      const standX = spots.sort((a,b)=>Math.abs(a-p.x)-Math.abs(b-p.x))[0] ?? center;
      const face = Math.sign(center-p.x);
      axis = Math.abs(standX-p.x)>10 ? Math.sign(standX-p.x) : p.facing!==face ? face : 0;
      shoot = true;
      crouch = p.grounded;
    } else if (miniFight || miniAftermath) {
      const dx = mini.x - p.x;
      let target = mini.x - 420;
      const tell = `${mini.attack}:${mini.warningX}`;
      if (mini.warningTime > 0 && (tell !== this.miniTell || mini.warningTime > (this.miniWarningTime ?? 0)+.1)) {
        this.miniTell = tell;
        this.miniSafeUntil = time+mini.warningTime+.25;
        if (mini.attack === "bombard") {
          const points = mini.warningPoints?.length ? mini.warningPoints : [{x:mini.warningX}];
          const left = Math.min(...points.map(q=>q.x))-140;
          const right = Math.max(...points.map(q=>q.x))+140;
          const choices = [left,right].filter(x=>x>mini.x-650&&x<mini.x-240);
          this.miniSafeX = choices.sort((a,b)=>Math.abs(a-p.x)-Math.abs(b-p.x))[0] ?? mini.x-420;
        } else {
          // Do not rush back through the shell impact while the next locked
          // burst is winding up. Wait here and jump when its rounds arrive.
          this.miniSafeX = Math.max(mini.x-645,Math.min(mini.x-260,p.x));
        }
      }
      this.miniWarningTime = mini.warningTime;
      const incoming = s.projectileStates?.some(b => b.owner === "enemy" && b.x>p.x-120 &&
        b.x<mini.x && b.vx<0 && (b.kind==="cannon"||b.visual==="mech-round"));
      if (time<(this.miniSafeUntil??0)||incoming) target=this.miniSafeX??target;
      axis = Math.abs(Math.max(target,(s.progression?.retreatLimit??0)+35)-p.x)>22 ? Math.sign(Math.max(target,(s.progression?.retreatLimit??0)+35)-p.x) : p.facing!==Math.sign(dx) ? Math.sign(dx) : 0;
      shoot = true;
      crouch = p.grounded && Math.abs(target-p.x)<30;
      if (!miniAftermath && Math.abs(dx) < 430 && s.grenades > 0 && time - this.lastGrenade > 2 && p.facing===Math.sign(dx)) {
        grenade = true;
        this.lastGrenade = time;
      }
      if (miniAftermath) {
        axis = 0;
        shoot = false;
        grenade = false;
        crouch = p.grounded;
      }
    } else if (useful) {
      axis = Math.abs(useful.x - p.x) < 18 ? 0 : useful.x > p.x ? 1 : -1;
      shoot = true;
    } else if ((s.boss?.active || s.arenaEntered) && (s.guardHealth > 0 || bossAftermath)) {
      const boss = s.boss,
        dx =
          (s.enemies.find(
            (e) => e.kind === (boss.kind === "colossus" ? "colossus" : "guard"),
          )?.x ?? s.exitX - 300) - p.x;
      const bossX = p.x + dx;
      const arenaStart = s.progression?.retreatLimit ?? s.arena?.start ?? 6740;
      let target = bossX - 640;
      // Keep the safe side of a locked tell until its volley has passed.
      // Turning back at the warning's edge walks straight into late shells.
      const tell = `${boss.attack}:${boss.warningX}:${boss.warningTargetY}`;
      if (boss.windup > 0 && tell !== this.bossTell) {
        this.bossTell = tell;
        // A moving boss changes the remaining retreat space. Choose a real
        // safe side of the mark, rather than clamping left back onto the mark.
        const marks=boss.warningPoints?.length?boss.warningPoints.map(p=>p.x):[boss.warningX];
        const safe = [Math.min(...marks)-110,Math.max(...marks)+110].filter(x=>x>arenaStart+65&&x<bossX-(boss.halfWidth??112)-32);
        this.bossSafeX = safe.sort((a,b)=>Math.abs(a-p.x)-Math.abs(b-p.x))[0]
          ?? Math.max(arenaStart+65,Math.min(bossX-290,boss.warningX+235));
        if(boss.attack==='burst'||boss.attack==='sweep')
          this.bossSafeX=Math.max(arenaStart+65,Math.min(bossX-(boss.halfWidth??112)-32,boss.warningX+140));
        if (boss.attack === "salvo" || boss.attack === "missiles") {
          this.bossBallisticSafeX = this.bossSafeX;
          this.bossVolleyImpactAt=time+boss.windup+(boss.attack==='missiles'?1.3:1.05);
          this.bossVolleyEnd=this.bossVolleyImpactAt+(boss.phase===2?.49:.22)+.25;
          this.bossVolleyMarks=boss.warningPoints?.length?boss.warningPoints.map(p=>p.x):[boss.warningX];
        }
      }
      const incoming = s.projectileStates?.some(b => b.owner === "enemy" &&
        b.visual && b.x > p.x - 160 && b.x < bossX && b.vx < 0);
      if (boss.attack !== "stomp" && (boss.warningTime > 0 || boss.beam?.active || incoming))
        target = this.bossSafeX ?? target;
      // The next warning can begin before the last lobbed missile lands.
      // Hold the previous artillery refuge instead of crossing its old mark.
      const airborneShells = s.projectileStates?.some(b => b.owner === "enemy" &&
        b.gravity > 0 && b.x > arenaStart - 100 && b.x < bossX + 200);
      if (airborneShells && this.bossBallisticSafeX !== undefined)
        target = this.bossBallisticSafeX;
      // Read the committed endpoint and keep a usable lane inside the arena.
      const minX=arenaStart+65,maxX=(s.arena?.end??s.levelWidth)-65;
      if(boss.attack==='charge'&&(boss.windup>0||boss.mode==='charging'))
        target=boss.chargeEndX-(boss.halfWidth??112)-115;
      if(boss.attack==='leap'&&(boss.windup>0||boss.mode==='leaping'))
        target=boss.leapTargetX-(boss.halfWidth??112)-125;
      target=Math.max(minX,Math.min(maxX,bossX-(boss.halfWidth??112)-32,target));
      if(boss.mode==='leaping'&&boss.vy<0&&p.grounded){
        const ground=boss.warningPoints?.[0]?.y??150;
        const impact=(boss.vy+Math.sqrt(boss.vy*boss.vy+2400*Math.max(0,boss.y-ground)))/1200;
        const wave=Math.max(0,Math.abs(p.x-boss.leapTargetX)-(boss.halfWidth??112)-14)/400;
        if(impact+wave<.34)wantsJump=true;
      }
      axis = Math.abs(target-p.x) > 8 ? Math.sign(target-p.x) : p.facing !== Math.sign(dx) ? Math.sign(dx) : 0;
      shoot = true;
      if(p.grounded&&Math.abs(target-p.x)<35&&['sweep','burst'].includes(boss.attack))crouch=true;
      if (Math.abs(dx) < 550 && s.grenades > 0 && time - this.lastGrenade > 2.5 && p.facing === Math.sign(dx)) {
        grenade = true;
        this.lastGrenade = time;
      }
      if (boss.attack === "laser" && boss.muzzle && (boss.windup > 0 || boss.beam?.active)) {
        const lineY = boss.muzzle.y + (boss.warningTargetY-boss.muzzle.y) *
          (p.x-boss.muzzle.x) / (boss.warningX-boss.muzzle.x);
        if (lineY > p.y+45) crouch = p.grounded;
        else if (lineY > p.y-12 && boss.windup < .24) wantsJump = true;
      }
      if (enemy && Math.abs(enemy.x - p.x) < 220 && boss.windup===0 && !['charging','leaping'].includes(boss.mode) && time>(this.bossVolleyEnd??0)) {
        axis =
          p.facing === (enemy.x > p.x ? 1 : -1) ? 0 : enemy.x > p.x ? 1 : -1;
        shoot = true;
      }
      if (dx < (boss.halfWidth??112)+45) axis = -1;
    } else if (enemy && Math.abs(enemy.x - p.x) < weaponRange) {
      const dx = enemy.x - p.x,
        dy = enemy.y - p.y;
      if (Math.abs(dy) < 38) {
        const facing = dx > 0 ? 1 : -1;
        axis = Math.abs(dx) > 420 ? facing : 0;
        if (axis === 0 && p.facing !== facing) axis = facing;
        shoot = true;
        crouch =
          p.grounded && (enemy.kind === "ranged" || enemy.kind === "shield");
        if (
          enemy.kind === "shield" &&
          Math.abs(dx) < 340 &&
          s.grenades > 0 &&
          time - this.lastGrenade > 3
        ) {
          grenade = true;
          this.lastGrenade = time;
        }
      } else if (dy > 38) {
        axis = dx > 0 ? 1 : -1;
        const lift = s.mechanisms?.find((m) => m.kind === "lift" && Math.abs(m.x + m.w / 2 - enemy.x) < 450 && Math.abs(m.x + m.w / 2 - p.x) < 500);
        if (lift && enemy.y > 250 && p.y < enemy.y - 30) {
          if (p.x < lift.x + 30) axis = 1;
          else if (p.x > lift.x + lift.w - 30) axis = -1;
          else {
            axis = 0;
            if (
              p.grounded &&
              Math.abs(p.y - lift.y - lift.h) > 3 &&
              lift.y + lift.h < 276
            )
              wantsJump = true;
          }
        } else if (p.grounded) {
          const roof = s.terrain?.find(
            (r) =>
              r.kind === "platform" &&
              !r.entityId &&
              r.x < enemy.x &&
              r.x + r.w > enemy.x &&
              Math.abs(r.y + r.h - enemy.y) < 6,
          );
          if (
            roof && !roof.oneWay &&
            p.x > roof.x - 25 &&
            p.x < roof.x + roof.w + 25 &&
            p.y < enemy.y - 50
          )
            axis = -1;
          else if (Math.abs(dx) < 500) wantsJump = true;
        }
        shoot = Math.abs(dy) < 95;
      } else {
        // Leave the right edge fully; center-based edge decisions can oscillate
        // while the foot collider still overlaps a platform by a few pixels.
        axis = 1;
      }
    }
    // Reach visible medicine on an optional one-way shelf using normal input.
    const shelfMedicine = p.health <= this.healthThreshold && s.pickups?.find(i =>
      i.kind === 'health' && Math.abs(i.x-p.x)<520 && i.y>p.y+40 && i.y<p.y+170 &&
      s.terrain?.some(r=>r.kind==='platform'&&r.oneWay&&i.x>=r.x&&i.x<=r.x+r.w));
    if(shelfMedicine && !miniAftermath && !(s.boss?.active || s.arenaEntered)){
      axis=Math.abs(shelfMedicine.x-p.x)>14?Math.sign(shelfMedicine.x-p.x):0;
      if(p.grounded&&Math.abs(shelfMedicine.x-p.x)<95)wantsJump=true;
      crouch=false;shoot=true;
    }
    // Shoot through real breakable cover on the route; conserve finite weapons in open space.
    if (
      enemy &&
      enemy.kind !== "guard" &&
      Math.abs(enemy.x - p.x) < weaponRange &&
      Math.abs(enemy.y - p.y) < 38
    ) {
      const direction = enemy.x > p.x ? 1 : -1,
        gunY = p.y + (crouch ? 26 : 44);
      const wall = s.terrain?.some(
        (r) =>
          r.kind !== "ground" &&
          (!r.entityId ||
            s.objects?.some(
              (o) => o.id === r.entityId && o.kind === "concrete",
            )) &&
          r.y <= gunY &&
          r.y + r.h >= gunY &&
          (direction > 0
            ? r.x > p.x && r.x < enemy.x
            : r.x + r.w < p.x && r.x + r.w > enemy.x),
      );
      if (wall) {
        axis = direction;
        crouch = false;
      }
    }
    const rope = s.objects?.find(
      (o) =>
        o.kind === "rope" && o.alive && Math.abs(o.x - p.x) < 190 && p.y > 180 &&
        // A raised bridge blocks shots from directly underneath its rope.
        !s.mechanisms?.some(m => m.kind === "bridge" && !m.released &&
          o.x >= m.x && o.x <= m.x + m.w && p.y + 44 < m.y + m.h),
    );
    if (rope) {
      axis = rope.x > p.x ? 1 : -1;
      shoot = true;
      aimY = 1;
      crouch = false;
    }
    const cover = s.objects?.find(
      (o) =>
        o.alive &&
        o.kind !== "rope" &&
        o.kind !== "hanging" &&
        o.kind !== "concrete" &&
        Math.abs(o.x - p.x) < 700 &&
        o.y < p.y + 50 &&
        o.y + o.h > p.y + 24 &&
        Math.sign(o.x + o.w / 2 - p.x) === (axis || p.facing),
    );
    if (cover) shoot = true;
    if (p.grounded && axis !== 0) {
      const block = s.terrain?.some(
        (r) =>
          r.kind !== "ground" &&
          !r.entityId?.startsWith("gate:") &&
          r.y < p.y + 74 &&
          r.y + r.h > p.y + 2 &&
          (axis > 0
            ? r.x > p.x && r.x - p.x < 74
            : r.x + r.w < p.x && p.x - (r.x + r.w) < 74),
      );
      if (block) wantsJump = true;
    }
    const bossFight = (s.boss?.active || s.arenaEntered) && (s.guardHealth > 0 || bossAftermath);
    const threat = !bossFight&&!miniFight&&!miniAftermath&&s.projectileStates?.some(b=>{
      if(b.owner!=='enemy')return false;
      const relative=b.vx-p.vx;if(Math.abs(relative)<1)return false;
      const eta=(p.x-b.x)/relative;if(eta<0||eta>.34)return false;
      const y=b.y+b.vy*eta-.5*(b.gravity??0)*eta*eta,blast=b.kind==='cannon'||b.kind==='rocket';
      // Do not jump into an overhead round that was already going to miss.
      return y>p.y-(blast?30:6)&&y<p.y+(blast?105:crouch?39:68);
    });
    if (p.grounded && threat) wantsJump = true;
    // A tap now commits the complete first arc. While airborne, spend the
    // remaining real air jump on an arriving projectile instead of assuming
    // that releasing Space will cut the first ascent and land us early.
    if(threat&&!p.grounded&&p.airJumpsRemaining>0&&p.vy<80&&time>this.jumpUntil+.04)
      this.jumpUntil=time+.32;
    // Tougher shield soldiers can finish their visible bash windup before
    // rifle fire kills them. React to the tell using an ordinary jump, as for
    // a knife soldier's committed rush; do not assume three hits end the fight.
    if (p.grounded && s.enemies.some(e => e.health > 0 &&
      ['shield','melee'].includes(e.kind) && Math.abs(e.x-p.x)<190 && Math.abs(e.y-p.y)<55 &&
      (e.action==='charge' || ['bash','swing'].includes(e.action)&&e.windup<.23)))
      wantsJump = true;
    if (bossFight || miniFight || miniAftermath) {
      // React to the arriving wave, not the distant stomp animation. The wave
      // may take well over a second to reach the player's current position.
      const danger = s.projectileStates?.some(b => {
        if (b.owner !== "enemy") return false;
        const relative = b.vx - p.vx;
        if (Math.abs(relative) < 1) return false;
        const eta = (p.x-b.x) / relative;
        if (eta < 0 || eta > .34) return false;
        const y = b.y+b.vy*eta-.5*(b.gravity??0)*eta*eta;
        const blast=b.kind==='cannon'||b.kind==='rocket';
        return y > p.y-18 && y < p.y+(blast?105:miniFight?76:46) && (b.kind === "shockwave" || blast || b.visual==="mech-round");
      });
      if (danger && p.grounded) wantsJump = true;
    }
    if(bossFight){
      const volleyDanger=time<(this.bossVolleyEnd??0)&&this.bossVolleyMarks?.some(x=>Math.abs(p.x-x)<92);
      if(volleyDanger&&p.grounded&&time>this.bossVolleyImpactAt-.34)wantsJump=true;
      // A high cannon/fan covers the air. Stay low in the chosen safe lane;
      // jumping into an otherwise overhead round is not an evasive action.
      if(['burst','sweep'].includes(s.boss.attack)&&p.grounded&&!volleyDanger){
        wantsJump=false;this.jumpUntil=Math.min(this.jumpUntil,time);crouch=axis===0;
      }
      if(volleyDanger&&!p.grounded&&p.airJumpsRemaining>0&&p.vy<110&&time>this.jumpUntil+.05)
        this.jumpUntil=time+.3;
    }
    if (wantsJump && p.grounded && time > this.jumpUntil + 0.1)
      this.jumpUntil = time + 0.38;
    // Higher catwalks use the game's ordinary second jump. Release the first
    // press before issuing another near the apex, just as the player must.
    if (!p.grounded && p.airJumpsRemaining > 0 && p.vy < 80 && p.vy > -180 &&
        enemy && enemy.y > p.y + 50 && time > this.jumpUntil + 0.04)
      this.jumpUntil = time + 0.3;
    // A turret below a concrete ledge cannot be hit by horizontal rifle fire
    // from the ledge. Use an ordinary grenade over the cover instead of waiting
    // in its cannon lane; this is playtest input policy, not a game-state edit.
    if (enemy?.kind === "turret" && Math.abs(enemy.x-p.x)<430 &&
        Math.abs(enemy.y-p.y)<180 && s.grenades>0 && s.weapon!=="rocket" &&
        (enemy.y<p.y-38 || s.terrain?.some(r=>r.entityId&&
          s.objects?.some(o=>o.id===r.entityId&&o.kind==='concrete')&&
          r.x<Math.max(p.x,enemy.x)&&r.x+r.w>Math.min(p.x,enemy.x)&&
          r.y<p.y+44&&r.y+r.h>p.y+44)) &&
        p.facing===Math.sign(enemy.x-p.x) && time-this.lastGrenade>2.5) {
      grenade=true;this.lastGrenade=time;
    }
    const jumpHeld = time < this.jumpUntil;
    const jump = jumpHeld && !this.wasJumpHeld;
    this.wasJumpHeld = jumpHeld;
    if (jumpHeld) crouch = false;
    if (s.guardHealth === 0 && !bossAftermath) {
      axis = 1;
      shoot = false;
    }
    // Release the contextual crate cut before deliberately firing the gun again.
    if (s.melee?.crateProtection && s.melee.time === 0) shoot = false;
    const route=this.decks.next(s,axis||1);
    return { axis, jump, jumpHeld, shoot, crouch, aimY, grenade,...(route??{}) };
  }
}
module.exports = { PlaytestBrain };

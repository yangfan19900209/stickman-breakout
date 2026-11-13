/** Normal-input route over a solid scaffold. Back away from the overhang,
 * double-jump beside it, then walk across. Never mutates simulation state. */
class DeckTraversal {
  active=null;
  heldUntil=0;
  wasHeld=false;
  next(s,direction=1){
    const p=s.player,t=s.time;
    if(!this.active){
      const decks=s.terrain.filter(r=>r.kind==='platform'&&!r.oneWay&&
        (r.supported||s.mechanisms?.some(m=>!m.landed&&m.x===r.x)))
        .map(r=>{const lift=s.mechanisms?.find(m=>m.kind==='lift'&&m.x===r.x);return lift?{...r,y:lift.maxY}:r;})
        .filter(r=>p.y<r.y+r.h-4&&(direction>0?r.x-p.x<145&&r.x+r.w>p.x:r.x+r.w-p.x>-145&&r.x<p.x));
      const deck=decks.sort((a,b)=>Math.abs(a.x+a.w/2-p.x)-Math.abs(b.x+b.w/2-p.x))[0];
      if(!deck)return null;
      this.active={...deck,direction,stage:'align',second:false};this.wasHeld=false;
    }
    const d=this.active,top=d.y+d.h,dir=d.direction;
    const end=dir>0?d.x+d.w+35:d.x-35;
    if(dir>0?p.x>=end:p.x<=end){this.active=null;return null;}
    let axis=dir;
    if(d.stage==='align'){
      const start=dir>0?d.x-28:d.x+d.w+28;
      axis=Math.abs(p.x-start)>5?Math.sign(start-p.x):0;
      if(p.y>=top+2){d.stage='cross';axis=dir;}
      // Brake before the vertical jump: one frame of residual approach speed
      // can drift under the overhang and turn both jumps into head contacts.
      else if(axis===0&&p.grounded&&Math.abs(p.vx??0)<20){d.stage='jump';this.heldUntil=t+.38;}
    }
    if(d.stage==='jump'){
      axis=p.y>=top+2?dir:0;
      if(!p.grounded&&!d.second&&p.airJumpsRemaining>0&&p.vy<100&&t>this.heldUntil+.04){
        d.second=true;this.heldUntil=t+.32;
      }
      if(p.y>=top+2)d.stage='cross';
      else if(p.grounded&&t>this.heldUntil+.15){d.stage='align';d.second=false;}
    }
    if(d.stage==='cross'&&p.grounded&&t>this.heldUntil+.12&&s.terrain.some(r=>
      r.kind==='crate'&&r.y<p.y+74&&r.y+r.h>p.y+2&&
      (dir>0?r.x>p.x&&r.x-p.x<85:r.x+r.w<p.x&&p.x-r.x-r.w<85)))this.heldUntil=t+.38;
    const jumpHeld=t<this.heldUntil,jump=jumpHeld&&!this.wasHeld;
    this.wasHeld=jumpHeld;
    return {axis,jump,jumpHeld,crouch:false};
  }
}
module.exports={DeckTraversal};


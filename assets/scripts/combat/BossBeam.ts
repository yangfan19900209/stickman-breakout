import { Rect, Vec, segmentRect } from "../core/Types";
import type { PlayerController } from "../player/PlayerController";

/** One locked ray, clipped against real cover. Warning never deals damage. */
export class BossBeam {
  time=0;serial=0;hits=0;
  x=0;y=0;endX=0;endY=0;angle=0;length=0;
  private range=0;private damaged=false;
  get active(){return this.time>0;}
  start(origin:Vec,target:Vec,range:number,duration:number){
    this.x=origin.x;this.y=origin.y;this.angle=Math.atan2(target.y-origin.y,target.x-origin.x);
    this.range=range;this.time=duration;this.damaged=false;this.serial++;
  }
  stop(){this.time=0;this.length=0;}
  update(dt:number,p:PlayerController,solids:Rect[]){
    this.time=Math.max(0,this.time-dt);if(!this.active)return;
    const end={x:this.x+Math.cos(this.angle)*this.range,y:this.y+Math.sin(this.angle)*this.range};
    let nearest=1;
    for(const r of solids){const t=segmentRect(this,end,r);if(t!==null)nearest=Math.min(nearest,t);}
    this.endX=this.x+(end.x-this.x)*nearest;this.endY=this.y+(end.y-this.y)*nearest;this.length=this.range*nearest;
    if(!this.damaged&&p.alive&&segmentRect(this,{x:this.endX,y:this.endY},p.bounds,11)!==null)
      if(p.takeDamage(1,p.x<this.x?-1:1)){this.damaged=true;this.hits++;}
  }
}

import { GameConfig as C } from "../core/GameConfig";
import { Damageable, Rect, segmentRect, Facing } from "../core/Types";
import { PlayerController } from "../player/PlayerController";
import { LevelController } from "../level/LevelController";
import { ParticlePool } from "./ParticlePool";
import { sectorHitsRect, meleeHand } from "./MeleeGeometry";

/** Dedicated knife combos; contextual firearm quick-strikes remain a single cut. */
export class MeleeSystem {
  cooldown=0;time=0;swings=0;hits=0;blockedHits=0;
  stage=0;comboRemaining=0;heavyHits=0;
  state: "idle"|"windup"|"active"|"recovery"|"hit" = "idle";
  get action():string { return this.state==="hit"?"melee_hit":this.time>0?`${this.stance}_melee_attack_${this.stage}`:"melee_combo_reset"; }
  stance: "stand"|"crouch"|"jump" = "stand";
  private facing:Facing=1;
  private struck = new Set<Damageable>();
  private duration=.28;
  private lastAngle=1.05;
  private dedicated=false;
  private buffered=false;
  private previousAttack=false;
  cancel(p?:PlayerController):void {
    this.cooldown=this.time=this.comboRemaining=this.stage=0;this.buffered=this.previousAttack=false;this.state="idle";this.struck.clear();
    if(p)p.meleeTime=p.meleeStage=p.meleeProgress=0;
  }
  reset():void {this.cancel();this.swings=this.hits=this.blockedHits=this.heavyHits=0;}
  private visible(p:PlayerController,e:Damageable,solids:Rect[]):boolean {
    const r=e.bounds,from={x:p.x,y:p.y+(this.stance==="crouch"?25:42)},
      to={x:Math.max(r.x,Math.min(r.x+r.w,from.x)),y:Math.max(r.y,Math.min(r.y+r.h,from.y))};
    return !solids.some(s=>s!==r&&segmentRect(from,to,s,.4)!==null);
  }
  private near(p:PlayerController,e:Damageable,solids:Rect[]):boolean {
    return e.alive&&sectorHitsRect(p.x,p.y+38,C.melee.range,-.75,.75,e.bounds,p.facing)&&this.visible(p,e,solids);
  }
  update(dt:number,p:PlayerController,enemies:Damageable[],solids:Rect[],shoot:boolean,manual:boolean,particles:ParticlePool,level?:LevelController,objects:Damageable[]=[]):boolean {
    this.cooldown=Math.max(0,this.cooldown-dt);
    this.comboRemaining=Math.max(0,this.comboRemaining-dt);
    const old=this.time;this.time=Math.max(0,this.time-dt);
    if(!p.alive||p.hitTime>0||p.throwTime>0){this.cancel(p);if(p.alive&&p.hitTime>0)this.state="hit";return false;}
    if(this.state==="hit")this.state="idle";
    if(old>0&&this.time===0){this.state="idle";this.comboRemaining=this.stage<3?C.melee.comboWindow:0;}
    if(this.time===0&&this.comboRemaining===0)this.stage=0;
    const knife=p.weaponId==="knife",request=manual||shoot;
    if(this.time>0&&request&&!this.previousAttack&&knife)this.buffered=true;
    this.previousAttack=request;
    if(this.time===0&&this.cooldown===0&&(manual||(knife&&(shoot||this.buffered))||(!knife&&shoot&&enemies.some(e=>this.near(p,e,solids))))) {
      this.dedicated=knife;this.stance=p.crouched?"crouch":p.grounded?"stand":"jump";
      this.stage=knife&&this.stance==="stand"?this.stage%3+1:1;
      const c=C.melee.combo[this.stage-1];
      this.duration=knife?c.duration:C.melee.duration;this.time=this.duration;
      this.cooldown=knife?this.duration+(this.stage===3?.14:0):C.melee.interval;
      this.facing=p.facing;this.struck.clear();this.buffered=false;this.swings++;
      this.lastAngle=c.start;this.state="windup";
    }
    if(this.time>0){
      const c=C.melee.combo[this.stage-1],elapsed=this.duration-this.time,
        windup=this.dedicated?c.windup:C.melee.windup,
        t=Math.max(0,Math.min(1,(elapsed-windup)/c.active)),angle=c.start+(c.end-c.start)*t;
      this.state=elapsed<windup?"windup":t<1?"active":"recovery";
      p.facing=this.facing;p.meleeStage=this.stage;p.meleeStance=this.stance;p.meleeProgress=elapsed/this.duration;
      if(this.state==="active"){
        if(this.dedicated&&p.grounded&&this.stance!=="jump"&&level){
          const vx=p.vx,vy=p.vy;p.vx=this.facing*c.lunge*(this.stance==="crouch"?.35:1);p.vy=0;
          level.move(p,dt);p.vx=vx;p.vy=vy;
        }
        const hand=meleeHand(this.stage,this.stance);
        const originX=p.x+hand.x*this.facing,originY=p.y+hand.y,
          reach=this.stance==="crouch"?78:this.dedicated?c.range:C.melee.range,range=reach-hand.x;
        for(const e of [...enemies,...objects]){
          if(!e.alive||this.struck.has(e)||(e.bounds.x+e.bounds.w/2-p.x)*this.facing<0||!sectorHitsRect(originX,originY,range,this.lastAngle,angle,e.bounds,this.facing)||!this.visible(p,e,solids))continue;
          const body=e as Damageable&{kind?:string;facing?:Facing;shieldHealth?:number;vx?:number;vy?:number;hitTime?:number;grounded?:boolean};
          const blocked=body.kind==="shield"&&(body.shieldHealth??0)>0&&this.facing===-(body.facing??1);
          const material=blocked||body.kind==="steel"||body.kind==="concrete"?"metal":body.kind==="wood"||body.kind==="hanging"?"wood":"enemy";
          if(e.takeDamage(this.dedicated?c.damage:C.melee.damage,this.facing,"melee")){
            this.struck.add(e);this.hits++;if(blocked)this.blockedHits++;
            const r=e.bounds,ix=Math.max(r.x,Math.min(r.x+r.w,p.x+range*this.facing*.7)),iy=Math.max(r.y+3,Math.min(r.y+r.h-3,originY));
            particles.impact(ix,iy,material);particles.burst(ix,iy,this.stage===3?9:4,"spark");
            if(!blocked&&!["guard","colossus","turret","wood","barrel","sandbag","steel","concrete","hanging"].includes(body.kind??"")){
              body.vx=this.facing*(this.dedicated?c.knockback:95);body.hitTime=this.dedicated?(this.stage===3?.32:.20):.13;
              if(this.dedicated&&this.stage===3){body.vy=180;body.grounded=false;this.heavyHits++;}
            }
          }
        }
      }
      this.lastAngle=angle;
    }
    p.meleeTime=this.time;if(this.time===0)p.meleeStage=0;
    return this.time>0;
  }
}

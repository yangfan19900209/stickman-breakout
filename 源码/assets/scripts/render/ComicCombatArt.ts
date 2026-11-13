import { ComicAssets, ComicBatch } from "./ComicAssets";
import { Ink, colors } from "./Ink";
import { GameSession } from "../core/GameSession";
import { Projectile } from "../combat/ProjectileManager";
import { Grenade } from "../combat/GrenadeSystem";
import { WeaponSystem } from "../combat/WeaponSystem";
import { Particle, SandbagFrameIds, sandbagPieceSize } from "../combat/ParticlePool";
import { ComicClips, ComicFrames } from "./ComicFrames";
import { comicMuzzle, comicPose } from "./ComicPose";
import { directBarrel } from "./DirectPose";
import { ArmedSource } from "../combat/WeaponSystem";
import { rocketCrop, bulletCrop } from "./RocketPresentation";
import { GameConfig as C } from "../core/GameConfig";
import { Color, UITransform } from "cc";
import { ColossusBoss } from "../enemy/ColossusBoss";
import {projectileProfile} from '../combat/ProjectileProfile';
import {shieldBreakFrame} from './ShieldBreakFrames';
import { CombatPalette, fireBlastVisual } from './CombatPalette';

const bossWarning = new Color(...CombatPalette.warning);

/** Separate timed flash, illustrated ink burst, rising sprite smoke and physical debris. */
export class ComicCombatArt {
  private batch?: ComicBatch;
  readonly playerRockets:{x:number;y:number;width:number;angle:number;age:number}[]=[];
  readonly shieldBreaks:{frame:string;x:number;y:number;age:number;alpha:number}[]=[];
  readonly renderedProjectiles:{owner:string;kind:string;tier:string;frame:string;x:number;y:number;width:number;height:number;fullWidth:number;age:number}[]=[];
  readonly renderedBlasts:{style:string;owner:string;frame:string;age:number;x:number;y:number}[]=[];
  muzzlePoint?:{x:number;y:number;pitch:number};
  bossBeam={visible:false,x:0,y:0,length:0,angle:0};
  begin(ink: Ink): void {
    this.playerRockets.length=0;this.shieldBreaks.length=0;this.renderedProjectiles.length=0;this.muzzlePoint=undefined;this.bossBeam.visible=false;
    this.renderedBlasts.length=0;
    this.batch ??= new ComicBatch(ink.node, "Comic combat pool");
    this.batch.begin();
  }
  end(): void {
    this.batch?.end();
  }
  boss(ink:Ink,b:ColossusBoss,cam:number):boolean {
    if(!ComicAssets.enabled)return false;
    if(!b.active||!b.alive)return true;
    const tip=b.muzzle;
    if(b.warningTime>0){
      if(b.windup>0){this.batch!.put('mech.warning',b.x-cam,b.y+b.height+35,48,undefined,0,230);this.batch!.tintLast(CombatPalette.warning);}
      if(['laser','sweep','burst'].includes(b.attack)&&b.windup>0){
        const angle=Math.atan2(b.warningTargetY-tip.y,b.warningX-tip.x);
        const length=Math.hypot(b.warningX-tip.x,b.warningTargetY-tip.y);
        for(const offset of b.attack==='burst'?[-C.colossus.burstSpread,0,C.colossus.burstSpread]:[0])
          for(let n=0;n<18;n+=2)ink.segment(tip.x-cam+Math.cos(angle+offset)*length*n/18,tip.y+Math.sin(angle+offset)*length*n/18,
            tip.x-cam+Math.cos(angle+offset)*length*(n+1)/18,tip.y+Math.sin(angle+offset)*length*(n+1)/18,2,bossWarning);
        if(b.attack==='laser'){this.batch!.put('mech.orb',tip.x-cam,tip.y,42+Math.sin(b.animationTime*28)*8,undefined,0,180);this.batch!.tintLast(CombatPalette.fire);}
      }else if(b.attack==='charge'){
        const start=b.x+b.facing*b.halfWidth,end=b.chargeEndX+b.facing*b.halfWidth;
        for(let x=Math.min(start,end);x<Math.max(start,end);x+=36)ink.segment(x-cam,b.y+8,Math.min(x+23,Math.max(start,end))-cam,b.y+8,4,bossWarning);
        this.batch!.put('mech.target',end-cam,b.warningY+5,105,46,0,210,1,[.5,.16]);
        this.batch!.tintLast(CombatPalette.warning);
      }else if(b.attack==='leap'){
        this.batch!.put('mech.ground-ring',b.warningX-cam,b.warningY+5,(b.halfWidth+20)*2,48,0,235);
        this.batch!.tintLast(CombatPalette.warning);
        this.batch!.put('mech.target',b.warningX-cam,b.warningY+5,160,65,0,220,1,[.5,.16]);
        this.batch!.tintLast(CombatPalette.warning);
      }else if(b.attack==='stomp'){
        this.batch!.put('mech.ground-ring',b.x-cam,b.y+5,(b.halfWidth+35)*2,42,0,210);
        this.batch!.tintLast(CombatPalette.warning);
      }else if(b.attack==='salvo'||b.attack==='missiles'){
        for(const point of b.warningPoints){
          this.batch!.put('mech.target',point.x-cam,point.y+5,150,65,0,210,1,[.5,.16]);
          this.batch!.tintLast(CombatPalette.warning);
        }
      }
    }
    if(b.beam.active&&b.beam.length>0){
      const n=this.batch!.put('mech.beam',b.beam.x-cam,b.beam.y,b.beam.length,26+Math.sin(b.animationTime*70)*2,b.beam.angle*180/Math.PI,255,1,[0,.5]);
      this.batch!.tintLast(CombatPalette.fire);
      this.batch!.put('mech.orb',b.beam.x-cam,b.beam.y,57,undefined,0,250);
      this.batch!.tintLast(CombatPalette.fire);
      this.bossBeam={visible:n.active,x:b.beam.x,y:b.beam.y,length:b.beam.length,angle:n.angle*Math.PI/180};
    }else if(b.recoil>1.35&&!['missiles','stomp','laser','leap','charge'].includes(b.attack)){
      this.batch!.put('mech.muzzle',tip.x-cam,tip.y,88,undefined,0,255,-b.facing,[1,.5]);
      this.batch!.tintLast(CombatPalette.fire);
    }
    return true;
  }
  knife(x:number,y:number,angle:number,facing:number,width:number):boolean {
    if(!ComicAssets.enabled)return false;
    this.batch!.put("weapon.knife",x,y,width,undefined,angle*facing*180/Math.PI,255,facing,[0,.5]);
    return true;
  }
  blast(
    b: GameSession["explosions"]["items"][number],
    cam: number,
  ): boolean {
    if (!ComicAssets.enabled) return false;
    const x = b.x - cam,
      r = b.radius,
      t = b.age;
    // The authored sequence already contains the flash and spreading blast.
    // Legacy outlined circles/ellipses added a separate black frame around it.
    // Keep this path entirely sprite-based, including the earliest flash.
    const visual=fireBlastVisual(t),frame=ComicClips.explosion[visual.frame];
    if (t < 0.56){
      this.batch!.put(
        frame,
        x,
        b.y - r * 0.32,
        r * visual.scale,
        undefined,
        0,
        visual.alpha,
        1,
        [0.5, 0.08],
      );
      this.renderedBlasts.push({style:b.style,owner:b.owner,frame,age:t,x:b.x,y:b.y});
    }
    if (t > 0.1)
      for (let n = 0; n < 3; n++) {
        const age = t - 0.1,
          side = n - 1;
        this.batch!.put(
          "effect.smoke",
          x + side * r * (0.17 + age * 0.22),
          b.y + r * 0.12 + age * (65 + n * 16),
          r * (0.35 + age * 0.45),
          undefined,
          side * (8 + age * 12),
          Math.min(230, Math.max(0, (0.85 - t) * 400)),
          n % 2 ? -1 : 1,
        );
      }
    return true;
  }
  particle(p: Particle, cam: number): boolean {
    if (!ComicAssets.enabled) return false;
    if (p.kind === "shield") {
      const age=p.maxLife-p.life,frame=shieldBreakFrame(age),alpha=Math.round(255*Math.min(1,p.life/.22));
      this.batch!.put(frame,p.x-cam,p.y,p.size,p.size,0,alpha,p.fragment??1);
      this.shieldBreaks.push({frame,x:p.x,y:p.y,age,alpha});
      return true;
    }
    if (p.kind === "sandbag") {
      const fragment=p.fragment!,size=sandbagPieceSize(fragment,p.size);
      this.batch!.put(SandbagFrameIds[fragment%4],
        p.x-cam,p.y,size.width,size.height,
        p.spin*180/Math.PI,Math.round(255*Math.min(1,p.life/.7)),fragment%2?-1:1,[.5,.5]);
      return true;
    }
    if (p.kind !== "smoke" && p.kind !== "impact" && p.kind !== "dust") return false;
    const a = 1 - p.life / p.maxLife;
    this.batch!.put(
      p.kind === "smoke" ? "effect.smoke" : p.kind === "dust" ? "effect.dust" : p.material === "metal" ? "effect.metal" : p.material === "wood" ? "effect.wood" : "effect.impact",
      p.x - cam,
      p.y,
      p.kind === "smoke" ? p.size * 2.8 + a * 32 : p.kind === "dust" ? 22 + a * 20 : p.size * 2.4,
      undefined,
      p.kind === "smoke" ? p.spin * 8 : p.spin * 25,
      Math.max(0, (255 * p.life) / p.maxLife),
    );
    return true;
  }
  projectile(p: Projectile, cam: number): boolean {
    if (!ComicAssets.enabled)
      return false;
    const angle = (Math.atan2(p.vy, p.vx) * 180) / Math.PI;
    if(p.kind==='shockwave'){
      this.batch!.put('mech.ground-ring',p.x-cam,p.y,80,23,0,240);
      this.batch!.tintLast(CombatPalette.fire);
      this.batch!.put('mech.hit',p.x-cam,p.y+9,53,undefined,0,255);
      this.batch!.tintLast(CombatPalette.fire);
      return true;
    }
    const profile=projectileProfile(p),size=ComicFrames[profile.frame].size;
    const sprite=profile.rocket
      ?this.batch!.putRegion(profile.frame,p.x-cam,p.y,profile.width/size[0],rocketCrop(p.distance,size[0],size[1],profile.width),angle,[1,.5])
      :this.batch!.putRegion(profile.frame,p.x-cam,p.y,profile.width/size[0],bulletCrop(p.distance,size[0],size[1],profile.width),angle,[1,.5]);
    if (!profile.rocket) {
      const transform = sprite.getComponent(UITransform)!;
      transform.setContentSize(transform.contentSize.width, profile.height!);
    }
    const actual=sprite.getComponent(UITransform)!.contentSize;
    this.renderedProjectiles.push({owner:p.owner,kind:p.kind,tier:p.tier??'standard',frame:profile.frame,x:p.x,y:p.y,width:actual.width,height:actual.height,fullWidth:profile.width,age:p.age});
    if(p.kind==='rocket'&&p.owner==='player')this.playerRockets.push({x:sprite.position.x+cam,y:sprite.position.y,width:actual.width,angle:sprite.angle,age:p.age});
    return true;
  }
  grenade(g: Grenade, cam: number): boolean {
    if (!ComicAssets.enabled) return false;
    this.batch!.put(
      "projectile.grenade",
      g.x - cam,
      g.y,
      19,
      26,
      (g.spin * 180) / Math.PI,
      255,
      1,
      [0.5, 0.42],
    );
    return true;
  }
  muzzle(w: WeaponSystem, cam: number, source?: ArmedSource): boolean {
    if (!ComicAssets.enabled) return false;
    const tip = source ? comicMuzzle(source, source.aimPitch ?? 0, w.id === "rifle" ? 0 : 9) : undefined;
    if (w.flash > 0) {
      const facing = source?.facing ?? w.flashFacing;
      const pitch = source ? (w.id === "rocket" ? directBarrel(comicPose(source))?.pitch : undefined) ?? source.aimPitch ?? 0 : w.flashPitch;
      const strength = Math.min(1, w.flash / .12);
      const sprite=this.batch!.put(
        w.id === "rocket" ? "effect.smoke" : w.id === "shotgun" ? "effect.muzzle-large" : "effect.muzzle",
        tip && source ? source.x + tip.x * source.facing - cam : w.flashX - cam,
        tip && source ? source.y + tip.y : w.flashY,
        w.id === "shotgun" ? 84 : w.id === "rocket" ? 32 : 34 + 14 * strength,
        undefined,
        (pitch * facing * 180) / Math.PI,
        190 + 65 * strength,
        facing,
        [0, 0.5],
      );
      if(source)this.muzzlePoint={x:sprite.position.x+cam,y:sprite.position.y,pitch:sprite.angle*Math.PI/180/facing};
    }
    return true;
  }
}

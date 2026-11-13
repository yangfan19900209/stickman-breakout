import { ComicAssets, ComicBatch } from "./ComicAssets";
import { ComicFrames, ComicFrameId } from "./ComicFrames";
import { comicPose, comicMuzzle, rifleRecoilOffset } from "./ComicPose";
import { Ink } from "./Ink";
import { RenderActor } from "./StickmanRenderer";
import { comicEquipment } from "./ComicEquipment";
import { weaponPresentation } from "../combat/WeaponPresentation";
import { Sprite } from "cc";
import { isDirectActor, directScale } from "./DirectPose";
import { colossusPresentation } from "./ColossusPresentation";
import { tankPresentation } from "./TankPresentation";
import { celebrationFrame } from "./CelebrationFrames";

/** Whole supplied action frames. No segmented legs, geometric limbs or rotated corpses. */
export class ComicActorArt {
  playerStatus = {body:"",weapon:"",weaponVisible:false};
  bossStatus = {frame:"",width:0,height:0,x:0,y:0,visible:false};
  miniStatus = {frame:"",width:0,height:0,x:0,y:0,visible:false};
  private batch?: ComicBatch;
  begin(ink: Ink): void {
    this.batch ??= new ComicBatch(ink.node, "Comic actors");
    this.batch.begin();
  }
  end(): void { this.batch?.end(); }
  draw(ink: Ink, a: RenderActor, cam: number): boolean {
    if (!ComicAssets.enabled) return false;
    if (!this.batch) this.begin(ink);
    if(!a.kind&&(a.celebrationTime??0)>0){
      const id=celebrationFrame(a.celebrationTime!),f=ComicFrames[id];
      const n=this.batch!.put(id,a.x-cam,a.y+Math.max(0,Math.sin(a.celebrationTime!*Math.PI*3))*2.2,
        f.sourceSize[0]*.18,f.sourceSize[1]*.18);
      this.playerStatus={body:n.getComponent(Sprite)!.spriteFrame!.name,weapon:"",weaponVisible:false};
      return true;
    }
    if(a.kind==='colossus'){
      const v=colossusPresentation(a);
      const collapsing=a.animation==="Dead"&&a.deadTime<1.35;
      const n=this.batch!.put(v.id,a.x-cam+(collapsing?Math.sin(a.deadTime*43)*3:0),a.y,v.width,v.height,
        collapsing?Math.sin(a.deadTime*31)*1.5:0,a.hitTime&&Math.floor(a.hitTime*60)%2?190:255,v.flip);
      this.bossStatus={frame:n.getComponent(Sprite)!.spriteFrame!.name,width:v.width,height:v.height,x:n.position.x+cam,y:n.position.y,visible:n.active};
      return true;
    }
    if(a.kind==='guard'){
      const v=tankPresentation(a),n=this.batch!.put(v.id,a.x-cam,a.y,v.width,v.height,0,255,v.flip);
      this.miniStatus={frame:n.getComponent(Sprite)!.spriteFrame!.name,width:v.width,height:v.height,x:n.position.x+cam,y:n.position.y,visible:n.active};
      return true;
    }
    const equipment = comicEquipment(a), id = equipment.body, data = ComicFrames[id];
    const scale = a.kind === "guard" ? 1.25 : a.kind ? .8 : isDirectActor(id) ? directScale(id) : .64;
    const alpha = (a.hitTime ?? 0) > 0 ? 255 : a.invincible && Math.floor(a.invincible * 15) % 2 ? 150 : 255;
    const dead = a.animation === "Dead";
    const bodyX = a.x - cam + rifleRecoilOffset(a) * a.facing;
    const bodyNode = this.batch!.put(id, bodyX, a.y, data.sourceSize[0] * scale, data.sourceSize[1] * scale, 0,
      dead && a.kind !== "guard" ? Math.min(alpha, Math.max(0, (.85 - a.deadTime) * 900)) : alpha, a.facing);
    if(!a.kind){
      const baked = equipment.bakedWeapon || (equipment.bakedRifle ? "rifle" : "");
      this.playerStatus={body:bodyNode.getComponent(Sprite)?.spriteFrame?.name??"",weapon:baked?`baked.${baked}`:"",weaponVisible:!!baked};
    }
    // The cleaned source frame removes the original rifle pixels. One equipped
    // weapon is drawn between the body and the retained original hand pixels.
    if (equipment.weapon) {
      const weapon = a.weaponId ?? "rifle", pitch = a.aimPitch ?? 0;
      const view = weaponPresentation(weapon, -1);
      const tip = comicMuzzle(a, pitch, view.muzzleExtra);
      const knife = weapon === "knife";
      const gunNode = this.batch!.put(equipment.weapon, a.x - cam + (tip.x-(knife?35:0)) * a.facing, a.y + tip.y,
        view.width, undefined, (knife?.35:pitch) * a.facing * 180 / Math.PI, alpha, a.facing, knife?[0,.5]:[1, .6]);
      this.playerStatus.weapon=gunNode.getComponent(Sprite)?.spriteFrame?.name??"";this.playerStatus.weaponVisible=gunNode.active&&!!this.playerStatus.weapon;
      if (equipment.grip) this.batch!.put(equipment.grip, bodyX, a.y,
        data.sourceSize[0] * scale, data.sourceSize[1] * scale, 0, alpha, a.facing);
    }
  return true;
  }
}

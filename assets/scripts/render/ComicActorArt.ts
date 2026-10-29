import { ComicAssets, ComicBatch } from "./ComicAssets";
import { ComicFrames, ComicFrameId } from "./ComicFrames";
import { comicPose, comicMuzzle } from "./ComicPose";
import { Ink } from "./Ink";
import { RenderActor } from "./StickmanRenderer";
import { comicEquipment } from "./ComicEquipment";
import { weaponPresentation } from "../combat/WeaponPresentation";
import { Sprite } from "cc";
import { isDirectActor, directScale } from "./DirectPose";

/** Whole supplied action frames. No segmented legs, geometric limbs or rotated corpses. */
export class ComicActorArt {
  playerStatus = {body:"",weapon:"",weaponVisible:false};
  private batch?: ComicBatch;
  begin(ink: Ink): void {
    this.batch ??= new ComicBatch(ink.node, "Comic actors");
    this.batch.begin();
  }
  end(): void { this.batch?.end(); }
  draw(ink: Ink, a: RenderActor, cam: number): boolean {
    // The supplied sheets contain no walking giant. Keep that separate final encounter
    // explicitly outside this first-two-zone art pass, rather than disguising it as a tank.
    if (!ComicAssets.enabled || a.kind === "colossus") return false;
    if (!this.batch) this.begin(ink);
    const equipment = comicEquipment(a), id = equipment.body, data = ComicFrames[id];
    const scale = a.kind === "guard" ? 1.25 : a.kind ? .8 : isDirectActor(id) ? directScale(id) : .64;
    const alpha = a.invincible && Math.floor(a.invincible * 15) % 2 ? 130 : 255;
    const dead = a.animation === "Dead";
    const bodyNode = this.batch!.put(id, a.x - cam, a.y, data.sourceSize[0] * scale, data.sourceSize[1] * scale, 0,
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
      if (equipment.grip) this.batch!.put(equipment.grip, a.x - cam, a.y,
        data.sourceSize[0] * scale, data.sourceSize[1] * scale, 0, alpha, a.facing);
    }
  return true;
  }
}

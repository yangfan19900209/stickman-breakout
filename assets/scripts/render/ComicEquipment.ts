import { ComicFrames, ComicFrameId, ComicSockets } from "./ComicFrames";
import { ComicActorPose, comicPose } from "./ComicPose";
import { isDirectActor } from "./DirectPose";

/** Complete supplied soldiers own their weapon; never clear or cover their bodies. */
export function comicEquipment(a: ComicActorPose & { weaponId?: string; aimPitch?: number }) {
  const pose = comicPose(a), clean = `unarmed.${pose}` as ComicFrameId;
  if (isDirectActor(pose)) return {pose,body:pose,weapon:null,grip:null,bakedRifle:false,
    bakedWeapon:pose.startsWith("direct.knife.")?"knife":pose.startsWith("direct.shotgun.")?"shotgun":"rocket"};
  const suppressed = a.animation === "Dead" || (a.meleeTime ?? 0) > 0 || (a.throwTime ?? 0) > 0;
  const replacement = !a.kind && !suppressed &&
    ((a.weaponId ?? "rifle") !== "rifle" || (a.aimPitch ?? 0) > .01);
  // Some falling/hit poses have no original weapon; still carry the equipped gun.
  const body = replacement && clean in ComicFrames ? clean : pose;
  const grip = `grip.${pose}` as ComicFrameId;
  // Missing optional action variants fall back to a cached hold, never null.
  const fallback = a.crouched ? "unarmed.player.crouch.0" : "unarmed.player.stand-shoot.0";
  const hold = replacement && !(clean in ComicFrames) && pose !== "player.fall.1" && a.animation !== "Hit" ? fallback : body;
  return { pose, body: hold, weapon: replacement ? `weapon.${a.weaponId ?? "rifle"}` as ComicFrameId : null,
    grip: replacement && grip in ComicFrames ? grip : null,
    bakedWeapon:"",
    bakedRifle: !a.kind && body === pose && !suppressed && pose !== "player.fall.1" && (pose in ComicSockets || pose === "player.hit.0") };
}

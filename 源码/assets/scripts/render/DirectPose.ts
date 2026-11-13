import { DirectClips, DirectFrames, DirectSockets } from "./DirectFrames";
import { ShotgunClips, ShotgunFrames, ShotgunSockets, ShotgunScale } from "./ShotgunFrames";
import { RocketAimClips, RocketAimFrames, RocketAimBarrels, RocketAimScale } from "./RocketAimFrames";
import { RifleActionFrames, RifleActionSockets, RifleActionScale } from "./RifleActionFrames";
import { RocketWalkFrames, RocketWalkSockets, RocketWalkCycle } from "./RocketWalkFrames";
import { UnifiedActorSockets, UnifiedActorBarrels } from "./UnifiedActorFrames";
import { MotionFrames, MotionSockets, MotionBarrels } from "./MotionFrames";
import { FeedbackFrames } from "./FeedbackFrames";
import type { ComicActorPose } from "./ComicPose";

export type DirectFrameId = keyof typeof DirectFrames | keyof typeof ShotgunFrames | keyof typeof RocketAimFrames | keyof typeof RifleActionFrames | keyof typeof RocketWalkFrames | keyof typeof MotionFrames | keyof typeof FeedbackFrames;
export const DirectActorClips = { ...DirectClips, ...ShotgunClips, ...RocketAimClips } as const;
const actorSockets = { ...DirectSockets, ...ShotgunSockets, ...RifleActionSockets, ...RocketWalkSockets };
type Clip = keyof typeof DirectActorClips;
function frame(clip: Clip, phase: number, loop = true): DirectFrameId {
  const frames = DirectActorClips[clip];
  const index = loop ? ((Math.floor(phase) % frames.length) + frames.length) % frames.length
    : Math.min(frames.length - 1, Math.max(0, Math.floor(phase)));
  return frames[index];
}
export function isDirectActor(id: string): id is DirectFrameId { return id.startsWith("direct."); }
export function directScale(id: string): number { return id in RifleActionFrames ? RifleActionScale : id in RocketAimFrames ? RocketAimScale : id.startsWith("direct.shotgun.") ? ShotgunScale : .84; }

/** Complete painted soldiers: no gun-removal masks or extra hand/weapon layers. */
export function directPose(a: ComicActorPose): DirectFrameId | undefined {
  if (a.kind) return undefined;
  // Reactions own the whole body before aim/locomotion can select a gun pose.
  if (a.animation === "Hit") return "direct.player.hurt";
  const melee = (a.meleeTime ?? 0) > 0;
  if (!melee && !(a.throwTime ?? 0) && (a.aimPitch ?? 0) > .01 &&
      (a.animation === "Run" || a.animation === "Land" || a.animation === "Shoot" || a.animation === "Idle") &&
      !a.crouched && Math.abs(a.vx ?? 0)>5 && (a.weaponId === "rocket" || (a.weaponId ?? "rifle") === "rifle")) {
    const aim=a.aimPitch! > Math.PI/3 ? "up" : "diagonal";
    return `direct.${a.weaponId ?? "rifle"}.${aim}-walk.${Math.floor((a.stride ?? 0)*4)%4}` as DirectFrameId;
  }
  // Whole rifle poses replace erased-body + rotated-gun layers. Airborne hit
  // feedback uses the same intact equipped pose; throw/death retain their actions.
  if (!melee && (a.weaponId ?? "rifle") === "rifle" && a.animation !== "Dead" && !(a.throwTime ?? 0)) {
    const pitch = a.aimPitch ?? 0;
    const stance = a.animation === "Jump" ? "jump" : a.animation === "Fall" ? "fall" : a.crouched || a.animation === "Crouch" ? "crouch" : "stand";
    if (pitch > .01) return `direct.rifle.${pitch > Math.PI / 3 ? "up" : "diagonal"}-${stance}`;
    if (stance === "jump" || stance === "fall") return `direct.rifle.${stance}.${Math.floor(a.animationTime * 5) % 2 ? 1 : 0}`;
  }
  const family = melee || a.weaponId === "knife" ? "knife" : a.weaponId === "rocket" ? "rocket" : a.weaponId === "shotgun" ? "shotgun" : undefined;
  if (!family) return undefined;
  if (a.animation === "Dead") return frame(`${family}.death`, a.deadTime * 10, false);
  // Aimed poses own the complete soldier and tube, including during recoil or
  // hit feedback. The same pose supplies the muzzle and initial flight axis.
  if (family === "rocket" && (a.aimPitch ?? 0) > .01 && !(a.throwTime ?? 0)) {
    const crouch = a.crouched || a.animation === "Crouch";
    if (a.aimPitch! > Math.PI / 3)
      return frame(crouch ? "rocket.up-crouch" : a.animation === "Jump" ? "rocket.up-jump" : a.animation === "Fall" ? "rocket.up-fall" : "rocket.up-stand", 0);
    return frame(crouch ? "rocket.diagonal-crouch" : a.animation === "Jump" || a.animation === "Fall" ? "rocket.diagonal-air" : "rocket.diagonal-run", (a.stride ?? 0) * 2);
  }
  // Shared whole-character throwing frames are selected by ComicPose.
  if ((a.throwTime ?? 0) > 0) return undefined;
  const moving = Math.abs(a.vx ?? 0) > 5 || a.animation === "Run";
  const crouch = a.crouched || a.animation === "Crouch";
  if (melee) {
    const progress = Math.min(.999, Math.max(0, a.meleeProgress ?? 0));
    if (a.meleeStance === "jump") return frame("knife.air-attack", progress * 2, false);
    if (a.meleeStance === "crouch") return a.meleeActive || progress > .3 && progress < .75 ? "direct.knife.low-cut" : frame("knife.crouch",0);
    const clip = `knife.combo${Math.max(1,Math.min(3,a.meleeStage ?? 1))}` as Clip;
    return frame(clip, progress * DirectActorClips[clip].length, false);
  }
  if (a.animation === "Jump") return frame(`${family}.jump`, 1 + (a.animationTime * 5) % 2, false);
  if (a.animation === "Fall") return frame(`${family}.fall`, a.animationTime * 5);
  // Keep the gait phase during firing; the complete equipped pose also owns
  // its barrel socket. A fixed recoil frame must never freeze a moving leg.
  if (family === "rocket" && moving && !crouch)
    return `direct.rocket.stride.${Math.floor((a.stride ?? 0) * 4) % 4}` as DirectFrameId;
  // Crouch-running keeps its SIX real leg poses while muzzle FX carry the shot.
  if (family === "shotgun" && crouch && moving)
    return frame("shotgun.crouch-walk", (a.stride ?? 0) * ShotgunClips["shotgun.crouch-walk"].length);
  if (family === "shotgun" && a.recoil > .04) {
    if (moving) return frame("shotgun.run-shoot", (a.stride ?? 0) * ShotgunClips["shotgun.run-shoot"].length);
    return frame(crouch ? "shotgun.crouch-shoot" : "shotgun.stand-shoot", ((1.65 - a.recoil) / 8) * 22, false);
  }
  if (family === "rocket" && a.recoil > .04) {
    const action = crouch ? "crouch-fire" : moving ? "run-fire" : "stand-fire";
    // Recoil decays at 8/s. Use the actual shot age, never the idle animation
    // clock (which previously jumped directly to an unrelated firing pose).
    return frame(`rocket.${action}`, ((1.9-a.recoil)/8) * 16, false);
  }
  if (crouch && moving) return frame(`${family}.crouch-walk`, Math.floor((a.stride ?? 0) * 2) % 2);
  if (crouch) return frame(`${family}.crouch`, a.animationTime * 3);
  if (moving) return frame(`${family}.run`, Math.floor((a.stride ?? 0) * 4) % 4);
  return frame(`${family}.idle`, a.animationTime * 3);
}

export function directMuzzle(id: string): readonly [number,number] | undefined {
  if (MotionSockets[id]) return MotionSockets[id];
  if (UnifiedActorSockets[id]) return UnifiedActorSockets[id];
  if (id in RocketAimBarrels) {
    const barrel = RocketAimBarrels[id as keyof typeof RocketAimBarrels];
    return [barrel.x, barrel.y];
  }
  return actorSockets[id as keyof typeof actorSockets];
}

/** Measured muzzle and rear opening in foot-relative world coordinates. */
export function directBarrel(id: string) {
  if (MotionBarrels[id]) return MotionBarrels[id];
  if (UnifiedActorBarrels[id]) return UnifiedActorBarrels[id];
  if (id in RocketAimBarrels) return RocketAimBarrels[id as keyof typeof RocketAimBarrels];
  const tip = directMuzzle(id);
  if (!tip || !id.startsWith("direct.rocket.")) return undefined;
  const pitch = id === "direct.rocket.fall.0" ? .48 : id === "direct.rocket.fall.1" ? .37 : 0;
  return {x:tip[0],y:tip[1],pitch,backX:tip[0]-80*Math.cos(pitch),backY:tip[1]-80*Math.sin(pitch)};
}

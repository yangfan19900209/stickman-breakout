import { DirectClips, DirectFrames, DirectSockets } from "./DirectFrames";
import { ShotgunClips, ShotgunFrames, ShotgunSockets, ShotgunScale } from "./ShotgunFrames";
import type { ComicActorPose } from "./ComicPose";

export type DirectFrameId = keyof typeof DirectFrames | keyof typeof ShotgunFrames;
export const DirectActorClips = { ...DirectClips, ...ShotgunClips } as const;
const actorSockets = { ...DirectSockets, ...ShotgunSockets };
type Clip = keyof typeof DirectActorClips;
function frame(clip: Clip, phase: number, loop = true): DirectFrameId {
  const frames = DirectActorClips[clip];
  const index = loop ? ((Math.floor(phase) % frames.length) + frames.length) % frames.length
    : Math.min(frames.length - 1, Math.max(0, Math.floor(phase)));
  return frames[index];
}
export function isDirectActor(id: string): id is DirectFrameId { return id.startsWith("direct."); }
export function directScale(id: string): number { return id.startsWith("direct.shotgun.") ? ShotgunScale : .84; }

/** Complete painted soldiers: no gun-removal masks or extra hand/weapon layers. */
export function directPose(a: ComicActorPose): DirectFrameId | undefined {
  if (a.kind) return undefined;
  const melee = (a.meleeTime ?? 0) > 0;
  const family = melee || a.weaponId === "knife" ? "knife" : a.weaponId === "rocket" ? "rocket" : a.weaponId === "shotgun" ? "shotgun" : undefined;
  if (!family) return undefined;
  if (a.animation === "Dead") return frame(`${family}.death`, a.deadTime * 10, false);
  if (a.animation === "Hit") return frame(`${family}.hit`, (.22 - (a.hitTime ?? .22)) * 18, false);
  // Neither new sheet contains a grenade throw. The existing supplied unarmed
  // throwing action is selected by ComicPose, rather than inventing body parts.
  if ((a.throwTime ?? 0) > 0) return undefined;
  const moving = Math.abs(a.vx ?? 0) > 5 || a.animation === "Run";
  const crouch = a.crouched || a.animation === "Crouch";
  if (melee) {
    const progress = Math.min(.999, Math.max(0, a.meleeProgress ?? 0));
    if (a.meleeStance === "jump") return frame("knife.air-attack", progress * 2, false);
    // No crouched cutting row is supplied: keep the native low knife pose and
    // its intact arms/blade. Gameplay still uses the low sector and hit effects.
    if (a.meleeStance === "crouch") return frame("knife.crouch-walk", progress * 7, false);
    const clip = `knife.combo${Math.max(1,Math.min(3,a.meleeStage ?? 1))}` as Clip;
    return frame(clip, progress * DirectActorClips[clip].length, false);
  }
  if (a.animation === "Jump") return frame(`${family}.jump`, 1 + (a.animationTime * 5) % 2, false);
  if (a.animation === "Fall") return frame(`${family}.fall`, a.animationTime * 5);
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
  if (crouch && moving) return frame(`${family}.crouch-walk`, (a.stride ?? 0) * DirectActorClips[`${family}.crouch-walk`].length);
  if (crouch) return frame(`${family}.crouch`, a.animationTime * 3);
  if (moving) return frame(`${family}.run`, (a.stride ?? 0) * DirectActorClips[`${family}.run`].length);
  return frame(`${family}.idle`, a.animationTime * 3);
}

export function directMuzzle(id: string): readonly [number,number] | undefined {
  return isDirectActor(id) ? actorSockets[id] : undefined;
}

/** Axis of the PAINTED launcher, independent of the requested guided heading.
 * The supplied standing/running/crouching tubes are horizontal. Falling poses
 * paint a raised tube; angles are measured in source-image coordinates.
 */
export function directBarrel(id: string) {
  const tip = directMuzzle(id);
  if (!tip || !id.startsWith("direct.rocket.")) return undefined;
  const pitch = id === "direct.rocket.fall.0" ? .48 : id === "direct.rocket.fall.1" ? .37 : 0;
  return {x:tip[0],y:tip[1],pitch,backX:tip[0]-80*Math.cos(pitch),backY:tip[1]-80*Math.sin(pitch)};
}

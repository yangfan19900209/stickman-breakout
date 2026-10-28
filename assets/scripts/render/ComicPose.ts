import { ComicClips, ComicFrameId, ComicSockets } from "./ComicFrames";
import { SupplementSockets } from "./SupplementFrames";
import { meleePose } from "./MeleePose";
import { directPose, directMuzzle } from "./DirectPose";

/** Pure pose selection: no engine, DOM, random clock or per-frame allocations. */
export interface ComicActorPose {
  animation: string; animationTime: number; recoil: number; deadTime: number;
  kind?: string; vx?: number; stride?: number; throwTime?: number;
  crouched?: boolean; hitTime?: number; windup?: number; action?: string;
  meleeTime?: number;
  meleeStage?:number;meleeProgress?:number;meleeStance?:"stand"|"crouch"|"jump";
  health?: number; maxHealth?: number; shieldHealth?: number;
  weaponId?: string;
}
type Clip = keyof typeof ComicClips;
function frame(clip: Clip, phase: number, loop = true): ComicFrameId {
  const frames = ComicClips[clip];
  const index = loop ? ((Math.floor(phase) % frames.length) + frames.length) % frames.length : Math.min(frames.length - 1, Math.max(0, Math.floor(phase)));
  return frames[index];
}
export function comicPose(a: ComicActorPose): ComicFrameId {
  const direct = directPose(a);
  if (direct) return direct;
  const moving = Math.abs(a.vx ?? 0) > 5 || a.animation === "Run";
  const shoot = a.recoil > .04;
  if (a.kind === "guard") {
    if (a.animation === "Dead") return a.deadTime < .52 ? frame("tank.explode", a.deadTime * 8, false) : "tank.wreck";
    if (shoot) return "tank.fire";
    const hp = (a.health ?? 1) / (a.maxHealth ?? 1);
    return hp < .3 ? "tank.heavy" : hp < .65 ? "tank.damaged" : "tank.idle";
  }
  if (a.kind) {
    const family = a.kind === "melee" ? "knife" : a.kind === "shield" && (a.shieldHealth ?? 8) > 0 ? "shield" : a.kind === "turret" ? "rocket" : "rifle";
    if (a.animation === "Dead") return frame(`${family}.dead`, a.deadTime * 9, false);
    if (a.animation === "Hit") return frame(`${family}.hit`, (0.13 - (a.hitTime ?? .13)) * 24, false);
    if (family === "knife") return a.action === "swing" ? frame("knife.attack", (.35 - (a.windup ?? .35)) * 12, false) : frame("knife.walk", (a.stride ?? 0) * 4);
    if (family === "rocket") return shoot ? frame("rocket.fire", (1.5 - a.recoil) * 8, false) : (a.windup ?? 0) > 0 ? frame("rocket.aim", a.animationTime * 5) : frame("rocket.idle", a.animationTime * 3);
    if (family === "shield") return shoot ? frame("shield.shoot", a.animationTime * 12) : (a.windup ?? 0) > 0 || !moving ? frame("shield.brace", a.animationTime * 4) : frame("shield.walk", (a.stride ?? 0) * 4);
    return shoot ? frame("rifle.shoot", a.animationTime * 12) : moving ? frame("rifle.walk", (a.stride ?? 0) * 4) : frame("rifle.idle", a.animationTime * 3);
  }
  if (a.animation === "Dead") return frame("player.death", a.deadTime * 11, false);
  if (a.animation === "Hit") return frame("player.hit", (.22 - (a.hitTime ?? .22)) * 18, false);
  if ((a.meleeTime ?? 0) > 0) return meleePose(a).frame;
  if ((a.throwTime ?? 0) > 0) return frame("player.throw", (.24 - a.throwTime!) * 21, false);
  if (a.animation === "Jump") return frame("player.jump", 1 + (a.animationTime * 5) % 2, false);
  if (a.animation === "Fall") return frame("player.fall", a.animationTime * 5);
  const crouch = a.crouched || a.animation === "Crouch";
  // Crouched movement always advances the supplied SIX real leg poses, even firing.
  if (crouch && moving) return frame("player.crouch-walk", (a.stride ?? 0) * 6);
  if (crouch) return frame(shoot ? "player.crouch-shoot" : "player.crouch", a.animationTime * (shoot ? 12 : 3));
  if (moving) return frame(shoot ? "player.run-shoot" : "player.run", (a.stride ?? 0) * (shoot ? 7 : 9));
  return frame(shoot ? "player.stand-shoot" : "player.idle", a.animationTime * (shoot ? 12 : 3));
}
export function comicMuzzle(a: ComicActorPose, pitch: number, extra = 0): {x:number;y:number} {
  const id = comicPose(a), native = directMuzzle(id);
  // The complete rocket frame already includes the full launcher length. Its
  // painted muzzle is used as-is; extra attachment length must not be added.
  if (native) return {x:native[0],y:native[1]};
  const tip = ComicSockets[id] ?? [44, 43];
  const adjust = extra > 0 || pitch > .01 ? SupplementSockets[id] ?? [0, 0] : [0, 0];
  // Rotate about the supporting hand when aiming; horizontal rifle uses the exact cutout tip.
  return { x: tip[0] + adjust[0] - 25 + (25 + extra) * Math.cos(pitch), y: tip[1] + adjust[1] + (25 + extra) * Math.sin(pitch) };
}

import type { DestructibleObject, ObjectData, PickupKind } from "../world/DestructibleObject";
import { ComicFrames, ComicFrameId } from "./ComicFrames";

/** Preserve each source aspect ratio; the bottom floats just above its support. */
export function pickupPresentation(kind: PickupKind) {
  const id: ComicFrameId = kind === "health" ? "pickup.health" : kind === "grenades" ? "polish.grenades" : kind === "ammo" ? "polish.ammo" : `weapon.${kind}`;
  const width = kind === "health" ? 48 : kind === "grenades" || kind === "ammo" ? 46 : 76;
  const size = ComicFrames[id].size;
  return { id, width, height: width * size[1] / size[0] };
}

/** Visible art envelope; decorative protrusions are excluded from objectSolid. */
export function objectEnvelope(o: Pick<ObjectData, "kind" | "w" | "h">) {
  const id: ComicFrameId = o.kind === "wood" || o.kind === "hanging"
    ? "polish.crate" : o.kind === "barrel" ? "polish.barrel"
      : o.kind === "sandbag" ? "cover.sandbags" : "cover.concrete";
  const size = ComicFrames[id].size;
  const scale = Math.min((o.w + 5) / size[0], (o.h + 3) / size[1]);
  return { width: size[0] * scale, height: size[1] * scale };
}

/** Concrete rings occupy source y=0..15; its solid roof is y=16 and shoulders
 * are x=19..221. Feet rest on the roof, never on lifting rings or loose stones. */
export function objectSolid(o: Pick<ObjectData, "kind" | "w" | "h">) {
  const envelope = objectEnvelope(o);
  return o.kind === "concrete" || o.kind === "steel"
    ? {width:envelope.width * 202 / 240, height:envelope.height * 85 / 101}
    : envelope;
}

/** A live crate has ONE stable envelope. Damage changes cracks, never its scale.
 * The supplied broken crate includes debris outside the box and cannot be fit
 * against the whole image without shrinking the actual timber body.
 */
export function objectPresentation(o: DestructibleObject) {
  const damage = 1-o.health/o.maxHealth;
  let id: ComicFrameId;
  if(o.kind==='wood'||o.kind==='hanging') id=o.alive?'polish.crate':'crate.debris';
  else if(o.kind==='barrel')id=!o.alive?'barrel.broken':'polish.barrel';
  else if(o.kind==='sandbag')id=o.alive?'cover.sandbags':'cover.sandbags-broken';
  // A still-solid stone cover keeps its full silhouette until destruction.
  else id=o.alive?'cover.concrete':'cover.concrete-broken';
  const size=ComicFrames[id].size;
  const scale=Math.min((o.w+5)/size[0],(o.h+3)/size[1]);
  const envelope = o.alive ? objectEnvelope(o) : {width:size[0]*scale,height:size[1]*scale};
  // The dented barrel cut includes lateral shrapnel. Keep its original height
  // and aspect ratio instead of shrinking the body below its solid top.
  if (o.alive && o.kind === "barrel") envelope.width = envelope.height * size[0] / size[1];
  return {id,...envelope,cracks:o.alive&&(o.kind==='wood'||o.kind==='hanging')?damage:0};
}

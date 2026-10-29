import type { DestructibleObject } from "../world/DestructibleObject";
import { ComicFrames, ComicFrameId } from "./ComicFrames";

/** A live crate has ONE stable envelope. Damage changes cracks, never its scale.
 * The supplied broken crate includes debris outside the box and cannot be fit
 * against the whole image without shrinking the actual timber body.
 */
export function objectPresentation(o: DestructibleObject) {
  const damage = 1-o.health/o.maxHealth;
  let id: ComicFrameId;
  if(o.kind==='wood'||o.kind==='hanging') id=o.alive?'crate.intact':'crate.debris';
  else if(o.kind==='barrel')id=!o.alive?'barrel.broken':damage>.2?'barrel.dented':'barrel.intact';
  else if(o.kind==='sandbag')id=o.alive?'cover.sandbags':'cover.sandbags-broken';
  else id=damage>.3?'cover.concrete-broken':'cover.concrete';
  const size=ComicFrames[id].size;
  const scale=Math.min((o.w+5)/size[0],(o.h+3)/size[1]);
  return {id,width:size[0]*scale,height:size[1]*scale,cracks:o.alive&&(o.kind==='wood'||o.kind==='hanging')?damage:0};
}

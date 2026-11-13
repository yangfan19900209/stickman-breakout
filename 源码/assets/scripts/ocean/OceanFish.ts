import { Rect } from "../core/Types";

/** Shared body, warning and sweep footprint; tails/fins remain decorative. */
export const OCEAN_FISH = { scale: .24, centerY: 32, halfLength: 57, halfHeight: 24,
  speed: 625, range: 480, tell: .7 } as const;
export function oceanFishBounds(e: {x:number;y:number;angle:number;mode:string}): Rect {
  const angle=e.mode==="tell"||e.mode==="attack"?e.angle:0;
  const c=Math.abs(Math.cos(angle)),s=Math.abs(Math.sin(angle));
  const hw=OCEAN_FISH.halfLength*c+OCEAN_FISH.halfHeight*s;
  const hh=OCEAN_FISH.halfLength*s+OCEAN_FISH.halfHeight*c;
  return {x:e.x-hw,y:e.y+OCEAN_FISH.centerY-hh,w:hw*2,h:hh*2};
}

import { Rect } from "../core/Types";
/** Upright bell and tentacles share one collision envelope in every pose. */
export const OCEAN_JELLY = { scale: .22, centerY: 44, halfWidth: 36, height: 88,
  swimSpeed: 135, stingSpeed: 220, range: 185, tell: .85, recovery: 1.4 } as const;
export function oceanJellyBounds(e: {x:number;y:number}): Rect {
  return {x:e.x-OCEAN_JELLY.halfWidth,y:e.y,w:OCEAN_JELLY.halfWidth*2,h:OCEAN_JELLY.height};
}

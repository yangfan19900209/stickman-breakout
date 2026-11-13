import { Rect } from "../core/Types";

/** One continuous main road. Height changes belong to purposeful, optional
 * combat decks rather than decorative steps and shallow pits. */
export const LandLevelWidth = 14800;
export const road: Rect[] = [{
  x: 0, y: -240, w: LandLevelWidth, h: 390,
  slope: { left: 150, right: 150 },
}];
export function roadHeight(_x: number): number { return 150; }

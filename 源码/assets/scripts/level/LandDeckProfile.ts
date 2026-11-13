/** Shared painted slab geometry for fixed and moving floating platforms. */
export const LandDeckArt = { width: 512, height: 263, walk: 89, bottom: 148 };
export const landDeckThickness = (width: number): number =>
  Math.min(24, width * .24);
export const LandScaffoldTop = 260;
// Low optional decks keep standing headroom as well as a single-jump route.
export const landScaffoldThickness = (width: number): number => Math.min(24, landDeckThickness(width));


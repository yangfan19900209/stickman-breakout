import type { Rect } from "../core/Types";

/** Jump decks support actors/grenades, but neither team uses them as bullet cover. */
export function blocksShot(solid: Rect & { kind?: string; oneWay?: boolean }): boolean {
  return solid.kind !== "platform" && !solid.oneWay;
}

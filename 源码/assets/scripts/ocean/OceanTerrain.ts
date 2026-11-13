import type { OceanObstacle } from "./OceanLevel";
import { OceanStyleArt as OceanTerrainArt } from "./OceanStyleArt";
export function terrainArt(o: OceanObstacle) {
  return o.art.includes("deck")
    ? OceanTerrainArt.deck
    : o.art.includes("wall")
      ? OceanTerrainArt.bulkhead
      : o.art.includes("pipe")
        ? OceanTerrainArt.pump
        : o.art.includes("ceiling")
          ? OceanTerrainArt.ceiling
          : OceanTerrainArt.pillar;
}
export function terrainForms(forms: OceanObstacle[]): OceanObstacle[] {
  return forms.map((o) => {
    const art = terrainArt(o);
    if (o.art.includes("deck")) {
      const h = ((art.bottom - art.top) * o.w) / art.width;
      return { ...o, y: o.y + o.h - h, h };
    }
    const w = (o.h * art.width) / (art.bottom - art.top);
    return { ...o, x: o.x + (o.w - w) / 2, w };
  });
}
export function rockEdges(o: OceanObstacle, t: number) {
  const a = terrainArt(o),
    i = Math.min(
      a.profile.length - 1,
      Math.max(0, Math.round(t * (a.profile.length - 1))),
    );
  return {
    left: o.x + a.profile[i][0] * o.w,
    right: o.x + a.profile[i][1] * o.w,
  };
}
export function terrainColliders(forms: OceanObstacle[]): OceanObstacle[] {
  return forms.flatMap((o) => {
    if (o.art.includes("deck")) return [o];
    const a = terrainArt(o),
      count = a.profile.length - 1;
    return Array.from({ length: count }, (_, i) => {
      const l = Math.min(a.profile[i][0], a.profile[i + 1][0]),
        r = Math.max(a.profile[i][1], a.profile[i + 1][1]);
      return {
        ...o,
        x: o.x + l * o.w,
        y: o.y + (i * o.h) / count,
        w: (r - l) * o.w,
        h: o.h / count,
      };
    });
  });
}

import { ComicAssets, ComicBatch } from "./ComicAssets";
import { ComicFrameId, ComicFrames } from "./ComicFrames";
import { GameSession } from "../core/GameSession";
import { DestructibleObject } from "../world/DestructibleObject";
import { Ink } from "./Ink";
import { metalTiles } from "./TerrainTiles";

export class ComicObjectArt {
  private batch?: ComicBatch;
  begin(ink: Ink): void {
    this.batch ??= new ComicBatch(ink.node, "Comic objects");
    this.batch.begin();
  }
  end(): void {
    this.batch?.end();
  }
  draw(o: DestructibleObject, cam: number): boolean {
    if (!ComicAssets.enabled || o.kind === "rope") return false;
    let id: ComicFrameId;
    const damage = 1 - o.health / o.maxHealth;
    if (o.kind === "barrel")
      id = !o.alive
        ? "barrel.broken"
        : damage > 0.65
          ? "barrel.dented"
          : damage > 0.2
            ? "barrel.worn"
            : "barrel.intact";
    else if (o.kind === "sandbag")
      id = !o.alive ? "cover.sandbags-broken" : "cover.sandbags";
    else if (o.kind === "concrete" || o.kind === "steel")
      id = damage > 0.3 ? "cover.concrete-broken" : "cover.concrete";
    else
      id = !o.alive
        ? "crate.debris"
        : damage > 0.55
          ? "crate.broken"
          : damage > 0
            ? "crate.worn"
            : "crate.intact";
    const x = o.x - cam + o.w / 2;
    if (o.alive) {
      const size = ComicFrames[id].size;
      const scale = Math.min((o.w + 5) / size[0], (o.h + 3) / size[1]);
      this.batch!.put(
        id,
        x + (o.hitTime > 0 ? Math.sin(o.hitTime * 120) * 1.5 : 0),
        o.y,
        size[0] * scale,
        size[1] * scale,
        0,
        o.hitTime > 0.12 ? 180 : 255,
        1,
        [0.5, 0],
      );
    } else if (o.kind === "barrel") {
      // This supplied frame is a bursting barrel, not a flattened wreck.
      if (o.deadTime < 0.4) this.batch!.put(
        id, x, o.y - 2, o.w * (2.2 + o.deadTime), undefined,
        0, Math.round(255 * (1 - o.deadTime / 0.4)), 1, [0.5, 0],
      );
    } else if (o.deadTime < 2) {
      this.batch!.put(
        id,
        x,
        o.y - 2,
        o.w * 1.25,
        Math.min(o.h * 0.52, 25),
        0,
        Math.min(255, (2 - o.deadTime) * 255),
        1,
        [0.5, 0],
      );
    }
    return true;
  }
  mechanism(x: number, y: number, w: number, h: number): void {
    for (const t of metalTiles(x, y + h, w))
      this.batch!.tile(t.id, t.x, t.y, t.scale, t.crop);
  }
  pickup(s: GameSession, p: GameSession["pickups"]["items"][number]): void {
    const id: ComicFrameId =
      p.kind === "health"
        ? "pickup.health"
        : p.kind === "grenades"
          ? "pickup.grenades"
          : `weapon.${p.kind}`;
    this.batch!.put(
      id,
      p.x - s.camera.x,
      p.y + Math.sin(p.age * 5) * 3,
      33,
      undefined,
      0,
      255,
    );
  }
}

import { ComicAssets, ComicBatch } from "./ComicAssets";
import { ComicFrameId, ComicFrames } from "./ComicFrames";
import { GameSession } from "../core/GameSession";
import { DestructibleObject } from "../world/DestructibleObject";
import { Ink } from "./Ink";
import { metalTiles } from "./TerrainTiles";
import { objectPresentation } from "./ObjectPresentation";
import { Sprite, UITransform } from "cc";

export class ComicObjectArt {
  readonly rendered:{id:string;frame:string;width:number;height:number;alive:boolean;y:number}[]=[];
  private batch?: ComicBatch;
  begin(ink: Ink): void {
    this.rendered.length=0;
    this.batch ??= new ComicBatch(ink.node, "Comic objects");
    this.batch.begin();
  }
  end(): void {
    this.batch?.end();
  }
  draw(o: DestructibleObject, cam: number): boolean {
    if (!ComicAssets.enabled || o.kind === "rope") return false;
    const visual=objectPresentation(o),id=visual.id;
    const x = o.x - cam + o.w / 2;
    if (o.alive) {
      const n=this.batch!.put(
        id,
        x + (o.hitTime > 0 ? Math.sin(o.hitTime * 120) * 1.5 : 0),
        o.y,
        visual.width,
        visual.height,
        0,
        // Timber stays opaque so background outlines cannot ghost through it
        // and resemble a second nested crate during the hit flash.
        (o.kind==='wood'||o.kind==='hanging')?255:o.hitTime > 0.12 ? 180 : 255,
        1,
        [0.5, 0],
      );
      const t=n.getComponent(UITransform)!;
      this.rendered.push({id:o.id,frame:n.getComponent(Sprite)!.spriteFrame!.name,width:t.width,height:t.height,alive:true,y:n.position.y});
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

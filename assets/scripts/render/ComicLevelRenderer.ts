import { Node } from "cc";
import { LevelController } from "../level/LevelController";
import { ComicBatch } from "./ComicAssets";
import { Ink, node, colors } from "./Ink";
import { terrainTiles, metalTiles } from "./TerrainTiles";
import { terrainSurface } from "./TerrainSurface";

/** Independent parallax art, physical surface data stays in LevelController. */
export class ComicLevelRenderer {
  private chunks: { node: Node; x: number; factor: number }[] = [];
  private gate: Ink;
  private surfaceFill!: Node;
  visibleChunks = 0;
  constructor(
    parent: Node,
    private level: LevelController,
  ) {
    // Plan against full solids, independent of culling chunks. Chunk boundaries
    // must not introduce a fresh cap or squeeze the remaining source pixels.
    const roads = terrainSurface(level.staticSolids);
    const base = Math.min(...roads.map(s=>s.top)) - 72;
    const tiles = roads.flatMap((s,i)=>terrainTiles(s.x,s.top,s.w,s.top-base,{
      left:i>0&&roads[i-1].x+roads[i-1].w===s.x?roads[i-1].top:undefined,
      right:roads[i+1]?.x===s.x+s.w?roads[i+1].top:undefined,
    }));
    for(const s of level.staticSolids)if(s.kind==="platform")tiles.push(...metalTiles(s.x,s.y+s.h,s.w));
    for (const factor of [0.12, 0.38, 0.72, 1]) {
      if (factor === 1) {
        // All opaque fill sits behind ALL foreground chunks. A tile crossing
        // x=800 must not be erased by the following chunk's white polygon.
        this.surfaceFill = node(parent, "Continuous ground fill");
        const fill = new Ink(this.surfaceFill), top: {x:number;y:number}[] = [];
        for (const s of roads)
          top.push({x:s.x,y:s.top-16},{x:s.x+s.w,y:s.top-16});
        fill.polygon([{x:0,y:-100},...top,{x:level.data.width,y:-100}],colors.paper);
      }
      for (let x = -800; x < level.data.width + 1600; x += 800) {
        const root = node(parent, `Comic scenery ${factor}/${x}`, x, 0),
          batch = new ComicBatch(root, "Scenery");
        this.chunks.push({ node: root, x, factor });
        const index = Math.floor(x / 800) + 3;
        if (factor === 0.12) {
          batch.put("background.mountains", 400, 200, 1000, undefined, 0, 45, 1, [0.5, 0]);
          for (let n = 0; n < 3; n++)
            batch.put(
              n % 2 ? "background.cloud-small" : "background.cloud",
              40 + n * 290,
              355 + (n % 2) * 50,
              240,
              undefined,
              0,
              65,
            );
        } else if (factor === 0.38) {
          batch.put(
            index % 3 === 0
              ? "building.base"
              : index % 3 === 1
                ? "building.barracks"
                : "building.bunker",
            150,
            150,
            350,
            undefined,
            0,
            65,
            1,
            [0.5, 0],
          );
          batch.put("prop.tower", 660, 150, 110, undefined, 0, 65, 1, [0.5, 0]);
        } else if (factor === 0.72) {
          batch.put(
            index % 2 ? "prop.tent" : "building.barracks",
            390,
            140,
            200,
            undefined,
            0,
            65,
            1,
            [0.5, 0],
          );
          batch.put("prop.tower", 730, 145, 115, undefined, 0, 55, 1, [0.5, 0]);
        } else {
          for (const tile of tiles) if (tile.x >= x && tile.x < x + 800)
            batch.tile(tile.id, tile.x - x, tile.y, tile.scale, tile.crop);
          for (let n = 0; n < 3; n++) {
            const px = 90 + n * 275,
              wx = x + px;
            batch.put(
              n % 2 ? "prop.scrub" : "prop.rock",
              px,
              level.groundY(wx) - 1,
              28 + (n % 2) * 12,
              undefined,
              0,
              215,
              1,
              [0.5, 0],
            );
          }
          if (index % 3 === 0)
            batch.put(
              "prop.warning",
              500,
              level.groundY(x + 500),
              42,
              undefined,
              0,
              230,
              1,
              [0.5, 0],
            );
        }
        batch.end();
      }
    }
    this.gate = new Ink(node(parent, "Exit portal"));
  }
  update(cam: number, unlocked: boolean, width = 1280): void {
    this.surfaceFill.setPosition(-cam, 0);
    this.visibleChunks = 0;
    for (const c of this.chunks) {
      const x = c.x - cam * c.factor;
      c.node.setPosition(x, 0);
      c.node.active = x < width + 250 && x + 1050 > -100;
      if (c.node.active) this.visibleChunks++;
    }
    const exit = this.level.data.exit.x - cam;
    this.gate.clear();
    if (exit > width + 100 || exit < -100) return;
    this.gate.line(
      [
        { x: exit - 70, y: 150 },
        { x: exit - 70, y: 295 },
        { x: exit + 70, y: 295 },
        { x: exit + 70, y: 150 },
      ],
      4,
    );
    if (!unlocked)
      for (let px = exit - 50; px < exit + 60; px += 20)
        this.gate.segment(px, 153, px, 288, 2, colors.muted);
    else
      this.gate.line(
        [
          { x: exit - 36, y: 210 },
          { x: exit - 12, y: 190 },
          { x: exit + 38, y: 240 },
        ],
        5,
      );
  }
}

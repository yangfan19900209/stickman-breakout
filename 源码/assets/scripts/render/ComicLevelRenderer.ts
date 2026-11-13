import { Node } from "cc";
import { LevelController } from "../level/LevelController";
import { ComicBatch } from "./ComicAssets";
import { Ink, node, colors } from "./Ink";
import { landOutline } from "./LandContourPlan";
import { TerrainStyle } from "./TerrainInk";
import { drawnGroundTiles, drawnPlatformTiles, groundDecorClear } from "./LandDrawnPlan";
import { landExposedEdges } from "./LandTerrainPlan";
import { terrainSurface } from "./TerrainSurface";

/** Independent parallax art, physical surface data stays in LevelController. */
export class ComicLevelRenderer {
  private chunks: { node: Node; x: number; factor: number }[] = [];
  private surfaceFill!: Node;
  private edgeArt!: Node;
  visibleChunks = 0;
  constructor(
    parent: Node,
    private level: LevelController,
  ) {
    // Plan against full solids, independent of culling chunks. Chunk boundaries
    // must not introduce a fresh cap or squeeze the remaining source pixels.
    const roads = terrainSurface(level.staticSolids);
    // Camera overscan at either end must show continuous scenery too. These
    // are render-only extensions; level bounds still constrain the player.
    const first = roads[0], last = roads[roads.length - 1];
    roads.unshift({ x: first.x - 800, w: 800, top: first.top });
    roads.push({ x: last.x + last.w, w: 800, top: last.top });
    const blockedDecor=level.objects.objects.filter(o=>o.solid).map(o=>o.bounds);
    const tiles=drawnGroundTiles(roads,-260,blockedDecor);
    for(const p of level.staticSolids)if(p.kind==='platform')tiles.push(...drawnPlatformTiles(p.x,p.y+p.h,p.w,level.groundY(p.x)));
    for (const factor of [0.12, 0.38, 1]) {
      if (factor === 1) {
        // All opaque fill sits behind ALL foreground chunks. A tile crossing
        // x=800 must not be erased by the following chunk's white polygon.
        this.surfaceFill = node(parent, "Continuous ground fill");
        const fill = new Ink(this.surfaceFill), top=landOutline(roads);
        fill.polygon([{x:roads[0].x,y:-300},...top,{x:last.x+last.w+800,y:-300}],TerrainStyle.stone);

      }
      for (let x = -800; x < level.data.width + 1600; x += 800) {
        const root = node(parent, `Comic scenery ${factor}/${x}`, x, 0),
          batch = new ComicBatch(root, "Scenery");
        this.chunks.push({ node: root, x, factor });
        const index = Math.floor(x / 800) + 3;
        if (factor === 0.12) {
          batch.put(
            "background.mountains",
            400,
            200,
            1000,
            undefined,
            0,
            45,
            1,
            [0.5, 0],
          );
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
              ? "polish.factory"
              : index % 3 === 1
                ? "polish.bunker"
                : "polish.tent",
            150,
            150,
            index % 3 === 0 ? 410 : 300,
            undefined,
            0,
            60,
            1,
            [0.5, 0],
          );
          batch.put("polish.tower", 660, 150, 130, undefined, 0, 60, 1, [0.5, 0]);
        } else {
          for(const tile of tiles)if(tile.x>=x&&tile.x<x+800)
            batch.tile(tile,x);
          for(let n=0;n<3;n++){
            const wx=x+90+n*271;
            const span=roads.find(r=>wx>r.x+28&&wx<r.x+r.w-28);
            if(span&&groundDecorClear(wx-18,36,blockedDecor))batch.put(n%2?'prop.scrub':'prop.rock',wx-x,span.top-1,n%2?34:27,undefined,0,255,1,[.5,0]);
          }
          for(const span of roads)if(span.w<240&&span.w>65&&span.x>=x&&span.x<x+800)
            batch.put('prop.scrub',span.x+span.w*.54-x,span.top-1,34,undefined,0,255,1,[.5,0]);
        }
        batch.end();
      }
    }
    this.edgeArt=node(parent,"One continuous terrain outline");
    const edges=new Ink(this.edgeArt);
    for(const span of roads){
      const line=[{x:span.x,y:span.top}];
      for(let wx=span.x+6;wx<span.x+span.w;wx+=6)line.push({x:wx,y:span.top+Math.sin(wx*.19)*.65});
      line.push({x:span.x+span.w,y:span.top});
      edges.line(line,2.3);
    }
    for(const e of landExposedEdges(roads)){
      const points=[{x:e.x,y:e.top+2}];
      for(let y=e.top-9;y>e.bottom+5;y-=11)points.push({x:e.x+e.inward*(1+Math.sin(y*.18)),y});
      points.push({x:e.x,y:e.bottom});
      edges.line(points,2.5);
      for(let y=e.top-24;y>e.bottom+20;y-=59)
        edges.line([{x:e.x+e.inward*2,y},{x:e.x+e.inward*10,y:y-4},{x:e.x+e.inward*15,y:y-13}],1.4,colors.muted);
    }
  }
  update(cam: number, width = 1280): void {
    this.surfaceFill.setPosition(-cam, 0);
    this.edgeArt.setPosition(-cam,0);
    this.visibleChunks = 0;
    for (const c of this.chunks) {
      const x = c.x - cam * c.factor;
      c.node.setPosition(x, 0);
      c.node.active = x < width + 250 && x + 1050 > -100;
      if (c.node.active) this.visibleChunks++;
    }
  }
}

import { Color, Node } from "cc";
import { Ink, colors, node } from "../render/Ink";
import { ComicBatch } from "../render/ComicAssets";
import { grass, soil, TerrainStyle } from "../render/TerrainInk";
import { OceanBatch } from "./OceanAssets";
import { OceanLevel as L, OceanObstacle } from "./OceanLevel";
import { terrainArt } from "./OceanTerrain";
import { OceanSession } from "./OceanSession";
import { seaSurfacePoints, seaSurfaceY } from "./OceanSurface";

const rock = new Color(231, 232, 225),
  shade = new Color(199, 204, 196);
const distant = new Color(161, 177, 174, 100),
  bubble = new Color(105, 135, 136, 180);
const metal = new Color(217, 224, 219),
  seam = new Color(87, 101, 98);
const wrap = (n: number, span: number) => ((n % span) + span) % span;

/** Scenery owns no collision state. Every solid surface is drawn from the level's rectangles. */
export class OceanScenery {
  private background: OceanBatch;
  private life: Ink;
  private fish: OceanBatch;
  private terrain: Ink;
  private plants: OceanBatch;
  private tiles: OceanBatch;
  private bedFill: Ink;
  private coastArt: ComicBatch;
  status = {
    fishSchools: 0,
    bubbles: 0,
    time: 0,
    terrain: "unified-ink-v075",
    palette: "blue-gray",
  };
  constructor(parent: Node) {
    this.background = new OceanBatch(node(parent, "Sea panorama"));
    this.life = new Ink(node(parent, "Distant reefs and rising bubbles"));
    this.fish = new OceanBatch(node(parent, "Swimming background schools"));
    this.terrain = new Ink(node(parent, "Rock and wreck silhouettes"));
    this.tiles = new OceanBatch(
      node(parent, "Illustrated reef and wreck assets"),
    );
    this.bedFill = new Ink(node(parent, "Continuous seabed interior"));
    this.coastArt = new ComicBatch(
      node(parent, "Illustrated coastal cliff"),
      "Coast",
    );
    this.plants = new OceanBatch(node(parent, "Rooted sea plants"));
  }
  draw(s: OceanSession, w: number, h: number) {
    const { x: cx, y: cy } = s.camera,
      shore = s.stage !== "swimming";
    this.background.begin();
    this.fish.begin();
    this.plants.begin();
    this.tiles.begin();
    this.coastArt.begin();
    this.life.clear();
    this.terrain.clear();
    this.bedFill.clear();
    this.status.fishSchools = this.status.bubbles = 0;
    this.status.time = s.time + s.victory.time;
    // Overscan preserves the painted panorama's aspect while a slow pan reveals depth.
    const bw = Math.max(w * 1.22, h * 1.8),
      bh = Math.max(h * 1.18, bw / 1.8);
    this.background.put(
      shore ? "background.coast" : "background.undersea",
      w / 2 + Math.sin(cx / 3400) * w * 0.08,
      h / 2 - cy * 0.045,
      bw,
      bh,
    );
    this.ambient(s, w, h, shore);
    if (shore) this.coast(cx, cy, w, s.time);
    else {
      this.seabed(cx, cy, w);
      for (const o of L.landforms) {
        if (o.x + o.w < cx - 50 || o.x > cx + w + 50) continue;
        const art = terrainArt(o),
          scale = o.w / art.width;
        this.tiles.put(
          art.frame,
          o.x - cx,
          o.y + o.h - cy,
          o.w,
          art.height * scale,
          0,
          1,
          255,
          [0, 1 - art.top / art.height],
        );
      }
      for (let i = Math.floor((cx - 150) / 185); i * 185 < cx + w + 180; i++) {
        const x = i * 185 + 32 * Math.sin(i * 7),
          root = L.floor - 3;
        if (
          L.landforms.some(
            (o) => o.y === L.floor && x > o.x - 30 && x < o.x + o.w + 30,
          )
        )
          continue;
        this.plants.put(
          `kelp.ambient.${Math.abs(i) % 2}`,
          x - cx,
          root - cy,
          34 + wrap(i * 17, 33),
          undefined,
          Math.sin(s.time * 1.4 + i) * 6,
          i % 2 ? -1 : 1,
          185,
          [0.5, 0],
        );
      }
    }
    this.background.end();
    this.fish.end();
    this.plants.end();
    this.tiles.end();
    this.coastArt.end();
  }
  private ambient(s: OceanSession, w: number, h: number, shore: boolean) {
    const { x: cx, y: cy } = s.camera,
      time = s.time + s.victory.time,
      ink = this.life;
    if (shore) {
      const water = TerrainStyle.water;
      const surface=seaSurfacePoints(cx,cy,w,time,L.surface);
      ink.polygon([{x:surface[0].x,y:-60},...surface,{x:surface[surface.length-1].x,y:-60}],water);
      ink.line(surface,1.4,new Color(110,139,135,145));
      ink.line(surface.map(p=>({x:p.x,y:p.y-3})),1.8,new Color(255,255,250,200));
      for(let row=1;row<5;row++){
        for(let wx=Math.floor((cx-60)/135)*135+row*31;wx<cx+w+60;wx+=135){
          const wave=[];
          for(let dx=0;dx<=47;dx+=5)wave.push({x:wx+dx-cx,y:seaSurfaceY(wx+dx,time+row*.4,L.surface)-cy-row*22});
          ink.line(wave,1,new Color(130,154,149,80));
        }
      }
    }
    // Schools traverse the entire world; their wrap point is off either end of the level.
    for (let school = 0; school < 36; school++) {
      const direction = school % 2 ? -1 : 1;
      const fx =
        wrap(
          school * 410 + time * direction * (23 + (school % 4) * 4),
          L.width + 2000,
        ) -
        1000 -
        cx * 0.72;
      const fy = shore ? L.surface - cy - 95 : h * (0.25 + (school % 4) * 0.17);
      if (fx > -130 && fx < w + 130 && (!shore || fx > 500 - cx)) {
        this.fish.put(
          `fish.ambient.${school % 2}`,
          fx,
          fy + Math.sin(time * 1.2 + school) * 16,
          48 + (school % 3) * 9,
          undefined,
          Math.sin(time * 2 + school) * 3,
          direction,
          90 + (school % 2) * 20,
        );
        this.status.fishSchools++;
      }
    }
    for (
      let cell = Math.floor(cx / 260) - 1;
      cell * 260 < cx + w + 260;
      cell++
    ) {
      const base = cell * 260 + wrap(cell * 37, 100),
        span = L.surface - L.floor - 20;
      for (let j = 0; j < 7; j++) {
        const rise = wrap(
          time * (25 + wrap(cell * 3 + j, 13)) + j * 83 + cell * 53,
          span,
        );
        const x = base - cx + Math.sin(rise * 0.025 + cell) * 12 + (j % 2) * 12;
        const y = L.floor + rise - cy;
        if (
          x < -15 ||
          x > w + 15 ||
          y < -15 ||
          y > h + 15 ||
          (shore && base < 485)
        )
          continue;
        const r = 2.4 + wrap(cell + j * 3, 5) * 0.62;
        ink.ellipse(x, y, r, r * 1.18, bubble, undefined, 1.15);
        ink.segment(
          x - r * 0.3,
          y + r * 0.5,
          x,
          y + r * 0.7,
          0.9,
          colors.white,
        );
        this.status.bubbles++;
      }
    }
    // Suspended silt catches the light, with much lower contrast than enemy projectiles.
    if (!shore)
      for (let i = 0; i < 18; i++) {
        const x = wrap(i * 127 + time * 7 - cx * 0.65, w + 40) - 20;
        const y = wrap(i * 79 + time * 5 - cy * 0.3, h + 30) - 15;
        ink.segment(x, y, x + 2, y + 1, 1, distant);
      }
  }
  private coast(cx: number, cy: number, w: number, time: number) {
    // The same stroke and material vocabulary as chapter one. The silhouette
    // continues below the viewport, so it cannot expose a rectangular image edge.
    const ink=this.terrain;
    const edge=[{x:-800,y:720},{x:445,y:720},{x:470,y:703},{x:460,y:658},{x:440,y:628},{x:450,y:592},{x:414,y:550},{x:398,y:490},{x:364,y:440},{x:345,y:366},{x:309,y:310},{x:278,y:230},{x:238,y:140},{x:194,y:-300}];
    const convert=(p:{x:number;y:number})=>({x:p.x-cx,y:p.y-cy});
    ink.polygon([...edge,{x:-800,y:-300}].map(convert),TerrainStyle.stone);
    ink.line(edge.map(convert),TerrainStyle.outline);
    soil(ink,-800-cx,720-cy,1240);
    for(const [x,y] of [[-160,620],[80,670],[240,690],[330,575],[100,420],[240,360]]){
      const facet=[{x,y},{x:x+30,y:y-40},{x:x+11,y:y-100},{x:x-44,y:y-148},{x:x-33,y:y-70}];
      ink.polygon(facet.map(convert),TerrainStyle.shade);
      ink.line(facet.slice(0,4).map(convert),TerrainStyle.detail,colors.muted);
      ink.line([{x:x+30,y:y-40},{x:x+55,y:y-45},{x:x+62,y:y-76}].map(convert),TerrainStyle.detail,colors.muted);
    }
    for(let x=-120;x<400;x+=96)grass(ink,x-cx,720-cy,.7+(x%3)*.06);
  }

  private seabed(cx: number, cy: number, w: number) {
    const scale = 0.5,
      tileWidth = 660 * scale,
      step = tileWidth - 4;
    this.terrain.rect(
      -20,
      -160 - cy,
      w + 40,
      L.floor + 160,
      colors.paper,
      colors.paper,
      0,
    );
    for (
      let i = Math.floor((cx - 20) / step);
      i * step < cx + w + tileWidth;
      i++
    ) {
      this.tiles.put(
        "reef.seabed",
        i * step - cx,
        L.floor - cy,
        tileWidth,
        253 * scale,
        0,
        1,
        255,
        [0, 1 - 116 / 253],
      );
    }
    // Only rooted fronds from each illustrated module remain above this common
    // ground body. Its side/end borders must not repeat as sea-floor columns.
    const surface=[];
    for(let wx=Math.floor((cx-40)/12)*12;wx<cx+w+52;wx+=12)
      surface.push({x:wx-cx,y:L.floor-cy+1.2*Math.sin(wx*.024)});
    this.bedFill.polygon([{x:surface[0].x,y:-180-cy},...surface,{x:surface[surface.length-1].x,y:-180-cy}],TerrainStyle.stone);
    this.bedFill.line(surface,TerrainStyle.outline);
    this.bedFill.line(surface.map(p=>({x:p.x,y:p.y-13})),TerrainStyle.detail,colors.muted);
    for(let wx=Math.floor((cx-40)/120)*120;wx<cx+w+80;wx+=120){
      const y=L.floor-cy-38-13*Math.sin(wx*.019),x=wx-cx;
      const rock=[{x:x-15,y},{x:x-8,y:y+9},{x:x+13,y:y+7},{x:x+21,y:y-3},{x:x+3,y:y-8}];
      this.bedFill.polygon(rock,colors.paper);this.bedFill.line([...rock,rock[0]],1.5,colors.muted);
    }
  }
}

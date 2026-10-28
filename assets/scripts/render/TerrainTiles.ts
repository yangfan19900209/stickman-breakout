import { ComicFrames, ComicFrameId } from "./ComicFrames";

export interface TerrainTile {
  id: ComicFrameId; x: number; y: number; scale: number;
  crop: readonly [number, number, number, number];
}
/** Repeat source pixels; the final piece is clipped, never stretched to fill. */
function strip(out: TerrainTile[], id: ComicFrameId, x: number, y: number, width: number, height: number, scale: number): void {
  const size = ComicFrames[id].size, tw = size[0] * scale, th = size[1] * scale;
  if (id === "native.soil") {
    // One texture phase across every solid/column/chunk. Splitting a circle at
    // an arbitrary boundary continues its other half on the adjacent piece.
    for (let py=0;py<height-.001;) {
      const ry=((y+py)%th+th)%th, sy=ry>th-.000001?0:ry, h=Math.min(th-sy,height-py);
      for(let px=0;px<width-.001;) {
        const rx=((x+px)%tw+tw)%tw,sx=rx>tw-.000001?0:rx,w=Math.min(tw-sx,width-px);
        out.push({id,x:x+px,y:y+py,scale,crop:[sx/scale,size[1]-(sy+h)/scale,w/scale,h/scale]});
        px+=w;
      }
      py+=h;
    }
    return;
  }
  for (let py = 0; py < height - .001; py += th)
    for (let px = 0; px < width - .001; px += tw) {
      const w = Math.min(tw, width - px), h = Math.min(th, height - py);
      out.push({ id, x: x + px, y: y + py, scale,
        crop: [0, size[1] - h / scale, w / scale, h / scale] });
    }
}
export function terrainTiles(x: number, top: number, width: number, depth = 72, neighbours?: {left?:number;right?:number}): TerrainTile[] {
  const out: TerrainTile[] = [], s = .6;
  const left = ComicFrames["native.top.left"].size[0] * s,
    right = ComicFrames["native.top.right"].size[0] * s;
  // Shared SOURCE walk line y=148, top/soil join=177, bottom strip=205..238.
  const upperBottom = top - 29 * s, bottom = top - depth, bottomH = 33 * s;
  const columns = [
    { col: "left", x, w: Math.min(left, width) },
    { col: "middle", x: x + left, w: Math.max(0, width - left - right) },
    { col: "right", x: x + Math.max(left, width - right), w: Math.max(0, Math.min(right, width - left)) },
  ];
  for (const c of columns) {
    const neighbour = c.col === "left" ? neighbours?.left : c.col === "right" ? neighbours?.right : undefined;
    const inner = neighbour !== undefined && neighbour >= top;
    const topId = `native.top.${inner ? "middle" : c.col}` as ComicFrameId;
    strip(out, topId, c.x, upperBottom, c.w, ComicFrames[topId].size[1] * s, s);
    const join = Math.max(bottom + bottomH, Math.min(upperBottom, neighbour ?? bottom));
    strip(out, "native.soil", c.x, bottom + bottomH, c.w, join - bottom - bottomH, s);
    strip(out, c.col === "middle" ? "native.soil" : `native.fill.${c.col}` as ComicFrameId, c.x, join, c.w, Math.max(0, upperBottom - join), s);
  }
  // Bottom caps come from complete quiet corners, not cropped halves of stones.
  const bl=neighbours?.left===undefined?Math.min(width,ComicFrames["native.bottom.left"].size[0]*s):0;
  const br=neighbours?.right===undefined?Math.min(width-bl,ComicFrames["native.bottom.right"].size[0]*s):0;
  if(bl>0)strip(out,"native.bottom.left",x,bottom,bl,bottomH,s);
  strip(out,"native.bottom.middle",x+bl,bottom,width-bl-br,bottomH,s);
  if(br>0)strip(out,"native.bottom.right",x+width-br,bottom,br,bottomH,s);
  return out;
}
export function metalTiles(x: number, top: number, width: number): TerrainTile[] {
  const out: TerrainTile[] = [], s = .5,
    left = Math.min(width, ComicFrames["native.metal.left"].size[0] * s),
    right = Math.min(Math.max(0, width - left), ComicFrames["native.metal.right"].size[0] * s),
    y = top - (134 - 69) * s;
  // Brackets keep their own native width, independent of beam length.
  const count = Math.max(1, Math.ceil(width / 150));
  for (let i=0;i<count;i++) strip(out,"native.metal.bracket",x+(i+.5)*width/count-26.5,top-(174-69)*s,53,46*s,s);
  strip(out, "native.metal.left", x, y, left, 70 * s, s);
  strip(out, "native.metal.middle", x + left, y, width - left - right, 70 * s, s);
  strip(out, "native.metal.right", x + width - right, y, right, 70 * s, s);
  return out;
}

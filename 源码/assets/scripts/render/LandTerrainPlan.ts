import { ComicFrameId } from "./ComicFrames";
import { TerrainTile } from "./TerrainTiles";
import { TerrainSpan } from "./TerrainSurface";

export const landConcrete = (x: number) => (x >= 3950 && x < 6800) || x >= 8500;
/** Interior material has no surface, beam or vegetation: only the cap is structural. */
export function landGroundTiles(spans: readonly TerrainSpan[], base = -260): TerrainTile[] {
  const out: TerrainTile[] = [], scale = .6;
  for (const s of spans) {
    const concrete=landConcrete(s.x), id:ComicFrameId=concrete?'land.concrete':'land.grass';
    const sourceWidth=concrete?575:574, walk=concrete?136:68,
      capStart=concrete?126:0, capEnd=concrete?170:104,
      capBottom=s.top-(capEnd-walk)*scale;
    const fillId:ComicFrameId=concrete?'land.fill.concrete':'land.fill.soil', tw=768*scale, th=1024*scale;
    for(let y=base;y<capBottom-.001;){
      const row=Math.floor((y-base+1e-7)/th), py=Math.max(0,y-base-row*th),
        h=Math.min(th-py,capBottom-y), mirrorY=Math.abs(row%2)===1;
      for(let x=s.x;x<s.x+s.w-.001;){
        const col=Math.floor((x+1e-7)/tw), px=Math.max(0,x-col*tw),
          w=Math.min(tw-px,s.x+s.w-x), mirrorX=Math.abs(col%2)===1;
        out.push({id:fillId,x,y,scale,mirrorX,mirrorY,crop:[
          mirrorX?768-(px+w)/scale:px/scale,
          mirrorY?py/scale:1024-(py+h)/scale,w/scale,h/scale]});
        x+=w;
      }
      y+=h;
    }
    for(let x=s.x;x<s.x+s.w-.001;){
      const phase=(((x/scale)%sourceWidth)+sourceWidth)%sourceWidth,
        w=Math.min((sourceWidth-phase)*scale,s.x+s.w-x);
      out.push({id,x,y:capBottom,scale,crop:[12+phase,capStart,w/scale,capEnd-capStart]});
      x+=w;
    }
  }
  return out;
}
export interface LandEdge { x:number; top:number; bottom:number; inward:1|-1; concrete:boolean; }
/** Only exposed vertical edges are outlined, once, after every neighbouring fill. */
export function landExposedEdges(spans:readonly TerrainSpan[], base=-260):LandEdge[]{
  const out:LandEdge[]=[];
  for(let i=0;i<spans.length;i++){
    const s=spans[i];
    for(const [x,neighbour,inward] of [[s.x,spans[i-1],1],[s.x+s.w,spans[i+1],-1]] as const){
      const touches=neighbour&&(inward===1?Math.abs(neighbour.x+neighbour.w-x)<.01:Math.abs(neighbour.x-x)<.01);
      const bottom=touches?neighbour.top:base;
      if(s.top>bottom+.01)out.push({x,top:s.top,bottom,inward,concrete:landConcrete(s.x)});
    }
  }
  return out;
}
/** Endcaps and repeated core use one native scale; dangling ribs are non-solid decoration. */
export function landPlatformTiles(
  x: number,
  top: number,
  width: number,
  height = 14,
): TerrainTile[] {
  const out: TerrainTile[] = [],
    scale = height / 46,
    cap = 55 * scale,
    y = top - (217 - 78) * scale;
  const put = (px: number, sx: number, w: number) =>
    out.push({
      id: "land.steel",
      x: px,
      y,
      scale,
      crop: [sx, 0, w / scale, 217],
    });
  const left = Math.min(cap, width / 2),
    right = Math.min(cap, width - left);
  put(x, 0, left);
  for (let px = x + left; px < x + width - right - 0.001; ) {
    const w = Math.min(511 * scale, x + width - right - px);
    put(px, 55, w);
    px += w;
  }
  put(x + width - right, 621 - right / scale, right);
  return out;
}

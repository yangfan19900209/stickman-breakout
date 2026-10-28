import { Rect, surfaceY } from "../core/Types";

export interface TerrainSpan { x:number; w:number; top:number; }
/** Render the union of attached ground and steps. Collision solids stay intact.
 * This removes buried grass/bottom borders where rectangular solids overlap.
 */
export function terrainSurface(solids: readonly (Rect & {kind?:string})[]): TerrainSpan[] {
  const solid = solids.filter(s=>s.kind==="ground" || s.kind==="step");
  const edges = [...new Set(solid.flatMap(s=>[s.x,s.x+s.w]))].sort((a,b)=>a-b);
  const spans:TerrainSpan[]=[];
  for(let i=0;i<edges.length-1;i++){
    const x=edges[i],end=edges[i+1],mid=(x+end)/2;
    const surfaces=solid.filter(s=>mid>=s.x&&mid<s.x+s.w).map(s=>surfaceY(s,mid));
    if(!surfaces.length)continue;
    const top=Math.max(...surfaces),last=spans[spans.length-1];
    if(last && last.x+last.w===x && last.top===top)last.w=end-last.x;
    else spans.push({x,w:end-x,top});
  }
  return spans;
}

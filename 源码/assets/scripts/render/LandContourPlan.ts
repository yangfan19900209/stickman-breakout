import { TerrainSpan } from "./TerrainSurface";
/** One joined exposed contour. No independently cropped grass or side strips. */
export function landOutline(spans:readonly TerrainSpan[]):{x:number;y:number}[]{
  const points:{x:number;y:number}[]=[];
  for(const s of spans){
    const previous=points[points.length-1];
    if(!previous||previous.x!==s.x||previous.y!==s.top)points.push({x:s.x,y:s.top});
    points.push({x:s.x+s.w,y:s.top});
  }
  return points;
}

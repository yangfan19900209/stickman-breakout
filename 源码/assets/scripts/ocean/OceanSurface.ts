/** World-anchored swell: the fill spans behind the cliff and outside the camera. */
export function seaSurfaceY(x:number,time:number,surface:number):number{
  return surface+Math.sin(x*.019-time*1.6)*3.8+Math.sin(x*.047+time*.9)*1.3;
}
export function seaSurfacePoints(cx:number,cy:number,width:number,time:number,surface:number){
  const points:{x:number;y:number}[]=[];
  const start=Math.floor((cx-40)/12)*12;
  for(let x=start;x<=cx+width+52;x+=12)points.push({x:x-cx,y:seaSurfaceY(x,time,surface)-cy});
  return points;
}

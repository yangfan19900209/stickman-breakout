import { Rect, Facing, clamp } from "../core/Types";
export function meleeHand(stage:number,stance:"stand"|"crouch"|"jump") {
  return stance==="crouch"?{x:25,y:27}:stance==="jump"?{x:30,y:43}:stage===1?{x:41,y:44}:stage===2?{x:49,y:49}:{x:31,y:33};
}

/** Rect versus swept angular sector. Wall visibility is checked separately. */
export function sectorHitsRect(x:number,y:number,range:number,from:number,to:number,r:Rect,facing:Facing):boolean {
  const left = facing > 0 ? r.x-x : x-r.x-r.w, right = left+r.w;
  const low=r.y-y,high=low+r.h,min=Math.min(from,to)-.12,max=Math.max(from,to)+.12;
  if(right<0)return right>=-24&&low<=12&&high>=-12;
  const points=[
    [left,low],[right,low],[left,high],[right,high],
    [(left+right)/2,(low+high)/2],[clamp(0,left,right),clamp(0,low,high)],
  ];
  for(const angle of [min,max,(min+max)/2]) {
    const px=Math.cos(angle)*range,py=Math.sin(angle)*range;
    if(px>=left&&px<=right&&py>=low&&py<=high)return true;
  }
  return points.some(([px,py])=>px>=0&&px*px+py*py<=range*range&&Math.atan2(py,px)>=min&&Math.atan2(py,px)<=max);
}

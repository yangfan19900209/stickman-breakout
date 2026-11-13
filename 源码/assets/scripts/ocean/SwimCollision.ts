import { Rect } from "../core/Types";

const EPS=1e-6, SKIN=.001;
/** Axis sweep for bodies. Tangential contact and moving away are not impacts.
 * Projectile segment tests intentionally include contact; those rules differ. */
export function swimMove(body:{x:number;y:number},dx:number,dy:number,hw:number,h:number,solids:readonly Rect[]):void{
  const inside=(x:number,y:number,r:Rect)=>x+hw>r.x+EPS&&x-hw<r.x+r.w-EPS&&y+h>r.y+EPS&&y<r.y+r.h-EPS;
  if(solids.some(r=>inside(body.x,body.y,r))){
    // Correct a genuine initial penetration to the nearest free boundary of
    // the whole collider union, including adjacent sampled rock bands.
    let bestX=body.x,bestY=body.y,bestDistance=100;
    const candidate=(x:number,y:number)=>{
      const distance=Math.abs(x-body.x)+Math.abs(y-body.y);
      if(distance<bestDistance&&!solids.some(o=>inside(x,y,o))){bestX=x;bestY=y;bestDistance=distance;}
    };
    for(const r of solids){
      candidate(r.x-hw-SKIN,body.y);candidate(r.x+r.w+hw+SKIN,body.y);
      candidate(body.x,r.y-h-SKIN);candidate(body.x,r.y+r.h+SKIN);
    }
    if(bestDistance<100){body.x=bestX;body.y=bestY;}
  }
  for(const axis of ['x','y'] as const){
    const delta=axis==='x'?dx:dy;
    if(!delta)continue;
    let allowed=delta;
    for(const r of solids){
      const across=axis==='x'
        ?body.y+h>r.y+EPS&&body.y<r.y+r.h-EPS
        :body.x+hw>r.x+EPS&&body.x-hw<r.x+r.w-EPS;
      if(!across)continue;
      const min=axis==='x'?r.x-hw:r.y-h,max=axis==='x'?r.x+r.w+hw:r.y+r.h,start=body[axis];
      if(delta>0&&start<=min+EPS&&start+allowed>min)allowed=Math.min(allowed,Math.max(0,min-start-SKIN));
      else if(delta<0&&start>=max-EPS&&start+allowed<max)allowed=Math.max(allowed,Math.min(0,max-start+SKIN));
    }
    body[axis]+=allowed;
  }
}

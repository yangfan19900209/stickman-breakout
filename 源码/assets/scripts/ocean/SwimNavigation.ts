import { Rect, Vec, clamp, segmentRect } from "../core/Types";

/** Short, cached routes for a swimming hull. Search the same solid rectangles
 * used by movement, expanded by the hull, rather than steering its centre ray. */
export class SwimNavigation {
  private route: Vec[] = [];
  private goal: Vec = { x: NaN, y: NaN };
  private refreshAt = 0;

  next(start: Vec, goal: Vec, halfWidth: number, height: number,
    solids: readonly Rect[], floor: number, ceiling: number, time: number): Vec {
    const expanded = solids.map(r => ({ x: r.x - halfWidth + .0001,
      y: r.y - height + .0001, w: r.w + halfWidth * 2 - .0002,
      h: r.h + height - .0002 }));
    const clear = (a: Vec, b: Vec) => b.y >= floor && b.y <= ceiling &&
      !expanded.some(r => segmentRect(a, b, r) !== null);
    goal = { x: goal.x, y: clamp(goal.y, floor, ceiling) };
    if (clear(start, goal)) { this.route = []; return goal; }
    if (time >= this.refreshAt || Math.hypot(goal.x-this.goal.x, goal.y-this.goal.y)>72 ||
      (this.route.length > 0 && !clear(start, this.route[0]))) {
      this.goal = goal;
      this.refreshAt = time + .65;
      this.route = this.findRoute(start, goal, clear, floor, ceiling);
    }
    while (this.route.length > 1 && Math.hypot(this.route[0].x-start.x,this.route[0].y-start.y)<5)
      this.route.shift();
    // Smooth only through space that fits the complete hull.
    while (this.route.length > 1 && clear(start, this.route[1])) this.route.shift();
    return this.route[0] ?? start;
  }

  private findRoute(start: Vec, goal: Vec, clear: (a: Vec,b: Vec)=>boolean,
    floor: number, ceiling: number): Vec[] {
    const step = 32, left = Math.min(start.x,goal.x)-288, right = Math.max(start.x,goal.x)+288;
    type Node = { x: number; y: number; ix: number; iy: number; g: number; f: number; parent?: Node };
    const root: Node = { ...start, ix: 0, iy: 0, g: 0, f: Math.hypot(goal.x-start.x,goal.y-start.y) };
    const open = [root], costs = new Map<string,number>([["0,0",0]]);
    let best = root, bestDistance = root.f, found = false;
    for (let visited=0; open.length && visited<1800; visited++) {
      let index=0;
      for (let i=1;i<open.length;i++) if(open[i].f<open[index].f) index=i;
      const current=open.splice(index,1)[0];
      if(current.g !== costs.get(`${current.ix},${current.iy}`)) continue;
      const distance=Math.hypot(goal.x-current.x,goal.y-current.y);
      if(distance<bestDistance){best=current;bestDistance=distance;}
      if(clear(current,goal)){best=current;found=true;break;}
      for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){
        if(!dx&&!dy)continue;
        const ix=current.ix+dx,iy=current.iy+dy,x=start.x+ix*step,y=start.y+iy*step;
        if(x<left||x>right||y<floor||y>ceiling)continue;
        const key=`${ix},${iy}`,g=current.g+Math.hypot(dx,dy)*step;
        if(g>=(costs.get(key)??Infinity)||!clear(current,{x,y}))continue;
        costs.set(key,g);open.push({x,y,ix,iy,g,f:g+Math.hypot(goal.x-x,goal.y-y),parent:current});
      }
    }
    const route: Vec[] = found ? [goal] : [];
    for(let n=best;n.parent;n=n.parent)route.unshift({x:n.x,y:n.y});
    return route;
  }
}

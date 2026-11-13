import { GameConfig as C } from "./GameConfig";
import { Rect, Vec, clamp, overlaps, surfaceY } from "./Types";

/** One free revival per attempt, then one non-stacking credit per social action. */
export class Revival {
  used = 0;
  shared = 0;
  recommended = 0;
  preparation = 0;
  error = "";
  private attempt = 0;
  get remaining(): number { return Math.max(0, C.revive.limit + this.shared + this.recommended - this.used); }
  reset(): void { this.attempt++; this.used = this.shared = this.recommended = this.preparation = 0; this.error = ""; }
  /** Bind a reward to this death/attempt. Duplicate or late results cannot credit a new life. */
  reward(source: "share" | "recommendation"): (accepted: boolean) => boolean {
    const attempt = this.attempt, used = this.used, eligible = this.remaining === 0;
    return accepted => {
      if (!accepted || !eligible || attempt !== this.attempt || used !== this.used || this.remaining) return false;
      if (source === "share") this.shared++; else this.recommended++;
      this.error = ""; return true;
    };
  }
  begin(): void { this.used++; this.preparation = C.revive.preparation; this.error = ""; }
  advance(dt: number): boolean {
    this.preparation = Math.max(0, this.preparation - dt);
    return this.preparation < 1e-6;
  }
  snapshot() { return { used: this.used, shared: this.shared, recommended: this.recommended, remaining: this.remaining, preparation: this.preparation, error: this.error }; }
}
export interface RevivalArea { left: number; right: number; bottom: number; top: number }
export interface LandAnchor { support: Rect; offset: number }
export const padded = (r: Rect, margin = 20): Rect => ({ x: r.x-margin, y:r.y-margin, w:r.w+margin*2, h:r.h+margin*2 });

function clear(point: Vec, solids: readonly Rect[], avoid: readonly Rect[], area: RevivalArea, hw: number, height: number, support?: Rect): boolean {
  if (point.x < area.left || point.x > area.right || point.y < area.bottom || point.y+height > area.top) return false;
  const body = {x:point.x-hw, y:point.y+.1, w:hw*2, h:height-.1};
  return !avoid.some(r=>overlaps(body,r)) && !solids.some(r=> {
    if (r===support || !overlaps(body,r)) return false;
    if (r.slope) {
      const left=Math.max(body.x,r.x), right=Math.min(body.x+body.w,r.x+r.w);
      return body.y < Math.max(surfaceY(r,left),surfaceY(r,right));
    }
    return true;
  });
}

/** Revalidate live supports, full standing headroom and current encounter bounds. */
export function landRevivePoint(origin: Vec, solids: readonly Rect[], avoid: readonly Rect[], area: RevivalArea, anchor?: LandAnchor): Vec | undefined {
  const hw=C.player.halfWidth+2, height=C.player.height;
  const candidates: {point:Vec; support:Rect; score:number}[]=[];
  for (const support of solids) {
    const left=Math.max(area.left,support.x+hw), right=Math.min(area.right,support.x+support.w-hw);
    if (right<left) continue;
    const xs=[clamp(origin.x,left,right),left,right];
    for(let offset=32;offset<=960;offset+=32) xs.push(clamp(origin.x-offset,left,right),clamp(origin.x+offset,left,right));
    if(anchor?.support===support) xs.push(clamp(support.x+anchor.offset,left,right));
    for (const x of new Set(xs)) {
      const point={x,y:surfaceY(support,x)};
      // Prefer staying at/below the death position; elevated decks are a fallback.
      const score=Math.abs(x-origin.x)+Math.abs(point.y-origin.y)*1.2+(point.y>origin.y+80?240:0);
      candidates.push({point,support,score});
    }
  }
  candidates.sort((a,b)=>a.score-b.score);
  return candidates.find(c=>clear(c.point,solids,avoid,area,hw,height,c.support))?.point;
}

export function landAnchor(point: Vec, solids: readonly Rect[]): LandAnchor | undefined {
  const hw=C.player.halfWidth+2;
  const support=solids.find(r=>point.x-hw>=r.x && point.x+hw<=r.x+r.w && Math.abs(surfaceY(r,point.x)-point.y)<1);
  return support?{support,offset:point.x-support.x}:undefined;
}

/** Search only the reached part of this water zone; never cross rock or a boss hull. */
export function waterRevivePoint(origin: Vec, solids: readonly Rect[], avoid: readonly Rect[], area: RevivalArea, anchor?: Vec): Vec | undefined {
  const candidates: Vec[]=[origin];
  if(anchor)candidates.push(anchor);
  for(let radius=32;radius<=960;radius+=32) {
    for(let dx=-radius;dx<=radius;dx+=32) {
      candidates.push({x:origin.x+dx,y:origin.y-radius},{x:origin.x+dx,y:origin.y+radius});
    }
    for(let dy=-radius+32;dy<radius;dy+=32) candidates.push({x:origin.x-radius,y:origin.y+dy},{x:origin.x+radius,y:origin.y+dy});
  }
  candidates.sort((a,b)=>Math.hypot(a.x-origin.x,a.y-origin.y)-Math.hypot(b.x-origin.x,b.y-origin.y));
  return candidates.find(p=>clear(p,solids,avoid,area,20,C.player.height));
}

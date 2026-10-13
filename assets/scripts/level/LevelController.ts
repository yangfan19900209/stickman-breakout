import { AbandonedBase, Solid } from "./LevelData";
import { Rect } from "../core/Types";
export interface KinematicBody {
  x: number;
  y: number;
  vx: number;
  vy: number;
  grounded: boolean;
  halfWidth: number;
  height: number;
}

/** Deterministic kinematic collisions, independent of Box2D and platform/browser APIs. */
export class LevelController {
  readonly data = AbandonedBase;
  readonly solids: Solid[] = this.data.solids;
  guardDefeated = false;
  reset(): void {
    this.guardDefeated = false;
  }
  bounds(body: KinematicBody): Rect {
    return {
      x: body.x - body.halfWidth,
      y: body.y,
      w: body.halfWidth * 2,
      h: body.height,
    };
  }
  move(body: KinematicBody, dt: number): void {
    const oldX = body.x,
      dx = body.vx * dt;
    body.x += dx;
    for (const s of this.solids) {
      if (body.y >= s.y + s.h - 0.01 || body.y + body.height <= s.y + 0.01)
        continue;
      if (
        dx > 0 &&
        oldX + body.halfWidth <= s.x + 0.01 &&
        body.x + body.halfWidth >= s.x
      ) {
        body.x = Math.min(body.x, s.x - body.halfWidth);
        body.vx = 0;
      } else if (
        dx < 0 &&
        oldX - body.halfWidth >= s.x + s.w - 0.01 &&
        body.x - body.halfWidth <= s.x + s.w
      ) {
        body.x = Math.max(body.x, s.x + s.w + body.halfWidth);
        body.vx = 0;
      }
    }
    const oldY = body.y,
      dy = body.vy * dt;
    body.y += dy;
    body.grounded = false;
    for (const s of this.solids) {
      if (
        body.x + body.halfWidth <= s.x ||
        body.x - body.halfWidth >= s.x + s.w
      )
        continue;
      const top = s.y + s.h;
      if (dy <= 0 && oldY >= top - 0.01 && body.y <= top) {
        body.y = Math.max(body.y, top);
        body.vy = 0;
        body.grounded = true;
      } else if (
        dy > 0 &&
        oldY + body.height <= s.y + 0.01 &&
        body.y + body.height >= s.y
      ) {
        body.y = Math.min(body.y, s.y - body.height);
        body.vy = 0;
      }
    }
    body.x = Math.max(
      body.halfWidth,
      Math.min(this.data.width - body.halfWidth, body.x),
    );
  }
  reachedExit(x: number): boolean {
    return this.guardDefeated && x >= this.data.exit.x - 28;
  }
}

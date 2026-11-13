import { GameConfig as C } from "../core/GameConfig";
import { clamp } from "../core/Types";
import type { LevelController, KinematicBody } from "../level/LevelController";

/** Boss feet use the same swept world collision as every other ground actor. */
export function moveBoss(
  body: KinematicBody & { stride: number; facing: number },
  level: LevelController, dt: number, velocity: number,
  left: number, right: number, strideLength: number,
): number {
  const oldX = body.x;
  const target = clamp(oldX + velocity * dt, left, right);
  body.vx = dt > 0 ? (target - oldX) / dt : 0;
  body.vy -= C.player.gravity * dt;
  level.move(body, dt);
  const distance = body.x - oldX;
  if (body.grounded) body.stride += Math.abs(distance) / strideLength;
  body.vx = dt > 0 ? distance / dt : 0;
  return distance;
}

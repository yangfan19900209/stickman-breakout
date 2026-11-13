import { GameConfig as C } from "../core/GameConfig";
import { clamp } from "../core/Types";
export class CameraFollow {
  x = 0;
  y = 0;
  visibleWidth: number = C.width;
  zoom = 1;
  private spawnX = 150;
  private get minimumX(): number {
    // A shallow soil strip puts the hero at thumb height. Keep the opening
    // silhouette to the right of the left control instead of behind its cap.
    return this.zoom > 1 ? Math.min(-110, this.spawnX - this.visibleWidth * .34) : 0;
  }
  reset(spawnX = 150): void {
    this.spawnX = spawnX;
    this.x = this.minimumX;
    this.y = 0;
  }
  update(
    playerX: number,
    dt: number,
    mapWidth: number,
    _facing = 1,
    playerY = 150,
    leftBoundary?: number,
  ): void {
    const min = leftBoundary ?? this.minimumX;
    // The retreat boundary is the visible left edge, not a wall in the middle
    // of the camera's look-ahead. Keep the body visible as easing settles.
    const max = Math.max(min, Math.min(mapWidth - this.visibleWidth, playerX - C.player.halfWidth));
    const target = clamp(
      // Turning or aiming changes the actor only. Keep the forward framing
      // fixed so a short reversal cannot sweep 28% of the screen sideways.
      playerX - this.visibleWidth * 0.36,
      min,
      max,
    );
    this.x += (target - this.x) * (1 - Math.exp(-dt * 8));
    this.x = clamp(this.x, min, max);
    const vertical = clamp(playerY - 260, 0, 220);
    this.y += (vertical - this.y) * (1 - Math.exp(-dt * 3));
  }
}

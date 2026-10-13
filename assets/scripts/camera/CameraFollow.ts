import { GameConfig as C } from "../core/GameConfig";
import { clamp } from "../core/Types";
export class CameraFollow {
  x = 0;
  y = 0;
  visibleWidth: number = C.width;
  zoom = 1;
  reset(): void {
    this.x = this.zoom > 1 ? -110 : 0;
    this.y = 0;
  }
  update(
    playerX: number,
    dt: number,
    mapWidth: number,
    facing = 1,
    playerY = 150,
    arenaStart?: number,
  ): void {
    const min = arenaStart ?? (this.zoom > 1 ? -110 : 0);
    const max = Math.max(min, mapWidth - this.visibleWidth);
    const target = clamp(
      playerX - this.visibleWidth * (facing > 0 ? 0.36 : 0.64),
      min,
      max,
    );
    this.x += (target - this.x) * (1 - Math.exp(-dt * 8));
    this.x = clamp(this.x, min, max);
    const vertical = clamp(playerY - 260, 0, 220);
    this.y += (vertical - this.y) * (1 - Math.exp(-dt * 3));
  }
}

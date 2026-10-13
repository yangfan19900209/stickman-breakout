import { GameConfig as C } from "../core/GameConfig";
import { clamp } from "../core/Types";
export class CameraFollow {
  x = 0;
  reset(): void {
    this.x = 0;
  }
  update(playerX: number, dt: number, mapWidth: number): void {
    const target = clamp(playerX - C.width * 0.38, 0, mapWidth - C.width);
    this.x += (target - this.x) * (1 - Math.exp(-dt * 8));
    this.x = clamp(this.x, 0, mapWidth - C.width);
  }
}

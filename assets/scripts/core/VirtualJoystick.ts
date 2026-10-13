import { GameConfig as C } from "./GameConfig";
import { clamp } from "./Types";

/** One touch owns the stick; other fingers retain independent action ownership. */
export class VirtualJoystick {
  owner: number | null = null;
  x = 0;
  y = 0;
  axis = 0;
  vertical = 0;
  readonly radius = C.input.joystickRadius;
  start(id: number, x: number, y: number): boolean {
    if (this.owner !== null) return false;
    this.owner = id;
    this.move(id, x, y);
    return true;
  }
  move(id: number, x: number, y: number): void {
    if (id !== this.owner) return;
    const length = Math.hypot(x, y),
      scale = length > this.radius ? this.radius / length : 1;
    this.x = x * scale;
    this.y = y * scale;
    const amount = Math.min(1, length / this.radius);
    const mapped = clamp(
      (amount - C.input.deadZone) / (1 - C.input.deadZone),
      0,
      1,
    );
    this.axis = length > 0 ? (x / length) * mapped : 0;
    this.vertical = length > 0 ? (y / length) * mapped : 0;
  }
  end(id: number): void {
    if (id === this.owner) this.reset();
  }
  reset(): void {
    this.owner = null;
    this.x = this.y = this.axis = this.vertical = 0;
  }
}

import { MechanismData, Solid } from "./LevelData";
export class MechanismController {
  readonly rect: Solid;
  released = false;
  landed = false;
  direction = 1;
  vy = 0;
  constructor(readonly data: MechanismData) {
    this.rect = {
      x: data.x,
      y: data.y,
      w: data.w,
      h: data.h,
      kind: "platform",
      oneWay: data.kind === "lift",
    };
  }
  update(dt: number): number {
    const old = this.rect.y;
    if (this.data.kind === "lift") {
      this.rect.y += this.direction * this.data.speed * dt;
      if (this.rect.y >= this.data.maxY) {
        this.rect.y = this.data.maxY;
        this.direction = -1;
      }
      if (this.rect.y <= this.data.minY) {
        this.rect.y = this.data.minY;
        this.direction = 1;
      }
    } else if (this.released && !this.landed) {
      this.vy -= 650 * dt;
      this.rect.y = Math.max(this.data.minY, this.rect.y + this.vy * dt);
      if (this.rect.y === this.data.minY) {
        this.landed = true;
        this.vy = 0;
      }
    }
    return this.rect.y - old;
  }
}

import { DamageOwner } from "../core/Types";
export interface Blast {
  active: boolean;
  x: number;
  y: number;
  radius: number;
  damage: number;
  owner: DamageOwner;
  age: number;
}
/** Bounded FIFO keeps barrel chains iterative and schedules each destroyed barrel once. */
export class ExplosionSystem {
  readonly items: Blast[] = Array.from({ length: 24 }, () => ({
    active: false,
    x: 0,
    y: 0,
    radius: 0,
    damage: 0,
    owner: "neutral",
    age: 0,
  }));
  private queue = Array.from({ length: 32 }, () => ({
    x: 0,
    y: 0,
    radius: 0,
    damage: 0,
    owner: "neutral" as DamageOwner,
  }));
  private head = 0;
  private count = 0;
  total = 0;
  dropped = 0;
  enqueue(
    x: number,
    y: number,
    radius: number,
    damage: number,
    owner: DamageOwner,
  ): void {
    if (this.count === this.queue.length) {
      this.dropped++;
      return;
    }
    Object.assign(this.queue[(this.head + this.count) % this.queue.length], {
      x,
      y,
      radius,
      damage,
      owner,
    });
    this.count++;
  }
  flush(
    apply: (
      x: number,
      y: number,
      radius: number,
      damage: number,
      owner: DamageOwner,
    ) => void,
  ): void {
    let budget = 64;
    while (this.count > 0 && budget-- > 0) {
      const b = this.queue[this.head];
      this.head = (this.head + 1) % this.queue.length;
      this.count--;
      const { x, y, radius, damage, owner } = b;
      const visible = this.items.find((p) => !p.active);
      if (visible)
        Object.assign(visible, {
          active: true,
          x,
          y,
          radius,
          damage,
          owner,
          age: 0,
        });
      this.total++;
      apply(x, y, radius, damage, owner);
    }
  }
  update(dt: number): void {
    for (const b of this.items)
      if (b.active) {
        b.age += dt;
        if (b.age > 0.65) b.active = false;
      }
  }
  reset(): void {
    for (const b of this.items) b.active = false;
    this.head = this.count = this.total = this.dropped = 0;
  }
}

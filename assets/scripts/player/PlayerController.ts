import { GameConfig as C } from "../core/GameConfig";
import { AnimationState, Facing, InputFrame, Rect } from "../core/Types";
import { LevelController } from "../level/LevelController";

export class PlayerController {
  x = 110;
  y = 150;
  vx = 0;
  vy = 0;
  grounded = true;
  readonly halfWidth = C.player.halfWidth;
  readonly height = C.player.height;
  health: number = C.player.maxHealth;
  facing: Facing = 1;
  invincible = 0;
  hitTime = 0;
  deadTime = 0;
  recoil = 0;
  animationTime = 0;
  private coyote = 0;
  private buffer = 0;
  get alive(): boolean {
    return this.health > 0;
  }
  get bounds(): Rect {
    return { x: this.x - 13, y: this.y + 3, w: 26, h: 65 };
  }
  get animation(): AnimationState {
    if (!this.alive) return "Dead";
    if (this.hitTime > 0) return "Hit";
    if (!this.grounded) return this.vy > 0 ? "Jump" : "Fall";
    if (Math.abs(this.vx) > 8) return "Run";
    return this.recoil > 0 ? "Shoot" : "Idle";
  }
  reset(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.grounded = true;
    this.health = C.player.maxHealth;
    this.facing = 1;
    this.invincible =
      this.hitTime =
      this.deadTime =
      this.recoil =
      this.animationTime =
      this.coyote =
      this.buffer =
        0;
  }
  update(dt: number, input: InputFrame, level: LevelController): void {
    this.animationTime += dt;
    this.recoil = Math.max(0, this.recoil - dt * 8);
    this.invincible = Math.max(0, this.invincible - dt);
    this.hitTime = Math.max(0, this.hitTime - dt);
    if (!this.alive) {
      this.deadTime += dt;
      this.vx *= Math.exp(-dt * 8);
    } else {
      if (input.axis) this.facing = input.axis > 0 ? 1 : -1;
      const target = input.axis * C.player.speed;
      const change =
        (input.axis ? C.player.acceleration : C.player.deceleration) * dt;
      this.vx += Math.max(-change, Math.min(change, target - this.vx));
      this.coyote = this.grounded
        ? C.player.coyoteTime
        : Math.max(0, this.coyote - dt);
      this.buffer = input.jump
        ? C.player.jumpBuffer
        : Math.max(0, this.buffer - dt);
      if (this.buffer > 0 && this.coyote > 0) {
        this.vy = C.player.jumpVelocity;
        this.grounded = false;
        this.coyote = 0;
        this.buffer = 0;
      }
    }
    this.vy -= C.player.gravity * dt;
    level.move(this, dt);
    if (this.y < -200) this.takeDamage(this.health, this.facing);
  }
  takeDamage(amount: number, direction: Facing): boolean {
    if (!this.alive || this.invincible > 0) return false;
    this.health = Math.max(0, this.health - amount);
    this.invincible = C.player.invincibility;
    this.hitTime = 0.22;
    this.vx = direction * 145;
    return true;
  }
}

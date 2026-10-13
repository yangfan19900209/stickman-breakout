import { GameConfig as C, WeaponId } from "../core/GameConfig";
import {
  AnimationState,
  Facing,
  InputFrame,
  Rect,
  overlaps,
} from "../core/Types";
import { LevelController } from "../level/LevelController";

export class PlayerController {
  readonly isPlayer = true;
  x = 110;
  y = 150;
  vx = 0;
  vy = 0;
  grounded = true;
  readonly halfWidth = C.player.halfWidth;
  get height(): number {
    return this.crouched ? 43 : C.player.height;
  }
  crouched = false;
  aimPitch = 0;
  landTime = 0;
  private jumpCut = false;
  health: number = C.player.maxHealth;
  grenades: number = C.grenade.initial;
  weaponId: WeaponId = "rifle";
  facing: Facing = 1;
  invincible = 0;
  hitTime = 0;
  deadTime = 0;
  recoil = 0;
  animationTime = 0;
  private coyote = 0;
  private buffer = 0;
  private hurtbox: Rect = { x: 0, y: 0, w: 26, h: 65 };
  get alive(): boolean {
    return this.health > 0;
  }
  get bounds(): Rect {
    this.hurtbox.x = this.x - 13;
    this.hurtbox.y = this.y + 3;
    this.hurtbox.h = this.crouched ? 36 : 65;
    return this.hurtbox;
  }
  get animation(): AnimationState {
    if (!this.alive) return "Dead";
    if (this.hitTime > 0) return "Hit";
    if (!this.grounded) return this.vy > 0 ? "Jump" : "Fall";
    if (this.crouched) return "Crouch";
    if (this.landTime > 0.05) return "Land";
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
    this.grenades = C.grenade.initial;
    this.weaponId = "rifle";
    this.facing = 1;
    this.crouched = false;
    this.aimPitch = 0;
    this.landTime = 0;
    this.jumpCut = false;
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
    this.landTime = Math.max(0, this.landTime - dt);
    this.recoil = Math.max(0, this.recoil - dt * 8);
    this.invincible = Math.max(0, this.invincible - dt);
    this.hitTime = Math.max(0, this.hitTime - dt);
    if (!this.alive) {
      this.deadTime += dt;
      this.vx *= Math.exp(-dt * 8);
    } else {
      if (Math.abs(input.axis) > 0.06) this.facing = input.axis > 0 ? 1 : -1;
      const wantsCrouch = !!input.crouch && this.grounded;
      const blockedStanding =
        this.crouched &&
        level.solids.some((s) =>
          overlaps(
            {
              x: this.x - 13,
              y: this.y + 0.5,
              w: 26,
              h: C.player.height - 0.5,
            },
            s,
          ),
        );
      this.crouched = wantsCrouch || blockedStanding;
      this.aimPitch = input.aimY
        ? Math.abs(input.axis) > 0.3
          ? Math.PI / 4
          : Math.PI / 2
        : 0;
      const target =
        input.axis * (this.crouched ? C.player.crouchSpeed : C.player.speed);
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
        this.jumpCut = false;
        this.crouched = false;
      }
      // Legacy simulation frames omit jumpHeld; real device frames always provide it.
      if (input.jumpHeld === false && !this.jumpCut && this.vy > 0) {
        this.vy *= C.player.jumpCut;
        this.jumpCut = true;
      }
    }
    this.vy -= C.player.gravity * dt;
    const wasGrounded = this.grounded;
    level.move(this, dt);
    if (!wasGrounded && this.grounded) this.landTime = 0.12;
    if (this.y < -200) this.takeDamage(this.health, this.facing);
  }
  takeDamage(amount: number, direction: Facing): boolean {
    if (!this.alive || this.invincible > 0) return false;
    this.health = Math.max(0, this.health - Math.ceil(amount));
    this.invincible = C.player.invincibility;
    this.hitTime = 0.22;
    this.vx = direction * 145;
    return true;
  }
}

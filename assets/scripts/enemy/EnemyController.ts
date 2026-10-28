import { GameConfig as C } from "../core/GameConfig";
import {
  AnimationState,
  EnemyKind,
  EnemyState,
  Facing,
  Rect,
  segmentRect,
  DamageKind,
} from "../core/Types";
import { EnemySpawn } from "../level/LevelData";
import { LevelController } from "../level/LevelController";
import { PlayerController } from "../player/PlayerController";
import { ProjectileManager } from "../combat/ProjectileManager";
import { WeaponSystem } from "../combat/WeaponSystem";
import { EnemyTactics } from "./EnemyTactics";

export class EnemyController {
  x: number;
  y: number;
  vx = 0;
  vy = 0;
  grounded = true;
  halfWidth: number = 13;
  height: number = 74;
  readonly kind: EnemyKind;
  readonly id: string;
  maxHealth: number;
  health: number;
  state: EnemyState = "Idle";
  facing: Facing = -1;
  hitTime = 0;
  deadTime = 0;
  animationTime = 0;
  stride = 0;
  groundSlope = 0;
  recoil = 0;
  attackCooldown = 0.8;
  windup = 0;
  aimPitch = 0;
  shieldHealth = 0;
  shieldHit = 0;
  deathEffectPlayed = false;
  private tactics = new EnemyTactics();
  private stuckTime = 0;
  private hopCooldown = 0;
  private hopDirection: Facing = 1;
  private hopTime = 0;
  get action(): string {
    return this.tactics.action;
  }

  readonly weapon = new WeaponSystem();
  private hurtbox: Rect = { x: 0, y: 0, w: 26, h: 65 };
  constructor(readonly spawn: EnemySpawn) {
    this.x = spawn.x;
    this.y = spawn.y;
    this.kind = spawn.kind;
    this.id = spawn.id;
    this.health = this.maxHealth = spawn.health ?? C.enemies[this.kind].health;
    if (this.kind === "shield") this.shieldHealth = 8;
    if (this.kind === "turret") {
      this.halfWidth = 28;
      this.height = 70;
    }
  }
  get alive(): boolean {
    return this.health > 0;
  }
  get bounds(): Rect {
    this.hurtbox.x = this.x - (this.kind === "shield" ? 22 : this.halfWidth);
    this.hurtbox.y = this.y + 3;
    this.hurtbox.h = this.kind === "guard" ? 72 : 65;
    this.hurtbox.w = this.kind === "shield" ? 44 : this.halfWidth * 2;
    return this.hurtbox;
  }
  get animation(): AnimationState {
    if (!this.alive) return "Dead";
    if (this.hitTime > 0) return "Hit";
    if (!this.grounded) return this.vy > 0 ? "Jump" : "Fall";
    if (this.state === "Attack" && Math.abs(this.vx) < 4) return "Shoot";
    if (Math.abs(this.vx) > 4) return "Run";
    return "Idle";
  }
  takeDamage(
    amount: number,
    direction: Facing,
    kind: DamageKind = "bullet",
  ): boolean {
    if (!this.alive) return false;
    const blocked =
      this.kind === "shield" &&
      this.shieldHealth > 0 &&
      direction === -this.facing &&
      kind !== "explosion";
    if (blocked) {
      this.shieldHealth = Math.max(0, this.shieldHealth - amount);
      this.shieldHit = 0.16;
      amount *= 0.2;
    }
    this.health = Math.max(0, this.health - amount);
    this.hitTime = blocked ? 0.025 : 0.13;
    this.vx = this.kind === "turret" ? 0 : direction * 65;
    this.state = this.alive ? "Hit" : "Dead";
    if (!blocked) this.tactics.interrupt(this);
    return true;
  }
  update(
    dt: number,
    player: PlayerController,
    level: LevelController,
    projectiles: ProjectileManager,
  ): void {
    this.animationTime += dt;
    this.weapon.update(dt);
    this.recoil = Math.max(0, this.recoil - dt * 8);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.hitTime = Math.max(0, this.hitTime - dt);
    this.shieldHit = Math.max(0, this.shieldHit - dt);
    const dx = player.x - this.x;
    if (!this.alive) {
      this.state = "Dead";
      this.deadTime += dt;
      this.vx *= Math.exp(-dt * 3);
    } else if (this.hitTime > 0) {
      this.state = "Hit";
      this.vx *= Math.exp(-dt * 5);
    } else this.tactics.update(this, dt, player, level, projectiles);
    // Ranged platform soldiers remain on their patrol surface. Melee soldiers can negotiate crates.
    if (
      this.kind === "ranged" &&
      this.spawn.onPlatform &&
      ((this.x <= this.spawn.x - this.spawn.patrol && this.vx < 0) ||
        (this.x >= this.spawn.x + this.spawn.patrol && this.vx > 0))
    )
      this.vx = 0;
    const oldX = this.x;
    this.hopTime = Math.max(0, this.hopTime - dt);
    // Keep takeoff momentum: acquiring sight mid-jump must not stop a soldier
    // above the same lip and drop it back into the depression.
    if (this.hopTime > 0 && !this.grounded && this.alive && this.hitTime === 0)
      this.vx = this.hopDirection * 160;
    const walking = Math.abs(this.vx) > 4;
    const walkDirection: Facing = this.vx >= 0 ? 1 : -1;
    this.hopCooldown = Math.max(0, this.hopCooldown - dt);
    this.vy -= C.player.gravity * dt;
    level.move(this, dt);
    if (this.grounded)
      this.stride += ((this.x - oldX) * this.facing) / C.animation.strideLength;
    const mobile = this.kind === "melee" || this.kind === "ranged" || this.kind === "shield";
    this.stuckTime = this.alive && mobile && !this.spawn.onPlatform && walking && this.grounded
      && this.hitTime === 0 && Math.abs(this.x - oldX) < 0.01 ? this.stuckTime + dt : 0;
    if (this.stuckTime > 0.14 && this.hopCooldown === 0) {
      this.vy = 480; this.grounded = false; this.stuckTime = 0; this.hopCooldown = 0.85;
      this.hopTime = .85; this.hopDirection = walkDirection;
    }
  }
}

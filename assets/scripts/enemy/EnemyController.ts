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
  private turnTime = 0;
  private patrolDirection: Facing = -1;
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
    if (this.state === "Attack") return "Shoot";
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
    this.vx = direction * 65;
    this.state = this.alive ? "Hit" : "Dead";
    if (!blocked) this.windup = 0;
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
    const config = C.enemies[this.kind],
      dx = player.x - this.x,
      dy = player.y - this.y;
    if (!this.alive) {
      this.state = "Dead";
      this.deadTime += dt;
      this.vx *= Math.exp(-dt * 3);
    } else if (this.hitTime > 0) {
      this.state = "Hit";
      this.vx *= Math.exp(-dt * 5);
    } else if (!player.alive || Math.abs(dx) > config.notice) {
      this.windup = 0;
      this.state = Math.abs(dx) > 900 ? "Idle" : "Patrol";
      if (this.x < this.spawn.x - this.spawn.patrol) this.patrolDirection = 1;
      if (this.x > this.spawn.x + this.spawn.patrol) this.patrolDirection = -1;
      this.vx =
        this.state === "Patrol" ? this.patrolDirection * config.speed * 0.3 : 0;
      if (this.vx) this.facing = this.vx > 0 ? 1 : -1;
    } else {
      const desired: Facing = dx >= 0 ? 1 : -1;
      if (this.kind === "shield" && desired !== this.facing) {
        this.turnTime += dt;
        if (this.turnTime >= 0.45) {
          this.facing = desired;
          this.turnTime = 0;
        }
      } else {
        this.facing = desired;
        this.turnTime = 0;
      }
      const close =
        Math.abs(dx) <= config.range &&
        Math.abs(dy) < (this.kind === "melee" ? 50 : 110);
      const sight = !level.solids.some(
        (s) =>
          !s.entityId &&
          segmentRect(
            { x: this.x, y: this.y + 44 },
            { x: player.x, y: player.y + 44 },
            s,
          ) !== null,
      );
      if (close && (this.kind === "melee" || sight)) {
        this.state = "Attack";
        this.vx =
          this.kind === "ranged" && !this.spawn.onPlatform
            ? (Math.abs(dx) < 220 ? -this.facing : this.facing) *
              config.speed *
              0.4
            : 0;
        this.aimPitch =
          this.kind === "turret"
            ? Math.max(-0.3, Math.min(0.65, Math.atan2(dy - 12, Math.abs(dx))))
            : 0;
        if (this.attackCooldown === 0 && this.windup === 0)
          this.windup =
            this.kind === "melee" ? 0.38 : this.kind === "turret" ? 0.7 : 0.4;
        if (this.windup > 0) {
          this.windup = Math.max(0, this.windup - dt);
          if (this.windup === 0) {
            if (this.kind === "melee") {
              if (
                Math.abs(player.x - this.x) < config.range + 8 &&
                Math.abs(player.y - this.y) < 50
              )
                player.takeDamage(config.damage, this.facing);
            } else if (this.kind === "turret") {
              projectiles.spawn({
                owner: "enemy",
                x: this.x + this.facing * 36 * Math.cos(this.aimPitch),
                y: this.y + 50 + 36 * Math.sin(this.aimPitch),
                direction: this.facing,
                pitch: this.aimPitch,
                speed: 260,
                damage: 2,
                range: 1150,
                kind: "cannon",
                blastRadius: 55,
              });
              this.recoil = 1.5;
            } else
              this.weapon.fire(this, projectiles, "enemy", config.interval);
            this.attackCooldown = config.interval;
          }
        }
      } else {
        this.state = "Chase";
        this.windup = 0;
        this.vx =
          this.kind === "melee" || !sight || Math.abs(dx) > config.range
            ? this.facing * config.speed
            : 0;
      }
    }
    // Ranged platform soldiers remain on their patrol surface. Melee soldiers can negotiate crates.
    if (
      this.kind === "ranged" &&
      this.spawn.onPlatform &&
      Math.abs(this.x - this.spawn.x) > this.spawn.patrol
    )
      this.vx = 0;
    const oldX = this.x;
    this.vy -= C.player.gravity * dt;
    level.move(this, dt);
    if (this.grounded) this.stride += ((this.x - oldX) * this.facing) / 112;
    if (
      this.alive &&
      this.kind === "melee" &&
      this.state === "Chase" &&
      this.grounded &&
      Math.abs(this.x - oldX) < 0.01 &&
      Math.abs(dx) > 50
    )
      this.vy = 480;
  }
}

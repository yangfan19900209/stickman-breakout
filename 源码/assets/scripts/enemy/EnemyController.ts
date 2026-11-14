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
import { findPursuitJump, jumpVelocityX, PursuitJump } from "./GroundPursuit";

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
  shieldBreakCount = 0;
  shieldBreakEvent?: { x: number; y: number; facing: Facing };
  deathEffectPlayed = false;
  private tactics = new EnemyTactics();
  private navigationCooldown = 0;
  private pursuitJump?: PursuitJump;
  jumpCount = 0;
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
    if (this.kind === "shield") this.shieldHealth = 3;
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
  recoverAfterRevive(): void {
    if(!this.alive)return;
    this.tactics.interrupt(this); this.vx=0; this.recoil=this.hitTime=0;
    this.pursuitJump=undefined; this.navigationCooldown=.8; this.attackCooldown=Math.max(1,this.attackCooldown);
  }
  takeDamage(
    amount: number,
    direction: Facing,
    kind: DamageKind = "bullet",
  ): boolean {
    if (!this.alive) return false;
    // Ordinary enemies are executed by a connected player knife strike.
    // Boss subclasses own their separate damage rules.
    if (kind === "melee" && this.kind !== "guard" && this.kind !== "colossus") amount = this.health;
    const blocked =
      this.kind === "shield" &&
      this.shieldHealth > 0 &&
      direction === -this.facing &&
      kind === "bullet";
    if (blocked) {
      this.shieldHealth = Math.max(0, this.shieldHealth - amount);
      this.shieldHit = 0.16;
      // Plate durability is presentation of these same hits, not extra HP.
      // Three frontal rifle rounds break it; the five-HP soldier has two left.
    }
    this.health = Math.max(0, this.health - amount);
    if (this.kind === "shield" && this.shieldBreakCount === 0 &&
        (this.shieldHealth === 0 || !this.alive)) {
      this.shieldHealth = 0;
      this.shieldBreakCount++;
      this.shieldBreakEvent = { x: this.x + this.facing * 18, y: this.y, facing: this.facing };
    }
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
    } else if (this.pursuitJump && !this.grounded) {
      this.tactics.faceTarget(this, dt, player);
      this.state = "Chase";
      this.vx = jumpVelocityX(this.pursuitJump, this);
    } else this.tactics.update(this, dt, player, level, projectiles);
    // Patrol stays local; pursuit is allowed to leave the original platform.
    if (
      this.kind === "ranged" &&
      this.spawn.onPlatform &&
      this.action !== "approach" &&
      !this.pursuitJump &&
      ((this.x <= this.spawn.x - this.spawn.patrol && this.vx < 0) ||
        (this.x >= this.spawn.x + this.spawn.patrol && this.vx > 0))
    )
      this.vx = 0;
    const oldX = this.x;
    this.navigationCooldown = Math.max(0, this.navigationCooldown - dt);
    const mobile = ["melee", "ranged", "shield", "turret"].includes(this.kind);
    const committed = [
      "aim",
      "burst",
      "lock",
      "brace",
      "bash",
      "chargeWindup",
      "charge",
      "swing",
    ].includes(this.action);
    if (
      this.alive &&
      mobile &&
      this.grounded &&
      this.hitTime === 0 &&
      !committed &&
      (Math.abs(this.vx) > 4 || (player.grounded && player.y > this.y + 35)) &&
      this.navigationCooldown === 0 &&
      Math.abs(player.x - this.x) < C.enemies[this.kind].notice + 100
    ) {
      this.navigationCooldown = 0.25;
      const plan = findPursuitJump(
        this,
        level,
        {
          x:
            Math.abs(this.vx) > 4
              ? this.x +
                Math.sign(this.vx) * Math.max(60, Math.abs(player.x - this.x))
              : player.x,
          y: player.grounded ? player.y : this.y,
        },
        190,
        570,
      );
      if (plan) {
        this.pursuitJump = plan;
        this.vy = plan.velocity;
        this.grounded = false;
        this.vx = jumpVelocityX(plan, this);
        this.jumpCount++;
        this.tactics.interrupt(this);
        this.state = "Chase";
        this.navigationCooldown = 0.8;
      }
    }
    this.vy -= C.player.gravity * dt;
    level.move(this, dt);
    if (this.grounded)
      this.stride += ((this.x - oldX) * this.facing) / C.animation.strideLength;
    if (this.grounded) this.pursuitJump = undefined;
  }
}

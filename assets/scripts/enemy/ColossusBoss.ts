import { GameConfig as C } from "../core/GameConfig";
import { Rect, Facing, DamageKind, clamp } from "../core/Types";
import type { EnemySpawn } from "../level/LevelData";
import type { LevelController } from "../level/LevelController";
import type { PlayerController } from "../player/PlayerController";
import type { ProjectileManager } from "../combat/ProjectileManager";
import { EnemyController } from "./EnemyController";
export type ColossusAttack = "salvo" | "sweep" | "stomp";

/** Towering final encounter. Locked warnings, distinct attacks, bounded pressure, free retreat. */
export class ColossusBoss extends EnemyController {
  active = false;
  mode: "dormant" | "entering" | "aiming" | "recovering" | "destroyed" =
    "dormant";
  attack: ColossusAttack = "salvo";
  introTime: number = C.colossus.intro;
  warningX = 0;
  warningTime = 0;
  warningY = 150;
  summons = 0;
  impactSerial = 0;
  onSummon?: (x: number) => void;
  private introduced = false;
  private sequence = 0;
  private pendingShots = 0;
  private shotDelay = 0;
  private lockedY = 185;
  private summonTime = 10;
  private box: Rect = { x: 0, y: 0, w: 272, h: 258 };
  constructor(data: EnemySpawn) {
    super(data);
    this.halfWidth = 136;
    this.height = 276;
    this.attackCooldown = 0.45;
  }
  get phase(): 1 | 2 {
    return this.health <= this.maxHealth * 0.5 ? 2 : 1;
  }
  get warningTargetY(): number {
    return this.lockedY;
  }
  override get action(): string {
    return this.mode === "entering" ? "intro" : this.attack;
  }
  override get bounds(): Rect {
    this.box.x = this.x - 136;
    this.box.y = this.y + 10;
    return this.box;
  }
  override takeDamage(
    amount: number,
    _direction: Facing,
    _kind?: DamageKind,
  ): boolean {
    if (!this.alive || !this.active) return false;
    this.health = Math.max(0, this.health - amount);
    this.hitTime = 0.12;
    if (!this.alive) {
      this.state = "Dead";
      this.mode = "destroyed";
      this.warningTime = this.windup = 0;
      this.pendingShots = 0;
    }
    return true;
  }
  override update(
    dt: number,
    p: PlayerController,
    level: LevelController,
    shots: ProjectileManager,
  ): void {
    this.animationTime += dt;
    this.hitTime = Math.max(0, this.hitTime - dt);
    this.recoil = Math.max(0, this.recoil - dt * 5);
    if (!this.alive) {
      this.deadTime += dt;
      return;
    }
    this.active = level.arenaEntered;
    if (!this.active || !p.alive) {
      this.state = "Idle";
      this.mode = "dormant";
      this.windup = this.warningTime = 0;
      this.pendingShots = 0;
      return;
    }
    this.facing = p.x > this.x ? 1 : -1;
    if (!this.introduced) {
      this.mode = "entering";
      this.state = "Idle";
      this.introTime = Math.max(0, this.introTime - dt);
      if (this.introTime === 0) this.introduced = true;
      return;
    }
    this.state = "Attack";
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.warningTime = Math.max(0, this.warningTime - dt);
    this.summonTime -= dt;
    if (this.summonTime <= 0 && this.summons < C.colossus.maxSummons) {
      this.summonTime = C.colossus.summonInterval;
      this.onSummon?.(this.x - 340);
      this.summons += 2;
    }
    if (this.pendingShots > 0) {
      this.shotDelay -= dt;
      if (this.shotDelay <= 0) {
        this.emit(shots, this.pendingShots);
        this.pendingShots--;
        this.shotDelay = 0.18;
      }
    }
    if (
      this.attackCooldown === 0 &&
      this.windup === 0 &&
      this.pendingShots === 0
    ) {
      this.attack = (["salvo", "stomp", "sweep"] as const)[this.sequence++ % 3];
      this.windup =
        this.phase === 1 ? C.colossus.firstWindup : C.colossus.secondWindup;
      this.warningX = clamp(
        p.x + p.vx * 0.18,
        (level.data.arena?.start ?? 0) + 60,
        level.data.width - 60,
      );
      this.warningY = level.groundY(this.warningX);
      this.lockedY = p.y + 35;
      this.warningTime =
        this.windup +
        (this.attack === "salvo" ? C.colossus.shellFlight + 0.4 : 0.35);
      this.mode = "aiming";
    }
    if (this.windup > 0) {
      this.windup = Math.max(0, this.windup - dt);
      if (this.windup === 0) {
        this.emit(shots, 0);
        this.pendingShots =
          this.attack === "stomp" ? 0 : this.phase === 2 ? 2 : 1;
        this.shotDelay = 0.18;
        this.attackCooldown =
          this.phase === 1
            ? C.colossus.firstRecovery
            : C.colossus.secondRecovery;
        this.mode = "recovering";
      }
    }
    if (Math.abs(p.x - this.x) < 132 && p.y < this.y + 200)
      p.takeDamage(1, p.x < this.x ? -1 : 1);
  }
  private emit(shots: ProjectileManager, index: number): void {
    this.recoil = 2;
    if (this.attack === "stomp") {
      this.impactSerial++;
      for (const d of [-1, 1] as const)
        shots.spawn({
          owner: "enemy",
          x: this.x + d * 144,
          y: this.y + 14,
          direction: d,
          speed: C.colossus.waveSpeed,
          damage: 1,
          range: 1050,
          kind: "shockwave",
        });
      shots.particles.blast(this.x, this.y + 15, 80, this.y);
      return;
    }
    const x = this.x + this.facing * 132,
      y = this.y + (this.attack === "salvo" ? 226 : 138);
    const target = this.warningX + (index === 0 ? 0 : index % 2 ? 90 : -90);
    if (this.attack === "salvo") {
      const flight = C.colossus.shellFlight,
        vx = (target - x) / flight,
        vy = (this.warningY - y + 0.5 * 800 * flight * flight) / flight;
      shots.spawn({
        owner: "enemy",
        x,
        y,
        direction: vx >= 0 ? 1 : -1,
        pitch: Math.atan2(vy, Math.abs(vx)),
        speed: Math.hypot(vx, vy),
        damage: 1,
        range: 2000,
        gravity: 800,
        kind: "cannon",
        blastRadius: 65,
      });
    } else {
      const pitch =
        Math.atan2(this.lockedY - y, Math.abs(this.warningX - x)) +
        (index === 0 ? 0 : index % 2 ? 0.055 : -0.055);
      shots.spawn({
        owner: "enemy",
        x,
        y,
        direction: this.facing,
        pitch,
        speed: 360,
        damage: 1,
        range: 1450,
        kind: "cannon",
        blastRadius: 35,
      });
    }
  }
}

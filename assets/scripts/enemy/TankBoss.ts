import { GameConfig as C } from "../core/GameConfig";
import { Rect, clamp } from "../core/Types";
import { DamageKind, Facing } from "../core/Types";
import { EnemySpawn } from "../level/LevelData";
import { LevelController } from "../level/LevelController";
import { PlayerController } from "../player/PlayerController";
import { ProjectileManager } from "../combat/ProjectileManager";
import { EnemyController } from "./EnemyController";
/** Two attack phases with locked, visible landing points and bounded reinforcement waves. */
export class TankBoss extends EnemyController {
  active = false;
  warningX = 0;
  warningTime = 0;
  mode: "dormant" | "aiming" | "recovering" | "destroyed" = "dormant";
  summons = 0;
  private summonTime = 8;
  private secondShell = 0;
  private targetX = 0;
  private targetY = 150;
  readonly miniBoss: boolean;
  onSummon?: (x: number) => void;
  private box: Rect = { x: 0, y: 0, w: 240, h: 125 };
  constructor(data: EnemySpawn) {
    super(data);
    this.miniBoss = data.encounter === "mini";
    this.halfWidth = 110;
    this.height = 125;
    this.attackCooldown = 2;
  }
  get phase(): 1 | 2 {
    return this.health <= this.maxHealth * 0.5 ? 2 : 1;
  }
  override takeDamage(
    amount: number,
    _direction: Facing,
    _kind?: DamageKind,
  ): boolean {
    if (!this.alive || !this.active) return false;
    this.health = Math.max(0, this.health - amount);
    this.hitTime = 0.14;
    if (!this.alive) {
      this.mode = "destroyed";
      this.state = "Dead";
      this.warningTime = 0;
      this.secondShell = 0;
    }
    return true;
  }
  override get bounds(): Rect {
    this.box.x = this.x - 120;
    this.box.y = this.y + 4;
    return this.box;
  }
  override update(
    dt: number,
    p: PlayerController,
    level: LevelController,
    projectiles: ProjectileManager,
  ): void {
    this.animationTime += dt;
    this.hitTime = Math.max(0, this.hitTime - dt);
    this.recoil = Math.max(0, this.recoil - dt * 4);
    if (!this.alive) {
      this.mode = "destroyed";
      this.state = "Dead";
      this.deadTime += dt;
      return;
    }
    this.active = this.miniBoss
      ? Math.abs(p.x - this.x) < 740
      : level.data.arena
        ? level.arenaEntered
        : Math.abs(p.x - this.x) < 800;
    if (!this.active || !p.alive) {
      this.state = "Idle";
      this.mode = "dormant";
      this.windup = 0;
      this.warningTime = 0;
      this.secondShell = 0;
      return;
    }
    this.facing = p.x > this.x ? 1 : -1;
    this.state = "Attack";
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.warningTime = Math.max(0, this.warningTime - dt);
    this.summonTime -= dt;
    if (
      !this.miniBoss &&
      this.summonTime <= 0 &&
      this.summons < C.boss.maxSummons
    ) {
      this.summonTime = C.boss.summonInterval;
      this.onSummon?.(this.x - 300);
      this.summons += 2;
    }
    if (this.secondShell > 0) {
      this.secondShell -= dt;
      if (this.secondShell <= 0) this.shell(this.targetX + 75, projectiles);
    }
    if (this.attackCooldown === 0 && this.windup === 0) {
      this.windup = this.phase === 1 ? C.boss.firstWindup : C.boss.secondWindup;
      this.targetX = clamp(
        p.x + p.vx * 0.4,
        (this.miniBoss ? 0 : (level.data.arena?.start ?? 0)) + 50,
        (this.miniBoss
          ? level.data.width
          : (level.data.arena?.end ?? level.data.width)) - 50,
      );
      this.warningX = this.targetX;
      this.targetY = level.groundY(this.targetX);
      this.warningTime =
        this.windup + C.boss.shellFlight + (this.phase === 2 ? 0.2 : 0);
      this.mode = "aiming";
    }
    if (this.windup > 0) {
      this.windup = Math.max(0, this.windup - dt);
      if (this.windup === 0) {
        this.shell(this.targetX, projectiles);
        if (this.phase === 2) this.secondShell = 0.2;
        this.attackCooldown =
          this.phase === 1 ? C.boss.firstInterval : C.boss.secondInterval;
        this.mode = "recovering";
      }
    }
    if (Math.abs(p.x - this.x) < 122 && p.y < this.y + 100)
      p.takeDamage(1, p.x < this.x ? -1 : 1);
  }
  private shell(target: number, projectiles: ProjectileManager): void {
    const x = this.x + this.facing * 123,
      y = this.y + 92,
      flight = C.boss.shellFlight;
    const vx = (target - x) / flight,
      vy = (this.targetY - y + 0.5 * 800 * flight * flight) / flight,
      speed = Math.hypot(vx, vy);
    projectiles.spawn({
      owner: "enemy",
      x,
      y,
      direction: vx >= 0 ? 1 : -1,
      pitch: Math.atan2(vy, Math.abs(vx)),
      speed,
      damage: 1,
      range: 1800,
      gravity: 800,
      kind: "cannon",
      blastRadius: C.boss.blastRadius,
    });
    this.recoil = 2;
  }
}

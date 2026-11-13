import { GameConfig as C } from "../core/GameConfig";
import { Rect, clamp, DamageKind, Facing } from "../core/Types";
import { EnemySpawn } from "../level/LevelData";
import { LevelController } from "../level/LevelController";
import { PlayerController } from "../player/PlayerController";
import { ProjectileManager } from "../combat/ProjectileManager";
import { EnemyController } from "./EnemyController";
import { moveBoss } from "./BossMotion";
import { tankSocket } from "../render/TankPresentation";
import {
  findPursuitJump,
  jumpVelocityX,
  pursuitWalkTarget,
  PursuitJump,
} from "./GroundPursuit";

export type TankAttack = "bombard" | "burst" | "ram" | "fan";
export const TankAttackNames: Record<TankAttack, string> = {
  bombard: "落点炮击",
  burst: "锁线双发",
  ram: "蓄力冲撞",
  fan: "扇形散射",
};

/** Four readable commitments; relocation and ram remain real colliding movement. */
export class TankBoss extends EnemyController {
  active = false;
  warningX = 0;
  warningTime = 0;
  attack: TankAttack = "bombard";
  warningTargetY = 150;
  readonly warningPoints: { x: number; y: number }[] = [];
  readonly attackCounts: Record<TankAttack, number> = {
    bombard: 0,
    burst: 0,
    ram: 0,
    fan: 0,
  };
  mode:
    | "dormant"
    | "chasing"
    | "jump-tell"
    | "jumping"
    | "repositioning"
    | "aiming"
    | "recovering"
    | "ramming"
    | "destroyed" = "dormant";
  summons = 0;
  ramTime = 0;
  ramEndX = 0;
  moveTargetX = 0;
  movementTurns = 0;
  private moveTime = 0;
  private pendingAttack?: TankAttack;
  private bossJumpPlan?: PursuitJump;
  private bossNavCooldown = 0;
  private jumpTellTime = 0;
  private summonTime = 8;
  private secondShell = 0;
  private targetX = 0;
  private targetY = 150;
  private sequence = 0;
  private lockedPitch = 0;
  private secondTarget = 0;
  private secondTargetY = 150;
  readonly miniBoss: boolean;
  onSummon?: (x: number) => void;
  private box: Rect = { x: 0, y: 0, w: 168, h: 146 };

  constructor(data: EnemySpawn) {
    super(data);
    this.miniBoss = data.encounter === "mini";
    this.halfWidth = 84;
    this.height = 150;
    this.attackCooldown = this.miniBoss ? 0.45 : 1.15;
  }
  get phase(): 1 | 2 {
    return this.health <= this.maxHealth * 0.5 ? 2 : 1;
  }
  get attackName(): string {
    if (this.mode === "jump-tell") return "蓄力跃进";
    if (this.mode === "jumping") return this.vy > 0 ? "跳跃追击" : "落地";
    if (this.mode === "chasing") return "追击";
    if (this.mode === "repositioning")
      return (this.moveTargetX - this.x) * this.facing > 0
        ? "逼近换位"
        : "后撤换位";
    return this.mode === "ramming" ? "冲撞！" : TankAttackNames[this.attack];
  }
  get muzzle() {
    return tankSocket(this);
  }
  override get action(): string {
    return this.mode === "jump-tell"
      ? "jump-tell"
      : this.mode === "jumping"
        ? "jump"
        : this.mode === "repositioning" || this.mode === "chasing"
          ? "walk"
          : this.mode === "ramming"
            ? "ram"
            : this.attack === "ram" && this.windup > 0
              ? "ram-tell"
              : this.attack;
  }
  override get bounds(): Rect {
    this.box.x = this.x - this.halfWidth;
    this.box.y = this.y + 4;
    return this.box;
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
      this.cancelAttack();
    }
    return true;
  }
  override recoverAfterRevive(): void {
    if(!this.alive)return;
    super.recoverAfterRevive(); this.cancelAttack();
    this.bossJumpPlan=undefined; this.jumpTellTime=0;
    if(this.active)this.mode="recovering";
    this.attackCooldown=Math.max(1,this.attackCooldown);
  }
  private cancelAttack(): void {
    this.warningTime =
      this.windup =
      this.secondShell =
      this.ramTime =
      this.moveTime =
      this.vx =
        0;
    this.pendingAttack = undefined;
    this.warningPoints.length = 0;
  }
  override update(
    dt: number,
    p: PlayerController,
    level: LevelController,
    shots: ProjectileManager,
  ): void {
    this.animationTime += dt;
    this.hitTime = Math.max(0, this.hitTime - dt);
    this.recoil = Math.max(0, this.recoil - dt * 4);
    const left = this.miniBoss
      ? this.halfWidth
      : Math.max(this.halfWidth, this.spawn.x - C.boss.patrolRadius);
    const right = this.miniBoss
      ? Math.min(
          level.data.width - this.halfWidth,
          (level.data.arena?.start ?? level.data.width) - 160,
        )
      : Math.min(
          level.data.width - this.halfWidth,
          this.spawn.x + C.boss.patrolRadius,
        );
    if (!this.alive) {
      this.deadTime += dt;
      moveBoss(this, level, dt, 0, 0, level.data.width, 94);
      return;
    }
    this.active = this.miniBoss
      ? Math.abs(p.x - this.x) < (this.active ? 1600 : 900)
      : level.data.arena
        ? level.arenaEntered
        : Math.abs(p.x - this.x) < 800;
    if (!this.active || !p.alive) {
      this.state = "Idle";
      this.mode = "dormant";
      this.cancelAttack();
      moveBoss(this, level, dt, 0, left, right, 94);
      return;
    }
    this.state = "Attack";
    this.warningTime = Math.max(0, this.warningTime - dt);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.bossNavCooldown = Math.max(0, this.bossNavCooldown - dt);
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
    if (this.mode === "jumping") {
      const before = this.x;
      moveBoss(
        this,
        level,
        dt,
        this.bossJumpPlan ? jumpVelocityX(this.bossJumpPlan, this) : this.vx,
        left,
        right,
        94,
      );
      this.contact(p, before);
      if (this.grounded) {
        this.bossJumpPlan = undefined;
        this.mode = "recovering";
        this.vx = 0;
        this.attackCooldown = Math.max(this.attackCooldown, 0.3);
      }
      return;
    }
    let physicsStepped = false;
    if (this.mode === "jump-tell") {
      moveBoss(this, level, dt, 0, left, right, 94);
      this.jumpTellTime = Math.max(0, this.jumpTellTime - dt);
      if (this.jumpTellTime === 0 && this.grounded) {
        this.vy = this.bossJumpPlan!.velocity;
        this.grounded = false;
        this.jumpCount++;
        this.mode = "jumping";
      } else if (!this.grounded) {
        this.bossJumpPlan = undefined;
        this.mode = "jumping";
      }
      return;
    }
    const committed =
      this.windup > 0 || this.secondShell > 0 || this.mode === "ramming";
    const recovering =
      this.mode === "recovering" && this.attackCooldown > this.recovery - 0.3;
    if (this.miniBoss && !committed && !recovering && this.grounded) {
      const raised = p.grounded && p.y > this.y + 35;
      const chase =
        Math.abs(p.x - this.x) > 500 ||
        (p.grounded && Math.abs(p.y - this.y) > 35);
      const target = raised
        ? { x: p.x, y: p.y }
        : {
            x: this.mode === "repositioning" ? this.moveTargetX : p.x,
            y: this.y,
          };
      if (this.bossNavCooldown === 0) {
        this.bossNavCooldown = 0.25;
        const plan = findPursuitJump(
          this,
          level,
          target,
          C.boss.jumpSpeed,
          C.boss.jumpVelocity,
        );
        if (plan) {
          this.bossJumpPlan = plan;
          this.jumpTellTime = C.boss.jumpTell;
          this.mode = "jump-tell";
          this.facing = plan.targetX >= this.x ? 1 : -1;
          this.vx = 0;
          this.warningTime = 0;
          this.warningPoints.length = 0;
          this.bossNavCooldown = 0.8;
          moveBoss(this, level, dt, 0, left, right, 94);
          return;
        }
      }
      if (chase) {
        this.mode = "chasing";
        this.state = "Chase";
        this.facing = p.x >= this.x ? 1 : -1;
        this.moveTargetX = clamp(
          pursuitWalkTarget(this, p, level),
          left,
          right,
        );
        const before = this.x,
          delta = this.moveTargetX - this.x;
        const moved = moveBoss(
          this,
          level,
          dt,
          Math.sign(delta) * Math.min(C.boss.chaseSpeed, Math.abs(delta) / dt),
          left,
          right,
          94,
        );
        physicsStepped = true;
        this.contact(p, before);
        if (!this.grounded) {
          this.bossJumpPlan = undefined;
          this.mode = "jumping";
          return;
        }
        if (Math.abs(moved) > 0.001) return;
        // Unreachable tall walls do not cause repeated jumps or suppress all attacks.
        this.mode = "recovering";
      } else if (this.mode === "chasing") this.mode = "recovering";
    }
    if (this.mode === "repositioning") {
      this.facing = p.x > this.x ? 1 : -1;
      const remaining = this.moveTargetX - this.x,
        speed =
          this.phase === 1
            ? C.boss.repositionSpeed
            : C.boss.enragedRepositionSpeed;
      const before = this.x,
        moved = moveBoss(
          this,
          level,
          dt,
          Math.sign(remaining) * Math.min(speed, Math.abs(remaining) / dt),
          left,
          right,
          94,
        );
      this.moveTime = Math.max(0, this.moveTime - dt);
      this.contact(p, before);
      if (!this.grounded) {
        this.bossJumpPlan = undefined;
        this.mode = "jumping";
        return;
      }
      if (
        this.moveTime > 0 &&
        Math.abs(this.moveTargetX - this.x) > 3 &&
        Math.abs(moved) > 0.001
      ) {
        this.state = "Chase";
        return;
      }
      this.mode = "recovering";
      this.vx = 0;
      return;
    }
    if (this.mode === "ramming") {
      const before = this.x;
      const moved = moveBoss(
        this,
        level,
        dt,
        this.facing * C.boss.ramSpeed,
        left,
        right,
        94,
      );
      this.ramTime = Math.max(0, this.ramTime - dt);
      this.contact(p, before);
      if (
        this.ramTime === 0 ||
        Math.abs(moved) < 0.001 ||
        (this.ramEndX - this.x) * this.facing <= 0
      ) {
        this.ramTime = this.vx = this.warningTime = 0;
        this.attackCooldown = this.recovery;
        this.mode = "recovering";
      }
      return;
    }
    if (this.windup === 0 && this.secondShell === 0)
      this.facing = p.x > this.x ? 1 : -1;
    this.vx = 0;
    if (
      !this.miniBoss &&
      this.mode === "recovering" &&
      this.attackCooldown > 0.25 &&
      this.secondShell === 0
    ) {
      const distance = Math.abs(p.x - this.x);
      const direction =
        distance > 290 ? this.facing : distance < 210 ? -this.facing : 0;
      if (direction) {
        moveBoss(
          this,
          level,
          dt,
          direction * C.boss.patrolSpeed,
          left,
          right,
          94,
        );
        physicsStepped = true;
      }
    }
    if (this.secondShell > 0) {
      this.secondShell = Math.max(0, this.secondShell - dt);
      if (this.secondShell === 0) {
        if (this.attack === "burst") this.round(shots);
        else this.shell(this.secondTarget, this.secondTargetY, shots);
      }
    }
    if (
      this.attackCooldown === 0 &&
      this.windup === 0 &&
      this.secondShell === 0
    ) {
      if (this.miniBoss && !this.pendingAttack) {
        this.pendingAttack = (["burst", "ram", "fan", "bombard"] as const)[
          this.sequence++ % 4
        ];
        const distance = Math.abs(p.x - this.x),
          desired =
            this.pendingAttack === "ram"
              ? 270
              : this.pendingAttack === "bombard"
                ? 395
                : 340;
        // Commit to a short lane change. No input-reading dodge, invulnerability
        // or per-frame direction oscillation; blocked movement ends the step.
        const shift =
          Math.abs(distance - desired) < 35
            ? this.sequence % 2
              ? 65
              : -65
            : 0;
        this.moveTargetX = clamp(
          p.x - this.facing * desired + shift,
          left,
          right,
        );
        const delta = Math.abs(this.moveTargetX - this.x),
          speed =
            this.phase === 1
              ? C.boss.repositionSpeed
              : C.boss.enragedRepositionSpeed;
        if (delta > 16) {
          this.moveTime = Math.min(1.25, Math.max(0.35, delta / speed));
          this.movementTurns++;
          this.mode = "repositioning";
          this.warningTime = 0;
          this.warningPoints.length = 0;
          if (!physicsStepped) moveBoss(this, level, dt, 0, left, right, 94);
          return;
        }
      }
      this.attack = this.pendingAttack ?? "bombard";
      this.pendingAttack = undefined;
      const ramReach =
        C.boss.ramSpeed * C.boss.ramDuration +
        this.halfWidth +
        p.halfWidth -
        12;
      if (this.attack === "ram" && Math.abs(p.x - this.x) > ramReach)
        this.attack = "fan";
      this.vx = 0;
      this.windup =
        this.attack === "ram"
          ? C.boss.ramWindup
          : this.miniBoss
            ? this.phase === 1
              ? C.boss.miniWindup
              : C.boss.miniEnragedWindup
            : this.phase === 1
              ? C.boss.firstWindup
              : C.boss.secondWindup;
      this.targetX = clamp(p.x + p.vx * 0.25, 50, level.data.width - 50);
      this.warningX = this.targetX;
      this.targetY = level.groundY(this.targetX);
      this.secondTarget = clamp(
        this.targetX + 100 * this.facing,
        50,
        level.data.width - 50,
      );
      this.secondTargetY = level.groundY(this.secondTarget);
      this.warningTargetY = p.y + 35;
      const muzzle = this.muzzle;
      this.lockedPitch = Math.atan2(
        this.warningTargetY - muzzle.y,
        Math.abs(this.targetX - muzzle.x),
      );
      this.aimPitch = this.lockedPitch;
      // Brake with the front hull crossing the committed target, rather than
      // running through it to the patrol edge and getting pinned at the border.
      const ramTravel = Math.min(
        C.boss.ramSpeed * C.boss.ramDuration,
        Math.max(
          90,
          (this.targetX - this.x) * this.facing - this.halfWidth * 0.55,
        ),
      );
      this.ramEndX = clamp(this.x + this.facing * ramTravel, left, right);
      this.warningPoints.length = 0;
      if (this.attack === "bombard") {
        this.warningPoints.push({ x: this.targetX, y: this.targetY });
        if (this.phase === 2)
          this.warningPoints.push({
            x: this.secondTarget,
            y: this.secondTargetY,
          });
      }
      this.warningTime =
        this.windup +
        (this.attack === "ram"
          ? C.boss.ramDuration
          : this.attack === "bombard"
            ? C.boss.shellFlight + 0.3
            : C.enemyTactics.tankBurstInterval);
      this.mode = "aiming";
    }
    if (this.windup > 0) {
      this.windup = Math.max(0, this.windup - dt);
      if (this.windup === 0) {
        this.attackCounts[this.attack]++;
        if (this.attack === "ram") {
          this.mode = "ramming";
          this.ramTime = C.boss.ramDuration;
        } else {
          if (this.attack === "burst") {
            this.round(shots);
            this.secondShell = C.enemyTactics.tankBurstInterval;
          } else if (this.attack === "fan") {
            for (const spread of [-C.boss.fanSpread, 0, C.boss.fanSpread])
              this.round(shots, spread);
          } else {
            this.shell(this.targetX, this.targetY, shots);
            if (this.phase === 2) this.secondShell = 0.3;
          }
          this.attackCooldown = this.recovery;
          this.mode = "recovering";
        }
      }
    }
    // Aiming, recovery and unsupported idle poses never suspend gravity.
    if (!physicsStepped) moveBoss(this, level, dt, 0, left, right, 94);
    this.contact(p, this.x);
  }
  private get recovery(): number {
    return this.miniBoss
      ? this.phase === 1
        ? C.boss.miniRecovery
        : C.boss.miniEnragedRecovery
      : this.phase === 1
        ? C.boss.firstInterval
        : C.boss.secondInterval;
  }
  private contact(p: PlayerController, oldX: number): void {
    if (
      p.x + p.halfWidth > Math.min(oldX, this.x) - this.halfWidth &&
      p.x - p.halfWidth < Math.max(oldX, this.x) + this.halfWidth &&
      p.y < this.y + 102 &&
      p.y + p.height > this.y + 4
    )
      p.takeDamage(1, p.x < this.x ? -1 : 1);
  }
  private round(shots: ProjectileManager, spread = 0): void {
    this.recoil = 1.5;
    const { x, y } = this.muzzle;
    shots.spawn({
      owner: "enemy",
      x,
      y,
      originX: this.x,
      originY: y,
      direction: this.facing,
      pitch: this.lockedPitch + spread,
      speed: C.enemyTactics.tankBurstSpeed,
      damage: 1,
      range: 1050,
      kind: "bullet",
      visual: "mech-round",
      tier: this.miniBoss?'mini':'boss',
    });
  }
  private shell(
    target: number,
    targetY: number,
    shots: ProjectileManager,
  ): void {
    this.recoil = 2;
    const { x, y } = this.muzzle,
      flight = C.boss.shellFlight;
    const vx = (target - x) / flight,
      vy = (targetY - y + 0.5 * 800 * flight * flight) / flight;
    shots.spawn({
      owner: "enemy",
      x,
      y,
      originX: this.x,
      originY: y,
      direction: vx >= 0 ? 1 : -1,
      pitch: Math.atan2(vy, Math.abs(vx)),
      speed: Math.hypot(vx, vy),
      damage: 1,
      range: 1800,
      gravity: 800,
      kind: "cannon",
      blastRadius: C.boss.blastRadius,
      visual: "mech-shell",
      tier: this.miniBoss?'mini':'boss',
    });
  }
}

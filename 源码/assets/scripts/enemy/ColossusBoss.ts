import { GameConfig as C } from "../core/GameConfig";
import { Rect, Facing, DamageKind, clamp } from "../core/Types";
import type { EnemySpawn } from "../level/LevelData";
import type { LevelController } from "../level/LevelController";
import type { PlayerController } from "../player/PlayerController";
import type { ProjectileManager } from "../combat/ProjectileManager";
import { EnemyController } from "./EnemyController";
import { BossBeam } from "../combat/BossBeam";
import { colossusSocket } from "../render/ColossusPresentation";
import { moveBoss } from "./BossMotion";
import { findPursuitJump, jumpVelocityX, pursuitWalkTarget, PursuitJump } from "./GroundPursuit";

export type ColossusAttack =
  | "salvo"
  | "sweep"
  | "stomp"
  | "laser"
  | "missiles"
  | "burst"
  | "charge"
  | "leap";
export const ColossusAttackNames: Record<ColossusAttack, string> = {
  salvo: "重炮轰击",
  sweep: "瞄准连射",
  stomp: "踏地冲击",
  laser: "蓄能激光",
  missiles: "肩部导弹",
  burst: "扇形机炮",
  charge: "装甲冲锋",
  leap: "跃进砸地",
};
const firstPattern: readonly ColossusAttack[] = [
  "salvo",
  "charge",
  "laser",
  "leap",
  "missiles",
  "sweep",
  "stomp",
  "burst",
];
// Mobility is followed by a different response: land -> fan, rush -> waves,
// artillery -> locked beam. Every follow-up still has its own warning.
const enragedPattern: readonly ColossusAttack[] = [
  "leap",
  "burst",
  "charge",
  "stomp",
  "missiles",
  "laser",
  "sweep",
  "salvo",
];

export class ColossusBoss extends EnemyController {
  readonly playerBulletDamageMultiplier = C.playerBossDamage.bullet / C.weapons.rifle.damage;
  active = false;
  mode:
    | "dormant"
    | "entering"
    | "moving"
    | "aiming"
    | "recovering"
    | "charging"
    | "leaping"
    | "enraging"
    | "destroyed" = "dormant";
  attack: ColossusAttack = "salvo";
  introTime: number = C.colossus.intro;
  warningX = 0;
  warningTime = 0;
  warningY = 150;
  readonly warningPoints: { x: number; y: number }[] = [];
  summons = 0;
  impactSerial = 0;
  moveTime = 0;
  movementTurns = 0;
  chargeEndX = 0;
  chargeTime = 0;
  leapTargetX = 0;
  enrageTime = 0;
  readonly beam = new BossBeam();
  readonly attackCounts: Record<ColossusAttack, number> = {
    salvo: 0,
    sweep: 0,
    stomp: 0,
    laser: 0,
    missiles: 0,
    burst: 0,
    charge: 0,
    leap: 0,
  };
  private moveDirection: Facing = -1;
  private movedBeforeAttack = false;
  private introduced = false;
  private pursuing = false;
  private pursuitPlan?: PursuitJump;
  private pursuitCheck = 0;
  plannedLeapTop = 0;
  private enraged = false;
  private sequence = 0;
  private pendingShots = 0;
  private shotDelay = 0;
  private emissionIndex = 0;
  private lockedY = 185;
  private summonTime = 10;
  private box: Rect = {
    x: 0,
    y: 0,
    w: C.colossus.halfWidth * 2 * C.colossus.sizeScale,
    h: (C.colossus.height - C.colossus.hitInset * 2) * C.colossus.sizeScale,
  };
  onSummon?: (x: number) => void;

  constructor(data: EnemySpawn) {
    super(data);
    this.halfWidth = C.colossus.halfWidth * C.colossus.sizeScale;
    this.height = C.colossus.height * C.colossus.sizeScale;
    this.attackCooldown = 0.45;
  }
  get phase(): 1 | 2 {
    return this.health <= this.maxHealth * 0.5 ? 2 : 1;
  }
  get laserTime() {
    return this.beam.time;
  }
  get warningTargetY() {
    return this.lockedY;
  }
  get muzzle() {
    return colossusSocket(this);
  }
  get attackName() {
    return this.mode === "enraging"
      ? "装甲过载"
      : this.mode === "moving"
        ? this.moveDirection === this.facing
          ? "步进逼近"
          : "后撤换位"
        : ColossusAttackNames[this.attack];
  }
  override get action(): string {
    return this.mode === "entering"
      ? "intro"
      : this.mode === "enraging"
        ? "enrage"
        : this.mode === "moving"
          ? "walk"
          : this.mode === "charging"
            ? "charging"
            : this.mode === "leaping"
              ? "leaping"
              : this.attack;
  }
  override get bounds(): Rect {
    this.box.x = this.x - this.halfWidth;
    this.box.y = this.y + C.colossus.hitInset * C.colossus.sizeScale;
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
      this.cancelAttack();
    }
    return true;
  }
  override recoverAfterRevive(): void {
    if(!this.alive)return;
    super.recoverAfterRevive(); this.cancelAttack(); this.shotDelay=0;
    if(this.active)this.mode="recovering";
    this.attackCooldown=Math.max(1,this.attackCooldown);
  }
  private cancelAttack() {
    this.windup =
      this.warningTime =
      this.pendingShots =
      this.moveTime =
      this.chargeTime =
      this.vx =
        0;
    this.warningPoints.length = 0;
    this.movedBeforeAttack = false;
    this.pursuing = false;
    this.pursuitPlan = undefined;
    this.beam.stop();
  }
  private get recovery() {
    return this.phase === 1
      ? C.colossus.firstRecovery
      : C.colossus.secondRecovery;
  }
  private recover() {
    this.mode = "recovering";
    this.vx = 0;
    this.attackCooldown = this.recovery;
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
    const left =
        Math.min(this.x, level.retreatLimit + this.halfWidth + C.colossus.edgeClearance),
      right =
        (level.data.arena?.end ?? level.data.width) -
        this.halfWidth -
        C.colossus.edgeClearance;
    const step = (vx: number) =>
      moveBoss(this, level, dt, vx, left, right, C.colossus.strideLength);
    if (!this.alive) {
      this.deadTime += dt;
      step(0);
      return;
    }
    // Crossing the entrance starts an encounter; retreating never resets it.
    this.active ||= level.arenaVisited || level.arenaEntered;
    if (!this.active || !p.alive) {
      this.state = "Idle";
      this.mode = "dormant";
      this.cancelAttack();
      step(0);
      return;
    }
    if (!this.introduced) {
      this.mode = "entering";
      this.state = "Idle";
      this.introTime = Math.max(0, this.introTime - dt);
      if (this.introTime === 0) this.introduced = true;
      step(0);
      return;
    }
    this.state = "Attack";
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.warningTime = Math.max(0, this.warningTime - dt);
    this.summonTime -= dt;
    this.pursuitCheck = Math.max(0, this.pursuitCheck - dt);
    if (this.summonTime <= 0 && this.summons < C.colossus.maxSummons) {
      this.summonTime = C.colossus.summonInterval;
      this.onSummon?.(this.x - 340);
      this.summons += 2;
    }

    if (this.mode === "charging") {
      const before = this.x,
        distance = step(this.facing * C.colossus.chargeSpeed);
      this.chargeTime = Math.max(0, this.chargeTime - dt);
      this.contact(p, before, 110);
      if (
        this.chargeTime === 0 ||
        Math.abs(distance) < 0.001 ||
        (this.chargeEndX - this.x) * this.facing <= 0
      ) {
        this.chargeTime = 0;
        this.recover();
      }
      return;
    }
    if (this.mode === "leaping") {
      const before = this.x;
      step(this.pursuitPlan ? jumpVelocityX(this.pursuitPlan, this) :
        clamp(
          (this.leapTargetX - this.x) * 7,
          -C.colossus.leapSpeed,
          C.colossus.leapSpeed,
        ),
      );
      if (this.vy < 0) this.contact(p, before, 170);
      if (this.grounded) {
        this.pursuitPlan = undefined;
        this.recoil = 2;
        this.impactSerial++;
        this.waves(shots);
        this.recover();
      }
      return;
    }
    if (this.mode === "enraging") {
      step(0);
      this.enrageTime = Math.max(0, this.enrageTime - dt);
      if (this.enrageTime === 0) {
        this.recover();
        this.attackCooldown = 0.25;
      }
      return;
    }
    const committed = this.windup > 0 || this.pendingShots > 0 || this.beam.active;
    const breathing = this.mode === "recovering" && this.attackCooldown > this.recovery - .3;
    if (!committed && !breathing && this.grounded) {
      if (this.pursuitCheck === 0) {
        this.pursuitCheck = .3;
        const plan = findPursuitJump(this, level,
          { x: clamp(p.x, left, right), y: p.grounded ? p.y : this.y },
          C.colossus.leapSpeed, 660);
        if (plan) {
          this.pursuitPlan = plan;
          this.attack = "leap";
          this.facing = plan.targetX >= this.x ? 1 : -1;
          this.leapTargetX = this.warningX = plan.targetX;
          this.warningY = plan.surface ? plan.surface.y + plan.surface.h : level.groundY(plan.targetX);
          this.plannedLeapTop = this.y + plan.velocity ** 2 / (2 * C.player.gravity);
          this.windup = C.colossus.leapWindup;
          this.warningTime = this.windup + 1.5;
          this.warningPoints.length = 0;
          this.warningPoints.push({ x: this.warningX, y: this.warningY });
          this.mode = "aiming";
          this.pursuitCheck = 1.2;
          this.moveTime = 0;
          this.pursuing = false;
          step(0);
          return;
        }
      }
      const needsChase = Math.abs(p.x - this.x) > 520 || p.y < this.y - 35;
      if (needsChase) {
        if (!this.pursuing) this.movementTurns++;
        this.pursuing = true;
        this.mode = "moving";
      }
    }
    if (this.mode === "moving") {
      if (this.pursuing) {
        // Keep the player's escape apron even while descending. If the near
        // lip cannot clear the full hull inside these bounds, walk off the
        // opposite lip rather than dropping onto the player at the screen edge.
        const target = clamp(pursuitWalkTarget(this, p, level, left, right), left, right);
        this.moveDirection = target >= this.x ? 1 : -1;
        this.facing = p.x >= this.x ? 1 : -1;
      }
      const before = this.x,
        speed =
          this.pursuing
            ? this.phase === 1 ? C.colossus.chaseSpeed : C.colossus.enragedChaseSpeed
            : this.phase === 1 ? C.colossus.walkSpeed : C.colossus.enragedWalkSpeed;
      const distance = step(this.moveDirection * speed);
      this.moveTime = Math.max(0, this.moveTime - dt);
      this.contact(p, before);
      if ((this.pursuing ? Math.abs(p.x - this.x) > 480 || p.y < this.y - 35 : this.moveTime > 0) && Math.abs(distance) > 0.001) {
        this.state = "Chase";
        return;
      }
      this.moveTime = this.vx = 0;
      this.pursuing = false;
      this.movedBeforeAttack = true;
      this.mode = "recovering";
    } else step(0);

    if (this.windup === 0 && this.pendingShots === 0 && !this.beam.active)
      this.facing = p.x > this.x ? 1 : -1;
    if (this.pendingShots > 0) {
      this.shotDelay -= dt;
      if (this.shotDelay <= 0) {
        this.emit(shots, ++this.emissionIndex);
        this.pendingShots--;
        this.shotDelay =
          this.attack === "burst"
            ? 0.18
            : this.attack === "missiles"
              ? 0.27
              : 0.22;
        this.attackCooldown = this.recovery;
      }
    }
    this.beam.update(dt, p, level.solids);
    if (this.windup > 0) {
      this.windup = Math.max(0, this.windup - dt);
      if (this.windup === 0) {
        this.attackCounts[this.attack]++;
        if (this.attack === "charge") {
          this.mode = "charging";
          shots.audio.emit("charge", this.x, this.y + 70);
          this.chargeTime = C.colossus.chargeDuration;
        } else if (this.attack === "leap") {
          this.mode = "leaping";
          this.vy = this.pursuitPlan?.velocity ?? C.colossus.leapVelocity;
          this.grounded = false;
          this.jumpCount++;
        } else {
          this.emit(shots, 0);
          this.pendingShots = ["stomp", "laser"].includes(this.attack)
            ? 0
            : this.phase === 2
              ? 2
              : 1;
          this.shotDelay = 0.22;
          this.recover();
        }
      }
      return;
    }
    if (
      this.attackCooldown === 0 &&
      this.pendingShots === 0 &&
      !this.beam.active &&
      this.grounded
    ) {
      if (this.phase === 2 && !this.enraged) {
        this.enraged = true;
        this.sequence = 0;
        this.enrageTime = C.colossus.enrageDuration;
        this.mode = "enraging";
        this.movedBeforeAttack = false;
        this.warningTime = 0;
        return;
      }
      if (
        !this.movedBeforeAttack &&
        (this.sequence % 2 === 1 || Math.abs(p.x - this.x) > 620)
      ) {
        const retreat = Math.abs(p.x - this.x) < 300 || this.sequence % 6 === 5;
        this.moveDirection = (retreat ? -this.facing : this.facing) as Facing;
        if (
          (this.x < left + 90 && this.moveDirection < 0) ||
          (this.x > right - 90 && this.moveDirection > 0)
        )
          this.moveDirection = -this.moveDirection as Facing;
        this.moveTime = C.colossus.walkDuration * (this.phase === 2 ? 1.2 : 1);
        this.movementTurns++;
        this.mode = "moving";
        this.warningTime = 0;
        this.warningPoints.length = 0;
        return;
      }
      this.movedBeforeAttack = false;
      this.prepareAttack(p, level, left, right);
    }
    this.contact(p, this.x);
  }

  private prepareAttack(
    p: PlayerController,
    level: LevelController,
    left: number,
    right: number,
  ) {
    this.pursuitPlan = undefined;
    const pattern = this.phase === 1 ? firstPattern : enragedPattern;
    this.attack = pattern[this.sequence++ % pattern.length];
    this.windup =
      this.attack === "charge"
        ? C.colossus.chargeWindup
        : this.attack === "leap"
          ? C.colossus.leapWindup
          : this.attack === "laser"
            ? C.colossus.laserWindup * (this.phase === 2 ? 0.84 : 1)
            : this.phase === 1
              ? C.colossus.firstWindup
              : C.colossus.secondWindup;
    this.emissionIndex = 0;
    this.warningX = clamp(
      p.x + p.vx * 0.18,
      level.retreatLimit + 30,
      level.data.width - 60,
    );
    this.warningY = level.groundY(this.warningX);
    this.lockedY = p.y + 35;
    this.warningPoints.length = 0;
    if (this.attack === "charge") {
      const travel = Math.min(
        C.colossus.chargeSpeed * C.colossus.chargeDuration,
        Math.max(
          100,
          (this.warningX - this.x) * this.facing + this.halfWidth * 0.3,
        ),
      );
      this.chargeEndX = clamp(this.x + this.facing * travel, left, right);
    } else if (this.attack === "leap") {
      this.plannedLeapTop = this.y + C.colossus.leapVelocity ** 2 / (2 * C.player.gravity);
      const reach =
        ((C.colossus.leapSpeed * 2 * C.colossus.leapVelocity) /
          C.player.gravity) *
        0.9;
      this.leapTargetX = clamp(
        this.warningX,
        Math.max(left, this.x - reach),
        Math.min(right, this.x + reach),
      );
      this.warningX = this.leapTargetX;
      this.warningY = level.groundY(this.warningX);
      this.warningPoints.push({ x: this.warningX, y: this.warningY });
    } else if (this.attack === "salvo" || this.attack === "missiles") {
      for (const offset of this.phase === 2 ? [0, 90, -90] : [0, 90]) {
        const x = clamp(this.warningX + offset, 30, level.data.width - 30);
        this.warningPoints.push({ x, y: level.groundY(x) });
      }
    }
    this.warningTime =
      this.windup +
      (this.attack === "missiles"
        ? C.colossus.missileFlight + 0.7
        : this.attack === "salvo"
          ? C.colossus.shellFlight + 0.65
          : this.attack === "leap"
            ? 1.4
            : this.attack === "charge"
              ? C.colossus.chargeDuration
              : 0.55);
    this.mode = "aiming";
  }
  private contact(p: PlayerController, oldX: number, height = 200) {
    if (
      p.x + p.halfWidth > Math.min(oldX, this.x) - this.halfWidth + 8 &&
      p.x - p.halfWidth < Math.max(oldX, this.x) + this.halfWidth - 8 &&
      p.y < this.y + height &&
      p.y + p.height > this.y
    )
      p.takeDamage(1, p.x < this.x ? -1 : 1);
  }
  private waves(shots: ProjectileManager) {
    shots.audio.emit("slam", this.x, this.y + 15);
    for (const d of [-1, 1] as const)
      shots.spawn({
        owner: "enemy",
        x: this.x + d * (this.halfWidth + 14),
        y: this.y + 14,
        originX: this.x,
        originY: this.y + 14,
        direction: d,
        speed: C.colossus.waveSpeed,
        damage: 1,
        range: 1050,
        kind: "shockwave",
        tier: "boss",
      });
    shots.particles.blast(this.x, this.y + 15, 100, this.y);
  }
  private emit(shots: ProjectileManager, index: number) {
    this.recoil = 2;
    if (this.attack === "laser") {
      this.beam.start(
        this.muzzle,
        { x: this.warningX, y: this.lockedY },
        C.colossus.laserRange,
        C.colossus.laserDuration,
      );
      shots.audio.emit("beam", this.muzzle.x, this.muzzle.y);
      this.impactSerial++;
      return;
    }
    if (this.attack === "stomp") {
      this.impactSerial++;
      this.waves(shots);
      return;
    }
    const socket =
      this.attack === "missiles"
        ? colossusSocket(this, index % 2 ? "rightPod" : "leftPod")
        : this.muzzle;
    const { x, y } = socket;
    if (this.attack === "salvo" || this.attack === "missiles") {
      const target = this.warningPoints[index] ?? {
          x: this.warningX,
          y: this.warningY,
        },
        missile = this.attack === "missiles";
      const flight = missile
          ? C.colossus.missileFlight
          : C.colossus.shellFlight,
        vx = (target.x - x) / flight,
        vy = (target.y - y + 0.5 * 800 * flight * flight) / flight;
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
        range: 2000,
        gravity: 800,
        kind: missile ? "rocket" : "cannon",
        blastRadius: 75,
        visual: missile ? "mech-missile" : "mech-shell",
        tier: "boss",
      });
    } else {
      const pitch =
          Math.atan2(this.lockedY - y, Math.abs(this.warningX - x)) +
          (index === 0 ? 0 : index % 2 ? 0.055 : -0.055),
        spread =
          this.attack === "burst"
            ? [-C.colossus.burstSpread, 0, C.colossus.burstSpread]
            : [0];
      for (const offset of spread)
        shots.spawn({
          owner: "enemy",
          x,
          y,
          originX: this.x,
          originY: y,
          direction: this.facing,
          pitch: pitch + offset,
          speed: this.attack === "burst" ? C.colossus.burstSpeed : 360,
          damage: 1,
          range: 1450,
          kind: this.attack === "burst" ? "bullet" : "cannon",
          blastRadius: this.attack === "burst" ? 0 : 35,
          visual: this.attack === "burst" ? "mech-round" : "mech-shell",
          tier: "boss",
        });
    }
  }
}

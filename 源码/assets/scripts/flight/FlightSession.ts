import { CameraFollow } from "../camera/CameraFollow";
import { ParticlePool } from "../combat/ParticlePool";
import { ProjectileManager } from "../combat/ProjectileManager";
import { projectileProfile } from "../combat/ProjectileProfile";
import { GameConfig as C } from "../core/GameConfig";
import { Damageable, DamageKind, Facing, GameState, InputFrame, Rect, Vec, clamp, overlaps, segmentRect } from "../core/Types";
import { VictorySequence } from "../core/VictorySequence";
import { swimMove } from "../ocean/SwimCollision";
import { PlayerController } from "../player/PlayerController";
import { FlightEnemyKind, FlightEnemySpawn, FlightLevel as L, FlightWeapon } from "./FlightLevel";

export type FlightMode = "approach" | "tell" | "fire" | "recover" | "charge" | "dead";
export type FlightAttack = "burst" | "missiles" | "sweep" | "dive";
export interface FlightDrop { x: number; y: number; kind: "medkit" | "rocket" | "airburst"; source: string; active: boolean; age: number }
export interface FlightEffect { x: number; y: number; kind: "hit" | "blast" | "trail"; size: number; age: number }
export interface FlightAirburst { active: boolean; x: number; y: number; vx: number; vy: number; age: number; fuse: number; radius: number }

/** Damageable adapters let the existing swept projectile pool own all bullet collisions. */
export class FlightEnemy implements Damageable {
  readonly id: string;
  readonly kind: FlightEnemyKind;
  readonly patrolMin: number;
  readonly patrolMax: number;
  x: number; y: number;
  vx = 0; vy = 0; facing: Facing = -1;
  hp: number; readonly maxHp: number;
  active = false; mode: FlightMode = "approach"; attack: FlightAttack = "burst";
  timer = .9; angle = Math.PI; age = 0; hit = 0; deadTime = 0;
  phase = 1; serial = 0; travel = 0; fireClock = 0; shotsLeft = 0;
  muzzleFlash = 0; flashPort = 0; flashMissile = false;
  attackCounts: Partial<Record<FlightAttack, number>> = {};
  constructor(spec: FlightEnemySpawn, private readonly damage: (enemy: FlightEnemy, amount: number, direction: Facing, kind?: DamageKind) => boolean) {
    this.id = spec.id; this.kind = spec.kind; this.x = spec.x; this.y = spec.y;
    this.patrolMin = spec.patrolMin; this.patrolMax = spec.patrolMax;
    this.hp = this.maxHp = spec.kind === "helicopter" ? 64 : 3;
  }
  get alive() { return this.hp > 0; }
  get bounds(): Rect {
    return this.kind === "helicopter" ? { x: this.x - 110, y: this.y, w: 220, h: 150 }
      : this.kind === "drone" ? { x: this.x - 35, y: this.y, w: 70, h: 48 }
      : { x: this.x - 17, y: this.y + 3, w: 34, h: 65 };
  }
  takeDamage(amount: number, direction: Facing, kind?: DamageKind) { return this.damage(this, amount, direction, kind); }
}

/** Flight has no gravity/fuel/water state; rendering and HUD only consume this simulation. */
export class FlightSession {
  readonly chapter = 3;
  readonly level = L;
  readonly player = new PlayerController();
  readonly camera = new CameraFollow();
  readonly victory = new VictorySequence();
  readonly particles = new ParticlePool();
  readonly projectiles = new ProjectileManager(this.particles);
  readonly dodgeDuration = L.dodgeCooldown;
  state: GameState = "playing";
  stage: "launch" | "flying" = "launch";
  time = 0; clearTime = 0; introTime = 0; introSeen = false;
  hitStop = 0; shakeTime = 0; shakePower = 0;
  furthestX = 0; retreatLimit = 0;
  weapon: FlightWeapon = "rifle"; storedWeapon: FlightWeapon = "rifle"; ammo = 0;
  cooldown = 0; attackCooldownDuration = .22;
  dodgeCooldown = 0; dodgeTime = 0; dodgeX = 1; dodgeY = 0; dodgeSerial = 0;
  aim = 0; aimTarget = ""; aimHold = 0; shooting = false;
  shots = 0; hits = 0; kills = 0; collected = 0; blastCount = 0; airburstThrown = 0;
  knifeTime = 0; knifeSerial = 0; protectedPress = false;
  lastShotWeapon: "rifle" | "rocket" = "rifle";
  lastShotMuzzle = { x: 0, y: 0, angle: 0, originX: 0, originY: 0 };
  message = "云端突围 · 自由飞行"; messageTime = 3;
  enemies: FlightEnemy[] = [];
  boss!: FlightEnemy;
  drops: FlightDrop[] = [];
  effects: FlightEffect[] = [];
  airbursts: FlightAirburst[] = [];
  readonly recoveryUsed = new Set<string>();
  private resumeState: GameState = "playing";
  private jumpPressed = false;
  private grenadePressed = false;
  private switchPressed = false;
  private knifeHit = false;
  private visibleHeight = 720;
  private targets: FlightEnemy[] = [];
  private solids: Rect[] = [];

  constructor() {
    const session = this;
    this.player.bindWeapon({ get id() { return session.weapon; } });
    this.projectiles.onExplosion = (x, y, radius, damage, owner) => this.explode(x, y, radius, damage, owner);
    this.reset();
  }
  reset(state: GameState = "playing"): void {
    this.state = state; this.resumeState = "playing"; this.stage = "launch";
    this.time = this.clearTime = this.introTime = 0;
    this.hitStop = this.shakeTime = this.shakePower = 0;
    this.player.reset(L.spawn.x, L.spawn.y); this.player.grounded = false;
    this.player.grenades = 3;
    this.camera.reset(L.spawn.x); this.camera.zoom = 1; this.camera.y = 40;
    this.victory.reset(); this.particles.reset(); this.projectiles.reset();
    this.weapon = this.storedWeapon = "rifle"; this.ammo = 0;
    this.cooldown = this.dodgeCooldown = this.dodgeTime = 0; this.attackCooldownDuration = .22;
    this.dodgeX = 1; this.dodgeY = this.dodgeSerial = 0;
    this.aim = this.aimHold = 0; this.aimTarget = ""; this.shooting = false;
    this.shots = this.hits = this.kills = this.collected = this.blastCount = this.airburstThrown = 0;
    this.knifeTime = this.knifeSerial = 0; this.knifeHit = this.protectedPress = false;
    this.lastShotWeapon = "rifle"; this.lastShotMuzzle = this.muzzle();
    this.furthestX = L.spawn.x; this.retreatLimit = 0;
    this.jumpPressed = this.grenadePressed = this.switchPressed = false;
    this.enemies = L.enemies.map(e => new FlightEnemy(e, (target, amount, direction, kind) => this.damageEnemy(target, amount, direction, kind)));
    this.boss = new FlightEnemy(L.boss, (target, amount, direction, kind) => this.damageEnemy(target, amount, direction, kind));
    this.drops = L.supplies.map(d => ({ ...d, active: true, age: 0 }));
    this.effects = []; this.airbursts = []; this.targets = []; this.recoveryUsed.clear();
    this.refreshSolids(); this.message = "云端突围 · 自由飞行"; this.messageTime = 3.2;
  }
  get mini() { return this.boss; }
  get introActive() { return this.stage === "launch"; }
  get controlEnabled() { return this.state === "playing" && !this.introActive && !this.victory.active; }
  get zone() { return L.zones.find(z => this.player.x < z.end) ?? L.zones[L.zones.length - 1]; }
  get weaponName() { return { rifle: "突击步枪", rocket: "追踪火箭筒", knife: "战术刀" }[this.weapon]; }
  get weaponIcon() { return `weapon.${this.weapon}` as `weapon.${FlightWeapon}`; }
  get boostCooldown() { return this.dodgeCooldown; }
  pause(): void { if (this.state === "playing" || this.state === "dying") { this.resumeState = this.state; this.state = "paused"; } }
  resume(): void { if (this.state === "paused") this.state = this.resumeState; }
  finishEntry(): void {
    this.stage = "flying"; this.introSeen = true; this.introTime = L.launchDuration;
    this.player.x = L.spawn.x; this.player.y = L.spawn.y; this.player.vx = this.player.vy = 0;
    this.message = "摇杆自由飞行 · 松手悬停 · 空格 / 闪避短喷"; this.messageTime = 5;
  }
  skipEntry(): void { if (this.introActive) this.finishEntry(); }
  setVisibleWidth(width: number): void { this.camera.visibleWidth = Math.max(320, width); }
  enemyBounds(e: FlightEnemy): Rect { return e.bounds; }
  bossBounds(): Rect { return this.boss.bounds; }
  lineClear(from: Vec, to: Vec): boolean { return !this.solids.some(r => segmentRect(from, to, r, 1) !== null); }
  get heldWeapon(): FlightWeapon {
    return this.player.recoil > 0 && this.weapon !== "knife" ? this.lastShotWeapon : this.weapon;
  }
  muzzle(weapon = this.heldWeapon, recoil = this.player.recoil) {
    const originX = this.player.x, originY = this.player.y + 44;
    const kick = weapon === "knife" || this.player.hitTime>0 ? 0 : Math.min(1,Math.max(0,recoil))**2*(weapon === "rocket" ? 7 : 4);
    const length = (weapon === "rocket" ? 58 : 42)-kick;
    return { x: originX + Math.cos(this.aim) * length, y: originY + Math.sin(this.aim) * length,
      angle: this.aim, originX, originY };
  }
  /** Real art sockets shared by tell lines, emitted shots, and the renderer. */
  enemyMuzzle(e: FlightEnemy, port = 0, missile = e.attack === "missiles") {
    const boss = e.kind === "helicopter";
    const originY = e.y + (boss ? (missile ? (port === 0 ? 50 : 20) : 24) : 35);
    const reach = boss ? (missile ? -27 : 140) : 42;
    if (boss) {
      // The full helicopter art is horizontal. Aim rotates the trajectory, not
      // the body-mounted socket; lock facing while a warning/volley is running.
      const x = e.x + e.facing * reach;
      return { x, y: originY, originX: x - e.facing * 16, originY, angle: e.angle };
    }
    const originX = e.x;
    return { originX, originY, x: originX + Math.cos(e.angle) * reach,
      y: originY + Math.sin(e.angle) * reach, angle: e.angle };
  }

  update(dt: number, input: InputFrame): void {
    if (!(dt > 0) || !["playing", "dying", "complete"].includes(this.state)) return;
    const jump = input.jump && !this.jumpPressed, grenade = !!input.grenade && !this.grenadePressed;
    const switchWeapon = !!input.switchWeapon && !this.switchPressed;
    this.jumpPressed = input.jump; this.grenadePressed = !!input.grenade; this.switchPressed = !!input.switchWeapon;
    // A bounded fixed slice also keeps direct model calls deterministic across 30/60/120 Hz.
    let remaining = Math.min(dt, .1), first = true;
    while (remaining > 1e-8) {
      const step = Math.min(remaining, C.fixedStep);
      this.step(step, { ...input, jump: first && jump, grenade: first && grenade, switchWeapon: first && switchWeapon });
      first = false; remaining -= step;
    }
  }
  private step(dt: number, input: InputFrame): void {
    const p = this.player;
    this.effects = this.effects.filter(f => (f.age += dt) < (f.kind === "blast" ? .7 : .3));
    this.particles.update(dt, this.solids);
    if (this.victory.active) {
      this.victory.advance(dt); p.celebrationTime = this.victory.cheerTime; p.animationTime += dt;
      if (this.victory.phase === "settlement") this.state = "complete";
      return;
    }
    if (this.state === "complete" || this.state === "gameover") return;
    this.time += dt; p.animationTime += dt;
    p.invincible = Math.max(0, p.invincible - dt); p.hitTime = Math.max(0, p.hitTime - dt);
    p.recoil = Math.max(0, p.recoil - dt * 6); p.throwTime = Math.max(0, p.throwTime - dt);
    this.cooldown = Math.max(0, this.cooldown - dt); this.dodgeCooldown = Math.max(0, this.dodgeCooldown - dt);
    this.messageTime = Math.max(0, this.messageTime - dt);
    if (!p.alive) {
      this.state = "dying"; this.dodgeTime = 0; p.vx = p.vy = 0; p.deadTime += dt;
      if (p.deadTime > 1.2) this.state = "gameover";
      return;
    }
    if (this.introActive) { this.introTime += dt; if (this.introTime >= L.launchDuration - 1e-8) this.finishEntry(); return; }
    if (input.switchWeapon) {
      p.recoil = 0;
      this.weapon = this.weapon === "knife" ? this.storedWeapon : "knife";
      this.knifeTime = 0; this.protectedPress = false;
    }
    this.movePlayer(dt, input);
    if (!this.boss.active && this.boss.alive && p.x >= L.bossTrigger) {
      this.boss.active = true; this.boss.timer = .8;
      this.message = "猎隼拦截机 · 观察锁线后上下闪避"; this.messageTime = 3;
    }
    this.updateEnemies(dt);
    this.targets = this.enemies.filter(e => e.active && e.alive);
    if (this.boss.active && this.boss.alive) this.targets.push(this.boss);
    this.updateAim(dt, input);
    this.shooting = !!input.shoot;
    this.updateKnife(dt);
    if ((input.shoot || input.melee) && this.cooldown <= 0 && p.hitTime <= 0) {
      if (this.weapon === "knife" || input.melee) this.startKnife();
      else this.firePlayer();
    }
    if (input.grenade && p.grenades > 0 && p.hitTime <= 0) this.throwAirburst();
    const beforeHits = this.projectiles.hits;
    this.guideEnemyMissiles(dt);
    this.projectiles.update(dt, p, this.targets, this.solids);
    this.hits += this.projectiles.hits - beforeHits;
    this.updateAirbursts(dt); this.updateDrops(dt);
    if (p.alive && !this.boss.alive && p.x >= L.exit.x && this.time - this.clearTime >= 3) {
      this.clearTime = this.time; this.victory.start(); p.vx = p.vy = 0;
      this.message = "试飞样段完成 · 完整第三关仍在建设中"; this.messageTime = 10;
      for (const shot of this.projectiles.items) shot.active = false;
    }
  }
  private refreshSolids(): void { this.solids = [...L.obstacles]; if (this.boss.alive) this.solids.push(L.gate); }
  private movePlayer(dt: number, input: InputFrame): void {
    const p = this.player;
    let x = clamp(input.axis, -1, 1), y = clamp(input.vertical ?? 0, -1, 1);
    const size = Math.hypot(x, y); if (size > 1) { x /= size; y /= size; }
    if (size < .06) x = y = 0;
    if (!input.shoot && Math.abs(x) > .06) p.facing = x > 0 ? 1 : -1;
    if (input.jump && this.dodgeCooldown <= 0 && this.dodgeTime <= 0) {
      const length = Math.hypot(x, y);
      this.dodgeX = length > .06 ? x / length : p.facing; this.dodgeY = length > .06 ? y / length : 0;
      this.dodgeTime = L.dodgeTime; this.dodgeCooldown = L.dodgeCooldown; this.dodgeSerial++;
    }
    const boosting = this.dodgeTime > 0;
    if (boosting) { p.vx = this.dodgeX * L.dodgeSpeed; p.vy = this.dodgeY * L.dodgeSpeed; }
    else if (x || y) { p.vx = x * L.speed; p.vy = y * L.speed; }
    else {
      const speed = Math.hypot(p.vx, p.vy), next = Math.max(0, speed - L.brake * dt);
      if (speed) { p.vx *= next / speed; p.vy *= next / speed; }
    }
    const moveTime = boosting ? Math.min(dt, this.dodgeTime) : dt;
    const dx = p.vx * moveTime, dy = p.vy * moveTime, ox = p.x, oy = p.y;
    swimMove(p, dx, dy, p.halfWidth, p.height, this.solids);
    this.furthestX = Math.max(this.furthestX, p.x);
    const nextRetreat = this.boss.active && this.boss.alive ? L.arenaStart - 300 : this.furthestX - 1500;
    this.retreatLimit = Math.max(this.retreatLimit, Math.min(p.x - p.halfWidth, nextRetreat), 0);
    p.x = clamp(p.x, this.retreatLimit + p.halfWidth, L.width - p.halfWidth);
    p.y = clamp(p.y, L.floor, L.ceiling - p.height);
    const blockedX = Math.abs(p.x - ox - dx) > .01, blockedY = Math.abs(p.y - oy - dy) > .01;
    if (blockedX) p.vx = 0; if (blockedY) p.vy = 0;
    if (boosting && (blockedX || blockedY)) this.dodgeTime = 0;
    else this.dodgeTime = Math.max(0, this.dodgeTime - dt);
    p.grounded = false; p.crouched = false;
  }
  updateCamera(dt: number, visibleHeight: number): void {
    this.visibleHeight = visibleHeight;
    const p = this.player, c = this.camera, min = this.retreatLimit;
    const max = Math.max(min, Math.min(L.width - c.visibleWidth, p.x - p.halfWidth));
    const targetX = clamp(p.x - c.visibleWidth * .36, min, max);
    c.x = clamp(c.x + (targetX - c.x) * (1 - Math.exp(-dt * 7)), min, max);
    const low = c.y + visibleHeight * .3, high = c.y + visibleHeight * .66;
    let targetY = c.y;
    if (p.y + 36 < low) targetY = p.y + 36 - visibleHeight * .3;
    else if (p.y + 36 > high) targetY = p.y + 36 - visibleHeight * .66;
    targetY = clamp(targetY, 20, Math.max(20, L.ceiling + 50 - visibleHeight));
    c.y += (targetY - c.y) * (1 - Math.exp(-dt * 5));
  }
  private updateAim(dt: number, input: InputFrame): void {
    const p = this.player, origin = { x: p.x, y: p.y + 44 };
    const visible = (e: FlightEnemy) => {
      const b = e.bounds, center = { x: e.x, y: b.y + b.h / 2 };
      return e.alive && e.active && e.x >= this.camera.x && e.x <= this.camera.x + this.camera.visibleWidth
        && center.y >= this.camera.y + 20 && center.y <= this.camera.y + this.visibleHeight - 70
        && Math.hypot(center.x - origin.x, center.y - origin.y) < 850 && this.lineClear(origin, center);
    };
    let target = this.targets.find(e => e.id === this.aimTarget && visible(e));
    this.aimHold = Math.max(0, this.aimHold - dt);
    if (!input.shoot || !target) { this.aimTarget = ""; target = undefined; }
    if (input.shoot && !target) {
      let best = Infinity;
      for (const enemy of this.targets) if (visible(enemy)) {
        const score = Math.hypot(enemy.x - p.x, enemy.y - p.y) + ((enemy.x - p.x) * p.facing < 0 ? 180 : 0);
        if (score < best) { best = score; target = enemy; }
      }
      if (target) { this.aimTarget = target.id; this.aimHold = .25; }
    }
    const to = target ? Math.atan2(target.bounds.y + target.bounds.h / 2 - origin.y, target.x - origin.x)
      : p.facing > 0 ? 0 : Math.PI;
    const delta = Math.atan2(Math.sin(to - this.aim), Math.cos(to - this.aim));
    this.aim += clamp(delta, -dt * 13, dt * 13);
    if (input.shoot && Math.abs(Math.cos(this.aim)) > .15) p.facing = Math.cos(this.aim) > 0 ? 1 : -1;
    p.aimPitch = Math.atan2(Math.sin(this.aim), Math.abs(Math.cos(this.aim)));
  }
  private firePlayer(): void {
    if (this.weapon === "knife") return;
    if (this.weapon === "rocket" && this.ammo <= 0) { this.weapon = this.storedWeapon = "rifle"; }
    const weapon = this.weapon as "rifle" | "rocket", spec = C.weapons[weapon], m = this.muzzle(weapon,1);
    const direction: Facing = Math.cos(this.aim) >= 0 ? 1 : -1;
    const pitch = Math.atan2(Math.sin(this.aim), Math.abs(Math.cos(this.aim)));
    if (!this.projectiles.spawn({ owner: "player", x: m.x, y: m.y, originX: m.originX, originY: m.originY,
      direction, pitch, speed: spec.speed, damage: spec.damage, range: spec.range,
      kind: weapon === "rocket" ? "rocket" : "bullet", blastRadius: spec.blastRadius, homing: weapon === "rocket" })) return;
    this.shots++; this.lastShotWeapon = weapon; this.lastShotMuzzle = m; this.player.recoil = 1;
    this.cooldown = this.attackCooldownDuration = spec.interval;
    if (weapon === "rocket" && --this.ammo === 0) this.weapon = this.storedWeapon = "rifle";
  }
  private startKnife(): void {
    this.knifeTime = .28; this.knifeHit = false; this.knifeSerial++;
    this.cooldown = this.attackCooldownDuration = .42;
  }
  private updateKnife(dt: number): void {
    this.knifeTime = Math.max(0, this.knifeTime - dt);
    this.player.meleeTime = this.knifeTime; this.player.meleeActive = this.knifeTime > .08 && this.knifeTime < .21;
    this.player.meleeAngle = this.aim; this.player.meleeStance = "jump";
    if (!this.player.meleeActive || this.knifeHit) return;
    this.knifeHit = true;
    const origin = { x: this.player.x, y: this.player.y + 38 };
    for (const target of this.targets) {
      const b = target.bounds, point = { x: clamp(origin.x, b.x, b.x + b.w), y: clamp(origin.y, b.y, b.y + b.h) };
      const dx = point.x - origin.x, dy = point.y - origin.y;
      if (Math.hypot(dx, dy) <= 94 && dx * this.player.facing >= -20 && this.lineClear(origin, point)
        && target.takeDamage(4, this.player.facing, "melee")) this.hits++;
    }
  }
  private throwAirburst(): void {
    const m = this.muzzle(); this.player.grenades--; this.airburstThrown++; this.player.throwTime = .3;
    this.airbursts.push({ active: true, x: this.player.x, y: this.player.y + 42,
      vx: Math.cos(m.angle) * 390, vy: Math.sin(m.angle) * 390, age: 0, fuse: .8, radius: 165 });
  }
  private updateAirbursts(dt: number): void {
    for (const a of this.airbursts) {
      if (!a.active) continue;
      a.age += dt;
      const end = { x: a.x + a.vx * dt, y: a.y + a.vy * dt };
      let impact = 1;
      for (const solid of this.solids) { const t = segmentRect(a, end, solid, 6); if (t !== null) impact = Math.min(impact, t); }
      a.x += (end.x - a.x) * impact; a.y += (end.y - a.y) * impact;
      if (impact < 1) a.vx = a.vy = 0;
      if (a.age >= a.fuse) { a.active = false; this.explode(a.x, a.y, a.radius, 8, "player"); }
    }
    this.airbursts = this.airbursts.filter(a => a.active);
  }
  private explode(x: number, y: number, radius: number, damage: number, owner: "player" | "enemy"): void {
    this.blastCount++; this.effect(x, y, "blast", radius); this.particles.burst(x, y, 10);
    const targets: Damageable[] = owner === "player" ? this.targets : [this.player];
    for (const target of targets) {
      if (!target.alive) continue;
      const b = target.bounds, near = { x: clamp(x, b.x, b.x + b.w), y: clamp(y, b.y, b.y + b.h) };
      // Blast reach cannot pass through a bridge or the closed gate.
      if (Math.hypot(near.x - x, near.y - y) <= radius && this.lineClear({ x, y }, near)
        && target.takeDamage(damage, target.x > x ? 1 : -1, "explosion") && owner === "player") this.hits++;
    }
  }
  private damageEnemy(e: FlightEnemy, amount: number, _direction: Facing, _kind?: DamageKind): boolean {
    if (!e.alive || !e.active || amount <= 0) return false;
    e.hp = Math.max(0, e.hp - amount); e.hit = .16; this.effect(e.x, e.y + e.bounds.h / 2, "hit", 28);
    if (!e.alive) {
      e.mode = "dead"; e.vx = e.vy = 0; e.timer = 0; this.kills++;
      this.effect(e.x, e.y + e.bounds.h / 2, "blast", e.kind === "helicopter" ? 130 : 60);
      if (e === this.boss) {
        this.clearTime = this.time; this.refreshSolids();
        // Enemy bullets are cancelled before the guaranteed recovery can become collectible.
        for (const shot of this.projectiles.items) if (shot.owner === "enemy") shot.active = false;
        this.spawnRecovery(); this.message = "猎隼已击落 · 血包恢复 2 点 · 前往接应甲板"; this.messageTime = 5;
      }
    }
    return true;
  }
  private spawnRecovery(): void {
    const source = "after-falcon"; if (this.recoveryUsed.has(source)) return;
    this.drops.push({ x: clamp(this.boss.x, L.arenaStart + 180, L.arenaEnd - 160),
      y: clamp(this.boss.y + 55, L.floor + 90, L.ceiling - 130), kind: "medkit", source, active: true, age: 0 });
    this.recoveryUsed.add(source);
  }
  private updateDrops(dt: number): void {
    const p = this.player;
    // Projectile collision is earlier in this step. A lethal hit must not turn
    // into an accidental revive merely because a medkit shares the same cell.
    if (!p.alive) return;
    for (const d of this.drops) {
      if (!d.active) continue; d.age += dt;
      if (Math.hypot(p.x - d.x, p.y + 35 - d.y) > 64 || !this.lineClear({ x: p.x, y: p.y + 35 }, d)) continue;
      if (d.kind === "medkit" && p.health >= C.player.maxHealth) continue;
      if (d.kind === "airburst" && p.grenades >= 6) continue;
      if (d.kind === "rocket" && this.storedWeapon === "rocket" && this.ammo >= 6) continue;
      d.active = false; this.collected++;
      if (d.kind === "medkit") { p.health = Math.min(C.player.maxHealth, p.health + 2); this.message = "生命恢复 +2"; }
      else if (d.kind === "airburst") { p.grenades = Math.min(6, p.grenades + 2); this.message = "空爆弹 +2"; }
      else { p.recoil=0;this.storedWeapon = "rocket"; this.ammo = 6; if (this.weapon !== "knife") this.weapon = "rocket"; this.message = "追踪火箭筒 · 6 发"; }
      this.messageTime = 2.5;
    }
  }
  private updateEnemies(dt: number): void {
    let attacking = this.enemies.filter(e => e.alive && ["tell", "fire", "charge"].includes(e.mode)).length;
    for (const e of [...this.enemies, this.boss]) {
      e.muzzleFlash = Math.max(0,e.muzzleFlash-dt);
      e.age += dt; e.hit = Math.max(0, e.hit - dt);
      if (!e.alive) { e.deadTime += dt; continue; }
      const dx = this.player.x - e.x, dy = this.player.y + 35 - (e.y + e.bounds.h / 2);
      if (e !== this.boss && !e.active && Math.hypot(dx, dy) < 650) e.active = true;
      if (!e.active) continue;
      e.timer -= dt;
      if (e.mode === "approach" || e.mode === "recover") {
        e.facing = dx >= 0 ? 1 : -1;
        this.steerEnemy(e, dt);
        const insidePatrol = this.player.x >= e.patrolMin - 150 && this.player.x <= e.patrolMax + 150;
        const band = this.bossVisibleBand();
        const readyToTell = e !== this.boss || (e.y >= band.min && e.y <= band.max);
        if (e.timer <= 0 && readyToTell && (e === this.boss || (insidePatrol && attacking < 2)) && Math.hypot(dx, dy) < 750) {
          this.prepareAttack(e); if (e !== this.boss) attacking++;
        }
      } else if (e.mode === "tell") {
        e.vx = e.vy = 0;
        if (e.timer <= 0) {
          if (e.attack === "sweep" || e.attack === "dive") {
            e.mode = "charge"; e.timer = e.kind === "helicopter" ? .75 : .65;
            e.vx = Math.cos(e.angle) * (e.kind === "helicopter" ? 430 : 390);
            e.vy = Math.sin(e.angle) * (e.kind === "helicopter" ? 430 : 390);
          } else { e.mode = "fire"; e.timer = e.attack === "missiles" ? .65 : .7; e.fireClock = 0; e.shotsLeft = e.attack === "missiles" ? 2 : 3; }
        }
      } else if (e.mode === "fire") {
        e.fireClock -= dt;
        if (e.fireClock <= 0 && e.shotsLeft > 0) { this.fireEnemy(e); e.shotsLeft--; e.fireClock = e.attack === "missiles" ? .23 : .18; }
        if (e.timer <= 0) this.recoverEnemy(e);
      } else if (e.mode === "charge") {
        const before = { x: e.x, y: e.y }, b = e.bounds;
        this.moveEnemy(e, e.vx * dt, e.vy * dt);
        const relative = { x: this.player.bounds.x - b.w / 2, y: this.player.bounds.y - b.h,
          w: this.player.bounds.w + b.w, h: this.player.bounds.h + b.h };
        if (segmentRect(before, e, relative) !== null) this.player.takeDamage(1, e.vx > 0 ? 1 : -1);
        if (e.timer <= 0 || Math.hypot(e.x - before.x, e.y - before.y) < 1) this.recoverEnemy(e);
      }
      if (e.alive && overlaps(e.bounds, this.player.bounds)) this.player.takeDamage(1, this.player.x > e.x ? 1 : -1);
    }
  }
  private bossVisibleBand(): { min: number; max: number } {
    // Sprite geometry extends beyond the 150-high collision cabin: the rotor
    // reaches +220 and the skids -37. Reserve the HUD in screen pixels.
    const min = Math.max(220, this.camera.y + 41);
    const max = Math.max(min, Math.min(520,
      this.camera.y + this.visibleHeight - 100 / Math.max(.1, this.camera.zoom) - 224));
    return { min, max };
  }
  private steerEnemy(e: FlightEnemy, dt: number): void {
    const p = this.player, boss = e === this.boss;
    // The arena leaves both an upper and a lower full-body escape lane.
    const desiredX = clamp(p.x + (p.x < e.x ? 280 : -280), e.patrolMin + (boss ? 150 : 45), e.patrolMax - (boss ? 150 : 45));
    const band = this.bossVisibleBand(), inset = Math.min(8, (band.max - band.min) / 2);
    const desiredY = boss ? clamp(p.y + 20 + Math.sin(e.age * 1.3) * 75, band.min + inset, band.max - inset)
      : clamp(p.y + 20 + Math.sin(e.age * 1.7) * 45, 260, 620);
    let dx = desiredX - e.x, dy = desiredY - e.y;
    const b = e.bounds, probe = { x: e.x + Math.sign(dx) * 95, y: e.y };
    if (Math.abs(dx) > 20 && this.solids.some(r => segmentRect(e, probe, { x: r.x - b.w / 2, y: r.y - b.h, w: r.w + b.w, h: r.h + b.h }) !== null)) {
      dy = e.y + b.h < 520 ? 160 : -160;
    }
    const length = Math.hypot(dx, dy), speed = Math.min(length * 2.4, boss ? 200 : 115);
    e.vx = length > 3 ? dx / length * speed : 0; e.vy = length > 3 ? dy / length * speed : 0;
    this.moveEnemy(e, e.vx * dt, e.vy * dt);
  }
  private moveEnemy(e: FlightEnemy, dx: number, dy: number): void {
    const b = e.bounds, ox = e.x, oy = e.y;
    swimMove(e, dx, dy, b.w / 2, b.h, this.solids);
    e.x = clamp(e.x, e.patrolMin + b.w / 2 + 15, e.patrolMax - b.w / 2 - 15);
    if (e === this.boss) {
      const band = this.bossVisibleBand();
      // A changed viewport may temporarily leave a committed move outside its
      // new band. Prevent further escape, then steer back without teleporting.
      e.y = clamp(e.y, Math.min(oy, band.min), Math.max(oy, band.max));
    } else e.y = clamp(e.y, L.floor + 60, L.ceiling - b.h - 50);
    e.travel += Math.hypot(e.x - ox, e.y - oy);
  }
  private prepareAttack(e: FlightEnemy): void {
    const boss = e === this.boss;
    const cycle: FlightAttack[] = ["burst", "missiles", "sweep", "dive"];
    e.attack = boss ? cycle[e.serial++ % cycle.length] : e.kind === "drone" ? "dive" : "burst";
    e.phase = e.hp <= e.maxHp / 2 ? 2 : 1;
    e.attackCounts[e.attack] = (e.attackCounts[e.attack] ?? 0) + 1;
    e.facing = this.player.x >= e.x ? 1 : -1;
    const socket = this.enemyMuzzle(e);
    e.angle = Math.atan2(this.player.y + 35 - socket.y, this.player.x - socket.x);
    if (e.attack === "sweep") e.angle = this.player.x < e.x ? Math.PI : 0;
    e.mode = "tell"; e.timer = e.attack === "burst" ? .62 : .85; e.vx = e.vy = 0;
  }
  private recoverEnemy(e: FlightEnemy): void { e.mode = "recover"; e.timer = e === this.boss ? (e.phase === 2 ? .9 : 1.2) : 1.5; e.vx = e.vy = 0; }
  private fireEnemy(e: FlightEnemy): void {
    const missile = e.attack === "missiles", boss = e === this.boss;
    const direction: Facing = Math.cos(e.angle) >= 0 ? 1 : -1;
    const pitch = Math.atan2(Math.sin(e.angle), Math.abs(Math.cos(e.angle)));
    const port = missile && e.shotsLeft !== 2 ? 1 : 0;
    const { originX, originY, x, y } = this.enemyMuzzle(e, port);
    if(!this.projectiles.spawn({ owner: "enemy", x, y, originX, originY, direction, pitch,
      speed: missile ? 290 : 340, damage: 1, range: 1200, kind: missile ? "rocket" : "bullet",
      blastRadius: missile ? 88 : 0, tier: boss ? "mini" : "standard", homing: missile }))return;
    e.muzzleFlash=.12;e.flashPort=port;e.flashMissile=missile;
  }
  private guideEnemyMissiles(dt: number): void {
    const p = this.player, target = { x: p.x, y: p.y + 35 };
    for (const shot of this.projectiles.items) {
      // A short acquisition window and slow turn let a committed dodge escape.
      // This is flight-local: the shared pool keeps its prior land/ocean rules.
      if (!shot.active || shot.owner !== "enemy" || shot.kind !== "rocket" || !shot.homing
        || shot.age < .12 || shot.age >= 1.02 || !p.alive || !this.lineClear(shot, target)) continue;
      const angle = Math.atan2(shot.vy, shot.vx), desired = Math.atan2(target.y - shot.y, target.x - shot.x);
      const difference = Math.atan2(Math.sin(desired - angle), Math.cos(desired - angle));
      const turn = clamp(difference, -.95 * dt, .95 * dt), speed = Math.hypot(shot.vx, shot.vy);
      shot.vx = Math.cos(angle + turn) * speed; shot.vy = Math.sin(angle + turn) * speed;
    }
  }
  private effect(x: number, y: number, kind: FlightEffect["kind"], size: number): void {
    if (this.effects.length >= 64) this.effects.shift();
    this.effects.push({ x, y, kind, size, age: 0 });
  }
  snapshot() {
    const actor = (e: FlightEnemy) => ({ id: e.id, kind: e.kind, x: e.x, y: e.y, vx: e.vx, vy: e.vy,
      hp: e.hp, maxHp: e.maxHp, active: e.active, alive: e.alive, mode: e.mode, attack: e.attack,
      angle: e.angle, timer: e.timer, facing: e.facing, phase: e.phase, travel: e.travel,
      attackCounts: { ...e.attackCounts }, bounds: e.bounds });
    return { chapter: 3, buildStage: "P0/P1-flight-slice", state: this.state, time: this.time, clearTime: this.clearTime,
      stage: this.stage, introTime: this.introTime, player: { x: this.player.x, y: this.player.y, vx: this.player.vx,
        vy: this.player.vy, health: this.player.health, facing: this.player.facing, alive: this.player.alive },
      cameraX: this.camera.x, cameraY: this.camera.y, furthestX: this.furthestX, retreatLimit: this.retreatLimit,
      weapon: this.weapon, storedWeapon: this.storedWeapon, ammo: this.ammo, grenades: this.player.grenades,
      aim: this.aim, aimTarget: this.aimTarget, muzzle: this.muzzle(), lastShotWeapon: this.lastShotWeapon,
      lastShotMuzzle: this.lastShotMuzzle, shots: this.shots, hits: this.hits, kills: this.kills, collected: this.collected,
      airburstThrown: this.airburstThrown, knifeSerial: this.knifeSerial, dodgeCooldown: this.dodgeCooldown,
      dodgeTime: this.dodgeTime, dodgeSerial: this.dodgeSerial,
      controls: { enabled: this.controlEnabled, dodgeRemaining: this.dodgeCooldown, dodgeDuration: L.dodgeCooldown },
      attackCooldown: { remaining: this.cooldown, duration: this.attackCooldownDuration }, zone: this.zone.name,
      levelWidth: L.width, boss: actor(this.boss), miniBoss: actor(this.boss), enemies: this.enemies.map(actor),
      bossVisibleBand: { ...this.bossVisibleBand(), bodyTopMargin: 224 },
      flightBounds: { floor: L.floor, ceiling: L.ceiling }, obstacles: this.solids.map(r => ({ ...r })),
      pickups: this.drops.filter(d => d.active).map(d => ({ ...d })), recoverySpawned: [...this.recoveryUsed],
      effects: this.effects.map(e => ({ ...e })), airbursts: this.airbursts.map(a => ({ ...a })),
      projectileStates: this.projectiles.items.filter(s => s.active).map(s => ({ owner: s.owner, kind: s.kind,
        tier: s.tier, x: s.x, y: s.y, vx: s.vx, vy: s.vy, age: s.age, homing: s.homing,
        radius: projectileProfile(s).hitRadius })), victory: this.victory.snapshot(),
      impact: { hitStop: 0, shakeTime: 0, shakePower: 0, blastCount: this.blastCount },
      bullets: this.projectiles.items.filter(s => s.active).length };
  }
}

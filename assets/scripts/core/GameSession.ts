import { GameConfig as C } from "./GameConfig";
import { GameState, InputFrame, DamageOwner, clamp } from "./Types";
import { PlayerController } from "../player/PlayerController";
import { LevelController } from "../level/LevelController";
import { CameraFollow } from "../camera/CameraFollow";
import { EnemySpawner } from "../enemy/EnemySpawner";
import { ParticlePool } from "../combat/ParticlePool";
import { ProjectileManager } from "../combat/ProjectileManager";
import { WeaponSystem } from "../combat/WeaponSystem";
import { ExplosionSystem } from "../combat/ExplosionSystem";
import { GrenadeSystem } from "../combat/GrenadeSystem";
import { PickupSystem } from "../world/PickupSystem";
import { DestructibleObject } from "../world/DestructibleObject";
import { LevelDefinition } from "../level/LevelData";

/** Session owns simulation order; no engine or browser dependencies. */
export class GameSession {
  state: GameState = "title";
  readonly player = new PlayerController();
  readonly level: LevelController;
  readonly camera = new CameraFollow();
  readonly spawner = new EnemySpawner();
  readonly particles = new ParticlePool();
  readonly projectiles = new ProjectileManager(this.particles);
  readonly weapon = new WeaponSystem();
  readonly explosions = new ExplosionSystem();
  readonly grenades = new GrenadeSystem();
  readonly pickups = new PickupSystem();
  combo = 0;
  comboTime = 0;
  bestCombo = 0;
  private lastKills = 0;
  private dropSeed = 1;
  shakeTime = 0;
  shakePower = 0;
  hitStop = 0;
  time = 0;
  hitFlash = 0;
  private resumeState: "playing" | "dying" = "playing";
  private bossDeathStarted = false;
  constructor(data?: LevelDefinition) {
    this.level = new LevelController(data);
    this.reset("title");
  }
  reset(state: GameState = "playing"): void {
    this.state = state;
    this.time = 0;
    this.hitFlash = 0;
    this.level.reset();
    this.player.reset(this.level.data.spawn.x, this.level.data.spawn.y);
    this.camera.reset();
    this.spawner.reset(this.level.data.enemies);
    this.particles.reset();
    this.projectiles.reset();
    this.weapon.reset();
    this.explosions.reset();
    this.grenades.reset();
    this.pickups.reset();
    this.combo = this.bestCombo = this.lastKills = 0;
    this.comboTime = 0;
    this.dropSeed = 1;
    this.shakeTime = this.shakePower = this.hitStop = 0;
    this.bossDeathStarted = false;
    this.projectiles.onExplosion = (x, y, radius, damage, owner) =>
      this.explosions.enqueue(x, y, radius, damage, owner);
    this.level.objects.onHit = (o, destroyed) => this.objectHit(o, destroyed);
  }
  pause(): void {
    if (this.state === "playing" || this.state === "dying") {
      this.resumeState = this.state;
      this.state = "paused";
    }
  }
  resume(): void {
    if (this.state === "paused") this.state = this.resumeState;
  }
  update(dt: number, input: InputFrame): void {
    if (this.state !== "playing" && this.state !== "dying") return;
    this.time += dt;
    this.shakeTime = Math.max(0, this.shakeTime - dt);
    this.comboTime = Math.max(0, this.comboTime - dt);
    if (this.comboTime === 0) this.combo = 0;
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    const health = this.player.health;
    this.level.updateWorld(dt, this.player, this.spawner.enemies);
    const grounded = this.player.grounded;
    this.level.objects.update(dt, this.level.staticSolids);
    this.level.objects.flushHits();
    this.level.refreshSolids();
    this.player.update(dt, input, this.level);
    if (!grounded && this.player.grounded) {
      for (let i = 0; i < 5; i++)
        this.particles.emit(
          this.player.x + (i - 2) * 5,
          this.player.y,
          "dust",
          (i - 2) * 30,
          30,
        );
    }
    this.weapon.update(dt);
    if (this.state === "playing" && input.shoot && this.player.alive)
      this.weapon.fire(this.player, this.projectiles, "player");
    if (input.grenade && this.state === "playing")
      this.grenades.throw(this.player);
    this.grenades.update(dt, this.level, this.explosions);
    for (const enemy of this.spawner.enemies)
      enemy.update(dt, this.player, this.level, this.projectiles);
    this.projectiles.update(
      dt,
      this.player,
      this.spawner.enemies,
      this.level.solids,
      (target) => {
        if ("state" in target) {
          this.hitStop = Math.max(this.hitStop, 0.018);
          this.shakePower = 1.6;
          this.shakeTime = 0.08;
        }
      },
      this.level.objects.objects,
    );
    this.level.objects.flushHits();
    for (const e of this.spawner.enemies)
      if (!e.alive && e.kind === "turret" && !e.deathEffectPlayed) {
        e.deathEffectPlayed = true;
        this.explosions.enqueue(e.x, e.y + 35, 85, 0, "player");
      }
    this.explosions.flush((x, y, radius, damage, owner) =>
      this.applyBlast(x, y, radius, damage, owner),
    );
    this.explosions.update(dt);
    this.level.refreshSolids();
    this.pickups.update(dt, this.player, this.weapon, this.level.solids);
    const kills = this.spawner.kills;
    if (kills > this.lastKills) {
      this.combo += kills - this.lastKills;
      this.comboTime = 3;
      this.bestCombo = Math.max(this.bestCombo, this.combo);
      this.lastKills = kills;
    }
    this.particles.update(dt);
    if (this.player.health < health) this.hitFlash = 0.15;
    if (!this.spawner.guard.alive && !this.bossDeathStarted) {
      this.bossDeathStarted = true;
      if (this.level.data.arena) {
        for (let n = 0; n < 5; n++)
          this.explosions.enqueue(
            this.spawner.guard.x + (n - 2) * 35,
            185 + (n % 2) * 55,
            130,
            0,
            "player",
          );
        for (const p of this.projectiles.items)
          if (p.owner === "enemy") p.active = false;
        for (const e of this.spawner.enemies)
          if (e.alive && e.id.startsWith("reinforce"))
            e.takeDamage(999, 1, "explosion");
      }
    }
    this.level.guardDefeated =
      !this.spawner.guard.alive &&
      (!this.level.data.arena || this.spawner.guard.deadTime > 1.6);
    if (!this.player.alive) {
      this.state = "dying";
      if (this.player.deadTime >= C.player.deathDuration)
        this.state = "gameover";
    } else if (this.level.reachedExit(this.player.x)) this.state = "complete";
    if (this.level.arenaEntered && this.level.data.arena)
      this.camera.x +=
        (this.level.data.arena.start - this.camera.x) * (1 - Math.exp(-dt * 7));
    else this.camera.update(this.player.x, dt, this.level.data.width);
  }
  snapshot() {
    return {
      state: this.state,
      time: this.time,
      player: {
        x: this.player.x,
        y: this.player.y,
        vx: this.player.vx,
        vy: this.player.vy,
        health: this.player.health,
        grounded: this.player.grounded,
        facing: this.player.facing,
        animation: this.player.animation,
        crouched: this.player.crouched,
        aimPitch: this.player.aimPitch,
      },
      cameraX: this.camera.x,
      kills: this.spawner.kills,
      weapon: this.weapon.id,
      ammo: this.weapon.ammo,
      grenades: this.player.grenades,
      grenadesThrown: this.grenades.thrown,
      destroyedObjects: this.level.objects.destroyed,
      explosions: this.explosions.total,
      combo: this.combo,
      bestCombo: this.bestCombo,
      objects: this.level.objects.objects.map((o) => ({
        id: o.id,
        kind: o.kind,
        x: o.x,
        y: o.y,
        w: o.w,
        h: o.h,
        health: o.health,
        alive: o.alive,
        solid: o.solid,
        triggered: o.triggered,
      })),
      pickups: this.pickups.items
        .filter((p) => p.active)
        .map((p) => ({ kind: p.kind, x: p.x, y: p.y })),
      projectileStates: this.projectiles.items
        .filter((p) => p.active)
        .map((p) => ({
          owner: p.owner,
          kind: p.kind,
          x: p.x,
          y: p.y,
          vx: p.vx,
          vy: p.vy,
        })),
      remaining: this.spawner.remaining,
      guardHealth: this.spawner.guard.health,
      boss: {
        phase: this.spawner.guard.phase,
        active: this.spawner.guard.active,
        mode: this.spawner.guard.mode,
        warningX: this.spawner.guard.warningX,
        warningTime: this.spawner.guard.warningTime,
        windup: this.spawner.guard.windup,
        summons: this.spawner.guard.summons,
      },
      levelWidth: this.level.data.width,
      exitX: this.level.data.exit.x,
      arenaEntered: this.level.arenaEntered,
      zones: (this.level.data.zones ?? []).map((z) => ({
        ...z,
        cleared: this.level.clearedZones.has(z.id),
      })),
      mechanisms: this.level.mechanisms.map((m) => ({
        id: m.data.id,
        kind: m.data.kind,
        x: m.rect.x,
        y: m.rect.y,
        w: m.rect.w,
        h: m.rect.h,
        released: m.released,
        landed: m.landed,
      })),
      terrain: this.level.solids.map((r) => ({
        x: r.x,
        y: r.y,
        w: r.w,
        h: r.h,
        kind: r.kind,
        entityId: r.entityId,
      })),
      exitOpen: this.level.guardDefeated,
      bullets: this.projectiles.items.filter((p) => p.active).length,
      shots: this.projectiles.fired,
      hits: this.projectiles.hits,
      peakBullets: this.projectiles.peak,
      droppedBullets: this.projectiles.dropped,
      enemies: this.spawner.enemies.map((e) => ({
        id: e.id,
        x: e.x,
        y: e.y,
        health: e.health,
        state: e.state,
        kind: e.kind,
        shield: e.shieldHealth,
        windup: e.windup,
      })),
    };
  }
  private objectHit(o: DestructibleObject, destroyed: boolean): void {
    this.particles.burst(
      o.x + o.w / 2,
      o.y + o.h / 2,
      destroyed ? 16 : 5,
      o.kind === "wood" || o.kind === "hanging" ? "wood" : "spark",
    );
    if (destroyed) {
      if (o.kind === "barrel")
        this.explosions.enqueue(
          o.x + o.w / 2,
          o.y + o.h / 2,
          155,
          7,
          "neutral",
        );
      if (o.data.drop) {
        this.dropSeed = (this.dropSeed * 1664525 + 1013904223) >>> 0;
        if (this.dropSeed / 4294967296 < (o.data.dropChance ?? 0.65))
          this.pickups.spawn(o.x + o.w / 2, o.y + 25, o.data.drop);
      }
    } else if (o.kind === "hanging" && o.triggered && !o.falling)
      this.explosions.enqueue(o.x + o.w / 2, o.y, 80, 5, "neutral");
  }
  private applyBlast(
    x: number,
    y: number,
    radius: number,
    damage: number,
    owner: DamageOwner,
  ): void {
    this.particles.burst(x, y, 20);
    this.shakeTime = 0.22;
    this.shakePower = 5;
    this.hitStop = 0.045;
    if (damage === 0) return;
    const hit = (
      target: {
        bounds: { x: number; y: number; w: number; h: number };
        alive: boolean;
        takeDamage: (n: number, d: -1 | 1, k?: "explosion") => boolean;
      },
      amount: number,
    ) => {
      if (!target.alive) return false;
      const r = target.bounds,
        dx = x - clamp(x, r.x, r.x + r.w),
        dy = y - clamp(y, r.y, r.y + r.h),
        distance = Math.hypot(dx, dy);
      return (
        distance <= radius &&
        target.takeDamage(
          amount * (1 - (0.35 * distance) / radius),
          r.x + r.w / 2 >= x ? 1 : -1,
          "explosion",
        )
      );
    };
    if (owner !== "player") hit(this.player, owner === "enemy" ? damage : 1);
    if (owner !== "enemy")
      for (const e of this.spawner.enemies)
        if (
          hit(
            e,
            damage *
              (damage >= 9 && (e.kind === "guard" || e.kind === "turret")
                ? 1.5
                : 1),
          )
        ) {
          e.vx = (e.x > x ? 1 : -1) * 250;
          e.vy = 380;
          e.grounded = false;
        }
    for (const o of this.level.objects.objects) hit(o, damage);
    this.level.objects.flushHits();
  }
}

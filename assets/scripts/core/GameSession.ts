import { GameConfig as C } from "./GameConfig";
import { GameState, InputFrame } from "./Types";
import { PlayerController } from "../player/PlayerController";
import { LevelController } from "../level/LevelController";
import { CameraFollow } from "../camera/CameraFollow";
import { EnemySpawner } from "../enemy/EnemySpawner";
import { ParticlePool } from "../combat/ParticlePool";
import { ProjectileManager } from "../combat/ProjectileManager";
import { WeaponSystem } from "../combat/WeaponSystem";

/** Session owns simulation order; no engine or browser dependencies. */
export class GameSession {
  state: GameState = "title";
  readonly player = new PlayerController();
  readonly level = new LevelController();
  readonly camera = new CameraFollow();
  readonly spawner = new EnemySpawner();
  readonly particles = new ParticlePool();
  readonly projectiles = new ProjectileManager(this.particles);
  readonly weapon = new WeaponSystem();
  time = 0;
  hitFlash = 0;
  private resumeState: "playing" | "dying" = "playing";
  constructor() {
    this.reset("title");
  }
  reset(state: GameState = "playing"): void {
    this.state = state;
    this.time = 0;
    this.hitFlash = 0;
    this.level.reset();
    this.player.reset(this.level.data.spawn.x, this.level.data.spawn.y);
    this.camera.reset();
    this.spawner.reset();
    this.particles.reset();
    this.projectiles.reset();
    this.weapon.reset();
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
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    const health = this.player.health;
    this.player.update(dt, input, this.level);
    this.weapon.update(dt);
    if (this.state === "playing" && input.shoot && this.player.alive)
      this.weapon.fire(this.player, this.projectiles, "player");
    for (const enemy of this.spawner.enemies)
      enemy.update(dt, this.player, this.level, this.projectiles);
    this.projectiles.update(
      dt,
      this.player,
      this.spawner.enemies,
      this.level.solids,
    );
    this.particles.update(dt);
    if (this.player.health < health) this.hitFlash = 0.15;
    this.level.guardDefeated = !this.spawner.guard.alive;
    if (!this.player.alive) {
      this.state = "dying";
      if (this.player.deadTime >= C.player.deathDuration)
        this.state = "gameover";
    } else if (this.level.reachedExit(this.player.x)) this.state = "complete";
    this.camera.update(this.player.x, dt, this.level.data.width);
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
      },
      cameraX: this.camera.x,
      kills: this.spawner.kills,
      remaining: this.spawner.remaining,
      guardHealth: this.spawner.guard.health,
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
        windup: e.windup,
      })),
    };
  }
}

import { GameConfig as C } from "../core/GameConfig";
import { Facing, segmentRect, clamp } from "../core/Types";
import type { EnemyController } from "./EnemyController";
import type { PlayerController } from "../player/PlayerController";
import type { LevelController } from "../level/LevelController";
import type { ProjectileManager } from "../combat/ProjectileManager";

export type EnemyAction =
  | "patrol"
  | "approach"
  | "aim"
  | "burst"
  | "reload"
  | "chargeWindup"
  | "charge"
  | "swing"
  | "recover"
  | "push"
  | "brace"
  | "bash"
  | "retreat"
  | "lock";
/** Per-soldier tactics. Every high-threat action has a tell and a recovery window. */
export class EnemyTactics {
  action: EnemyAction = "patrol";
  private timer = 0;
  private burstLeft = 0;
  private lockedPitch = 0;
  private direction: Facing = -1;
  private patrol: Facing = -1;
  private turn = 0;
  interrupt(e: EnemyController): void {
    this.action = "recover";
    this.timer = 0.2;
    this.burstLeft = 0;
    e.windup = 0;
  }
  update(
    e: EnemyController,
    dt: number,
    p: PlayerController,
    level: LevelController,
    shots: ProjectileManager,
  ): void {
    const cfg = C.enemies[e.kind],
      dx = p.x - e.x,
      dy = p.y - e.y,
      dist = Math.abs(dx);
    this.timer = Math.max(0, this.timer - dt);
    if (!p.alive || dist > cfg.notice) {
      e.windup = 0;
      this.burstLeft = 0;
      this.action = "patrol";
      e.state = dist > 900 ? "Idle" : "Patrol";
      if (e.x < e.spawn.x - e.spawn.patrol) this.patrol = 1;
      if (e.x > e.spawn.x + e.spawn.patrol) this.patrol = -1;
      e.vx = e.state === "Patrol" ? this.patrol * cfg.speed * 0.3 : 0;
      if (e.vx) e.facing = e.vx > 0 ? 1 : -1;
      return;
    }
    const desired: Facing = dx >= 0 ? 1 : -1;
    if (e.kind === "shield" && desired !== e.facing) {
      this.turn += dt;
      if (this.turn >= 0.45) {
        e.facing = desired;
        this.turn = 0;
      }
    } else {
      e.facing = desired;
      this.turn = 0;
    }
    const sight = !level.solids.some((s) => {
      if(segmentRect({x:e.x,y:e.y+50},{x:p.x,y:p.y+35},s)===null)return false;
      if(!s.entityId)return true;
      const cover=level.objects.objects.find(o=>o.id===s.entityId);
      // Mobile soldiers must reposition around cover. Wooden boxes and barrels
      // remain valid firing targets: shots can destroy/explode those objects.
      return cover?.kind==="sandbag" || cover?.category==="indestructible";
    });
    if (e.kind === "melee") {
      this.melee(e, dt, p, dx, dy);
      return;
    }
    if (this.action === "recover" && this.timer > 0) {
      e.vx = 0;
      e.state = "Idle";
      return;
    }
    const close = dist <= cfg.range && Math.abs(dy) < 160 && sight;
    if (!close) {
      this.action = "approach";
      this.burstLeft = 0;
      e.windup = 0;
      e.state = "Chase";
      e.vx = e.facing * cfg.speed;
      return;
    }
    e.state = "Attack";
    if (e.kind === "turret") {
      e.vx = 0;
      if (e.attackCooldown === 0 && e.windup === 0) {
        this.action = "lock";
        e.windup = 0.9;
        this.lockedPitch = clamp(Math.atan2(dy - 12, dist), -0.3, 0.65);
      }
      e.aimPitch = this.lockedPitch;
      if (e.windup > 0) {
        e.windup = Math.max(0, e.windup - dt);
        if (e.windup === 0) {
          shots.spawn({
            owner: "enemy",
            x: e.x + e.facing * 36 * Math.cos(e.aimPitch),
            y: e.y + 50 + 36 * Math.sin(e.aimPitch),
            direction: e.facing,
            pitch: e.aimPitch,
            speed: 260,
            damage: 2,
            range: 1150,
            kind: "cannon",
            blastRadius: 55,
          });
          e.recoil = 1.5;
          e.attackCooldown = cfg.interval;
          this.action = "recover";
          this.timer = 0.45;
        }
      }
      return;
    }
    if (e.kind === "shield") {
      if (e.attackCooldown === 0 && e.windup === 0) {
        this.action = dist < 55 ? "bash" : "brace";
        e.windup = dist < 55 ? 0.45 : 0.6;
        this.lockedPitch = 0;
      }
      e.vx =
        e.windup > 0
          ? 0
          : e.shieldHealth > 0
            ? dist > 170
              ? e.facing * cfg.speed
              : 0
            : dist < 220
              ? -e.facing * cfg.speed
              : 0;
      if (e.windup === 0) this.action = e.shieldHealth > 0 ? "push" : "retreat";
      if (e.windup > 0) {
        e.windup = Math.max(0, e.windup - dt);
        if (e.windup === 0) {
          if (this.action === "bash") {
            if (dist < 66 && Math.abs(dy) < 50) p.takeDamage(1, e.facing);
          } else {
            e.aimPitch = 0;
            e.weapon.fire(e, shots, "enemy", cfg.interval);
          }
          e.attackCooldown = cfg.interval;
          this.action = "recover";
          this.timer = 0.35;
        }
      }
      return;
    }
    // Rifle troops fire a short, locked burst, then visibly reload and seek nearby cover.
    if (this.action === "reload" && this.timer > 0) {
      e.state = "Chase";
      const cover = level.objects.objects.find(
        (o) =>
          o.alive &&
          o.solid &&
          Math.abs(o.x - e.x) < 130 &&
          o.y < e.y + 10 &&
          ["wood", "steel", "sandbag"].includes(o.kind),
      );
      const target = cover
        ? p.x < e.x
          ? cover.x + cover.w + 20
          : cover.x - 20
        : e.spawn.onPlatform
          ? e.spawn.x +
            (Math.floor(e.animationTime) % 2 ? 1 : -1) * e.spawn.patrol * 0.6
          : e.x + (dist < 230 ? -e.facing : e.facing) * 45;
      e.vx =
        Math.abs(target - e.x) > 5
          ? Math.sign(target - e.x) * cfg.speed * 0.7
          : 0;
      return;
    }
    if (this.action !== "aim" && this.action !== "burst") {
      this.action = "aim";
      e.windup = 0.65;
      this.burstLeft = 2;
      this.direction = e.facing;
      this.lockedPitch = clamp(Math.atan2(dy - 16, dist), -0.25, 0.55);
    }
    e.vx = 0;
    e.facing = this.direction;
    e.aimPitch = this.lockedPitch;
    if (e.windup > 0) {
      e.windup = Math.max(0, e.windup - dt);
      if (e.windup > 0) return;
      this.action = "burst";
    }
    if (this.burstLeft > 0 && e.weapon.fire(e, shots, "enemy", 0.26))
      this.burstLeft--;
    if (this.burstLeft === 0 && e.weapon.cooldown === 0) {
      this.action = "reload";
      this.timer = 2.25;
      e.windup = 0;
    }
  }
  private melee(
    e: EnemyController,
    dt: number,
    p: PlayerController,
    dx: number,
    dy: number,
  ): void {
    const dist = Math.abs(dx),
      cfg = C.enemies.melee;
    if (this.action === "recover" && this.timer > 0) {
      e.state = "Idle";
      e.vx = 0;
      return;
    }
    if (this.action === "chargeWindup") {
      e.state = "Attack";
      e.vx = 0;
      e.facing = this.direction;
      e.windup = Math.max(0, e.windup - dt);
      if (e.windup === 0) {
        this.action = "charge";
        this.timer = 0.42;
      }
      return;
    }
    if (this.action === "charge") {
      e.state = "Chase";
      e.facing = this.direction;
      e.vx = this.direction * 285;
      if ((dist < 48 && Math.abs(dy) < 50) || this.timer === 0) {
        if (dist < 48 && Math.abs(dy) < 50) p.takeDamage(1, this.direction);
        this.action = "recover";
        this.timer = 0.7;
        e.attackCooldown = 1.1;
        e.vx = 0;
      }
      return;
    }
    if (this.action === "swing") {
      e.state = "Attack";
      e.vx = 0;
      e.windup = Math.max(0, e.windup - dt);
      if (e.windup === 0) {
        if (dist < cfg.range + 10 && Math.abs(dy) < 50)
          p.takeDamage(1, e.facing);
        this.action = "recover";
        this.timer = 0.45;
        e.attackCooldown = cfg.interval;
      }
      return;
    }
    if (
      e.attackCooldown === 0 &&
      e.grounded &&
      Math.abs(dy) < 50 &&
      dist < 175
    ) {
      this.action = dist < 55 ? "swing" : "chargeWindup";
      e.windup = dist < 55 ? 0.35 : 0.6;
      this.direction = e.facing;
      e.state = "Attack";
      e.vx = 0;
      return;
    }
    this.action = "approach";
    e.state = "Chase";
    e.vx = e.facing * cfg.speed;
  }
}

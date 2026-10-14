import { GameConfig as C, WeaponId } from "../core/GameConfig";
import { AnimationState, Facing } from "../core/Types";
import { StickmanAnimator } from "../render/StickmanAnimator";
import { ProjectileManager } from "./ProjectileManager";
export interface ArmedSource {
  x: number;
  y: number;
  facing: Facing;
  animation: AnimationState;
  animationTime: number;
  stride?: number;
  groundSlope?: number;
  landTime?: number;
  recoil: number;
  deadTime: number;
  kind?: string;
  aimPitch?: number;
  weaponId?: WeaponId;
}
/** Shared weapon definition and firing pipeline for all three silhouettes. */
export class WeaponSystem {
  cooldown = 0;
  flash = 0;
  flashX = 0;
  flashY = 0;
  flashFacing: Facing = 1;
  flashPitch = 0;
  private animator = new StickmanAnimator();
  ammo: number = -1;
  shots = 0;
  constructor(public id: WeaponId = "rifle") {
    this.equip(id);
  }
  equip(id: WeaponId): void {
    this.id = id;
    this.ammo = C.weapons[id].ammo;
    this.cooldown = 0;
  }
  reset(): void {
    this.cooldown = this.flash = 0;
    this.equip("rifle");
    this.shots = 0;
  }
  update(dt: number): void {
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.flash = Math.max(0, this.flash - dt);
  }
  fire(
    source: ArmedSource,
    projectiles: ProjectileManager,
    owner: "player" | "enemy",
    interval?: number,
  ): boolean {
    if (this.cooldown > 0) return false;
    if (owner === "player" && this.ammo === 0) this.equip("rifle");
    const config = C.weapons[this.id],
      scale = source.kind === "guard" ? 1.08 : 1;
    const pose = this.animator.sample(
      source.animation,
      source.animationTime,
      config.recoil,
      true,
      source.deadTime,
      source.aimPitch ?? 0,
      source,
    );
    const pitch = source.aimPitch ?? 0;
    const x =
        source.x +
        (pose.rightHand.x + config.muzzleLength * Math.cos(pitch)) *
          source.facing *
          scale,
      y =
        source.y +
        (pose.rightHand.y + config.muzzleLength * Math.sin(pitch)) * scale;
    let fired = false;
    for (let i = 0; i < config.pellets; i++)
      fired =
        projectiles.spawn({
          owner,
          x,
          y,
          direction: source.facing,
          speed: owner === "player" ? config.speed : C.enemyProjectile.speed,
          damage: config.damage,
          range: owner === "player" ? config.range : C.enemyProjectile.range,
          pitch: pitch + (i - (config.pellets - 1) / 2) * config.spread,
          kind:
            this.id === "rocket"
              ? "rocket"
              : this.id === "shotgun"
                ? "pellet"
                : "bullet",
          blastRadius: config.blastRadius,
          knockback: config.knockback,
          originX: source.x,
          originY: y,
        }) || fired;
    if (!fired) return false;
    source.recoil = config.recoil;
    if (source.weaponId !== undefined) source.weaponId = this.id;
    if (this.id === "rocket") {
      for (let n = 0; n < 5; n++)
        projectiles.particles.emit(
          source.x - 20 * source.facing,
          source.y + 45 + (n - 2) * 4,
          "smoke",
          -source.facing * (85 + n * 15),
          25 + n * 10,
        );
    } else
      projectiles.particles.emit(
        source.x - 4 * source.facing,
        source.y + 42,
        "shell",
        -source.facing * 90,
        160,
      );
    if (owner === "player" && this.ammo > 0) this.ammo--;
    this.shots++;
    this.flash = this.id === "rifle" ? 0.06 : 0.1;
    this.flashX = x;
    this.flashY = y;
    this.flashFacing = source.facing;
    this.flashPitch = pitch;
    this.cooldown = interval ?? config.interval;
    return true;
  }
}

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
  recoil: number;
  deadTime: number;
  kind?: string;
}
/** Weapon selection seam for future weapon definitions. V0.1 only implements rifle. */
export class WeaponSystem {
  cooldown = 0;
  flash = 0;
  flashX = 0;
  flashY = 0;
  flashFacing: Facing = 1;
  private animator = new StickmanAnimator();
  constructor(readonly id: WeaponId = "rifle") {}
  reset(): void {
    this.cooldown = this.flash = 0;
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
    const config = C.weapons[this.id],
      scale = source.kind === "guard" ? 1.08 : 1;
    const pose = this.animator.sample(
      source.animation,
      source.animationTime,
      1,
      true,
      source.deadTime,
    );
    const x = source.x + (pose.rightHand.x + 17) * source.facing * scale,
      y = source.y + pose.rightHand.y * scale;
    const fired = projectiles.spawn({
      owner,
      x,
      y,
      direction: source.facing,
      speed: owner === "player" ? config.speed : C.enemyProjectile.speed,
      damage: config.damage,
      range: owner === "player" ? config.range : C.enemyProjectile.range,
    });
    if (!fired) return false;
    source.recoil = 1;
    this.flash = 0.045;
    this.flashX = x;
    this.flashY = y;
    this.flashFacing = source.facing;
    this.cooldown = interval ?? config.interval;
    return true;
  }
}

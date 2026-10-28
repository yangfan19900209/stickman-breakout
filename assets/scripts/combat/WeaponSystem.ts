import { GameConfig as C, WeaponId } from "../core/GameConfig";
import { AnimationState, Facing } from "../core/Types";
import { StickmanAnimator } from "../render/StickmanAnimator";
import { ProjectileManager } from "./ProjectileManager";
import { comicMuzzle } from "../render/ComicPose";
import { weaponPresentation } from "./WeaponPresentation";
import { comicPose } from "../render/ComicPose";
import { directBarrel } from "../render/DirectPose";
export interface ArmedSource {
  x: number;
  y: number;
  facing: Facing;
  animation: AnimationState;
  animationTime: number;
  stride?: number;
  groundSlope?: number;
  landTime?: number;
  airJumpTime?: number;
  action?: string;
  recoil: number;
  deadTime: number;
  kind?: string;
  aimPitch?: number;
  weaponId?: WeaponId;
  vx?: number;
  crouched?: boolean;
  throwTime?: number;
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
  revision = 0;
  lastShot: WeaponId = "rifle";
  private lastGun: { id: WeaponId; ammo: number; cooldown:number } = { id:"rifle",ammo:-1,cooldown:0 };
  canPresent: (id: WeaponId) => boolean = () => true;
  get presentation() { return weaponPresentation(this.id, this.ammo); }
  constructor(public id: WeaponId = "rifle") {
    this.equip(id);
  }
  equip(id: WeaponId, ammo = C.weapons[id].ammo as number): boolean {
    // Resource validation precedes the atomic state change. Pickups remain on
    // the floor if their presentation is not ready; no empty intermediate state.
    if (!this.canPresent(id)) return false;
    if (id === "knife" && this.id !== "knife") this.lastGun = {id:this.id,ammo:this.ammo,cooldown:this.cooldown};
    this.id = id;
    this.ammo = ammo;
    this.cooldown = 0;
    this.flash = 0;
    this.revision++;
    return true;
  }
  toggleKnife(): boolean {
    if(this.id!=="knife")return this.equip("knife");
    if(!this.equip(this.lastGun.id,this.lastGun.ammo))return false;
    this.cooldown=this.lastGun.cooldown;return true;
  }
  reset(): void {
    this.cooldown = this.flash = 0;
    this.equip("rifle");
    this.lastGun = {id:"rifle",ammo:-1,cooldown:0};
    this.shots = 0;
  }
  update(dt: number): void {
    if(this.id==="knife")this.lastGun.cooldown=Math.max(0,this.lastGun.cooldown-dt);
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.flash = Math.max(0, this.flash - dt);
  }
  fire(
    source: ArmedSource,
    projectiles: ProjectileManager,
    owner: "player" | "enemy",
    interval?: number,
  ): boolean {
    if (this.id === "knife") return false;
    if (this.cooldown > 0) return false;
    if (owner === "player" && this.ammo === 0 && !this.equip("rifle")) return false;
    const config = C.weapons[this.id],
      scale = source.kind === "guard" ? 1.08 : 1;
    const projectile = this.presentation.projectile;
    if (!projectile) return false;
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
    const socket = C.artStyle === "comic" && owner === "player"
      ? comicMuzzle({ ...source, weaponId:this.id, animation: source.animation, recoil: config.recoil }, pitch, this.id === "rifle" ? 0 : 9)
      : undefined;
    const barrel = socket && this.id === "rocket" ? directBarrel(comicPose({...source,weaponId:this.id,recoil:config.recoil})) : undefined;
    const x =
        source.x +
        (socket?.x ?? (pose.rightHand.x + config.muzzleLength * Math.cos(pitch))) *
          source.facing *
          scale,
      y =
        source.y +
        (socket?.y ?? (pose.rightHand.y + config.muzzleLength * Math.sin(pitch))) * scale;
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
          kind: projectile,
          blastRadius: config.blastRadius,
          knockback: config.knockback,
          originX: source.x,
          originY: y,
          homing: owner === "player" && this.id === "rocket",
          launchPitch: barrel?.pitch,
        }) || fired;
    if (!fired) return false;
    source.recoil = config.recoil;
    if (source.weaponId !== undefined) source.weaponId = this.id;
    if (this.id === "rocket") {
      const backX=source.x+(barrel?.backX ?? -20)*source.facing;
      const backY=source.y+(barrel?.backY ?? 45);
      const axis=barrel?.pitch ?? pitch;
      for (let n = 0; n < 5; n++)
        projectiles.particles.emit(
          backX,
          backY + (n - 2) * 4,
          "smoke",
          -source.facing * Math.cos(axis) * (85 + n * 15),
          -Math.sin(axis) * (85+n*15)+25+n*10,
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
    this.lastShot = this.id;
    this.flash = this.id === "rifle" ? 0.06 : 0.1;
    this.flashX = x;
    this.flashY = y;
    this.flashFacing = source.facing;
    this.flashPitch = barrel?.pitch ?? pitch;
    this.cooldown = interval ?? config.interval;
    return true;
  }
}

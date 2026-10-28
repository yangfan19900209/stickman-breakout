import { ComicAssets, ComicBatch } from "./ComicAssets";
import { Ink, colors } from "./Ink";
import { GameSession } from "../core/GameSession";
import { Projectile } from "../combat/ProjectileManager";
import { Grenade } from "../combat/GrenadeSystem";
import { WeaponSystem } from "../combat/WeaponSystem";
import { Particle } from "../combat/ParticlePool";
import { ComicClips, ComicFrames } from "./ComicFrames";
import { comicMuzzle } from "./ComicPose";
import { ArmedSource } from "../combat/WeaponSystem";
import { rocketCrop } from "./RocketPresentation";
import { GameConfig as C } from "../core/GameConfig";
import { UITransform } from "cc";

/** Separate timed flash, illustrated ink burst, rising sprite smoke and physical debris. */
export class ComicCombatArt {
  private batch?: ComicBatch;
  readonly playerRockets:{x:number;y:number;width:number;angle:number;age:number}[]=[];
  muzzlePoint?:{x:number;y:number;pitch:number};
  begin(ink: Ink): void {
    this.playerRockets.length=0;this.muzzlePoint=undefined;
    this.batch ??= new ComicBatch(ink.node, "Comic combat pool");
    this.batch.begin();
  }
  end(): void {
    this.batch?.end();
  }
  knife(x:number,y:number,angle:number,facing:number,width:number):boolean {
    if(!ComicAssets.enabled)return false;
    this.batch!.put("weapon.knife",x,y,width,undefined,angle*facing*180/Math.PI,255,facing,[0,.5]);
    return true;
  }
  blast(
    ink: Ink,
    b: GameSession["explosions"]["items"][number],
    cam: number,
    ground: number,
  ): boolean {
    if (!ComicAssets.enabled) return false;
    const x = b.x - cam,
      r = b.radius,
      t = b.age;
    if (t < 0.32) {
      ink.circle(
        x,
        b.y,
        r * Math.sqrt(t / 0.32),
        colors.ink,
        undefined,
        Math.max(1, 5 * (1 - t / 0.32)),
      );
      if (b.y - r < ground)
        ink.ellipse(
          x,
          ground + 3,
          r * Math.sqrt(t / 0.32),
          10 + t * 30,
          colors.muted,
          undefined,
          2,
        );
    }
    if (t < 0.055)
      ink.circle(x, b.y, 15 + t * r * 7, colors.ink, colors.white, 4);
    const stage = Math.min(6, Math.floor(t / .07));
    if (t < 0.56)
      this.batch!.put(
        ComicClips.explosion[stage],
        x,
        b.y - r * 0.32,
        r * [.22, .48, .85, 1.1, 1.45, 1.7, 1.85][stage],
        undefined,
        0,
        Math.min(255, (0.56 - t) * 1800),
        1,
        [0.5, 0.08],
      );
    if (t > 0.1)
      for (let n = 0; n < 3; n++) {
        const age = t - 0.1,
          side = n - 1;
        this.batch!.put(
          "effect.smoke",
          x + side * r * (0.17 + age * 0.22),
          b.y + r * 0.12 + age * (65 + n * 16),
          r * (0.35 + age * 0.45),
          undefined,
          side * (8 + age * 12),
          Math.min(230, Math.max(0, (0.85 - t) * 400)),
          n % 2 ? -1 : 1,
        );
      }
    return true;
  }
  particle(p: Particle, cam: number): boolean {
    if (!ComicAssets.enabled) return false;
    if (p.kind !== "smoke" && p.kind !== "impact" && p.kind !== "dust") return false;
    const a = 1 - p.life / p.maxLife;
    this.batch!.put(
      p.kind === "smoke" ? "effect.smoke" : p.kind === "dust" ? "effect.dust" : p.material === "metal" ? "effect.metal" : p.material === "wood" ? "effect.wood" : "effect.impact",
      p.x - cam,
      p.y,
      p.kind === "smoke" ? p.size * 2.8 + a * 32 : p.kind === "dust" ? 22 + a * 20 : p.size * 2.4,
      undefined,
      p.kind === "smoke" ? p.spin * 8 : p.spin * 25,
      Math.max(0, (255 * p.life) / p.maxLife),
    );
    return true;
  }
  projectile(p: Projectile, cam: number): boolean {
    if (!ComicAssets.enabled || p.kind === "shockwave")
      return false;
    const angle = (Math.atan2(p.vy, p.vx) * 180) / Math.PI;
    const rocket = p.kind === "rocket" || p.kind === "cannon";
    if(p.kind === "rocket" && p.owner === "player") {
      const size=ComicFrames["projectile.rocket"].size;
      const sprite=this.batch!.putRegion("projectile.rocket",p.x-cam,p.y,C.rocketLaunch.visualLength/size[0],rocketCrop(p.distance,size[0],size[1]),angle,[1,.5]);
      this.playerRockets.push({x:sprite.position.x+cam,y:sprite.position.y,width:sprite.getComponent(UITransform)!.contentSize.width,angle:sprite.angle,age:p.age});
      return true;
    }
    this.batch!.put(
      rocket ? "projectile.rocket" : p.kind === "pellet" ? "projectile.pellet" : "projectile.bullet",
      p.x - cam,
      p.y,
      rocket ? 116 : p.kind === "pellet" ? 30 : 86,
      rocket ? undefined : p.kind === "pellet" ? 11 : 19,
      angle,
      255,
      1,
      [1, 0.5],
    );
    return true;
  }
  grenade(g: Grenade, cam: number): boolean {
    if (!ComicAssets.enabled) return false;
    this.batch!.put(
      "projectile.grenade",
      g.x - cam,
      g.y,
      19,
      26,
      (g.spin * 180) / Math.PI,
      255,
      1,
      [0.5, 0.42],
    );
    return true;
  }
  muzzle(w: WeaponSystem, cam: number, source?: ArmedSource): boolean {
    if (!ComicAssets.enabled) return false;
    const tip = source ? comicMuzzle(source, source.aimPitch ?? 0, w.id === "rifle" ? 0 : 9) : undefined;
    if (w.flash > 0) {
      const sprite=this.batch!.put(
        w.id === "rocket" ? "effect.smoke" : w.id === "shotgun" ? "effect.muzzle-large" : "effect.muzzle",
        tip && source ? source.x + tip.x * source.facing - cam : w.flashX - cam,
        tip && source ? source.y + tip.y : w.flashY,
        w.id === "shotgun" ? 84 : w.id === "rocket" ? 72 : 48,
        undefined,
        (w.flashPitch * w.flashFacing * 180) / Math.PI,
        255,
        w.flashFacing,
        [0, 0.5],
      );
      if(source)this.muzzlePoint={x:sprite.position.x+cam,y:sprite.position.y,pitch:sprite.angle*Math.PI/180/w.flashFacing};
    }
    return true;
  }
}

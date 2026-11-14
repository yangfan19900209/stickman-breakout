import { Node, Color } from "cc";
import { Ink, colors, node } from "../render/Ink";
import { ComicFrames } from "../render/ComicFrames";
import { OceanScenery } from "./OceanScenery";
import { ComicBatch } from "../render/ComicAssets";
import { comicPose } from "../render/ComicPose";
import { OceanAssets, OceanBatch } from "./OceanAssets";
import { OceanFrames } from "./OceanFrames";
import { MINI_SUB } from "./OceanMiniSub";
import { OCEAN_JELLY } from "./OceanJellyfish";
import { OCEAN_FISH } from "./OceanFish";
import { OceanSession } from "./OceanSession";
import { OceanLevel as L } from "./OceanLevel";
import { OceanGunPoses, oceanGunTransform, oceanGunOrigin } from "./OceanPose";
import { bulletCrop } from "../render/RocketPresentation";
import { clamp } from "../core/Types";
import { OceanEntry as E, entryPhase } from "./OceanEntry";
import { oceanBlastVisual, oceanReticleStyle, oceanVolleyOffsets, oceanBossTuning as B } from "./OceanCombatTuning";
import { CombatPalette, attackEffectTint, waterBlastTint } from '../render/CombatPalette';

const bossWarning=new Color(...CombatPalette.warning),bossAttack=new Color(...CombatPalette.fire);
import { oceanEnemyPose, oceanShotVisual } from "./OceanEnemyPose";
import { shieldBreakFrame } from "../render/ShieldBreakFrames";
export class OceanRenderer {
  readonly root: Node;
  private scenery: OceanScenery;
  get sceneryStatus() {
    return this.scenery.status;
  }
  playerSize = { width: 0, height: 0 };
  private ink: Ink;
  private sprites: OceanBatch;
  private fx: Ink;
  private slashPoints = Array.from({ length: 12 }, () => ({ x: 0, y: 0 }));
  private landHero: ComicBatch;
  playerFrame = "";
  muzzleVisual: {x:number;y:number;angle:number;weapon:string;visible:boolean} | null = null;
  aimVisual: (ReturnType<OceanSession["aimIndicator"]> & {radius:number;acquireProgress:number;color:readonly number[];lineWidth:number}) | null = null;
  enemyVisuals: {
    id: string;
    frame: string;
    scale: number;
    mode: string;
    muzzle: { x: number; y: number };
    hit?: number;
    alpha?: number;
    shieldHp?: number;
  }[] = [];
  projectileVisuals: {
    owner: string;
    kind: string;
    tier: string;
    width: number;
    height: number;
    frame?: string;
    fullWidth?:number; x?:number; y?:number; distance?:number;
  }[] = [];
  constructor(parent: Node) {
    this.root = node(parent, "Deep sea chapter");
    this.scenery = new OceanScenery(this.root);
    this.ink = new Ink(node(this.root, "Sea geometry"));
    this.sprites = new OceanBatch(node(this.root, "Sea actors"));
    this.landHero = new ComicBatch(
      node(this.root, "Shore soldier"),
      "Shore hero",
    );
    this.fx = new Ink(node(this.root, "Sea warnings"));
  }
  draw(s: OceanSession, width: number, height: number) {
    const cx = s.camera.x,
      cy = s.camera.y,
      p = s.player,
      w = width / s.camera.zoom,
      h = height / s.camera.zoom;
    this.scenery.draw(s, w, h);
    this.sprites.begin();
    this.landHero.begin();
    this.ink.clear();
    this.fx.clear();
    this.projectileVisuals.length = 0;
    this.enemyVisuals.length = 0;
    this.aimVisual = null;
    this.muzzleVisual = null;
    if (
      s.stage === "swimming" &&
      s.knifeTime > 0.07 &&
      s.knifeTime <= 0.2 &&
      p.hitTime <= 0
    ) {
      const t = (0.2 - s.knifeTime) / 0.13,
        end = 1 - 2 * t;
      for (let i = 0; i < 12; i++) {
        const a = end + 0.7 * (1 - i / 11),
          q = this.slashPoints[i];
        q.x = p.x - cx + p.facing * (24 + Math.cos(a) * 54);
        q.y = p.y - cy + 35 + Math.sin(a) * 54;
      }
      this.fx.line(this.slashPoints, 7, colors.ink);
      this.fx.line(this.slashPoints, 3.5, colors.paper);
    }
    const shore = s.stage !== "swimming";
    const put = (
      id: string,
      x: number,
      y: number,
      sw: number,
      sh?: number,
      a = 0,
      flip = 1,
      alpha = 255,
      anchor: readonly number[] = [0.5, 0.5],
    ) => this.sprites.put(id, x - cx, y - cy, sw, sh, a, flip, alpha, anchor);
    const inView = (x: number, pad = 200) => x > cx - pad && x < cx + w + pad;
    if (shore) {
      if (s.stage === "shore") {
        const frame = comicPose(p);
        this.playerFrame = frame;
        const size = ComicFrames[frame].sourceSize;
        this.playerSize = { width: size[0] * 0.64, height: size[1] * 0.64 };
        this.landHero.put(
          frame,
          p.x - cx,
          p.y - cy,
          this.playerSize.width,
          this.playerSize.height,
          0,
          255,
          p.facing,
        );
      } else if (s.stage === "equipping") {
        const phase = entryPhase(s.introTime);
        const id =
          phase === "reach" || phase === "open"
            ? "shore.reach"
            : phase === "take"
              ? "shore.take"
              : phase === "mask"
                ? "diver.equip.mask"
                : phase === "tank"
                  ? "diver.equip.tank"
                  : phase === "walk"
                    ? `diver.harpoon.hover.${Math.floor(p.stride * 9) % 2}`
                    : "diver.harpoon.fire";
        this.playerFrame = id;
        const d = OceanFrames[id];
        const scale = id.startsWith("shore.")
          ? 0.185
          : id.startsWith("diver.harpoon.")
            ? 0.196
            : 0.2;
        this.playerSize = {
          width: d.sourceSize[0] * scale,
          height: d.sourceSize[1] * scale,
        };
        put(
          id,
          p.x,
          p.y,
          this.playerSize.width,
          this.playerSize.height,
          0,
          1,
          255,
          [id === "shore.reach" ? 0.38 : 0.5, 0],
        );
      } else {
        const id =
          s.introTime < E.leapAt + 0.6
            ? "diver.cliff.leap"
            : "diver.entry.diagonal";
        this.playerFrame = id;
        const d = OceanFrames[id],
          scale = id.endsWith("diagonal") ? 0.15 : 0.21;
        this.playerSize = {
          width: d.sourceSize[0] * scale,
          height: d.sourceSize[1] * scale,
        };
        put(id, p.x, p.y + 40, this.playerSize.width, this.playerSize.height);
      }
      const chest =
        s.stage === "shore" || s.introTime < E.openAt
          ? "chest.closed"
          : s.introTime < E.takeAt
            ? "chest.half"
            : "chest.open";
      const cd = OceanFrames[chest];
      put(
        chest,
        E.chestX,
        720,
        cd.sourceSize[0] * 0.16,
        cd.sourceSize[1] * 0.16,
        0,
        1,
        255,
        [0.5, 0],
      );
    } else {
      for (const c of L.currents)
        if (inView(c.x, 500)) {
          for (let i = 0; i < 6; i++) {
            const x = c.x + ((s.time * 40 + i * 75) % c.w),
              y = c.y + 35 + ((i * 53) % c.h);
            this.fx.segment(
              x - cx,
              y - cy,
              x - cx + Math.sign(c.vx) * 23,
              y - cy + 8,
              1.5,
              colors.mid,
            );
          }
        }
      for (const [i, kelp] of L.ambientKelp.entries()) if (inView(kelp.x)) {
        const id = `kelp.ambient.${i % 2}`, d = OceanFrames[id];
        put(id, kelp.x, kelp.y, 72, 72 * d.sourceSize[1] / d.sourceSize[0],
          Math.sin(s.time * 1.2 + i) * 3, 1, 180, [.5, 0]);
      }
      for (const c of s.crates)
        if (inView(c.x) && (c.hp > 0 || c.deadTime < 4))
          put(
            c.hp > 0 ? "object.sealed-crate" : "object.crate-broken",
            c.x,
            c.y,
            c.hp > 0 ? 52 : 55,
            undefined,
            0,
            1,
            255,
            [0.5, 0],
          );
      for (const d of s.drops)
        if (d.active && inView(d.x)) {
          const id =
            d.kind === "torpedo"
              ? "item.torpedo-launcher"
              : d.kind === "sonar"
                ? "item.sonar"
                : `item.${d.kind}`;
          this.fx.circle(d.x - cx, d.y - cy, 25, colors.mid, undefined, 1);
          put(id, d.x, d.y, 38);
        }
      for (const e of s.enemies) {
        const deathDuration =
          e.kind === "captain" ? MINI_SUB.deathDuration : 1.2;
        if (!inView(e.x) || (e.hp <= 0 && e.deadTime > deathDuration)) continue;
        const dead = e.hp <= 0,
          alpha = dead
            ? Math.round(
                255 *
                  Math.min(1, Math.max(0, (deathDuration - e.deadTime) / 0.65)),
              )
            : 255;
        if (e.kind === "diver" || e.kind === "captain") {
          const pose = oceanEnemyPose(e, s.time);
          put(
            pose.id,
            pose.pivot.x,
            pose.pivot.y,
            pose.width,
            pose.height,
            (pose.angle * 180) / Math.PI +
              (dead && e.kind !== "captain" ? -e.deadTime * 35 : 0),
            pose.flip,
            alpha,
            pose.anchor,
          );
          this.enemyVisuals.push({
            id: e.id,
            frame: pose.id,
            scale: pose.scale,
            mode: e.mode,
            muzzle: pose.muzzle,
            hit: e.hit,
            alpha,
            shieldHp: e.shieldHp,
          });
          if(e.kind === "diver" && !dead && (e.fireFlash ?? 0)>0){
            put("fx.bubble.burst",pose.muzzle.x,pose.muzzle.y,17,undefined,e.angle*180/Math.PI,1,200,[0,.5]);
            this.sprites.tintLast(CombatPalette.fire);
          }
        } else {
          let id = "",
            scale = 0.24;
          if (e.kind === "fish") {
            id = `fish.predator.${dead ? "defeat" : e.mode === "tell" ? "tell" : e.mode === "attack" ? "dash" : e.mode === "rest" && e.timer>.8 ? "recover" : `swim.${Math.floor(s.time*6)%2}`}`;
            scale=OCEAN_FISH.scale;
          }
          if (e.kind === "jellyfish") {
            id = `jellyfish.${dead ? "defeat" : e.mode === "tell" ? "tell" : e.mode === "attack" ? "sting" : e.mode === "rest" && e.timer > .8 ? "recover" : `swim.${Math.floor(s.time * 5) % 2}`}`;
            scale = OCEAN_JELLY.scale;
          }
          if (e.kind === "turret") {
            id = "object.seabed-turret";
            scale = 80 / OceanFrames[id].sourceSize[0];
          }
          if (e.kind === "mine") {
            id = "object.anchored-mine";
            scale = 53 / OceanFrames[id].sourceSize[0];
            if (!dead)
              this.ink.segment(
                e.x - cx,
                L.floor - cy,
                e.x - cx,
                e.y + 8 - cy,
                1.5,
                colors.muted,
              );
          }
          const d = OceanFrames[id],
            flip = e.kind === "fish" || e.kind === "jellyfish" ? (Math.cos(e.angle)<0?1:-1) : e.x > p.x ? 1 : -1;
          const aimed =
            e.kind === "fish" && (e.mode === "tell" || e.mode === "attack");
          put(
            id,
            e.x,
            e.y + (e.kind === "jellyfish" ? OCEAN_JELLY.centerY : e.kind === "fish" ? OCEAN_FISH.centerY : aimed ? 29 : 0),
            d.sourceSize[0] * scale,
            d.sourceSize[1] * scale,
            dead
              ? -12
              : aimed
                ? ((e.angle - (flip === 1 ? Math.PI : 0)) * 180) / Math.PI
                : 0,
            flip,
            alpha,
            [0.5, e.kind === "fish" || e.kind === "jellyfish" ? .5 : aimed ? 29 / (d.sourceSize[1] * scale) : 0],
          );
          this.enemyVisuals.push({
            id: e.id,
            frame: id,
            scale,
            mode: e.mode,
            muzzle: { x: e.x, y: e.y + (e.kind === "jellyfish" ? OCEAN_JELLY.centerY : 32) },
          });
        }
        if (e.mode === "tell") {
          const origin =
            e.kind === "diver" || e.kind === "captain"
              ? oceanEnemyPose(e, s.time).muzzle
              : { x: e.x, y: e.y + (e.kind === "jellyfish" ? OCEAN_JELLY.centerY : 32) };
          const length =
            e.attack === "sting" ? OCEAN_JELLY.range : e.attack === "dash" || e.attack === "dive"
              ? Math.min(e.kind === "fish" ? OCEAN_FISH.range + 60 : 460, Math.hypot(p.x - e.x, p.y - e.y) + 60)
              : e.attack === "torpedo"
                ? 200
                : e.attack === "sonar"
                  ? 110
                  : 170;
          const offsets = e.kind === "captain" ? [0] : oceanVolleyOffsets(e.kind);
          for (const offset of offsets) this.fx.segment(
            origin.x - cx,
            origin.y - cy,
            origin.x - cx + Math.cos(e.angle + offset) * length,
            origin.y - cy + Math.sin(e.angle + offset) * length,
            e.locked ? 2 : 1.2,
            e.kind === "captain" ? bossWarning : colors.mid,
          );
          this.fx.circle(
            origin.x - cx,
            origin.y - cy,
            8,
            colors.ink,
            undefined,
            2,
          );
        }
      }
      if (inView(s.boss.x, 800)) {
        const b = s.boss,
          v = s.victory.time,
          fall = s.victory.active ? Math.max(0, v - 1.4) * 70 : 0;
        const hull = s.victory.active
          ? "submarine.hull.wreck"
          : b.phase >= 3
            ? "submarine.hull.damaged"
            : "submarine.hull.intact";
        put(
          hull,
          b.x,
          b.y - fall,
          650,
          undefined,
          s.victory.active ? -Math.min(22, v * 4) : 0,
          1,
          b.hit > 0 ? 180 : 255,
        );
        if (!s.victory.active) {
          for (const part of s.bossParts()) {
            const prefix =
              part.id === "laserHp"
                ? "laser"
                : part.id === "torpedoHp"
                  ? "torpedo"
                  : "cannon";
            const active =
              (prefix === "laser" &&
                (b.attack === "laser" || b.attack === "sweep")) ||
              (prefix === "torpedo" && b.attack === "torpedo");
            const frame =
              prefix === "torpedo"
                ? b[part.id] <= 0
                  ? "broken"
                  : active && b.mode !== "rest"
                    ? "open"
                    : "closed"
                : b[part.id] <= 0
                  ? "broken"
                  : prefix === "laser" && active && b.mode === "tell"
                    ? "charge"
                    : "idle";
            if (part.id === "torpedoHp")
              put(
                `module.${prefix}.${frame}`,
                part.x + part.w / 2,
                part.y + part.h / 2,
                part.w,
                part.h,
              );
            else {
              const transform = s.bossModuleTransform(part.id);
              put(
                `module.${prefix}.${frame}`,
                transform.pivot.x,
                transform.pivot.y,
                part.w,
                part.h,
                (transform.angle * 180) / Math.PI,
                1,
                255,
                transform.anchor,
              );
            }
          }
          const o = s.bossOrigin(),
            end = s.beamEnd();
          if (b.mode === "tell") {
              this.fx.segment(
                o.x - cx,
                o.y - cy,
                end.x - cx,
                end.y - cy,
                2,
                bossWarning,
              );
              if (b.attack === "sweep")
                for (const a of [b.angleStart, b.angleEnd])
                  this.fx.segment(
                    o.x - cx,
                    o.y - cy,
                    o.x - cx + Math.cos(a) * 1000,
                    o.y - cy + Math.sin(a) * 1000,
                    2,
                    bossWarning,
                  );
              if (b.attack === "fan" || b.attack === "torpedo") {
                const spread = b.attack === "fan" ? B.sonarOffsets[2] : .2;
                for(const edge of [-spread,spread])this.fx.segment(o.x-cx,o.y-cy,
                  o.x-cx+Math.cos(b.angle+edge)*600,o.y-cy+Math.sin(b.angle+edge)*600,1.5,bossWarning);
              }
              put("fx.laser-charge", o.x, o.y, 32 + Math.sin(s.time * 22) * 6);
              this.sprites.tintLast(CombatPalette.fire);
          }
          if (b.beamActive) {
            this.fx.segment(
              o.x - cx,
              o.y - cy,
              end.x - cx,
              end.y - cy,
              16,
              bossAttack,
            );
            this.fx.segment(
              o.x - cx,
              o.y - cy,
              end.x - cx,
              end.y - cy,
              8,
              colors.white,
            );
          }
        }
      }
      const flash =
        p.hitTime <= 0 &&
        p.invincible > 0 &&
        Math.floor(p.animationTime * 14) % 2 === 0
          ? 150
          : 255;
      if (
        s.weapon !== "knife" &&
        s.knifeTime <= 0 &&
        !s.victory.active &&
        p.hitTime <= 0 &&
        p.alive
      ) {
        const weapon = s.heldWeapon;
        const d = s.heldPose(weapon),
          { flip, angle } = oceanGunTransform(s.aim, s.gunFacing),
          origin = oceanGunOrigin(p.x,p.y,s.aim,p.recoil,weapon);
        this.playerFrame = d.frame;
        this.playerSize = {
          width: d.size[0] * d.scale,
          height: d.size[1] * d.scale,
        };
        put(
          d.frame,
          origin.x,
          origin.y,
          d.size[0] * d.scale,
          d.size[1] * d.scale,
          (angle * 180) / Math.PI,
          flip,
          flash,
          [d.pivot[0] / d.size[0], 1 - d.pivot[1] / d.size[1]],
        );
        const muzzle=s.muzzle(),visible=p.recoil>.28;
        this.muzzleVisual={...muzzle,angle:s.aim,weapon,visible};
        if(visible){put(weapon === "sonar" ? "fx.sonar.0" : "fx.bubble.burst",
          muzzle.x,muzzle.y,weapon === "torpedo" ? 26 : 19,undefined,s.aim*180/Math.PI,1,
          160+80*p.recoil,[0,.5]);
          this.sprites.tintLast(CombatPalette.fire);
        }
      } else {
        let id: string,
          scale = 0.21;
        if (s.victory.cheerTime > 0) {
          id = `diver.cheer.${Math.floor(s.victory.cheerTime * 3) % 2}`;
        } else if (!p.alive) {
          id = "diver.death";
          scale = 0.25;
        } else if (p.hitTime > 0) id = "diver.hit";
        else if (s.knifeTime > 0 || s.weapon === "knife") {
          id =
            s.knifeTime > 0 && s.knifeTime < 0.22
              ? "diver.knife.strike"
              : "diver.knife.windup";
          scale = 0.25;
        } else if (s.boostTime > 0) id = "diver.boost";
        else if (Math.hypot(p.vx, p.vy) > 25)
          id = `diver.swim.${Math.floor(p.animationTime * 7) % 4}`;
        else id = `diver.hover.${Math.floor(p.animationTime * 2) % 2}`;
        if (
          p.alive &&
          !s.victory.active &&
          p.hitTime <= 0 &&
          s.weapon !== "knife" &&
          s.knifeTime <= 0
        ) {
          if (s.weapon === "harpoon") {
            scale = 0.196;
            id =
              s.boostTime > 0
                ? "diver.harpoon.boost"
                : Math.hypot(p.vx, p.vy) > 25
                  ? `diver.harpoon.swim.${Math.floor(p.animationTime * 6) % 2}`
                  : `diver.harpoon.hover.${Math.floor(p.animationTime * 3) % 2}`;
          }
        }
        this.playerFrame = id;
        const d = OceanFrames[id];
        this.playerSize = {
          width: d.sourceSize[0] * scale,
          height: d.sourceSize[1] * scale,
        };
        put(
          id,
          p.x,
          p.y + 38,
          d.sourceSize[0] * scale,
          d.sourceSize[1] * scale,
          0,
          p.facing,
          flash,
        );
      }
    }
    for (const shot of s.projectiles)
      if (shot.active && inView(shot.x)) {
        const a = Math.atan2(shot.vy, shot.vx),
          visual = oceanShotVisual(shot.kind, shot.owner, shot.tier);
        const full=OceanAssets.frames.get(visual.id)!,
          crop=bulletCrop(shot.distance,full.rect.width,full.rect.height,visual.width),
          width=shot.kind === "bomb" || shot.kind === "sonar" ? visual.width : visual.width*crop[2]/full.rect.width;
        this.projectileVisuals.push({
          owner: shot.owner,
          kind: shot.kind,
          tier: shot.tier,
          width,
          fullWidth:visual.width,x:shot.x,y:shot.y,distance:shot.distance,
          height: visual.height,
          frame: visual.id,
        });
        if (shot.kind === "torpedo" && shot.distance >= visual.width)
          for (let i = 1; i <= 3; i++)
            this.fx.circle(
              shot.x - cx - Math.cos(a) * (visual.width + i * 10),
              shot.y - cy - Math.sin(a) * (visual.width + i * 10),
              2 + i * 0.5,
              colors.mid,
              undefined,
              1,
            );
        if(shot.kind !== "bomb" && shot.kind !== "sonar")this.sprites.putRegion(visual.id,shot.x-cx,shot.y-cy,width,visual.height,a*180/Math.PI,crop);
        else put(
          visual.id,
          shot.x,
          shot.y,
          visual.width,
          visual.height,
          (a * 180) / Math.PI + (shot.kind === "bomb" ? Math.sin(shot.age * 14) * 12 : 0),
        );
        const tint=attackEffectTint(shot.kind);
        if(tint)this.sprites.tintLast(tint);
      }
    for (const f of s.effects)
      if (inView(f.x)) {
        if (f.kind === "shield") {
          this.landHero.put(shieldBreakFrame(f.age), f.x - cx, f.y - cy + f.age * 12,
            f.size, f.size, 0, Math.round(255 * Math.min(1, (.8 - f.age) / .25)), 1, [.5, .35]);
          continue;
        }
        if (f.kind === "blast") {
          const v = oceanBlastVisual(f.age),
            id = `fx.burst.${v.frame}`;
          put(
            id,
            f.x,
            f.y + f.age * 12,
            (f.size * v.cloudScale * OceanFrames[id].sourceSize[0]) / 477,
            undefined,
            0,
            1,
            v.opacity,
          );
          this.sprites.tintLast(waterBlastTint(f.age));
          continue;
        }
        if (f.kind === "hit") {
          const alpha = Math.round(255 * (1 - f.age / 0.24)),
            r = 7 + f.age * 40,
            stroke = new Color(35, 44, 48, alpha);
          for (let n = 0; n < 5; n++) {
            const a = (n * Math.PI * 2) / 5 + 0.3;
            this.fx.segment(
              f.x - cx + Math.cos(a) * r,
              f.y - cy + Math.sin(a) * r,
              f.x - cx + Math.cos(a) * (r + 8),
              f.y - cy + Math.sin(a) * (r + 8),
              2.5,
              stroke,
            );
          }
          // A hard black-white contact frame, then expanding ink chips/bubbles.
          // Enemy opacity stays solid; the discrete impact supplies the flash.
          put("fx.impact", f.x, f.y, f.size * (1.05 + f.age * 1.8), undefined,
            ((f.angle ?? 0) * 180) / Math.PI, 1, alpha);
          for (let n = 0; n < 4; n++) {
            const a = (f.angle ?? 0) + (n - 1.5) * .7;
            const d = 8 + f.age * (60 + n * 16);
            this.fx.segment(f.x - cx + Math.cos(a) * d, f.y - cy + Math.sin(a) * d,
              f.x - cx + Math.cos(a) * (d + 6), f.y - cy + Math.sin(a) * (d + 6), 3, stroke);
          }
          continue;
        }
        const id =
          f.kind === "bubble"
            ? "fx.bubble.trail"
            : f.kind === "splash"
              ? `fx.splash.${Math.min(2, Math.floor(f.age * 4))}`
              : "fx.burst.0";
        put(
          id,
          f.x,
          f.y + (f.kind === "bubble" ? f.age * 40 : 0),
          f.size,
          undefined,
          0,
          1,
          Math.round(
            255 *
              clamp(
                1 -
                  f.age /
                    (f.kind === "bubble" ? 1.5 : 0.8),
                0,
                1,
              ),
          ),
        );
      }
    const aim = s.aimIndicator();
    if (aim.visible) {
      const zoom=s.camera.zoom,style=oceanReticleStyle(aim.lockAge,aim.locked,zoom);
      const acquireProgress=style.progress,radius=style.radius;
      const x = aim.x - cx, y = aim.y - cy;
      const rgb=aim.locked?CombatPalette.fire:[95,95,95] as const;
      const ink = new Color(...rgb,aim.locked?255:160);
      this.aimVisual = {...aim,radius,acquireProgress,color:rgb,lineWidth:style.line};
      // Constant screen footprint, dark keyline and light halo keep the lock
      // readable over both white hulls and the blue-grey underwater background.
      this.fx.circle(x, y, radius, colors.white, undefined, style.halo);
      this.fx.circle(x, y, radius, colors.ink, undefined, style.line+1/zoom);
      this.fx.circle(x, y, radius, ink, undefined, style.line);
      for (let i=0;i<4;i++) {
        const angle=i*Math.PI/2+(aim.locked?(1-acquireProgress)*.4:0),dx=Math.cos(angle),dy=Math.sin(angle);
        const inner=radius-3/zoom,outer=radius+5/zoom;
        this.fx.segment(x+dx*inner,y+dy*inner,x+dx*outer,y+dy*outer,style.line+1/zoom,colors.ink);
        this.fx.segment(x+dx*inner,y+dy*inner,x+dx*outer,y+dy*outer,style.line,ink);
      }
      if (aim.locked) {
        this.fx.circle(x,y,2.8/zoom,colors.white,colors.white,1);
        this.fx.circle(x,y,1.5/zoom,ink,ink,1);
      }
      const length = Math.min(85, Math.hypot(aim.x-aim.origin.x, aim.y-aim.origin.y));
      for(let d=15;d<length;d+=14) this.fx.circle(aim.origin.x-cx+Math.cos(aim.angle)*d,
        aim.origin.y-cy+Math.sin(aim.angle)*d,1.4,ink,ink,1);
    }
    this.sprites.end();
    this.landHero.end();
  }
}

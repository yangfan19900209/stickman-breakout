import { Color, Node, UITransform } from "cc";
import { Ink, colors, node } from "../render/Ink";
import { ComicBatch } from "../render/ComicAssets";
import { ComicFrameId, ComicFrames, ComicClips } from "../render/ComicFrames";
import { rocketCrop, bulletCrop } from "../render/RocketPresentation";
import { projectileProfile } from "../combat/ProjectileProfile";
import { clamp } from "../core/Types";
import { FlightAssets, FlightBatch } from "./FlightAssets";
import { FlightFrames, FlightFrameId } from "./FlightFrames";
import { FlightSession, FlightEnemy } from "./FlightSession";
import { FlightLevel as L } from "./FlightLevel";
import { CombatPalette, fireBlastVisual } from '../render/CombatPalette';

const sky = new Color(244, 247, 246),
  warning = new Color(...CombatPalette.warning, 145),
  bossWarning = new Color(...CombatPalette.warning),
  boundary = new Color(136, 165, 170, 80);
const DEG = 180 / Math.PI;
const wrap = (value: number, span: number) => ((value % span) + span) % span;

export class FlightRenderer {
  readonly root: Node;
  private backdrop: Ink;
  private distant: FlightBatch;
  private clouds: ComicBatch;
  private structures: FlightBatch;
  private actors: FlightBatch;
  private loot: ComicBatch;
  private combat: ComicBatch;
  private warnings: Ink;
  playerFrame = "";
  playerSize = { width: 0, height: 0 };
  projectileVisuals: {
    owner: string;
    kind: string;
    tier: string;
    width: number;
    fullWidth: number;
    height?: number;
    x: number;
    y: number;
  }[] = [];
  enemyVisuals: {
    id: string;
    frame: string;
    mode: string;
    bodyBounds: object;
    muzzle: { x: number; y: number };
    renderedMuzzle?: { x: number; y: number };
    muzzleError?: number;
  }[] = [];
  sceneryStatus = {
    theme: "coastal-sky",
    imageFrames: 22,
    obstacles: 0,
    parallax: true,
  };
  private renderedMuzzle = { x: 0, y: 0, angle: 0 };
  private muzzleFlashes:{owner:string;x:number;y:number;angle:number;weapon:string}[]=[];
  constructor(parent: Node) {
    this.root = node(parent, "Cloud flight chapter");
    this.backdrop = new Ink(node(this.root, "Pale sky"));
    this.distant = new FlightBatch(
      node(this.root, "Coastal city and cargo airships"),
    );
    this.clouds = new ComicBatch(node(this.root, "Cloud layers"), "Cloud");
    this.structures = new FlightBatch(
      node(this.root, "Painted sky structures"),
    );
    this.actors = new FlightBatch(node(this.root, "Jetpack actors"));
    this.loot = new ComicBatch(
      node(this.root, "Airborne supply icons"),
      "Supply",
    );
    this.combat = new ComicBatch(
      node(this.root, "Unified projectiles"),
      "Shot",
    );
    this.warnings = new Ink(node(this.root, "Flight warnings"));
  }
  status() {
    return {
      loaded: FlightAssets.ready,
      error: FlightAssets.error,
      playerFrame: this.playerFrame,
      playerSize: this.playerSize,
      renderedMuzzle: this.renderedMuzzle,
      muzzleFlashes: this.muzzleFlashes,
      scenery: this.sceneryStatus,
      projectiles: this.projectileVisuals,
      enemies: this.enemyVisuals,
      generatedFrames: Object.keys(FlightFrames).length,
    };
  }
  draw(s: FlightSession, width: number, height: number): void {
    const cx = s.camera.x,
      cy = s.camera.y,
      w = width / s.camera.zoom,
      h = height / s.camera.zoom;
    this.backdrop.clear();
    this.warnings.clear();
    this.distant.begin();
    this.clouds.begin();
    this.structures.begin();
    this.actors.begin();
    this.loot.begin();
    this.combat.begin();
    this.projectileVisuals.length = 0;
    this.enemyVisuals.length = 0;
    this.muzzleFlashes.length = 0;
    this.backdrop.rect(-20, -20, w + 40, h + 40, sky, sky, 0);
    this.scenery(s, w, h);
    for (const e of s.enemies)
      if (e.active || (e.hp <= 0 && e.deadTime < 0.7)) this.enemy(s, e);
    if (s.boss.active || (s.boss.hp <= 0 && s.boss.deadTime < 1.5))
      this.enemy(s, s.boss);
    for (const d of s.drops)
      if (d.active && d.x > cx - 100 && d.x < cx + w + 100) {
        const bob = Math.sin(d.age * 2.4) * 4;
        this.structures.put(
          "supply.parachute",
          d.x - cx,
          d.y - cy - 8 + bob,
          0.2,
        );
        const id: ComicFrameId =
          d.kind === "medkit"
            ? "pickup.health"
            : d.kind === "rocket"
              ? "weapon.rocket"
              : "pickup.grenades";
        this.loot.put(
          id,
          d.x - cx,
          d.y - cy + 1 + bob,
          d.kind === "rocket" ? 40 : 28,
          undefined,
          0,
          255,
          1,
          [0.5, 0.5],
        );
      }
    this.hero(s);
    for (const p of s.projectiles.items)
      if (p.active) {
        const profile = projectileProfile(p),
          angle = Math.atan2(p.vy, p.vx) * DEG;
        const size = ComicFrames[profile.frame].size;
        const sprite = profile.rocket
          ? this.combat.putRegion(
              profile.frame,
              p.x - cx,
              p.y - cy,
              profile.width / size[0],
              rocketCrop(p.distance, size[0], size[1], profile.width),
              angle,
              [1, 0.5],
            )
          : this.combat.putRegion(
              profile.frame,
              p.x - cx,
              p.y - cy,
              profile.width / size[0],
              bulletCrop(p.distance,size[0],size[1],profile.width),
              angle,
              [1, 0.5],
            );
        if(!profile.rocket){const t=sprite.getComponent(UITransform)!;t.setContentSize(t.contentSize.width,profile.height!);}
        const actual = sprite.getComponent(UITransform)!.contentSize;
        this.projectileVisuals.push({
          owner: p.owner,
          kind: p.kind,
          tier: p.tier ?? "standard",
          width: actual.width,
          height: actual.height,
          fullWidth: profile.width,
          x: p.x,
          y: p.y,
        });
      }
    for (const bomb of s.airbursts)
      if (bomb.active) {
        this.combat.put(
          "projectile.grenade",
          bomb.x - cx,
          bomb.y - cy,
          19,
          undefined,
          bomb.age * 160,
          255,
          1,
          [0.5, 0.5],
        );
        if (bomb.fuse - bomb.age < 0.25)
          this.warnings.circle(
            bomb.x - cx,
            bomb.y - cy,
            15 + Math.sin(bomb.age * 42) * 3,
            warning,
            undefined,
            1.5,
          );
      }
    for (const e of s.effects) {
      if(e.kind === "blast") {
        const v=fireBlastVisual(e.age);
        if(v.alpha>0)this.combat.put(ComicClips.explosion[v.frame],e.x-cx,e.y-cy-e.size*.32,
          e.size*v.scale,undefined,0,v.alpha,1,[.5,.08]);
        if(e.age>.1)for(let n=0;n<3;n++){
          const age=e.age-.1,side=n-1;
          this.combat.put('effect.smoke',e.x-cx+side*e.size*(.17+age*.22),e.y-cy+e.size*.12+age*(65+n*16),
            e.size*(.35+age*.45),undefined,side*(8+age*12),Math.min(230,Math.max(0,(.85-e.age)*400)),n%2?-1:1);
        }
        continue;
      }
      const alpha = Math.round(
        255 * clamp(1 - e.age / 0.3, 0, 1),
      );
      const id: ComicFrameId =
        e.kind === "hit"
            ? "effect.impact"
            : "effect.smoke";
      this.combat.put(
        id,
        e.x - cx,
        e.y - cy,
        Math.max(12, e.size),
        undefined,
        0,
        alpha,
        1,
        [0.5, 0.5],
      );
    }
    this.distant.end();
    this.clouds.end();
    this.structures.end();
    this.actors.end();
    this.loot.end();
    this.combat.end();
  }
  private scenery(s: FlightSession, w: number, h: number): void {
    const cx = s.camera.x,
      cy = s.camera.y;
    // Two small, quiet skyline layers establish altitude without filling combat space.
    for (let i = -1; i < Math.ceil(w / 285) + 2; i++) {
      const x = i * 285 - wrap(cx * 0.1, 285);
      this.distant.put(
        "scenery.city",
        x + 125,
        94 - cy * 0.08,
        0.5,
        0,
        i % 2 ? -1 : 1,
        45,
      );
    }
    for (let i = -1; i < Math.ceil(w / 380) + 2; i++) {
      const x = i * 380 - wrap(cx * 0.18, 380);
      this.distant.put("scenery.city", x + 190, 43 - cy * 0.12, 0.72, 0, 1, 64);
    }
    for (let i = -1; i < Math.ceil(w / 900) + 2; i++) {
      const x = i * 900 - wrap(cx * 0.07, 900);
      this.clouds.put(
        "background.mountains",
        x + 400,
        85 - cy * 0.08,
        1100,
        undefined,
        0,
        24,
        1,
        [0.5, 0.5],
      );
    }
    for (let i = -1; i < 7; i++) {
      const x = i * 470 - wrap(cx * 0.27 + s.time * 3, 470);
      this.clouds.put(
        i % 2 ? "background.cloud" : "background.cloud-small",
        x + 140,
        h * 0.76 + (i % 3) * 58 - cy * 0.07,
        230 + (i % 2) * 90,
        undefined,
        0,
        80,
        1,
        [0.5, 0.5],
      );
    }
    this.distant.put(
      "scenery.airship",
      wrap(1050 - cx * 0.1 - s.time * 9, w + 600) - 250,
      h * 0.6 - cy * 0.05,
      0.35,
      0,
      -1,
      55,
    );
    this.sceneryStatus.obstacles = 0;
    for (const o of L.obstacles) {
      if (o.x + o.w < cx - 100 || o.x > cx + w + 100) continue;
      const id = `scenery.${o.kind}` as
        | "scenery.deck"
        | "scenery.roof"
        | "scenery.bridge";
      const d = FlightFrames[id],
        scale = o.w / d.sourceSize[0];
      this.structures.put(id, o.x + o.w / 2 - cx, o.y + o.h - cy, scale);
      this.sceneryStatus.obstacles++;
    }
    // Boundary cues are gameplay lines over the illustrated background, never terrain stand-ins.
    for (let x = Math.floor(cx / 48) * 48; x < cx + w; x += 48) {
      if (L.floor - cy > -10)
        this.warnings.segment(
          x - cx,
          L.floor - cy,
          x - cx + 20,
          L.floor - cy,
          1,
          boundary,
        );
      if (L.ceiling - cy < h + 10)
        this.warnings.segment(
          x - cx,
          L.ceiling - cy,
          x - cx + 20,
          L.ceiling - cy,
          1,
          boundary,
        );
    }
    if (s.boss.alive && L.gate.x > cx - 70 && L.gate.x < cx + w + 70) {
      const gx = L.gate.x + L.gate.w / 2 - cx;
      for (let y = L.floor; y < L.ceiling; y += 40)
        this.warnings.segment(gx, y - cy, gx, y + 20 - cy, 4, warning);
      this.loot.put(
        "prop.warning",
        gx,
        (L.floor + L.ceiling) / 2 - cy,
        66,
        undefined,
        0,
        235,
        1,
        [0.5, 0.5],
      );
    }
  }
  private hero(s: FlightSession): void {
    const p = s.player,
      moving = Math.hypot(p.vx, p.vy) > 30;
    let id: FlightFrameId;
    if (p.hitTime > 0 || !p.alive) id = "hero.hit";
    else if (s.weapon === "knife")
      id = s.knifeTime > 0.07 ? "hero.knife.slash" : "hero.knife.hover";
    else if (s.heldWeapon === "rocket")
      id = moving || s.dodgeTime > 0 ? "hero.rocket.fly" : "hero.rocket.hover";
    else
      id =
        moving || s.dodgeTime > 0
          ? "hero.rifle.fly"
          : Math.floor(s.time * 7) % 2
            ? "hero.rifle.hover.1"
            : "hero.rifle.hover.0";
    const frame = FlightFrames[id],
      muzzle = s.muzzle(),
      face = Math.cos(s.aim) < 0 ? -1 : 1;
    const angle = (s.aim - (face < 0 ? Math.PI : 0)) * DEG;
    const scale = 0.25,
      introY = s.introActive
        ? -110 * (1 - clamp(s.introTime / L.launchDuration, 0, 1))
        : 0;
    const alpha = p.invincible > 0 && Math.floor(s.time * 18) % 2 ? 150 : 255;
    this.actors.put(
      id,
      muzzle.x - s.camera.x,
      muzzle.y - s.camera.y + introY,
      scale,
      angle - ("sourceGunAngle" in frame ? frame.sourceGunAngle * face : 0),
      face,
      alpha,
    );
    this.playerFrame = id;
    this.playerSize = {
      width: frame.sourceSize[0] * scale,
      height: frame.sourceSize[1] * scale,
    };
    this.renderedMuzzle = { x: muzzle.x, y: muzzle.y + introY, angle: s.aim };
    if(p.alive && p.hitTime<=0 && s.weapon!=="knife" && s.knifeTime<=0 && !s.introActive && !s.victory.active && p.recoil>.28)
      this.flash(s,muzzle,s.heldWeapon,"player",(p.recoil-.28)/.72);
  }
  private enemy(s: FlightSession, e: FlightEnemy): void {
    const cx = s.camera.x,
      cy = s.camera.y;
    if (e.x < cx - 300 || e.x > cx + s.camera.visibleWidth + 300) return;
    let id: FlightFrameId;
    const alpha =
      e.hp <= 0
        ? Math.round(255 * clamp(1 - e.deadTime / 1.3, 0, 1))
        : e.hit > 0
          ? 175
          : 255;
    let muzzle = { x: e.x, y: e.y + 44 };
    let renderedMuzzle: { x: number; y: number } | undefined;
    if (e.kind === "helicopter") {
      id =
        e.hp <= 0 || e.hit > 0
          ? "boss.falcon.3"
          : e.mode === "recover" && e.attack === "missiles" && e.timer > 0.55
            ? "boss.falcon.2"
            : Math.floor(s.time * 14) % 2
              ? "boss.falcon.1"
              : "boss.falcon.0";
      const frame = FlightFrames[id],
        scale = 220 / frame.body[2];
      const bodyCenter = frame.body[0] + frame.body[2] / 2,
        bottom = frame.body[1] + frame.body[3];
      const anchor = [
        bodyCenter / frame.sourceSize[0],
        1 - bottom / frame.sourceSize[1],
      ];
      this.actors.put(
        id,
        e.x - cx,
        e.y - cy - Math.min(e.deadTime, 1) * 45,
        scale,
        0,
        e.facing,
        alpha,
        anchor,
      );
      muzzle = s.enemyMuzzle(e);
      // The fixed body and its sockets do not rotate when the shot tracks a new height.
      // Hover frames share body coordinates; open pods and damage are recovery/hit poses.
      const socketX =
        e.attack === "missiles" ? frame.missiles[0][0] : frame.muzzle[0];
      const socketY =
        e.attack === "missiles" ? frame.missiles[0][1] : frame.muzzle[1];
      renderedMuzzle = {
        x: e.x + e.facing * (socketX - bodyCenter) * scale,
        y: e.y + (bottom - socketY) * scale,
      };
    } else if (e.kind === "drone") {
      id = Math.floor(s.time * 16) % 2 ? "enemy.drone.1" : "enemy.drone.0";
      this.actors.put(
        id,
        e.x - cx,
        e.y + 24 - cy,
        0.24,
        clamp(e.vy / 18, -12, 12),
        e.facing,
        alpha,
        [0.51, 0.5],
      );
      muzzle = { x: e.x + e.facing * 35, y: e.y + 24 };
    } else {
      id =
        Math.hypot(e.vx, e.vy) > 20 ? "enemy.rifle.fly" : "enemy.rifle.hover";
      muzzle = s.enemyMuzzle(e);
      const facing = Math.cos(e.angle) < 0 ? -1 : 1;
      this.actors.put(
        id,
        muzzle.x - cx,
        muzzle.y - cy,
        0.25,
        (e.angle - (facing < 0 ? Math.PI : 0)) * DEG,
        facing,
        alpha,
      );
    }
    this.enemyVisuals.push({
      id: e.id,
      frame: id,
      mode: e.mode,
      bodyBounds: { ...e.bounds },
      muzzle,
      renderedMuzzle,
      muzzleError: renderedMuzzle
        ? Math.hypot(renderedMuzzle.x - muzzle.x, renderedMuzzle.y - muzzle.y)
        : 0,
    });
    if(e.alive && e.muzzleFlash>0)
      this.flash(s,s.enemyMuzzle(e,e.flashPort,e.flashMissile),e.flashMissile?"rocket":"rifle",e.id,e.muzzleFlash/.12);
    if (e.mode === "tell") {
      const tint=e.kind === "helicopter" ? bossWarning : warning;
      const length = e.attack === "dive" || e.attack === "sweep" ? 700 : 560;
      const x = muzzle.x,
        y = muzzle.y;
      for (let distance = 24; distance < length; distance += 38)
        this.warnings.segment(
          x - cx + Math.cos(e.angle) * distance,
          y - cy + Math.sin(e.angle) * distance,
          x - cx + Math.cos(e.angle) * (distance + 17),
          y - cy + Math.sin(e.angle) * (distance + 17),
          e.kind === "helicopter" ? 2.4 : 1.6,
          tint,
        );
    }
  }
  private flash(s:FlightSession,m:{x:number;y:number;angle:number},weapon:string,owner:string,strength:number):void {
    const facing=Math.cos(m.angle)<0?-1:1,angle=m.angle-(facing<0?Math.PI:0);
    const n=this.combat.put(weapon === "rocket" ? "effect.smoke" : "effect.muzzle",
      m.x-s.camera.x,m.y-s.camera.y,weapon === "rocket" ? 28 : 25+13*strength,
      undefined,angle*DEG,180+75*strength,facing,[0,.5]);
    this.muzzleFlashes.push({owner,weapon,x:n.position.x+s.camera.x,y:n.position.y+s.camera.y,angle:m.angle});
  }
}

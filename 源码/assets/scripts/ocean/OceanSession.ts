import {
  InputFrame,
  GameState,
  Rect,
  Vec,
  clamp,
  overlaps,
  segmentRect,
} from "../core/Types";
import { Revival, waterRevivePoint, padded } from "../core/Revival";
import { PlayerController } from "../player/PlayerController";
import { CameraFollow } from "../camera/CameraFollow";
import { GameConfig as C } from "../core/GameConfig";
import { VictorySequence } from "../core/VictorySequence";
import {
  OceanLevel as L,
  OceanEnemyKind,
  OceanWeapon,
  OceanEnemyWeapon,
} from "./OceanLevel";
import { oceanEnemyPose } from "./OceanEnemyPose";
import { MINI_SUB, miniSubBounds, miniSubPose } from "./OceanMiniSub";
import { enemyPattern } from "./OceanEnemyPatterns";
import { oceanMuzzle, oceanHeldPose } from "./OceanPose";
import { OceanEntry as E, entryPhase } from "./OceanEntry";
import { swimMove } from "./SwimCollision";
import { SwimNavigation } from "./SwimNavigation";
import { OCEAN_JELLY, oceanJellyBounds } from "./OceanJellyfish";
import { OCEAN_FISH, oceanFishBounds } from "./OceanFish";
import { StaticRectIndex } from "../core/StaticRectIndex";
import { CombatAudioEvents } from "../combat/CombatAudioEvents";
import { oceanPressure, oceanAttackBudget, oceanNearLockRange, oceanVolleyCount, oceanVolleyOffsets, oceanRangedRest, oceanShotProfile, OceanShotTier, OceanWeaponDamage, OceanBossWeaponDamage, OceanWeaponAmmo, OceanFireInterval,
  oceanBossTuning as B } from "./OceanCombatTuning";

export interface SeaEnemy {
  id: string;
  kind: OceanEnemyKind;
  x: number;
  y: number;
  homeY: number;
  homeX: number;
  role: OceanEnemyWeapon;
  burstLeft: number;
  burstTimer: number;
  volleysLeft: number;
  attack: string;
  attackCounts: Record<string, number>;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  active: boolean;
  mode: "idle" | "tell" | "attack" | "rest" | "dodge" | "dead";
  timer: number;
  angle: number;
  serial: number;
  hit: number;
  deadTime: number;
  staggered: boolean;
  tellDuration: number;
  dodgeCooldown: number;
  reaction: number;
  dodges: number;
  dodgeX: number;
  dodgeY: number;
  dashDuration: number;
  locked: boolean;
  shieldHp: number;
  shielded: boolean;
  hitDirection: number;
  fireFlash?: number;
}
export interface SeaShot {
  active: boolean;
  owner: "player" | "enemy";
  kind: "harpoon" | "sonar" | "torpedo" | "bomb";
  tier: OceanShotTier;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  distance: number;
  life: number;
  damage: number;
  r: number;
  hits: Set<string>;
  pierce: number;
  homing: number;
}
export interface SeaEffect {
  x: number;
  y: number;
  kind: "blast" | "hit" | "bubble" | "splash" | "shield";
  age: number;
  size: number;
  angle?: number;
}
export interface SeaDrop {
  x: number;
  y: number;
  vy: number;
  kind: string;
  active: boolean;
  source: string;
}
export interface SeaCrate {
  id: string;
  x: number;
  y: number;
  hp: number;
  drop: string;
  vy: number;
  deadTime: number;
}
type Attack = "cannon" | "fan" | "torpedo" | "laser" | "sweep";
export class OceanSession {
  readonly chapter = 2;
  readonly revival = new Revival();
  private reviveAnchor?: Vec;
  private deathOrigin?: Vec;
  private anchorTime = 0;
  readonly player = new PlayerController();
  readonly camera = new CameraFollow();
  readonly victory = new VictorySequence();
  readonly level = L;
  private readonly terrainIndex = new StaticRectIndex<Rect>(L.obstacles);
  private readonly bodySolids: Rect[] = [];
  private readonly shotSolids: Rect[] = [];
  private readonly raySolids: Rect[] = [];
  private readonly supportSolids: Rect[] = [];
  private readonly navSolids: Rect[] = [];
  private swimRoutes = new Map<string, SwimNavigation>();
  private swimDetours = new Set<string>();
  state: GameState = "playing";
  time = 0;
  hitStop = 0;
  shakeTime = 0;
  shakePower = 0;
  stage: "shore" | "equipping" | "diving" | "swimming" = "shore";
  introTime = 0;
  introSeen = false;
  clearTime = 0;
  furthestX = 0;
  retreatLimit = 0;
  weapon: OceanWeapon = "harpoon";
  storedWeapon: OceanWeapon = "harpoon";
  ammo = 0;
  cooldown = 0;
  /** Presentation metadata for the attack that started this cooldown, even after an ammo fallback. */
  attackCooldownDuration = 0;
  boostCooldown = 0;
  boostTime = 0;
  boostX = 1;
  boostY = 0;
  knifeTime = 0;
  knifeSerial = 0;
  knifeHit = false;
  protectedPress = false;
  private protectedCrate?: SeaCrate;
  aim = 0;
  aimTarget = "";
  aimHold = 0;
  aimLockAge = 0;
  shooting = false;
  shots = 0;
  readonly attackAudio = new CombatAudioEvents();
  hits = 0;
  kills = 0;
  collected = 0;
  blastCount = 0;
  depthThrown = 0;
  grenadeThrowTime = 0;
  private grenadePressed = false;
  aimPoint: Vec | undefined;
  lastShotWeapon: OceanWeapon = "harpoon";
  lastShotMuzzle = { x: 0, y: 0, angle: 0 };
  message = "走到悬崖边 · 准备潜水";
  messageTime = 4;
  enemies: SeaEnemy[] = [];
  projectiles: SeaShot[] = [];
  effects: SeaEffect[] = [];
  crates: SeaCrate[] = [];
  drops: SeaDrop[] = [];
  recoveryUsed = new Set<string>();
  boss = {
    x: L.arena + 660,
    y: 345,
    vx: 0,
    vy: 0,
    travel: 0,
    hp: B.health as number,
    maxHp: B.health as number,
    active: false,
    phase: 1,
    attack: "cannon" as Attack,
    mode: "idle" as "idle" | "tell" | "fire" | "rest" | "dead",
    timer: 1,
    angle: Math.PI,
    serial: 0,
    tellDuration: 0,
    locked: false,
    volleyRemaining: 0,
    volleyTimer: 0,
    volleyIndex: 0,
    volleyCount: 0,
    summons: 0,
    summonTimer: 10,
    laserHp: 30,
    torpedoHp: 32,
    cannonHp: 36,
    angleStart: Math.PI,
    angleEnd: Math.PI,
    ringRadius: 0,
    ringGap: 0,
    ringHit: false,
    beamActive: false,
    hit: 0,
    attackCounts: {} as Record<string, number>,
  };
  private resumeState: GameState = "playing";
  private visibleHeight = 720;
  private blastQueue: {
    x: number;
    y: number;
    r: number;
    damage: number;
    owner: "player" | "enemy";
    kind?: SeaShot["kind"];
  }[] = [];
  constructor() {
    this.reset();
  }
  private createEnemy(data: (typeof L.enemies)[number], id: string, i = 0): SeaEnemy {
    const [kind, x, startY] = data;
    let y = startY;
      const shielded = kind === "diver" && data[4] === true;
      // Three ordinary hits, or five including the two-hit shield; encounter
      // pressure changes tactics, never silently adds extra health again.
      const hp = kind === "captain" ? C.boss.miniHealth : kind === "mine" ? 2 : shielded ? 5 : 3;
      if (kind === "turret") y = this.supportY(x, y + 100);
      return {
        id,
        kind,
        x,
        y,
        homeY: y,
        homeX: x,
        role: data[3] ?? "harpoon",
        burstLeft: 0,
        burstTimer: 0,
        volleysLeft: 0,
        attack: "",
        attackCounts: {},
        vx: 0,
        vy: 0,
        hp,
        maxHp: hp,
        active: false,
        mode: "idle",
        timer: 0.7 + (i % 4) * 0.27,
        angle: Math.PI,
        serial: 0,
        hit: 0,
        deadTime: 0,
        staggered: false,
        tellDuration: 0,
        dodgeCooldown: .75 + (i % 3) * .18,
        reaction: 0,
        dodges: 0,
        dodgeX: 0,
        dodgeY: 0,
        dashDuration: 0,
        locked: false,
        shielded,
        shieldHp: shielded ? 2 : 0,
        hitDirection: 1,
      };
  }
  reset(state: GameState = "playing"): void {
    this.revival.reset(); this.reviveAnchor=undefined; this.deathOrigin=undefined; this.anchorTime=0;
    this.swimRoutes.clear();
    this.swimDetours.clear();
    this.attackAudio.reset();
    this.state = state;
    this.time = this.clearTime = 0;
    this.furthestX = this.retreatLimit = 0;
    this.stage = "shore";
    this.introTime = 0;
    this.player.reset(L.spawn.x, L.spawn.y);
    this.player.grenades = 3;
    this.camera.reset();
    this.camera.x = 0;
    this.camera.y = 470;
    this.victory.reset();
    this.weapon = this.storedWeapon = "harpoon";
    this.ammo = 0;
    this.cooldown = this.boostCooldown = this.boostTime = this.knifeTime = 0;
    this.attackCooldownDuration = 0;
    this.hitStop = this.shakeTime = this.shakePower = this.aim = 0;
    this.knifeSerial = 0;
    this.knifeHit = this.protectedPress = this.shooting = false;
    this.protectedCrate = undefined;
    this.aimTarget = "";
    this.aimPoint = undefined;
    this.grenadeThrowTime = 0;
    this.grenadePressed = false;
    this.aimHold = 0;
    this.aimLockAge = 0;
    this.shots =
      this.hits =
      this.kills =
      this.collected =
      this.blastCount =
      this.depthThrown =
        0;
    this.lastShotWeapon = "harpoon";
    this.lastShotMuzzle = { x: 0, y: 0, angle: 0 };
    this.message = "准备潜水 · 自动前往装备箱";
    this.messageTime = 4;
    this.recoveryUsed.clear();
    this.effects = [];
    this.drops = [];
    this.blastQueue = [];
    this.enemies = L.enemies.map((data, i) => this.createEnemy(data, `sea-${i}`, i));
    this.crates = L.crates.map((c, i) => ({
      ...c,
      id: `sea-crate-${i}`,
      hp: 3,
      vy: 0,
      deadTime: 0,
    }));
    this.projectiles = Array.from({ length: 96 }, () => ({
      active: false,
      owner: "player",
      kind: "sonar",
      tier: "standard",
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      age: 0,
      distance: 0,
      life: 0,
      damage: 0,
      r: 0,
      hits: new Set<string>(),
      pierce: 0,
      homing: 0,
    }));
    Object.assign(this.boss, {
      x: L.arena + 660,
      y: 345,
      vx: 0,
      vy: 0,
      travel: 0,
      hp: B.health,
      maxHp: B.health,
      active: false,
      phase: 1,
      attack: "cannon",
      mode: "idle",
      timer: 1,
      angle: Math.PI,
      serial: 0,
      tellDuration: 0,
      locked: false,
      volleyRemaining: 0,
      volleyTimer: 0,
      volleyIndex: 0,
      volleyCount: 0,
    summons: 0,
    summonTimer: 10,
      laserHp: 30,
      torpedoHp: 32,
      cannonHp: 36,
      ringRadius: 0,
      ringGap: 0,
      ringHit: false,
      beamActive: false,
      hit: 0,
      attackCounts: {},
    });
  }
  revive(): boolean {
    if(this.state!=="gameover" || !this.revival.remaining || this.introActive || this.victory.active)return false;
    const origin=this.deathOrigin ?? {x:this.player.x,y:this.player.y};
    const zone=L.zones.find(z=>origin.x<z.end) ?? L.zones[L.zones.length-1];
    const avoid=this.enemies.filter(e=>e.hp>0).map(e=>padded(this.enemyBounds(e)));
    if(this.boss.active && this.boss.hp>0)avoid.push(padded(this.bossBounds()));
    for(const c of this.crates)if(c.hp>0)avoid.push({x:c.x-30,y:c.y,w:60,h:64});
    const point=waterRevivePoint(origin,L.obstacles,avoid,{
      left:Math.max(790,this.retreatLimit+20,zone.start),
      right:Math.min(L.width-45,zone.end,Math.max(origin.x,this.furthestX)),
      bottom:L.floor+4,top:L.surface-6,
    },this.reviveAnchor);
    if(!point){this.revival.error="附近没有安全水域，请重试或重新开始";return false;}
    this.player.reviveAt(point.x,point.y,false);
    for(const p of this.projectiles)p.active=false;
    this.blastQueue=[]; this.effects=[];
    this.boostTime=this.knifeTime=this.grenadeThrowTime=this.hitStop=this.shakeTime=this.shakePower=0;
    this.knifeHit=this.protectedPress=this.grenadePressed=this.shooting=false; this.protectedCrate=undefined;
    this.aimTarget=""; this.aimPoint=undefined; this.aimHold=this.aimLockAge=0;
    for(const e of this.enemies)if(e.hp>0){e.mode="rest";e.timer=1;e.volleysLeft=e.burstLeft=e.burstTimer=e.dashDuration=e.dodgeX=e.dodgeY=e.vx=e.vy=0;e.locked=false;e.fireFlash=0;}
    const b=this.boss;
    if(b.hp>0){b.mode=b.active?"rest":"idle";b.timer=1.2;b.volleyRemaining=b.volleyTimer=b.ringRadius=b.vx=b.vy=0;b.beamActive=b.locked=b.ringHit=false;}
    this.message="恢复操作后保护 3 秒";this.messageTime=3;
    this.deathOrigin=undefined; this.revival.begin(); this.state="reviving";
    return true;
  }
  pause() {
    if (this.state === "playing" || this.state === "dying" || this.state === "reviving") {
      this.resumeState = this.state;
      this.state = "paused";
    }
  }
  resume() {
    if (this.state === "paused") this.state = this.resumeState;
  }
  get mini() {
    return this.enemies.find((e) => e.kind === "captain")!;
  }
  get zone() {
    return (
      L.zones.find((z) => this.player.x < z.end) ?? L.zones[L.zones.length - 1]
    );
  }
  get introActive() {
    return this.stage !== "swimming";
  }
  get controlEnabled() {
    return (
      this.state === "playing" && !this.introActive && !this.victory.active
    );
  }
  get weaponName() {
    return {
      harpoon: "鱼叉枪",
      sonar: "声波枪",
      torpedo: "鱼雷枪",
      knife: "潜水刀",
    }[this.weapon];
  }
  get weaponIcon() {
    return {
      harpoon: "item.harpoon",
      sonar: "item.sonar",
      torpedo: "item.torpedo-launcher",
      knife: "item.knife",
    }[this.weapon];
  }
  finishEntry() {
    this.stage = "swimming";
    this.introTime = E.end;
    this.introSeen = true;
    this.player.x = L.swimSpawn.x;
    this.player.y = L.swimSpawn.y;
    this.player.vx = this.player.vy = 0;
    this.player.grounded = false;
    this.message = "WASD / 摇杆自由游动 · 空格冲刺 · J 鱼叉";
    this.messageTime = 5;
  }
  skipEntry() {
    if (this.introActive && this.introSeen) this.finishEntry();
  }
  update(dt: number, input: InputFrame): void {
    if(this.state==="reviving") {
      if(this.revival.advance(dt))this.state="playing";
      return;
    }
    if (
      this.state !== "playing" &&
      this.state !== "dying" &&
      !(this.state === "complete" && this.victory.active)
    )
      return;
    this.shakeTime = Math.max(0, this.shakeTime - dt);
    if (this.shakeTime === 0) this.shakePower = 0;
    for (const fx of this.effects) fx.age += dt;
    this.effects = this.effects.filter(
      (f) =>
        f.age <
        (f.kind === "bubble"
          ? 1.5
          : f.kind === "blast"
            ? 1
            : f.kind === "hit"
              ? 0.24
              : 0.8),
    );
    if (this.victory.active) {
      this.updateVictory(dt);
      return;
    }
    this.time += dt;
    const p = this.player;
    p.animationTime += dt;
    const healthBefore = p.health;
    p.invincible = Math.max(0, p.invincible - dt);
    p.hitTime = Math.max(0, p.hitTime - dt);
    p.recoil = Math.max(0, p.recoil - dt * 6);
    this.messageTime = Math.max(0, this.messageTime - dt);
    if (!p.alive) {
      if(!this.deathOrigin)this.deathOrigin={x:p.x,y:p.y};
      this.state = "dying";
      p.deadTime += dt;
      p.y += 18 * dt;
      if (p.deadTime > 1.5) this.state = "gameover";
      return;
    }
    if (this.stage === "shore") {
      // The walk is the first part of the cutscene, with the same stride-driven
      // full-body animation as ordinary movement. Player input cannot stall it.
      p.vx = E.approachSpeed;
      const oldX = p.x;
      p.x = clamp(p.x + p.vx * dt, 70, E.stopX);
      const distance = p.x - oldX;
      p.vx = dt > 0 ? distance / dt : 0;
      if (Math.abs(distance) > 0.001) p.facing = distance < 0 ? -1 : 1;
      p.stride += Math.abs(distance) / 96;
      if (p.x >= E.stopX) {
        this.stage = "equipping";
        this.introTime = 0;
        p.vx = 0;
        this.message = "打开装备箱 · 准备下潜";
        this.messageTime = 3;
      }
      return;
    }
    if (this.introActive) {
      this.introTime += dt;
      if (this.introTime >= E.walkAt && this.introTime < E.leapAt) {
        const oldX = p.x;
        p.x =
          E.stopX +
          (E.ledgeX - E.stopX) *
            clamp((this.introTime - E.walkAt) / (E.leapAt - E.walkAt), 0, 1);
        p.vx = (p.x - oldX) / dt;
        p.stride += Math.abs(p.x - oldX) / 96;
      }
      if (this.introTime >= E.leapAt) {
        this.stage = "diving";
        const t = clamp((this.introTime - E.leapAt) / (E.end - E.leapAt), 0, 1);
        const previousY = p.y;
        p.x = E.ledgeX + (L.swimSpawn.x - E.ledgeX) * t;
        p.y = 720 + 100 * Math.sin(t * Math.PI) - 360 * t;
        if (previousY > L.surface && p.y <= L.surface) {
          this.effect(p.x, L.surface, "splash", 110);
          this.shakeTime = 0.16;
          this.shakePower = 3;
        }
      }
      if (this.introTime >= E.end) this.finishEntry();
      return;
    }
    this.anchorTime-=dt;
    if(this.anchorTime<=0){this.anchorTime=.2;this.reviveAnchor={x:p.x,y:p.y};}
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.grenadeThrowTime = Math.max(0, this.grenadeThrowTime - dt);
    this.boostCooldown = Math.max(0, this.boostCooldown - dt);
    this.boostTime = Math.max(0, this.boostTime - dt);
    if (input.switchWeapon) {
      p.recoil = 0;
      if (this.weapon === "knife") this.weapon = this.storedWeapon;
      else {
        this.storedWeapon = this.weapon;
        this.weapon = "knife";
      }
    }
    this.shooting = input.shoot && p.hitTime <= 0;
    if (
      !input.shoot ||
      (this.protectedCrate &&
        Math.hypot(
          p.x - this.protectedCrate.x,
          p.y + 34 - this.protectedCrate.y - 26,
        ) > 135)
    ) {
      this.protectedPress = false;
      this.protectedCrate = undefined;
    }
    this.movePlayer(dt, input);
    this.updateAim(dt, input);
    if (this.knifeTime > 0) {
      this.knifeTime -= dt;
      if (this.knifeTime <= 0.2 && !this.knifeHit) {
        this.knifeHit = true;
        this.slash();
      }
    }
    const nearCrate = this.crates.find(
      (c) =>
        c.hp > 0 &&
        Math.hypot(c.x - p.x, c.y + 26 - (p.y + 34)) < 100 &&
        (c.x - p.x) * p.facing > -20 &&
        this.lineClear({ x: p.x, y: p.y + 34 }, { x: c.x, y: c.y + 26 }),
    );
    if (input.shoot && nearCrate) {
      this.protectedPress = true;
      this.protectedCrate = nearCrate;
    }
    if (this.shooting && this.cooldown <= 0) {
      if (this.weapon === "knife" || this.protectedPress) {
        this.knifeTime = 0.38;
        this.knifeHit = false;
        this.knifeSerial++;
        this.cooldown = 0.45;
        this.attackCooldownDuration = this.cooldown;
      } else this.firePlayer();
    }
    if (input.grenade && !this.grenadePressed && p.grenades > 0) {
      const origin = { x: p.x, y: p.y + 36 }, angle = this.aim;
      const shot = this.spawnShot(
        "player",
        "bomb",
        origin.x + Math.cos(angle) * 24,
        origin.y + Math.sin(angle) * 24,
        Math.cos(angle) * 360,
        Math.sin(angle) * 360,
        9,
        1.05,
      );
      if (shot) {
        p.grenades--; this.depthThrown++; this.grenadeThrowTime = .22;
        // Start inside the hand and sweep the first step; never spawn past a wall.
        if (!this.lineClear(origin, shot)) { shot.x = origin.x; shot.y = origin.y; }
      }
    }
    this.grenadePressed = !!input.grenade;
    for (const e of this.enemies) this.updateEnemy(e, dt);
    this.updateBoss(dt);
    this.updateShots(dt);
    this.flushBlasts();
    this.updateSupplies(dt);
    if (p.health < healthBefore) {
      this.impactFeedback(p.x, p.y + 35, 0.65);
      // Only actual player damage pauses the scene. Remote hits, kills and
      // chain explosions must not repeatedly interrupt free swimming.
      this.hitStop = Math.max(this.hitStop, 0.044);
      this.knifeTime = 0;
    }
    if (this.boss.hp <= 0 && p.alive) {
      this.clearTime = this.time;
      this.boss.mode = "dead";
      this.boss.beamActive = false;
      this.boss.ringRadius = 0;
      for (const shot of this.projectiles) shot.active = false;
      this.blastQueue = [];
      this.knifeTime = 0;
      this.cooldown = 0;
      p.recoil = p.hitTime = p.invincible = 0;
      p.vx = p.vy = 0;
      this.victory.start();
    }
    if (!p.alive) this.state = "dying";
  }
  private movePlayer(dt: number, input: InputFrame) {
    const p = this.player;
    let x = clamp(input.axis, -1, 1),
      y = clamp(
        input.vertical ?? (input.aimY ?? 0) - (input.crouch ? 1 : 0),
        -1,
        1,
      );
    const length = Math.hypot(x, y);
    if (length > 1) {
      x /= length;
      y /= length;
    }
    if (!input.shoot && Math.abs(x) > 0.1) p.facing = x > 0 ? 1 : -1;
    if (input.jump && this.boostCooldown <= 0) {
      this.boostTime = 0.22;
      this.boostCooldown = 2;
      const n = Math.hypot(x, y) || 1;
      this.boostX = length ? x / n : p.facing;
      this.boostY = length ? y / n : 0;
    }
    const a = 1 - Math.exp(-dt * (length ? 12 : 20));
    p.vx += (x * 280 - p.vx) * a;
    p.vy += (y * 280 - p.vy) * a;
    if (this.boostTime > 0) {
      p.vx = this.boostX * 620;
      p.vy = this.boostY * 620;
    }
    let cx = 0,
      cy = 0;
    for (const c of L.currents)
      if (overlaps(p.bounds, c)) {
        cx = c.vx;
        cy = c.vy;
      }
    this.moveBody(
      p,
      (p.vx + cx) * dt,
      (p.vy + cy) * dt,
      18,
      68,
      this.boss.active && this.boss.hp > 0 ? [this.bossBounds()] : [],
    );
    this.furthestX = Math.max(this.furthestX, p.x);
    this.retreatLimit = Math.max(this.retreatLimit, this.boss.active
      ? L.arena - B.retreatApron
      : Math.min(this.furthestX - C.progression.retreatDistance, L.arena - B.retreatApron));
    p.x = clamp(p.x, Math.max(790, this.retreatLimit + 18), L.width - 45);
    p.y = clamp(p.y, L.floor + 4, L.surface - 80);
    p.grounded = false;
    if (
      this.boostTime > 0 &&
      Math.floor(this.time * 18) !== Math.floor((this.time - dt) * 18)
    )
      this.effect(p.x - 25 * p.facing, p.y + 30, "bubble", 35);
  }
  updateCamera(dt: number, visibleHeight: number): void {
    this.visibleHeight = visibleHeight;
    const p = this.player, c = this.camera;
    const min = this.retreatLimit;
    const max = Math.max(min, Math.min(L.width - c.visibleWidth, p.x - 18));
    const x = clamp(p.x - c.visibleWidth * .36, min, max);
    const y = this.stage !== "swimming" ? p.y - visibleHeight * .45
      : Math.max(-10, Math.min(L.surface + 80 - visibleHeight, p.y + 35 - visibleHeight * .64));
    c.x = clamp(c.x + (x - c.x) * (1 - Math.exp(-dt * 7)), min, max);
    c.y += (y - c.y) * (1 - Math.exp(-dt * 5));
  }
  private moveBody(
    body: { x: number; y: number },
    dx: number,
    dy: number,
    hw: number,
    h: number,
    extra: Rect[] = [],
  ) {
    // Include the entire <100-unit penetration-recovery neighborhood, then
    // the swept body extents; neighboring rock bands must remain one union.
    const solids = this.terrainIndex.query(
      body.x - hw - 100 + Math.min(0, dx),
      body.y - 100 + Math.min(0, dy),
      body.x + hw + 100 + Math.max(0, dx),
      body.y + h + 100 + Math.max(0, dy),
      this.bodySolids,
    );
    for (const r of extra) solids.push(r);
    swimMove(body, dx, dy, hw, h, solids);
  }
  enemyBounds(e: SeaEnemy): Rect {
    if (e.kind === "captain") return miniSubBounds(e);
    if (e.kind === "fish") return oceanFishBounds(e);
    if (e.kind === "jellyfish") return oceanJellyBounds(e);
    return {
      x: e.x - 23,
      y: e.y,
      w: 46,
      h: 58,
    };
  }
  bossBounds(): Rect {
    return { x: this.boss.x - 300, y: this.boss.y - 105, w: 600, h: 210 };
  }
  bossParts() {
    const b = this.boss;
    return [
      { id: "laserHp" as const, x: b.x + 84, y: b.y + 10, w: 82, h: 92 },
      { id: "torpedoHp" as const, x: b.x - 120, y: b.y - 145, w: 118, h: 55 },
      { id: "cannonHp" as const, x: b.x - 239, y: b.y + 12, w: 110, h: 85 },
    ];
  }
  lineClear(a: Vec, b: Vec) {
    for (const o of this.terrainIndex.query(
      Math.min(a.x, b.x),
      Math.min(a.y, b.y),
      Math.max(a.x, b.x),
      Math.max(a.y, b.y),
      this.raySolids,
    ))
      if (segmentRect(a, b, o) !== null) return false;
    return true;
  }
  private updateAim(dt: number, input: InputFrame) {
    const p = this.player;
    const previousTarget = this.aimTarget;
    this.aimHold = Math.max(0, this.aimHold - dt);
    if (this.weapon === "knife" || !this.controlEnabled) {
      this.aim = p.facing === 1 ? 0 : Math.PI;
      this.aimTarget = "";
      this.aimPoint = undefined;
      this.aimLockAge = 0;
      return;
    }
    const from = { x: p.x, y: p.y + 38 };
    const candidates = this.enemies
      .filter((e) => e.hp > 0 && e.active)
      .map((e) => ({
        id: e.id,
        x: e.x,
        y: e.y + (e.kind === "captain" ? MINI_SUB.centerY : 32),
      }));
    if (this.boss.active && this.boss.hp > 0) {
      for (const part of this.bossParts())
        if (this.boss[part.id] > 0)
          candidates.push({
            id: part.id,
            x: part.x + part.w / 2,
            y: part.y + part.h / 2,
          });
      const hull = this.bossBounds();
      candidates.push({
        id: "submarine",
        x: clamp(from.x, hull.x + 20, hull.x + hull.w - 20),
        y: clamp(from.y, hull.y + 20, hull.y + hull.h - 20),
      });
    }
    const allowed = candidates.filter((e) => {
      const dx = (e.x - p.x) * p.facing,
        dy = e.y - from.y;
      const distance = Math.hypot(dx, dy);
      return (
        (distance <= oceanNearLockRange ||
          (dx > -20 && dx < 650 && distance < 690 && Math.abs(dy) < dx * 1.5 + 90)) &&
        e.x > this.camera.x &&
        e.x < this.camera.x + this.camera.visibleWidth &&
        e.y > this.camera.y + 15 &&
        e.y < this.camera.y + this.visibleHeight - 96 / this.camera.zoom &&
        this.lineClear(from, e)
      );
    });
    let target = allowed.find((e) => e.id === this.aimTarget);
    if (!target) { this.aimTarget = ""; this.aimPoint = undefined; }
    if (!target && this.aimHold <= 0) {
      target = allowed.sort(
        (a, b) =>
          Math.hypot(a.x - p.x, a.y - from.y) -
          Math.hypot(b.x - p.x, b.y - from.y),
      )[0];
      this.aimTarget = target?.id ?? "";
      this.aimHold = 0.18;
    }
    if (target) {
      this.aimPoint = { x: target.x, y: target.y };
      this.aim = Math.atan2(target.y - from.y, target.x - from.x);
      // The actual held frame's socket is off the body centre. Solve the ray
      // from that same socket so the reticle describes the emitted projectile.
      for (let i = 0; i < 6; i++) {
        const m = this.muzzle();
        this.aim = Math.atan2(target.y - m.y, target.x - m.x);
      }
      if (this.lineClear(this.muzzle(), target)) this.aimPoint = { x: target.x, y: target.y };
      else { this.aimTarget = ""; this.aimPoint = undefined; }
    }
    if (!this.aimTarget) this.aim = input.grenade && Math.hypot(input.axis, input.vertical ?? 0) > .25
      ? Math.atan2(input.vertical ?? 0, input.axis) : p.facing === 1 ? 0 : Math.PI;
    this.aimLockAge = this.aimTarget && this.aimPoint
      ? this.aimTarget === previousTarget ? this.aimLockAge + dt : 0 : 0;
  }
  aimIndicator() {
    const visible = this.stage === "swimming" && this.controlEnabled && this.weapon !== "knife" && this.player.hitTime <= 0;
    const origin = this.muzzle();
    const targetAlive = this.enemies.some(e => e.id === this.aimTarget && e.hp > 0)
      || (this.boss.active && this.boss.hp > 0 && (this.aimTarget === "submarine"
        || this.bossParts().some(p => p.id === this.aimTarget && this.boss[p.id] > 0)));
    const locked = !!this.aimPoint && targetAlive && this.lineClear(origin, this.aimPoint);
    let point = locked ? { ...this.aimPoint! } : { x: origin.x + Math.cos(this.aim) * 145, y: origin.y + Math.sin(this.aim) * 145 };
    let blocked = false;
    if (!locked) {
      let distance = 1;
      for (const r of this.terrainIndex.query(Math.min(origin.x, point.x), Math.min(origin.y, point.y), Math.max(origin.x, point.x), Math.max(origin.y, point.y), this.raySolids)) {
        const t = segmentRect(origin, point, r); if (t !== null) distance = Math.min(distance, t);
      }
      blocked = distance < 1;
      point = { x: origin.x + (point.x - origin.x) * Math.max(0, distance - (blocked ? .03 : 0)), y: origin.y + (point.y - origin.y) * Math.max(0, distance - (blocked ? .03 : 0)) };
    }
    return { visible, locked, blocked, targetId: locked ? this.aimTarget : "", lockAge: locked ? this.aimLockAge : 0, x: point.x, y: point.y, angle: this.aim, origin };
  }
  get heldWeapon(): OceanWeapon {
    return this.player.recoil > 0 && this.weapon !== "knife" ? this.lastShotWeapon : this.weapon;
  }
  get gunFacing(): 1 | -1 {
    // Hold the mirrored pose while solving its offset muzzle. Choosing a new
    // mirror from every trial angle oscillates when aiming straight down.
    const dx = this.aimPoint ? this.aimPoint.x - this.player.x : Math.cos(this.aim);
    return Math.abs(dx) < 1e-6 ? this.player.facing : dx > 0 ? 1 : -1;
  }
  muzzle(weapon = this.heldWeapon, recoil = this.player.recoil) {
    return oceanMuzzle(
      this.player.x,
      this.player.y,
      this.aim,
      weapon,
      this.heldPose(weapon),
      recoil,
      this.gunFacing,
    );
  }
  heldPose(weapon = this.weapon) {
    return oceanHeldPose(
      weapon,
      this.player.animationTime,
      Math.hypot(this.player.vx, this.player.vy),
      this.boostTime > 0,
    );
  }
  private firePlayer() {
    const m = this.muzzle(this.weapon, 1),
      kind =
        this.weapon === "torpedo"
          ? "torpedo"
          : this.weapon === "sonar"
            ? "sonar"
            : "harpoon";
    const speed = kind === "harpoon" ? 720 : kind === "sonar" ? 445 : 390;
    const shot = this.spawnShot(
      "player",
      kind,
      m.x,
      m.y,
      Math.cos(this.aim) * speed,
      Math.sin(this.aim) * speed,
      OceanWeaponDamage[kind],
      1.75,
    );
    if (!shot) return;
    this.lastShotWeapon = this.weapon;
    this.lastShotMuzzle = { ...m, angle: this.aim };
    shot.pierce = kind === "sonar" ? 3 : 1;
    shot.homing = kind === "torpedo" ? 0.75 : 0;
    this.shots++;
    this.player.recoil = 1;
    this.cooldown = OceanFireInterval[kind];
    this.attackCooldownDuration = this.cooldown;
    if (this.weapon !== "harpoon" && --this.ammo <= 0) {
      this.weapon = this.storedWeapon = "harpoon";
      this.ammo = 0;
    }
    // Resolve walls between the body and muzzle too, before a projectile can appear past them.
    if (!this.lineClear({ x: this.player.x, y: this.player.y + 38 }, m)) {
      shot.active = false;
      this.effect(m.x, m.y, "hit", 25);
    }
  }
  private slash() {
    const p = this.player;
    const hit = (x: number, y: number) =>
      Math.hypot(x - p.x, y - (p.y + 35)) < 112 && (x - p.x) * p.facing > -25;
    for (const c of this.crates)
      if (
        c.hp > 0 &&
        hit(c.x, c.y + 25) &&
        this.lineClear({ x: p.x, y: p.y + 35 }, { x: c.x, y: c.y + 25 })
      )
        this.damageCrate(c, 3);
    for (const e of this.enemies)
      if (
        e.hp > 0 &&
        hit(e.x, e.y + 30) &&
        this.lineClear({ x: p.x, y: p.y + 35 }, { x: e.x, y: e.y + 30 })
      )
        this.damageEnemy(e, e.kind === "captain" ? 4 : e.hp);
    if (this.boss.active && hit(this.boss.x - 300, this.boss.y))
      this.damageBoss(3, this.boss.x - 300, this.boss.y);
  }
  private spawnShot(
    owner: SeaShot["owner"],
    kind: SeaShot["kind"],
    x: number,
    y: number,
    vx: number,
    vy: number,
    damage: number,
    life: number,
    tier: OceanShotTier = "standard",
  ) {
    const shot = this.projectiles.find((s) => !s.active);
    if (!shot) return null;
    Object.assign(shot, {
      active: true,
      owner,
      kind,
      x,
      y,
      vx,
      vy,
      damage: owner === "enemy" && kind === "torpedo" ? C.projectileDamage.enemyRocket : damage,
      tier,
      r: oceanShotProfile(kind, tier).radius,
      life,
      age: 0,
      distance: 0,
      pierce: 1,
      homing: 0,
    });
    shot.hits.clear();
    if (owner === "enemy")
      this.attackAudio.emit(kind === "torpedo" ? "rocket" : kind === "bomb" ? "cannon"
        : kind === "sonar" ? "enemy-sonar" : tier === "standard" ? "enemy-shot" : "boss-shot", x, y);
    return shot;
  }
  private updateShots(dt: number) {
    const p = this.player;
    for (const s of this.projectiles) {
      if (!s.active) continue;
      s.age += dt;
      s.life -= dt;
      if (s.kind === "bomb" && s.tier !== "boss") {
        // Underwater hand throw: forward momentum, isotropic water drag, no gravity.
        const drag = Math.exp(-.65 * dt); s.vx *= drag; s.vy *= drag;
      }
      if (s.homing > 0 && (s.owner !== "enemy" || s.age < 1.25)) {
        let target: Vec | undefined;
        if (s.owner === "enemy") target = { x: p.x, y: p.y + 35 };
        else {
          const e = this.enemies.find(
            (e) => e.hp > 0 && e.id === this.aimTarget,
          );
          target = e
            ? {
                x: e.x,
                y: e.y + (e.kind === "captain" ? MINI_SUB.centerY : 30),
              }
            : this.boss.active && this.boss.hp > 0
              ? { x: clamp(s.x, this.boss.x - 280, this.boss.x + 280),
                  y: clamp(s.y, this.boss.y - 85, this.boss.y + 85) }
              : undefined;
        }
        if (target) {
          const a = Math.atan2(s.vy, s.vx),
            wanted = Math.atan2(target.y - s.y, target.x - s.x);
          const diff = Math.atan2(Math.sin(wanted - a), Math.cos(wanted - a));
          const angle = a + clamp(diff, -s.homing * dt, s.homing * dt),
            speed = Math.hypot(s.vx, s.vy);
          s.vx = Math.cos(angle) * speed;
          s.vy = Math.sin(angle) * speed;
        }
      }
      const from = { x: s.x, y: s.y },
        to = { x: s.x + s.vx * dt, y: s.y + s.vy * dt };
      let hitT = 1,
        wall = false;
      const margin = s.r * 0.45;
      for (const o of this.terrainIndex.query(
        Math.min(from.x, to.x) - margin,
        Math.min(from.y, to.y) - margin,
        Math.max(from.x, to.x) + margin,
        Math.max(from.y, to.y) + margin,
        this.shotSolids,
      )) {
        const t = segmentRect(from, to, o, s.r * 0.45);
        if (t !== null && t < hitT) {
          hitT = t;
          wall = true;
        }
      }
      if (to.y < L.floor) {
        const t = (from.y - L.floor) / (from.y - to.y);
        if (t < hitT) {
          hitT = t;
          wall = true;
        }
      }
      const targets: { id: string; r: Rect; damage: () => void }[] = [];
      const bossDamage = s.kind === "harpoon" || s.kind === "sonar" || s.kind === "torpedo"
        ? OceanBossWeaponDamage[s.kind] : s.damage;
      if (s.owner === "player") {
        for (const e of this.enemies)
          if (e.hp > 0 && e.active && !s.hits.has(e.id))
            targets.push({
              id: e.id,
              r: this.enemyBounds(e),
              damage: () => this.damageEnemy(e, s.damage, s.kind, s.x, s.y, Math.atan2(s.vy, s.vx)),
            });
        for (const c of this.crates)
          if (c.hp > 0 && !s.hits.has(c.id))
            targets.push({
              id: c.id,
              r: { x: c.x - 26, y: c.y, w: 52, h: 50 },
              damage: () => this.damageCrate(c, s.damage),
            });
        if (this.boss.active && this.boss.hp > 0 && !s.hits.has("submarine")) {
          for (const part of this.bossParts())
            if (this.boss[part.id] > 0)
              targets.push({
                id: "submarine",
                r: part,
                damage: () =>
                  this.damageBoss(
                    bossDamage,
                    part.x + part.w / 2,
                    part.y + part.h / 2,
                    part.id,
                  ),
              });
          targets.push({
            id: "submarine",
            r: this.bossBounds(),
            damage: () => this.damageBoss(bossDamage, s.x, s.y),
          });
        }
      } else
        targets.push({
          id: "player",
          r: p.bounds,
          damage: () => p.takeDamage(s.damage, s.vx > 0 ? 1 : -1),
        });
      const impacts = targets
        .map((target) => ({ target, t: segmentRect(from, to, target.r, s.r) }))
        .filter((v) => v.t !== null && v.t <= hitT)
        .sort((a, b) => a.t! - b.t!);
      for (const impact of impacts) {
        if (s.hits.has(impact.target.id)) continue;
        s.x = from.x + (to.x - from.x) * impact.t!;
        s.y = from.y + (to.y - from.y) * impact.t!;
        s.hits.add(impact.target.id);
        if (s.kind === "torpedo" || s.kind === "bomb") {
          this.blastQueue.push({
            x: s.x,
            y: s.y,
            r: 95,
            damage: s.damage,
            owner: s.owner,
            kind: s.kind,
          });
          s.active = false;
          break;
        }
        impact.target.damage();
        this.hits += s.owner === "player" ? 1 : 0;
        if (!this.enemies.some(e => e.id === impact.target.id)) {
          this.effect(s.x, s.y, "hit", s.owner === "player" ? 42 : 28);
          if (s.owner === "player") this.impactFeedback(s.x, s.y, .18);
        }
        if (!(s.owner === "player" && s.kind === "sonar")) s.damage = Math.max(1, s.damage - 1);
        if (--s.pierce <= 0) {
          s.active = false;
          break;
        }
      }
      if (!s.active) continue;
      s.x = from.x + (to.x - from.x) * hitT;
      s.y = from.y + (to.y - from.y) * hitT;
      s.distance += Math.hypot(s.x-from.x,s.y-from.y);
      if (wall || s.life <= 0 || s.y > L.surface + 20) {
        s.active = false;
        if (s.kind === "bomb" || s.kind === "torpedo")
          this.blastQueue.push({
            x: s.x,
            y: s.y,
            r: 100,
            damage: s.damage,
            owner: s.owner,
            kind: s.kind,
          });
        else this.effect(s.x, s.y, "hit", 20);
      }
    }
  }
  private damageEnemy(e: SeaEnemy, amount: number, kind?: SeaShot["kind"], x = e.x, y = e.y + 32, angle = this.aim) {
    if (e.hp <= 0) return;
    if (kind === "harpoon" || kind === "sonar")
      amount = e.kind === "captain" ? OceanBossWeaponDamage[kind] : OceanWeaponDamage[kind];
    if (kind === "torpedo") amount = e.kind === "captain" ? OceanBossWeaponDamage.torpedo : e.hp;
    e.hp = Math.max(0, e.hp - amount);
    e.hit = .24;
    e.hitDirection = Math.cos(angle) >= 0 ? 1 : -1;
    if (e.shieldHp > 0) {
      e.shieldHp = Math.max(0, e.shieldHp - amount);
      if (e.shieldHp === 0) this.effects.push({ x: e.x, y: e.y + 25, kind: "shield", age: 0, size: 72, angle });
    }
    // Brief physical recoil uses the ordinary collision path. Locked gun origins
    // stay still during their warning/volley, where the impact pose carries feedback.
    if ((e.kind === "diver" || e.kind === "fish") && e.mode !== "tell" && e.mode !== "attack")
      this.moveBody(e, e.hitDirection * (e.hp <= 0 ? 9 : 5), 1, e.kind === "fish" ? 57 : 26, 65);
    this.effects.push({ x, y, kind: "hit", age: 0, size: e.shieldHp > 0 ? 56 : 48, angle });
    this.impactFeedback(x, y, .22);
    // One short stagger per warning. Repeated hits cannot postpone a diver's
    // attack indefinitely and turn every encounter into a stationary target.
    if (e.kind !== "captain" && e.mode === "tell" && !e.staggered) {
      e.timer += 0.12;
      e.staggered = true;
    }
    if (e.hp <= 0) {
      e.mode = "dead";
      this.kills++;
      if (e.kind === "mine")
        this.blastQueue.push({
          x: e.x,
          y: e.y + 25,
          r: 110,
          damage: 6,
          owner: "player",
        });
      // Ammunition comes only from authored crates; ordinary enemies drop none.
      if (e.kind === "captain") {
        this.message = "铁壳号已击破 · 向深水断层前进";
        this.messageTime = 4;
        this.drops.push({ x: e.x - 140, y: e.y + 30, vy: 0,
          kind: "medkit", source: `${e.id}-recovery`, active: true });
      }
      this.effect(
        e.x,
        e.y + (e.kind === "captain" ? MINI_SUB.centerY : 30),
        "blast",
        e.kind === "captain" ? 230 : e.kind === "turret" ? 155 : 115,
      );
      this.blastCount++;
      this.impactFeedback(
        e.x,
        e.y + (e.kind === "captain" ? MINI_SUB.centerY : 30),
        e.kind === "captain" ? 1 : e.kind === "turret" ? 0.65 : 0.35,
      );
    }
  }
  private damageCrate(c: SeaCrate, amount: number) {
    c.hp = Math.max(0, c.hp - amount);
    if (c.hp === 0) {
      this.drops.push({
        x: c.x,
        y: c.y + 20,
        vy: 25,
        kind: c.drop,
        source: c.id,
        active: true,
      });
      this.effect(c.x, c.y + 25, "hit", 55);
    }
  }
  damageBoss(
    amount: number,
    x: number,
    y: number,
    part?: "laserHp" | "torpedoHp" | "cannonHp",
  ) {
    const b = this.boss;
    if (!b.active || b.hp <= 0) return;
    if (part && b[part] > 0) {
      b[part] = Math.max(0, b[part] - amount);
      if (b[part] === 0) {
        this.effect(x, y, "blast", 165);
        this.blastCount++;
        this.impactFeedback(x, y, 0.85);
        this.message = "潜艇武装已摧毁";
        this.messageTime = 2;
        if (part === "laserHp") b.beamActive = false;
      }
    }
    b.hp = Math.max(0, b.hp - amount);
    b.hit = 0.12;
  }
  private flushBlasts() {
    let processed = 0;
    while (this.blastQueue.length && processed++ < 32) {
      const b = this.blastQueue.shift()!;
      this.effect(b.x, b.y, "blast", b.r * 2);
      this.blastCount++;
      this.impactFeedback(b.x, b.y, 1);
      const visible = (x: number, y: number) =>
        Math.hypot(x - b.x, y - b.y) < b.r &&
        this.lineClear({ x: b.x, y: b.y }, { x, y });
      if (b.owner === "player") {
        for (const e of this.enemies) {
          const body=this.enemyBounds(e);
          if (e.hp > 0 && visible(clamp(b.x,body.x,body.x+body.w),clamp(b.y,body.y,body.y+body.h)))
            this.damageEnemy(e, b.damage, b.kind);
        }
        for (const c of this.crates)
          if (c.hp > 0 && visible(c.x, c.y + 25)) this.damageCrate(c, b.damage);
        const body = this.bossBounds(),
          x = clamp(b.x, body.x, body.x + body.w),
          y = clamp(b.y, body.y, body.y + body.h);
        const part = this.bossParts().find(
          (p) => this.boss[p.id] > 0 && visible(p.x + p.w / 2, p.y + p.h / 2),
        );
        if (part || visible(x, y))
          this.damageBoss(b.kind === "torpedo" ? OceanBossWeaponDamage.torpedo : b.damage, b.x, b.y, part?.id);
      } else if (visible(this.player.x, this.player.y + 35))
        this.player.takeDamage(b.damage, b.x < this.player.x ? 1 : -1);
    }
    this.blastQueue = [];
  }
  private impactFeedback(x: number, y: number, strength: number) {
    if (
      x < this.camera.x - 50 ||
      x > this.camera.x + this.camera.visibleWidth + 50 ||
      Math.abs(y - this.player.y) > 500
    )
      return;
    this.shakeTime = Math.max(this.shakeTime, 0.14 + strength * 0.1);
    this.shakePower = Math.max(this.shakePower, 2 + strength * 5);
  }
  private fireMiniSub(e: SeaEnemy) {
    const pose = miniSubPose(e, this.time),
      kind = e.attack === "torpedo" ? "torpedo" : "sonar";
    const count = kind === "torpedo" ? 2 : e.attack === "sweep" ? 3 : e.hp < e.maxHp * .5 ? 7 : 5;
    let live = this.projectiles.filter(
      (s) => s.active && s.owner === "enemy",
    ).length;
    for (let i = 0; i < count && live < 14; i++) {
      const origin = pose.sockets[kind === "torpedo" ? i + 1 : 0];
      const a = e.angle + (kind === "sonar" ? (i - (count - 1) / 2) * 0.21 : 0);
      if (!this.lineClear({ x: e.x, y: e.y + MINI_SUB.centerY }, origin))
        continue;
      const speed = kind === "torpedo" ? 270 : 295;
      const shot = this.spawnShot(
        "enemy",
        kind,
        origin.x,
        origin.y,
        Math.cos(a) * speed,
        Math.sin(a) * speed,
        1,
        3.1,
        "mini",
      );
      if (shot) {
        live++;
        shot.homing = kind === "torpedo" ? 0.5 : 0;
      }
    }
    e.burstLeft = Math.max(0, e.burstLeft - 1);
    e.burstTimer = e.attack === "sweep" ? .40 : .46;
  }
  private steerSwimmer(e: SeaEnemy, target: Vec, dt: number, hw: number, height: number, speed: number) {
    let route=this.swimRoutes.get(e.id);
    if(!route){route=new SwimNavigation();this.swimRoutes.set(e.id,route);}
    const goal={x:clamp(target.x,800+hw,L.width-hw-20),y:clamp(target.y,L.floor+8,L.surface-height-14)};
    const solids=this.terrainIndex.query(Math.min(e.x,goal.x)-hw-300,L.floor,
      Math.max(e.x,goal.x)+hw+300,L.surface,this.navSolids);
    const next=route.next(e,goal,hw,height,solids,L.floor+8,L.surface-height-14,this.time);
    const dx=next.x-e.x,dy=next.y-e.y,distance=Math.hypot(dx,dy),step=Math.min(speed*dt,distance);
    const x=e.x,y=e.y;
    if(distance>.01)this.moveBody(e,dx/distance*step,dy/distance*step,hw,height);
    e.vx=(e.x-x)/dt;e.vy=(e.y-y)/dt;
  }
  private updateMiniSub(e: SeaEnemy, dt: number) {
    const p = this.player,
      dx = p.x - e.x;
    e.active = e.active || Math.abs(dx) < 820 || (p.x > 5350 && p.x < 6440);
    if (!e.active) {
      e.mode = "rest";
      e.timer = 0.4;
      e.vx = e.vy = 0;
      e.burstLeft = 0;
      return;
    }
    e.timer -= dt;
    if (e.mode === "idle" || e.mode === "rest") {
      e.angle = dx < 0 ? Math.PI : 0;
      const next = enemyPattern(e),
        targetY = clamp(p.y + (next === "dive" ? (p.y < 310 ? 145 : -145) : next === "torpedo" ? 6 : -23),
          L.floor + 12, L.surface - MINI_SUB.height - 14);
      const occluded=!this.lineClear({x:e.x,y:e.y+MINI_SUB.centerY},{x:p.x,y:p.y+35});
      if(occluded)this.swimDetours.add(e.id);
      else if(Math.abs(e.y-targetY)<80)this.swimDetours.delete(e.id);
      const blocked=this.swimDetours.has(e.id);
      const targetX=blocked ? p.x : Math.abs(dx)>410||Math.abs(dx)<290 ? p.x-Math.sign(dx||1)*350 : e.x;
      this.steerSwimmer(e,{x:targetX,y:targetY},dt,MINI_SUB.halfWidth,MINI_SUB.height,
        Math.abs(dx)>650?210:145);
      const engaged = this.enemies.filter(
        (o) =>
          o !== e &&
          o.active &&
          o.hp > 0 &&
          (o.mode === "tell" || o.mode === "attack"),
      ).length;
      const origin = miniSubPose(e, this.time).sockets[
        next === "torpedo" ? 1 : 0
      ];
      if (
        e.timer <= 0 &&
        Math.abs(dx) < 610 &&
        Math.abs(e.y - targetY) < 95 &&
        engaged < oceanAttackBudget(p.x) &&
        e.x > this.camera.x + 35 &&
        e.x < this.camera.x + this.camera.visibleWidth - 35 &&
        this.lineClear(origin, { x: p.x, y: p.y + 35 })
      ) {
        e.attack = next;
        e.mode = "tell";
        e.tellDuration = next === "dash" || next === "dive" ? 1 : next === "sweep" ? .9 : .8;
        e.timer = e.tellDuration;
        e.locked = false;
        e.vx = e.vy = 0;
      }
    } else if (e.mode === "tell") {
      // The hull stays horizontal; the warning commits the whole charge path.
      if (!e.locked) {
        e.angle = e.attack === "dive" ? Math.atan2(p.y + 35 - (e.y + 62), dx) : dx < 0 ? Math.PI : 0;
        if (e.timer <= e.tellDuration * 0.6) e.locked = true;
      }
      if (e.timer > 0) return;
      e.mode = "attack";
      e.locked = true;
      e.attackCounts[e.attack] = (e.attackCounts[e.attack] ?? 0) + 1;
      if (e.attack === "dash" || e.attack === "dive") {
        e.dashDuration = clamp((Math.hypot(dx, e.attack === "dive" ? p.y + 35 - (e.y + 62) : 0) + 110) / 470, 0.5, 1.3);
        this.attackAudio.emit("charge", e.x, e.y + 62);
        e.timer = e.dashDuration;
        e.vx = Math.cos(e.angle) * 470;
        e.vy = Math.sin(e.angle) * 470;
      } else {
        e.timer = e.attack === "sweep" ? 1.1 : e.attack === "torpedo" ? .95 : .75;
        e.burstLeft = e.attack === "sweep" ? 3 : e.attack === "torpedo" ? 2 : 1;
        e.vy = e.attack === "sweep" ? (e.y > 300 ? -140 : 140) : 0;
        this.fireMiniSub(e);
      }
    } else if (e.mode === "attack") {
      if (e.attack === "sweep") this.moveBody(e, 0, e.vy * dt, MINI_SUB.halfWidth, MINI_SUB.height);
      if(e.burstLeft>0){e.burstTimer-=dt;if(e.burstTimer<=0)this.fireMiniSub(e);}
      if (e.attack === "dash" || e.attack === "dive") {
        const before = { x: e.x, y: e.y + 62 },
          mx = e.vx * dt, my = e.vy * dt;
        this.moveBody(e, mx, my, MINI_SUB.halfWidth, MINI_SUB.height);
        const after = { x: e.x, y: e.y + 62 };
        // Swept rectangular hull, not the old diver-sized circular contact radius.
        const target = {
          x: p.bounds.x - 88,
          y: p.bounds.y - 54,
          w: p.bounds.w + 176,
          h: p.bounds.h + 108,
        };
        if (segmentRect(before, after, target) !== null)
          p.takeDamage(1, dx > 0 ? 1 : -1);
        if (Math.abs(after.x - before.x - mx) > 1 || Math.abs(after.y - before.y - my) > 1) this.enemyRecover(e, .8);
      }
      if (overlaps(miniSubBounds(e), p.bounds))
        p.takeDamage(1, dx > 0 ? 1 : -1);
      if (e.mode === "attack" && e.timer <= 0) this.enemyRecover(e, e.hp < e.maxHp * .5 ? .65 : .8);
    }
  }
  private fireEnemy(e: SeaEnemy) {
    if (e.kind === "captain") {
      this.fireMiniSub(e);
      return;
    }
    const kind: OceanEnemyWeapon =
      e.attack === "torpedo"
        ? "torpedo"
        : e.attack === "sonar"
          ? "sonar"
          : "harpoon";
    const speed = kind === "harpoon" ? 360 : kind === "sonar" ? 255 : 205;
    const offsets = oceanVolleyOffsets(e.kind);
    const origin =
      e.kind === "diver"
        ? oceanEnemyPose(e, this.time).muzzle
        : {
            x: e.x + Math.cos(e.angle) * 36,
            y: e.y + 32 + Math.sin(e.angle) * 36,
          };
    let live = 0;
    for (const s of this.projectiles)
      if (s.active && s.owner === "enemy") live++;
    for (let i = 0; i < offsets.length && live < 14; i++) {
      const a = e.angle + offsets[i];
      if (!this.lineClear({ x: e.x, y: e.y + 32 }, origin)) continue;
      const shot = this.spawnShot(
        "enemy",
        kind,
        origin.x,
        origin.y,
        Math.cos(a) * speed,
        Math.sin(a) * speed,
        1,
        3.1,
      );
      if (shot) {
        live++;
        if (kind === "torpedo") shot.homing = 0.6;
        e.fireFlash = .12;
      }
    }
    // A regular enemy fires once per warning. The next shot requires a new
    // recovery/movement/aim cycle, never an automatic twin or delayed fan.
    e.burstLeft = e.burstTimer = 0;
  }
  private enemyRecover(e: SeaEnemy, delay?: number) {
    e.mode = "rest";
    e.serial++;
    e.burstLeft = 0;
    e.volleysLeft = 0;
    e.vx = e.vy = 0;
    e.reaction = 0;
    e.timer =
      delay ??
      (e.kind === "captain"
        ? 0.9
        : e.kind === "fish"
          ? 1.0
          : (e.kind === "jellyfish" ? OCEAN_JELLY.recovery : e.kind === "diver" || e.kind === "turret" ? oceanRangedRest.afterSequence : 1.05) + (e.homeX % 3) * 0.12);
  }
  private tryEnemyDodge(e: SeaEnemy, dt: number): boolean {
    if (e.kind !== "diver" || e.dodgeCooldown > 0 || (e.mode !== "idle" && e.mode !== "rest")) return false;
    let threat: SeaShot | undefined,
      nearest = 0.65;
    for (const s of this.projectiles) {
      if (
        !s.active ||
        s.owner !== "player" ||
        s.age < 0.07 ||
        s.kind === "bomb"
      )
        continue;
      const dx = e.x - s.x,
        dy = e.y + 32 - s.y,
        v2 = s.vx * s.vx + s.vy * s.vy,
        t = (dx * s.vx + dy * s.vy) / v2;
      if (t <= 0.06 || t >= nearest || dx * dx + dy * dy > 360 * 360) continue;
      if (Math.hypot(dx - s.vx * t, dy - s.vy * t) > 36 + s.r) continue;
      if (!this.lineClear({ x: s.x, y: s.y }, { x: e.x, y: e.y + 32 }))
        continue;
      nearest = t;
      threat = s;
    }
    if (!threat) {
      e.reaction = 0;
      return false;
    }
    e.reaction += dt;
    if (e.reaction < 0.10) return false;
    const speed = Math.hypot(threat.vx, threat.vy),
      nx = -threat.vy / speed,
      ny = threat.vx / speed;
    const sign = e.y > 340 ? (ny > 0 ? -1 : 1) : ny > 0 ? 1 : -1;
    let choice: Vec | undefined, best = -Infinity;
    // Sideways first, with diagonals available near a reef or another projectile lane.
    for (const dir of [sign, -sign]) for (const tilt of [0, -.48, .48]) {
      const c=Math.cos(tilt),sn=Math.sin(tilt);
      const vx=(nx*c-ny*sn)*dir*300,vy=(nx*sn+ny*c)*dir*300;
      const target={x:e.x+vx*.3,y:e.y+vy*.3};
      if (target.y<L.floor+15 || target.y>L.surface-110 || Math.abs(target.x-e.homeX)>330) continue;
      const probe={x:e.x,y:e.y};this.moveBody(probe,vx*.3,vy*.3,23,58);
      if(Math.hypot(probe.x-target.x,probe.y-target.y)>1)continue;
      let clearance=300;
      for(const shot of this.projectiles)if(shot.active&&shot.owner==='player')
        clearance=Math.min(clearance,Math.hypot(target.x-shot.x-shot.vx*.3,target.y+32-shot.y-shot.vy*.3)-shot.r);
      const score=clearance-Math.abs(tilt)*8-Math.abs(target.y-300)*.03;
      if(score>best){best=score;choice={x:vx,y:vy};}
    }
    e.reaction = 0;
    e.dodgeCooldown = choice ? 1.8 - oceanPressure(e.homeX) * .2 : .45;
    if (!choice) return false;
    e.mode = "dodge";
    e.timer = .3;
    e.dodgeX = choice.x;
    e.dodgeY = choice.y;
    e.dodges++;
    return true;
  }
  private updateEnemy(e: SeaEnemy, dt: number) {
    e.fireFlash = Math.max(0, (e.fireFlash ?? 0) - dt);
    e.hit = Math.max(0, e.hit - dt);
    e.dodgeCooldown = Math.max(0, e.dodgeCooldown - dt);
    if (e.hp <= 0) {
      if (e.kind === "captain") {
        for (const [at, dx] of [
          [0.24, -40],
          [0.52, 45],
        ])
          if (e.deadTime < at && e.deadTime + dt >= at) {
            this.effect(e.x + dx, e.y + 50, "blast", 110);
            this.impactFeedback(e.x + dx, e.y + 50, 0.45);
          }
      }
      e.deadTime += dt;
      return;
    }
    if (e.kind === "captain") {
      this.updateMiniSub(e, dt);
      return;
    }
    const p = this.player,
      dx = p.x - e.x,
      dy = p.y + 35 - (e.y + (e.kind === "jellyfish" ? OCEAN_JELLY.centerY : 32)),
      distance = Math.hypot(dx, dy);
    e.active = Math.abs(dx) < (e.kind === "fish" ? 820 : 720);
    if (!e.active) {
      e.mode = "rest";
      e.timer = 0.25;
      e.burstLeft = 0;
      e.volleysLeft = 0;
      e.reaction = 0;
      e.vx = e.vy = 0;
      return;
    }
    e.timer -= dt;
    if (e.mode === "dodge") {
      const x = e.x,
        y = e.y;
      this.moveBody(e, e.dodgeX * dt, e.dodgeY * dt, 23, 58);
      e.vx = (e.x - x) / dt;
      e.vy = (e.y - y) / dt;
      e.y = clamp(e.y, L.floor + 15, L.surface - 110);
      if (e.timer <= 0 || Math.hypot(e.vx, e.vy) < 20)
        this.enemyRecover(e, 0.24);
      return;
    }
    if (e.mode === "idle" || e.mode === "rest") {
      if (this.tryEnemyDodge(e, dt)) return;
      if (e.kind === "diver" || e.kind === "fish") {
        const keep =
          e.kind === "fish"
            ? 300
            : e.role === "torpedo"
              ? 410
              : e.role === "sonar"
                ? 320
                : 370;
        const pressure = oceanPressure(e.homeX),
          pace = 74 + pressure * 26;
        const moveX =
          distance > keep + 60
            ? Math.sign(dx) * pace
            : distance < keep - 65
              ? -Math.sign(dx) * pace
              : 0;
        const lane = e.homeX < 2400 ? (e.role === "sonar" ? -85 : 70)
          : (e.role === "sonar" ? -110 : 100) * (e.serial % 2 ? -1 : 1);
        const targetY =
          e.kind === "fish"
            ? p.y + 15
            : clamp(
                p.y + lane + Math.sin(this.time * 0.9 + e.homeX) * 35,
                e.homeY - 160,
                e.homeY + 160,
              );
        const moveY = clamp((targetY - e.y) * 2, -100, 100),
          x = e.x,
          y = e.y;
        if(e.kind === "fish") {
          const occluded=!this.lineClear({x:e.x,y:e.y+OCEAN_FISH.centerY},{x:p.x,y:p.y+35});
          if(occluded)this.swimDetours.add(e.id);
          else if(Math.abs(e.y-targetY)<65)this.swimDetours.delete(e.id);
          const blocked=this.swimDetours.has(e.id);
          const targetX=blocked?p.x:distance>keep+60||distance<keep-65?p.x-Math.sign(dx||1)*keep:e.x;
          this.steerSwimmer(e,{x:targetX,y:targetY},dt,OCEAN_FISH.halfLength,64,OCEAN_FISH.swimSpeed);
        } else {
          this.moveBody(e, moveX * dt, moveY * dt, 23, 58);
          e.x = clamp(e.x,e.homeX-330,e.homeX+330);
          e.y = clamp(e.y, L.floor + 15, L.surface - 110);
          e.vx = (e.x - x) / dt;
          e.vy = (e.y - y) / dt;
        }
      }
      if (e.kind === "jellyfish") {
        // Swim around real terrain until a short, telegraphed sting can reach.
        const side = Math.sign(dx || 1);
        const target = {x: p.x - side * 120, y: p.y + 35 - OCEAN_JELLY.centerY};
        this.steerSwimmer(e, target, dt, OCEAN_JELLY.halfWidth, OCEAN_JELLY.height,
          OCEAN_JELLY.swimSpeed * (.85 + .15 * Math.sin(this.time * 5 + e.homeX)));
      }
      e.angle = Math.atan2(p.y + 35 - (e.y + (e.kind === "jellyfish" ? OCEAN_JELLY.centerY : 32)), p.x - e.x);
      const range =
        e.kind === "jellyfish"
          ? OCEAN_JELLY.range
          : e.kind === "mine"
            ? 110
            : e.kind === "fish"
              ? OCEAN_FISH.range
              : 610;
      let engaged = 0;
      for (const o of this.enemies)
        if (
          o !== e &&
          o.active &&
          o.hp > 0 &&
          (o.mode === "tell" || o.mode === "attack")
        )
          engaged++;
      if (
        e.timer <= 0 &&
        distance < range &&
        engaged < oceanAttackBudget(p.x) &&
        e.x > this.camera.x + 20 &&
        e.x < this.camera.x + this.camera.visibleWidth - 25 &&
        this.lineClear({ x: e.x, y: e.y + 32 }, { x: p.x, y: p.y + 35 })
      ) {
        e.attack = enemyPattern(e);
        if (e.volleysLeft === 0)
          e.volleysLeft = e.kind === "diver" || e.kind === "turret" ? oceanVolleyCount(e.homeX) : 1;
        e.mode = "tell";
        e.staggered = false;
        e.locked = false;
        e.vx = e.vy = 0;
        e.tellDuration =
          e.kind === "jellyfish"
            ? OCEAN_JELLY.tell
            : e.kind === "fish"
            ? OCEAN_FISH.tell
            : e.attack === "torpedo"
              ? 1.05
              : e.attack === "sonar"
                ? 0.85
                : 0.7;
        e.timer = e.tellDuration;
        e.burstLeft = 0;
        e.reaction = 0;
      }
    } else if (e.mode === "tell") {
      // Track early, then visibly commit. A late dodge cannot be followed by an instant aim correction.
      if (!e.locked) {
        e.angle = Math.atan2(dy, dx);
        if (e.timer <= e.tellDuration * 0.55) e.locked = true;
      }
      if (e.timer > 0) return;
      e.mode = "attack";
      e.timer = 0.62;
      e.locked = true;
      e.attackCounts[e.attack] = (e.attackCounts[e.attack] ?? 0) + 1;
      if (e.kind === "mine") {
        e.hp = 0;
        e.mode = "dead";
        this.blastQueue.push({
          x: e.x,
          y: e.y + 25,
          r: 110,
          damage: 1,
          owner: "enemy",
        });
      } else if (e.attack === "dash" || e.attack === "sting") {
        const jelly = e.kind === "jellyfish", speed = jelly ? OCEAN_JELLY.stingSpeed : OCEAN_FISH.speed;
        this.attackAudio.emit("enemy-melee", e.x, e.y + OCEAN_FISH.centerY);
        e.dashDuration = clamp((distance + (jelly ? 35 : 65)) / speed, 0.38, jelly ? .82 : .94);
        e.timer = e.dashDuration;
        e.vx = Math.cos(e.angle) * speed;
        e.vy = Math.sin(e.angle) * speed;

      } else {
        this.fireEnemy(e);
      }
    } else if (e.mode === "attack") {
      if (e.attack === "dash" || e.attack === "sting") {
        const centerY = e.kind === "jellyfish" ? OCEAN_JELLY.centerY : OCEAN_FISH.centerY;
        const before = { x: e.x, y: e.y + centerY },
          mx = e.vx * dt,
          my = e.vy * dt;
        const bounds=e.kind === "jellyfish" ? oceanJellyBounds(e) : oceanFishBounds(e),hw=bounds.w/2,hh=bounds.h/2;
        const body={x:e.x,y:bounds.y};
        this.moveBody(body,mx,clamp(my,L.floor+4-body.y,L.surface-4-bounds.h-body.y),hw,bounds.h);
        e.x=body.x;e.y=body.y+hh-centerY;
        const after = { x: e.x, y: e.y + centerY };
        const target={x:p.bounds.x-hw,y:p.bounds.y-hh,w:p.bounds.w+hw*2,h:p.bounds.h+hh*2};
        if (segmentRect(before, after, target) !== null && this.lineClear(after,{x:p.x,y:p.y+35}))
          p.takeDamage(1, dx > 0 ? 1 : -1);
        if (Math.hypot(after.x - before.x - mx, after.y - before.y - my) > 1)
          this.enemyRecover(e);
      } else if (overlaps(this.enemyBounds(e), p.bounds))
        p.takeDamage(1, dx > 0 ? 1 : -1);
      if (e.mode === "attack" && e.timer <= 0) {
        const followUps = Math.max(0, e.volleysLeft - 1);
        this.enemyRecover(e, followUps > 0 ? oceanRangedRest.betweenAttacks : undefined);
        e.volleysLeft = followUps;
      }
    }
  }

  bossModuleTransform(id: "laserHp" | "cannonHp") {
    const part = this.bossParts().find((p) => p.id === id)!,
      b = this.boss;
    const engaged =
      id === "laserHp"
        ? b.attack === "laser" || b.attack === "sweep"
        : b.attack === "cannon" || b.attack === "fan";
    // Sockets on the unarmed hull at native x=192 and 592. Turret feet sit on these sockets.
    const pivot = { x: part.x + part.w * 0.55, y: part.y + 7 };
    const angle =
      engaged && b.mode !== "rest" && b.mode !== "idle" ? b.angle - Math.PI : 0;
    const anchor =
      id === "laserHp"
        ? [119 / 232, 1 - 255 / 282]
        : [190 / 304, 1 - 219 / 241];
    const offset =
      id === "laserHp"
        ? { x: ((50 - 119) / 232) * part.w, y: ((255 - 73) / 282) * part.h }
        : { x: ((29 - 190) / 304) * part.w, y: ((219 - 50) / 241) * part.h };
    return {
      pivot,
      angle,
      anchor,
      muzzle: {
        x: pivot.x + offset.x * Math.cos(angle) - offset.y * Math.sin(angle),
        y: pivot.y + offset.x * Math.sin(angle) + offset.y * Math.cos(angle),
      },
    };
  }
  bossOrigin(attack = this.boss.attack): Vec {
    const b = this.boss;
    return attack === "laser" || attack === "sweep"
      ? this.bossModuleTransform("laserHp").muzzle
      : attack === "torpedo"
        ? { x: b.x - 125, y: b.y - 116 }
        : this.bossModuleTransform("cannonHp").muzzle;
  }
  beamEnd(): Vec {
    const o = this.bossOrigin(),
      a = this.boss.angle,
      end = { x: o.x + Math.cos(a) * 1200, y: o.y + Math.sin(a) * 1200 };
    let t = 1;
    for (const r of this.terrainIndex.query(
      Math.min(o.x, end.x),
      Math.min(o.y, end.y),
      Math.max(o.x, end.x),
      Math.max(o.y, end.y),
      this.raySolids,
    )) {
      const h = segmentRect(o, end, r);
      if (h !== null) t = Math.min(t, h);
    }
    return { x: o.x + (end.x - o.x) * t, y: o.y + (end.y - o.y) * t };
  }
  private moveBoss(dt: number) {
    const b = this.boss, p = this.player;
    // A full-height lane remains above AND below the hull at either arena edge.
    // Sweep the actual body against terrain and the player; never push/teleport
    // the swimmer as the submarine advances.
    const side = p.x < b.x ? 1 : -1;
    const targetX = clamp(p.x + side * B.preferredGap,
      L.arena - B.retreatApron + 300 + B.edgeClearance,
      L.width - 300 - B.edgeClearance);
    const targetY = clamp(p.y + 35 + (b.serial % 2 ? 110 : -110), 315, 405);
    const speed = Math.abs(p.x - b.x) > 760 ? B.chaseSpeed : B.cruiseSpeed;
    const body = { x: b.x, y: b.y - 105 };
    this.moveBody(body, clamp(targetX - b.x, -speed * dt, speed * dt),
      clamp(targetY - b.y, -B.verticalSpeed * dt, B.verticalSpeed * dt),
      300, 210, [p.bounds]);
    b.vx = (body.x - b.x) / dt;
    b.vy = (body.y + 105 - b.y) / dt;
    b.travel += Math.hypot(body.x - b.x, body.y + 105 - b.y);
    b.x = body.x;
    b.y = body.y + 105;
  }
  private bossWeaponReady(attack = this.boss.attack) {
    const b = this.boss;
    return attack === "laser" || attack === "sweep" ? b.laserHp > 0
      : attack === "torpedo" ? b.torpedoHp > 0
      : attack === "cannon" || attack === "fan" ? b.cannonHp > 0 : true;
  }
  private fireBossVolley() {
    const b = this.boss;
    if(!this.bossWeaponReady()){b.volleyRemaining=0;return;}
    const o=this.bossOrigin(),count=b.attack === "torpedo" ? (b.phase===1?2:3)
      : b.attack === "fan" ? B.sonarOffsets.length : 3;
    let live=this.projectiles.filter(s=>s.active&&s.owner==='enemy').length;
    for(let i=0;i<count&&live<18;i++){
      const spread=.105;
      // Repeated sonar volleys keep the same three lanes, leaving the gaps open.
      const angle=b.angle+(b.attack === "fan" ? B.sonarOffsets[i] : (i-(count-1)/2)*spread+(b.volleyIndex%2?spread*.5:0));
      const speed=b.attack === "torpedo" ? 255 : b.attack === "fan" ? 285 : 320+i*12;
      const shot=this.spawnShot('enemy',b.attack==='torpedo'?'torpedo':b.attack==='fan'?'sonar':'bomb',
        o.x,o.y,Math.cos(angle)*speed,Math.sin(angle)*speed,1,4.3,'boss');
      if(shot){live++;if(b.attack==='torpedo')shot.homing=.48;}
    }
    b.volleyIndex++;b.volleyCount++;b.volleyRemaining--;b.volleyTimer=b.attack === "fan" ? B.sonarVolleyInterval : .50;
  }
  private updateBoss(dt: number) {
    const b = this.boss,
      p = this.player;
    b.hit = Math.max(0, b.hit - dt);
    if (!b.active && p.x >= L.arena) {
      b.active = true;
      b.timer = .8;
      this.message = "巨型潜艇 · 看清预警，拆掉炮塔";
      this.messageTime = 3;
    }
    b.vx = b.vy = 0;
    if (!b.active || b.hp <= 0) return;
    b.summonTimer -= dt;
    if (b.summons === 0 && b.summonTimer <= 0) {
      // One two-person wave for the entire fight, including after phase changes.
      const candidates = [clamp(b.x - 430, L.arena + 80, L.width - 80),
        clamp(b.x + 430, L.arena + 80, L.width - 80)];
      const x = candidates.sort((a,c) => Math.abs(c-p.x)-Math.abs(a-p.x))[0];
      for (let i=0;i<2;i++) {
        const e = this.createEnemy(["diver", x, i === 0 ? 140 : 510, i === 0 ? "harpoon" : "sonar"], `sea-reinforce-${i}`, i);
        e.mode = "rest"; e.timer = 1.2 + i * .5;
        this.enemies.push(e);
      }
      b.summons = 2;
      this.message = "潜艇呼叫增援 · 两名潜水兵接近";
      this.messageTime = 2.5;
    }
    b.phase = b.hp > b.maxHp * 0.7 ? 1 : b.hp > b.maxHp * 0.35 ? 2 : 3;
    b.timer -= dt;
    if (b.mode === "idle" || b.mode === "rest") {
      b.beamActive = false;
      this.moveBoss(dt);
      // Catch a retreating player before starting another attack cycle. The
      // encounter and HP bar remain active across the old entrance trigger.
      if (Math.abs(p.x - b.x) > 820) return;
      if (b.timer <= 0) {
        // One cursor survives phase changes, so damage cannot keep skipping
        // the distinctive attacks before the encounter ends.
        const pattern: Attack[] = ["torpedo", "laser", "fan", "sweep", "cannon"];
        let chosen: Attack | undefined;
        for (let i = 0; i < pattern.length; i++) {
          const attack = pattern[(b.serial + i) % pattern.length];
          if (!this.bossWeaponReady(attack)) continue;
          chosen = attack;
          b.serial += i;
          break;
        }
        // Destroyed weapons stay disabled. A disarmed hull cannot resurrect the removed arc.
        if (!chosen) { b.mode = "rest"; b.timer = B.recovery[b.phase-1]; return; }
        b.attack = chosen;
        b.serial++;
        b.mode = "tell";
        b.tellDuration = chosen === "sweep" ? 1.25 : 1;
        b.timer = b.tellDuration;
        b.locked = chosen === "sweep";
        b.volleyRemaining = b.volleyIndex = 0;
        const o = this.bossOrigin();
        b.angle = Math.atan2(p.y + 35 - o.y, p.x - o.x);
        // Alternate the occupied half between cycles, always leaving a full
        // escape lane and showing both sector edges before any beam damage.
        if (chosen === "sweep") {
          const lower = Math.floor(b.serial / pattern.length) % 2 === 1;
          const left = p.x < b.x, base = left ? Math.PI : 0;
          const sign = (lower ? 1 : -1) * (left ? 1 : -1);
          b.angleStart = base + sign * 0.7;
          b.angleEnd = base + sign * 0.08;
          b.angle = b.angleStart;
        }
      }
    } else if (b.mode === "tell") {
      if(!b.locked){
        const origin=this.bossOrigin();b.angle=Math.atan2(p.y+35-origin.y,p.x-origin.x);
        if(b.timer<=b.tellDuration*.55)b.locked=true;
      }
      if(b.timer>0)return;
      b.mode = "fire";
      b.locked = true;
      b.timer =
        b.attack === "laser" || b.attack === "sweep"
            ? 1.5
            : 1.05;
      b.attackCounts[b.attack] = (b.attackCounts[b.attack] ?? 0) + 1;
      if (b.attack === "laser" || b.attack === "sweep") {
        b.beamActive = b.laserHp > 0;
        if (b.beamActive) { const o = this.bossOrigin(); this.attackAudio.emit("beam", o.x, o.y); }

      } else {
        b.volleyRemaining = 2;
        this.fireBossVolley();
      }
    } else if (b.mode === "fire") {
      if(b.volleyRemaining>0){b.volleyTimer-=dt;if(b.volleyTimer<=0)this.fireBossVolley();}
      if (b.attack === "sweep")
        b.angle =
          b.angleStart +
          (b.angleEnd - b.angleStart) * clamp(1 - b.timer / 1.5, 0, 1);
      if (
        b.beamActive &&
        b.laserHp > 0 &&
        segmentRect(this.bossOrigin(), this.beamEnd(), p.bounds, 9) !== null
      )
        p.takeDamage(1, -1);
      if (b.timer <= 0) {
        b.mode = "rest";
        b.timer = B.recovery[b.phase-1];
        b.volleyRemaining = 0;
        b.beamActive = false;
        b.ringRadius = 0;
      }
    }
  }
  private updateSupplies(dt: number) {
    const p = this.player;
    for (const c of this.crates) {
      if (c.hp <= 0) c.deadTime += dt;
      const floor = this.supportY(c.x, c.y);
      c.vy = Math.max(-95, c.vy - 120 * dt);
      c.y = Math.max(floor, c.y + c.vy * dt);
      if (c.y <= floor) c.vy = 0;
    }
    for (const point of L.recovery)
      if (
        p.health <= 3 &&
        Math.abs(p.x - point.x) < 180 &&
        !this.recoveryUsed.has(point.id) &&
        !this.drops.some(
          (d) =>
            d.active && d.kind === "medkit" && Math.abs(d.x - point.x) < 550,
        )
      ) {
        this.drops.push({
          x: point.x,
          y: Math.max(100, p.y - 10),
          vy: 0,
          kind: "medkit",
          source: point.id,
          active: true,
        });
        this.recoveryUsed.add(point.id);
      }
    for (const d of this.drops) {
      if (!d.active) continue;
      const floor = this.supportY(d.x, d.y) + 20;
      d.vy = Math.max(-65, d.vy - 75 * dt);
      d.y = Math.max(floor, d.y + d.vy * dt);
      if (
        Math.hypot(p.x - d.x, p.y + 30 - d.y) > 70 ||
        (d.kind === "medkit" && p.health >= 5)
      )
        continue;
      d.active = false;
      this.collected++;
      this.messageTime = 2.5;
      if (d.kind === "medkit") {
        p.health = Math.min(5, p.health + 2);
        this.message = "生命恢复 +2";
      } else if (d.kind === "depth-charge") {
        p.grenades = Math.min(6, p.grenades + 2);
        this.message = "水下手雷 +2";
      } else {
        const weapon = d.kind as OceanWeapon;
        const capacity = weapon === "torpedo" ? OceanWeaponAmmo.torpedo : OceanWeaponAmmo.sonar;
        const amount = capacity;
        this.ammo =
          this.storedWeapon === weapon
            ? Math.min(capacity, this.ammo + amount)
            : amount;
        this.storedWeapon = weapon;
        p.recoil = 0;
        if (this.weapon !== "knife") this.weapon = weapon;
        this.message =
          weapon === "torpedo"
            ? `鱼雷枪 · ${this.ammo} 发 · 范围爆炸`
            : `声波枪 · ${this.ammo} 发 · 穿透攻击`;
      }
    }
  }
  supportY(x: number, y: number) {
    let top = L.floor;
    for (const r of this.terrainIndex.query(
      x,
      L.floor,
      x,
      Math.max(L.floor, y + 4),
      this.supportSolids,
    ))
      if (x >= r.x && x <= r.x + r.w && r.y + r.h <= y + 4)
        top = Math.max(top, r.y + r.h);
    return top;
  }
  private effect(x: number, y: number, kind: SeaEffect["kind"], size: number) {
    if (this.effects.length >= 96) this.effects.shift();
    this.effects.push({ x, y, kind, size, age: 0 });
  }
  private updateVictory(dt: number) {
    const p = this.player;
    for (const event of this.victory.advance(dt)) {
      this.effect(
        this.boss.x + event.x * 2,
        this.boss.y + event.y - 100,
        "blast",
        event.radius,
      );
      this.shakeTime = 0.25;
      this.shakePower = event.shake;
    }
    if (this.victory.time > 2) {
      p.y = Math.min(L.surface - 35, p.y + 140 * dt);
      p.x += Math.min(0, this.boss.x - 400 - p.x) * dt * 0.5;
    }
    p.celebrationTime = this.victory.cheerTime;
    p.animationTime += dt;
    if (this.victory.phase === "settlement") this.state = "complete";
  }
  snapshot() {
    return {
      chapter: 2,
      state: this.state,
      revival: this.revival.snapshot(),
      time: this.time,
      clearTime: this.clearTime,
      stage: this.stage,
      introTime: this.introTime,
      entryPhase:
        this.stage === "shore" ? "approach" : entryPhase(this.introTime),
      chest: {
        x: E.chestX,
        y: 720,
        phase:
          this.stage === "shore"
            ? 0
            : this.introTime < E.openAt
              ? 0
              : this.introTime < E.takeAt
                ? 1
                : 2,
      },
      player: {
        x: this.player.x,
        y: this.player.y,
        vx: this.player.vx,
        vy: this.player.vy,
        health: this.player.health,
        facing: this.player.facing,
        alive: this.player.alive,
      },
      cameraX: this.camera.x,
      cameraY: this.camera.y,
      furthestX: this.furthestX,
      retreatLimit: this.retreatLimit,
      weapon: this.weapon,
      ammo: this.ammo,
      aim: this.aim,
      muzzle: this.muzzle(),
      lastShotWeapon: this.lastShotWeapon,
      lastShotMuzzle: this.lastShotMuzzle,
      aimTarget: this.aimTarget,
      aimIndicator: this.aimIndicator(),
      grenadeThrowTime: this.grenadeThrowTime,
      shots: this.shots,
      hits: this.hits,
      kills: this.kills,
      grenades: this.player.grenades,
      depthThrown: this.depthThrown,
      boostCooldown: this.boostCooldown,
      attackCooldown: {
        remaining: this.cooldown,
        duration: this.attackCooldownDuration,
      },
      knifeSerial: this.knifeSerial,
      protectedPress: this.protectedPress,
      zone: this.zone.name,
      levelWidth: L.width,
      boss: { ...this.boss },
      miniBoss: { ...this.mini },
      enemies: this.enemies.map((e) => ({ ...e })),
      objects: this.crates.map((c) => ({ ...c })),
      pickups: this.drops.filter((d) => d.active).map((d) => ({ ...d })),
      recoverySpawned: [...this.recoveryUsed],
      effects: this.effects.map((f) => ({ ...f })),
      impact: {
        hitStop: this.hitStop,
        shakeTime: this.shakeTime,
        shakePower: this.shakePower,
        blastCount: this.blastCount,
      },
      projectileStates: this.projectiles
        .filter((s) => s.active)
        .map((s) => ({
          owner: s.owner,
          kind: s.kind,
          tier: s.tier,
          radius: s.r,
          x: s.x,
          y: s.y,
          vx: s.vx,
          vy: s.vy,
          age: s.age,
          homing: s.homing,
        })),
      victory: this.victory.snapshot(),
      bullets: this.projectiles.filter((s) => s.active).length,
    };
  }
}

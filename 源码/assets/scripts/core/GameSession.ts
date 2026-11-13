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
import { ColossusBoss } from "../enemy/ColossusBoss";
import { MeleeSystem } from "../combat/MeleeSystem";
import { Revival, LandAnchor, landAnchor, landRevivePoint, padded } from "./Revival";
import { Vec } from "./Types";
import { VictorySequence } from "./VictorySequence";

/** Session owns simulation order; no engine or browser dependencies. */
export class GameSession {
  /** An encounter stays engaged until defeat/restart, even outside its entrance. */
  get bossFraming(): boolean {
    const boss = this.spawner.guard;
    return this.level.arenaEntered || (this.level.arenaVisited && boss.alive);
  }
  readonly revival = new Revival();
  private reviveAnchor?: LandAnchor;
  private deathOrigin?: Vec;
  private anchorTime = 0;
  state: GameState = "title";
  readonly player = new PlayerController();
  readonly level: LevelController;
  readonly camera = new CameraFollow();
  readonly spawner = new EnemySpawner();
  readonly particles = new ParticlePool();
  readonly projectiles = new ProjectileManager(this.particles);
  readonly weapon = new WeaponSystem();
  readonly melee = new MeleeSystem();
  readonly explosions = new ExplosionSystem();
  readonly grenades = new GrenadeSystem();
  readonly pickups = new PickupSystem();
  readonly victory = new VictorySequence();
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
  private resumeState: "playing" | "dying" | "reviving" = "playing";
  private bossDeathStarted = false;
  private introEffectPlayed = false;
  private stompSerial = 0;
  private weaponRevision = 0;
  constructor(data?: LevelDefinition) {
    this.player.bindWeapon(this.weapon);
    this.level = new LevelController(data);
    this.reset("title");
  }
  reset(state: GameState = "playing"): void {
    this.revival.reset(); this.reviveAnchor=undefined; this.deathOrigin=undefined; this.anchorTime=0;
    this.state = state;
    this.time = 0;
    this.hitFlash = 0;
    this.level.reset();
    this.player.reset(this.level.data.spawn.x, this.level.data.spawn.y);
    this.player.throwTime = 0;
    this.camera.reset(this.level.data.spawn.x);
    this.spawner.reset(this.level.data.enemies);
    this.particles.reset();
    this.projectiles.reset();
    this.weapon.reset();
    this.weaponRevision = this.weapon.revision;
    this.melee.reset();
    this.player.meleeTime = 0;
    this.explosions.reset();
    this.grenades.reset();
    this.pickups.reset();
    this.victory.reset();
    this.combo = this.bestCombo = this.lastKills = 0;
    this.comboTime = 0;
    this.dropSeed = 1;
    this.shakeTime = this.shakePower = this.hitStop = 0;
    this.bossDeathStarted = false;
    this.introEffectPlayed = false;
    this.stompSerial = 0;
    this.projectiles.onExplosion = (x, y, radius, damage, owner, style) =>
      this.explosions.enqueue(x, y, radius, damage, owner, style);
    this.level.objects.onHit = (o, destroyed) => this.objectHit(o, destroyed);
  }
  revive(): boolean {
    if(this.state!=="gameover" || !this.revival.remaining || this.victory.active)return false;
    const origin=this.deathOrigin ?? {x:this.player.x,y:this.player.y};
    this.level.refreshSolids();
    const zone=this.level.data.zones?.find(z=>origin.x>=z.start && origin.x<z.end);
    const avoid=this.spawner.enemies.filter(e=>e.alive).map(e=>padded(e.bounds));
    for(const o of this.level.objects.objects)if(o.alive && o.kind==="barrel")avoid.push(padded(o.bounds,80));
    const point=landRevivePoint(origin,this.level.solids,avoid,{
      left:Math.max(this.level.retreatLimit+C.player.halfWidth,zone?.start ?? C.player.halfWidth),
      right:Math.min(this.level.data.width-C.player.halfWidth,zone?.end ?? this.level.data.width,Math.max(origin.x,this.level.furthestPlayerX)),
      bottom:0,top:2400,
    },this.reviveAnchor);
    if(!point){this.revival.error="附近没有安全落点，请重试或重新开始";return false;}
    this.player.reviveAt(point.x,point.y,true); this.melee.cancel(this.player);
    for(const p of this.projectiles.items)p.active=false;
    for(const g of this.grenades.items)g.active=false;
    this.explosions.clearDamage();
    for(const e of this.spawner.enemies)e.recoverAfterRevive();
    this.hitStop=this.hitFlash=this.shakeTime=this.shakePower=this.weapon.flash=0;
    this.combo=this.comboTime=0;
    this.deathOrigin=undefined; this.revival.begin(); this.state="reviving";
    return true;
  }
  pause(): void {
    if (this.state === "playing" || this.state === "dying" || this.state === "reviving") {
      this.resumeState = this.state;
      this.state = "paused";
    }
  }
  resume(): void {
    if (this.state === "paused") this.state = this.resumeState;
  }
  update(dt: number, input: InputFrame): void {
    if(this.state==="reviving") {
      if(this.revival.advance(dt))this.state="playing";
      return;
    }
    if(this.victory.active&&(this.state==="playing"||this.state==="complete")){
      this.updateVictory(dt);return;
    }
    if (this.state !== "playing" && this.state !== "dying") return;
    if(this.state==="playing" && this.player.alive) {
      this.anchorTime-=dt;
      if(this.anchorTime<=0){this.anchorTime=.2;if(this.player.grounded)this.reviveAnchor=landAnchor(this.player,this.level.solids) ?? this.reviveAnchor;}
    }
    if(this.state==="playing"&&input.switchWeapon)this.weapon.toggleKnife();
    if(this.state==="playing"&&input.melee&&this.weapon.id!=="knife")this.weapon.equip("knife");
    if(this.weaponRevision!==this.weapon.revision){this.melee.cancel(this.player);this.weaponRevision=this.weapon.revision;}
    this.time += dt;
    this.player.throwTime = Math.max(0, this.player.throwTime - dt);
    this.explosions.advance(dt);
    this.shakeTime = Math.max(0, this.shakeTime - dt);
    this.comboTime = Math.max(0, this.comboTime - dt);
    if (this.comboTime === 0) this.combo = 0;
    this.hitFlash = Math.max(0, this.hitFlash - dt);
    const health = this.player.health;
    this.level.updateWorld(dt, this.player, this.spawner.enemies);
    const grounded = this.player.grounded;
    const jumpSerial = this.player.jumpSerial;
    this.level.objects.update(dt, this.level.solids);
    this.level.objects.flushHits();
    this.level.refreshSolids();
    this.player.update(dt, input, this.level);
    if (this.player.jumpSerial !== jumpSerial && this.player.jumpCount === 2)
      for (let n = 0; n < 7; n++)
        this.particles.emit(
          this.player.x + (n - 3) * 5,
          this.player.y + 3,
          "dust",
          (n - 3) * 45,
          -25,
        );
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
    const oldMeleeHits = this.melee.hits;
    const slashing = this.melee.update(dt, this.player, this.spawner.enemies, this.level.solids,
      this.state === "playing" && input.shoot, this.state === "playing" && !!input.melee, this.particles,this.level,this.level.objects.objects,Math.abs(input.aimY ?? 0)<.1);
    if (this.melee.hits > oldMeleeHits) {
      // A planted knife hit can pause briefly; moving quick cuts must not
      // repeatedly brake the runner while clearing cover or nearby enemies.
      if (Math.abs(input.axis) < .1 && this.player.grounded)
        this.hitStop = this.melee.stage===3?.065:.04;
      this.shakePower = this.melee.stage===3?6:3.5;this.shakeTime=this.melee.stage===3?.16:.10;
    }
    if (this.state === "playing" && input.shoot && this.player.alive && this.player.hitTime <= 0 && !slashing)
      this.weapon.fire(this.player, this.projectiles, "player");
    if (input.grenade && this.state === "playing")
      this.grenades.throw(this.player);
    this.grenades.update(dt, this.level, this.explosions);
    for (const enemy of this.spawner.enemies)
      enemy.update(dt, this.player, this.level, this.projectiles);
    const finalBoss = this.spawner.guard;
    if (finalBoss instanceof ColossusBoss) {
      if (finalBoss.mode === "entering" && !this.introEffectPlayed) {
        this.introEffectPlayed = true;
        this.shakeTime = 0.3;
        this.shakePower = 3;
      }
      if (finalBoss.impactSerial !== this.stompSerial) {
        this.stompSerial = finalBoss.impactSerial;
        this.shakeTime = 0.22;
        this.shakePower = 5;
        // A remote landing must not pause a healthy player's movement.
        // Actual player damage below retains its own short hit reaction.
      }
    }
    this.projectiles.update(
      dt,
      this.player,
      this.spawner.enemies,
      this.level.solids,
      (target) => {
        if ("state" in target) {
          // Enemy hit poses, recoil and particles carry ordinary gun impacts.
          // Freezing the entire scene on every bullet also froze locomotion.
          this.shakePower = Math.max(this.shakePower, 2.2);
          this.shakeTime = Math.max(this.shakeTime, 0.09);
        }
      },
      this.level.objects.objects,
    );
    this.level.objects.flushHits();
    for (const e of this.spawner.enemies)
      if (
        !e.alive &&
        (e.kind === "turret" ||
          (e.kind === "guard" && e !== this.spawner.guard)) &&
        !e.deathEffectPlayed
      ) {
        e.deathEffectPlayed = true;
        this.explosions.enqueue(e.x, e.y + 35, 85, 0, "player");
      }
    this.explosions.flush((x, y, radius, damage, owner) =>
      this.applyBlast(x, y, radius, damage, owner),
    );
    this.explosions.update(dt);
    for (const e of this.spawner.enemies) if (e.shieldBreakEvent) {
      const hit = e.shieldBreakEvent;
      this.particles.shieldBreak(hit.x, hit.y, hit.facing);
      e.shieldBreakEvent = undefined;
    }
    this.level.refreshSolids();
    const mini = this.spawner.miniBoss;
    // A single real pickup on the player's side, never inside the pursuing mech.
    // Retry a full pool; reset clears the claim together with the encounter.
    if (finalBoss instanceof ColossusBoss && finalBoss.active && finalBoss.alive &&
        finalBoss.phase === 2 && this.player.alive) {
      const side = Math.sign(this.player.x - finalBoss.x) || -finalBoss.facing;
      const x = clamp(finalBoss.x + side * (finalBoss.halfWidth + 140),
        this.level.retreatLimit + 40, this.level.data.width - 40);
      const y = Math.max(this.level.groundY(x), Math.min(finalBoss.y + 80, this.player.y + 60));
      if (this.pickups.offerBossSupply("colossus-half-rockets", x, y, "rocket")) {
        this.pickups.lastMessage = "装甲脱落 · 火箭补给 ×6";
        this.pickups.messageTime = 4;
      }
    }
    if (mini && !mini.alive) {
      this.pickups.offerBossRecovery("after-tank", mini.x, mini.y);
      this.spawner.releaseAfterMini();
    }
    this.pickups.offerRecovery(this.level.data.recoveryPoints ?? [], this.player);
    this.pickups.update(dt, this.player, this.weapon, this.level.solids);
    if(this.weaponRevision!==this.weapon.revision){this.melee.cancel(this.player);this.weaponRevision=this.weapon.revision;}
    const kills = this.spawner.kills;
    if (kills > this.lastKills) {
      this.combo += kills - this.lastKills;
      this.comboTime = 3;
      this.bestCombo = Math.max(this.bestCombo, this.combo);
      this.lastKills = kills;
    }
    this.particles.update(dt, this.level.solids);
    if (this.player.health < health) {
      this.hitFlash = .22;
      this.hitStop = Math.max(this.hitStop,.055);
      this.shakeTime = Math.max(this.shakeTime,.18);
      this.shakePower = Math.max(this.shakePower,5);
      this.particles.impact(this.player.x,this.player.y+38,"enemy");
    }
    if (!this.spawner.guard.alive && !this.bossDeathStarted) {
      this.bossDeathStarted = true;
      if (this.level.data.arena && finalBoss instanceof ColossusBoss && this.player.alive) {
        this.victory.start();this.melee.cancel(this.player);
        this.player.vx=0;this.player.recoil=this.player.hitTime=this.player.invincible=this.player.throwTime=0;
        this.hitStop=0;
        this.weapon.flash=0;
        for(const p of this.projectiles.items)p.active=false;
        for(const g of this.grenades.items)g.active=false;
      } else if (this.level.data.arena) {
        for (let n = 0; n < 5; n++)
          this.explosions.enqueue(
            this.spawner.guard.x + (n - 2) * 35,
            this.spawner.guard.y + 35 + (n % 3) * 70,
            130,
            0,
            "player",
            'boss',
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
      if(!this.deathOrigin)this.deathOrigin={x:this.player.x,y:this.player.y};
      this.state = "dying";
      if (this.player.deadTime >= C.player.deathDuration)
        this.state = "gameover";
    } else if (!this.victory.active && this.level.reachedExit(this.player.x)) this.state = "complete";
    this.camera.update(
      this.player.x,
      dt,
      this.level.data.width,
      this.player.facing,
      this.player.y,
      this.level.retreatLimit > 0 ? this.level.retreatLimit : undefined,
    );
  }
  private updateVictory(dt:number):void {
    const boss=this.spawner.guard;
    this.shakeTime=Math.max(0,this.shakeTime-dt);
    this.hitFlash=0;this.hitStop=0;
    this.level.updateWorld(dt,this.player,this.spawner.enemies);
    this.player.update(dt,{axis:0,jump:false,shoot:false},this.level);
    this.player.vx=0;this.player.facing=1;
    this.player.hitTime=this.player.invincible=this.player.recoil=0;
    this.weapon.update(dt);
    this.explosions.advance(dt);this.explosions.update(dt);
    for(const event of this.victory.advance(dt)){
      this.explosions.enqueue(boss.x+event.x,boss.y+event.y,event.radius,0,"player","boss");
      this.shakePower=event.shake;this.shakeTime=event.haptic==="heavy"?.42:.25;
    }
    // After victory, pending impacts are purely visual and cannot damage the
    // hero, alter the clear time, or keep spawning enemy reinforcements.
    this.explosions.flush((x,y,radius)=>this.particles.blast(x,y,radius,this.level.groundY(x)));
    this.particles.update(dt,this.level.solids);
    boss.deadTime=Math.min(this.victory.time,2.4);boss.hitTime=boss.recoil=0;
    this.player.celebrationTime=this.victory.cheerTime;
    this.level.guardDefeated=this.victory.time>=1.6;
    if(this.victory.phase==="settlement")this.state="complete";
  }
  snapshot() {
    return {
      state: this.state,
      revival: this.revival.snapshot(),
      time: this.time,
      player: {
        x: this.player.x,
        y: this.player.y,
        vx: this.player.vx,
        vy: this.player.vy,
        health: this.player.health,
        invincible: this.player.invincible,
        grounded: this.player.grounded,
        facing: this.player.facing,
        animation: this.player.animation,
        crouched: this.player.crouched,
        hitTime: this.player.hitTime,
        meleeActive: this.player.meleeActive,
        aimPitch: this.player.aimPitch,
        airJumpsRemaining: this.player.airJumpsRemaining,
        jumpCount: this.player.jumpCount,
        canJump: this.player.canJump,
        canDropThrough: this.level.dropSurfaces(this.player).length > 0,
        dropCount: this.player.dropCount,
      },
      cameraX: this.camera.x,
      kills: this.spawner.kills,
      melee: { swings: this.melee.swings, hits: this.melee.hits, time: this.melee.time, stage:this.melee.stage,
        state:this.melee.state,action:this.melee.action,stance:this.melee.stance,comboRemaining:this.melee.comboRemaining,heavyHits:this.melee.heavyHits,blockedHits:this.melee.blockedHits,crateProtection:this.melee.protectingCrateAmmo },
      weapon: this.weapon.id,
      weaponPresentation: this.weapon.presentation,
      weaponShot:{x:this.weapon.flashX,y:this.weapon.flashY,pitch:this.weapon.flashPitch,flash:this.weapon.flash},
      playerWeapon: this.player.weaponId,
      ammo: this.weapon.ammo,
      grenades: this.player.grenades,
      grenadesThrown: this.grenades.thrown,
      destroyedObjects: this.level.objects.destroyed,
      explosions: this.explosions.total,
      feedback: {
        shakeTime: this.shakeTime,
        shakePower: this.shakePower,
        hitStop: this.hitStop,
        hitFlash: this.hitFlash,
        blasts: this.explosions.items
          .filter((b) => b.active)
          .map((b) => ({
            x: b.x,
            y: b.y,
            age: b.age,
            radius: b.radius,
            style: b.style,
          })),
        particles: this.particles.items
          .filter((p) => p.active)
          .map((p) => ({ kind: p.kind, material: p.material, x: p.x, y: p.y, vx: p.vx, vy: p.vy,
            ...(p.kind === "sandbag" ? {fragment:p.fragment,scale:p.size,life:p.life} : {}) })),
        peakParticles: this.particles.peak,
        droppedParticles: this.particles.dropped,
      },
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
        falling: o.falling,
        vy: o.vy,
        deadTime: o.deadTime,
      })),
      pickups: this.pickups.items
        .filter((p) => p.active)
        .map((p) => ({ kind: p.kind, x: p.x, y: p.y, vy: p.vy, sourceId:p.sourceId })),
      recoveryPoints: this.level.data.recoveryPoints ?? [],
      recoverySpawned: this.pickups.recoveryIds,
      pendingEnemies: this.spawner.pendingCount,
      victory: this.victory.snapshot(),
      projectileStates: this.projectiles.items
        .filter((p) => p.active)
        .map((p) => ({
          owner: p.owner,
          kind: p.kind,
          x: p.x,
          y: p.y,
          vx: p.vx,
          vy: p.vy,
          homing: p.homing,
          locked: !!p.target?.alive,
          age:p.age,
          visual:p.visual,
          tier:p.tier??'standard',
          gravity:p.gravity,
        })),
      remaining: this.spawner.remaining,
      guardHealth: this.spawner.guard.health,
      boss: {
        x: this.spawner.guard.x,
        y: this.spawner.guard.y,
        vy:this.spawner.guard.vy,
        grounded:this.spawner.guard.grounded,
        jumpCount:this.spawner.guard.jumpCount,
        halfWidth:this.spawner.guard.halfWidth,
        height:this.spawner.guard.height,
        maxHealth:this.spawner.guard.maxHealth,
        chargeEndX:this.spawner.guard instanceof ColossusBoss?this.spawner.guard.chargeEndX:0,
        leapTargetX:this.spawner.guard instanceof ColossusBoss?this.spawner.guard.leapTargetX:0,
        warningPoints:this.spawner.guard instanceof ColossusBoss?this.spawner.guard.warningPoints.map(p=>({...p})):[],
        vx: this.spawner.guard.vx,
        stride: this.spawner.guard.stride,
        movementTurns: this.spawner.guard instanceof ColossusBoss ? this.spawner.guard.movementTurns : 0,
        kind: this.spawner.guard.kind,
        name:
          this.spawner.guard.kind === "colossus" ? "重装裁决者" : "履带战车",
        attack:
          this.spawner.guard instanceof ColossusBoss
            ? this.spawner.guard.attack
            : "salvo",
        introTime:
          this.spawner.guard instanceof ColossusBoss
            ? this.spawner.guard.introTime
            : 0,
        phase: this.spawner.guard.phase,
        active: this.spawner.guard.active,
        mode: this.spawner.guard.mode,
        warningX: this.spawner.guard.warningX,
        warningTargetY: this.spawner.guard.warningTargetY,
        muzzle: this.spawner.guard instanceof ColossusBoss ? { ...this.spawner.guard.muzzle } : null,
        warningTime: this.spawner.guard.warningTime,
        windup: this.spawner.guard.windup,
        summons: this.spawner.guard.summons,
        beam:this.spawner.guard instanceof ColossusBoss?{active:this.spawner.guard.beam.active,time:this.spawner.guard.beam.time,x:this.spawner.guard.beam.x,y:this.spawner.guard.beam.y,endX:this.spawner.guard.beam.endX,endY:this.spawner.guard.beam.endY,length:this.spawner.guard.beam.length,angle:this.spawner.guard.beam.angle,hits:this.spawner.guard.beam.hits}:null,
        attackCounts:this.spawner.guard instanceof ColossusBoss?this.spawner.guard.attackCounts:null,
      },
      miniBoss: this.spawner.miniBoss
        ? {
            x: this.spawner.miniBoss.x,
            y: this.spawner.miniBoss.y,
            vx: this.spawner.miniBoss.vx,
            vy: this.spawner.miniBoss.vy,
            grounded: this.spawner.miniBoss.grounded,
            jumpCount: this.spawner.miniBoss.jumpCount,
            mode: this.spawner.miniBoss.mode,
            windup: this.spawner.miniBoss.windup,
            ramEndX: this.spawner.miniBoss.ramEndX,
            movementTurns: this.spawner.miniBoss.movementTurns,
            moveTargetX: this.spawner.miniBoss.moveTargetX,
            attackCounts: { ...this.spawner.miniBoss.attackCounts },
            muzzle: { ...this.spawner.miniBoss.muzzle },
            health: this.spawner.miniBoss.health,
            maxHealth: this.spawner.miniBoss.maxHealth,
            active: this.spawner.miniBoss.active,
            phase: this.spawner.miniBoss.phase,
            warningX: this.spawner.miniBoss.warningX,
            warningTime: this.spawner.miniBoss.warningTime,
            attack: this.spawner.miniBoss.attack,
            warningPoints: this.spawner.miniBoss.warningPoints.map(p => ({ ...p })),
          }
        : null,
      levelWidth: this.level.data.width,
      exitX: this.level.data.exit.x,
      arena: this.level.data.arena ? { ...this.level.data.arena } : null,
      arenaEntered: this.level.arenaEntered,
      bossFraming: this.bossFraming,
      progression: {
        furthestX: this.level.furthestPlayerX,
        retreatLimit: this.level.retreatLimit,
        retreatDistance: C.progression.retreatDistance,
      },
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
        minY: m.data.minY,
        maxY: m.data.maxY,
      })),
      terrain: this.level.solids.map((r) => ({
        x: r.x,
        y: r.y,
        w: r.w,
        h: r.h,
        kind: r.kind,
        slope: r.slope,
        entityId: r.entityId,
        supported: r.supported,
        oneWay: !!r.oneWay,
        supportFor: r.supportFor,
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
        grounded:e.grounded,
        jumpCount:e.jumpCount,
        health: e.health,
        maxHealth: e.maxHealth,
        state: e.state,
        kind: e.kind,
        shield: e.shieldHealth,
        shieldBreakCount: e.shieldBreakCount,
        windup: e.windup,
        action: e.action,
      })),
    };
  }
  private objectHit(o: DestructibleObject, destroyed: boolean): void {
    if (o.kind === "sandbag") this.particles.sandbags(o.bounds, o.hitDirection, destroyed);
    else this.particles.burst(
      o.x + o.w / 2,
      o.y + o.h / 2,
      destroyed ? 16 : 5,
      o.kind === "wood" || o.kind === "hanging" ? "wood" : "spark",
    );
    if (o.kind === "wood" || o.kind === "hanging")
      for (const p of this.particles.items)
        if (
          p.active &&
          p.kind === "wood" &&
          p.x === o.x + o.w / 2 &&
          p.y === o.y + o.h / 2
        )
          p.vx = o.hitDirection * (80 + Math.abs(p.vx) * 0.8);
    if (destroyed) {
      if (o.kind === "barrel")
        this.explosions.schedule(
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
    this.particles.blast(x, y, radius, this.level.groundY(x));
    this.shakeTime = Math.max(this.shakeTime, 0.28);
    this.shakePower = Math.max(this.shakePower, 7);
    // Distant/chain explosions must not stop unrelated walking. Damage to the
    // player still gets its own short reaction in update().
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
              (damage >= 9 &&
              ((e.kind === "guard" && e !== this.spawner.miniBoss) ||
                e.kind === "turret" ||
                e.kind === "colossus")
                ? 1.5
                : 1),
          )
        ) {
          // Heavy bosses own their movement commitments. Explosion damage
          // still applies, but infantry launch impulses must not lift a tank.
          if(e.kind !== "guard" && e.kind !== "colossus") {
            e.vx = (e.x > x ? 1 : -1) * 250;
            e.vy = 380;
            e.grounded = false;
          }
        }
    for (const o of this.level.objects.objects) hit(o, damage);
    this.level.objects.flushHits();
  }
}

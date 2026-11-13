import { AudioClip, AudioSource, Node, resources, assetManager } from "cc";
import { GameSession } from "../core/GameSession";
import { OceanSession } from "../ocean/OceanSession";
import type { FlightSession } from "../flight/FlightSession";
type Effect =
  | "sonar"
  | "water-blast"
  | "knife"
  | "melee-hit"
  | "rifle"
  | "shotgun"
  | "rocket"
  | "blast"
  | "hit"
  | "step"
  | "pickup";
/** Cocos owns playback on Web and WeChat. No browser audio API in game code. */
export class AudioBridge {
  private source: AudioSource;
  private clips = new Map<Effect, AudioClip>();
  private destroyed = false;
  private shots = 0;
  private swings = 0;
  private meleeHits = 0;
  private explosions = 0;
  private health = 5;
  private pickups = 0;
  private stepAt = 0;
  private oceanHits=0;
  private oceanHitAt=-1;
  muted = false;
  played = 0;
  private playedByEffect: Partial<Record<Effect, number>> = {};
  loadErrors: string[] = [];
  constructor(parent: Node) {
    this.source = parent.addComponent(AudioSource);
  }
  /** A new run/chapter must not inherit event serials from the previous session. */
  reset(): void {
    this.shots = this.swings = this.meleeHits = this.explosions = this.pickups = 0;
    this.health = 5;
    this.stepAt = this.oceanHits = 0;
    this.oceanHitAt = -1;
  }
  async load(): Promise<void> {
    await Promise.all(
      (
        [
          "knife",
          "melee-hit",
          "rifle",
          "shotgun",
          "rocket",
          "blast",
          "hit",
          "step",
          "pickup",
        ] as Effect[]
      ).map(
        (name) =>
          new Promise<void>((resolve) => {
            resources.load(`audio/${name}`, AudioClip, (error, clip) => {
              if (error) {
                this.loadErrors.push(name);
                console.warn(
                  "[Breakout] Audio unavailable",
                  name,
                  error.message,
                );
              } else if (this.destroyed) assetManager.releaseAsset(clip);
              else this.clips.set(name, clip);
              resolve();
            });
          }),
      ),
    );
  }
  play(name: Effect): void {
    const clip = this.clips.get(name);
    if (this.muted || !clip || this.destroyed) return;
    this.source.playOneShot(
      clip,
      name === "step" ? 0.17 : name === "water-blast" ? .52 : name === "blast" ? 0.4 : 0.32,
    );
    this.played++;
    this.playedByEffect[name] = (this.playedByEffect[name] ?? 0) + 1;
  }
  update(s: GameSession): void {
    if (s.state === "playing" || s.state === "dying") {
      if (s.weapon.shots > this.shots) this.play(s.weapon.lastShot);
      if (s.melee.swings > this.swings) this.play("knife");
      if (s.melee.hits > this.meleeHits) this.play("melee-hit");
      if (s.explosions.total > this.explosions) this.play("blast");
      if (s.player.health < this.health) this.play("hit");
      if (s.pickups.collected > this.pickups) this.play("pickup");
      if (
        s.player.grounded &&
        Math.abs(s.player.vx) > 25 &&
        s.time - this.stepAt > Math.min(0.4, 56 / Math.abs(s.player.vx))
      ) {
        this.stepAt = s.time;
        this.play("step");
      }
    }
    this.shots = s.weapon.shots;
    this.swings = s.melee.swings;
    this.meleeHits = s.melee.hits;
    this.explosions = s.explosions.total;
    this.health = s.player.health;
    this.pickups = s.pickups.collected;
    if (s.time < this.stepAt) this.stepAt = s.time;
  }
  async loadOcean(): Promise<void> {
    const bundle = assetManager.getBundle("level02");
    if (!bundle) return;
    await Promise.all(
      (["sonar", "water-blast"] as Effect[]).map(
        (name) =>
          new Promise<void>((resolve) => {
            if (this.clips.has(name)) {
              resolve();
              return;
            }
            bundle.load(name, AudioClip, (error, clip) => {
              if (error) this.loadErrors.push(name);
              else if (this.destroyed) assetManager.releaseAsset(clip);
              else this.clips.set(name, clip);
              resolve();
            });
          }),
      ),
    );
    this.reset();
  }
  updateOcean(s: OceanSession): void {
    if(s.time<this.oceanHitAt){this.oceanHitAt=-1;this.oceanHits=0;}
    if (s.state === "playing" || s.state === "dying" || (s.state === "complete" && s.victory.active)) {
      if (s.shots > this.shots) this.play(s.lastShotWeapon === "harpoon" ? "rifle" : s.lastShotWeapon === "torpedo" ? "rocket" : "sonar");
      if (s.knifeSerial > this.swings) this.play("knife");
      if(s.hits>this.oceanHits&&s.time-this.oceanHitAt>.12){this.play("melee-hit");this.oceanHitAt=s.time;}
      if (
        s.blastCount > this.explosions ||
        (s.victory.active && s.victory.impactSerial > this.meleeHits)
      )
        this.play("water-blast");
      if (s.player.health < this.health) this.play("hit");
      if (s.collected > this.pickups) this.play("pickup");
    }
    this.shots = s.shots;
    this.swings = s.knifeSerial;
    this.explosions = s.blastCount;
    this.health = s.player.health;
    this.pickups = s.collected;
    this.meleeHits = s.victory.impactSerial;
    this.oceanHits=s.hits;
  }
  updateFlight(s: FlightSession): void {
    if (s.time < this.oceanHitAt) { this.oceanHitAt = -1; this.oceanHits = 0; }
    if (s.state === "playing" || s.state === "dying" || (s.state === "complete" && s.victory.active)) {
      if (s.shots > this.shots) this.play(s.lastShotWeapon);
      if (s.knifeSerial > this.swings) this.play("knife");
      if (s.hits > this.oceanHits && s.time - this.oceanHitAt > .12) {
        this.play("melee-hit");
        this.oceanHitAt = s.time;
      }
      if (s.blastCount > this.explosions) this.play("blast");
      if (s.player.health < this.health) this.play("hit");
      if (s.collected > this.pickups) this.play("pickup");
    }
    this.shots = s.shots;
    this.swings = s.knifeSerial;
    this.explosions = s.blastCount;
    this.health = s.player.health;
    this.pickups = s.collected;
    this.meleeHits = s.victory.impactSerial;
    this.oceanHits = s.hits;
  }
  releaseOcean(): void {
    if (this.source.isValid) this.source.stop();
    for (const name of ["sonar", "water-blast"] as const) {
      const clip = this.clips.get(name);
      if (clip) assetManager.releaseAsset(clip);
      this.clips.delete(name);
    }
    this.reset();
  }
  status() {
    return {
      loaded: this.clips.size,
      played: this.played,
      byEffect: { ...this.playedByEffect },
      muted: this.muted,
      loadErrors: this.loadErrors,
    };
  }
  destroy(): void {
    this.destroyed = true;
    if (this.source.isValid) this.source.stop();
    for (const clip of this.clips.values()) assetManager.releaseAsset(clip);
    this.clips.clear();
  }
}

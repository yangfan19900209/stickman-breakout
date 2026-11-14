import { AudioClip, AudioSource, Node, resources, assetManager } from "cc";
import { GameSession } from "../core/GameSession";
import { OceanSession } from "../ocean/OceanSession";
import type { FlightSession } from "../flight/FlightSession";
import { MusicBridge } from "./MusicBridge";
import { CombatAudioEvents, CombatSound } from "../combat/CombatAudioEvents";
type Effect = CombatSound
  | "sonar"
  | "water-blast"
  | "knife"
  | "melee-hit"
  | "rifle"
  | "shotgun"
  | "rocket"
  | "blast"
  | "hit"
  | "pickup";
const COMBAT_VOLUME: Record<CombatSound, number> = {
  "enemy-shot": .24, "boss-shot": .34, rocket: .42, cannon: .4,
  beam: .32, slam: .44, charge: .34, "enemy-melee": .26,
  "enemy-sonar": .3, "rocket-blast": .48,
};
const COMBAT_PRIORITY: Record<CombatSound, number> = {
  beam: 5, slam: 5, "rocket-blast": 5, cannon: 4, rocket: 4,
  charge: 3, "boss-shot": 3, "enemy-sonar": 2, "enemy-melee": 2, "enemy-shot": 1,
};
/** Cocos owns playback on Web and WeChat. No browser audio API in game code. */
export class AudioBridge {
  readonly music: MusicBridge;
  private source: AudioSource;
  private clips = new Map<Effect, AudioClip>();
  private destroyed = false;
  private shots = 0;
  private swings = 0;
  private meleeHits = 0;
  private explosions = 0;
  private heavyExplosions = 0;
  private attackSource?: CombatAudioEvents;
  private attackTime = -1;
  private attackPlayedAt = new Map<CombatSound, number>();
  private health = 5;
  private pickups = 0;
  private oceanHits=0;
  private oceanHitAt=-1;
  private silent = false;
  get muted(): boolean { return this.silent; }
  set muted(value: boolean) { this.silent = value; this.music.muted = value; }
  played = 0;
  private playedByEffect: Partial<Record<Effect, number>> = {};
  loadErrors: string[] = [];
  constructor(parent: Node) {
    this.source = parent.addComponent(AudioSource);
    this.music = new MusicBridge(parent);
  }
  /** A new run/chapter must not inherit event serials from the previous session. */
  reset(): void {
    this.shots = this.swings = this.meleeHits = this.explosions = this.pickups = 0;
    this.heavyExplosions = 0;
    this.attackSource?.reset();
    this.attackSource = undefined;
    this.attackTime = -1;
    this.attackPlayedAt.clear();
    this.health = 5;
    this.oceanHits = 0;
    this.oceanHitAt = -1;
    this.music.reset();
  }
  async load(): Promise<void> {
    this.music.prepare("turkish-march");
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
          "pickup",
          "enemy-shot", "boss-shot", "cannon", "beam", "slam", "charge",
          "enemy-melee", "enemy-sonar", "rocket-blast",
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
  play(name: Effect, gain = 1): void {
    const clip = this.clips.get(name);
    if (this.muted || !clip || this.destroyed) return;
    this.source.playOneShot(
      clip,
      (COMBAT_VOLUME[name as CombatSound] ?? (name === "water-blast" ? .52 : name === "blast" ? .4 : .32)) * gain,
    );
    this.played++;
    this.playedByEffect[name] = (this.playedByEffect[name] ?? 0) + 1;
  }
  update(s: GameSession): void {
    this.consumeCombat(s.projectiles.audio, s);
    if (s.state === "playing" || s.state === "dying") {
      if (s.weapon.shots > this.shots) this.play(s.weapon.lastShot);
      if (s.melee.swings > this.swings) this.play("knife");
      if (s.melee.hits > this.meleeHits) this.play("melee-hit");
      const heavy = s.explosions.heavyTotal - this.heavyExplosions;
      if (heavy > 0) this.play("rocket-blast");
      if (s.explosions.total - this.explosions > Math.max(0, heavy)) this.play("blast");
      if (s.player.health < this.health) this.play("hit");
      if (s.pickups.collected > this.pickups) this.play("pickup");
    }
    this.shots = s.weapon.shots;
    this.swings = s.melee.swings;
    this.meleeHits = s.melee.hits;
    this.explosions = s.explosions.total;
    this.heavyExplosions = s.explosions.heavyTotal;
    this.health = s.player.health;
    this.pickups = s.pickups.collected;
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
    this.consumeCombat(s.attackAudio, s);
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
    this.consumeCombat(s.projectiles.audio, s);
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
  private consumeCombat(events: CombatAudioEvents, s: { time: number; state: string; player: { x: number; y: number } }): void {
    if (this.attackSource !== events || s.time < this.attackTime) this.attackPlayedAt.clear();
    this.attackSource = events;
    this.attackTime = s.time;
    const pending = events.drain();
    // Consume even while muted/paused/loading, so returning never replays old attacks.
    if (this.destroyed || this.muted || (s.state !== "playing" && s.state !== "dying")) return;
    const audible = new Map<CombatSound, number>();
    for (const event of pending) {
      const distance = Math.hypot(event.x - s.player.x, event.y - s.player.y - 40);
      if (distance > 1600) continue;
      const gain = 1 / (1 + distance / 800);
      audible.set(event.sound, Math.max(gain, audible.get(event.sound) ?? 0));
    }
    let voices = 0;
    // One voice per attack family, with heavy tells above ordinary gunfire.
    for (const [sound, gain] of [...audible].sort((a, b) => COMBAT_PRIORITY[b[0]] - COMBAT_PRIORITY[a[0]])) {
      const gap = sound === "enemy-shot" || sound === "boss-shot" ? .075 : .12;
      if (s.time - (this.attackPlayedAt.get(sound) ?? -Infinity) < gap) continue;
      this.play(sound, gain);
      this.attackPlayedAt.set(sound, s.time);
      if (++voices === 4) break;
    }
  }
  status() {
    return {
      loaded: this.clips.size,
      played: this.played,
      byEffect: { ...this.playedByEffect },
      muted: this.muted,
      music: this.music.status(),
      loadErrors: this.loadErrors,
    };
  }
  destroy(): void {
    this.destroyed = true;
    this.attackSource?.reset();
    this.music.destroy();
    if (this.source.isValid) this.source.stop();
    for (const clip of this.clips.values()) assetManager.releaseAsset(clip);
    this.clips.clear();
  }
}

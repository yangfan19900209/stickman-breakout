import { AudioClip, AudioSource, Node, resources, assetManager } from "cc";
import { GameSession } from "../core/GameSession";
type Effect =
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
  private explosions = 0;
  private health = 5;
  private pickups = 0;
  private stepAt = 0;
  muted = false;
  played = 0;
  loadErrors: string[] = [];
  constructor(parent: Node) {
    this.source = parent.addComponent(AudioSource);
  }
  async load(): Promise<void> {
    await Promise.all(
      (
        [
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
      name === "step" ? 0.17 : name === "blast" ? 0.4 : 0.32,
    );
    this.played++;
  }
  update(s: GameSession): void {
    if (s.state === "playing" || s.state === "dying") {
      if (s.weapon.shots > this.shots) this.play(s.weapon.id);
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
    this.explosions = s.explosions.total;
    this.health = s.player.health;
    this.pickups = s.pickups.collected;
    if (s.time < this.stepAt) this.stepAt = s.time;
  }
  status() {
    return {
      loaded: this.clips.size,
      played: this.played,
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

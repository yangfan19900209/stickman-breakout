import { AudioClip, AudioSource, Node, assetManager, AssetManager } from "cc";
import type { MusicCue, MusicTheme, MusicTempo } from "./MusicCue";

type MusicKey = `${MusicTheme}-${MusicTempo}bpm`;
interface Voice { source: AudioSource; key?: MusicKey; gain: number; running: boolean }
const VOLUME = 0.27;
const FADE_SECONDS = 0.28;
const keyFor = (theme: MusicTheme, tempo: MusicTempo): MusicKey => `${theme}-${tempo}bpm`;
const tempoOf = (key: MusicKey): MusicTempo => key.endsWith("120bpm") ? 120 : 80;

/** Two controlled Cocos sources for music. One-shot combat effects stay independent. */
export class MusicBridge {
  private voices: Voice[];
  private target?: Voice;
  private clips = new Map<MusicKey, AudioClip>();
  private pending = new Map<MusicKey, Promise<void>>();
  private failed = new Set<MusicKey>();
  private bundle?: Promise<AssetManager.Bundle>;
  private theme?: MusicTheme;
  private cue?: MusicCue;
  private blocked = false;
  private silent = false;
  private destroyed = false;
  private starts = 0;
  readonly loadErrors: string[] = [];

  constructor(parent: Node) {
    this.voices = [0, 1].map(() => {
      const source = parent.addComponent(AudioSource);
      source.playOnAwake = false;
      source.loop = true;
      source.volume = 0;
      return { source, gain: 0, running: false };
    });
  }

  set muted(value: boolean) { this.silent = value; this.sync(); }

  prepare(theme: MusicTheme): void {
    if (this.destroyed) return;
    if (theme !== this.theme) {
      this.stop();
      this.theme = theme;
      for (const clip of this.clips.values()) clip.decRef();
      this.clips.clear();
    }
    for (const tempo of [80, 120] as const) {
      const key = keyFor(theme, tempo);
      if (this.clips.has(key) || this.pending.has(key) || this.failed.has(key)) continue;
      const task = this.loadBundle().then(bundle => {
        if (this.destroyed || theme !== this.theme) return;
        return new Promise<void>((resolve, reject) => {
          bundle.load(key, AudioClip, (error, clip) => {
            if (error) { reject(error); return; }
            // Exactly one pending request per key. Retain only the active chapter's clips.
            clip.addRef();
            if (this.destroyed || theme !== this.theme) clip.decRef();
            else { this.clips.set(key, clip); this.sync(); }
            resolve();
          });
        });
      }).catch(error => {
        if (this.destroyed) return;
        this.failed.add(key);
        this.loadErrors.push(`${key}: ${String(error?.message ?? error)}`);
        console.warn("[Breakout] Music unavailable", key, error);
      }).finally(() => { this.pending.delete(key); });
      this.pending.set(key, task);
    }
  }

  private loadBundle(): Promise<AssetManager.Bundle> {
    if (!this.bundle) {
      const cached = assetManager.getBundle("bgm");
      this.bundle = cached ? Promise.resolve(cached) : new Promise((resolve, reject) => {
        assetManager.loadBundle("bgm", (error, bundle) => error ? reject(error) : resolve(bundle));
      });
    }
    return this.bundle;
  }

  update(cue: MusicCue, blocked: boolean, dt = 0): void {
    if (this.destroyed) return;
    this.cue = cue;
    this.blocked = blocked;
    this.prepare(cue.theme);
    this.sync();
    if (!this.canPlay()) return;
    const step = Math.min(Math.max(dt, 0), 0.1) / FADE_SECONDS;
    for (const voice of this.voices) {
      if (!voice.key) continue;
      const goal = voice === this.target ? 1 : 0;
      voice.gain += Math.max(-step, Math.min(step, goal - voice.gain));
      voice.source.volume = VOLUME * voice.gain;
      if (voice !== this.target && voice.gain <= 0) this.stopVoice(voice);
    }
  }

  private canPlay(): boolean {
    return !this.destroyed && !this.blocked && !this.silent && this.cue?.mode === "playing";
  }

  private sync(): void {
    if (this.destroyed) return;
    if (!this.cue || this.cue.mode === "stopped") { this.stop(); return; }
    if (!this.canPlay()) {
      for (const voice of this.voices) {
        // The host may auto-resume on foreground; keep a player-owned pause authoritative.
        if (voice.running || voice.source.playing) voice.source.pause();
        voice.running = false;
      }
      return;
    }
    const key = keyFor(this.cue.theme, this.cue.tempo), clip = this.clips.get(key);
    if (clip && !this.failed.has(key) && this.target?.key !== key) {
      let next = this.voices.find(v => v.key === key);
      if (!next) {
        next = this.voices.find(v => v !== this.target)!;
        const previous = this.target;
        // Preserve musical beat position when changing tempo instead of changing pitch.
        const beat = previous?.key ? previous.source.currentTime * tempoOf(previous.key) / 60 : 0;
        this.stopVoice(next);
        next.source.clip = clip;
        next.source.loop = true;
        next.source.currentTime = (beat % 64) * 60 / this.cue.tempo;
        next.key = key;
      }
      this.target = next;
    }
    for (const voice of this.voices) {
      if (!voice.key || voice.running) continue;
      try {
        voice.source.play();
        voice.running = true;
        this.starts++;
      } catch (error) {
        this.failed.add(voice.key);
        this.loadErrors.push(`${voice.key}: ${String(error)}`);
        this.stopVoice(voice);
        if (this.target === voice) this.target = undefined;
      }
    }
  }

  private stopVoice(voice: Voice): void {
    if (voice.key || voice.source.clip) {
      voice.source.stop();
      voice.source.clip = null;
    }
    voice.source.volume = 0;
    voice.key = undefined;
    voice.running = false;
    voice.gain = 0;
  }

  private stop(): void {
    for (const voice of this.voices) this.stopVoice(voice);
    this.target = undefined;
  }

  reset(): void {
    this.stop();
    this.cue = undefined;
    // User-initiated restart is the retry boundary, never a per-frame retry loop.
    if (this.failed.size) { this.failed.clear(); this.bundle = undefined; }
  }

  status() {
    return { theme: this.theme, requested: this.cue, track: this.target?.key ?? null,
      playing: this.voices.some(v => v.source.playing), blocked: this.blocked,
      muted: this.silent, loaded: this.clips.size, pending: this.pending.size,
      starts: this.starts, volume: VOLUME, loadErrors: [...this.loadErrors] };
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.stop();
    for (const clip of this.clips.values()) clip.decRef();
    this.clips.clear();
    for (const voice of this.voices) if (voice.source.isValid) voice.source.destroy();
  }
}

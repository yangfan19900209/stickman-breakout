export const REVIVAL_AD_UNIT_ID = "adunit-d647515c81ac9f11";
export type VideoState = "idle" | "loading" | "ready" | "opening" | "visible" | "error" | "unsupported" | "recovery";
export interface VideoResult { completed: boolean; message: string }
interface VideoError { errCode?: number; errMsg?: string }
interface VideoAd {
  load(): Promise<unknown>;
  show(): Promise<unknown>;
  destroy(): void;
  onLoad(listener: () => void): void;
  offLoad?(listener: () => void): void;
  onError(listener: (error: VideoError) => void): void;
  offError?(listener: (error: VideoError) => void): void;
  onClose(listener: (result?: { isEnded?: unknown }) => void): void;
  offClose?(listener: (result?: { isEnded?: unknown }) => void): void;
}
export interface RewardedVideoApi {
  getAppBaseInfo?(): { SDKVersion?: string };
  getSystemInfoSync?(): { SDKVersion?: string };
  createRewardedVideoAd?(options: { adUnitId: string; multiton: boolean; disableFallbackSharePage: boolean }): VideoAd;
}
interface Entry {
  ad: VideoAd;
  load: () => void;
  error: (error: VideoError) => void;
  close: (result?: { isEnded?: unknown }) => void;
  request?: { result: (result: VideoResult) => void; showCalled: boolean };
  invalidated?: VideoResult;
}
interface Timers { set(callback: () => void, milliseconds: number): unknown; clear(handle: unknown): void }

/** 3.7.1 supports disabling the native share fallback: this reward requires video completion. */
export function rewardedVideoSupported(version: unknown): boolean {
  if (typeof version !== "string" || !/^\d+\.\d+\.\d+$/.test(version)) return false;
  const parts = version.split(".").map(Number), minimum = [3, 7, 1];
  if (parts.some(part => !Number.isSafeInteger(part))) return false;
  for (let i = 0; i < 3; i++) if (parts[i] !== minimum[i]) return parts[i] > minimum[i];
  return true;
}

/** Preloads silently; only the active native onClose({isEnded:true}) awards one opportunity. */
export class RewardedVideoBridge {
  state: VideoState = "idle";
  message = "";
  onChange: () => void = () => {};
  onOpenRequest: () => void = () => {};
  private entry?: Entry;
  private timer?: unknown;
  private background = false;
  private disposed = false;
  private requests = 0;
  private completions = 0;
  private lastError?: { stage: string; code?: number; message: string };
  constructor(private readonly enabled: () => boolean,
    private readonly host: () => RewardedVideoApi | undefined = () => (globalThis as any).wx,
    private readonly timers: Timers = {
      set: (callback, milliseconds) => setTimeout(callback, milliseconds),
      clear: handle => clearTimeout(handle as ReturnType<typeof setTimeout>),
    }) {}
  get blocking(): boolean { return ["opening", "visible", "recovery"].includes(this.state); }
  private transition(state: VideoState, message = ""): void { this.state = state; this.message = message; this.onChange(); }
  private alive(entry: Entry): boolean { return !this.disposed && this.entry === entry; }
  private supported(): boolean {
    try {
      const api = this.host(), version = api?.getAppBaseInfo?.().SDKVersion ?? api?.getSystemInfoSync?.().SDKVersion;
      return this.enabled() && rewardedVideoSupported(version) && typeof api?.createRewardedVideoAd === "function";
    } catch { return false; }
  }
  private remember(stage: string, error?: VideoError): string {
    const code = typeof error?.errCode === "number" ? error.errCode : undefined;
    this.lastError = { stage, code, message: String(error?.errMsg ?? "").replace(/[\r\n\t]/g, " ").slice(0, 160) };
    return code === 1004 ? "暂时没有可播放的广告，请稍后重试"
      : code === 1005 ? "广告正在审核，暂时无法播放"
      : [1002, 1006, 1007, 1008].includes(code ?? 0) ? "广告暂不可用，请稍后重试"
      : "广告加载失败，请检查网络后重试";
  }
  private clearTimer(): void {
    if (this.timer !== undefined) this.timers.clear(this.timer);
    this.timer = undefined;
  }
  private detach(entry: Entry): void {
    if (this.entry === entry) { this.entry = undefined; this.clearTimer(); }
    try { entry.ad.offLoad?.(entry.load); } catch {}
    try { entry.ad.offError?.(entry.error); } catch {}
    try { entry.ad.offClose?.(entry.close); } catch {}
  }
  private finish(entry: Entry, result: VideoResult, destroy = true): void {
    if (!this.alive(entry)) return;
    const callback = entry.request?.result;
    this.detach(entry); // Invalidate before destroy: synchronous or duplicate closure cannot award again.
    if (destroy) { try { entry.ad.destroy(); } catch {} }
    if (result.completed) this.completions++;
    this.transition(result.completed ? "idle" : "error", result.message);
    callback?.(result);
  }
  private abort(entry: Entry, message: string): void {
    if (!this.alive(entry)) return;
    entry.invalidated = { completed: false, message }; this.clearTimer();
    try { entry.ad.destroy(); }
    catch {
      if (this.alive(entry)) this.transition("recovery", "广告暂时未能关闭，请重试返回");
      return;
    }
    if (this.alive(entry)) this.finish(entry, entry.invalidated, false);
  }
  private create(): Entry | undefined {
    let ad: VideoAd | undefined;
    try {
      ad = this.host()?.createRewardedVideoAd?.({ adUnitId: REVIVAL_AD_UNIT_ID, multiton: true, disableFallbackSharePage: true });
      if (!ad || ![ad.load, ad.show, ad.destroy, ad.onLoad, ad.onError, ad.onClose].every(fn => typeof fn === "function"))
        throw Error("Incomplete rewarded video API");
      const entry: Entry = { ad, load: () => {}, error: () => {}, close: () => {} };
      this.entry = entry;
      entry.load = () => {
        if (this.alive(entry) && !entry.request) { this.clearTimer(); this.transition("ready"); }
      };
      entry.error = error => {
        if (!this.alive(entry) || entry.invalidated) return;
        const message = this.remember(entry.request ? "playback" : "preload", error);
        // show/load promises drive the single retry. onError may arrive before their rejection.
        if (!entry.request) this.finish(entry, { completed: false, message });
        else if (this.state === "visible") this.abort(entry, message);
      };
      entry.close = result => {
        if (!this.alive(entry) || !entry.request) return;
        if (entry.invalidated) { this.finish(entry, entry.invalidated, false); return; }
        if (!entry.request.showCalled) return;
        const completed = result?.isEnded === true;
        this.finish(entry, { completed, message: completed ? "已获得 1 次原地复活机会"
          : result?.isEnded === false ? "完整看完视频才能获得复活机会，可重新观看" : "未确认视频完整播放，未发放复活机会" });
      };
      ad.onLoad(entry.load); ad.onClose(entry.close); ad.onError(entry.error);
      return this.alive(entry) ? entry : undefined;
    } catch (error) {
      if (this.entry && this.entry.ad === ad) this.detach(this.entry);
      try { ad?.destroy?.(); } catch {}
      this.remember("create", error as VideoError); return;
    }
  }
  preload(): void {
    if (this.disposed || this.background || this.entry || this.blocking || !this.supported()) return;
    const entry = this.create(); if (!entry) return;
    this.transition("loading");
    this.timer = this.timers.set(() => {
      if (this.alive(entry) && !entry.request) this.finish(entry, { completed: false, message: "广告预加载超时，请重试" });
    }, 10000);
    try {
      Promise.resolve(entry.ad.load()).then(entry.load, error => {
        if (this.alive(entry) && !entry.request) entry.error(error);
      });
    } catch (error) { entry.error(error as VideoError); }
  }
  request(onResult: (result: VideoResult) => void): void {
    if (this.disposed || this.blocking || this.background) return;
    if (!this.supported()) {
      const message = "当前环境不支持视频广告，请在新版微信中体验";
      this.transition("unsupported", message); onResult({ completed: false, message }); return;
    }
    const entry = this.entry ?? this.create();
    if (!entry) {
      const message = "广告暂时无法初始化，请稍后重试";
      this.transition("error", message); onResult({ completed: false, message }); return;
    }
    this.requests++; this.lastError = undefined; this.clearTimer();
    entry.request = { result: onResult, showCalled: false };
    this.onOpenRequest(); this.transition("opening", "完整看完视频，获得 1 次原地复活机会");
    this.timer = this.timers.set(() => this.abort(entry, "广告加载超时，请稍后重试"), 10000);
    this.show(entry, false);
  }
  private show(entry: Entry, retried: boolean): void {
    if (!this.alive(entry) || entry.invalidated || !entry.request) return;
    if (this.background) { this.abort(entry, "广告尚未打开，返回后可重新观看"); return; }
    entry.request.showCalled = true;
    const failed = (error: VideoError) => {
      if (!this.alive(entry) || entry.invalidated || !entry.request) return;
      entry.request.showCalled = false;
      const message = this.remember(retried ? "retry-show" : "show", error);
      if (retried) { this.abort(entry, message); return; }
      try {
        Promise.resolve(entry.ad.load()).then(() => this.show(entry, true), error => {
          if (this.alive(entry) && !entry.invalidated) this.abort(entry, this.remember("retry-load", error));
        });
      } catch (error) { this.abort(entry, this.remember("retry-load", error as VideoError)); }
    };
    try {
      Promise.resolve(entry.ad.show()).then(() => {
        if (this.alive(entry) && !entry.invalidated) { this.clearTimer(); this.transition("visible"); }
      }, failed);
    } catch (error) { failed(error as VideoError); }
  }
  cancel(): void {
    if (!this.entry || !["opening", "recovery"].includes(this.state)) return;
    this.abort(this.entry, "已取消观看，未消耗复活次数");
  }
  setBackground(value: boolean): void { this.background = value; } // Foreground is never completion evidence.
  snapshot() { return { state: this.state, blocking: this.blocking, adUnitId: REVIVAL_AD_UNIT_ID,
    requests: this.requests, completions: this.completions, lastError: this.lastError, message: this.message }; }
  destroy(): void {
    this.disposed = true;
    if (this.entry) { const entry = this.entry; this.detach(entry); try { entry.ad.destroy(); } catch {} }
    this.clearTimer(); this.onChange = this.onOpenRequest = () => {}; this.state = "idle";
  }
}

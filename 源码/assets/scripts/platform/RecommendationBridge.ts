/** Public WeChat recommendation component; this is not the star-rating editor. */
export const RECOMMENDATION_OPENLINK = "TWFRCqV5WeM2AkMXhKwJ03MhfPOieJfAsvXKUbWvQFQtLyyA5etMPabBehga950uzfZcH3Vi3QeEh41xRGEVFw";
export type RecommendationState = "idle" | "preloading" | "ready" | "opening" | "visible" | "unsupported" | "error" | "recovery";
type Event = "ready" | "show" | "destroy" | "error";
interface PageManager {
  load(options: { openlink: string }): Promise<unknown>;
  show(options?: { openlink: string }): Promise<unknown>;
  destroy(): void;
  on(event: Event, listener: (result?: any) => void): void;
  off?(event: Event, listener: (result?: any) => void): void;
}
export interface RecommendationApi {
  getAppBaseInfo?(): { SDKVersion?: string };
  getSystemInfoSync?(): { SDKVersion?: string };
  createPageManager?(): PageManager;
}
interface Entry {
  manager: PageManager;
  listeners: Partial<Record<Event, (result?: any) => void>>;
  loaded: boolean;
  requested: boolean;
  abandoned: boolean;
  onResult?: (recommended: boolean | null) => void;
}
interface Timers {
  set(callback: () => void, milliseconds: number): unknown;
  clear(handle: unknown): void;
}

export function recommendationVersionSupported(version: unknown): boolean {
  if (typeof version !== "string" || !/^\d+\.\d+\.\d+$/.test(version)) return false;
  const parts = version.split(".").map(Number), minimum = [3, 8, 6];
  if (parts.some(part => !Number.isSafeInteger(part))) return false;
  for (let i = 0; i < 3; i++) {
    if (parts[i] !== minimum[i]) return parts[i] > minimum[i];
  }
  return true;
}

/** Owns one native page lifetime. Only destroy's boolean is a recommendation observation. */
export class RecommendationBridge {
  onChange: () => void = () => {};
  onOpenRequest: () => void = () => {};
  onThanks: () => void = () => {};
  state: RecommendationState = "idle";
  private entry?: Entry;
  private timer?: unknown;
  private disposed = false;
  private background = false;
  private version = "";
  private requests = 0;
  private shows = 0;
  private closes = { recommended: 0, notRecommended: 0, unknown: 0 };
  private lastKnownRecommended: boolean | null = null;
  private lastError?: { stage: string; code?: number };
  private source: "home" | "revival" = "home";
  constructor(
    private readonly enabled: () => boolean,
    private readonly api: () => RecommendationApi | undefined = () => (globalThis as any).wx,
    private readonly timers: Timers = {
      set: (callback, milliseconds) => setTimeout(callback, milliseconds),
      clear: handle => clearTimeout(handle as ReturnType<typeof setTimeout>),
    },
  ) {}
  get blocking(): boolean { return !["idle", "preloading", "ready"].includes(this.state); }
  private transition(state: RecommendationState): void { this.state = state; this.onChange(); }
  private supported(): boolean {
    try {
      const api = this.api();
      this.version = api?.getAppBaseInfo?.().SDKVersion ?? api?.getSystemInfoSync?.().SDKVersion ?? "";
      return this.enabled() && recommendationVersionSupported(this.version) && typeof api?.createPageManager === "function";
    } catch { return false; }
  }
  private error(stage: string, error?: any): void {
    this.lastError = { stage, ...(typeof error?.errCode === "number" && Number.isFinite(error.errCode) ? { code: error.errCode } : {}) };
  }
  private create(): Entry | undefined {
    let manager: PageManager | undefined;
    try {
      manager = this.api()?.createPageManager?.();
      if (!manager || ![manager.load, manager.show, manager.destroy, manager.on].every(fn => typeof fn === "function"))
        throw Error("Incomplete PageManager");
      const entry: Entry = { manager, listeners: {}, loaded: false, requested: false, abandoned: false };
      this.entry = entry;
      const active = () => !this.disposed && this.entry === entry && !entry.abandoned;
      entry.listeners.ready = () => { /* load's Promise also has to settle before reuse. */ };
      entry.listeners.show = () => {
        if (!active() || !entry.requested || this.state !== "opening") return;
        this.clearTimer(); this.shows++; this.transition("visible");
      };
      entry.listeners.destroy = result => {
        if (this.disposed || this.entry !== entry) return;
        const observed = entry.requested && !entry.abandoned;
        const recommended = typeof result?.isRecommended === "boolean" ? result.isRecommended as boolean : null;
        this.detach(entry); this.transition("idle");
        if (!observed) return;
        this.lastKnownRecommended = recommended;
        this.closes[recommended === true ? "recommended" : recommended === false ? "notRecommended" : "unknown"]++;
        entry.onResult?.(recommended);
        if (recommended === true) this.onThanks();
      };
      entry.listeners.error = result => { if (active()) this.fail(entry, entry.requested ? "component" : "preload", result); };
      for (const event of Object.keys(entry.listeners) as Event[]) manager.on(event, entry.listeners[event]!);
      return entry;
    } catch (error) {
      this.error("create", error);
      const current = this.entry;
      if (current && current.manager === manager) this.detach(current);
      try { manager?.destroy?.(); } catch {}
      return undefined;
    }
  }
  private clearTimer(): void {
    if (this.timer !== undefined) this.timers.clear(this.timer);
    this.timer = undefined;
  }
  private detach(entry: Entry): void {
    if (this.entry === entry) { this.entry = undefined; this.clearTimer(); }
    entry.abandoned = true;
    for (const event of Object.keys(entry.listeners) as Event[]) {
      try { entry.manager.off?.(event, entry.listeners[event]!); } catch {}
    }
  }
  private release(entry: Entry): boolean {
    entry.abandoned = true; this.clearTimer();
    try { entry.manager.destroy(); }
    catch (error) {
      this.error("destroy", error);
      // Keep listening for native closure. Do not resume the game underneath a page
      // whose cancellation failed; the player can retry cleanup from the home overlay.
      if (entry.requested && this.entry === entry) { this.transition("recovery"); return false; }
    }
    this.detach(entry);
    return true;
  }
  private fail(entry: Entry, stage: string, error?: unknown): void {
    if (this.entry !== entry || entry.abandoned || this.disposed) return;
    this.error(stage, error);
    const requested = entry.requested;
    if (this.release(entry)) this.transition(requested ? "error" : "idle");
  }
  preload(): void {
    if (this.disposed || this.background || this.entry || this.blocking || !this.supported()) return;
    const entry = this.create();
    if (!entry) return;
    this.transition("preloading");
    this.timer = this.timers.set(() => this.fail(entry, "preload-timeout"), 8000);
    try {
      Promise.resolve(entry.manager.load({ openlink: RECOMMENDATION_OPENLINK })).then(() => {
        if (this.disposed || this.entry !== entry || entry.abandoned) return;
        entry.loaded = true; this.clearTimer(); this.transition("ready");
      }, error => this.fail(entry, "preload", error));
    } catch (error) { this.fail(entry, "preload", error); }
  }
  request(source: "home" | "revival" = "home", onResult?: (recommended: boolean | null) => void): void {
    if (this.disposed || this.background || this.blocking || !this.enabled()) return;
    this.source = source;
    this.requests++; this.lastError = undefined; this.onOpenRequest();
    if (!this.supported()) { this.transition("unsupported"); return; }
    // Pending preload is destroyed first; show on the replacement remains inside
    // the user's tap, instead of continuing a user gesture after an arbitrary await.
    if (this.entry && !this.entry.loaded) this.release(this.entry);
    const entry = this.entry ?? this.create();
    if (!entry) { this.transition("unsupported"); return; }
    entry.requested = true;
    entry.onResult = onResult;
    this.transition("opening");
    this.timer = this.timers.set(() => this.fail(entry, "show-timeout"), 8000);
    try {
      Promise.resolve(entry.manager.show({ openlink: RECOMMENDATION_OPENLINK }))
        .catch(error => this.fail(entry, "show", error));
    } catch (error) { this.fail(entry, "show", error); }
  }
  dismiss(): void {
    if (this.disposed || this.state === "visible") return;
    if (this.entry && !this.release(this.entry)) return;
    this.transition("idle");
  }
  setBackground(background: boolean): void {
    this.background = background;
    // Foreground is not a close/result signal. Already-visible pages keep ownership.
    if (background && this.state === "preloading") this.dismiss();
  }
  snapshot() {
    return { state: this.state, blocking: this.blocking, enabled: this.enabled(), sdkVersion: this.version,
      requests: this.requests, shows: this.shows, closes: { ...this.closes },
      lastKnownRecommended: this.lastKnownRecommended, lastError: this.lastError ?? null,
      source: this.source, automaticPromptEnabled: false };
  }
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.onChange = this.onOpenRequest = this.onThanks = () => {};
    if (this.entry) { const entry = this.entry; this.release(entry); this.detach(entry); }
    this.clearTimer(); this.state = "idle";
  }
}

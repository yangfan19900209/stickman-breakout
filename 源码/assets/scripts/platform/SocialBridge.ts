import { Board, emptyRecords, Records, RULE } from "../social/RunRecords";
import { Invite, parseInvite } from "../social/InviteRoute";
interface SocialError { errMsg?: string; errno?: number | string; errCode?: number | string }
interface Callbacks { success?: (value: any) => void; fail?: (error: SocialError) => void }
const FRIEND_SCOPE = "scope.WxFriendInteraction";
export interface OpenContext { canvas: any; postMessage(message: object): void }
export interface SocialApi {
  getOpenDataContext?(): OpenContext;
  getPrivacySetting?(options: Callbacks): void;
  requirePrivacyAuthorize?(options: Callbacks): void;
  getSetting?(options: Callbacks): void;
  authorize?(options: Callbacks & { scope: string }): void;
  openSetting?(options: Callbacks): void;
  getLaunchOptionsSync?(): { query?: unknown };
  onShow?(fn: (options: { query?: unknown }) => void): void;
  offShow?(fn: (options: { query?: unknown }) => void): void;
}
export type SocialState = "idle" | "checking" | "denied" | "ready" | "error" | "unsupported";
/** All friend data stays in the subdomain; no success/data callback is invented. */
export class SocialBridge {
  state: SocialState = "idle";
  message = "好友榜会使用微信朋友信息，展示一起玩的好友与成绩。";
  onChange: () => void = () => {};
  onInvite: (invite: Invite) => void = () => {};
  private api?: SocialApi;
  private generation = 0;
  private visible = false;
  private allowed = false;
  private permission?: boolean;
  private requesting = false;
  private lastFailure?: { stage: string; kind: string; errno?: number; message: string };
  private disposed = false;
  private board: Board = "progress";
  private records: Records = emptyRecords();
  private seen = new Set<string>();
  constructor(private readonly enabled: () => boolean, private readonly canUpload: () => boolean,
    private readonly host: () => SocialApi | undefined = () => (globalThis as any).wx,
    private readonly leaderboardEnabled: () => boolean = () => true) {}
  private change(state: SocialState, message = this.message): void {
    this.state = state; this.message = message;
    if (state !== "checking") this.requesting = false;
    this.onChange();
  }
  private failure(stage: string, error: unknown, message?: string): void {
    const e = error as SocialError | undefined;
    const detail = String(e?.errMsg ?? (error instanceof Error ? error.message : ""));
    const rawCode = e?.errno ?? e?.errCode;
    const code = typeof rawCode === "number" || typeof rawCode === "string" && /^-?\d+$/.test(rawCode) ? Number(rawCode) : NaN;
    const errno = Number.isFinite(code) ? code : undefined;
    // A 1026 result can explicitly ask for an MP privacy declaration; that detail takes precedence.
    const declaration = errno === 112 || /not declared|not been declared|announce(?:\s+your)?\s+privacy\s+usage|未.*声明/i.test(detail);
    const restricted = errno === 1025 || errno === 1026;
    const configuration = declaration || restricted || /declare|announce|privacy.pop-up/i.test(detail);
    const unsupported = /invalid scope|scope.*invalid|not support|unsupported/i.test(detail);
    this.lastFailure = { stage, kind: configuration ? "configuration" : unsupported ? "unsupported" : "request",
      errno, message: detail.replace(/[\r\n\t]/g, " ").slice(0, 180) };
    // No friend records/identifiers: make platform failures inspectable in release-device debugging too.
    try { console.warn("[好友榜]", JSON.stringify(this.lastFailure)); } catch {}
    this.allowed = false;
    const reason = declaration ? "好友榜隐私声明未完成，请开发者检查微信后台配置。"
      : restricted ? "微信已限制本游戏的隐私接口，请开发者检查后台通知。"
      : configuration ? "微信授权请求未通过，请反馈下方错误信息。"
      : unsupported ? "当前微信不支持此授权请求，请反馈下方错误信息。"
      : "好友榜暂时连接失败，请重试或反馈下方错误信息。";
    this.change("error", message ?? `${reason}\n个人纪录仍可查看。`);
  }
  /** Visible support details let device testers report the actual failure without remote debugging. */
  get diagnosticText(): string {
    const failure = this.state === "error" ? this.lastFailure : undefined;
    return failure ? `授权诊断 A1114-3 · ${failure.stage} · 错误码 ${failure.errno ?? "未返回"}\n${failure.message || "平台未返回错误说明"}` : "";
  }
  /** Guard every asynchronous boundary, including host methods that throw inside callbacks. */
  private call(stage: string, generation: number, invoke: (callbacks: Callbacks) => void,
    success: (value: any) => void, failure?: (error: SocialError) => void): void {
    const alive = () => !this.disposed && this.leaderboardEnabled() && generation === this.generation;
    const fail = (error: SocialError) => { if (alive()) { if (failure) failure(error); else this.failure(stage, error); } };
    try {
      invoke({ success: value => { if (alive()) { try { success(value ?? {}); } catch (error) { this.failure(stage, error); } } }, fail });
    } catch (error) { if (alive()) this.failure(stage, error); }
  }
  get canOpenSettings(): boolean {
    return this.state === "denied" && this.permission === false && typeof (this.api ?? this.host())?.openSetting === "function";
  }
  get actionLabel(): string {
    return this.canOpenSettings ? "打开授权设置" : this.state === "error" ? "重试连接" : "查看好友榜";
  }
  private denied(): void {
    this.allowed = false; this.permission = false;
    this.change("denied", "微信朋友信息授权已关闭。可在授权设置中开启，或继续查看个人纪录。");
  }
  private ready(): void {
    this.allowed = true; this.permission = true;
    this.change("ready", ""); this.submit(); this.render();
  }
  private readonly shown = (options: { query?: unknown } = {}): void => {
    if (this.disposed) return;
    const invite = parseInvite(options.query);
    if (invite && !this.seen.has(invite.key)) { this.seen.add(invite.key); this.onInvite(invite); }
    // Native permission/settings pages may emit onShow before OR after their success callback.
    if (!this.requesting) this.connect(false);
  };
  install(): void {
    if (!this.enabled() || this.api || this.disposed) return;
    this.api = this.host();
    try {
      // Do not register onNeedPrivacyAuthorization: requirePrivacyAuthorize uses WeChat's native dialog.
      this.api?.onShow?.(this.shown);
      this.shown(this.api?.getLaunchOptionsSync?.() ?? {});
    } catch { /* Unsupported host leaves personal records available. */ }
  }
  context(): OpenContext | undefined {
    try { return this.enabled() && this.leaderboardEnabled() ? (this.api ?? this.host())?.getOpenDataContext?.() : undefined; } catch { return; }
  }
  private send(data: object): boolean {
    try { const context = this.context(); if (!context) return false; context.postMessage({ type: "social", rule: RULE, ...data }); return true; }
    catch { return false; }
  }
  updateRecords(records: Records): void { this.records = records; this.submit(); }
  private submit(): void {
    if (this.leaderboardEnabled() && this.allowed && this.canUpload() && !this.disposed) this.send({ action: "records", records: this.records });
  }
  show(board: Board): void {
    if (!this.leaderboardEnabled() || this.disposed) return;
    this.visible = true; this.board = board;
    if (!this.requesting) this.connect(false);
  }
  authorize(openSettings = false): void {
    if (!this.leaderboardEnabled() || this.disposed || !this.visible || this.requesting) return;
    const api = this.api ?? this.host();
    if (!openSettings || !this.canOpenSettings || !api?.openSetting) { this.connect(true); return; }
    const generation = ++this.generation;
    this.requesting = true; this.allowed = false; this.lastFailure = undefined;
    this.change("checking", "正在打开微信授权设置…");
    // Must stay in the tap handler: do not put getSetting/getPrivacySetting before openSetting.
    this.call("openSetting", generation, callbacks => api.openSetting!(callbacks), result => {
      const value = result.authSetting?.[FRIEND_SCOPE];
      if (value === true) this.connect(false);
      else if (value === false) this.denied();
      else {
        this.permission = undefined;
        this.failure("openSetting", { errMsg: "friend scope missing from settings" }, "未找到好友授权开关，可重试连接或查看个人纪录。");
      }
    });
  }
  private connect(interactive: boolean): void {
    // Invitation routing remains installed even while friend ranking is unavailable.
    if (!this.leaderboardEnabled() || this.disposed) return;
    const api = this.api ?? this.host(), generation = ++this.generation;
    if (this.visible && this.allowed) this.send({ action: "hide" });
    this.allowed = false; this.requesting = interactive; this.lastFailure = undefined;
    if (!this.enabled() || !api?.getPrivacySetting || !api.getSetting || !this.context()) {
      this.change("unsupported", "当前环境暂不支持微信好友榜。个人纪录可继续使用。"); return;
    }
    if (this.visible) this.change("checking", "正在连接微信好友榜…");
    const readScope = () => this.call("getSetting", generation, callbacks => api.getSetting!(callbacks), setting => {
      const value = setting.authSetting?.[FRIEND_SCOPE];
      this.permission = typeof value === "boolean" ? value : undefined;
      if (value === true) this.ready();
      else if (value === false) this.denied();
      else if (!interactive) this.change("idle", "查看好友榜需要你的同意。仅展示同玩好友的进度与成绩，随时可以返回个人纪录。");
      else if (!api.authorize) this.change("unsupported", "当前微信暂不支持好友授权，请更新微信后重试。个人纪录可继续使用。");
      else this.call("authorize", generation, callbacks => api.authorize!({ scope: FRIEND_SCOPE, ...callbacks }), () => this.ready(), error => {
        // A failed API call is not evidence of a user denial. Only an actual false scope offers settings.
        this.call("getSetting", generation, callbacks => api.getSetting!(callbacks), result => {
          const confirmed = result.authSetting?.[FRIEND_SCOPE];
          if (confirmed === false) this.denied();
          else if (confirmed === true) this.ready();
          else { this.permission = undefined; this.failure("authorize", error); }
        }, () => this.failure("authorize", error));
      });
    });
    this.call("getPrivacySetting", generation, callbacks => api.getPrivacySetting!(callbacks), privacy => {
      if (privacy.needAuthorization !== true && privacy.needAuthorization !== false) {
        this.failure("getPrivacySetting", { errMsg: "missing privacy authorization status" }); return;
      }
      if (!privacy.needAuthorization) { readScope(); return; }
      this.permission = undefined;
      if (!interactive) { this.change("idle", "同意隐私保护指引后，可查看同玩好友及成绩。个人纪录无需好友授权。"); return; }
      if (!api.requirePrivacyAuthorize) { this.change("unsupported", "当前微信暂不支持隐私授权，请更新微信后重试。个人纪录可继续使用。"); return; }
      this.call("requirePrivacyAuthorize", generation, callbacks => api.requirePrivacyAuthorize!(callbacks), readScope, error => {
        if (/cancel|auth deny|user.*(?:deny|denied|reject|disagree)/i.test(error?.errMsg ?? ""))
          this.change("idle", "你暂未同意隐私保护指引，可以继续查看个人纪录。");
        else this.failure("requirePrivacyAuthorize", error);
      });
    });
  }
  select(board: Board): void { this.board = board; if (this.state === "ready") this.render(); }
  private render(): void { if (this.visible && this.allowed && !this.send({ action: "show", board: this.board })) this.failure("postMessage", {}); }
  page(delta: number): void { if (this.visible && this.allowed) this.send({ action: "page", delta }); }
  retry(): void { if (this.visible && !this.requesting) this.connect(false); }
  hide(): void {
    this.visible = false; this.generation++; this.requesting = false; this.send({ action: "hide" });
  }
  destroy(): void {
    this.hide(); this.disposed = true;
    try { this.api?.offShow?.(this.shown); } catch {}
    this.onChange = () => {}; this.onInvite = () => {};
  }
  snapshot() { return { state: this.state, message: this.message, visible: this.visible, allowed: this.allowed,
    canOpenSettings: this.canOpenSettings, lastFailure: this.lastFailure,
    leaderboardEnabled: this.leaderboardEnabled(), uploadEnabled: this.leaderboardEnabled() && this.canUpload() }; }
}

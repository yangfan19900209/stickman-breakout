import { Board, emptyRecords, Records, RULE } from "../social/RunRecords";
import { Invite, parseInvite } from "../social/InviteRoute";
interface Callbacks { success?: (value: any) => void; fail?: (error: { errMsg?: string; errno?: number }) => void }
export interface OpenContext { canvas: any; postMessage(message: object): void }
export interface SocialApi {
  getOpenDataContext?(): OpenContext;
  getPrivacySetting?(options: Callbacks): void;
  requirePrivacyAuthorize?(options: Callbacks): void;
  onNeedPrivacyAuthorization?(fn: (resolve: (data: { event: string }) => void) => void): void;
  offNeedPrivacyAuthorization?(fn: (resolve: (data: { event: string }) => void) => void): void;
  openPrivacyContract?(options: Callbacks): void;
  getSetting?(options: Callbacks): void;
  authorize?(options: Callbacks & { scope: string }): void;
  openSetting?(options: Callbacks): void;
  getLaunchOptionsSync?(): { query?: unknown };
  onShow?(fn: (options: { query?: unknown }) => void): void;
  offShow?(fn: (options: { query?: unknown }) => void): void;
}
export type SocialState = "idle" | "checking" | "privacy" | "denied" | "ready" | "error" | "unsupported";
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
  private disposed = false;
  private board: Board = "progress";
  private records: Records = emptyRecords();
  private privacyResolve?: (value: { event: string }) => void;
  private seen = new Set<string>();
  constructor(private readonly enabled: () => boolean, private readonly canUpload: () => boolean,
    private readonly host: () => SocialApi | undefined = () => (globalThis as any).wx) {}
  private change(state: SocialState, message = this.message): void { this.state = state; this.message = message; this.onChange(); }
  private failure(error: { errMsg?: string; errno?: number }): void {
    const configuration = error.errno === 112 || error.errno === 1025 || error.errno === 1026 || /declare|announce|privacy.pop-up/.test(error.errMsg ?? "");
    this.allowed = false;
    this.change("error", configuration ? "好友榜的隐私配置暂未就绪，请先查看个人纪录。" : "好友榜暂时连接失败，请重试；个人纪录仍保存在本机。");
  }
  private readonly privacy = (resolve: (value: { event: string }) => void): void => {
    if (this.disposed || !this.visible) { resolve({ event: "disagree" }); return; }
    this.privacyResolve = resolve;
    this.change("privacy", "同意隐私保护指引后，可查看同玩好友及排行榜。\n拒绝不影响单人游戏，也可返回个人纪录。");
    resolve({ event: "exposureAuthorization" });
  };
  private readonly shown = (options: { query?: unknown } = {}): void => {
    if (this.disposed) return;
    const invite = parseInvite(options.query);
    if (invite && !this.seen.has(invite.key)) { this.seen.add(invite.key); this.onInvite(invite); }
    this.refreshConsent();
    if (this.visible && this.state === "ready") {
      this.send({ action: "hide" });
      this.change("idle", "返回后请重新连接好友榜，以确认微信朋友信息授权仍然有效。");
    }
  };
  install(): void {
    if (!this.enabled() || this.api || this.disposed) return;
    this.api = this.host();
    try {
      this.api?.onNeedPrivacyAuthorization?.(this.privacy);
      this.api?.onShow?.(this.shown);
      this.shown(this.api?.getLaunchOptionsSync?.() ?? {});
    } catch { /* Unsupported host leaves personal records available. */ }
  }
  context(): OpenContext | undefined {
    try { return this.enabled() ? (this.api ?? this.host())?.getOpenDataContext?.() : undefined; } catch { return; }
  }
  private send(data: object): boolean {
    try { const context = this.context(); if (!context) return false; context.postMessage({ type: "social", rule: RULE, ...data }); return true; }
    catch { return false; }
  }
  updateRecords(records: Records): void { this.records = records; this.submit(); }
  private submit(): void {
    if (this.allowed && this.canUpload() && !this.disposed) this.send({ action: "records", records: this.records });
  }
  private refreshConsent(): void {
    const api = this.api; this.allowed = false;
    if (!api?.getPrivacySetting || !api.getSetting) return;
    const generation = this.generation;
    try { api.getPrivacySetting({ success: p => {
      if (p.needAuthorization || this.disposed || generation !== this.generation) return;
      api.getSetting!({ success: s => {
        if (this.disposed || generation !== this.generation) return;
        this.allowed = s.authSetting?.["scope.WxFriendInteraction"] === true; this.submit();
      } });
    } }); } catch { /* No prompting at boot or foreground. */ }
  }
  show(board: Board): void {
    this.visible = true; this.board = board;
    if (this.allowed && this.state === "ready") { this.render(); return; }
    this.change("idle", "查看好友榜需要你的同意。仅展示同玩好友的进度与成绩，随时可以返回个人纪录。");
  }
  authorize(openSettings = false): void {
    const api = this.api ?? this.host(), generation = ++this.generation;
    const alive = () => !this.disposed && this.visible && generation === this.generation;
    if (!this.enabled() || !api?.getPrivacySetting || !api.requirePrivacyAuthorize || !api.getSetting || !api.authorize || !this.context()) {
      this.change("unsupported", "当前环境暂不支持微信好友榜。请更新微信后重试，个人纪录可继续使用。"); return;
    }
    this.change("checking", "正在连接微信好友榜…");
    const fail = (e: any) => { if (alive()) this.failure(e); };
    const ready = () => { if (!alive()) return; this.allowed = true; this.change("ready", ""); this.submit(); this.render(); };
    const scope = () => { if (!alive()) return; api.getSetting!({ success: s => {
      if (!alive()) return;
      const granted = s.authSetting?.["scope.WxFriendInteraction"];
      if (granted === true) ready();
      else if (granted === false && !openSettings) this.change("denied", "尚未允许微信朋友信息。可以前往微信设置开启，或继续查看个人纪录。");
      else if (openSettings && api.openSetting) api.openSetting({ success: result => {
        if (!alive()) return;
        if (result.authSetting?.["scope.WxFriendInteraction"]) ready();
        else this.change("denied", "尚未允许微信朋友信息，单人游戏不受影响。");
      }, fail });
      else api.authorize!({ scope: "scope.WxFriendInteraction", success: ready, fail: () => {
        if (alive()) this.change("denied", "你暂未允许微信朋友信息。个人纪录和单人游戏仍可使用。");
      } });
    }, fail }); };
    try { api.getPrivacySetting({ success: p => {
      if (!alive()) return;
      if (p.needAuthorization) api.requirePrivacyAuthorize!({ success: scope, fail: () => {
        if (alive()) this.change("idle", "你暂未同意隐私保护指引，可以继续查看个人纪录。");
      } }); else scope();
    }, fail }); } catch (error) { fail({ errMsg: String(error) }); }
  }
  agreePrivacy(agree: boolean): void {
    const resolve = this.privacyResolve; this.privacyResolve = undefined;
    resolve?.({ event: agree ? "agree" : "disagree" });
  }
  openPrivacy(): void { try { this.api?.openPrivacyContract?.({ fail: e => this.failure(e) }); } catch { this.failure({}); } }
  select(board: Board): void { this.board = board; if (this.state === "ready") this.render(); }
  private render(): void { if (this.visible && this.allowed && !this.send({ action: "show", board: this.board })) this.failure({}); }
  page(delta: number): void { if (this.allowed) this.send({ action: "page", delta }); }
  retry(): void { if (this.allowed) { this.submit(); this.send({ action: "refresh" }); } }
  hide(): void {
    this.visible = false; this.generation++; this.send({ action: "hide" });
    this.agreePrivacy(false);
  }
  destroy(): void {
    this.hide(); this.disposed = true;
    try { this.api?.offShow?.(this.shown); this.api?.offNeedPrivacyAuthorization?.(this.privacy); } catch {}
    this.onChange = () => {}; this.onInvite = () => {};
  }
  snapshot() { return { state: this.state, message: this.message, visible: this.visible, allowed: this.allowed, uploadEnabled: this.canUpload() }; }
}

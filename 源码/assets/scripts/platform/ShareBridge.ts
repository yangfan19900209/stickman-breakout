import { Chapter, formatTime, RULE, validTime } from "../social/RunRecords";
/** Copied unchanged into both builds, independently of released Cocos image caches. */
export const SHARE_COVER_PATH = "subpackages/landart/share-cover.jpg";
export interface ShareCard { title: string; query: string; imageUrl: string }
export interface ShareApi {
  showShareMenu?(options: { menus: string[]; withShareTicket: boolean; fail: (error: { errMsg?: string }) => void }): void;
  onShareAppMessage?(listener: () => ShareCard): void;
  offShareAppMessage?(listener: () => ShareCard): void;
  shareAppMessage?(options: ShareCard): void;
  showToast?(options: { title: string; icon: "none" }): void;
}

/** WeChat owns recipient selection and sending. Requests are not share success. */
export class ShareBridge {
  onOpenRequest: () => void = () => {};
  private host?: ShareApi;
  private installed = false;
  private disposed = false;
  private requests = 0;
  private error = "";
  private prepared: ShareCard = { title: "线条突围 · 一起来闯两关", query: "from=invite&sv=1", imageUrl: SHARE_COVER_PATH };
  private art = SHARE_COVER_PATH;
  private image?: any;
  private cover?: any;
  configure(imageUrl = SHARE_COVER_PATH): void {
    this.art = imageUrl || SHARE_COVER_PATH; this.prepare();
    const wx = this.api() as any;
    if (!this.enabled() || !wx?.createImage || !wx?.createCanvas) return;
    try {
      this.image = wx.createImage();
      this.image.onload = () => { if (!this.disposed) this.paint(); };
      this.image.src = this.art;
    } catch { /* Explicit original art remains the fallback. */ }
  }
  prepare(chapter?: Chapter, ms?: number): void {
    const challenge = !!chapter && validTime(ms);
    this.prepared = {
      title: challenge ? `第 ${chapter} 关 ${formatTime(ms)}，你能更快吗？` : chapter ? `我闯到第 ${chapter} 关，一起来突围！` : "线条突围 · 一起来闯两关",
      query: challenge ? `from=challenge&sv=1&rule=${RULE}&level=${chapter}&targetMs=${ms}` : chapter ? `from=progress&sv=1&rule=${RULE}&level=${chapter}` : "from=invite&sv=1",
      imageUrl: this.art,
    };
    this.paint();
  }
  private paint(): void {
    if (!this.image?.width || !this.art || this.disposed) return;
    try {
      const wx = this.api() as any;
      const canvas = this.cover ??= wx.createCanvas(); canvas.width = 500; canvas.height = 400;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#f6f1e8"; ctx.fillRect(0, 0, 500, 400);
      const ratio = Math.max(500 / this.image.width, 310 / this.image.height);
      ctx.drawImage(this.image, (500 - this.image.width * ratio) / 2, 0, this.image.width * ratio, this.image.height * ratio);
      ctx.fillStyle = "#f6f1e8"; ctx.fillRect(0, 300, 500, 100);
      ctx.fillStyle = "#22201d"; ctx.font = "bold 32px sans-serif"; ctx.fillText("线条突围", 25, 339);
      ctx.font = "22px sans-serif"; ctx.fillText(this.prepared.title.replace("线条突围 · ", ""), 25, 378, 450);
      // Independent artwork canvas: never capture the friend-data texture.
      this.prepared.imageUrl = canvas.toTempFilePathSync({ destWidth: 500, destHeight: 400, fileType: "jpg", quality: .85 }) || this.art;
    } catch { this.prepared.imageUrl = this.art; }
  }
  constructor(
    private readonly enabled: () => boolean,
    private readonly api: () => ShareApi | undefined = () =>
      (globalThis as typeof globalThis & { wx?: ShareApi }).wx,
  ) {}
  private readonly card = (): ShareCard => {
    if (!this.disposed && this.enabled()) {
      // Cleanup/pause failure must not prevent a user-requested native share.
      try { this.onOpenRequest(); } catch (error) { this.error = String(error); }
      this.requests++;
    }
    return { ...this.prepared };
  };
  install(): void {
    if (this.installed || this.disposed || !this.enabled()) return;
    this.installed = true;
    this.host = this.api();
    try {
      this.host?.onShareAppMessage?.(this.card);
      this.host?.showShareMenu?.({ menus: ["shareAppMessage"], withShareTicket: false,
        fail: error => { if (!this.disposed) this.error = error.errMsg ?? "分享菜单暂不可用"; } });
    } catch (error) { this.error = String(error); }
  }
  /** True means the request was issued, never that the invitation was sent. */
  request(): boolean {
    if (this.disposed || !this.enabled()) return false;
    const host = this.api() ?? this.host;
    if (!host?.shareAppMessage) { this.error = "当前环境未提供微信主动分享接口"; return false; }
    const card = this.card();
    try {
      host.shareAppMessage(card);
      this.error = "";
    } catch (error) {
      this.error = String(error);
      // A stale temporary card must not turn a Share button into a menu tutorial.
      // Retry synchronously with packaged art, still within the same user gesture.
      if (card.imageUrl !== SHARE_COVER_PATH) {
        try { host.shareAppMessage({ ...card, imageUrl: SHARE_COVER_PATH }); this.error = ""; }
        catch (fallbackError) { this.error = String(fallbackError); }
      }
    }
    return this.error === "";
  }
  status() {
    return { enabled: this.enabled(), supported: !!this.api()?.shareAppMessage,
      installed: this.installed, requests: this.requests, error: this.error, card: { ...this.prepared } };
  }
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    try { this.host?.offShareAppMessage?.(this.card); } catch {}
    this.onOpenRequest = () => {};
    if (this.image) this.image.onload = null;
    this.image = this.cover = undefined;
  }
}

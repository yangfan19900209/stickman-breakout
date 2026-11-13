import type { ScreenRect, ScreenSize } from "./MenuSafeArea";

export interface GameClubStyle extends ScreenRect {
  backgroundColor: string;
  color: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  fontSize: number;
  lineHeight: number;
  textAlign: "center";
}
type TapListener = (result?: { errMsg?: string }) => void;
export interface NativeGameClubButton {
  style: GameClubStyle;
  show(): void;
  hide(): void;
  destroy(): void;
  onTap(listener: TapListener): void;
  offTap(listener: TapListener): void;
}
export interface GameClubApi {
  createGameClubButton?(options: {
    type: "text";
    text: string;
    icon: "dark";
    style: GameClubStyle;
  }): NativeGameClubButton;
  getWindowInfo?(): { windowWidth: number; windowHeight: number };
  getSystemInfoSync?(): { windowWidth: number; windowHeight: number };
  showToast?(options: { title: string; icon: "none" }): void;
}

const validSize = (size: ScreenSize) =>
  [size.width, size.height].every((n) => Number.isFinite(n) && n > 0);

/** The native overlay uses window logical pixels, never device-pixel-ratio pixels. */
export function gameClubWindowRect(
  rect: ScreenRect,
  design: ScreenSize,
  window: ScreenSize,
): ScreenRect | undefined {
  if (!validSize(design) || !validSize(window) ||
      ![rect.left, rect.top, rect.width, rect.height].every(Number.isFinite) ||
      rect.width <= 0 || rect.height <= 0 || rect.left < 0 || rect.top < 0 ||
      rect.left + rect.width > design.width + 1 ||
      rect.top + rect.height > design.height + 1) return undefined;
  const scale = Math.min(window.width / design.width, window.height / design.height);
  return {
    left: (window.width - design.width * scale) / 2 + rect.left * scale,
    top: (window.height - design.height * scale) / 2 + rect.top * scale,
    width: rect.width * scale,
    height: rect.height * scale,
  };
}

/** One host-owned home-page button, reused across title and pause menus. */
export class GameClubBridge {
  onOpenRequest: () => void = () => {};
  private button?: NativeGameClubButton;
  private visible = false;
  private background = false;
  private disposed = false;
  private layoutKey = "";
  private tapRequests = 0;
  private error = "";
  private bounds?: ScreenRect;
  constructor(
    private readonly enabled: () => boolean,
    private readonly api: () => GameClubApi | undefined = () =>
      (globalThis as typeof globalThis & { wx?: GameClubApi }).wx,
  ) {}
  private readonly onTap: TapListener = (result) => {
    if (!this.visible || this.background || this.disposed) return;
    this.onOpenRequest();
    if (result?.errMsg?.includes("fail")) {
      this.error = result.errMsg;
      this.showFallback(true);
      return;
    }
    // A tap is an open request, not proof that the community page loaded.
    this.tapRequests++;
  };
  status() {
    return { enabled: this.enabled(), supported: !!this.api()?.createGameClubButton,
      visible: this.visible, background: this.background, tapRequests: this.tapRequests,
      bounds: this.visible ? this.bounds : undefined, error: this.error };
  }
  sync(rect: ScreenRect | undefined, design: ScreenSize, frame: ScreenSize): void {
    if (this.disposed || !this.enabled() || this.background || !rect ||
        frame.height > frame.width) {
      this.hide();
      return;
    }
    const key = JSON.stringify([rect, design, frame]);
    if (key === this.layoutKey) return;
    this.layoutKey = key;
    const api = this.api();
    if (!api?.createGameClubButton) return;
    let window = frame;
    try {
      const info = api.getWindowInfo?.() ?? api.getSystemInfoSync?.();
      if (info && validSize({ width: info.windowWidth, height: info.windowHeight }))
        window = { width: info.windowWidth, height: info.windowHeight };
    } catch { /* Old hosts can use the engine's frame size. */ }
    const bounds = gameClubWindowRect(rect, design, window);
    if (!bounds) { this.hide(); return; }
    const style: GameClubStyle = {
      ...bounds, backgroundColor: "transparent", color: "#22201d", borderColor: "#22201d",
      borderWidth: 0, borderRadius: 0,
      fontSize: Math.max(12, Math.min(22, bounds.height * 0.3)),
      lineHeight: bounds.height, textAlign: "center",
    };
    try {
      if (!this.button) {
        // Omitting openlink opens this game's own game circle. No user data scope is needed.
        // The engine renders the same generated button and label as other menus.
        // This transparent native hit area only opens the actual game circle.
        this.button = api.createGameClubButton({ type: "text", text: "", icon: "dark", style });
        this.button.onTap(this.onTap);
        this.visible = true; // Native buttons are visible on creation.
      } else {
        Object.assign(this.button.style, style);
        if (!this.visible) this.button.show();
        this.visible = true;
      }
      this.bounds = bounds;
      this.error = "";
    } catch (error) {
      this.error = String(error);
      this.releaseButton();
      // Keep the attempted layout key: a failing host must not be called every frame.
    }
  }
  hide(): void {
    this.layoutKey = "";
    if (!this.visible) return;
    this.visible = false;
    try { this.button?.hide(); } catch { this.releaseButton(); }
  }
  setBackground(hidden: boolean): void {
    this.background = hidden;
    this.layoutKey = "";
    if (hidden) this.hide();
  }
  showFallback(nativeFailure = false): void {
    // A native tap can also reach an engine hit area on some hosts.
    if (this.disposed || !this.enabled() || (this.visible && !nativeFailure)) return;
    try {
      this.api()?.showToast?.({
        title: this.api()?.createGameClubButton ? "游戏圈暂时无法打开，请稍后再试" : "请更新微信后再打开游戏圈",
        icon: "none",
      });
    } catch { /* Platform errors must not interrupt the game. */ }
  }
  private releaseButton(): void {
    const button = this.button;
    this.button = undefined;
    this.visible = false;
    if (!button) return;
    try { button.offTap(this.onTap); } catch { /* Host may already have disposed it. */ }
    try { button.hide(); } catch { /* Continue cleanup. */ }
    try { button.destroy(); } catch { /* Continue cleanup. */ }
  }
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.releaseButton();
    this.onOpenRequest = () => {};
  }
}

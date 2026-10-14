import { sys, view } from "cc";
import type { SafeInsets } from "../ui/ControlLayout";
export interface PlatformStatus {
  mode: "browser" | "standalone" | "wechat-mini-game" | "native";
  fullscreen: boolean;
  fullscreenSupported: boolean;
  ios: boolean;
}
interface WebShell {
  viewport(): { width: number; height: number };
  safeInsets(): SafeInsets;
  status(): PlatformStatus;
  enterFullscreen(): Promise<{ entered: boolean; message: string }>;
  subscribeInactive(fn: () => void): () => void;
}
/** Browser shell implements this contract; Cocos/WeChat never import browser APIs. */
export class PlatformAdapter {
  private get web(): WebShell | undefined {
    return (
      globalThis as typeof globalThis & { __BREAKOUT_PLATFORM__?: WebShell }
    ).__BREAKOUT_PLATFORM__;
  }
  frame() {
    return this.web?.viewport() ?? view.getFrameSize();
  }
  browserSafeInsets() {
    return this.web?.safeInsets();
  }
  status(): PlatformStatus {
    return (
      this.web?.status() ?? {
        mode:
          sys.platform === sys.Platform.WECHAT_GAME
            ? "wechat-mini-game"
            : sys.isBrowser
              ? "browser"
              : "native",
        fullscreen: false,
        fullscreenSupported: false,
        ios: false,
      }
    );
  }
  enterFullscreen(): Promise<{ entered: boolean; message: string }> {
    return (
      this.web?.enterFullscreen() ??
      Promise.resolve({
        entered: false,
        message: "当前平台由系统管理显示方向与全屏。",
      })
    );
  }
  subscribeInactive(fn: () => void): () => void {
    return this.web?.subscribeInactive(fn) ?? (() => {});
  }
}

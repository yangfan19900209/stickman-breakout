import { sys, view } from "cc";
import type { SafeInsets } from "../ui/ControlLayout";
import { VictoryHaptics } from "./VictoryHaptics";
import { MenuApi, readMenuRect } from "./MenuSafeArea";
import { ReleaseConfig, isChapterAvailable } from "../core/ReleaseConfig";
import { GameClubBridge } from "./GameClubBridge";
import { ShareBridge } from "./ShareBridge";
import { DEBUG } from "cc/env";
import { SocialBridge } from "./SocialBridge";
import { RecordStore } from "./RecordStore";
import { RecommendationBridge } from "./RecommendationBridge";
import { RewardedVideoBridge } from "./RewardedVideoBridge";
export interface PlatformStatus {
  mode: "browser" | "standalone" | "wechat-mini-game" | "native";
  fullscreen: boolean;
  fullscreenSupported: boolean;
  ios: boolean;
}
interface WebShell {
  readRecord?(key: string): string | null;
  writeRecord?(key: string, value: string): void;
  previewChapter?(): 2 | 3 | undefined;
  viewport(): { width: number; height: number };
  safeInsets(): SafeInsets;
  status(): PlatformStatus;
  enterFullscreen(): Promise<{ entered: boolean; message: string }>;
  subscribeInactive(fn: () => void): () => void;
}
/** Browser shell implements this contract; Cocos/WeChat never import browser APIs. */
export class PlatformAdapter {
  readonly victoryHaptics=new VictoryHaptics();
  readonly gameClub = new GameClubBridge(() => this.status().mode === "wechat-mini-game");
  readonly share = new ShareBridge(() => this.status().mode === "wechat-mini-game");
  readonly recommendation = new RecommendationBridge(() => this.status().mode === "wechat-mini-game");
  readonly rewardedVideo = new RewardedVideoBridge(() => this.status().mode === "wechat-mini-game");
  readonly social = new SocialBridge(() => this.status().mode === "wechat-mini-game", () => this.canUpload(),
    undefined, () => ReleaseConfig.friendLeaderboard);
  canUpload(): boolean {
    const wx = (globalThis as any).wx;
    return !DEBUG && sys.platform === sys.Platform.WECHAT_GAME && wx?.getSystemInfoSync?.().platform !== "devtools";
  }
  recordStore(): RecordStore {
    const wx = (globalThis as any).wx;
    return new RecordStore({
      get: key => this.web?.readRecord ? this.web.readRecord(key) : wx?.getStorageSync?.(key) || null,
      set: (key, value) => {
        if (this.web?.writeRecord) this.web.writeRecord(key, value);
        else if (wx?.setStorageSync) wx.setStorageSync(key, value);
        else throw Error("Storage unavailable");
      },
    }, `breakout.records.r1.${this.canUpload() ? "release" : "local"}`);
  }
  monotonicNow(): number {
    const wx = (globalThis as any).wx;
    // Raw mini-game performance is in microseconds; Cocos' shim uses Date.now.
    if (sys.platform === sys.Platform.WECHAT_GAME && wx?.getPerformance) return wx.getPerformance().now() / 1000;
    return globalThis.performance?.now() ?? NaN;
  }
  private get web(): WebShell | undefined {
    return (
      globalThis as typeof globalThis & { __BREAKOUT_PLATFORM__?: WebShell }
    ).__BREAKOUT_PLATFORM__;
  }
  frame() {
    return this.web?.viewport() ?? view.getFrameSize();
  }
  previewChapter(): 2 | 3 | undefined {
    const chapter = this.web?.previewChapter?.();
    return chapter !== undefined && isChapterAvailable(chapter) ? chapter : undefined;
  }
  browserSafeInsets() {
    return this.web?.safeInsets();
  }
  menuRect() {
    const wx = (globalThis as typeof globalThis & { wx?: MenuApi }).wx;
    if (this.status().mode !== "wechat-mini-game" && !wx?.getMenuButtonBoundingClientRect)
      return undefined;
    return readMenuRect(wx, this.frame());
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

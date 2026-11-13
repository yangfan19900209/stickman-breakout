import { DEBUG } from "cc/env";
import { Game, game, sys } from "cc";
import { SafeInsets } from "../ui/ControlLayout";
import { PlatformAdapter } from "./PlatformAdapter";
import { menuRectInView } from "./MenuSafeArea";
import { safeInsetsInView } from "./SafeAreaInsets";
import { ReleaseConfig } from "../core/ReleaseConfig";
export interface DebugHandle {
  version: string;
  snapshot: () => unknown;
}
/** Owns platform UI and application lifecycle subscriptions. */
export class PlatformBridge {
  readonly adapter = new PlatformAdapter();
  private unsubscribe?: () => void;
  menuRect(width: number, height: number) {
    const rect = this.adapter.menuRect();
    return rect ? menuRectInView(rect, this.adapter.frame(), width, height) : undefined;
  }
  safeInsets(width = 1280, height = 720): SafeInsets {
    return safeInsetsInView(sys.getSafeAreaRect(false), this.adapter.frame(),
      width, height, this.adapter.browserSafeInsets());
  }
  private onHide?: () => void;
  private onShow?: () => void;
  install(onHide: () => void, snapshot: () => unknown, onShow: () => void = () => {}): void {
    this.onHide = () => { this.adapter.gameClub.setBackground(true); this.adapter.recommendation.setBackground(true); onHide(); };
    this.onShow = () => { this.adapter.gameClub.setBackground(false); this.adapter.recommendation.setBackground(false); onShow(); };
    game.on(Game.EVENT_HIDE, this.onHide);
    game.on(Game.EVENT_SHOW, this.onShow);
    this.unsubscribe = this.adapter.subscribeInactive(this.onHide);
    this.adapter.share.install();
    this.adapter.social.install();
    if (DEBUG)
      (
        globalThis as typeof globalThis & { __BREAKOUT__?: DebugHandle }
      ).__BREAKOUT__ = { version: ReleaseConfig.version, snapshot };
  }
  destroy(): void {
    if (this.onHide) game.off(Game.EVENT_HIDE, this.onHide);
    if (this.onShow) game.off(Game.EVENT_SHOW, this.onShow);
    this.unsubscribe?.();
    this.adapter.gameClub.destroy();
    this.adapter.share.destroy();
    this.adapter.recommendation.destroy();
    this.adapter.social.destroy();
    if (DEBUG)
      delete (globalThis as typeof globalThis & { __BREAKOUT__?: DebugHandle })
        .__BREAKOUT__;
  }
}

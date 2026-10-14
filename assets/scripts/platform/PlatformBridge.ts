import { DEBUG } from "cc/env";
import { Game, game, sys, view } from "cc";
import { SafeInsets } from "../ui/ControlLayout";
import { PlatformAdapter } from "./PlatformAdapter";
export interface DebugHandle {
  version: string;
  snapshot: () => unknown;
}
/** All platform integration stays here. No storage/ads/network needed for V0.1. */
export class PlatformBridge {
  readonly adapter = new PlatformAdapter();
  private unsubscribe?: () => void;
  safeInsets(width = 1280, height = 720): SafeInsets {
    const frame = view.getFrameSize(),
      r = sys.getSafeAreaRect(false),
      scale = Math.min(frame.width / width, frame.height / height);
    const mx = (frame.width - width * scale) / 2,
      my = (frame.height - height * scale) / 2;
    const browserInsets = this.adapter.browserSafeInsets();
    return {
      left: Math.max(0, (r.x - mx) / scale, (browserInsets?.left ?? 0) / scale),
      right: Math.max(
        0,
        (frame.width - r.x - r.width - mx) / scale,
        (browserInsets?.right ?? 0) / scale,
      ),
      bottom: Math.max(
        0,
        (r.y - my) / scale,
        (browserInsets?.bottom ?? 0) / scale,
      ),
      top: Math.max(
        0,
        (frame.height - r.y - r.height - my) / scale,
        (browserInsets?.top ?? 0) / scale,
      ),
    };
  }
  private onHide?: () => void;
  install(onHide: () => void, snapshot: () => unknown): void {
    this.onHide = onHide;
    game.on(Game.EVENT_HIDE, onHide);
    this.unsubscribe = this.adapter.subscribeInactive(onHide);
    if (DEBUG)
      (
        globalThis as typeof globalThis & { __BREAKOUT__?: DebugHandle }
      ).__BREAKOUT__ = { version: "0.4.2", snapshot };
  }
  destroy(): void {
    if (this.onHide) game.off(Game.EVENT_HIDE, this.onHide);
    this.unsubscribe?.();
    if (DEBUG)
      delete (globalThis as typeof globalThis & { __BREAKOUT__?: DebugHandle })
        .__BREAKOUT__;
  }
}

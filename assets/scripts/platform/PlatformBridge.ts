import { DEBUG } from "cc/env";
import { Game, game, sys, view } from "cc";
import { SafeInsets } from "../ui/ControlLayout";
export interface DebugHandle {
  version: string;
  snapshot: () => unknown;
}
/** All platform integration stays here. No storage/ads/network needed for V0.1. */
export class PlatformBridge {
  safeInsets(): SafeInsets {
    const frame = view.getFrameSize(),
      r = sys.getSafeAreaRect(false),
      scale = Math.min(frame.width / 1280, frame.height / 720);
    const mx = (frame.width - 1280 * scale) / 2,
      my = (frame.height - 720 * scale) / 2;
    return {
      left: Math.max(0, (r.x - mx) / scale),
      right: Math.max(0, (frame.width - r.x - r.width - mx) / scale),
      bottom: Math.max(0, (r.y - my) / scale),
      top: Math.max(0, (frame.height - r.y - r.height - my) / scale),
    };
  }
  private onHide?: () => void;
  install(onHide: () => void, snapshot: () => unknown): void {
    this.onHide = onHide;
    game.on(Game.EVENT_HIDE, onHide);
    if (DEBUG)
      (
        globalThis as typeof globalThis & { __BREAKOUT__?: DebugHandle }
      ).__BREAKOUT__ = { version: "0.2.0", snapshot };
  }
  destroy(): void {
    if (this.onHide) game.off(Game.EVENT_HIDE, this.onHide);
    if (DEBUG)
      delete (globalThis as typeof globalThis & { __BREAKOUT__?: DebugHandle })
        .__BREAKOUT__;
  }
}

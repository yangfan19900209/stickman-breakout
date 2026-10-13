import { DEBUG } from "cc/env";
import { Game, game } from "cc";
export interface DebugHandle {
  version: string;
  snapshot: () => unknown;
}
/** All platform integration stays here. No storage/ads/network needed for V0.1. */
export class PlatformBridge {
  private onHide?: () => void;
  install(onHide: () => void, snapshot: () => unknown): void {
    this.onHide = onHide;
    game.on(Game.EVENT_HIDE, onHide);
    if (DEBUG)
      (
        globalThis as typeof globalThis & { __BREAKOUT__?: DebugHandle }
      ).__BREAKOUT__ = { version: "0.1.0", snapshot };
  }
  destroy(): void {
    if (this.onHide) game.off(Game.EVENT_HIDE, this.onHide);
    if (DEBUG)
      delete (globalThis as typeof globalThis & { __BREAKOUT__?: DebugHandle })
        .__BREAKOUT__;
  }
}

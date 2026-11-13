import type { Rect } from "../core/Types";

export interface ScreenRect { left: number; top: number; width: number; height: number }
export interface MenuApi {
  getMenuButtonBoundingClientRect?(): ScreenRect;
  getWindowInfo?(): { windowWidth: number; windowHeight: number };
}
export interface ScreenSize { width: number; height: number }

/** Native menu coordinates use the window's top-left, not GL pixels/DPR. */
export function readMenuRect(api: MenuApi | undefined, frame: ScreenSize): ScreenRect {
  let window = frame;
  try {
    const info = api?.getWindowInfo?.();
    if (info && Number.isFinite(info.windowWidth) && Number.isFinite(info.windowHeight) &&
        info.windowWidth > 0 && info.windowHeight > 0)
      window = { width: info.windowWidth, height: info.windowHeight };
  } catch { /* Older hosts can still provide the menu rectangle. */ }
  let rect: ScreenRect | undefined;
  try { rect = api?.getMenuButtonBoundingClientRect?.(); } catch { /* Use reserved space until ready. */ }
  if (!rect || ![rect.left, rect.top, rect.width, rect.height].every(Number.isFinite) ||
      rect.width <= 0 || rect.height <= 0 || rect.left < 0 || rect.top < 0 ||
      rect.left + rect.width > window.width + 1 || rect.top + rect.height > window.height + 1) {
    rect = { left: Math.max(0, window.width - 108), top: 8, width: 100, height: 40 };
  }
  return {
    left: rect.left * frame.width / window.width,
    top: rect.top * frame.height / window.height,
    width: rect.width * frame.width / window.width,
    height: rect.height * frame.height / window.height,
  };
}

/** Convert once to the same bottom-left design coordinates as UI hit areas. */
export function menuRectInView(rect: ScreenRect, frame: ScreenSize, width: number, height: number): Rect {
  const scale = Math.min(frame.width / width, frame.height / height);
  const mx = (frame.width - width * scale) / 2, my = (frame.height - height * scale) / 2;
  return { x: (rect.left - mx) / scale, y: height - (rect.top + rect.height - my) / scale,
    w: rect.width / scale, h: rect.height / scale };
}

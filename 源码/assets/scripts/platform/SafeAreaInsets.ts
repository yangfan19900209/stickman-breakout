import type { SafeInsets } from "../ui/ControlLayout";
import type { ScreenSize } from "./MenuSafeArea";

/** Cocos sys.getSafeAreaRect(false) is already in design coordinates.
 * Only browser CSS env() insets need conversion from window pixels. */
export function safeInsetsInView(
  rect: { x: number; y: number; width: number; height: number },
  frame: ScreenSize, width: number, height: number,
  browser?: SafeInsets,
): SafeInsets {
  const scale = Math.min(frame.width / width, frame.height / height);
  const valid = [rect.x, rect.y, rect.width, rect.height].every(Number.isFinite) &&
    rect.width > 0 && rect.height > 0;
  const finite = (n: number | undefined) => Number.isFinite(n) ? Math.max(0, n!) : 0;
  const edge = (design: number, css: number | undefined, limit: number) =>
    Math.min(limit, Math.max(finite(design), finite(css) / scale));
  return {
    left: edge(valid ? rect.x : 0, browser?.left, width / 4),
    right: edge(valid ? width - rect.x - rect.width : 0, browser?.right, width / 4),
    top: edge(valid ? height - rect.y - rect.height : 0, browser?.top, height / 4),
    bottom: edge(valid ? rect.y : 0, browser?.bottom, height / 4),
  };
}

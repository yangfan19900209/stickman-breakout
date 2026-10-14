/* Browser-only boundary. Gameplay and touch ownership stay in Cocos. */
(() => {
  const root = document.getElementById("GameDiv");
  const probe = document.getElementById("safe-area-probe");
  const inactive = new Set();
  const ios =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone = () =>
    navigator.standalone === true ||
    matchMedia("(display-mode: standalone)").matches ||
    matchMedia("(display-mode: fullscreen)").matches;
  function viewport() {
    const v = window.visualViewport;
    return {
      width: Math.max(1, Math.round(v && v.scale === 1 ? v.width : innerWidth)),
      height: Math.max(
        1,
        Math.round(v && v.scale === 1 ? v.height : innerHeight),
      ),
    };
  }
  function syncViewport() {
    const v = viewport();
    root.style.width = `${v.width}px`;
    root.style.height = `${v.height}px`;
    root.style.left = `${window.visualViewport?.offsetLeft || 0}px`;
    root.style.top = `${window.visualViewport?.offsetTop || 0}px`;
  }
  let queued = false;
  function resize() {
    if (!queued) {
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        syncViewport();
      });
    }
  }
  function notifyInactive() {
    for (const fn of inactive) fn();
  }
  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", resize);
  window.visualViewport?.addEventListener("resize", resize);
  window.visualViewport?.addEventListener("scroll", resize);
  document.addEventListener("fullscreenchange", resize);
  document.addEventListener("webkitfullscreenchange", resize);
  window.addEventListener("blur", notifyInactive);
  window.addEventListener("pagehide", notifyInactive);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) notifyInactive();
  });
  for (const event of [
    "touchmove",
    "gesturestart",
    "gesturechange",
    "gestureend",
  ]) {
    document.addEventListener(
      event,
      (e) => {
        if (e.cancelable) e.preventDefault();
      },
      { passive: false },
    );
  }
  const isFullscreen = () =>
    !!(document.fullscreenElement || document.webkitFullscreenElement);
  function status() {
    return {
      mode: standalone() ? "standalone" : "browser",
      fullscreen: isFullscreen(),
      fullscreenSupported: !!(
        document.fullscreenEnabled || document.webkitFullscreenEnabled
      ),
      ios,
    };
  }
  async function enterFullscreen() {
    if (standalone())
      return {
        entered: true,
        message: "已从主屏幕独立运行。系统状态栏由系统管理。",
      };
    const request = root.requestFullscreen || root.webkitRequestFullscreen;
    if (!request)
      return {
        entered: false,
        message: ios
          ? "Safari：分享 → 添加到主屏幕 → 从游戏图标打开。"
          : "浏览器不支持全屏；游戏已占满可用视口。",
      };
    try {
      // Called synchronously from the user's Cocos UI touch/click, before awaiting.
      await request.call(root);
      try {
        await screen.orientation?.lock?.("landscape");
      } catch {
        /* Rotation prompt remains available. */
      }
      resize();
      return {
        entered: isFullscreen(),
        message: isFullscreen()
          ? "已进入全屏；Esc 可退出。"
          : "全屏未开启，请使用主屏幕独立模式。",
      };
    } catch {
      return {
        entered: false,
        message: ios
          ? "此 Safari 不允许网页全屏，请添加到主屏幕。"
          : "全屏被浏览器拒绝，仍可正常游玩。",
      };
    }
  }
  globalThis.__BREAKOUT_PLATFORM__ = {
    viewport,
    status,
    enterFullscreen,
    safeInsets() {
      const s = getComputedStyle(probe);
      return {
        left: parseFloat(s.paddingLeft) || 0,
        right: parseFloat(s.paddingRight) || 0,
        top: parseFloat(s.paddingTop) || 0,
        bottom: parseFloat(s.paddingBottom) || 0,
      };
    },
    subscribeInactive(fn) {
      inactive.add(fn);
      return () => inactive.delete(fn);
    },
  };
  syncViewport();
  document.getElementById("GameCanvas").focus({ preventScroll: true });
  if ("serviceWorker" in navigator && isSecureContext) {
    navigator.serviceWorker
      .register("./sw.js", { scope: "./" })
      .catch((e) =>
        console.warn("[Breakout] Offline cache unavailable:", e.message),
      );
  }
})();

import { test, expect } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const read = (page: any) => page.evaluate(() => (globalThis as any).__BREAKOUT__.snapshot());
test.use({ serviceWorkers: 'block', channel: 'chrome' });

for (const size of [{ width: 1280, height: 720 }, { width: 844, height: 390 },
  { width: 1024, height: 768 }, { width: 932, height: 430 }]) {
  test(`unified cover ${size.width}x${size.height}: start, return home and keyboard start`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.setViewportSize(size);
    await page.clock.install({ time: new Date('2026-11-06T00:00:00Z') });
    await page.goto('/');
    await page.waitForFunction(() => !!(globalThis as any).__BREAKOUT__);
    await page.clock.pauseAt(new Date('2026-11-06T00:00:10Z'));
    expect(await page.evaluate(() => (globalThis as any).__BREAKOUT__.version)).toBe('0.6.4');
    const title = await read(page), button = title.presentation.title.start;
    expect(title.state).toBe('title');
    expect(title.presentation.title.artReady).toBe(true);
    expect(title.presentation.title.sourceSize).toEqual({ width: 1672, height: 941 });
    expect(title.presentation.fullscreenTools).toBe(false);
    expect(button.x - button.width / 2).toBeGreaterThan(0);
    expect(button.x + button.width / 2).toBeLessThan(title.display.width);
    expect(button.y - button.height / 2).toBeGreaterThan(0);
    expect(button.y + button.height / 2).toBeLessThan(title.display.height);
    await page.screenshot({ path: `../开发进度/验证记录/v064-cover-${size.width}.png` });
    const x = button.x * size.width / title.display.width;
    const y = (title.display.height - button.y) * size.height / title.display.height;
    if (size.width < 1000) await page.touchscreen.tap(x, y);
    else await page.mouse.click(x, y);
    await page.clock.runFor(100);
    expect((await read(page)).state).toBe('playing');
    await page.keyboard.press('KeyP');
    await page.clock.runFor(34);
    const paused = await read(page);
    expect(paused.state).toBe('paused');
    await page.mouse.click((paused.display.width / 2 + 153) * size.width / paused.display.width,
      (paused.display.height / 2 + 122) * size.height / paused.display.height);
    await page.clock.runFor(34);
    const home = await read(page);
    expect(home.state).toBe('title');
    expect(home.presentation.title.artReady).toBe(true);
    await page.keyboard.press('Enter');
    await page.clock.runFor(34);
    expect((await read(page)).state).toBe('playing');
    expect(errors).toEqual([]);
    writeFileSync(`../开发进度/验证记录/v064-cover-${size.width}.json`, JSON.stringify({ size, title, home, errors }, null, 2));
  });
}

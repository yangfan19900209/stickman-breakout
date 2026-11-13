import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
const { PlaytestBrain } = createRequire(import.meta.url)('../../scripts/playtest-brain.cjs');
const read = (page: any) => page.evaluate(() => (globalThis as any).__BREAKOUT__.snapshot());
test.use({ serviceWorkers: 'block' });
async function boot(page: any) {
  await page.clock.install({ time: new Date('2026-11-05T00:00:00Z') });
  await page.goto('/');
  await page.waitForFunction(() => !!(globalThis as any).__BREAKOUT__);
  await page.locator('#GameCanvas').focus();
  await page.clock.pauseAt(new Date('2026-11-05T00:00:10Z'));
  await page.keyboard.press('Enter');
  await page.clock.runFor(34);
  expect(await page.evaluate(() => (globalThis as any).__BREAKOUT__.version)).toBe('0.6.1');
}
test('crate breaks through real shots, releases one supply and debris settles on the road', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await boot(page);
  const frames: any[] = [], initial = await read(page);
  const debris: any[] = [];
  let sawWoodFall = false, sawWoodBounce = false, sawWoodRest = false;
  function sampleDebris(s: any) {
    const pieces = s.feedback.particles.filter((p: any) => p.kind === 'wood');
    debris.push({ time: s.time, pieces });
    for (const p of pieces) {
      if (p.vy < -10) sawWoodFall = true;
      const touching = s.terrain.some((r: any) => {
        if (p.x < r.x || p.x > r.x + r.w) return false;
        const top = r.slope ? r.slope.left + (r.slope.right - r.slope.left) *
          Math.max(0, Math.min(1, (p.x - r.x) / r.w)) : r.y + r.h;
        return p.y >= top + 2.99 && p.y <= top + 6;
      });
      if (touching && p.vy > 5) sawWoodBounce = true;
      if (touching && p.vy === 0) sawWoodRest = true;
    }
  }
  const first = initial.art.objects.find((o: any) => o.id === 'shotgun-cache');
  await page.keyboard.down('KeyJ');
  for (let n = 0; n < 60; n++) {
    await page.clock.runFor(17);
    const s = await read(page), o = s.objects.find((o: any) => o.id === 'shotgun-cache');
    sampleDebris(s);
    const v = s.art.objects.find((v: any) => v.id === 'shotgun-cache');
    frames.push({ object: o, visual: v ?? null });
    if (o.alive) {
      expect(v.frame).toBe('crate.intact');
      expect(v.width).toBe(first.width);
      expect(v.height).toBe(first.height);
    } else {
      expect(s.terrain.some((r: any) => r.entityId === o.id)).toBe(false);
      await page.keyboard.up('KeyJ');
      await page.screenshot({ path: '../开发进度/验证记录/v061-crate-break.png' });
      break;
    }
  }
  await page.keyboard.up('KeyJ');
  expect(frames.at(-1).object.alive).toBe(false);
  for (let n = 0; n < 60; n++) {
    await page.clock.runFor(17);
    sampleDebris(await read(page));
  }
  const end = await read(page), crate = end.objects.find((o: any) => o.id === 'shotgun-cache');
  expect(crate.y).toBeCloseTo(initial.objects.find((o: any) => o.id === crate.id).y, 1);
  expect(end.pickups.filter((p: any) => p.kind === 'shotgun')).toHaveLength(1);
  expect(end.pickups.find((p: any) => p.kind === 'shotgun').vy).toBe(0);
  expect(sawWoodFall).toBe(true);
  expect(sawWoodBounce).toBe(true);
  expect(sawWoodRest).toBe(true);
  expect(errors).toEqual([]);
  await page.screenshot({ path: '../开发进度/验证记录/v061-crate-settled.png' });
  writeFileSync('../开发进度/验证记录/v061-crate.json', JSON.stringify({ frames, debris, sawWoodFall, sawWoodBounce, sawWoodRest, end, errors }, null, 2));
});

test('real keyboard completes expanded six-zone campaign, mini boss and both final boss phases', async ({ page }) => {
  test.setTimeout(600000);
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await boot(page);
  const brain = new PlaytestBrain(), held = new Set<string>(), captured = new Set<string>();
  const phases = new Set<number>(), warnings = new Set<string>(), trace: any[] = [], captures: any[] = [];
  let lastTrace = -5, miniDeathAt: number | null = null, bossEntryAt: number | null = null;
  let minFinalDebrisY = Infinity, finalDebrisSamples = 0;
  async function shot(label: string, s: any) {
    if (captured.has(label)) return;
    captured.add(label); captures.push({ label, time: s.time, x: s.player.x });
    await page.screenshot({ path: `../开发进度/验证记录/v061-${label}.png` });
  }
  for (let n = 0; n < 10000; n++) {
    const s = await read(page);
    if (s.state !== 'playing') break;
    for (const p of s.feedback.particles) {
      if ((p.kind === 'wood' || p.kind === 'metal') && p.x >= 11040 && p.x <= 12370) {
        minFinalDebrisY = Math.min(minFinalDebrisY, p.y); finalDebrisSamples++;
      }
    }
    const zone = s.zones.find((z: any) => s.player.x >= z.start && s.player.x < z.end);
    if (s.miniBoss.health === 0 && miniDeathAt === null) miniDeathAt = s.time;
    if (s.boss.active && bossEntryAt === null) bossEntryAt = s.time;
    if (zone?.id === 'E' && s.player.x > zone.start + 800) await shot('transport', s);
    if (zone?.id === 'F' && s.player.x > zone.start + 500) await shot('blockade', s);
    if (s.time - lastTrace >= 5) {
      lastTrace = s.time;
      trace.push({ time: s.time, x: s.player.x, y: s.player.y, health: s.player.health, zone: zone?.id, boss: s.guardHealth });
      writeFileSync('../开发进度/验证记录/v061-campaign-progress.json', JSON.stringify({ snapshot: s, trace }, null, 2));
    }
    if (s.boss.active) {
      phases.add(s.boss.phase);
      if (s.boss.windup > 0) warnings.add(s.boss.attack);
      if (s.boss.beam?.active) await shot('boss-laser', s);
      if (s.projectileStates.some((p: any) => p.visual === 'mech-missile')) await shot('boss-missiles', s);
      if (s.art.renderedBoss.frame === 'mech.wreck') await shot('boss-wreck', s);
    }
    const f = brain.next(s), keys = new Set<string>();
    if (f.axis > 0) keys.add('KeyD'); if (f.axis < 0) keys.add('KeyA');
    if (f.jumpHeld) keys.add('Space'); if (f.shoot) keys.add('KeyJ');
    if (f.crouch) keys.add('KeyS'); if (f.aimY) keys.add('KeyW'); if (f.grenade) keys.add('KeyK');
    for (const k of held) if (!keys.has(k)) { await page.keyboard.up(k); held.delete(k); }
    for (const k of keys) if (!held.has(k)) { await page.keyboard.down(k); held.add(k); }
    await page.clock.runFor(34);
  }
  for (const k of held) await page.keyboard.up(k);
  const end = await read(page);
  await page.screenshot({ path: '../开发进度/验证记录/v061-complete.png' });
  writeFileSync('../开发进度/验证记录/v061-campaign.json', JSON.stringify({ snapshot: end, trace, captures, phases: [...phases], warnings: [...warnings], miniDeathAt, bossEntryAt, minFinalDebrisY, finalDebrisSamples, errors }, null, 2));
  expect(end.state, JSON.stringify({ state: end.state, hp: end.player.health, x: end.player.x, trace: trace.slice(-8) })).toBe('complete');
  expect(end.levelWidth).toBe(14800); expect(end.zones).toHaveLength(7);
  expect(end.miniBoss.health).toBe(0); expect(end.guardHealth).toBe(0);
  expect(end.player.health).toBeGreaterThan(0); expect(end.exitOpen).toBe(true);
  expect(captured.has('transport')).toBe(true); expect(captured.has('blockade')).toBe(true);
  expect(bossEntryAt! - miniDeathAt!).toBeGreaterThan(18);
  expect([...phases]).toEqual([1, 2]); expect(warnings.size).toBe(6);
  expect(finalDebrisSamples).toBeGreaterThan(0); expect(minFinalDebrisY).toBeGreaterThanOrEqual(150);
  expect(end.droppedBullets).toBe(0); expect(errors).toEqual([]);
});

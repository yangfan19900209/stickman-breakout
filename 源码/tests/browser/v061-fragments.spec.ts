import { test, expect } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const read = (page: any) => page.evaluate(() => (globalThis as any).__BREAKOUT__.snapshot());
test.use({ serviceWorkers: 'block' });

function surface(r: any, x: number): number {
  return r.slope
    ? r.slope.left + (r.slope.right-r.slope.left) * Math.max(0, Math.min(1, (x-r.x)/r.w))
    : r.y+r.h;
}

function roadAt(s: any, x: number): number | undefined {
  const road = s.terrain.filter((r: any) => r.kind === 'ground' && x >= r.x && x < r.x+r.w);
  return road.length ? Math.max(...road.map((r: any) => surface(r,x))) : undefined;
}

test('real keyboard grenade creates a near-ground blast and physical fragments land without crossing the road', async ({ page }) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.clock.install({ time: new Date('2026-11-05T00:00:00Z') });
  await page.goto('/');
  await page.waitForFunction(() => !!(globalThis as any).__BREAKOUT__);
  await page.locator('#GameCanvas').focus();
  await page.clock.pauseAt(new Date('2026-11-05T00:00:10Z'));
  await page.keyboard.press('Enter');
  await page.clock.runFor(34);
  const initial = await read(page);
  expect(initial.state).toBe('playing');
  expect(await page.evaluate(() => (globalThis as any).__BREAKOUT__.version)).toBe('0.6.1');

  // The first throw bounces onto the raised opening road. No movement, state
  // injection or simulation-side explosion is used to create the fragments.
  await page.keyboard.press('KeyK');
  const samples: any[] = [], violations: any[] = [];
  const falling = new Set<string>(), landed = new Set<string>(), seen = new Set<string>();
  let blast: any = null, blastAt: number | null = null, last = initial, capturedRest = false;
  for (let n=0; n<360; n++) {
    await page.clock.runFor(17);
    last = await read(page);
    if (!blast) {
      const grenade = last.feedback.blasts.find((b: any) => b.style === 'grenade');
      if (grenade) {
        blast = { ...grenade, roadY: roadAt(last,grenade.x) };
        blastAt = last.time;
        await page.screenshot({ path: '../开发进度/验证记录/v061-fragments-blast.png' });
      }
    }
    if (blastAt === null) continue;
    const pieces = last.feedback.particles.filter((p: any) => p.kind === 'wood' || p.kind === 'metal');
    samples.push({ time: last.time, pieces });
    for (const p of pieces) {
      seen.add(p.kind);
      if (p.vy < -10) falling.add(p.kind);
      const roadY = roadAt(last,p.x);
      // Only the road is an absolute lower bound. A particle below an overhead
      // platform or beside a crate is valid and must not be snapped onto it.
      if (roadY !== undefined && p.y < roadY+2.9)
        violations.push({ time:last.time, ...p, roadY });
      const supported = last.terrain.some((r: any) => p.x >= r.x && p.x <= r.x+r.w &&
        Math.abs(p.y-surface(r,p.x)-3) < .15);
      if (supported && Math.abs(p.vy) < .01) landed.add(p.kind);
    }
    if (!capturedRest && landed.size === 2 && last.time-blastAt > .9) {
      capturedRest = true;
      await page.screenshot({ path: '../开发进度/验证记录/v061-fragments-settled.png' });
    }
    // Check the whole fragment lifetime, including their final resting frames.
    if (last.time-blastAt > 2.1) break;
  }
  writeFileSync('../开发进度/验证记录/v061-fragments.json', JSON.stringify({
    input:'Enter, then one KeyK press; fixed browser clock and read-only snapshots',
    initial:{time:initial.time,grenades:initial.grenades,grenadesThrown:initial.grenadesThrown},
    blast, samples, seen:[...seen], falling:[...falling], landed:[...landed], violations,
    final:{time:last.time,state:last.state,grenades:last.grenades,grenadesThrown:last.grenadesThrown}, errors,
  },null,2));
  expect(last.grenadesThrown).toBe(initial.grenadesThrown+1);
  expect(blast,'a real grenade must explode').not.toBeNull();
  expect(blast.roadY).toBeDefined();
  expect(blast.y-blast.roadY,'the opening throw must actually explode next to the road').toBeLessThan(12);
  expect(blast.y-blast.roadY).toBeGreaterThanOrEqual(0);
  expect([...seen].sort()).toEqual(['metal','wood']);
  expect([...falling].sort()).toEqual(['metal','wood']);
  expect([...landed].sort()).toEqual(['metal','wood']);
  expect(violations.slice(0,10),'physical fragments crossed below the visible road').toEqual([]);
  expect(errors).toEqual([]);
});

import { test, expect } from "@playwright/test";
import { writeFileSync } from "node:fs";
test("real combat exposes wood/enemy/metal hits and layered blast debris with shake", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto("/");
  await page.waitForFunction(
    () => !!(globalThis as any).__BREAKOUT__,
    {},
    { timeout: 45000 },
  );
  await page.locator("#GameCanvas").focus();
  await page.keyboard.press("Enter");
  await page.evaluate(() => {
    const samples = {
      materials: [] as string[],
      kinds: [] as string[],
      peakShake: 0,
      blastFrames: 0,
      ages: [] as number[],
    };
    (globalThis as any).__feedbackSamples = samples;
    const observe = () => {
      const s = (globalThis as any).__BREAKOUT__?.snapshot();
      if (!s) return;
      for (const p of s.feedback.particles) {
        if (p.material && !samples.materials.includes(p.material))
          samples.materials.push(p.material);
        if (!samples.kinds.includes(p.kind)) samples.kinds.push(p.kind);
      }
      samples.peakShake = Math.max(
        samples.peakShake,
        s.feedback.shakePower * s.feedback.shakeTime,
      );
      if (s.feedback.blasts.length) {
        samples.blastFrames++;
        samples.ages.push(s.feedback.blasts[0].age);
      }
      if (s.state === "playing") requestAnimationFrame(observe);
    };
    requestAnimationFrame(observe);
  });
  await page.keyboard.down("KeyJ");
  await page.waitForFunction(
    () =>
      !(globalThis as any).__BREAKOUT__
        .snapshot()
        .objects.find((o: any) => o.id === "shotgun-cache").alive,
  );
  await page.keyboard.down("KeyD");
  await page.waitForFunction(
    () => (globalThis as any).__BREAKOUT__.snapshot().weapon === "shotgun",
  );
  await page.keyboard.up("KeyD");
  await page.waitForFunction(
    () => {
      const s = (globalThis as any).__BREAKOUT__.snapshot();
      return s.feedback.blasts.some((b: any) => b.age < 0.13);
    },
    {},
    { timeout: 15000, polling: "raf" },
  );
  await page.screenshot({ path: "reports/v021-blast-flash.png" });
  await page.waitForFunction(
    () => {
      const s = (globalThis as any).__BREAKOUT__.snapshot();
      return s.feedback.blasts.some((b: any) => b.age > 0.2 && b.age < 0.6);
    },
    {},
    { timeout: 5000, polling: "raf" },
  );
  await page.screenshot({ path: "reports/v021-blast-smoke.png" });
  await page.keyboard.up("KeyJ");
  await page.waitForTimeout(500);
  const samples = await page.evaluate(
    () => (globalThis as any).__feedbackSamples,
  );
  writeFileSync(
    "reports/v021-feedback.json",
    JSON.stringify({ samples, errors }, null, 2),
  );
  expect(samples.materials).toEqual(
    expect.arrayContaining(["wood", "enemy", "metal"]),
  );
  expect(samples.kinds).toEqual(
    expect.arrayContaining(["impact", "wood", "metal", "dust"]),
  );
  expect(samples.blastFrames).toBeGreaterThan(5);
  expect(samples.peakShake).toBeGreaterThan(1);
  expect(errors).toEqual([]);
});

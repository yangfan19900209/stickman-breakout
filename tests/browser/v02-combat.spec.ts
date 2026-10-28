import { test, expect } from "@playwright/test";
test("real bullets break wood, collect shotgun, chain barrels and throw a limited grenade", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("/");
  await page.waitForFunction(
    () => !!(globalThis as any).__BREAKOUT__,
    {},
    { timeout: 45000 },
  );
  await page.locator("#GameCanvas").focus();
  await page.keyboard.press("Enter");
  await page.waitForFunction(
    () => (globalThis as any).__BREAKOUT__.snapshot().state === "playing",
  );
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
      return (
        s.explosions >= 2 &&
        !s.objects.find((o: any) => o.id === "barrel-02").alive
      );
    },
    {},
    { timeout: 12000 },
  );
  await page.screenshot({ path: "reports/v02-stage2-combat.png" });
  await page.keyboard.up("KeyJ");
  await page.keyboard.press("KeyK");
  await page.waitForFunction(
    () => (globalThis as any).__BREAKOUT__.snapshot().grenadesThrown === 1,
  );
  const s = await page.evaluate(() =>
    (globalThis as any).__BREAKOUT__.snapshot(),
  );
  expect(s.grenades).toBe(2);
  expect(s.kills).toBeGreaterThan(0);
  expect(s.weapon).toBe("shotgun");
  await page.waitForFunction(
    () => (globalThis as any).__BREAKOUT__.snapshot().audio.loaded === 9,
  );
  const audio = (
    await page.evaluate(() => (globalThis as any).__BREAKOUT__.snapshot())
  ).audio;
  expect(audio.played).toBeGreaterThan(0);
  expect(audio.loadErrors).toEqual([]);
  expect(errors).toEqual([]);
});

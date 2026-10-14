import { GameConfig as C } from "../core/GameConfig";
import { PickupKind } from "./DestructibleObject";
import { PlayerController } from "../player/PlayerController";
import { WeaponSystem } from "../combat/WeaponSystem";
import { Rect, surfaceY } from "../core/Types";
export interface Pickup {
  active: boolean;
  x: number;
  y: number;
  kind: PickupKind;
  age: number;
  vy: number;
}
export class PickupSystem {
  readonly items: Pickup[] = Array.from({ length: 32 }, () => ({
    active: false,
    x: 0,
    y: 0,
    kind: "health",
    age: 0,
    vy: 0,
  }));
  collected = 0;
  lastMessage = "";
  messageTime = 0;
  reset(): void {
    for (const p of this.items) p.active = false;
    this.collected = 0;
    this.lastMessage = "";
    this.messageTime = 0;
  }
  spawn(x: number, y: number, kind: PickupKind): void {
    const p = this.items.find((p) => !p.active);
    if (p) Object.assign(p, { active: true, x, y, kind, age: 0, vy: 130 });
  }
  update(
    dt: number,
    player: PlayerController,
    weapon: WeaponSystem,
    solids: Rect[],
  ): void {
    this.messageTime = Math.max(0, this.messageTime - dt);
    for (const p of this.items) {
      if (!p.active) continue;
      p.age += dt;
      const oldY = p.y;
      p.vy -= 600 * dt;
      p.y += p.vy * dt;
      for (const s of solids)
        if (
          p.x > s.x - 8 &&
          p.x < s.x + s.w + 8 &&
          oldY - 10 >= surfaceY(s, p.x) &&
          p.y - 10 <= surfaceY(s, p.x)
        ) {
          p.y = surfaceY(s, p.x) + 10;
          p.vy = 0;
        }
      if (
        !player.alive ||
        Math.abs(player.x - p.x) > 35 ||
        Math.abs(player.y + 25 - p.y) > 64
      )
        continue;
      if (p.kind === "health") {
        if (player.health === C.player.maxHealth) continue;
        player.health = Math.min(C.player.maxHealth, player.health + 2);
        this.lastMessage = "生命补给 +2";
      } else if (p.kind === "grenades") {
        if (player.grenades === C.grenade.max) continue;
        player.grenades = Math.min(C.grenade.max, player.grenades + 2);
        this.lastMessage = "手雷补给 +2";
      } else {
        weapon.equip(p.kind);
        player.weaponId = p.kind;
        this.lastMessage =
          p.kind === "shotgun"
            ? "拾取霰弹枪 · 近距离爆发"
            : p.kind === "rocket"
              ? "拾取火箭筒 · 范围爆炸"
              : "拾取自动步枪";
      }
      p.active = false;
      this.collected++;
      this.messageTime = 2.4;
    }
  }
}

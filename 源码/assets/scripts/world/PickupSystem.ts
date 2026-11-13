import { GameConfig as C } from "../core/GameConfig";
import { PickupKind } from "./DestructibleObject";
import { PlayerController } from "../player/PlayerController";
import { WeaponSystem } from "../combat/WeaponSystem";
import { Rect, surfaceY, segmentRect } from "../core/Types";
import { pickupPresentation } from "../render/ObjectPresentation";
import type { RecoveryPoint } from "../level/LevelData";
export interface Pickup {
  active: boolean;
  x: number;
  y: number;
  kind: PickupKind;
  age: number;
  vy: number;
  sourceId?: string;
  support?: Rect;
  supportTop?: number;
  notified?: boolean;
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
  private usedRecovery = new Set<string>();
  get recoveryIds(): string[] { return [...this.usedRecovery]; }
  reset(): void {
    for (const p of this.items) p.active = false;
    this.collected = 0;
    this.lastMessage = "";
    this.messageTime = 0;
    this.usedRecovery.clear();
  }
  spawn(x: number, y: number, kind: PickupKind, sourceId?: string): boolean {
    const p = this.items.find((p) => !p.active);
    if (!p) return false;
    Object.assign(p, { active: true, x, y, kind, age: 0, vy: 130, sourceId, support:undefined, supportTop:undefined, notified:false });
    return true;
  }
  offerRecovery(points: readonly RecoveryPoint[], player: PlayerController): void {
    if (!player.alive || player.health > C.player.maxHealth - 2) return;
    for (const point of points) {
      if (this.usedRecovery.has(point.id) || Math.abs(point.x - player.x) > 220 ||
          Math.abs(point.y - player.y) > 180) continue;
      if (this.items.some(p => p.active && p.kind === "health" && Math.abs(p.x - player.x) < 900)) return;
      if (this.spawn(point.x, point.y + 10, "health", point.id)) this.usedRecovery.add(point.id);
      return;
    }
  }
  offerBossRecovery(id: string, x: number, y: number): void {
    // Guaranteed encounter reward, independent of the low-health aid threshold.
    // If the pool is full, retry without consuming this run's single reward.
    this.offerBossSupply(id, x, y, "health");
  }
  offerBossSupply(id: string, x: number, y: number, kind: PickupKind): boolean {
    if (this.usedRecovery.has(id) || !this.spawn(x, y + 10, kind, id)) return false;
    this.usedRecovery.add(id);
    return true;
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
      if (p.support) {
        if (solids.includes(p.support) && p.x >= p.support.x && p.x <= p.support.x+p.support.w) {
          const top=surfaceY(p.support,p.x);
          p.y += top - p.supportTop!;
          p.supportTop=top;
        } else { p.support=undefined; p.supportTop=undefined; }
      }
      // A drop created beside a large machine can start inside a nearby step.
      // Resolve that overlap once, so it never becomes an unreachable supply below the floor.
      if (p.age === 0)
        for (const s of solids)
          if (
            p.x >= s.x &&
            p.x <= s.x + s.w &&
            p.y >= s.y &&
            p.y < surfaceY(s, p.x) + 10
          )
            p.y = surfaceY(s, p.x) + 10;
      p.age += dt;
      const oldY = p.y;
      p.vy -= 600 * dt;
      p.y += p.vy * dt;
      let landing: Rect | undefined, landingY=-Infinity;
      for (const s of solids)
        if (
          p.x >= s.x && p.x <= s.x + s.w && p.vy <= 0 &&
          oldY - 10 >= surfaceY(s, p.x)-.01 &&
          p.y - 10 <= surfaceY(s, p.x) && surfaceY(s,p.x)>landingY
        ) {
          landing=s; landingY=surfaceY(s,p.x);
        }
      if(landing){p.y=landingY+10;p.vy=0;p.support=landing;p.supportTop=landingY;}
      else if(p.vy<0){p.support=undefined;p.supportTop=undefined;}
      const visual=pickupPresentation(p.kind),bottom=p.y-4,center=bottom+visual.height/2;
      if (
        !player.alive ||
        Math.abs(player.x - p.x) > player.halfWidth+visual.width/2+8 ||
        player.y+player.height < bottom-8 || player.y > bottom+visual.height+8
      ) { p.notified=false;continue; }
      if(solids.some(s=>segmentRect({x:player.x,y:player.y+player.height/2},{x:p.x,y:center},s)!==null))continue;
      const notice=(text:string)=>{if(!p.notified){this.lastMessage=text;this.messageTime=2;p.notified=true;}};
      if (p.kind === "health") {
        if (player.health === C.player.maxHealth) {notice("生命已满 · 补给留在原地");continue;}
        player.health = Math.min(C.player.maxHealth, player.health + 2);
        this.lastMessage = "生命补给 +2";
      } else if (p.kind === "grenades") {
        if (player.grenades === C.grenade.max) {notice("手雷已满 · 补给留在原地");continue;}
        player.grenades = Math.min(C.grenade.max, player.grenades + 2);
        this.lastMessage = "手雷补给 +2";
      } else if (p.kind === "ammo") {
        const refilled=weapon.refill();
        if(!refilled){notice("弹药充足 · 可补充火箭筒或霰弹枪");continue;}
        this.lastMessage=`${refilled.id==="rocket"?"火箭弹":"霰弹"}补给 +${refilled.amount}`;
      } else {
        const ammo=weapon.id===p.kind?Math.max(weapon.ammo,C.weapons[p.kind].ammo):C.weapons[p.kind].ammo;
        if (!weapon.equip(p.kind,ammo)) continue;
        this.lastMessage =
          p.kind === "knife" ? "战术刀 · 长按普攻三段连击" : p.kind === "shotgun"
            ? "拾取霰弹枪 · 近距离爆发"
            : p.kind === "rocket"
              ? "追踪火箭 · 自动锁敌 / 范围爆炸"
              : "拾取自动步枪";
      }
      p.active = false;
      this.collected++;
      this.messageTime = 2.4;
    }
  }
}

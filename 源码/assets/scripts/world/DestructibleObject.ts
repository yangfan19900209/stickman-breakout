import { GameConfig as C, WeaponId } from "../core/GameConfig";
import { DamageKind, Facing, Rect } from "../core/Types";
import { objectSolid } from "../render/ObjectPresentation";
export type ObjectKind = keyof typeof C.objects;
export type PickupKind = "health" | "grenades" | "ammo" | WeaponId;
export interface ObjectData extends Rect {
  id: string;
  kind: ObjectKind;
  drop?: PickupKind;
  dropChance?: number;
  link?: string;
  hidden?: boolean;
}
export class DestructibleObject {
  readonly id: string;
  readonly kind: ObjectKind;
  readonly maxHealth: number;
  x: number;
  y: number;
  readonly w: number;
  readonly h: number;
  health: number;
  hitTime = 0;
  hitDirection: Facing = 1;
  deadTime = 0;
  falling = false;
  vy = 0;
  triggered = false;
  dirty = false;
  readonly category: "destructible" | "indestructible" | "mechanism";
  readonly bounds: Rect;
  constructor(readonly data: ObjectData) {
    this.id = data.id;
    this.kind = data.kind;
    this.x = data.x;
    this.y = data.y;
    this.w = data.w;
    this.h = data.h;
    this.health = this.maxHealth = C.objects[data.kind];
    this.category =
      data.kind === "concrete"
        ? "indestructible"
        : data.kind === "hanging" || data.kind === "rope"
          ? "mechanism"
          : "destructible";
    const envelope = C.artStyle === "comic" && this.kind !== "rope"
      ? objectSolid(this) : { width: this.w, height: this.h };
    this.bounds = {
      x: this.x + (this.w - envelope.width) / 2,
      y: this.y,
      w: envelope.width,
      h: envelope.height,
    };
  }
  get alive(): boolean {
    return this.health > 0;
  }
  get solid(): boolean {
    return (
      this.alive &&
      this.kind !== "rope" &&
      (this.kind !== "hanging" || this.triggered)
    );
  }
  takeDamage(amount: number, _direction: Facing, _kind?: DamageKind): boolean {
    if (!this.alive) return false;
    this.hitTime = 0.16;
    this.hitDirection = _direction;
    if (this.category === "indestructible") return false;
    this.health = Math.max(0, this.health - amount);
    this.dirty = true;
    if (this.health === 0 && this.kind === "hanging" && !this.triggered) {
      this.triggered = true;
      this.falling = true;
      this.health = 1;
    }
    return true;
  }
}

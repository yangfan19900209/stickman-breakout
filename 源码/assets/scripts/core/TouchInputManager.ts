import { InputManager } from "./InputManager";
import { clamp, InputAction, Rect } from "./Types";
import { controlLayout, SafeInsets } from "../ui/ControlLayout";
export interface TouchRegion {
  id: string;
  bounds: Rect;
  action?: InputAction;
  priority: number;
}
interface TouchOwner {
  role: "move" | "action" | "ui" | "ignored";
  region?: TouchRegion;
}
const contains = (r: Rect, x: number, y: number) =>
  x >= r.x && y >= r.y && x <= r.x + r.w && y <= r.y + r.h;
/** Explicit hit-test arbitration and one owner per finger, independent of any event bubbling. */
export class TouchInputManager {
  readonly owners = new Map<number, TouchOwner>();
  enabled = false;
  rightBlankShooting = true;
  width = 1280;
  height = 720;
  hudHeight = 108;
  originX = 0;
  originY = 0;
  baseX = 0;
  baseY = 0;
  layout = controlLayout();
  insets: SafeInsets = { left: 0, right: 0, top: 0, bottom: 0 };
  private regions: TouchRegion[] = [];
  constructor(readonly input: InputManager) {}
  configure(
    width: number,
    height: number,
    layout: ReturnType<typeof controlLayout>,
    insets: SafeInsets,
  ): void {
    const ratio = layout.joystick.unit / this.layout.joystick.unit;
    const oldHeight = this.height,
      dx = this.input.joystick.x,
      dy = this.input.joystick.y,
      owner = this.input.joystick.owner;
    this.originX *= ratio;
    this.originY = height - (oldHeight - this.originY) * ratio;
    this.width = width;
    this.height = height;
    this.layout = layout;
    this.insets = insets;
    this.input.joystick.radius = layout.joystick.r;
    this.hudHeight = 52 * layout.joystick.unit;
    if (owner !== null) {
      this.input.joystick.move(owner, dx * ratio, dy * ratio);
      this.updateBase();
    }
  }
  setRegions(regions: TouchRegion[]): void {
    this.regions = regions.sort((a, b) => a.priority - b.priority);
  }
  start(id: number, x: number, y: number): void {
    if (this.owners.has(id)) return;
    const region = this.regions.find((r) => contains(r.bounds, x, y));
    if (region) {
      if (region.action && this.enabled) {
        this.input.press(`touch:${id}`, region.action);
        this.owners.set(id, { role: "action", region });
      } else
        this.owners.set(id, { role: region.action ? "ignored" : "ui", region });
      return;
    }
    if (
      !this.enabled ||
      y >= this.height - this.hudHeight - this.insets.top ||
      x < 0 ||
      x > this.width ||
      y < 0 ||
      y > this.height
    ) {
      this.owners.set(id, { role: "ignored" });
      return;
    }
    if (x < this.width / 2) {
      if (this.input.joystick.start(id, 0, 0)) {
        this.originX = x;
        this.originY = y;
        this.updateBase();
        this.owners.set(id, { role: "move" });
      } else this.owners.set(id, { role: "ignored" });
    } else if (this.rightBlankShooting) {
      this.input.press(`touch:${id}`, "shoot");
      this.owners.set(id, { role: "action" });
    } else this.owners.set(id, { role: "ignored" });
  }
  move(id: number, x: number, y: number): void {
    if (this.owners.get(id)?.role === "move")
      this.input.joystick.move(id, x - this.originX, y - this.originY);
  }
  private updateBase(): void {
    const r = this.layout.joystick.baseR,
      gap = 6 * this.layout.joystick.unit;
    this.baseX = clamp(
      this.originX,
      this.insets.left + r + gap,
      this.width / 2 - r - gap,
    );
    this.baseY = clamp(
      this.originY,
      this.insets.bottom + r + gap,
      this.height - this.hudHeight - this.insets.top - r - gap,
    );
  }
  end(id: number, x: number, y: number, cancelled = false): string | undefined {
    const owner = this.owners.get(id);
    this.owners.delete(id);
    this.input.release(`touch:${id}`);
    this.input.joystick.end(id);
    return !cancelled &&
      owner?.role === "ui" &&
      owner.region &&
      contains(owner.region.bounds, x, y)
      ? owner.region.id
      : undefined;
  }
  clear(): void {
    this.owners.clear();
    this.input.clear();
  }
}

import {
  EventKeyboard,
  EventTouch,
  input,
  Input,
  KeyCode,
  Node,
  Vec2,
  view,
  UITransform,
  EventMouse,
  sys,
} from "cc";
import { InputManager } from "../core/InputManager";
import { InputAction } from "../core/Types";
import { TouchInputManager, TouchRegion } from "../core/TouchInputManager";
interface Binding {
  node: Node;
  id: string;
  action?: InputAction;
  callback?: () => void;
  priority: number;
}
/** All fingers pass through the same explicit hit test before they acquire an action. */
export class CocosInputAdapter {
  readonly touch: TouchInputManager;
  private location = new Vec2();
  private keys = new Set<KeyCode>();
  private bindings: Binding[] = [];
  private lastTouchAt = -Infinity;
  constructor(
    readonly state: InputManager,
    readonly onEnter: () => void,
  ) {
    this.touch = new TouchInputManager(state);
    input.on(Input.EventType.KEY_DOWN, this.down, this);
    input.on(Input.EventType.KEY_UP, this.up, this);
    input.on(Input.EventType.TOUCH_START, this.touchStart, this);
    input.on(Input.EventType.TOUCH_MOVE, this.touchMove, this);
    input.on(Input.EventType.TOUCH_END, this.touchEnd, this);
    input.on(Input.EventType.TOUCH_CANCEL, this.touchCancel, this);
    input.on(Input.EventType.MOUSE_DOWN, this.mouseDown, this);
    input.on(Input.EventType.MOUSE_MOVE, this.mouseMove, this);
    input.on(Input.EventType.MOUSE_UP, this.mouseUp, this);
  }
  private action(code: KeyCode): InputAction | null {
    switch (code) {
      case KeyCode.KEY_A:
      case KeyCode.ARROW_LEFT:
        return "left";
      case KeyCode.KEY_D:
      case KeyCode.ARROW_RIGHT:
        return "right";
      case KeyCode.SPACE:
        return "jump";
      case KeyCode.KEY_J:
        return "shoot";
      case KeyCode.KEY_S:
      case KeyCode.ARROW_DOWN:
        return "crouch";
      case KeyCode.KEY_W:
      case KeyCode.ARROW_UP:
        return "aimUp";
      case KeyCode.KEY_K:
        return "grenade";
      case KeyCode.KEY_L:
        return "melee";
      case KeyCode.KEY_Q:
        return "switchWeapon";
      case KeyCode.KEY_P:
      case KeyCode.ESCAPE:
        return "pause";
      default:
        return null;
    }
  }
  private down(e: EventKeyboard): void {
    if (this.keys.has(e.keyCode)) return;
    this.keys.add(e.keyCode);
    if (e.keyCode === KeyCode.ENTER) this.onEnter();
    const a = this.action(e.keyCode);
    if (a) this.state.press(`key:${e.keyCode}`, a);
  }
  private up(e: EventKeyboard): void {
    this.keys.delete(e.keyCode);
    this.state.release(`key:${e.keyCode}`);
  }
  private touchStart(e: EventTouch): void {
    this.lastTouchAt = sys.now();
    this.refreshRegions();
    for (const point of e.getTouches()) {
      point.getUILocation(this.location);
      this.touch.start(point.getID(), this.location.x, this.location.y);
    }
  }
  private touchMove(e: EventTouch): void {
    for (const point of e.getTouches()) {
      point.getUILocation(this.location);
      this.touch.move(point.getID(), this.location.x, this.location.y);
    }
  }
  private touchEnd(e: EventTouch): void {
    this.lastTouchAt = sys.now();
    for (const point of e.getTouches()) {
      point.getUILocation(this.location);
      const ui = this.touch.end(
        point.getID(),
        this.location.x,
        this.location.y,
      );
      if (ui)
        this.bindings
          .find((b) => b.id === ui && b.node.activeInHierarchy)
          ?.callback?.();
    }
  }
  private touchCancel(e: EventTouch): void {
    this.lastTouchAt = sys.now();
    for (const point of e.getTouches()) {
      point.getUILocation(this.location);
      this.touch.end(point.getID(), this.location.x, this.location.y, true);
    }
  }
  private mouseDown(e: EventMouse): void {
    if (e.getButton() !== 0 || sys.now() - this.lastTouchAt < 700) return;
    e.getUILocation(this.location);
    this.refreshRegions();
    this.touch.start(-1, this.location.x, this.location.y);
  }
  private mouseMove(e: EventMouse): void {
    e.getUILocation(this.location);
    this.touch.move(-1, this.location.x, this.location.y);
  }
  private mouseUp(e: EventMouse): void {
    if (e.getButton() !== 0) return;
    e.getUILocation(this.location);
    const ui = this.touch.end(-1, this.location.x, this.location.y);
    if (ui)
      this.bindings
        .find((b) => b.id === ui && b.node.activeInHierarchy)
        ?.callback?.();
  }
  private refreshRegions(): void {
    const d = view.getDesignResolutionSize(),
      regions: TouchRegion[] = [];
    for (const b of this.bindings)
      if (b.node.activeInHierarchy) {
        const t = b.node.getComponent(UITransform)!,
          w = t.width * Math.abs(b.node.worldScale.x),
          h = t.height * Math.abs(b.node.worldScale.y);
        regions.push({
          id: b.id,
          action: b.action,
          priority: b.priority,
          bounds: {
            x: b.node.worldPosition.x + d.width / 2 - w / 2,
            y: b.node.worldPosition.y + d.height / 2 - h / 2,
            w,
            h,
          },
        });
      }
    this.touch.setRegions(regions);
  }
  bindJoystick(_stick: Node): void {} // Visual only: the whole left half owns movement.
  bindButton(node: Node, action: InputAction): void {
    this.bindings.push({
      node,
      id: `action:${this.bindings.length}`,
      action,
      priority: action === "jump" ? 1 : action === "grenade" ? 2 : 5,
    });
  }
  registerUI(node: Node, callback: () => void): void {
    this.bindings.push({
      node,
      id: `menu:${this.bindings.length}`,
      callback,
      priority: 0,
    });
  }
  clear(): void {
    this.keys.clear();
    this.touch.clear();
  }
  hidden(): void {
    this.clear();
  }
  destroy(): void {
    input.off(Input.EventType.KEY_DOWN, this.down, this);
    input.off(Input.EventType.KEY_UP, this.up, this);
    input.off(Input.EventType.TOUCH_START, this.touchStart, this);
    input.off(Input.EventType.TOUCH_MOVE, this.touchMove, this);
    input.off(Input.EventType.TOUCH_END, this.touchEnd, this);
    input.off(Input.EventType.TOUCH_CANCEL, this.touchCancel, this);
    input.off(Input.EventType.MOUSE_DOWN, this.mouseDown, this);
    input.off(Input.EventType.MOUSE_MOVE, this.mouseMove, this);
    input.off(Input.EventType.MOUSE_UP, this.mouseUp, this);
    this.bindings.length = 0;
    this.clear();
  }
}

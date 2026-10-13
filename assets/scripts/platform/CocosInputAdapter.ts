import {
  EventKeyboard,
  EventTouch,
  input,
  Input,
  KeyCode,
  Node,
  Vec2,
} from "cc";
import { InputManager } from "../core/InputManager";
import { InputAction } from "../core/Types";
import { GameConfig as C } from "../core/GameConfig";

/** Cocos events are the only device event boundary. Touch IDs retain independent ownership. */
export class CocosInputAdapter {
  private keys = new Set<KeyCode>();
  private bindings: {
    node: Node;
    start: (e: EventTouch) => void;
    end: (e: EventTouch) => void;
    move?: (e: EventTouch) => void;
  }[] = [];
  constructor(
    readonly state: InputManager,
    readonly onEnter: () => void,
  ) {
    input.on(Input.EventType.KEY_DOWN, this.down, this);
    input.on(Input.EventType.KEY_UP, this.up, this);
    input.on(Input.EventType.TOUCH_END, this.touchEnd, this);
    input.on(Input.EventType.TOUCH_CANCEL, this.touchEnd, this);
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
  private touchEnd(e: EventTouch): void {
    this.state.release(`touch:${e.getID()}`);
    const id = e.getID();
    if (id !== null) this.state.joystick.end(id);
  }
  bindJoystick(stick: Node): void {
    const location = new Vec2();
    const coordinates = (e: EventTouch) => {
      e.getUILocation(location);
      location.x -= stick.worldPosition.x + C.width / 2;
      location.y -= stick.worldPosition.y + C.height / 2;
    };
    const start = (e: EventTouch) => {
      coordinates(e);
      const id = e.getID();
      if (id !== null) this.state.joystick.start(id, location.x, location.y);
      e.propagationStopped = true;
    };
    const move = (e: EventTouch) => {
      coordinates(e);
      const id = e.getID();
      if (id !== null) this.state.joystick.move(id, location.x, location.y);
      e.propagationStopped = true;
    };
    const end = (e: EventTouch) => {
      this.touchEnd(e);
      e.propagationStopped = true;
    };
    stick.on(Node.EventType.TOUCH_START, start);
    stick.on(Node.EventType.TOUCH_MOVE, move);
    stick.on(Node.EventType.TOUCH_END, end);
    stick.on(Node.EventType.TOUCH_CANCEL, end);
    this.bindings.push({ node: stick, start, move, end });
  }
  bindButton(button: Node, action: InputAction): void {
    const start = (e: EventTouch) => {
      this.state.press(`touch:${e.getID()}`, action);
      e.propagationStopped = true;
    };
    const end = (e: EventTouch) => {
      this.touchEnd(e);
      e.propagationStopped = true;
    };
    button.on(Node.EventType.TOUCH_START, start);
    button.on(Node.EventType.TOUCH_END, end);
    button.on(Node.EventType.TOUCH_CANCEL, end);
    this.bindings.push({ node: button, start, end });
  }
  clear(): void {
    this.state.clear();
  }
  hidden(): void {
    this.keys.clear();
    this.state.clear();
  }
  destroy(): void {
    input.off(Input.EventType.KEY_DOWN, this.down, this);
    input.off(Input.EventType.KEY_UP, this.up, this);
    input.off(Input.EventType.TOUCH_END, this.touchEnd, this);
    input.off(Input.EventType.TOUCH_CANCEL, this.touchEnd, this);
    for (const b of this.bindings) {
      b.node.off(Node.EventType.TOUCH_START, b.start);
      b.node.off(Node.EventType.TOUCH_END, b.end);
      b.node.off(Node.EventType.TOUCH_CANCEL, b.end);
      if (b.move) b.node.off(Node.EventType.TOUCH_MOVE, b.move);
    }
  }
}

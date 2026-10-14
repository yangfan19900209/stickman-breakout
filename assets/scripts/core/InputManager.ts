import { InputAction, InputFrame } from "./Types";
import { VirtualJoystick } from "./VirtualJoystick";
import { GameConfig as C } from "./GameConfig";

/** Device independent. Multiple keyboard keys and touch IDs can hold an action. */
export class InputManager {
  private held = new Map<string, InputAction>();
  private jumpQueued = false;
  private pauseQueued = false;
  private grenadeQueued = false;
  private shootQueued = false;
  readonly joystick = new VirtualJoystick();
  private readonly frame: InputFrame = {
    axis: 0,
    jump: false,
    shoot: false,
    jumpHeld: false,
    crouch: false,
    aimY: 0,
    grenade: false,
  };
  press(source: string, action: InputAction): void {
    if (this.held.has(source)) return;
    this.held.set(source, action);
    if (action === "jump") this.jumpQueued = true;
    if (action === "pause") this.pauseQueued = true;
    if (action === "grenade") this.grenadeQueued = true;
    if (action === "shoot") this.shootQueued = true;
  }
  release(source: string): void {
    this.held.delete(source);
  }
  isHeld(action: InputAction): boolean {
    for (const held of this.held.values()) if (held === action) return true;
    return false;
  }
  consume(): InputFrame {
    const keyboard = Number(this.isHeld("right")) - Number(this.isHeld("left"));
    const frame = this.frame;
    frame.axis = keyboard || this.joystick.axis;
    frame.jump = this.jumpQueued;
    frame.shoot = this.isHeld("shoot") || this.shootQueued;
    frame.jumpHeld = this.isHeld("jump");
    frame.crouch =
      this.isHeld("crouch") || this.joystick.vertical < C.input.crouchThreshold;
    frame.aimY =
      this.isHeld("aimUp") || this.joystick.vertical > C.input.aimThreshold
        ? 1
        : 0;
    frame.grenade = this.grenadeQueued;
    this.jumpQueued = false;
    this.grenadeQueued = false;
    this.shootQueued = false;
    return frame;
  }
  consumePause(): boolean {
    const p = this.pauseQueued;
    this.pauseQueued = false;
    return p;
  }
  clear(): void {
    this.held.clear();
    this.jumpQueued = false;
    this.pauseQueued = false;
    this.grenadeQueued = false;
    this.shootQueued = false;
    this.joystick.reset();
  }
}

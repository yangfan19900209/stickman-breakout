import { InputAction, InputFrame } from "./Types";

/** Device independent. Multiple keyboard keys and touch IDs can hold an action. */
export class InputManager {
  private held = new Map<string, InputAction>();
  private jumpQueued = false;
  private pauseQueued = false;
  press(source: string, action: InputAction): void {
    if (this.held.has(source)) return;
    this.held.set(source, action);
    if (action === "jump") this.jumpQueued = true;
    if (action === "pause") this.pauseQueued = true;
  }
  release(source: string): void {
    this.held.delete(source);
  }
  isHeld(action: InputAction): boolean {
    return [...this.held.values()].includes(action);
  }
  consume(): InputFrame {
    const frame = {
      axis: Number(this.isHeld("right")) - Number(this.isHeld("left")),
      jump: this.jumpQueued,
      shoot: this.isHeld("shoot"),
    };
    this.jumpQueued = false;
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
  }
}

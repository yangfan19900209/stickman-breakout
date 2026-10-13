import { Color, Node } from "cc";
import { InputManager } from "../core/InputManager";
import { CocosInputAdapter } from "../platform/CocosInputAdapter";
import { Ink, node, colors } from "../render/Ink";
export class JoystickView {
  readonly node: Node;
  private ink: Ink;
  private lastX = 999;
  private lastY = 999;
  private active = false;
  constructor(parent: Node, adapter: CocosInputAdapter) {
    this.node = node(parent, "Virtual joystick", 140, 105, 190, 190);
    this.ink = new Ink(this.node);
    adapter.bindJoystick(this.node);
  }
  update(input: InputManager): void {
    const s = input.joystick,
      active = s.owner !== null;
    if (s.x === this.lastX && s.y === this.lastY && active === this.active)
      return;
    this.lastX = s.x;
    this.lastY = s.y;
    this.active = active;
    this.ink.clear();
    this.ink.circle(
      0,
      0,
      72,
      new Color(25, 25, 25, 130),
      new Color(250, 249, 245, 165),
      2,
    );
    this.ink.circle(0, 0, 61, new Color(25, 25, 25, 75), undefined, 1);
    this.ink.line(
      [
        { x: -44, y: 0 },
        { x: 44, y: 0 },
      ],
      1,
      new Color(25, 25, 25, 45),
    );
    this.ink.line(
      [
        { x: 0, y: -44 },
        { x: 0, y: 44 },
      ],
      1,
      new Color(25, 25, 25, 45),
    );
    this.ink.circle(
      s.x,
      s.y,
      27,
      colors.ink,
      active ? new Color(35, 35, 35, 200) : new Color(250, 249, 245, 225),
      2.5,
    );
    this.ink.circle(
      s.x,
      s.y,
      20,
      active ? colors.paper : colors.far,
      undefined,
      1,
    );
  }
}

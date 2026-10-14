import { Color, Node } from "cc";
import { InputManager } from "../core/InputManager";
import { CocosInputAdapter } from "../platform/CocosInputAdapter";
import { Ink, node, colors } from "../render/Ink";
import { controlLayout } from "./ControlLayout";
export class JoystickView {
  readonly node: Node;
  private ink: Ink;
  private lastX = 999;
  private lastY = 999;
  private active = false;
  private style = controlLayout().joystick;
  constructor(
    parent: Node,
    private adapter: CocosInputAdapter,
  ) {
    this.node = node(parent, "Virtual joystick", 158, 128, 224, 224);
    this.ink = new Ink(this.node);
    adapter.bindJoystick(this.node);
  }
  configure(style: ReturnType<typeof controlLayout>["joystick"]): void {
    this.style = style;
    this.lastX = 999;
  }
  update(input: InputManager): void {
    const s = input.joystick,
      active = s.owner !== null;
    this.node.setScale(active ? 1 : 0.55, active ? 1 : 0.55, 1);
    this.node.setPosition(
      active ? this.adapter.touch.baseX : this.style.x,
      active ? this.adapter.touch.baseY : this.style.y,
    );
    if (s.x === this.lastX && s.y === this.lastY && active === this.active)
      return;
    this.lastX = s.x;
    this.lastY = s.y;
    this.active = active;
    this.ink.clear();
    this.ink.circle(
      0,
      0,
      this.style.baseR,
      new Color(25, 25, 25, active ? 220 : 70),
      new Color(250, 249, 245, active ? 210 : 60),
      5,
    );
    this.ink.circle(
      0,
      0,
      this.style.baseR * 0.82,
      new Color(25, 25, 25, active ? 125 : 45),
      undefined,
      3,
    );
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
      this.style.knobR,
      colors.ink,
      active ? new Color(35, 35, 35, 200) : new Color(250, 249, 245, 85),
      5,
    );
    this.ink.circle(
      s.x,
      s.y,
      this.style.knobR * 0.7,
      active ? colors.paper : colors.far,
      undefined,
      2,
    );
  }
}

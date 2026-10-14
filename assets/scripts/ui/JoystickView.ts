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
    this.node.setScale(1, 1, 1);
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
      new Color(25, 25, 25, active ? 245 : 185),
      new Color(223, 223, 220, active ? 140 : 65),
      3 * this.style.unit,
    );
    this.ink.circle(
      0,
      0,
      this.style.baseR * 0.82,
      new Color(25, 25, 25, active ? 110 : 55),
      undefined,
      1.2 * this.style.unit,
    );
    for (let n = 0; n < 4; n++) {
      const angle = (n * Math.PI) / 2,
        cs = Math.cos(angle),
        sn = Math.sin(angle);
      const r = this.style.baseR * 0.75,
        q = this.style.unit * 6;
      this.ink.polygon(
        [
          { x: (r + q) * cs, y: (r + q) * sn },
          { x: (r - q) * cs - q * sn, y: (r - q) * sn + q * cs },
          { x: (r - q) * cs + q * sn, y: (r - q) * sn - q * cs },
        ],
        new Color(90, 90, 86, active ? 170 : 105),
      );
    }
    this.ink.circle(
      s.x,
      s.y,
      this.style.knobR,
      colors.ink,
      new Color(35, 35, 35, active ? 245 : 210),
      2.6 * this.style.unit,
    );
    this.ink.circle(
      s.x,
      s.y,
      this.style.knobR * 0.7,
      new Color(250, 249, 245, active ? 190 : 110),
      undefined,
      1.1 * this.style.unit,
    );
    this.ink.segment(
      s.x - this.style.knobR * 0.35,
      s.y + this.style.knobR * 0.5,
      s.x + this.style.knobR * 0.1,
      s.y + this.style.knobR * 0.58,
      2 * this.style.unit,
      new Color(255, 255, 255, active ? 185 : 100),
    );
  }
}

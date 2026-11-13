import { Node, Sprite, UIOpacity } from "cc";
import { InputManager } from "../core/InputManager";
import { CocosInputAdapter } from "../platform/CocosInputAdapter";
import { node } from "../render/Ink";
import { controlLayout } from "./ControlLayout";
import { ControlArt, controlColors } from "./ControlSkin";

export class JoystickView {
  readonly node: Node;
  private base: Sprite;
  private cap: Sprite;
  private opacity: UIOpacity;
  private stateKey = "";
  paintCount = 0;
  private style = controlLayout().joystick;
  constructor(
    parent: Node,
    private adapter: CocosInputAdapter,
  ) {
    this.node = node(parent, "Virtual joystick", 158, 128, 224, 224);
    this.base = ControlArt.sprite(
      this.node,
      "Generated socket",
      "stickBase",
      224,
      224,
    );
    this.opacity = this.base.node.addComponent(UIOpacity);
    this.cap = ControlArt.sprite(
      this.node,
      "Generated thumb grip",
      "stickCap",
      100,
      100,
    );
    adapter.bindJoystick(this.node);
  }
  configure(style: ReturnType<typeof controlLayout>["joystick"]): void {
    this.style = style;
    ControlArt.sprite(
      this.node,
      "Generated socket",
      "stickBase",
      style.baseR * 2,
      style.baseR * 2,
    );
    ControlArt.sprite(
      this.node,
      "Generated thumb grip",
      "stickCap",
      style.knobR * 2,
      style.knobR * 2,
    );
    this.stateKey = "";
  }
  update(input: InputManager): void {
    const s = input.joystick,
      active = s.owner !== null;
    this.node.setPosition(
      active ? this.adapter.touch.baseX : this.style.x,
      active ? this.adapter.touch.baseY : this.style.y,
    );
    const key = String(active);
    if (key !== this.stateKey) {
      this.opacity.opacity = active ? 150 : 112;
      this.cap.color = active ? controlColors.pressed : controlColors.normal;
      this.cap.node.setScale(active ? 0.96 : 1, active ? 0.96 : 1, 1);
      this.stateKey = key;
      this.paintCount++;
    }
    this.cap.node.setPosition(s.x, s.y);
  }
}

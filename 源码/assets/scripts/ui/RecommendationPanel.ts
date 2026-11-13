import { Color, Label, Node, UITransform } from "cc";
import { Ink, node } from "../render/Ink";
import { CocosInputAdapter } from "../platform/CocosInputAdapter";
import { RecommendationBridge } from "../platform/RecommendationBridge";
import { ControlArt } from "./ControlSkin";
import { SafeInsets } from "./ControlLayout";

const ink = new Color(34, 32, 29), muted = new Color(108, 102, 93), paper = new Color(246, 241, 232);
/** Cancellable wait and explanatory fallback; the actual recommendation UI belongs to WeChat. */
export class RecommendationPanel {
  readonly root: Node;
  private content: Node;
  private background: Node;
  private heading: Label;
  private body: Label;
  private back: Node;
  private backLabel: Label;
  private toast: Label;
  private toastRemaining = 0;
  constructor(parent: Node, private adapter: CocosInputAdapter, private bridge: RecommendationBridge) {
    this.root = node(parent, "Recommendation modal");
    this.background = node(this.root, "Recommendation paper");
    new Ink(this.background).rect(-5000, -5000, 10000, 10000, paper, paper, 0);
    this.content = node(this.root, "Recommendation explanation");
    this.heading = this.label(this.content, "推荐游戏", 0, 165, 40, 930, 65);
    this.body = this.label(this.content, "", 0, 20, 27, 930, 208, muted);
    this.back = node(this.content, "Recommendation return", 0, -185, 340, 100);
    ControlArt.sprite(this.back, "Generated recommendation return", "menu", 340, 100);
    this.backLabel = this.label(this.back, "返回首页", 0, 0, 28, 310, 60);
    this.adapter.registerUI(this.back, () => this.bridge.dismiss());
    this.toast = this.label(parent, "感谢推荐，继续突围！", 0, 0, 28, 600, 62);
    this.toast.node.active = this.root.active = false;
    this.bridge.onChange = () => this.refresh();
    this.bridge.onThanks = () => { this.toastRemaining = 2; this.toast.node.active = true; };
  }
  private label(parent: Node, value: string, x: number, y: number, size: number, w: number, h: number, color = ink): Label {
    const label = node(parent, value, x, y, w, h).addComponent(Label);
    label.string = value; label.fontFamily = "sans-serif"; label.fontSize = size; label.lineHeight = size * 1.6;
    label.color = color; label.overflow = Label.Overflow.SHRINK; return label;
  }
  private refresh(): void {
    const state = this.bridge.state, wasVisible = this.root.active;
    this.root.active = this.bridge.blocking;
    if (this.root.active && !wasVisible) {
      this.toastRemaining = 0; this.toast.node.active = false;
      this.adapter.setModal(this.root, () => this.bridge.dismiss());
    } else if (!this.root.active && wasVisible) this.adapter.setModal();
    this.background.active = this.content.active = state !== "visible";
    const back = this.bridge.snapshot().source === "revival" ? "返回失败页" : "返回首页";
    this.heading.string = state === "opening" ? "正在打开…" : state === "recovery" ? "正在返回" : "推荐游戏";
    this.backLabel.string = state === "opening" ? "取消等待" : state === "recovery" ? `重试${back}` : back;
    this.body.string = state === "opening" ? "即将打开微信推荐页面。\n你可以随时取消等待。"
      : state === "recovery" ? "推荐页面暂时未能关闭，请重试返回。\n若仍无响应，请退出小游戏后重新进入。"
      : `${state === "unsupported" ? "当前微信暂不支持此入口，可更新微信后重试。" : "暂时无法打开，请稍后再试。"}\n\n如何写评价：在小游戏更多面板的体验评价入口，\n或微信搜索结果的评分入口，进入评分主页。`;
  }
  update(dt: number, width: number, height: number, insets: SafeInsets): void {
    this.root.setPosition(width / 2 + (insets.left - insets.right) / 2, height / 2 + (insets.bottom - insets.top) / 2);
    const portrait = height > width;
    const scale = Math.max(.1, Math.min(1, (width - insets.left - insets.right - 40) / (portrait ? 600 : 1000), (height - insets.top - insets.bottom - 32) / (portrait ? 750 : 520)));
    this.content.setScale(scale, scale, 1);
    this.heading.node.setPosition(0, portrait ? 280 : 165);
    this.heading.node.getComponent(UITransform)!.setContentSize(portrait ? 560 : 930, 65);
    this.body.node.setPosition(0, portrait ? 35 : 20);
    this.body.node.getComponent(UITransform)!.setContentSize(portrait ? 560 : 930, portrait ? 390 : 208);
    this.body.fontSize = portrait ? 30 : 27; this.body.lineHeight = portrait ? 45 : 43.2;
    this.back.setPosition(0, portrait ? -250 : -185);
    this.toast.node.setPosition(width / 2, height - insets.top - 85);
    this.toastRemaining = Math.max(0, this.toastRemaining - dt);
    this.toast.node.active = this.toastRemaining > 0 && !this.bridge.blocking;
  }
  snapshot() { return { visible: this.root.active, message: this.body.string, thanksVisible: this.toast.node.active,
    button: this.backLabel.string, buttonHeight: this.back.getComponent(UITransform)!.height * this.content.scale.y }; }
  destroy(): void { this.bridge.onChange = this.bridge.onThanks = () => {}; }
}

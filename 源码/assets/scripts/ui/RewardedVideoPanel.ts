import { Color, Label, Node, UITransform } from "cc";
import { Ink, node } from "../render/Ink";
import { CocosInputAdapter } from "../platform/CocosInputAdapter";
import { RewardedVideoBridge } from "../platform/RewardedVideoBridge";
import { ControlArt } from "./ControlSkin";
import { SafeInsets } from "./ControlLayout";

/** Locks game input while the native video owns the screen; waiting can be cancelled. */
export class RewardedVideoPanel {
  readonly root: Node;
  private content: Node;
  private background: Node;
  private heading: Label;
  private body: Label;
  private back: Node;
  private backLabel: Label;
  constructor(parent: Node, private adapter: CocosInputAdapter, private bridge: RewardedVideoBridge) {
    this.root = node(parent, "Rewarded video modal");
    this.background = node(this.root, "Video waiting paper");
    const paper = new Color(246, 241, 232);
    new Ink(this.background).rect(-5000, -5000, 10000, 10000, paper, paper, 0);
    this.content = node(this.root, "Video waiting content");
    this.heading = this.label(this.content, "正在加载广告…", 150, 40, 900, 65);
    this.body = this.label(this.content, "完整看完视频，获得 1 次原地复活机会。", 10, 27, 900, 150);
    this.back = node(this.content, "Cancel video wait", 0, -170, 340, 100);
    ControlArt.sprite(this.back, "Generated video return", "menu", 340, 100);
    this.backLabel = this.label(this.back, "取消等待", 0, 28, 310, 60);
    this.adapter.registerUI(this.back, () => this.bridge.cancel());
    this.root.active = false;
    this.bridge.onChange = () => this.refresh();
  }
  private label(parent: Node, value: string, y: number, size: number, width: number, height: number): Label {
    const label = node(parent, value, 0, y, width, height).addComponent(Label);
    label.string = value; label.fontFamily = "sans-serif"; label.fontSize = size; label.lineHeight = size * 1.6;
    label.color = new Color(34, 32, 29); label.overflow = Label.Overflow.SHRINK; return label;
  }
  private refresh(): void {
    const wasVisible = this.root.active;
    this.root.active = this.bridge.blocking;
    if (this.root.active && !wasVisible) this.adapter.setModal(this.root, () => this.bridge.cancel());
    else if (!this.root.active && wasVisible) this.adapter.setModal();
    this.background.active = this.content.active = this.bridge.state !== "visible";
    this.heading.string = this.bridge.state === "recovery" ? "正在返回" : "正在加载广告…";
    this.body.string = this.bridge.state === "recovery" ? "广告暂时未能关闭，请重试返回。\n若仍无响应，请退出小游戏后重新进入。"
      : "完整看完视频，获得 1 次原地复活机会。\n未看完不消耗次数，可以重新观看。";
    this.backLabel.string = this.bridge.state === "recovery" ? "重试返回" : "取消等待";
  }
  update(width: number, height: number, insets: SafeInsets): void {
    const portrait = height > width;
    this.root.setPosition(width / 2 + (insets.left - insets.right) / 2, height / 2 + (insets.bottom - insets.top) / 2);
    const scale = Math.max(.1, Math.min(1, (width - insets.left - insets.right - 40) / (portrait ? 600 : 1000),
      (height - insets.top - insets.bottom - 32) / (portrait ? 700 : 520)));
    this.content.setScale(scale, scale, 1);
    this.heading.node.getComponent(UITransform)!.setContentSize(portrait ? 560 : 900, 65);
    this.body.node.getComponent(UITransform)!.setContentSize(portrait ? 560 : 900, portrait ? 230 : 150);
    this.heading.node.setPosition(0, portrait ? 230 : 150);
    this.back.setPosition(0, portrait ? -220 : -170);
  }
  snapshot() { return { visible: this.root.active, waiting: this.content.active && this.root.active, button: this.backLabel.string }; }
  destroy(): void { this.bridge.onChange = () => {}; }
}

import { Color, Label, Node, UITransform } from "cc";
import { Ink, node } from "../render/Ink";
import { CocosInputAdapter } from "../platform/CocosInputAdapter";
import { SocialBridge } from "../platform/SocialBridge";
import { PersonalRecords } from "../social/PersonalRecords";
import { Board, formatTime, progressText } from "../social/RunRecords";
import { Invite } from "../social/InviteRoute";
import { ControlArt } from "./ControlSkin";
import { FriendCanvasView } from "./FriendCanvasView";
import { ReleaseConfig } from "../core/ReleaseConfig";

const ink = new Color(34, 32, 29), muted = new Color(105, 100, 92), paper = new Color(246, 241, 232);
/** One modal owns input, consent and the isolated texture. Closing keeps play paused. */
export class RecordsPanel {
  readonly root: Node;
  private content: Node;
  private rotateNote: Node;
  private view: FriendCanvasView;
  private headline: Label;
  private body: Label;
  private status: Label;
  private diagnostic: Label;
  private personalButton: Node;
  private friendsButton: Node;
  private boardButtons: Node[] = [];
  private paging: Node[] = [];
  private authorizeButton: Node;
  private authorizeLabel: Label;
  private shareButton?: Node;
  private mode: "personal" | "friends" | "invite" = "personal";
  private board: Board = "progress";
  private invitation?: Invite;
  constructor(parent: Node, private adapter: CocosInputAdapter, private bridge: SocialBridge,
    private personal: PersonalRecords, private wechat: boolean, private onAccept: (invite: Invite) => void, onShare?: () => void) {
    this.root = node(parent, "Records and friends modal");
    const background = new Ink(node(this.root, "Records paper"));
    background.rect(-5000, -5000, 10000, 10000, paper, paper, 0);
    this.content = node(this.root, "Records content");
    this.rotateNote = node(this.root, "Rotate for records", 0, 0, 1100, 160);
    const rotateLabel = this.rotateNote.addComponent(Label);
    rotateLabel.string = ReleaseConfig.friendLeaderboard ? "请横屏查看纪录与好友榜" : "请横屏查看个人纪录";
    rotateLabel.fontSize = 58; rotateLabel.lineHeight = 80;
    rotateLabel.color = ink; rotateLabel.fontFamily = "sans-serif";
    this.rotateNote.active = false;
    this.headline = this.label("个人纪录", 0, 267, 38, 800, 54);
    this.button("返回", 444, 267, 120, () => this.close());
    this.personalButton = this.button("个人纪录", -155, 197, 270, () => this.select("personal"));
    this.friendsButton = this.button("微信好友榜", 155, 197, 270, () => this.select("friends"));
    const boards: [Board, string][] = [["progress", "好友进度"], ["level1", "第一关最快"], ["level2", "第二关最快"]];
    boards.forEach(([board, title], index) => this.boardButtons.push(this.button(title, (index - 1) * 302, 130, 286, () => {
      this.board = board; this.bridge.select(board); this.refresh();
    })));
    this.view = new FriendCanvasView(node(this.content, "Friend data texture", 0, -71, 960, 340));
    this.body = this.label("", 0, -10, 28, 960, 240); this.body.lineHeight = 52;
    this.status = this.label("", 0, -215, 18, 970, 44, muted);
    this.diagnostic = this.label("", 0, -195, 18, 960, 122, muted);
    this.diagnostic.lineHeight = 24; this.diagnostic.node.active = false;
    this.authorizeButton = this.button("查看好友榜", 0, -105, 300, () => {
      if (this.mode === "invite") { const invite = this.invitation!; this.close(); this.onAccept(invite); }
      else this.bridge.authorize(this.bridge.canOpenSettings);
    });
    this.authorizeLabel = this.authorizeButton.getComponentInChildren(Label)!;
    this.paging.push(this.button("上一页", -320, -280, 200, () => this.bridge.page(-1)),
      this.button("刷新", 0, -280, 200, () => this.bridge.retry()),
      this.button("下一页", 320, -280, 200, () => this.bridge.page(1)));
    if (onShare) this.shareButton = this.button("分享邀请", 0, -280, 260, onShare);
    this.root.active = false;
    this.bridge.onChange = () => this.refresh();
  }
  private label(value: string, x: number, y: number, size: number, width: number, height: number, color = ink): Label {
    const target = node(this.content, `Records: ${value}`, x, y, width, height), label = target.addComponent(Label);
    label.string = value; label.fontFamily = "sans-serif"; label.fontSize = size; label.lineHeight = size * 1.5;
    label.color = color; label.overflow = Label.Overflow.SHRINK; return label;
  }
  private button(value: string, x: number, y: number, width: number, click: () => void): Node {
    const target = node(this.content, value, x, y, width, 54);
    ControlArt.sprite(target, "Generated menu", "menu", width, 54);
    const text = node(target, value, 0, 0, width - 22, 44).addComponent(Label);
    text.string = value; text.fontFamily = "sans-serif"; text.fontSize = 24; text.lineHeight = 30;
    text.color = ink; text.overflow = Label.Overflow.SHRINK; this.adapter.registerUI(target, click); return target;
  }
  get visible(): boolean { return this.root.active; }
  open(): void { this.root.active = true; this.adapter.setModal(this.root, () => this.close()); this.select("personal"); }
  invite(invitation: Invite): void {
    this.open(); this.invitation = invitation; this.mode = "invite"; this.refresh();
  }
  close(): void { this.root.active = false; this.bridge.hide(); this.adapter.setModal(); }
  private select(mode: "personal" | "friends"): void {
    this.mode = mode === "friends" && !ReleaseConfig.friendLeaderboard ? "personal" : mode;
    if (this.mode === "friends" && this.wechat) this.bridge.show(this.board); else this.bridge.hide();
    this.refresh();
  }
  refresh(): void {
    if (!this.visible) return;
    const friends = this.mode === "friends", invite = this.mode === "invite";
    const ready = friends && this.wechat && this.bridge.state === "ready";
    const diagnostic = friends && this.wechat ? this.bridge.diagnosticText : "";
    this.headline.string = invite ? "收到好友邀请" : friends ? "微信好友榜" : "个人纪录";
    this.personalButton.active = this.friendsButton.active = ReleaseConfig.friendLeaderboard && !invite;
    this.boardButtons.forEach((n, i) => {
      n.active = friends;
      n.getComponentInChildren(Label)!.color = ["progress", "level1", "level2"][i] === this.board ? new Color(173, 53, 38) : ink;
    });
    this.view.node.active = ready;
    if (ready) { const context = this.bridge.context(); if (context) this.view.attach(context); }
    this.body.node.active = !ready;
    this.status.node.active = !ready && !diagnostic;
    this.diagnostic.string = diagnostic;
    this.diagnostic.node.active = !!diagnostic;
    this.body.node.setPosition(0, diagnostic ? 26 : -10);
    this.body.node.getComponent(UITransform)!.setContentSize(960, diagnostic ? 132 : 240);
    this.body.lineHeight = diagnostic ? 40 : 52;
    this.authorizeButton.setPosition(0, diagnostic ? -88 : -105);
    this.paging.forEach(n => n.active = ready);
    if (this.shareButton) this.shareButton.active = this.mode === "personal";
    this.authorizeButton.active = friends && this.wechat && !ready && this.bridge.state !== "checking" && this.bridge.state !== "unsupported" || invite;
    if (invite) {
      const i = this.invitation!;
      this.body.string = i.kind === "challenge" ? `好友向你发起第 ${i.chapter} 关挑战\n目标用时  ${formatTime(i.targetMs)}` : i.kind === "progress" ? `好友已经闯到第 ${i.chapter} 关\n一起开始新的突围！` : "两关战场，等你突围！";
      this.authorizeLabel.string = "接受邀请";
      this.status.string = i.oldRule ? "该挑战来自其他计时版本，仅作展示；本次按当前规则记录。" : i.chapter === 2 ? "从第一关开始，通关后进入第二关；已有战斗会保持暂停。" : "挑战目标仅作比较，成绩以你实际通关为准。";
    } else if (friends) {
      this.body.string = this.wechat ? this.bridge.message : "请在微信小游戏里查看好友榜\n这里可以查看本机个人纪录";
      this.authorizeLabel.string = this.bridge.actionLabel;
      this.status.string = "仅展示同玩且已有成绩的好友 · 相同成绩并列 · 关闭后仍保持暂停";
    } else {
      const r = this.personal.records;
      this.body.string = `${progressText(r)}\n第一关最快  ${r.times[1]?formatTime(r.times[1].ms):"暂无竞速纪录"}\n第二关最快  ${r.times[2]?formatTime(r.times[2].ms):"暂无竞速纪录"}`;
      const challenge = this.personal.challenge;
      if (challenge?.kind === "challenge") this.body.string += `\n好友目标  第 ${challenge.chapter} 关 ${formatTime(challenge.targetMs)}${challenge.oldRule ? "（旧版）" : ""}`;
      this.status.string = `${this.personal.saved ? "纪录已保存在本机" : "本机保存失败，请检查存储空间"} · 暂停与后台不计时`
        + (ReleaseConfig.friendLeaderboard ? "\n好友榜与本机纪录分别保存；好友云端同步状态请在榜内查看。" : "");
    }
  }
  update(dt: number, width: number, height: number, portrait: boolean): void {
    this.root.setPosition(width / 2, height / 2);
    const scale = Math.min(1, (width - 64) / 1040, (height - 70) / 620);
    this.content.setScale(scale, scale, 1);
    this.content.active = !portrait;
    this.rotateNote.active = portrait;
    this.view.update(dt);
  }
  snapshot() { return { visible: this.visible, mode: this.mode, board: this.board, title: this.headline.string, body: this.body.string,
    diagnostic: this.diagnostic.node.active ? this.diagnostic.string : undefined,
    action: this.authorizeButton.active ? this.authorizeLabel.string : undefined }; }
  destroy(): void { this.view.destroy(); this.bridge.onChange = () => {}; }
}

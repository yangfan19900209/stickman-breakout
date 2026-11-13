import { Color, Label, Node, Sprite, UITransform } from "cc";
import { Ink, node } from "../render/Ink";
import { ComicAssets } from "../render/ComicAssets";
import { CocosInputAdapter } from "../platform/CocosInputAdapter";
import { ControlArt } from "./ControlSkin";
import { ReleaseConfig } from "../core/ReleaseConfig";

const palette = {
  ink: new Color(34, 32, 29),
  muted: new Color(108, 102, 93),
  paper: new Color(246, 241, 232),
  accent: new Color(173, 53, 38),
};

function label(
  parent: Node,
  value: string,
  x: number,
  y: number,
  size: number,
  width: number,
  color = palette.ink,
) {
  const n = node(parent, value, x + width / 2, y, width, size * 1.5);
  const text = n.addComponent(Label);
  text.string = value;
  text.fontSize = size;
  text.lineHeight = size * 1.15;
  text.fontFamily = "sans-serif";
  text.color = color;
  text.horizontalAlign = Label.HorizontalAlign.LEFT;
  text.overflow = Label.Overflow.SHRINK;
  return text;
}

/** One art-directed scene: hero, mech and ground share the same drawing scale. */
export class TitlePoster {
  readonly root: Node;
  readonly start: Node;
  readonly gameClub?: Node;
  readonly recommendation?: Node;
  private records?: Node;
  private share?: Node;
  private background: Ink;
  private artwork: Sprite;
  private arrow: Node;
  private startLabel: Label;
  private clock = 0;
  private width = 1280;
  private height = 720;

  constructor(parent: Node, adapter: CocosInputAdapter, onStart: () => void, onGameClub?: () => void, onShare?: () => void, onRecords?: () => void, onRecommend?: () => void) {
    this.background = new Ink(node(parent, "Cover paper extension"));
    const scene = node(
      parent,
      "Single illustrated battlefield",
      0,
      0,
      1280,
      720,
    );
    this.artwork = scene.addComponent(Sprite);
    this.artwork.sizeMode = Sprite.SizeMode.CUSTOM;
    this.artwork.trim = false;
    this.artwork.spriteFrame = ComicAssets.titleCover ?? null;
    if (ComicAssets.titleCover) {
      const source = ComicAssets.titleCover.originalSize;
      scene
        .getComponent(UITransform)!
        .setContentSize(1280, (1280 * source.height) / source.width);
    }

    this.root = node(parent, "Unified battlefield cover controls");

    const ink = new Ink(node(this.root, "Cover typography details"));
    ink.rect(-548, 263, 30, 23, palette.accent, palette.accent, 0);
    label(this.root, "01", -541, 275, 13, 24, palette.paper).isBold = true;
    label(this.root, "STICKMAN BREAKOUT", -502, 275, 14, 330, palette.muted);

    const title = label(this.root, "线条\n突围", -551, onRecommend ? 145 : 129, onRecommend ? 94 : 104, 420);
    title.node.getComponent(UITransform)!.setContentSize(420, onRecommend ? 220 : 240);
    title.lineHeight = onRecommend ? 98 : 108;
    title.isBold = true;
    label(this.root, "冲出重围。", -545, onRecommend ? 0 : -28, 26, 350);
    label(
      this.root,
      "奔跑 · 开火 · 直面机甲",
      -544,
      onRecommend ? -36 : -65,
      15,
      360,
      palette.muted,
    );

    const buttonHeight = onRecommend ? 88 : 80;
    this.start = node(this.root, "开始突围", -395, onRecommend ? -104 : -126, 300, buttonHeight);
    ControlArt.sprite(this.start, "Generated start button", "menu", 300, buttonHeight);
    this.startLabel=label(this.start, "开始突围", -112, 1, 24, 210, palette.ink);
    this.startLabel.isBold = true;
    this.arrow = node(this.start, "Start arrow", 105, 0);
    label(this.arrow, "→", -15, 0, 28, 32, palette.ink);
    adapter.registerUI(this.start, onStart);

    if (onGameClub) {
      const width = onShare ? 142 : 300;
      this.gameClub = node(this.root, "游戏圈", onShare ? -474 : -395, onRecommend ? -208 : -224, width, buttonHeight);
      ControlArt.sprite(this.gameClub, "Generated game circle button", "menu", width, buttonHeight);
      const text = label(this.gameClub, "游戏圈", -width / 2 + 10, 0, 24, width - 20);
      text.horizontalAlign = Label.HorizontalAlign.CENTER;
      adapter.registerUI(this.gameClub, onGameClub);
    }
    if (onShare) {
      const share = this.share = node(this.root, "分享游戏", -316, onRecommend ? -208 : -224, 142, buttonHeight);
      ControlArt.sprite(share, "Generated share button", "menu", 142, buttonHeight);
      const text = label(share, "分享游戏", -65, 0, 24, 130);
      text.horizontalAlign = Label.HorizontalAlign.CENTER;
      adapter.registerUI(share, onShare);
    }
    if (onRecords) {
      const width = onRecommend ? 142 : 300, height = onRecommend ? buttonHeight : 58;
      const records = this.records = node(this.root, "纪录与好友榜", onRecommend ? -474 : -395, onRecommend ? -312 : onGameClub ? -305 : -306, width, height);
      ControlArt.sprite(records, "Generated records button", "menu", width, height);
      const text = label(records, onRecommend ? "纪录榜" : "纪录与好友榜", -width / 2 + 10, 0, onRecommend ? 24 : 22, width - 20);
      text.horizontalAlign = Label.HorizontalAlign.CENTER;
      adapter.registerUI(records, onRecords);
    }
    if (onRecommend) {
      this.recommendation = node(this.root, "推荐游戏", -316, -312, 142, buttonHeight);
      ControlArt.sprite(this.recommendation, "Generated recommendation button", "menu", 142, buttonHeight);
      const text = label(this.recommendation, "推荐游戏", -65, 0, 24, 130);
      text.horizontalAlign = Label.HorizontalAlign.CENTER;
      adapter.registerUI(this.recommendation, onRecommend);
    }
    if (!onGameClub) label(
      this.root,
      "AD 移动 · 空格二段跳 · S＋空格下台",
      -544,
      -185,
      13,
      360,
      palette.muted,
    );
    if (!onGameClub) label(
      this.root,
      "手机：空中再点跳 · 摇杆下＋跳下台",
      -544,
      -210,
      13,
      350,
      palette.muted,
    );
    label(this.root, `V${ReleaseConfig.version}`, onGameClub ? -140 : -544,
      onGameClub ? 275 : -268, 13, 160, palette.muted);
  }

  setUnlocked(cleared: number): void { this.startLabel.string=cleared>=1?"选择关卡":"开始突围"; }

  resize(width: number, height: number, safeBottom = 0, safeLeft = 0) {
    this.width = width;
    this.height = height;
    const scale = Math.min(width / 1280, height / 720);
    this.root.setScale(scale, scale, 1);
    const bottomClearance = height / 2 - (this.recommendation ? 356 : 334) * scale;
    this.root.setPosition(Math.max(-Math.max(0, width - 1280 * scale) * 0.35, safeLeft + 16 * scale - width / 2 + 551 * scale),
      Math.max(0, safeBottom + 16 * scale - bottomClearance));
    const source = this.artwork.spriteFrame?.originalSize;
    if (source) {
      // Wide phones crop only the quiet sky. Keep the illustrated ground at the bottom,
      // and cap the zoom before the mech's antennae enter the top safety margin.
      const aspect = source.width / source.height;
      const artWidth = Math.min(width, (height * aspect) / 0.8);
      const artHeight = artWidth / aspect;
      this.artwork.node
        .getComponent(UITransform)!
        .setContentSize(artWidth, artHeight);
      this.artwork.node.setPosition(0, Math.max(0, (artHeight - height) / 2));
    }
    this.background.clear();
    this.background.rect(
      -width / 2,
      -height / 2,
      width,
      height,
      palette.paper,
      palette.paper,
      0,
    );
  }

  snapshot() {
    const scale = this.root.scale.x;
    const bounds = (n?: Node) => n ? ({
      x: this.width / 2 + this.root.position.x + n.position.x * scale,
      y: this.height / 2 + this.root.position.y + n.position.y * scale,
      width: n.getComponent(UITransform)!.width * scale,
      height: n.getComponent(UITransform)!.height * scale,
    }) : null;
    return {
      primary: this.startLabel.string,
      artReady: !!this.artwork.spriteFrame,
      scene: this.artwork.spriteFrame?.name ?? "unavailable",
      sourceSize: this.artwork.spriteFrame
        ? {
            width: this.artwork.spriteFrame.originalSize.width,
            height: this.artwork.spriteFrame.originalSize.height,
          }
        : null,
      start: bounds(this.start),
      gameClub: bounds(this.gameClub),
      share: bounds(this.share),
      records: bounds(this.records),
      recommendation: bounds(this.recommendation),
    };
  }

  update(dt: number) {
    this.clock += dt;
    this.arrow.setPosition(105 + Math.sin(this.clock * 2) * 3, 0);
  }
}

import {
  Color,
  Label,
  Node,
  UITransform,
  UIOpacity,
  view,
  Sprite,
  Vec2,
} from "cc";
import { GameConfig as C } from "../core/GameConfig";
import { ReleaseConfig, nextCampaignChapter } from "../core/ReleaseConfig";
import { GameSession } from "../core/GameSession";
import { InputManager } from "../core/InputManager";
import { GameState, InputAction, Rect } from "../core/Types";
import { CocosInputAdapter } from "../platform/CocosInputAdapter";
import { Ink, colors, node } from "../render/Ink";
import { TitlePoster } from "./TitlePoster";
import { JoystickView } from "./JoystickView";
import { controlLayout, SafeInsets } from "./ControlLayout";
import { WeaponArt } from "../render/WeaponArt";
import { ComicAssets, ComicBatch } from "../render/ComicAssets";
import { ColossusBoss } from "../enemy/ColossusBoss";
import { OceanSession } from "../ocean/OceanSession";
import type { FlightSession } from "../flight/FlightSession";
import { OceanBatch } from "../ocean/OceanAssets";
import { ControlArt, controlColors, combatControlColors } from "./ControlSkin";
import { ControlFrameId } from "./ControlFrames";
import { StatusBarCache } from "./StatusBarCache";
import { cooldownRatio, landAttackCooldown } from "./ActionFeedback";
import { PersonalRecords } from "../social/PersonalRecords";
import { formatTime } from "../social/RunRecords";

function text(
  parent: Node,
  s: string,
  x: number,
  y: number,
  size = 22,
  color = colors.ink,
  w = 600,
): Label {
  const n = node(parent, `Text:${s}`, x, y, w, size * 1.6),
    l = n.addComponent(Label);
  l.string = s;
  l.fontSize = size;
  l.lineHeight = size * 1.3;
  l.fontFamily = "sans-serif";
  l.color = color;
  l.overflow = Label.Overflow.SHRINK;
  return l;
}
function createButton(
  parent: Node,
  title: string,
  x: number,
  y: number,
  w: number,
  h: number,
  onClick: () => void,
  dark = false,
  adapter?: CocosInputAdapter,
): Node {
  const n = node(parent, title, x, y, w, h);
  ControlArt.sprite(n, "Generated menu", "menu", w, h);
  text(n, title, 0, 0, 22, controlColors.ink, w - 20).isBold = true;
  adapter?.registerUI(n, onClick);
  return n;
}

/** Persistent UI nodes; panels toggle instead of being recreated every frame/restart. */
export class HUDController {
  personal?: PersonalRecords;
  get combatCeiling() { return this.guardNode.position.y + 539 - 8; }
  weaponStatus() {
    return {
      text: this.weaponLabel.string,
      id: this.lastWeapon,
      frame:
        this.weaponIcon.node.getComponentInChildren(Sprite)?.spriteFrame
          ?.name ?? "legacy",
      switch: {
        x: this.weaponToggle.position.x,
        y: this.weaponToggle.position.y,
      },
    };
  }
  private hud: Node;
  private hudInk: Ink;
  private controls: Node;
  private objective: Label;
  private stats: Label;
  private guardLabel: Label;
  private guardInk: Ink;
  private guardNode: Node;
  private readonly guardCache = new StatusBarCache();
  private panels = new Map<GameState, Node>();
  private resultStats: Label[] = [];
  private reviveAvailable=false;
  private reviveButton: Node;
  private reviveNote: Label;
  private reviveCountdown: Label;
  private touchButtons: {
    action: InputAction;
    node: Node;
    held: boolean;
    key: string;
    cooldownSprite: Sprite;
    cooldownBucket: number;
  }[] = [];
  private lastState: GameState | null = null;
  private lastHealth = -1;
  private lastExit = false;
  private progress = -1;
  private rotateNote: Node;
  private rotateInk: Ink;
  private rotateTitle: Label;
  private rotateSub: Label;
  private panelInk = new Map<GameState, Ink>();
  private levelLabel: Label;
  private width = 1280;
  private height = 720;
  private insets: SafeInsets = { left: 0, right: 0, top: 0, bottom: 0 };
  private joystick: JoystickView;
  private weaponLabel: Label;
  private weaponIcon: Ink;
  private weaponToggle: Node;
  private weaponArt = new WeaponArt();
  private comicWeapon?: ComicBatch;
  private lastWeapon = "";
  private message: Label;
  layout = controlLayout();
  private pauseButton!: Node;
  private feedbackInk!: Ink;
  private feedbackBucket = -1;
  private guide!: Label;
  private pauseGuide!: Label;
  private jumpMode = "jump";
  private touchPaints = 0;
  private titlePoster: TitlePoster;
  private pauseGameClub?: Node;
  private messageBaseY = 534;
  private successCard: Node;
  private successOpacity: UIOpacity;
  private successStats: Label;
  private successActions: Node;
  private cinematicInk: Ink;
  private cinematicText: Label;
  private resultProgress = 0;
  private resultReady = false;
  private chapter = 1;
  private oceanWeapon?: OceanBatch;
  private resultHeader!: Label;
  private resultCaption!: Label;
  private resultPrimary!: Label;
  private resultReplay!: Node;
  private resultHome!: Node;
  private loading!: Node;
  private loadingLabel!: Label;
  private skipDive!: Node;
  private currentOcean?: OceanSession;
  private currentFlight?: FlightSession;
  private oceanVitalsKey = "";
  setChapterLoading(message: string) {
    this.loading.active = !!message;
    this.loadingLabel.string = message;
  }
  releaseOcean(): void {
    this.oceanWeapon?.destroy();
    this.oceanWeapon = undefined;
    this.currentOcean = undefined;
    this.lastWeapon = "";
    this.oceanVitalsKey = "";
  }
  presentationStatus() {
    return {
      chapter: this.chapter,
      cover: "unified-battlefield-v064",
      title: this.titlePoster.snapshot(),
      gameClub: this.gameClubBounds(),
      fullscreenTools: false,
      cinematicVisible: this.cinematicInk.node.active,
      resultProgress: this.resultProgress,
      resultReady: this.resultReady,
      resultPrimary: this.resultPrimary.string,
      resultCaption: this.resultCaption.string,
      skipIntroVisible: this.skipDive.activeInHierarchy,
      bossBar: {
        visible: this.guardNode.activeInHierarchy,
        bottom: this.guardNode.position.y + 539,
        builds: this.guardCache.builds,
        samples: this.guardCache.samples,
      },
      controls: {
        style: "generated-comic-v084",
        artLoaded: ControlArt.ready,
        jumpMode: this.jumpMode,
        guide: this.guide.string,
        guideVisible: this.guide.node.activeInHierarchy,
        damageVisible: this.feedbackInk.node.active,
        paints: {
          actions: this.touchPaints,
          joystick: this.joystick.paintCount,
        },
        buttons: this.touchButtons.map((b) => ({
          action: b.action,
          held: b.held,
          cooldown: b.cooldownBucket,
          label: b.node.getChildByName("Generated button")?.getChildByName("Control label")?.getComponent(Label)?.string,
          frame: b.node.getChildByName("Generated button")?.getComponent(Sprite)
            ?.spriteFrame?.name,
          opacity: b.node.getChildByName("Generated button")?.getComponent(Sprite)?.color.a,
          cooldownOpacity: b.cooldownSprite.color.a,
        })),
      },
      objective: {
        visible: this.objective.node.activeInHierarchy,
        text: this.objective.string,
        x: this.objective.node.position.x,
        y: this.objective.node.position.y,
      },
    };
  }
  constructor(
    parent: Node,
    private adapter: CocosInputAdapter,
    onStart: () => void,
    onPause: () => void,
    onResume: () => void,
    onHome: () => void,
    onMute: () => void = () => {},
    onContinue: () => void = () => {},
    onGameClub?: () => void,
    onShare?: () => void,
    onRecords?: () => void,
    onRevive?: () => void,
    onTitle?: () => void,
    onRecommend?: () => void,
  ) {
    const button = (
      p: Node,
      title: string,
      x: number,
      y: number,
      w: number,
      h: number,
      fn: () => void,
      dark = false,
    ) => createButton(p, title, x, y, w, h, fn, dark, adapter);
    this.hud = node(parent, "HUD");
    this.hudInk = new Ink(this.hud);
    this.levelLabel = text(
      this.hud,
      "废弃前哨站",
      995,
      678,
      34,
      colors.ink,
      350,
    );
    this.pauseButton = node(this.hud, "Pause", 1214, 666, 88, 88);
    ControlArt.sprite(this.pauseButton, "Generated pause", "pause", 72, 72);
    adapter.registerUI(this.pauseButton, onPause);
    this.objective = text(
      this.hud,
      "向右推进 · 击败出口守卫",
      920,
      590,
      26,
      colors.ink,
      620,
    );
    this.stats = text(this.hud, "", 170, 590, 26, colors.ink, 320);
    this.weaponLabel = text(this.hud, "", 300, 640, 32, colors.ink, 570);
    this.weaponIcon = new Ink(node(this.hud, "Current weapon silhouette"));
    this.weaponToggle = node(
      this.hud,
      "Switch tactical knife",
      210,
      640,
      220,
      64,
    );
    adapter.registerUI(this.weaponToggle, () => {
      if (!this.controls.active) return;
      adapter.state.press("tap:weapon", "switchWeapon");
      adapter.state.release("tap:weapon");
    });
    this.message = text(parent, "", 640, 534, 30, colors.ink, 750);
    this.guardNode = node(parent, "Guard health");
    this.guardInk = new Ink(this.guardNode);
    this.guardLabel = text(
      this.guardNode,
      "出口守卫",
      640,
      595,
      28,
      colors.ink,
      350,
    );
    this.controls = node(parent, "Touch controls");
    this.joystick = new JoystickView(this.controls, adapter);
    const touch = (action: InputAction, x: number, y: number, r: number) => {
      const n = node(
        this.controls,
        "Touch:" + action,
        x,
        y,
        r * 2 + 12,
        r * 2 + 12,
      );
      const id =
        action === "shoot"
          ? "attack"
          : action === "grenade"
            ? "grenade"
            : "jump";
      const cap = ControlArt.sprite(n, "Generated button", id, r * 2, r * 2);
      const fillNode = node(cap.node, "Cooldown image fill");
      const cooldownSprite = fillNode.addComponent(Sprite);
      cooldownSprite.sizeMode = Sprite.SizeMode.CUSTOM;
      cooldownSprite.type = Sprite.Type.FILLED;
      cooldownSprite.fillType = Sprite.FillType.RADIAL;
      cooldownSprite.fillCenter = new Vec2(0.5, 0.5);
      cooldownSprite.fillStart = 0.25;
      cooldownSprite.color = combatControlColors.cooldown;
      fillNode.active = false;
      this.adapter.bindButton(n, action);
      this.touchButtons.push({
        action,
        node: n,
        held: false,
        key: "",
        cooldownSprite,
        cooldownBucket: -1,
      });
      this.paintTouch(n, action, false);
    };
    touch("jump", this.layout.jump.x, this.layout.jump.y, 70);
    touch("shoot", this.layout.shoot.x, this.layout.shoot.y, 84);
    touch("grenade", this.layout.grenade.x, this.layout.grenade.y, 54);
    const panel = (state: GameState): Node => {
      const n = node(parent, `Panel:${state}`, 640, 360, C.width, C.height),
        ink = new Ink(n);
      ink.rect(
        -640,
        -360,
        1280,
        720,
        new Color(250, 249, 245, 236),
        new Color(250, 249, 245, 236),
        1,
      );
      n.active = false;
      this.panels.set(state, n);
      this.panelInk.set(state, ink);
      return n;
    };
    this.titlePoster = new TitlePoster(panel("title"), adapter, onTitle ?? onStart, onGameClub, onShare, onRecords, onRecommend);
    const paused = panel("paused");
    text(paused, "暂停一下", 0, 103, 52);
    this.pauseGuide = text(
      paused,
      "空中再点跳＝二段跳   ·   下＋跳＝下台",
      0,
      42,
      18,
      colors.ink,
      660,
    );
    button(paused, "继续突围", 0, -34, 280, 60, onResume, true);
    button(paused, "重新开始", -153, -122, 280, 56, onStart);
    button(paused, "返回首页", 153, -122, 280, 56, onHome);
    button(paused, "切换音效开关", onGameClub ? -153 : 0, -204, 280, onGameClub ? 80 : 48, onMute);
    if (onGameClub)
      this.pauseGameClub = button(paused, "游戏圈", 153, -204, 280, 80, onGameClub);
    if (onShare) button(paused, "分享邀请", onRecords ? -153 : 0, -294, 280, 56, onShare);
    if (onRecords) button(paused, ReleaseConfig.friendLeaderboard ? "纪录与好友榜" : "个人纪录", onShare ? 153 : 0, -294, 280, 56, onRecords);
    const failed = panel("gameover");
    text(failed, "突围失败", 0, 204, 54);
    this.resultStats.push(text(failed, "", 0, 143, 22, colors.muted));
    this.reviveButton=button(failed, "看视频 · 得 1 次复活", 0, 49, 530, 96, ()=>{
      if(this.reviveAvailable && onRevive)onRevive();else onStart();
    }, true);
    this.reviveNote=text(failed, "", 0, -36, 23, colors.muted, 1080);
    button(failed, "重新开始", onShare?-276:-150, -134, onShare?254:280, 92, onStart);
    button(failed, "返回首页", onShare?0:150, -134, onShare?254:280, 92, onHome);
    if(onShare)button(failed, "分享邀请", 276, -134, 254, 92, onShare);
    if(onRecords)button(failed, ReleaseConfig.friendLeaderboard ? "纪录与好友榜" : "个人纪录", 0, -247, 420, 92, onRecords);
    const preparing=panel("reviving");
    this.panelInk.get("reviving")!.clear();
    this.panelInk.get("reviving")!.rect(-370,-84,740,176,colors.ink,colors.paper,3);
    this.reviveCountdown=text(preparing,"准备继续 · 1",0,30,42);
    text(preparing,"满血恢复 · 恢复操作后保护 3 秒",0,-37,24);
    const complete = panel("complete");
    this.panelInk.get("complete")!.clear();
    this.successCard = node(complete, "Victory result card", 310, 0);
    this.successOpacity = this.successCard.addComponent(UIOpacity);
    const card = new Ink(this.successCard);
    card.rect(-197, -290, 394, 514, colors.ink, colors.paper, 4);
    card.rect(-197, 169, 394, 55, colors.ink, colors.ink, 1);
    this.resultHeader = text(
      this.successCard,
      "MISSION COMPLETE  /  01",
      0,
      196,
      15,
      colors.paper,
      355,
    );
    text(this.successCard, "突围成功", 0, 112, 50, colors.ink, 350).isBold =
      true;
    this.resultCaption = text(
      this.successCard,
      "废弃前哨站 · 战线已突破",
      0,
      57,
      17,
      colors.muted,
      355,
    );
    card.segment(-155, 24, 155, 24, 1, colors.far);
    this.successStats = text(this.successCard, "", 0, -26, 19, colors.ink, 350);
    this.successStats.lineHeight = 24;
    this.successStats.node.getComponent(UITransform)!.setContentSize(350, 104);
    this.successActions = node(this.successCard, "Victory actions");
    this.resultPrimary = button(
      this.successActions,
      "进入第二关  →",
      0,
      -109,
      310,
      58,
      () => this.chapter === 3 ? onStart() : onContinue(),
      true,
    ).getComponentInChildren(Label)!;
    this.resultReplay = button(
      this.successActions,
      "重玩本关",
      -82,
      -180,
      150,
      49,
      onStart,
    );
    this.resultHome = button(
      this.successActions,
      "返回首页",
      82,
      -180,
      150,
      49,
      onHome,
    );
    if (onRecords) button(this.successActions, ReleaseConfig.friendLeaderboard ? "纪录榜" : "个人纪录", onShare ? -82 : 0, -250, onShare ? 150 : 310, 49, onRecords);
    if (onShare) button(this.successActions, "分享挑战", 82, -250, 150, 49, onShare);
    this.cinematicInk = new Ink(
      node(parent, "Victory letterbox and impact flash"),
    );
    this.feedbackInk = new Ink(node(parent, "Damage edge feedback"));
    this.guide = text(
      this.controls,
      "空中再点跳＝二段跳   ·   下＋跳＝下台",
      640,
      560,
      22,
      colors.ink,
      1000,
    );
    this.guide.isBold = true;
    this.cinematicText = text(
      this.cinematicInk.node,
      "",
      640,
      600,
      31,
      colors.ink,
      650,
    );
    this.cinematicText.isBold = true;
    this.rotateNote = node(parent, "Rotate device hint");
    this.rotateInk = new Ink(this.rotateNote);
    this.rotateTitle = text(
      this.rotateNote,
      "请旋转设备\n横屏游玩",
      360,
      700,
      54,
      colors.ink,
      620,
    );
    this.rotateTitle.node.getComponent(UITransform)!.setContentSize(620, 160);
    this.rotateSub = text(
      this.rotateNote,
      "战斗已暂停\n旋转后自动恢复",
      360,
      540,
      30,
      colors.muted,
      600,
    );
    this.rotateSub.node.getComponent(UITransform)!.setContentSize(600, 100);
    this.skipDive = button(parent, "跳过入水", 640, 570, 190, 45, () => {
      (this.currentFlight ?? this.currentOcean)?.skipEntry();
      this.adapter.clear();
    },
    );
    this.skipDive.active = false;
    this.loading = node(parent, "Chapter loading", 640, 360);
    const loadingInk = new Ink(this.loading);
    loadingInk.rect(-480, -80, 960, 160, colors.ink, colors.paper, 3);
    this.loadingLabel = text(this.loading, "", 0, 0, 24, colors.ink, 900);
    this.loading.active = false;
    this.applyInsets(this.insets);
  }
  gameClubBounds() {
    if (this.loading?.activeInHierarchy || this.rotateNote.activeInHierarchy) return undefined;
    const target = [this.titlePoster.gameClub, this.pauseGameClub].find((n) => n?.activeInHierarchy);
    if (!target) return undefined;
    const transform = target.getComponent(UITransform)!;
    const width = transform.width * Math.abs(target.worldScale.x);
    const height = transform.height * Math.abs(target.worldScale.y);
    return { left: target.worldPosition.x + this.width / 2 - width / 2,
      top: this.height / 2 - target.worldPosition.y - height / 2, width, height };
  }
  updateRevival(s: GameSession | OceanSession | FlightSession, wechat = false): void {
    const revival="revival" in s?s.revival:undefined;
    this.reviveAvailable=!!revival && (!!revival.remaining || wechat && revival.canWatchVideo);
    this.reviveButton.getComponentInChildren(Label)!.string=revival?.remaining
      ? "原地复活 · 满血继续"
      : revival && wechat && revival.canWatchVideo?"看视频 · 得 1 次复活":"重新开始  →";
    this.reviveNote.string=revival?.error || (revival?.remaining?"已获得 1 次机会 · 满血继续 · 使用复活不计最快纪录"
      : revival && wechat?revival.canWatchVideo?`每看完一条视频得 1 次 · 本关已领取 ${revival.videos}/${revival.videoLimit} 次`
        : `本关 ${revival.videoLimit} 次视频复活已用完，可重新开始`
      : "视频复活请在微信内体验，也可以重新开始");
    this.reviveCountdown.string=`准备继续 · ${Math.max(1,Math.ceil(revival?.preparation ?? 1))}`;
    this.titlePoster.setUnlocked(this.personal?.records.cleared ?? 0);
  }
  private updateVictory(
    s: GameSession | OceanSession | FlightSession,
    portrait: boolean,
  ): void {
    const v = s.victory;
    this.cinematicInk.node.active =
      v.active && s.state !== "paused" && !portrait;
    if (this.cinematicInk.node.active) {
      const ink = this.cinematicInk;
      ink.clear();
      ink.rect(0, 0, this.width, 31, colors.ink, colors.ink, 1);
      ink.rect(0, this.height - 31, this.width, 31, colors.ink, colors.ink, 1);
      if (v.flash > 0) {
        const flash = new Color(255, 255, 255, Math.round(110 * v.flash));
        ink.rect(0, 0, this.width, this.height, flash, flash, 1);
      }
      this.cinematicText.string =
        v.phase === "collapse" && v.time > 1.37
          ? this.chapter === 3 ? "抵达接应点" : "目标摧毁"
          : v.phase === "cheer"
            ? this.chapter === 3 ? "试飞完成" : "我们，突围了。"
            : "";
    }
    this.resultProgress =
      s.state === "complete" ? (v.active ? v.resultProgress : 1) : 0;
    this.resultReady = s.state === "complete" && (!v.active || v.resultsReady);
    const p = this.resultProgress,
      scale = Math.min(1, this.width / 1280, this.height / 720);
    this.successCard.setPosition((310 + (1 - p) * 100) * scale, 0);
    const cardScale = scale * (0.94 + 0.06 * p);
    this.successCard.setScale(cardScale, cardScale, 1);
    this.successOpacity.opacity = Math.round(255 * p);
    const kills = s instanceof GameSession ? s.spawner.kills : s.kills;
    const record = this.personal?.result;
    this.successStats.string = record
      ? `用时 ${formatTime(record.ms)}${record.valid ? record.best ? " · 新纪录" : "" : record.reason === "revived" ? " · 复活通关" : " · 练习"}\n${record.reason === "revived" ? "本局不计最快纪录" : `最佳 ${formatTime(this.personal?.records.times[record.chapter]?.ms)}`}\n击败 ${Math.floor(kills * p)} · 剩余生命 ${"♥".repeat(Math.floor(s.player.health * p))}`
      : `用时 ${Math.floor(s.time)} 秒 · 击败 ${Math.floor(kills * p)}\n剩余生命 ${"♥".repeat(Math.floor(s.player.health * p))}`;
    const challenge = this.personal?.challenge;
    if (record && challenge?.kind === "challenge" && challenge.chapter === record.chapter && challenge.targetMs) {
      const delta = record.ms - challenge.targetMs;
      this.successStats.string += `\n${challenge.oldRule || !record.valid ? "参考目标" : delta === 0 ? "追平目标" : delta < 0 ? "快于目标" : "距离目标"} ${formatTime(challenge.oldRule || !record.valid ? challenge.targetMs : Math.abs(delta) || challenge.targetMs)}`;
    }
    this.successActions.active = this.resultReady;
  }
  private paintTouch(
    n: Node,
    action: InputAction,
    held: boolean,
    disabled = false,
    count = "",
    knife = false,
    water = false,
    jumpMode = "jump",
    flight = false,
  ): void {
    this.touchPaints++;
    const p =
      action === "shoot"
        ? this.layout.shoot
        : action === "grenade"
          ? this.layout.grenade
          : this.layout.jump;
    const r = p.r,
      k = this.layout.joystick.unit;
    const id: ControlFrameId =
      action === "shoot"
        ? knife
          ? "knife"
          : "attack"
        : action === "grenade"
          ? "grenade"
          : water || flight
            ? "dash"
            : jumpMode === "double"
                ? "doubleJump"
                : "jump";
    const cap = ControlArt.sprite(n, "Generated button", id, r * 2, r * 2);
    cap.color = disabled
      ? combatControlColors.disabled
      : held
        ? combatControlColors.pressed
        : combatControlColors.normal;
    cap.node.setScale(held ? 0.96 : 1, held ? 0.96 : 1, 1);
    cap.node.setPosition(0, held ? -1.4 * k : 0);
    let label = cap.node.getChildByName("Control label")?.getComponent(Label);
    if (!label)
      label = text(cap.node, "", 0, 0, 12 * k, controlColors.ink, r * 1.45);
    label.node.name = "Control label";
    label.string =
      action === "shoot"
        ? knife
          ? "斩击"
          : "攻击"
        : action === "grenade"
          ? flight
            ? "空爆弹"
            : water
            ? "手雷"
            : "手雷"
          : flight
            ? "闪避"
            : water
            ? "冲刺"
            : jumpMode === "double"
                ? "二段跳"
                : jumpMode === "drop"
                  ? "下台"
                : jumpMode === "spent"
                  ? "落地恢复"
                  : "跳跃";
    label.fontSize =
      (action === "shoot" ? 13 : action === "grenade" ? 11 : 12) * k;
    label.lineHeight = 14 * k;
    label.isBold = true;
    label.color = controlColors.ink;
    label.node.setPosition(0, -r * 0.53);
    label.node.getComponent(UITransform)!.setContentSize(r * 1.45, 18 * k);
    if (action === "grenade") {
      let badge = n.getChildByName("Inventory badge");
      if (!badge) badge = node(n, "Inventory badge");
      badge.setPosition(r * 0.63, r * 0.66);
      ControlArt.sprite(badge, "Generated badge", "badge", 18 * k, 18 * k);
      let number = badge.getChildByName("Control count")?.getComponent(Label);
      if (!number)
        number = text(badge, "", 0, 0, 10 * k, controlColors.ink, 16 * k);
      number.node.name = "Control count";
      number.string = count;
      number.isBold = true;
      number.fontSize = 10 * k;
      number.lineHeight = 12 * k;
      number.node.getComponent(UITransform)!.setContentSize(16 * k, 16 * k);
    }
  }
  private paintCooldown(
    b: HUDController["touchButtons"][number],
    cooldown: number,
  ): void {
    const bucket = Math.ceil(Math.max(0, Math.min(1, cooldown)) * 8);
    const cap = b.node
      .getChildByName("Generated button")!
      .getComponent(Sprite)!;
    const p =
      b.action === "shoot"
        ? this.layout.shoot
        : b.action === "grenade"
          ? this.layout.grenade
          : this.layout.jump;
    // Cocos clips a duplicate of the generated image radially. No code-drawn
    // rings, icons or button plates. The number badge stays above this layer.
    if (
      bucket === b.cooldownBucket &&
      b.cooldownSprite.spriteFrame === cap.spriteFrame
    )
      return;
    b.cooldownBucket = bucket;
    b.cooldownSprite.node.active = bucket > 0;
    b.cooldownSprite.spriteFrame = cap.spriteFrame;
    b.cooldownSprite.node
      .getComponent(UITransform)!
      .setContentSize(p.r * 2, p.r * 2);
    b.cooldownSprite.fillRange = -bucket / 8;
  }
  private updateFeedback(
    s: GameSession | OceanSession | FlightSession,
    portrait: boolean,
  ): void {
    const active =
      !portrait &&
      (s.state === "playing" || s.state === "dying") &&
      !s.victory.active &&
      s.player.hitTime > 0;
    this.feedbackInk.node.active = active;
    const bucket = active ? Math.ceil(s.player.hitTime / 0.022) : 0;
    if (bucket === this.feedbackBucket) return;
    this.feedbackBucket = bucket;
    this.feedbackInk.clear();
    if (!active) return;
    const k = this.layout.joystick.unit,
      a = Math.round((115 * bucket) / 10),
      c = new Color(160, 44, 35, a);
    // Screen-edge marks leave the play field and every thumb target legible.
    const pad = 6 * k,
      len = 46 * k;
    for (const x of [pad, this.width - pad])
      for (const y of [pad, this.height - pad]) {
        const dx = x < this.width / 2 ? 1 : -1,
          dy = y < this.height / 2 ? 1 : -1;
        this.feedbackInk.segment(x, y, x + dx * len, y, 5 * k, c);
        this.feedbackInk.segment(x, y, x, y + dy * len, 5 * k, c);
      }
    const top = this.height - this.insets.top;
    this.feedbackInk.segment(
      this.insets.left + 18 * k,
      top - 46 * k,
      this.insets.left + 120 * k,
      top - 46 * k,
      3 * k,
      c,
    );
  }
  applyInsets(
    insets: SafeInsets,
    width = 1280,
    height = 720,
    menu?: Rect,
  ): void {
    this.guardCache.invalidate();
    this.width = width;
    this.height = height;
    this.loading?.setPosition(width / 2, height / 2);
    this.skipDive?.setPosition(width / 2, height - 150);
    this.layout = controlLayout(
      insets,
      width,
      height,
      view.getFrameSize().height,
      menu,
    );
    // HUD, hit regions and thumb controls consume the same sanitized edges.
    insets = this.insets = this.layout.safeInsets;
    this.adapter.touch.configure(width, height, this.layout, insets);
    this.joystick.configure(this.layout.joystick);
    this.joystick.node.setPosition(
      this.layout.joystick.x,
      this.layout.joystick.y,
    );
    for (const b of this.touchButtons) {
      const p =
        b.action === "jump"
          ? this.layout.jump
          : b.action === "shoot"
            ? this.layout.shoot
            : this.layout.grenade;
      b.node.setPosition(p.x, p.y);
      b.node.getComponent(UITransform)!.setContentSize(p.hit, p.hit);
      b.key = "";
      b.cooldownBucket = -1;
      this.paintTouch(b.node, b.action, false);
    }
    this.pauseButton.setPosition(this.layout.pause.x, this.layout.pause.y);
    this.pauseButton.setScale(
      this.layout.pause.hit / 88,
      this.layout.pause.hit / 88,
      1,
    );
    const top = height - insets.top;
    const k = this.layout.joystick.unit;
    const extraRow = this.layout.hud.secondRow ? 24 * k : 0;
    this.feedbackBucket = -1;
    this.guide.node.setPosition(width / 2, top - (95 * k + extraRow));
    this.guide.fontSize = 12 * k;
    this.guide.lineHeight = 16 * k;
    this.guide.node
      .getComponent(UITransform)!
      .setContentSize(Math.min(width - 32 * k, 450 * k), 38 * k);
    this.adapter.touch.hudHeight = 52 * k + extraRow;
    this.weaponIcon.node.setPosition(161 * k + insets.left, top - 22 * k);
    this.weaponToggle.setPosition(210 * k + insets.left, top - 25 * k);
    this.weaponToggle
      .getComponent(UITransform)!
      .setContentSize(220 * k, 64 * k);
    this.weaponIcon.node.setScale(1.3 * k, 1.3 * k, 1);
    this.weaponLabel.node.setPosition(280 * k + insets.left, top - 25 * k);
    this.weaponLabel.fontSize = 14 * k;
    this.weaponLabel.lineHeight = 18 * k;
    this.weaponLabel.node
      .getComponent(UITransform)!
      .setContentSize(142 * k, 42 * k);
    this.levelLabel.node.setPosition(this.layout.hud.levelX, top - 18 * k);
    this.levelLabel.fontSize = 14 * k;
    this.levelLabel.lineHeight = 18 * k;
    this.levelLabel.node
      .getComponent(UITransform)!
      .setContentSize(this.layout.hud.levelWidth, 26 * k);
    this.objective.node.setPosition(
      this.layout.hud.objectiveX,
      top - (extraRow ? 63 : 25) * k,
    );
    this.objective.fontSize = 12 * k;
    this.objective.lineHeight = 16 * k;
    this.objective.node
      .getComponent(UITransform)!
      .setContentSize(this.layout.hud.objectiveWidth, 25 * k);
    this.stats.node.active = false;
    this.messageBaseY = top - 63 * k - extraRow;
    this.message.node.setPosition(width / 2, this.messageBaseY);
    this.message.fontSize = 13 * k;
    this.message.lineHeight = 17 * k;
    this.message.node
      .getComponent(UITransform)!
      .setContentSize(Math.min(width - 40 * k, 600 * k), 30 * k);
    this.guardNode.setPosition(width / 2 - 640, top - 70 * k - 565 - extraRow);
    this.guardLabel.node.setPosition(640, 565);
    this.guardLabel.fontSize = 16 * k;
    this.guardLabel.lineHeight = 20 * k;
    this.guardLabel.node
      .getComponent(UITransform)!
      .setContentSize(380 * k, 30 * k);
    for (const [state, p] of this.panels) {
      p.setPosition(width / 2, height / 2);
      const ink = this.panelInk.get(state)!;
      ink.clear();
      if (state === "reviving") ink.rect(-370,-84,740,176,colors.ink,colors.paper,3);
      else if (state !== "complete")
        ink.rect(
          -width / 2,
          -height / 2,
          width,
          height,
          colors.paper,
          colors.paper,
          1,
        );
    }
    this.titlePoster.resize(width, height, this.insets.bottom, this.insets.left);
    this.cinematicText.node.setPosition(width / 2, height - 110);
    this.rotateNote.getComponent(UITransform)!.setContentSize(width, height);
    this.rotateNote.getComponent(UITransform)!.setAnchorPoint(0, 0);
    this.rotateInk.clear();
    this.rotateInk.rect(0, 0, width, height, colors.paper, colors.paper, 1);
    const cx = width / 2,
      cy = height / 2;
    this.rotateInk.rect(cx - 52, cy + 170, 104, 170, colors.ink, undefined, 7);
    this.rotateInk.line(
      [
        { x: cx + 84, y: cy + 292 },
        { x: cx + 124, y: cy + 240 },
        { x: cx + 84, y: cy + 208 },
      ],
      7,
    );
    this.rotateTitle.node.setPosition(cx, cy + 30);
    this.rotateSub.node.setPosition(cx, cy - 140);
    this.lastHealth = this.progress = -1;
    this.oceanVitalsKey = "";
  }
  updateOcean(s: OceanSession, input: InputManager, portrait: boolean): void {
    this.message.node.setPosition(this.width / 2, this.messageBaseY);
    this.chapter = 2;
    this.currentFlight = undefined;
    this.updateFeedback(s, portrait);
    this.guide.node.active = false;
    this.jumpMode = "boost";
    this.pauseGuide.string =
      "摇杆确定方向   ·   冲刺键加速   ·   近身攻击自动用刀";
    this.currentOcean = s;
    this.resultHeader.string = "MISSION COMPLETE  /  02";
    this.resultReplay.active = true;
    const next = nextCampaignChapter(2);
    this.resultReplay.setPosition(next ? -82 : 0, -180);
    this.resultHome.active = !!next;
    this.resultHome.setPosition(82, -180);
    this.resultCaption.string = "深海突围 · 潜艇已沉没";
    this.resultPrimary.string = next ? "进入第三关  →" : "返回首页  →";
    this.hud.active =
      (s.state === "playing" || s.state === "dying" || s.state === "paused") &&
      !s.victory.active &&
      !portrait;
    this.controls.active = s.controlEnabled && !portrait;
    this.adapter.touch.enabled = this.controls.active;
    this.skipDive.active =
      s.introActive && s.introSeen && s.state === "playing" && !portrait;
    this.skipDive.getComponentInChildren(Label)!.string = "跳过入水";
    this.rotateNote.active = portrait;
    this.stats.node.active = false;
    this.weaponLabel.string = `${s.weaponName}\n${s.weapon === "harpoon" ? "∞ 鱼叉" : s.weapon === "knife" ? "切回水下枪" : s.ammo + " 发"}${s.weapon === "knife" ? "" : " · 切刀"}`;
    if (this.lastWeapon !== `ocean:${s.weapon}`) {
      this.weaponIcon.clear();
      this.comicWeapon?.begin();
      this.comicWeapon?.end();
      this.oceanWeapon ??= new OceanBatch(this.weaponIcon.node);
      this.oceanWeapon.begin();
      this.oceanWeapon.put(s.weaponIcon, -5, 0, 52);
      this.oceanWeapon.end();
      this.lastWeapon = `ocean:${s.weapon}`;
    }
    this.levelLabel.string = `关卡 02 · ${Math.floor((s.player.x / s.level.width) * 100)}%`;
    this.objective.node.active = !portrait;
    this.objective.string = s.introActive ? "穿戴装备 · 准备入海" : `${s.zone.name} · 向右潜行 →`;
    this.message.node.active =
      s.state === "playing" &&
      s.messageTime > 0 &&
      !(s.boss.active && s.boss.hp > 0) &&
      !(s.mini.active && s.mini.hp > 0) &&
      !portrait &&
      !s.victory.active;
    this.message.string = s.message;
    this.joystick.update(input);
    this.updateVictory(s, portrait);
    for (const [state, panel] of this.panels)
      panel.active = state === s.state && !portrait;
    this.lastState = null; // Returning to land must repaint its panels and cached vitals.
    this.lastHealth = this.progress = -1;
    const encounter =
      s.boss.active && s.boss.hp > 0
        ? s.boss
        : s.mini.active && s.mini.hp > 0
          ? s.mini
          : null;
    this.guardNode.active =
      !!encounter && s.state === "playing" && !s.victory.active && !portrait;
    if (this.guardNode.active && encounter) {
      const bw = 350 * this.layout.joystick.unit;
      this.paintGuard(encounter, encounter.hp, encounter.maxHp, bw, 8);
      const attacks = {
        cannon: "锁线机炮",
        fan: "扇形重炮",
        torpedo: "鱼雷齐射",
        laser: "蓄能激光",
        sweep: "上方扫描 · 下潜躲避",
        ring: "压力环 · 进入缺口",
      };
      this.guardLabel.string =
        encounter === s.boss
          ? `巨型潜艇 · 阶段 ${s.boss.phase} · ${s.boss.mode === "tell" ? "预警：" : ""}${attacks[s.boss.attack]}`
          : `铁壳号 · 驾驶潜艇 · ${{ torpedo: "双管鱼雷", sonar: "声波扇射", dash: "船首冲撞" }[s.mini.attack] ?? "准备接敌"}${s.mini.mode === "tell" ? "预警" : ""}`;
    }
    this.paintFreeVitals(s);
    for (const stat of this.resultStats)
      stat.string = `深海突围 · ${formatTime(this.personal?.clock.milliseconds)} · 击败 ${s.kills}`;
    for (const b of this.touchButtons) {
      const held = input.isHeld(b.action),
        disabled =
          b.action === "jump"
            ? s.boostCooldown > 0
            : b.action === "grenade"
              ? s.player.grenades === 0
              : !s.player.alive;
      const key = `water:${held}:${disabled}:${s.weapon}:${s.player.grenades}`;
      if (key !== b.key) {
        this.paintTouch(
          b.node, b.action, held, disabled, String(s.player.grenades),
          s.weapon === "knife", true,
        );
        b.held = held;
        b.key = key;
      }
      const cooldown = b.action === "jump" ? s.boostCooldown / 2
        : b.action === "shoot" ? cooldownRatio(s.cooldown, s.attackCooldownDuration) : 0;
      this.paintCooldown(b, cooldown);
    }
  }
  private paintFreeVitals(s: OceanSession | FlightSession): void {
    const k = this.layout.joystick.unit,
      top = this.height - this.insets.top;
    const progress = Math.floor((this.layout.hud.trackWidth * s.player.x) / s.level.width);
    const vitalsKey = `${this.chapter}:${s.player.health}:${progress}:${s.zone.name}:${this.width}:${top}:${k}`;
    if (vitalsKey !== this.oceanVitalsKey) {
      this.oceanVitalsKey = vitalsKey;
      this.hudInk.clear();
      this.hudInk.rect(
        0,
        top - 52 * k,
        this.width,
        52 * k,
        colors.far,
        colors.paper,
        1,
      );
      for (let i = 0; i < 5; i++) {
        const x = (24 + i * 20) * k + this.insets.left,
          y = top - 26 * k,
          g = this.hudInk.g;
        g.moveTo(x, y - 8 * k);
        g.bezierCurveTo(
          x - 18 * k,
          y + 4 * k,
          x - 7 * k,
          y + 16 * k,
          x,
          y + 7 * k,
        );
        g.bezierCurveTo(
          x + 7 * k,
          y + 16 * k,
          x + 18 * k,
          y + 4 * k,
          x,
          y - 8 * k,
        );
        g.close();
        g.fillColor = i < s.player.health ? colors.ink : colors.paper;
        g.fill();
        g.strokeColor = colors.ink;
        g.lineWidth = 1.5 * k;
        g.stroke();
      }
      const tx = this.layout.hud.trackX,
        ty = top - 37 * k;
      this.hudInk.segment(tx, ty, tx + this.layout.hud.trackWidth, ty, 3 * k, colors.far);
      this.hudInk.segment(tx, ty, tx + progress, ty, 3 * k);
      for (const z of s.level.zones)
        this.hudInk.circle(
          tx + (z.start / s.level.width) * this.layout.hud.trackWidth,
          ty,
          2.5 * k,
          colors.ink,
          s.player.x >= z.start ? colors.ink : colors.paper,
          1,
        );
    }
  }
  updateFlight(s: FlightSession, input: InputManager, portrait: boolean): void {
    this.message.node.setPosition(this.width / 2, this.messageBaseY);
    this.chapter = 3;
    this.currentOcean = undefined;
    this.currentFlight = s;
    this.updateFeedback(s, portrait);
    this.jumpMode = "dodge";
    this.pauseGuide.string = "摇杆上下左右飞行 · 闪避短喷 · J攻击 / 空格闪避 / K空爆弹";
    this.guide.node.active = s.controlEnabled && s.time < 17 && s.messageTime <= 0 &&
      !s.boss.active && !portrait;
    this.guide.string = "摇杆自由飞行 · 松手悬停 · 闪避短喷";
    this.resultHeader.string = "MISSION COMPLETE  /  03";
    this.resultCaption.string = "云端突围 · 抵达接应点";
    this.resultPrimary.string = "再飞一次  →";
    this.resultReplay.active = false;
    this.resultHome.active = true;
    this.resultHome.setPosition(0, -180);
    this.hud.active = (s.state === "playing" || s.state === "dying" || s.state === "paused") &&
      !s.victory.active && !portrait;
    this.controls.active = s.controlEnabled && !portrait;
    this.adapter.touch.enabled = this.controls.active;
    this.skipDive.active = s.introActive && s.introSeen && s.state === "playing" && !portrait;
    this.skipDive.getComponentInChildren(Label)!.string = "跳过起飞";
    this.rotateNote.active = portrait;
    this.stats.node.active = false;
    this.weaponLabel.string = `${s.weaponName}\n${s.weapon === "rifle" ? "∞ 弹药" : s.weapon === "knife" ? "切回枪械" : s.ammo + " 发"}${s.weapon === "knife" ? "" : " · 切刀"}`;
    if (this.lastWeapon !== `flight:${s.weapon}`) {
      this.weaponIcon.clear();
      this.oceanWeapon?.begin();
      this.oceanWeapon?.end();
      this.comicWeapon ??= new ComicBatch(this.weaponIcon.node, "HUD weapon");
      this.comicWeapon.begin();
      this.comicWeapon.put(s.weaponIcon, -5, 0, 52, undefined, 0, 255, 1, [0.5, 0.5]);
      this.comicWeapon.end();
      this.lastWeapon = `flight:${s.weapon}`;
    }
    this.levelLabel.string = `关卡 03 · ${Math.min(100, Math.floor(s.player.x / s.level.width * 100))}%`;
    this.objective.node.active = !portrait;
    this.objective.string = `${s.zone.name} · 向右突围 →`;
    this.message.node.active = s.state === "playing" && s.messageTime > 0 &&
      !(s.boss.active && s.boss.hp > 0) && !portrait && !s.victory.active;
    this.message.string = s.message;
    this.joystick.update(input);
    this.updateVictory(s, portrait);
    for (const [state, panel] of this.panels) panel.active = state === s.state && !portrait;
    this.lastState = null;
    this.lastHealth = this.progress = -1;
    this.guardNode.active = s.boss.active && s.boss.hp > 0 && s.state === "playing" &&
      !s.victory.active && !portrait;
    if (this.guardNode.active) {
      this.paintGuard(s.boss, s.boss.hp, s.boss.maxHp, 350 * this.layout.joystick.unit, 8);
      const attacks = { burst: "锁高度点射", missiles: "双导弹", sweep: "水平掠袭", dive: "斜向俯冲" };
      this.guardLabel.string = `猎隼 · 小 BOSS · ${s.boss.mode === "tell" ? "预警 " : ""}${attacks[s.boss.attack]}`;
    }
    this.paintFreeVitals(s);
    for (const stat of this.resultStats)
      stat.string = `云端突围 · ${Math.floor(s.time)} 秒 · 击败 ${s.kills}`;
    for (const b of this.touchButtons) {
      const held = input.isHeld(b.action),
        disabled = b.action === "jump" ? s.dodgeCooldown > 0
          : b.action === "grenade" ? s.player.grenades === 0 : !s.player.alive;
      const key = `flight:${held}:${disabled}:${s.weapon}:${s.player.grenades}`;
      if (key !== b.key) {
        this.paintTouch(b.node, b.action, held, disabled, String(s.player.grenades), s.weapon === "knife", false, "dodge", true);
        b.held = held;
        b.key = key;
      }
      this.paintCooldown(b, b.action === "jump" ? cooldownRatio(s.dodgeCooldown, s.dodgeDuration)
        : b.action === "shoot" ? cooldownRatio(s.cooldown, s.attackCooldownDuration) : 0);
    }
  }
  update(
    s: GameSession,
    input: InputManager,
    portrait: boolean,
    dt = 1 / 60,
  ): void {
    this.chapter = 1;
    this.currentFlight = undefined;
    this.updateFeedback(s, portrait);
    this.pauseGuide.string =
      "空中再点跳＝二段跳   ·   向下＋跳跃＝下台";
    this.guide.node.active = s.time < 14 && s.player.x < 900;
    this.guide.string = "空中再点跳＝二段跳   ·   下＋跳＝下台";
    this.jumpMode =
      !s.player.grounded
          ? s.player.airJumpsRemaining > 0
            ? "double"
            : "spent"
          : s.player.crouched && s.level.dropSurfaces(s.player).length > 0 ? "drop" : "jump";
    this.oceanVitalsKey = "";
    this.skipDive.active = false;
    this.currentOcean = undefined;
    this.resultReplay.active = true;
    this.resultReplay.setPosition(-82, -180);
    this.resultHome.active = true;
    this.resultHome.setPosition(82, -180);
    this.resultHeader.string = "MISSION COMPLETE  /  01";
    this.resultCaption.string = "废弃前哨站 · 战线已突破";
    this.resultPrimary.string = "进入第二关  →";
    this.oceanWeapon?.begin();
    this.oceanWeapon?.end();
    this.hud.active =
      (s.state === "playing" || s.state === "dying" || s.state === "paused") &&
      !s.victory.active;
    this.controls.active =
      s.state === "playing" && !portrait && !s.victory.active;
    this.adapter.touch.enabled = this.controls.active;
    const presentation = s.weapon.presentation;
    this.weaponLabel.string = `${presentation.name}\n${presentation.ammoText}${s.weapon.id === "knife" ? "" : " · 切刀"}`;
    if (this.lastWeapon !== s.weapon.id) {
      this.weaponIcon.clear();
      if (ComicAssets.enabled) {
        this.comicWeapon ??= new ComicBatch(this.weaponIcon.node, "HUD weapon");
        this.comicWeapon.begin();
        this.comicWeapon.put(
          presentation.icon,
          -5,
          0,
          52,
          undefined,
          0,
          255,
          1,
          [0.5, 0.5],
        );
        this.comicWeapon.end();
      } else this.weaponArt.draw(this.weaponIcon, s.weapon.id, 0, 0);
      this.lastWeapon = s.weapon.id;
    }
    this.levelLabel.string = `关卡 01 · ${Math.floor((s.player.x / s.level.data.width) * 100)}%`;
    this.objective.node.active = !portrait && !s.bossFraming;
    this.message.node.setPosition(this.width / 2,
      s.bossFraming ? this.guardNode.position.y + 480 : this.messageBaseY);
    this.message.node.active =
      s.state === "playing" &&
      (!s.bossFraming || s.pickups.messageTime > 0) &&
      !(s.spawner.miniBoss?.active && s.spawner.miniBoss.alive) &&
      (s.pickups.messageTime > 0 || s.combo > 1);
    this.message.string =
      s.pickups.messageTime > 0 ? s.pickups.lastMessage : `COMBO × ${s.combo}`;
    this.joystick.update(input);
    this.rotateNote.active = portrait;
    if (s.state === "title") this.titlePoster.update(dt);
    this.updateVictory(s, portrait);
    if (portrait) {
      this.hud.active =
        this.guardNode.active =
        this.message.node.active =
          false;
      for (const p of this.panels.values()) p.active = false;
      this.lastState = null;
      return;
    }
    const encounter =
      s.spawner.guard.active && s.spawner.guard.alive
        ? s.spawner.guard
        : s.spawner.miniBoss?.active && s.spawner.miniBoss.alive
          ? s.spawner.miniBoss
          : null;
    this.guardNode.active = s.state === "playing" && !!encounter;
    if (this.guardNode.active) {
      const bw = 320 * this.layout.joystick.unit;
      this.paintGuard(
        encounter!,
        encounter!.health,
        encounter!.maxHealth,
        bw,
        7 * this.layout.joystick.unit,
      );
      const name =
        encounter!.kind === "colossus" ? "重装裁决者" : "铁犀巡逻车 · 小 BOSS";
      const attack = encounter
        ? ` · ${encounter.windup > 0 ? "预警 " : ""}${
            encounter.attackName
          }`
        : "";
      this.guardLabel.string = `${name} · 阶段 ${encounter!.phase}  ${Math.ceil(encounter!.health)} / ${encounter!.maxHealth}${attack}`;
    }
    if (this.lastState !== s.state) {
      for (const [state, p] of this.panels) p.active = state === s.state;
      this.lastState = s.state;
    }
    // Only rebuild the vector HUD when the visible progress line advances a pixel.
    const trackWidth = this.layout.hud.trackWidth;
    const progress = Math.floor((s.player.x / s.level.data.width) * trackWidth);
    if (this.lastHealth !== s.player.health || this.progress !== progress) {
      this.hudInk.clear();
      const top = this.height - this.insets.top;
      const k = this.layout.joystick.unit;
      this.hudInk.rect(
        0,
        top - 52 * k,
        this.width,
        52 * k,
        colors.far,
        colors.paper,
        2,
      );
      for (let i = 0; i < C.player.maxHealth; i++) {
        const x = (24 + i * 20) * k + this.insets.left,
          y = top - 26 * k;
        const g = this.hudInk.g;
        g.moveTo(x, y - 8 * k);
        g.bezierCurveTo(
          x - 18 * k,
          y + 4 * k,
          x - 7 * k,
          y + 16 * k,
          x,
          y + 7 * k,
        );
        g.bezierCurveTo(
          x + 7 * k,
          y + 16 * k,
          x + 18 * k,
          y + 4 * k,
          x,
          y - 8 * k,
        );
        g.close();
        g.fillColor = i < s.player.health ? colors.ink : colors.paper;
        g.fill();
        g.strokeColor = colors.ink;
        g.lineWidth = 1.5 * k;
        g.stroke();
      }
      const trackX = this.layout.hud.trackX,
        trackY = top - 37 * k;
      this.hudInk.segment(
        trackX,
        trackY,
        trackX + this.layout.hud.trackWidth,
        trackY,
        3 * k,
        colors.far,
      );
      this.hudInk.segment(trackX, trackY, trackX + progress, trackY, 3 * k);
      for (const zone of s.level.data.zones ?? [])
        this.hudInk.circle(
          trackX + (zone.start / s.level.data.width) * this.layout.hud.trackWidth,
          trackY,
          2.5 * k,
          colors.ink,
          s.player.x >= zone.start ? colors.ink : colors.paper,
          1.3 * k,
        );
      this.lastHealth = s.player.health;
      this.progress = progress;
    }
    const zone = s.level.zone;
    this.objective.string = s.level.retreatLimit > 0 && s.player.x < s.level.retreatLimit + 80
      ? "后方已封锁 · 向右突围 →"
      : s.level.guardDefeated
      ? "裁决者已击毁 · 抵达出口 →"
      : s.level.arenaEntered
        ? s.spawner.guard.mode === "entering"
          ? "警报 · 重装裁决者启动"
          : s.spawner.guard.action === "stomp"
            ? "重踏预警 · 跳过地波"
            : s.spawner.guard.action === "sweep"
              ? "锁定炮击 · 及时换位"
              : "齐射预警 · 离开落点"
        : `${zone?.name ?? "向右推进"} · 向右突围 →`;
    this.stats.string = `击败  ${s.spawner.kills} / ${s.spawner.enemies.length}`;
    for (const stat of this.resultStats)
      stat.string = `用时 ${formatTime(this.personal?.clock.milliseconds)}    ·    击败 ${s.spawner.kills} 名敌人`;
    for (const b of this.touchButtons) {
      const held = input.isHeld(b.action);
      const disabled =
        b.action === "grenade"
          ? s.player.grenades === 0
          : b.action === "jump"
            ? !s.player.canJump
            : !s.player.alive;
      const cooldown =
        b.action === "grenade"
          ? s.grenades.cooldown / C.grenade.interval
          : b.action === "shoot"
            ? landAttackCooldown(s)
            : 0;
      const key = `${held}:${disabled}:${s.weapon.id}:${this.jumpMode}:${b.action === "grenade" ? s.player.grenades : ""}`;
      if (key !== b.key) {
        this.paintTouch(
          b.node,
          b.action,
          held,
          disabled,
          String(s.player.grenades),
          s.weapon.id === "knife",
          false,
          this.jumpMode,
        );
        b.held = held;
        b.key = key;
      }
      this.paintCooldown(b, cooldown);
    }
  }
  private paintGuard(
    owner: object,
    health: number,
    maximum: number,
    width: number,
    height: number,
  ): void {
    if (!this.guardCache.changed(owner, health, maximum, width, height)) return;
    this.guardInk.clear();
    this.guardInk.rect(
      640 - width / 2,
      539,
      width,
      height,
      colors.ink,
      colors.paper,
      2,
    );
    this.guardInk.rect(
      640 - width / 2,
      539,
      width * cooldownRatio(health, maximum),
      height,
      colors.ink,
      colors.ink,
      1,
    );
  }
}

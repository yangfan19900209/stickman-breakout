import { Color, Label, Node, UITransform, view, Sprite } from "cc";
import { GameConfig as C } from "../core/GameConfig";
import { GameSession } from "../core/GameSession";
import { InputManager } from "../core/InputManager";
import { GameState, InputAction } from "../core/Types";
import { CocosInputAdapter } from "../platform/CocosInputAdapter";
import { Ink, colors, node } from "../render/Ink";
import { StickmanRenderer } from "../render/StickmanRenderer";
import { JoystickView } from "./JoystickView";
import { controlLayout, SafeInsets } from "./ControlLayout";
import { PlatformAdapter } from "../platform/PlatformAdapter";
import { WeaponArt } from "../render/WeaponArt";
import { ComicAssets, ComicBatch } from "../render/ComicAssets";
import { ColossusBoss } from "../enemy/ColossusBoss";

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
  const n = node(parent, title, x, y, w, h),
    ink = new Ink(n);
  ink.rect(
    -w / 2,
    -h / 2,
    w,
    h,
    colors.ink,
    dark ? colors.ink : colors.paper,
    4,
  );
  text(n, title, 0, 0, 22, dark ? colors.paper : colors.ink, w - 12);
  adapter?.registerUI(n, onClick);
  return n;
}

/** Persistent UI nodes; panels toggle instead of being recreated every frame/restart. */
export class HUDController {
  weaponStatus() {
    return { text:this.weaponLabel.string, id:this.lastWeapon,
      frame:this.weaponIcon.node.getComponentInChildren(Sprite)?.spriteFrame?.name??"legacy",
      switch:{x:this.weaponToggle.position.x,y:this.weaponToggle.position.y} };
  }
  private hud: Node;
  private hudInk: Ink;
  private controls: Node;
  private objective: Label;
  private stats: Label;
  private guardLabel: Label;
  private guardInk: Ink;
  private guardNode: Node;
  private panels = new Map<GameState, Node>();
  private resultStats: Label[] = [];
  private touchButtons: {
    action: InputAction;
    ink: Ink;
    held: boolean;
    key: string;
    cooldownInk: Ink;
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
  private platformTools: Node;
  private platformHint: Label;
  constructor(
    parent: Node,
    private adapter: CocosInputAdapter,
    onStart: () => void,
    onPause: () => void,
    onResume: () => void,
    onHome: () => void,
    onMute: () => void = () => {},
    platform = new PlatformAdapter(),
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
    const pauseArt = new Ink(this.pauseButton);
    pauseArt.g.roundRect(-42, -42, 84, 84, 12);
    pauseArt.g.fillColor = colors.paper;
    pauseArt.g.fill();
    pauseArt.g.strokeColor = colors.ink;
    pauseArt.g.lineWidth = 5;
    pauseArt.g.stroke();
    pauseArt.rect(-14, -17, 9, 34, colors.ink, colors.ink, 1);
    pauseArt.rect(5, -17, 9, 34, colors.ink, colors.ink, 1);
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
    this.weaponToggle = node(this.hud,"Switch tactical knife",210,640,220,64);
    adapter.registerUI(this.weaponToggle,()=>{
      if(!this.controls.active)return;
      adapter.state.press("tap:weapon","switchWeapon");adapter.state.release("tap:weapon");
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
          `Touch:${action}`,
          x,
          y,
          r * 2 + 12,
          r * 2 + 12,
        ),
        ink = new Ink(n);
      adapter.bindButton(n, action);
      this.touchButtons.push({
        action,
        ink,
        held: false,
        key: "",
        cooldownInk: new Ink(node(n, "Cooldown arc")),
        cooldownBucket: -1,
      });
      this.paintTouch(ink, action, false);
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
    const title = panel("title"),
      art = new Ink(node(title, "Title stickman"));
    art.line(
      [
        { x: -486, y: -167 },
        { x: -213, y: -167 },
      ],
      3,
    );
    const hero = node(title, "Hero illustration", -380, -160);
    hero.setScale(2.7, 2.7, 1);
    new StickmanRenderer().draw(
      new Ink(hero),
      {
        x: 0,
        y: 0,
        facing: 1,
        animation: "Run",
        animationTime: 0.45,
        recoil: 0,
        deadTime: 0,
      },
      0,
    );
    art.line(
      [
        { x: -245, y: -42 },
        { x: -221, y: -42 },
      ],
      3,
    );
    art.line(
      [
        { x: -238, y: -65 },
        { x: -216, y: -65 },
      ],
      2,
    );
    art.line(
      [
        { x: -445, y: -16 },
        { x: -465, y: -16 },
      ],
      2,
      colors.muted,
    );
    text(title, "STICKMAN BREAKOUT", -341, 155, 15, colors.muted, 450);
    text(title, "线条突围", 120, 122, 72, colors.ink, 660);
    text(title, "一根线，也能冲出包围。", 120, 46, 23, colors.muted, 640);
    text(title, "01 / 废弃前哨站", 116, -17, 18, colors.ink, 520);
    text(
      title,
      "击碎箱子，引爆油桶，冲出前哨站。",
      122,
      -56,
      18,
      colors.muted,
      600,
    );
    button(title, "开始突围  →", 120, -128, 300, 62, onStart, true);
    text(
      title,
      "A D 移动 · Space 二段跳 · J 普攻 · Q 切刀 / 回枪",
      120,
      -204,
      17,
      colors.muted,
      760,
    );
    text(
      title,
      "手机轻触武器栏切刀，长按普攻连斩 · L 拔刀攻击 · P 暂停",
      120,
      -239,
      14,
      colors.muted,
      760,
    );
    text(title, "V0.5.7  /  原图武器动作与新地形", -368, -270, 16, colors.muted, 390);
    const paused = panel("paused");
    text(paused, "暂停一下", 0, 103, 52);
    text(paused, "战场等你回来。", 0, 42, 20, colors.muted);
    button(paused, "继续突围", 0, -34, 280, 60, onResume, true);
    button(paused, "重新开始", -153, -122, 280, 56, onStart);
    button(paused, "返回首页", 153, -122, 280, 56, onHome);
    button(paused, "切换音效开关", 0, -204, 280, 48, onMute);
    text(paused, "P / Esc 继续", 0, -269, 15, colors.muted);
    for (const state of ["gameover", "complete"] as const) {
      const p = panel(state);
      text(p, state === "complete" ? "突围成功" : "突围失败", 0, 114, 58);
      text(
        p,
        state === "complete"
          ? "守卫已击败，出口已抵达。"
          : "倒下之后，还可以再来一次。",
        0,
        47,
        22,
        colors.muted,
      );
      this.resultStats.push(text(p, "", 0, -10, 18, colors.muted));
      button(p, "重新开始  →", 0, -89, 300, 62, onStart, true);
      button(p, "返回首页", 0, -167, 300, 54, onHome);
    }
    this.platformTools = node(parent, "Fullscreen and home screen tools");
    button(this.platformTools, "进入全屏", 140, 0, 200, 54, () => {
      void platform
        .enterFullscreen()
        .then((result) => (this.platformHint.string = result.message));
    });
    button(this.platformTools, "主屏幕说明", -100, 0, 230, 54, () => {
      this.platformHint.string =
        platform.status().mode === "standalone"
          ? "已独立运行；系统状态栏仍由系统管理。"
          : "iPhone/iPad：Safari 分享 → 添加到主屏幕 → 从游戏图标启动。";
    });
    this.platformHint = text(
      this.platformTools,
      platform.status().ios && platform.status().mode === "browser"
        ? "Safari：添加到主屏幕后可独立启动，移除浏览器工具栏。"
        : "支持的浏览器可进入全屏；主屏幕模式与普通网页不同。",
      0,
      -52,
      21,
      colors.muted,
      1000,
    );
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
    this.applyInsets(this.insets);
  }
  private paintTouch(
    ink: Ink,
    action: InputAction,
    held: boolean,
    disabled = false,
    count = "",
    knife = false,
  ): void {
    ink.clear();
    const p =
        action === "shoot"
          ? this.layout.shoot
          : action === "grenade"
            ? this.layout.grenade
            : this.layout.jump,
      r = p.r,
      k = this.layout.joystick.unit,
      color = disabled ? colors.far : colors.paper;
    ink.circle(
      0,
      0,
      r,
      disabled ? colors.mid : colors.ink,
      new Color(30, 30, 30, disabled ? 115 : held ? 245 : 210),
      (action === "shoot" ? 3 : 2.6) * k,
    );
    ink.circle(
      0,
      0,
      r - 5 * k,
      new Color(250, 249, 245, held ? 200 : 95),
      undefined,
      1 * k,
    );
    const q = r * 0.36;
    if (action === "shoot") {
      if(knife) {
        ink.line([{x:-q,y:-q*.5},{x:q,y:q},{x:q*.5,y:0},{x:-q,y:-q*.5}],2.4*k,color);
        ink.segment(-q*1.1,-q*.7,-q*.5,-q*.1,4*k,color);
      } else {
      ink.circle(0, 5 * k, q, color, undefined, 2.2 * k);
      for (const d of [-1, 1]) {
        ink.segment(d * q * 0.72, 5 * k, d * q * 1.55, 5 * k, 2.2 * k, color);
        ink.segment(
          0,
          5 * k + d * q * 0.72,
          0,
          5 * k + d * q * 1.55,
          2.2 * k,
          color,
        );
      }
      ink.circle(0, 5 * k, 2 * k, color, color, 1);
      }
    } else if (action === "jump") {
      ink.line(
        [
          { x: 0, y: -q * 0.7 },
          { x: 0, y: q },
          { x: -q * 0.65, y: q * 0.3 },
        ],
        3 * k,
        color,
      );
      ink.segment(0, q, q * 0.65, q * 0.3, 3 * k, color);
    } else {
      ink.ellipse(0, -q * 0.1, q * 0.7, q * 0.85, color, undefined, 2.8 * k);
      ink.line(
        [
          { x: -q * 0.2, y: q * 0.65 },
          { x: -q * 0.2, y: q * 1.15 },
          { x: q * 0.28, y: q * 1.15 },
          { x: q * 0.28, y: q * 0.65 },
        ],
        2.3 * k,
        color,
      );
      ink.segment(q * 0.28, q * 1.12, q * 0.9, q * 1.4, 2.3 * k, color);
    }
    let label = ink.node.getComponentInChildren(Label);
    if (!label)
      label = text(ink.node, "", 0, -r * 0.56, 13 * k, color, r * 1.7);
    label.string =
      action === "shoot"
        ? knife ? "斩击" : "普攻"
        : action === "grenade"
          ? `雷 ${count}`
          : "跳跃";
    label.fontSize = (action === "shoot" ? 15 : 13) * k;
    label.lineHeight = 16 * k;
    label.color = color;
    label.node.setPosition(0, -r * 0.55);
    label.node.getComponent(UITransform)!.setContentSize(r * 1.7, 22 * k);
  }
  applyInsets(insets: SafeInsets, width = 1280, height = 720): void {
    this.width = width;
    this.height = height;
    this.insets = insets;
    this.layout = controlLayout(
      insets,
      width,
      height,
      view.getFrameSize().height,
    );
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
      b.ink.node.setPosition(p.x, p.y);
      b.ink.node.getComponent(UITransform)!.setContentSize(p.hit, p.hit);
      b.key = "";
      b.cooldownBucket = -1;
      this.paintTouch(b.ink, b.action, false);
    }
    this.pauseButton.setPosition(this.layout.pause.x, this.layout.pause.y);
    this.pauseButton.setScale(
      this.layout.pause.hit / 88,
      this.layout.pause.hit / 88,
      1,
    );
    const top = height - insets.top;
    const k = this.layout.joystick.unit;
    this.adapter.touch.hudHeight = 52 * k;
    this.platformTools.setPosition(width / 2, top - 44);
    this.platformTools.setScale(
      Math.max(1, (44 * k) / 54),
      Math.max(1, (44 * k) / 54),
      1,
    );
    this.weaponIcon.node.setPosition(161 * k + insets.left, top - 22 * k);
    this.weaponToggle.setPosition(210*k+insets.left,top-25*k);
    this.weaponToggle.getComponent(UITransform)!.setContentSize(220*k,64*k);
    this.weaponIcon.node.setScale(1.3 * k, 1.3 * k, 1);
    this.weaponLabel.node.setPosition(280 * k + insets.left, top - 25 * k);
    this.weaponLabel.fontSize = 14 * k;
    this.weaponLabel.lineHeight = 18 * k;
    this.weaponLabel.node
      .getComponent(UITransform)!
      .setContentSize(142 * k, 42 * k);
    this.levelLabel.node.setPosition(
      width - 125 * k - insets.right,
      top - 18 * k,
    );
    this.levelLabel.fontSize = 14 * k;
    this.levelLabel.lineHeight = 18 * k;
    this.levelLabel.node
      .getComponent(UITransform)!
      .setContentSize(132 * k, 26 * k);
    this.objective.node.setPosition(width * 0.6, top - 25 * k);
    this.objective.fontSize = 12 * k;
    this.objective.lineHeight = 16 * k;
    this.objective.node
      .getComponent(UITransform)!
      .setContentSize(180 * k, 25 * k);
    this.stats.node.active = false;
    this.message.node.setPosition(width / 2, top - 63 * k);
    this.message.fontSize = 13 * k;
    this.message.lineHeight = 17 * k;
    this.message.node
      .getComponent(UITransform)!
      .setContentSize(Math.min(width - 40 * k, 600 * k), 30 * k);
    this.guardNode.setPosition(width / 2 - 640, top - 70 * k - 565);
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
  }
  update(s: GameSession, input: InputManager, portrait: boolean): void {
    this.hud.active =
      s.state === "playing" || s.state === "dying" || s.state === "paused";
    this.controls.active = s.state === "playing" && !portrait;
    this.adapter.touch.enabled = this.controls.active;
    const presentation = s.weapon.presentation;
    this.weaponLabel.string = `${presentation.name}\n${presentation.ammoText}${s.weapon.id==="knife"?"":" · 切刀"}`;
    if (this.lastWeapon !== s.weapon.id) {
      this.weaponIcon.clear();
      if (ComicAssets.enabled) {
        this.comicWeapon ??= new ComicBatch(this.weaponIcon.node, "HUD weapon");
        this.comicWeapon.begin();
        this.comicWeapon.put(presentation.icon, -5, 0, 52,undefined,0,255,1,[.5,.5]);
        this.comicWeapon.end();
      } else this.weaponArt.draw(this.weaponIcon, s.weapon.id, 0, 0);
      this.lastWeapon = s.weapon.id;
    }
    this.levelLabel.string = `关卡 01 · ${Math.floor((s.player.x / s.level.data.width) * 100)}%`;
    this.objective.node.active =
      this.width / this.layout.joystick.unit >= 800 && !s.level.arenaEntered;
    this.message.node.active =
      s.state === "playing" &&
      !s.level.arenaEntered &&
      (s.pickups.messageTime > 0 || s.combo > 1);
    this.message.string =
      s.pickups.messageTime > 0 ? s.pickups.lastMessage : `COMBO × ${s.combo}`;
    this.joystick.update(input);
    this.rotateNote.active = portrait;
    this.platformTools.active =
      !portrait && (s.state === "title" || s.state === "paused");
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
      this.guardInk.clear();
      const bw = 320 * this.layout.joystick.unit;
      this.guardInk.rect(
        640 - bw / 2,
        539,
        bw,
        7 * this.layout.joystick.unit,
        colors.ink,
        colors.paper,
        2,
      );
      this.guardInk.rect(
        640 - bw / 2,
        539,
        (bw * encounter!.health) / encounter!.maxHealth,
        7 * this.layout.joystick.unit,
        colors.ink,
        colors.ink,
        1,
      );
      const name =
        encounter!.kind === "colossus" ? "重装裁决者" : "巡逻战车 · 小 BOSS";
      const attack=encounter instanceof ColossusBoss?` · ${encounter.windup>0?'预警 ':''}${encounter.attackName}`:'';
      this.guardLabel.string = `${name} · 阶段 ${encounter!.phase}  ${Math.ceil(encounter!.health)} / ${encounter!.maxHealth}${attack}`;
    }
    if (this.lastState !== s.state) {
      for (const [state, p] of this.panels) p.active = state === s.state;
      this.lastState = s.state;
    }
    const progress = Math.floor((s.player.x / s.level.data.width) * this.width);
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
      const trackX = this.width - this.insets.right - 182 * k,
        trackY = top - 37 * k;
      this.hudInk.segment(
        trackX,
        trackY,
        trackX + 112 * k,
        trackY,
        3 * k,
        colors.far,
      );
      this.hudInk.segment(
        trackX,
        trackY,
        trackX + (112 * k * progress) / this.width,
        trackY,
        3 * k,
      );
      for (let n = 0; n < 4; n++)
        this.hudInk.circle(
          trackX + (n * 112 * k) / 3,
          trackY,
          2.5 * k,
          colors.ink,
          n / 3 <= progress / this.width ? colors.ink : colors.paper,
          1.3 * k,
        );
      this.lastHealth = s.player.health;
      this.progress = progress;
    }
    const zone = s.level.zone;
    this.objective.string = s.level.guardDefeated
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
      stat.string = `耗时 ${Math.floor(s.time)} 秒    ·    击败 ${s.spawner.kills} 名敌人`;
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
            ? Math.min(1,s.weapon.cooldown / (s.weapon.id==="knife"?C.melee.combo[Math.max(0,s.melee.stage-1)].duration+(s.melee.stage===3?.14:0):C.weapons[s.weapon.id].interval))
            : 0;
      const key = `${held}:${disabled}:${s.weapon.id}:${b.action === "grenade" ? s.player.grenades : ""}`;
      if (key !== b.key) {
        this.paintTouch(
          b.ink,
          b.action,
          held,
          disabled,
          String(s.player.grenades),
          s.weapon.id === "knife",
        );
        b.held = held;
        b.key = key;
      }
      const bucket = Math.ceil(cooldown * 3);
      if (bucket !== b.cooldownBucket) {
        b.cooldownInk.clear();
        if (bucket > 0) {
          const r =
              b.action === "shoot"
                ? this.layout.shoot.r
                : this.layout.grenade.r,
            g = b.cooldownInk.g,
            k = this.layout.joystick.unit;
          g.lineWidth = 3 * k;
          g.strokeColor = colors.mid;
          g.arc(
            0,
            0,
            r - 5 * k,
            Math.PI / 2,
            Math.PI / 2 - (Math.PI * 2 * bucket) / 3,
            true,
          );
          g.stroke();
        }
        b.cooldownBucket = bucket;
      }
    }
  }
}

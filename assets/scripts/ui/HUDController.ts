import { Color, Label, Node, EventTouch, UITransform } from "cc";
import { GameConfig as C } from "../core/GameConfig";
import { GameSession } from "../core/GameSession";
import { InputManager } from "../core/InputManager";
import { GameState, InputAction } from "../core/Types";
import { CocosInputAdapter } from "../platform/CocosInputAdapter";
import { Ink, colors, node } from "../render/Ink";
import { StickmanRenderer } from "../render/StickmanRenderer";
import { JoystickView } from "./JoystickView";
import { controlLayout, SafeInsets } from "./ControlLayout";

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
function button(
  parent: Node,
  title: string,
  x: number,
  y: number,
  w: number,
  h: number,
  onClick: () => void,
  dark = false,
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
  n.on(Node.EventType.TOUCH_START, (e: EventTouch) => {
    e.propagationStopped = true;
  });
  n.on(Node.EventType.TOUCH_END, (e: EventTouch) => {
    e.propagationStopped = true;
    onClick();
  });
  return n;
}

/** Persistent UI nodes; panels toggle instead of being recreated every frame/restart. */
export class HUDController {
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
  private touchButtons: { action: InputAction; ink: Ink; held: boolean }[] = [];
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
  private message: Label;
  layout = controlLayout();
  private pauseButton!: Node;
  constructor(
    parent: Node,
    adapter: CocosInputAdapter,
    onStart: () => void,
    onPause: () => void,
    onResume: () => void,
    onHome: () => void,
    onMute: () => void = () => {},
  ) {
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
    this.pauseButton = button(this.hud, "Ⅱ", 1214, 666, 88, 88, onPause);
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
      this.touchButtons.push({ action, ink, held: false });
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
      n.on(Node.EventType.TOUCH_START, (e: EventTouch) => {
        e.propagationStopped = true;
      });
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
      "A D 移动   ·   Space 跳跃   ·   按住 J 射击",
      120,
      -204,
      17,
      colors.muted,
      760,
    );
    text(
      title,
      "P / Esc 暂停   ·   手机支持多点触控   ·   Enter 开始",
      120,
      -239,
      14,
      colors.muted,
      760,
    );
    text(title, "V0.2.1  /  墨线行动", -368, -270, 16, colors.muted, 390);
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
    this.rotateNote.on(Node.EventType.TOUCH_START, (e: EventTouch) => {
      e.propagationStopped = true;
    });
    this.applyInsets(this.insets);
  }
  private paintTouch(ink: Ink, action: InputAction, held: boolean): void {
    ink.clear();
    const radius = action === "shoot" ? 76 : action === "grenade" ? 48 : 62,
      color = held ? colors.paper : colors.ink;
    ink.circle(
      0,
      0,
      radius,
      new Color(24, 24, 24, 230),
      held ? new Color(24, 24, 24, 230) : new Color(250, 249, 245, 222),
      5,
    );
    if (action === "grenade") {
      ink.circle(0, -3, 12, color, undefined, 3);
      ink.line(
        [
          { x: -4, y: 9 },
          { x: -4, y: 17 },
          { x: 5, y: 17 },
          { x: 5, y: 9 },
        ],
        2,
        color,
      );
      ink.line(
        [
          { x: 5, y: 16 },
          { x: 14, y: 22 },
        ],
        2,
        color,
      );
    } else if (action === "left" || action === "right") {
      const d = action === "left" ? -1 : 1;
      ink.line(
        [
          { x: -13 * d, y: 0 },
          { x: 13 * d, y: 0 },
          { x: 2 * d, y: 11 },
        ],
        3,
        color,
      );
      ink.line(
        [
          { x: 13 * d, y: 0 },
          { x: 2 * d, y: -11 },
        ],
        3,
        color,
      );
    } else if (action === "jump") {
      ink.line(
        [
          { x: 0, y: -14 },
          { x: 0, y: 14 },
          { x: -12, y: 2 },
        ],
        3,
        color,
      );
      ink.line(
        [
          { x: 0, y: 14 },
          { x: 12, y: 2 },
        ],
        3,
        color,
      );
    } else {
      ink.circle(0, 0, 14, color, undefined, 2.5);
      ink.line(
        [
          { x: -23, y: 0 },
          { x: -10, y: 0 },
        ],
        2,
        color,
      );
      ink.line(
        [
          { x: 10, y: 0 },
          { x: 23, y: 0 },
        ],
        2,
        color,
      );
      ink.line(
        [
          { x: 0, y: -23 },
          { x: 0, y: -10 },
        ],
        2,
        color,
      );
      ink.line(
        [
          { x: 0, y: 10 },
          { x: 0, y: 23 },
        ],
        2,
        color,
      );
    }
    const label =
      action === "shoot" ? "射击" : action === "grenade" ? "手雷" : "跳跃";
    // Labels live inside the visual circle, and share its position on every layout.
    let l = ink.node.getComponentInChildren(Label);
    if (!l)
      l = text(ink.node, label, 0, -radius * 0.55, 23, color, radius * 1.8);
    l.color = color;
  }
  applyInsets(insets: SafeInsets, width = 1280, height = 720): void {
    this.width = width;
    this.height = height;
    this.insets = insets;
    this.layout = controlLayout(insets, width, height);
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
    }
    this.pauseButton.setPosition(this.layout.pause.x, this.layout.pause.y);
    const top = height - insets.top;
    this.weaponLabel.node.setPosition(300 + insets.left, top - 80);
    this.levelLabel.node.setPosition(width - 320 - insets.right, top - 40);
    this.objective.node.setPosition(width - 342 - insets.right, top - 132);
    this.stats.node.setPosition(174 + insets.left, top - 132);
    this.message.node.setPosition(width / 2, top - 188);
    this.guardLabel.node.setPosition(width / 2, top - 155);
    this.guardNode.setPosition(width / 2 - 640, top - 720);
    this.guardLabel.node.setPosition(640, 565);
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
    this.weaponLabel.string = `${s.weapon.id === "rifle" ? "自动步枪" : s.weapon.id === "shotgun" ? "霰弹枪" : "火箭筒"}  ${s.weapon.ammo < 0 ? "∞" : s.weapon.ammo}   ·   手雷 ${s.player.grenades}`;
    this.message.node.active =
      s.state === "playing" && (s.pickups.messageTime > 0 || s.combo > 1);
    this.message.string =
      s.pickups.messageTime > 0 ? s.pickups.lastMessage : `COMBO × ${s.combo}`;
    this.joystick.update(input);
    this.rotateNote.active = portrait;
    if (portrait) {
      this.hud.active =
        this.guardNode.active =
        this.message.node.active =
          false;
      for (const p of this.panels.values()) p.active = false;
      this.lastState = null;
      return;
    }
    this.guardNode.active =
      s.state === "playing" && s.level.arenaEntered && s.spawner.guard.alive;
    if (this.guardNode.active) {
      this.guardInk.clear();
      this.guardInk.rect(470, 539, 340, 12, colors.ink, colors.paper, 3);
      this.guardInk.rect(
        470,
        539,
        (340 * s.spawner.guard.health) / s.spawner.guard.maxHealth,
        12,
        colors.ink,
        colors.ink,
        1,
      );
      this.guardLabel.string = `履带战车 · 阶段 ${s.spawner.guard.phase}  ${Math.ceil(s.spawner.guard.health)} / ${s.spawner.guard.maxHealth}`;
    }
    if (this.lastState !== s.state) {
      for (const [state, p] of this.panels) p.active = state === s.state;
      this.lastState = s.state;
    }
    const progress = Math.floor((s.player.x / s.level.data.width) * this.width);
    if (this.lastHealth !== s.player.health || this.progress !== progress) {
      this.hudInk.clear();
      const top = this.height - this.insets.top;
      this.hudInk.rect(
        0,
        top - 108,
        this.width,
        108,
        colors.far,
        colors.paper,
        2,
      );
      for (let i = 0; i < C.player.maxHealth; i++) {
        const x = 70 + this.insets.left + i * 42,
          y = top - 40;
        const points = [
          { x: x - 9, y: y + 3 },
          { x: x - 9, y: y + 9 },
          { x: x - 5, y: y + 12 },
          { x, y: y + 7 },
          { x: x + 5, y: y + 12 },
          { x: x + 9, y: y + 9 },
          { x: x + 9, y: y + 3 },
          { x, y: y - 7 },
          { x: x - 9, y: y + 3 },
        ];
        if (i < s.player.health) this.hudInk.polygon(points);
        this.hudInk.line(
          points,
          4,
          i < s.player.health ? colors.ink : colors.far,
        );
      }
      this.hudInk.line(
        [
          { x: 0, y: top - 108 },
          { x: progress, y: top - 108 },
        ],
        5,
        colors.ink,
      );
      this.lastHealth = s.player.health;
      this.progress = progress;
    }
    const zone = s.level.zone;
    let remaining = 0;
    for (const e of s.spawner.enemies)
      if (e.alive && zone && e.spawn.x >= zone.start && e.spawn.x < zone.end)
        remaining++;
    this.objective.string = s.level.guardDefeated
      ? "战车已击毁 · 抵达出口 →"
      : s.level.arenaEntered
        ? "躲开落点预警 · 击毁机械战车"
        : `${zone?.name ?? "向右推进"} · ${remaining} 名敌人 · 清敌解除封锁`;
    this.stats.string = `击败  ${s.spawner.kills} / ${s.spawner.enemies.length}`;
    for (const stat of this.resultStats)
      stat.string = `耗时 ${Math.floor(s.time)} 秒    ·    击败 ${s.spawner.kills} 名敌人`;
    for (const b of this.touchButtons) {
      const held = input.isHeld(b.action);
      if (held !== b.held) {
        b.ink.node.setScale(held ? 0.94 : 1, held ? 0.94 : 1, 1);
        this.paintTouch(b.ink, b.action, held);
        b.held = held;
      }
    }
  }
}

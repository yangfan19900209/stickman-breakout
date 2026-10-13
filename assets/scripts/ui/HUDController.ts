import { Color, Label, Node, EventTouch } from "cc";
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
    2,
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
    text(this.hud, "线条突围", 92, 687, 23, colors.ink, 160);
    text(this.hud, "生命", 220, 686, 14, colors.muted, 80);
    text(this.hud, "废弃前哨站", 1050, 689, 22, colors.ink, 185);
    this.pauseButton = button(this.hud, "Ⅱ", 1204, 686, 54, 44, onPause);
    this.objective = text(
      this.hud,
      "向右推进 · 击败出口守卫",
      982,
      620,
      16,
      colors.muted,
      480,
    );
    this.stats = text(this.hud, "", 112, 620, 15, colors.muted, 170);
    this.weaponLabel = text(this.hud, "", 680, 686, 17, colors.ink, 450);
    this.message = text(parent, "", 640, 560, 22, colors.ink, 750);
    this.guardNode = node(parent, "Guard health");
    this.guardInk = new Ink(this.guardNode);
    this.guardLabel = text(
      this.guardNode,
      "出口守卫",
      640,
      595,
      17,
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
    touch("jump", 1034, 170, 48);
    touch("shoot", 1162, 100, 58);
    touch("grenade", 934, 92, 38);
    text(
      this.controls,
      "拖动移动 · 下蹲 / 上瞄",
      160,
      15,
      12,
      colors.muted,
      280,
    );
    text(this.controls, "按住高跳", 1034, 111, 12, colors.muted, 100);
    text(this.controls, "按住 J", 1162, 25, 12, colors.muted, 100);
    text(this.controls, "手雷 K", 934, 42, 12, colors.muted, 100);
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
    text(title, "V0.2  /  墨线行动", -368, -270, 13, colors.muted, 390);
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
    const hintInk = new Ink(this.rotateNote);
    hintInk.rect(320, 480, 640, 50, colors.ink, colors.paper, 1);
    text(this.rotateNote, "横屏体验更好，请旋转设备", 640, 505, 21);
  }
  private paintTouch(ink: Ink, action: InputAction, held: boolean): void {
    ink.clear();
    const radius = action === "shoot" ? 57 : action === "grenade" ? 35 : 47,
      color = held ? colors.paper : new Color(24, 24, 24, 170);
    ink.circle(
      0,
      0,
      radius,
      new Color(24, 24, 24, 140),
      held ? new Color(24, 24, 24, 210) : new Color(250, 249, 245, 205),
      2,
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
  }
  applyInsets(insets: SafeInsets): void {
    this.layout = controlLayout(insets);
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
    }
    this.pauseButton.setPosition(this.layout.pause.x, this.layout.pause.y);
  }
  update(s: GameSession, input: InputManager, portrait: boolean): void {
    this.hud.active =
      s.state === "playing" || s.state === "dying" || s.state === "paused";
    this.controls.active = s.state === "playing";
    this.weaponLabel.string = `${s.weapon.id === "rifle" ? "自动步枪" : s.weapon.id === "shotgun" ? "霰弹枪" : "火箭筒"}  ${s.weapon.ammo < 0 ? "∞" : s.weapon.ammo}   ·   手雷 ${s.player.grenades}`;
    this.message.node.active =
      s.state === "playing" && (s.pickups.messageTime > 0 || s.combo > 1);
    this.message.string =
      s.pickups.messageTime > 0 ? s.pickups.lastMessage : `COMBO × ${s.combo}`;
    this.joystick.update(input);
    this.rotateNote.active = portrait;
    this.guardNode.active =
      s.state === "playing" && s.level.arenaEntered && s.spawner.guard.alive;
    if (this.guardNode.active) {
      this.guardInk.clear();
      this.guardInk.rect(470, 569, 340, 5, colors.muted, colors.paper, 1);
      this.guardInk.rect(
        470,
        569,
        (340 * s.spawner.guard.health) / s.spawner.guard.maxHealth,
        5,
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
    const progress = Math.floor((s.player.x / s.level.data.width) * 1280);
    if (this.lastHealth !== s.player.health || this.progress !== progress) {
      this.hudInk.clear();
      this.hudInk.rect(0, 654, 1280, 66, colors.far, colors.paper, 1);
      this.hudInk.line(
        [
          { x: 180, y: 675 },
          { x: 180, y: 700 },
        ],
        1,
        colors.far,
      );
      for (let i = 0; i < C.player.maxHealth; i++) {
        const x = 270 + i * 33,
          y = 683;
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
          2,
          i < s.player.health ? colors.ink : colors.far,
        );
      }
      this.hudInk.line(
        [
          { x: 0, y: 654 },
          { x: progress, y: 654 },
        ],
        2,
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

import {
  _decorator,
  Canvas,
  Camera,
  Color,
  Component,
  game,
  Layers,
  ResolutionPolicy,
  UITransform,
  view,
  profiler,
} from "cc";
import { GameConfig as C } from "./core/GameConfig";
import { InputManager } from "./core/InputManager";
import { GameSession } from "./core/GameSession";
import { Ink, node } from "./render/Ink";
import { StickmanRenderer } from "./render/StickmanRenderer";
import { LevelRenderer } from "./render/LevelRenderer";
import { PlatformBridge } from "./platform/PlatformBridge";
import { CombatRenderer } from "./render/CombatRenderer";
import { CocosInputAdapter } from "./platform/CocosInputAdapter";
import { HUDController } from "./ui/HUDController";
const { ccclass } = _decorator;
@ccclass("GameManager")
export class GameManager extends Component {
  private controls = new InputManager();
  private session = new GameSession();
  private platform = new PlatformBridge();
  private adapter!: CocosInputAdapter;
  private hud!: HUDController;
  private actors!: Ink;
  private effects!: Ink;
  private map!: LevelRenderer;
  private renderer = new StickmanRenderer();
  private combatRenderer = new CombatRenderer();
  private accumulator = 0;
  private ready = false;
  private lastState = this.session.state;
  onLoad(): void {
    try {
      this.initialize();
      this.ready = true;
      console.info(
        "[Breakout] V0.1 ready; fixed simulation 120Hz, render 60FPS.",
      );
    } catch (error) {
      console.error("[Breakout] Initialization failed", error);
      throw error;
    }
  }
  private initialize(): void {
    view.setDesignResolutionSize(C.width, C.height, ResolutionPolicy.SHOW_ALL);
    game.frameRate = C.fps;
    profiler.hideStats();
    const canvasNode = node(this.node, "Canvas", 0, 0, C.width, C.height),
      canvas = canvasNode.addComponent(Canvas);
    const cameraNode = node(canvasNode, "Camera");
    cameraNode.setPosition(0, 0, 1000);
    const camera = cameraNode.addComponent(Camera);
    camera.projection = Camera.ProjectionType.ORTHO;
    camera.orthoHeight = C.height / 2;
    camera.visibility = Layers.Enum.UI_2D;
    camera.clearColor = new Color(250, 249, 245);
    camera.clearFlags = Camera.ClearFlag.SOLID_COLOR;
    canvas.cameraComponent = camera;
    const board = node(
      canvasNode,
      "Screen",
      -C.width / 2,
      -C.height / 2,
      C.width,
      C.height,
    );
    board.getComponent(UITransform)!.setAnchorPoint(0, 0);
    this.map = new LevelRenderer(board, this.session.level);
    this.actors = new Ink(node(board, "Stickmen"));
    this.effects = new Ink(node(board, "Combat effects"));
    this.adapter = new CocosInputAdapter(this.controls, () => this.enter());
    this.hud = new HUDController(
      board,
      this.adapter,
      () => this.startRun(),
      () => this.togglePause(),
      () => this.resume(),
      () => this.home(),
    );
    this.platform.install(
      () => {
        this.adapter.hidden();
        this.session.pause();
        this.accumulator = 0;
      },
      () => this.session.snapshot(),
    );
  }
  private enter(): void {
    if (
      this.session.state === "title" ||
      this.session.state === "gameover" ||
      this.session.state === "complete"
    )
      this.startRun();
    else if (this.session.state === "paused") this.resume();
  }
  private startRun(): void {
    this.adapter.clear();
    this.accumulator = 0;
    this.session.reset();
    console.info("[Breakout] New run: Abandoned Base.");
  }
  private home(): void {
    this.adapter.clear();
    this.accumulator = 0;
    this.session.reset("title");
  }
  private resume(): void {
    this.adapter.clear();
    this.accumulator = 0;
    this.session.resume();
  }
  private togglePause(): void {
    if (this.session.state === "paused") this.resume();
    else {
      this.session.pause();
      this.adapter.clear();
      this.accumulator = 0;
    }
  }
  update(dt: number): void {
    if (!this.ready) return;
    if (this.controls.consumePause()) this.togglePause();
    if (this.session.state === "playing" || this.session.state === "dying") {
      this.accumulator += Math.min(C.maxFrameDelta, Math.max(0, dt));
      while (this.accumulator >= C.fixedStep) {
        this.session.update(C.fixedStep, this.controls.consume());
        this.accumulator -= C.fixedStep;
      }
    } else this.accumulator = 0;
    const s = this.session;
    this.map.update(s.camera.x, s.level.guardDefeated);
    this.actors.clear();
    for (const e of s.spawner.enemies)
      if (
        e.x > s.camera.x - 100 &&
        e.x < s.camera.x + C.width + 100 &&
        e.deadTime < C.rendering.corpseDuration
      )
        this.renderer.draw(this.actors, e, s.camera.x);
    this.renderer.draw(this.actors, s.player, s.camera.x);
    this.combatRenderer.draw(this.effects, s);
    this.hud.update(
      s,
      this.controls,
      view.getFrameSize().height > view.getFrameSize().width,
    );
    if (s.state !== this.lastState) {
      console.info(`[Breakout] ${this.lastState} → ${s.state}`);
      this.lastState = s.state;
    }
  }
  onDestroy(): void {
    this.adapter?.destroy();
    this.platform.destroy();
  }
}

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
import { ObjectRenderer } from "./render/ObjectRenderer";
import { AudioBridge } from "./platform/AudioBridge";
import { Node } from "cc";
import { viewportLayout } from "./ui/ViewportLayout";
import { ComicAssets } from "./render/ComicAssets";
import { ComicLevelRenderer } from "./render/ComicLevelRenderer";
import { comicPose } from "./render/ComicPose";
import { comicEquipment } from "./render/ComicEquipment";
import { DirectActorClips } from "./render/DirectPose";
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
  private map!: LevelRenderer | ComicLevelRenderer;
  private objects!: ObjectRenderer;
  private world!: Node;
  private audio!: AudioBridge;
  private renderer = new StickmanRenderer();
  private combatRenderer = new CombatRenderer();
  private accumulator = 0;
  private ready = false;
  private lastState = this.session.state;
  private frameWidth = 0;
  private frameHeight = 0;
  private board!: Node;
  private canvasNode!: Node;
  private camera!: Camera;
  private portrait = false;
  private orientationPaused = false;
  private display = viewportLayout(C.width, C.height);
  onLoad(): void {
    void this.boot();
  }
  private async boot(): Promise<void> {
    try {
      await ComicAssets.load();
      this.session.weapon.canPresent = id => !ComicAssets.enabled ||
        ComicAssets.has(`weapon.${id}`) &&
        (id === "rifle" || Object.entries(DirectActorClips)
          .filter(([clip])=>clip.startsWith(id+"."))
          .every(([,frames])=>frames.every(frame=>ComicAssets.has(frame))));
      this.initialize();
      this.ready = true;
      console.info(
        "[Breakout] V0.5.9 ready; stable damaged crates, native armored boss and six telegraphed attacks.",
      );
    } catch (error) {
      console.error("[Breakout] Initialization failed", error);
      throw error;
    }
  }
  private initialize(): void {
    view.resizeWithBrowserSize(true);
    view.setDesignResolutionSize(
      C.width,
      C.height,
      ResolutionPolicy.FIXED_HEIGHT,
    );
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
    this.canvasNode = canvasNode;
    this.camera = camera;
    const board = node(
      canvasNode,
      "Screen",
      -C.width / 2,
      -C.height / 2,
      C.width,
      C.height,
    );
    board.getComponent(UITransform)!.setAnchorPoint(0, 0);
    this.board = board;
    this.world = node(board, "World presentation");
    this.map = ComicAssets.enabled ? new ComicLevelRenderer(this.world, this.session.level) : new LevelRenderer(this.world, this.session.level);
    this.objects = new ObjectRenderer(this.world);
    this.actors = new Ink(node(this.world, "Stickmen"));
    this.effects = new Ink(node(this.world, "Combat effects"));
    this.audio = new AudioBridge(this.node);
    void this.audio.load();
    this.adapter = new CocosInputAdapter(this.controls, () => this.enter());
    this.hud = new HUDController(
      board,
      this.adapter,
      () => this.startRun(),
      () => this.togglePause(),
      () => this.resume(),
      () => this.home(),
      () => {
        this.audio.muted = !this.audio.muted;
      },
      this.platform.adapter,
    );
    this.platform.install(
      () => {
        this.orientationPaused = false;
        this.adapter.hidden();
        this.session.pause();
        this.accumulator = 0;
      },
      () => ({
        ...this.session.snapshot(),
        playerShots: this.session.weapon.shots,
        audio: this.audio.status(),
        art: { requested: C.artStyle, active: ComicAssets.enabled ? "comic" : "legacy", loaded: ComicAssets.ready, error: ComicAssets.error, playerFrame: comicPose(this.session.player), equipment: comicEquipment(this.session.player), renderedPlayer:this.renderer.playerStatus(),renderedBoss:this.renderer.bossStatus(),objects:this.objects.status(),hudWeapon:this.hud.weaponStatus(),combat:this.combatRenderer.status(), terrain: "native-v057" },
        visibleChunks: this.map.visibleChunks,
        platform: this.platform.adapter.status(),
        display: {
          ...this.display,
          combatZoom: this.session.camera.zoom,
          worldVisibleWidth: this.session.camera.visibleWidth,
          cameraY: this.session.camera.y,
          frameWidth: this.frameWidth,
          frameHeight: this.frameHeight,
          orientationPaused: this.orientationPaused,
        },
        controls: {
          shootHeld: this.controls.isHeld("shoot"),
          hudHeight: this.adapter.touch.hudHeight,
          stick: {
            x: this.controls.joystick.x,
            y: this.controls.joystick.y,
            axis: this.controls.joystick.axis,
            vertical: this.controls.joystick.vertical,
            owner: this.controls.joystick.owner,
          },
          layout: this.hud.layout,
          floating: {
            originX: this.adapter.touch.originX,
            originY: this.adapter.touch.originY,
            baseX: this.adapter.touch.baseX,
            baseY: this.adapter.touch.baseY,
            owners: [...this.adapter.touch.owners].map(([id, o]) => ({
              id,
              role: o.role,
            })),
          },
        },
      }),
    );
  }
  private enter(): void {
    if (this.portrait) return;
    if (
      this.session.state === "title" ||
      this.session.state === "gameover" ||
      this.session.state === "complete"
    )
      this.startRun();
    else if (this.session.state === "paused") this.resume();
  }
  private startRun(): void {
    if (this.portrait) return;
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
    if (this.portrait) return;
    this.adapter.clear();
    this.accumulator = 0;
    this.session.resume();
  }
  private togglePause(): void {
    if (this.portrait) return;
    if (this.session.state === "paused") this.resume();
    else {
      this.session.pause();
      this.adapter.clear();
      this.accumulator = 0;
    }
  }
  update(dt: number): void {
    if (!this.ready) return;
    const frame = this.platform.adapter.frame();
    const engineFrame = view.getFrameSize();
    if (
      frame.width !== engineFrame.width ||
      frame.height !== engineFrame.height
    )
      view.setFrameSize(frame.width, frame.height);
    if (frame.width !== this.frameWidth || frame.height !== this.frameHeight) {
      this.frameWidth = frame.width;
      this.frameHeight = frame.height;
      this.display = viewportLayout(frame.width, frame.height);
      const { width, height, portrait, zoom } = this.display;
      view.setDesignResolutionSize(
        width,
        height,
        portrait ? ResolutionPolicy.FIXED_WIDTH : ResolutionPolicy.FIXED_HEIGHT,
      );
      this.canvasNode.getComponent(UITransform)!.setContentSize(width, height);
      this.camera.orthoHeight = height / 2;
      this.board.setPosition(-width / 2, -height / 2);
      this.board.getComponent(UITransform)!.setContentSize(width, height);
      this.session.camera.visibleWidth = width / zoom;
      this.session.camera.zoom = zoom;
      this.world.setScale(zoom, zoom, 1);
      this.hud.applyInsets(
        this.platform.safeInsets(width, height),
        width,
        height,
      );
      if (portrait !== this.portrait) this.adapter.hidden();
      if (portrait && !this.portrait) {
        this.orientationPaused =
          this.session.state === "playing" || this.session.state === "dying";
        this.session.pause();
      } else if (!portrait && this.portrait && this.orientationPaused) {
        this.session.resume();
        this.orientationPaused = false;
      }
      this.portrait = portrait;
      this.world.active = !portrait;
      this.accumulator = 0;
    }
    if (this.portrait) {
      this.adapter.hidden();
      this.hud.update(this.session, this.controls, true);
      return;
    }
    if (this.controls.consumePause()) this.togglePause();
    if (
      this.session.hitStop > 0 &&
      (this.session.state === "playing" || this.session.state === "dying")
    ) {
      this.session.hitStop = Math.max(0, this.session.hitStop - dt);
      this.accumulator = 0;
    } else if (
      this.session.state === "playing" ||
      this.session.state === "dying"
    ) {
      this.accumulator += Math.min(C.maxFrameDelta, Math.max(0, dt));
      while (this.accumulator >= C.fixedStep) {
        this.session.update(C.fixedStep, this.controls.consume());
        this.accumulator -= C.fixedStep;
      }
    } else this.accumulator = 0;
    const s = this.session;
    const targetZoom = s.level.arenaEntered
      ? Math.min(this.display.zoom, this.display.width / 1250)
      : this.display.zoom;
    s.camera.zoom +=
      (targetZoom - s.camera.zoom) * (1 - Math.exp(-Math.min(dt, 0.1) * 4));
    s.camera.visibleWidth = this.display.width / s.camera.zoom;
    this.world.setScale(s.camera.zoom, s.camera.zoom, 1);
    const shake =
      s.shakeTime > 0 ? s.shakePower * Math.min(1, s.shakeTime / 0.12) : 0;
    this.world.setPosition(
      Math.sin(s.time * 103) * shake,
      // Keep the ground above the thumb controls even when the boss view pulls back.
      Math.cos(s.time * 119) * shake * 0.6 +
        260 -
        (150 + s.camera.y) * s.camera.zoom,
    );
    this.audio.update(s);
    this.map.update(s.camera.x, s.level.guardDefeated, s.camera.visibleWidth);
    this.objects.draw(s);
    this.actors.clear();
    this.renderer.begin(this.actors);
    for (const e of s.spawner.enemies)
      if (
        e.x > s.camera.x - 100 &&
        e.x < s.camera.x + s.camera.visibleWidth + 100 &&
        e.deadTime <
          (e.kind === "guard" || e.kind === "colossus"
            ? 2.6
            : C.rendering.corpseDuration)
      )
        this.renderer.draw(this.actors, e, s.camera.x);
    this.renderer.draw(this.actors, s.player, s.camera.x);
    this.renderer.end();
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
    this.audio?.destroy();
  }
}

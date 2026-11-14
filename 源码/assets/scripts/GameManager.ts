import { ControlArt } from "./ui/ControlSkin";
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
  Sprite,
  view,
  profiler,
} from "cc";
import { GameConfig as C } from "./core/GameConfig";
import { ReleaseConfig, isChapterAvailable, nextCampaignChapter } from "./core/ReleaseConfig";
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
import { selectMusicCue } from "./platform/MusicCue";
import { Node } from "cc";
import { viewportLayout } from "./ui/ViewportLayout";
import { ComicAssets } from "./render/ComicAssets";
import { ComicLevelRenderer } from "./render/ComicLevelRenderer";
import { comicPose } from "./render/ComicPose";
import { comicEquipment } from "./render/ComicEquipment";
import { DirectActorClips } from "./render/DirectPose";
import { OceanSession } from "./ocean/OceanSession";
import { OceanRenderer } from "./ocean/OceanRenderer";
import { OceanAssets } from "./ocean/OceanAssets";
import { FlightSession } from "./flight/FlightSession";
import { FlightRenderer } from "./flight/FlightRenderer";
import { FlightAssets } from "./flight/FlightAssets";
import { PoseInterpolation } from "./render/PoseInterpolation";
import { colossusArenaZoom } from "./render/ColossusPresentation";
import { PersonalRecords } from "./social/PersonalRecords";
import { Invite } from "./social/InviteRoute";
import { ChapterSelectPanel } from "./ui/ChapterSelectPanel";
import { canEnterChapter } from "./social/ChapterAccess";
import { RecordsPanel } from "./ui/RecordsPanel";
import { RecommendationPanel } from "./ui/RecommendationPanel";
import { RewardedVideoPanel } from "./ui/RewardedVideoPanel";
const { ccclass } = _decorator;
@ccclass("GameManager")
export class GameManager extends Component {
  private controls = new InputManager();
  private session = new GameSession();
  private readonly playerPose = new PoseInterpolation(this.session.player);
  private readonly cameraPose = new PoseInterpolation(this.session.camera);
  private readonly renderSession: GameSession = Object.assign(Object.create(this.session), {
    player: this.playerPose.view, camera: this.cameraPose.view,
  });
  private ocean?: OceanSession;
  private oceanRenderer?: OceanRenderer;
  private flight?: FlightSession;
  private flightRenderer?: FlightRenderer;
  private landRoot!: Node;
  private loadingChapter = false;
  private chapterLoadInterrupted = false;
  private previewPending: 2 | 3 | undefined;
  private get activeSession() {
    return this.flight ?? this.ocean ?? this.session;
  }
  private platform = new PlatformBridge();
  private personal!: PersonalRecords;
  private recordsPanel!: RecordsPanel;
  private chapterSelect!: ChapterSelectPanel;
  private recommendationPanel!: RecommendationPanel;
  private rewardedVideoPanel!: RewardedVideoPanel;
  private get externalUiBusy(): boolean { return this.platform.adapter.recommendation.blocking || this.platform.adapter.rewardedVideo.blocking; }
  private pendingInvite?: Invite;
  private lastShare = "";
  private adapter!: CocosInputAdapter;
  private hud!: HUDController;
  private actors!: Ink;
  private effects!: Ink;
  private victoryBackdrop!: Ink;
  private map!: LevelRenderer | ComicLevelRenderer;
  private objects!: ObjectRenderer;
  private world!: Node;
  private arenaView = 0;
  private audio!: AudioBridge;
  private renderer = new StickmanRenderer();
  private combatRenderer = new CombatRenderer();
  private accumulator = 0;
  private ready = false;
  private lastState = this.session.state;
  private frameWidth = 0;
  private frameHeight = 0;
  private menuLayoutKey = "";
  private menuPoll = 0;
  private board!: Node;
  private canvasNode!: Node;
  private camera!: Camera;
  private portrait = false;
  private orientationPaused = false;
  private victorySeen = false;
  private display = viewportLayout(C.width, C.height);
  onLoad(): void {
    void this.boot();
  }
  private async boot(): Promise<void> {
    try {
      await ComicAssets.load();
      await ControlArt.load();
      this.session.weapon.canPresent = (id) =>
        !ComicAssets.enabled ||
        (ComicAssets.has(`weapon.${id}`) &&
          (id === "rifle" ||
            Object.entries(DirectActorClips)
              .filter(([clip]) => clip.startsWith(id + "."))
              .every(([, frames]) =>
                frames.every((frame) => ComicAssets.has(frame)),
              )));
      this.initialize();
      this.previewPending = this.platform.adapter.previewChapter();
      this.ready = true;
      this.scheduleOnce(() => {
        if (this.activeSession.state === "title" && !this.portrait) this.platform.adapter.recommendation.preload();
      }, .5);
      console.info(`[Breakout] V${ReleaseConfig.version} ready; ${ReleaseConfig.lastChapter} chapters available.`);
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
    this.landRoot = node(this.world, "Land chapter");
    this.map = ComicAssets.enabled
      ? new ComicLevelRenderer(this.landRoot, this.session.level)
      : new LevelRenderer(this.landRoot, this.session.level);
    this.objects = new ObjectRenderer(this.landRoot);
    this.victoryBackdrop = new Ink(node(this.landRoot, "Victory scenery fade"));
    this.actors = new Ink(node(this.landRoot, "Stickmen"));
    this.effects = new Ink(node(this.landRoot, "Combat effects"));
    this.audio = new AudioBridge(this.node);
    void this.audio.load();
    this.adapter = new CocosInputAdapter(this.controls, () => this.enter());
    this.personal = new PersonalRecords(this.platform.adapter.recordStore(), () => this.platform.adapter.monotonicNow());
    this.personal.changed = () => {
      this.platform.adapter.social.updateRecords(this.personal.records);
      this.recordsPanel?.refresh();
    };
    this.platform.adapter.social.updateRecords(this.personal.records);
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
      () => this.continueCampaign(),
      this.platform.adapter.status().mode === "wechat-mini-game"
        ? () => { if (!this.externalUiBusy) this.platform.adapter.gameClub.showFallback(); } : undefined,
      this.platform.adapter.status().mode === "wechat-mini-game"
        ? () => this.shareGame() : undefined,
      () => this.openRecords(),
      () => this.revive(),
      () => this.titleStart(),
      this.platform.adapter.status().mode === "wechat-mini-game" ? () => this.openRecommendation() : undefined,
    );
    this.hud.personal = this.personal;
    this.recordsPanel = new RecordsPanel(board, this.adapter, this.platform.adapter.social, this.personal,
      this.platform.adapter.status().mode === "wechat-mini-game", invite => {
        this.personal.challenge = invite;
        if (this.activeSession.state === "title") this.startRun();
      }, this.platform.adapter.status().mode === "wechat-mini-game" ? () => this.shareGame() : undefined);
    this.chapterSelect=new ChapterSelectPanel(board,this.adapter,this.personal,chapter=>this.selectChapter(chapter));
    this.recommendationPanel = new RecommendationPanel(board, this.adapter, this.platform.adapter.recommendation);
    this.rewardedVideoPanel = new RewardedVideoPanel(board, this.adapter, this.platform.adapter.rewardedVideo);
    this.platform.adapter.share.configure();
    this.platform.adapter.social.onInvite = invite => { this.pendingInvite = invite; };
    this.platform.adapter.gameClub.onOpenRequest = () => {
      this.personal.active(false);
      this.orientationPaused = false;
      this.adapter.clear();
      this.activeSession.pause();
      this.accumulator = 0;
      this.syncMusic();
    };
    this.platform.adapter.share.onOpenRequest = this.platform.adapter.gameClub.onOpenRequest;
    this.platform.adapter.recommendation.onOpenRequest = () => {
      this.personal.active(false); this.orientationPaused = false;
      this.adapter.clear(); this.activeSession.pause(); this.accumulator = 0;
      this.platform.adapter.gameClub.hide();
      this.syncMusic();
    };
    this.platform.adapter.rewardedVideo.onOpenRequest = this.platform.adapter.recommendation.onOpenRequest;
    this.platform.install(
      () => {
        this.personal.active(false);
        if (this.loadingChapter) this.chapterLoadInterrupted = true;
        this.orientationPaused = false;
        this.adapter.hidden();
        this.activeSession.pause();
        this.accumulator = 0;
        this.syncMusic();
      },
      () => ({
        ...this.activeSession.snapshot(),
        chapter: this.flight ? 3 : this.ocean ? 2 : 1,
        entryMode: this.platform.adapter.previewChapter()
          ? `chapter0${this.platform.adapter.previewChapter()}-preview` : "campaign",
        flightArt: this.flight ? this.flightRenderer?.status() : null,
        oceanArt: this.ocean
          ? {
              loaded: OceanAssets.ready,
              error: OceanAssets.error,
              playerFrame: this.oceanRenderer?.playerFrame,
              playerSize: this.oceanRenderer?.playerSize,
              scenery: this.oceanRenderer?.sceneryStatus,
              projectiles: this.oceanRenderer?.projectileVisuals,
              enemies: this.oceanRenderer?.enemyVisuals,
              aim: this.oceanRenderer?.aimVisual,
              muzzle: this.oceanRenderer?.muzzleVisual,
            }
          : null,
        chapterLoading: this.loadingChapter,
        chapterAssets: { oceanLoaded: OceanAssets.ready, oceanFrames: OceanAssets.frames.size,
          flightLoaded: FlightAssets.ready },
        playerShots: this.flight?.shots ?? this.ocean?.shots ?? this.session.weapon.shots,
        audio: this.audio.status(),
        art: this.flight
          ? { active: "flight", loaded: FlightAssets.ready, error: FlightAssets.error,
              ...this.flightRenderer?.status() }
          : this.ocean
          ? {
              active: "ocean",
              loaded: OceanAssets.ready,
              error: OceanAssets.error,
              playerFrame: this.oceanRenderer?.playerFrame,
            }
          : {
              requested: C.artStyle,
              active: ComicAssets.enabled ? "comic" : "legacy",
              loaded: ComicAssets.ready,
              error: ComicAssets.error,
              playerFrame: comicPose(this.session.player),
              equipment: comicEquipment(this.session.player),
              renderedPlayer: this.renderer.playerStatus(),
              renderedBoss: this.renderer.bossStatus(),
              renderedMiniBoss: this.renderer.miniStatus(),
              objects: this.objects.status(),
              pickups: this.objects.pickupStatus(),
              mechanisms: this.objects.mechanismStatus(),
              hudWeapon: this.hud.weaponStatus(),
              combat: this.combatRenderer.status(),
              terrain: "unified-drawn-v075",
            },
        visibleChunks: this.map.visibleChunks,
        platform: {
          ...this.platform.adapter.status(),
          gameClub: this.platform.adapter.gameClub.status(),
          share: this.platform.adapter.share.status(),
          social: this.platform.adapter.social.snapshot(),
          recommendation: this.platform.adapter.recommendation.snapshot(),
          rewardedVideo: this.platform.adapter.rewardedVideo.snapshot(),
          haptics: {
            requests: this.platform.adapter.victoryHaptics.requests,
            supported: this.platform.adapter.victoryHaptics.supported,
          },
        },
        presentation: this.hud.presentationStatus(),
        personalRecords: this.personal.snapshot(),
        recordsPanel: this.recordsPanel.snapshot(),
        chapterSelect: this.chapterSelect.snapshot(),
        recommendationPanel: this.recommendationPanel.snapshot(),
        rewardedVideoPanel: this.rewardedVideoPanel.snapshot(),
        display: {
          ...this.display,
          combatZoom: this.activeSession.camera.zoom,
          worldVisibleWidth: this.activeSession.camera.visibleWidth,
          cameraY: this.activeSession.camera.y,
          worldY: this.world.position.y,
          worldX: this.world.position.x,
          bossCeiling: this.hud.combatCeiling,
          frameWidth: this.frameWidth,
          frameHeight: this.frameHeight,
          orientationPaused: this.orientationPaused,
        },
        controls: {
          dodgeRemaining: this.flight?.dodgeCooldown,
          dodgeDuration: this.flight?.dodgeDuration,
          enabled: this.flight?.controlEnabled ?? this.ocean?.controlEnabled,
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
      () => { this.adapter.clear(); this.accumulator = 0; this.syncMusic(); },
    );
  }
  private enter(): void {
    if (this.externalUiBusy) return;
    if (this.portrait || this.loadingChapter || this.recordsPanel.visible || this.chapterSelect.visible) return;
    if (this.flight) {
      if (this.flight.state === "gameover" ||
          (this.flight.state === "complete" && this.flight.victory.resultsReady))
        this.startRun();
      else if (this.flight.state === "paused") this.resume();
      else this.flight.skipEntry();
      return;
    }
    if (this.ocean) {
      if (this.ocean.state === "complete" && this.ocean.victory.resultsReady)
        this.continueCampaign();
      else if (this.ocean.state === "gameover") this.revive();
      else if (this.ocean.state === "paused") this.resume();
      else { this.ocean.skipEntry(); this.adapter.clear(); }
      return;
    }
    if (
      this.session.state === "complete" &&
      this.session.victory.active &&
      !this.session.victory.resultsReady
    )
      return;
    if (
      this.session.state === "title" ||
      this.session.state === "gameover" ||
      this.session.state === "complete"
    )
      this.session.state === "complete"
        ? this.continueCampaign()
        : this.session.state === "title" ? this.titleStart() : this.revive();
    else if (this.session.state === "paused") this.resume();
  }
  private titleStart(): void {
    if (this.externalUiBusy) return;
    if(this.portrait || this.loadingChapter || this.recordsPanel.visible || this.activeSession.state!=="title")return;
    if(this.personal.records.cleared>=1){
      this.adapter.clear();this.personal.active(false);this.platform.adapter.gameClub.hide();this.chapterSelect.open();
    } else this.startRun();
  }
  private async selectChapter(chapter:1|2):Promise<boolean> {
    if (this.externalUiBusy) return false;
    if(this.portrait || this.loadingChapter || !canEnterChapter(this.personal.records,chapter))return false;
    if(chapter===2)return this.startChapter(2);
    this.disposeOcean();this.disposeFlight();this.landRoot.active=true;this.frameWidth=0;
    this.startRun();return true;
  }
  private revive():void {
    if (this.externalUiBusy) return;
    if(this.portrait || this.loadingChapter || this.recordsPanel.visible || this.chapterSelect.visible || this.flight)return;
    const active=this.ocean ?? this.session;
    if(active.state!=="gameover")return;
    if(!active.revival.remaining){
      if(this.platform.adapter.status().mode==="wechat-mini-game" && active.revival.canWatchVideo)this.watchRevivalVideo();
      else this.startRun();
      return;
    }
    this.adapter.clear();this.accumulator=0;this.personal.active(false);
    if(!active.revive())return;
    this.personal.markRevived();this.platform.adapter.gameClub.hide();
    this.playerPose.capture();this.cameraPose.capture();
    this.syncMusic();
  }
  private startRun(): void {
    if (this.externalUiBusy) return;
    if (this.portrait || this.loadingChapter) return;
    this.platform.adapter.gameClub.hide();
    this.adapter.clear();
    this.accumulator = 0;
    this.activeSession.reset();
    this.beginRecord();
    this.audio.reset();
    this.syncMusic();
    this.victorySeen = false;
    console.info(`[Breakout] New run: ${this.flight ? "Cloud Breakout" : this.ocean ? "Deep Sea" : "Abandoned Base"}.`);
  }
  private continueCampaign(): void {
    if (this.externalUiBusy) return;
    const next = nextCampaignChapter(this.flight ? 3 : this.ocean ? 2 : 1);
    if (next) void this.startChapter(next);
    else this.home();
  }
  private async startChapter(chapter: 2 | 3): Promise<boolean> {
    if (this.externalUiBusy) return false;
    if (!isChapterAvailable(chapter) || this.portrait || this.loadingChapter) return false;
    if(!this.platform.adapter.previewChapter() && !canEnterChapter(this.personal.records,chapter))return false;
    this.platform.adapter.gameClub.hide();
    this.loadingChapter = true;
    this.personal.active(false);
    this.chapterLoadInterrupted = false;
    this.adapter.clear();
    this.accumulator = 0;
    const previous = this.activeSession,
      wasPlaying = previous.state === "playing";
    previous.pause();
    this.syncMusic();
    this.hud.setChapterLoading(chapter === 3
      ? "正在装载飞行器与云端战场…" : "正在装载潜水装备与海底战场…");
    try {
      if (chapter === 3) await FlightAssets.load();
      else {
        await OceanAssets.load();
        await this.audio.loadOcean();
      }
      if (!this.isValid) return false;
      if (chapter === 3) {
        const next = new FlightSession();
        this.flightRenderer ??= new FlightRenderer(this.world);
        this.flight = next;
        this.flightRenderer.root.active = true;
        this.disposeOcean();
      } else {
        const next = new OceanSession();
        this.oceanRenderer ??= new OceanRenderer(this.world);
        this.ocean = next;
        this.disposeFlight();
        this.oceanRenderer.root.active = true;
      }
      this.audio.reset();
      if (this.portrait || this.chapterLoadInterrupted) {
        this.activeSession.pause();
        this.orientationPaused = this.portrait && !this.chapterLoadInterrupted;
      }
      this.victorySeen = false;
      this.beginRecord();
      this.landRoot.active = false;
      this.frameWidth = 0;
      this.hud.setChapterLoading("");
      console.info(`[Breakout] Chapter 0${chapter} ready.`);
      return true;
    } catch (error) {
      console.error("[Breakout] Chapter load failed", error);
      if (wasPlaying && !this.portrait && !this.chapterLoadInterrupted) previous.resume();
      this.hud.setChapterLoading(chapter === 3
        ? "云端资源加载失败，请稍后重新进入第三关" : "海底资源加载失败，请稍后重新进入第二关");
      this.scheduleOnce(() => { if (!this.loadingChapter) this.hud.setChapterLoading(""); }, 3);
      return false;
    } finally {
      this.loadingChapter = false;
      this.adapter.clear();
      this.accumulator = 0;
    }
  }
  private drawFlight(dt: number): void {
    const s = this.flight!;
    if (s.victory.active && !this.victorySeen) {
      this.adapter.clear();
      this.victorySeen = true;
    }
    this.platform.adapter.victoryHaptics.update(s.victory, s.state !== "paused" && !this.portrait);
    // Air combat needs room above and below the complete helicopter silhouette.
    // Keep one steady flight scale instead of zooming on facing or boss attacks.
    s.camera.zoom = Math.min(this.display.zoom, 1.15);
    s.setVisibleWidth(this.display.width / s.camera.zoom);
    s.updateCamera(dt, this.display.height / s.camera.zoom);
    this.world.setScale(s.camera.zoom, s.camera.zoom, 1);
    this.world.setPosition(0, 0);
    this.flightRenderer!.draw(s, this.display.width, this.display.height);
    this.hud.updateFlight(s, this.controls, false);
    this.audio.updateFlight(s);
    if (s.state !== this.lastState) {
      console.info(`[Breakout] Flight ${this.lastState} → ${s.state}`);
      this.lastState = s.state;
    }
  }
  private disposeFlight(): void {
    this.flight = undefined;
    if (this.flightRenderer) {
      this.flightRenderer.root.active = false;
      for (const sprite of this.flightRenderer.root.getComponentsInChildren(Sprite)) sprite.spriteFrame = null;
      this.flightRenderer.root.destroy();
    }
    this.flightRenderer = undefined;
    FlightAssets.release();
  }
  private disposeOcean(): void {
    this.ocean = undefined;
    this.hud?.releaseOcean();
    if (this.oceanRenderer) {
      this.oceanRenderer.root.active = false;
      for (const sprite of this.oceanRenderer.root.getComponentsInChildren(Sprite)) sprite.spriteFrame = null;
      this.oceanRenderer.root.destroy();
    }
    this.oceanRenderer = undefined;
    this.audio?.releaseOcean();
    OceanAssets.release();
  }
  private drawOcean(dt: number): void {
    const s = this.ocean!,
      focus = s.victory.focus;
    if (s.victory.active && !this.victorySeen) {
      this.adapter.clear();
      this.victorySeen = true;
    }
    this.platform.adapter.victoryHaptics.update(
      s.victory,
      s.state !== "paused" && !this.portrait,
    );
    const target = s.boss.active
      ? Math.min(this.display.zoom, this.display.width / 1330)
      : this.display.zoom;
    s.camera.zoom +=
      (target + (2.3 - target) * focus - s.camera.zoom) *
      (1 - Math.exp(-dt * 4));
    s.camera.visibleWidth = this.display.width / s.camera.zoom;
    const vh = this.display.height / s.camera.zoom;
    s.updateCamera(dt, vh);
    this.world.setScale(s.camera.zoom, s.camera.zoom, 1);
    this.world.setPosition(0, 0);
    this.oceanRenderer!.draw(s, this.display.width, this.display.height);
    this.hud.updateOcean(s, this.controls, false);
    this.audio.updateOcean(s);
    if (s.state !== this.lastState) {
      console.info(`[Breakout] Sea ${this.lastState} → ${s.state}`);
      this.lastState = s.state;
    }
  }
  private home(): void {
    if (this.externalUiBusy) return;
    if (this.loadingChapter) return;
    this.platform.adapter.gameClub.hide();
    this.recordsPanel.close();
    this.chapterSelect.close();
    this.personal.cancel();
    this.adapter.clear();
    this.accumulator = 0;
    this.session.reset("title");
    this.audio.reset();
    this.disposeOcean();
    this.disposeFlight();
    this.landRoot.active = true;
    this.frameWidth = 0;
    this.victorySeen = false;
  }
  private resume(): void {
    if (this.externalUiBusy) return;
    if (this.portrait || this.loadingChapter || this.recordsPanel.visible || this.chapterSelect.visible) return;
    this.platform.adapter.gameClub.hide();
    this.adapter.clear();
    this.accumulator = 0;
    this.activeSession.resume();
    this.personal.active(!this.ocean?.introActive && this.activeSession.state === "playing");
    this.syncMusic();
  }
  private togglePause(): void {
    if (this.externalUiBusy) return;
    if (this.portrait || this.loadingChapter || this.recordsPanel.visible || this.chapterSelect.visible) return;
    if (this.activeSession.state === "paused") this.resume();
    else {
      this.personal.active(false);
      this.activeSession.pause();
      this.adapter.clear();
      this.accumulator = 0;
      this.syncMusic();
    }
  }
  private beginRecord(): void {
    this.platform.adapter.rewardedVideo.preload();
    this.personal.begin(this.flight ? 3 : this.ocean ? 2 : 1, !this.platform.adapter.previewChapter());
    this.personal.active(!this.externalUiBusy && this.activeSession.state === "playing" && !this.ocean?.introActive && !this.portrait);
  }
  private shareGame(): void {
    if (this.externalUiBusy || this.portrait || this.loadingChapter) return;
    this.platform.adapter.share.request();
  }
  private watchRevivalVideo(): void {
    if(this.externalUiBusy || this.portrait || this.loadingChapter || this.recordsPanel.visible || this.chapterSelect.visible || this.flight)return;
    const active=this.ocean ?? this.session;
    if(active.state!=="gameover" || !active.revival.canWatchVideo)return;
    const reward=active.revival.rewardVideo(), attempt=active.revival.attemptId, used=active.revival.used;
    active.revival.error="";
    this.platform.adapter.rewardedVideo.request(result=>{
      if(this.activeSession!==active || active.state!=="gameover" || active.revival.attemptId!==attempt || active.revival.used!==used)return;
      reward(result.completed);
      if(!result.completed)active.revival.error=result.message;
      this.adapter.clear();this.accumulator=0;this.personal.active(false);
      // A completed video grants one opportunity. The player taps again to resume safely.
    });
  }
  private openRecommendation(): void {
    if (this.externalUiBusy || this.portrait || this.loadingChapter || this.recordsPanel.visible || this.chapterSelect.visible || this.activeSession.state !== "title") return;
    this.platform.adapter.recommendation.request();
  }
  private openRecords(): void {
    if (this.externalUiBusy) return;
    if(this.loadingChapter || this.chapterSelect.visible)return;
    this.personal.active(false); this.orientationPaused = false;
    this.activeSession.pause(); this.accumulator = 0;
    this.platform.adapter.gameClub.hide(); this.recordsPanel.open();
    this.syncMusic();
  }
  private updateSocial(dt: number): void {
    if (this.pendingInvite && !this.externalUiBusy && !this.portrait && !this.loadingChapter && !this.recordsPanel.visible && !this.chapterSelect.visible &&
        ["title", "paused", "gameover"].includes(this.activeSession.state)) {
      this.openRecords(); this.recordsPanel.invite(this.pendingInvite); this.pendingInvite = undefined;
    }
    this.recordsPanel.update(dt, this.display.width, this.display.height, this.portrait);
    this.chapterSelect.update(this.display.width,this.display.height,this.portrait,this.platform.safeInsets(this.display.width,this.display.height));
    this.recommendationPanel.update(dt, this.display.width, this.display.height, this.platform.safeInsets(this.display.width, this.display.height));
    this.rewardedVideoPanel.update(this.display.width, this.display.height, this.platform.safeInsets(this.display.width, this.display.height));
    this.hud.updateRevival(this.activeSession,this.platform.adapter.status().mode==="wechat-mini-game");
    const chapter = this.activeSession.state === "title" ? undefined : this.ocean ? 2 : 1;
    const ms = this.personal.result?.valid && this.activeSession.victory.active ? this.personal.result.ms : undefined;
    const key = `${chapter ?? 0}:${ms ?? 0}`;
    if (key !== this.lastShare) { this.lastShare = key; this.platform.adapter.share.prepare(chapter, ms); }
  }
  private syncMusic(dt = 0): void {
    if (!this.audio) return;
    this.audio.music.update(selectMusicCue(this.session, this.ocean, this.flight),
      this.portrait || this.loadingChapter || this.externalUiBusy
        || !!this.recordsPanel?.visible || !!this.chapterSelect?.visible, dt);
  }
  update(dt: number): void {
    if (!this.ready) return;
    const active = this.activeSession;
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
      active.camera.visibleWidth = width / zoom;
      active.camera.zoom = zoom;
      this.world.setScale(zoom, zoom, 1);
      this.hud.applyInsets(
        this.platform.safeInsets(width, height),
        width,
        height,
        this.platform.menuRect(width, height),
      );
      this.menuLayoutKey = "";
      this.menuPoll = 0;
      if (portrait !== this.portrait) this.adapter.hidden();
      if (portrait && !this.portrait) {
        this.personal.active(false);
        this.orientationPaused =
          active.state === "playing" || active.state === "dying";
        active.pause();
      } else if (!portrait && this.portrait && this.orientationPaused && !this.externalUiBusy) {
        active.resume();
        this.orientationPaused = false;
      }
      this.portrait = portrait;
      this.world.active = !portrait;
      this.accumulator = 0;
    }
    // Some WeChat hosts report the capsule only after first layout or after
    // orientation settles. Retry cheaply; do not query native UI every frame.
    this.menuPoll -= dt;
    if (this.menuPoll <= 0) {
      this.menuPoll = 1;
      const { width, height } = this.display;
      const menu = this.platform.menuRect(width, height);
      const insets = this.platform.safeInsets(width, height);
      const key = JSON.stringify({ menu: menu ?? null, insets });
      if (key !== this.menuLayoutKey) {
        this.menuLayoutKey = key;
        this.hud.applyInsets(insets, width, height, menu);
      }
    }
    if (this.portrait) {
      this.syncMusic(dt);
      this.personal.active(false);
      this.updateSocial(dt);
      this.adapter.hidden();
      if (this.flight) this.hud.updateFlight(this.flight, this.controls, true);
      else if (this.ocean) this.hud.updateOcean(this.ocean, this.controls, true);
      else this.hud.update(this.session, this.controls, true, dt);
      return;
    }
    // Direct preview waits for a usable landscape view, and uses the same
    // guarded chapter preload/reset path as the normal menu and settlement.
    if (this.previewPending && !this.externalUiBusy) {
      const chapter = this.previewPending;
      this.previewPending = undefined;
      void this.startChapter(chapter);
      return;
    }
    if (this.controls.consumePause()) this.togglePause();
    this.personal.active(!this.externalUiBusy && !this.loadingChapter && !this.recordsPanel.visible && !this.chapterSelect.visible && active.state === "playing" &&
      !active.victory.active && !this.ocean?.introActive);
    if (
      !this.externalUiBusy && active.hitStop > 0 &&
      (active.state === "playing" || active.state === "dying")
    ) {
      active.hitStop = Math.max(0, active.hitStop - dt);
      this.accumulator = 0;
    } else if (
      !this.externalUiBusy && !this.loadingChapter &&
      (active.state === "playing" ||
        active.state === "reviving" ||
        active.state === "dying" ||
        (active.state === "complete" && active.victory.active))
    ) {
      this.accumulator += Math.min(C.maxFrameDelta, Math.max(0, dt));
      while (this.accumulator >= C.fixedStep) {
        if (!this.ocean && !this.flight) { this.playerPose.capture(); this.cameraPose.capture(); }
        const enteringOcean = this.ocean?.introActive;
        const preparing=active.state==="reviving";
        active.update(C.fixedStep, this.controls.consume(this.flight ? "flight" : this.ocean ? "swim" : "land"));
        if ((enteringOcean && !this.ocean?.introActive) || (preparing && active.state==="playing")) this.adapter.clear();
        this.accumulator -= C.fixedStep;
      }
    } else this.accumulator = 0;
    if (active.victory.active && active.player.health > 0) this.personal.win();
    else if (active.state !== "playing") this.personal.active(false);
    this.updateSocial(dt);
    this.syncMusic(dt);
    if (this.flight) {
      this.drawFlight(dt);
      return;
    }
    if (this.ocean) {
      this.drawOcean(dt);
      return;
    }
    const s = this.session;
    if (s.victory.active && !this.victorySeen) {
      this.adapter.clear();
      this.victorySeen = true;
    }
    this.platform.adapter.victoryHaptics.update(
      s.victory,
      s.state !== "paused" && !this.portrait,
    );
    const focus = s.victory.focus;
    this.arenaView += ((s.bossFraming ? 1 : 0) - this.arenaView) *
      (1 - Math.exp(-Math.min(dt, .1) * 5));
    const screenGround = 150 - 6 * this.arenaView;
    const ordinaryZoom = s.bossFraming
      ? Math.min(this.display.zoom, this.display.width / 1250,
          colossusArenaZoom(s.spawner.guard, s.level.groundY(s.spawner.guard.x),
            this.hud.combatCeiling, screenGround))
      : this.display.zoom;
    const targetZoom =
      ordinaryZoom +
      (Math.min(this.display.zoom * 2.25, 3.7) - ordinaryZoom) * focus;
    s.camera.zoom +=
      (targetZoom - s.camera.zoom) * (1 - Math.exp(-Math.min(dt, 0.1) * 4));
    s.camera.visibleWidth = this.display.width / s.camera.zoom;
    if (s.victory.active) {
      const wide =
        (s.player.x + s.spawner.guard.x) / 2 - s.camera.visibleWidth / 2;
      const close = s.player.x - s.camera.visibleWidth * 0.34;
      const targetX = wide + (close - wide) * focus;
      s.camera.x +=
        (Math.max(
          0,
          Math.min(s.level.data.width - s.camera.visibleWidth, targetX),
        ) -
          s.camera.x) *
        (1 - Math.exp(-Math.min(dt, 0.1) * 7));
      s.camera.y = 0;
    }
    const interpolate = s.state === "playing" && !s.victory.active && s.hitStop <= 0;
    if (!interpolate) { this.playerPose.capture(); this.cameraPose.capture(); }
    const alpha = interpolate ? this.accumulator / C.fixedStep : 1;
    const render = this.renderSession;
    // Every land layer uses the same smooth camera; no simulated positions are written back.
    this.playerPose.sample(alpha);
    this.cameraPose.sample(alpha);
    const camera = render.camera;
    this.world.setScale(camera.zoom, camera.zoom, 1);
    this.world.setPosition(
      0,
      // Keep only a shallow soil strip; the side controls float over the scene.
      (screenGround + (170 - screenGround) * focus) -
        ((150 + camera.y) * (1 - focus) + render.player.y * focus) * camera.zoom,
    );
    this.audio.update(s);
    this.map.update(camera.x, camera.visibleWidth);
    this.objects.draw(render);
    this.victoryBackdrop.clear();
    if (focus > 0) {
      const paper = new Color(250, 249, 245, Math.round(175 * focus));
      this.victoryBackdrop.rect(
        -100,
        s.player.y - 1000,
        s.camera.visibleWidth + 200,
        2200,
        paper,
        paper,
        1,
      );
    }
    this.actors.clear();
    this.renderer.begin(this.actors);
    for (const e of s.spawner.enemies)
      if (
        (!s.victory.active || e === s.spawner.guard || !e.alive) &&
        e.x > s.camera.x - 100 &&
        e.x < s.camera.x + s.camera.visibleWidth + 100 &&
        e.deadTime <
          (e.kind === "guard" || e.kind === "colossus"
            ? 2.6
            : C.rendering.corpseDuration)
      )
        this.renderer.draw(this.actors, e, camera.x);
    this.renderer.draw(this.actors, render.player, camera.x);
    this.renderer.end();
    this.combatRenderer.draw(this.effects, render);
    this.hud.update(
      s,
      this.controls,
      view.getFrameSize().height > view.getFrameSize().width,
      dt,
    );
    if (s.state !== this.lastState) {
      console.info(`[Breakout] ${this.lastState} → ${s.state}`);
      this.lastState = s.state;
    }
  }
  lateUpdate(): void {
    if (!this.ready) return;
    const state = this.activeSession.state;
    this.platform.adapter.gameClub.sync(
      !this.externalUiBusy && !this.portrait && !this.loadingChapter && !this.recordsPanel.visible && !this.chapterSelect.visible && (state === "title" || state === "paused")
        ? this.hud.gameClubBounds() : undefined,
      this.display, this.platform.adapter.frame(),
    );
  }
  onDestroy(): void {
    this.personal?.cancel();
    this.recordsPanel?.destroy();
    this.recommendationPanel?.destroy();
    this.rewardedVideoPanel?.destroy();
    this.disposeOcean();
    this.disposeFlight();
    this.adapter?.destroy();
    this.platform.destroy();
    this.audio?.destroy();
  }
}

import {
  resources,
  assetManager,
  Texture2D,
  SpriteFrame,
  Rect,
  Size,
  Sprite,
  Node,
  UITransform,
  Color,
} from "cc";
import { ComicFrames, ComicFrameId } from "./ComicFrames";
import type { TerrainTile } from "./TerrainTiles";
import { SupplementFrames } from "./SupplementFrames";
import { DirectFrames } from "./DirectFrames";
import { ShotgunFrames } from "./ShotgunFrames";
import { MechFrames } from "./MechFrames";
import { BossFrames } from "./BossFrames";
import { ShieldBreakFrames } from "./ShieldBreakFrames";
import { TerrainV088Frames } from "./TerrainV088Frames";
import { CelebrationFrames } from "./CelebrationFrames";
import { RocketAimFrames } from "./RocketAimFrames";
import { RifleActionFrames } from "./RifleActionFrames";
import { LandDetailFrames } from "./LandDetailFrames";
import { LandDrawnFrames } from "./LandDrawnFrames";
import { LandInkFrames } from "./LandInkFrames";
import { SandbagFrames } from "./SandbagFrames";
import { LandPolishFrames } from "./LandPolishFrames";
import { RocketWalkFrames } from "./RocketWalkFrames";
import { UnifiedActorFrames } from "./UnifiedActorFrames";
import { UnifiedSoilFrame } from "./UnifiedSoilFrame";
import { MotionFrames } from "./MotionFrames";
import { FeedbackFrames } from "./FeedbackFrames";
import { GameConfig as C } from "../core/GameConfig";
import { node } from "./Ink";

/** Preloaded shared textures. No resource loads during weapon changes. */
export class ComicAssets {
  static ready = false;
  static error = "";
  static titleCover: SpriteFrame | undefined;
  private static frames = new Map<ComicFrameId, SpriteFrame>();
  private static regions = new Map<string, SpriteFrame>();
  static get enabled(): boolean {
    return C.artStyle === "comic" && this.ready;
  }
  static async load(): Promise<void> {
    if (C.artStyle !== "comic" || this.ready) return;
    try {
      const load = (name: string) => new Promise<Texture2D>((resolve, reject) =>
        resources.load(`comic/${name}/texture`, Texture2D, (err, asset) =>
          err ? reject(err) : resolve(asset),
        ),
      );
      const landBundle=await new Promise<import('cc').AssetManager.Bundle>((resolve,reject)=>assetManager.loadBundle('landart',(error,bundle)=>error?reject(error):resolve(bundle)));
      const landLoad=(name:string)=>new Promise<Texture2D>((resolve,reject)=>landBundle.load(name+'/texture',Texture2D,(error,t)=>error?reject(error):resolve(t)));
      const [terrain,landmarks,fill,ink,drawnTerrain,drawnFill]=await Promise.all([landLoad('terrain'),landLoad('landmarks'),landLoad('fill'),landLoad('ink'),landLoad('drawn-terrain'),landLoad('drawn-fill')]);
      const bags=await landLoad('sandbag-debris');
      const shieldBreak=await landLoad('shield-break');
      shieldBreak.setWrapMode(Texture2D.WrapMode.CLAMP_TO_EDGE,Texture2D.WrapMode.CLAMP_TO_EDGE);
      const polish=await landLoad('polish');
      const [cast,soil,motion,bossV088,terrainV088]=await Promise.all([landLoad('cast'),landLoad('soil'),landLoad('motion'),landLoad('boss-v088'),landLoad('terrain-v088')]);
      for(const t of [cast,soil,motion,bossV088,terrainV088])t.setWrapMode(Texture2D.WrapMode.CLAMP_TO_EDGE,Texture2D.WrapMode.CLAMP_TO_EDGE);
      polish.setWrapMode(Texture2D.WrapMode.CLAMP_TO_EDGE,Texture2D.WrapMode.CLAMP_TO_EDGE);
      bags.setWrapMode(Texture2D.WrapMode.CLAMP_TO_EDGE,Texture2D.WrapMode.CLAMP_TO_EDGE);
      for(const t of [terrain,landmarks,fill,ink,drawnTerrain,drawnFill])t.setWrapMode(Texture2D.WrapMode.CLAMP_TO_EDGE,Texture2D.WrapMode.CLAMP_TO_EDGE);
      const [texture, supplement, native, shotgun, mech, celebration, rocketAim, rifleActions, cover] = await Promise.all([
        load("comic"), load("supplement"), load("native"), load("shotgun"), load("mech"), load("celebration"), load("rocket-aim"), load("rifle-actions"),
        // A missing title illustration must not disable the gameplay atlases.
        landLoad("title-cover").catch(error => { console.error("[Breakout] Title cover unavailable.", error); return undefined; }),
      ]);
      if (cover) {
        cover.setWrapMode(Texture2D.WrapMode.CLAMP_TO_EDGE, Texture2D.WrapMode.CLAMP_TO_EDGE);
        const frame = new SpriteFrame();
        frame.name = "unified-battlefield-v064";
        frame.texture = cover;
        frame.rect = new Rect(0, 0, cover.width, cover.height);
        frame.originalSize = new Size(cover.width, cover.height);
        this.titleCover = frame;
      }
      // Clamp padded atlas edges on WebGL 1 and WeChat; V0.5.3 is 2048 square.
      texture.setWrapMode(
        Texture2D.WrapMode.CLAMP_TO_EDGE,
        Texture2D.WrapMode.CLAMP_TO_EDGE,
      );
      supplement.setWrapMode(Texture2D.WrapMode.CLAMP_TO_EDGE, Texture2D.WrapMode.CLAMP_TO_EDGE);
      native.setWrapMode(Texture2D.WrapMode.CLAMP_TO_EDGE, Texture2D.WrapMode.CLAMP_TO_EDGE);
      shotgun.setWrapMode(Texture2D.WrapMode.CLAMP_TO_EDGE, Texture2D.WrapMode.CLAMP_TO_EDGE);
      mech.setWrapMode(Texture2D.WrapMode.CLAMP_TO_EDGE, Texture2D.WrapMode.CLAMP_TO_EDGE);
      celebration.setWrapMode(Texture2D.WrapMode.CLAMP_TO_EDGE, Texture2D.WrapMode.CLAMP_TO_EDGE);
      rocketAim.setWrapMode(Texture2D.WrapMode.CLAMP_TO_EDGE, Texture2D.WrapMode.CLAMP_TO_EDGE);
      rifleActions.setWrapMode(Texture2D.WrapMode.CLAMP_TO_EDGE, Texture2D.WrapMode.CLAMP_TO_EDGE);
      for (const id of Object.keys(ComicFrames) as ComicFrameId[]) {
        const data = ComicFrames[id],
          f = new SpriteFrame();
        f.name = id;
        f.texture = id in ShieldBreakFrames ? shieldBreak : id in BossFrames ? bossV088 : id in TerrainV088Frames ? terrainV088 : id in MotionFrames ? motion : id in FeedbackFrames || id in UnifiedActorFrames ? cast : id in UnifiedSoilFrame ? soil : id in LandPolishFrames || id in RocketWalkFrames ? polish : id in SandbagFrames ? bags : id in LandDrawnFrames ? (id.startsWith('drawn.fill.')?drawnFill:drawnTerrain) : id in LandInkFrames ? ink : id in LandDetailFrames ? (id.startsWith('land.fill.')?fill:id==='land.coast'||id==='land.factory'?landmarks:terrain) : id in RifleActionFrames ? rifleActions : id in RocketAimFrames ? rocketAim : id in CelebrationFrames ? celebration : id in MechFrames ? mech : id in ShotgunFrames ? shotgun : id in DirectFrames ? native : id in SupplementFrames ? supplement : texture;
        f.rect = new Rect(...data.atlas);
        f.originalSize = new Size(...data.size);
        this.frames.set(id, f);
      }
      this.ready = true;
      console.info(
        `[Breakout] Comic atlases loaded: ${this.frames.size} frames, unified cast v081; title cover ${cover ? "ready" : "unavailable"}.`,
      );
    } catch (error) {
      this.error = String(error);
      console.error(
        "[Breakout] Comic atlas unavailable; using legacy art.",
        error,
      );
    }
  }
  static frame(id: ComicFrameId): SpriteFrame {
    return this.frames.get(id)!;
  }
  static has(id: ComicFrameId): boolean { return this.frames.has(id); }
  static region(id: ComicFrameId, crop: readonly [number, number, number, number]): SpriteFrame {
    const key = `${id}/${crop.join(",")}`;
    let frame = this.regions.get(key);
    if (!frame) {
      const data = ComicFrames[id];
      frame = new SpriteFrame(); frame.texture = this.frame(id).texture;
      frame.rect = new Rect(data.atlas[0] + crop[0], data.atlas[1] + crop[1], crop[2], crop[3]);
      frame.originalSize = new Size(crop[2], crop[3]);
      this.regions.set(key, frame);
    }
    return frame;
  }
}

/** Reusable per-layer sprite slots. No per-frame node/texture creation after warmup. */
export class ComicBatch {
  private slots: {
    node: Node;
    sprite: Sprite;
    transform: UITransform;
    id?: ComicFrameId;
    color: Color;
  }[] = [];
  private cursor = 0;
  constructor(
    private parent: Node,
    private name: string,
  ) {}
  begin(): void {
    this.cursor = 0;
  }
  put(
    id: ComicFrameId,
    x: number,
    y: number,
    width: number,
    height?: number,
    angle = 0,
    alpha = 255,
    flip = 1,
    anchor?: readonly [number, number],
  ): Node {
    const cached = ComicAssets.frame(id);
    // Keep the previous complete visual when an optional frame is unavailable.
    // Startup preloads the entire atlas, so switching never initiates a load.
    if (!cached && this.slots[this.cursor]) return this.slots[this.cursor++].node;
    if (!cached) throw new Error(`Missing preloaded comic frame: ${id}`);
    const i = this.cursor++;
    if (!this.slots[i]) {
      const n = node(this.parent, `${this.name}/${i}`),
        sprite = n.addComponent(Sprite);
      sprite.sizeMode = Sprite.SizeMode.CUSTOM;
      sprite.trim = false;
      this.slots[i] = {
        node: n,
        sprite,
        transform: n.getComponent(UITransform)!,
        color: new Color(255, 255, 255),
      };
    }
    const slot = this.slots[i],
      d = ComicFrames[id];
    if (slot.id !== id) {
      slot.sprite.spriteFrame = cached;
      slot.id = id;
    }
    slot.transform.setAnchorPoint(...(anchor ?? d.anchor));
    slot.transform.setContentSize(
      width,
      height ?? (width * d.size[1]) / d.size[0],
    );
    slot.node.active = true;
    slot.node.setPosition(x, y);
    slot.node.setScale(flip, 1, 1);
    slot.node.angle = angle;
    slot.color.set(255, 255, 255, alpha);
    slot.sprite.color = slot.color;
    return slot.node;
  }
  end(): void {
    for (let i = this.cursor; i < this.slots.length; i++)
      this.slots[i].node.active = false;
  }
  tintLast(rgb: readonly [number, number, number]): void {
    const slot = this.slots[this.cursor - 1];
    slot.color.set(rgb[0], rgb[1], rgb[2], slot.color.a);
    slot.sprite.color = slot.color;
  }
  get capacity(): number {
    return this.slots.length;
  }
  /** Every terrain consumer carries the full transform, including quiet beam stretches. */
  tile(tile: TerrainTile, offsetX=0): Node {
    const {id,x,y,scale,crop,mirrorX=false,mirrorY=false,scaleY=scale,opacity=255}=tile;
    const n=this.putRegion(id,x-offsetX+(mirrorX?crop[2]*scale:0),y+(mirrorY?crop[3]*scaleY:0),scale,crop,0,[0,0],opacity);
    n.setScale(mirrorX?-1:1,(mirrorY?-1:1)*scaleY/scale,1);
    return n;
  }
  putRegion(id: ComicFrameId, x:number, y:number, scale:number, crop:readonly[number,number,number,number], angle=0, anchor:readonly[number,number]=[0,0], opacity=255): Node {
    const result=this.put(id, x, y, crop[2] * scale, crop[3] * scale, angle, opacity, 1, anchor);
    this.slots[this.cursor - 1].sprite.spriteFrame = ComicAssets.region(id, crop);
    // A later ordinary put must restore its full frame even when the ID matches.
    this.slots[this.cursor - 1].id = undefined;
    return result;
  }
}

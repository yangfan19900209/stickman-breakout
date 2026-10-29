import {
  resources,
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
import { SupplementFrames } from "./SupplementFrames";
import { DirectFrames } from "./DirectFrames";
import { ShotgunFrames } from "./ShotgunFrames";
import { MechFrames } from "./MechFrames";
import { GameConfig as C } from "../core/GameConfig";
import { node } from "./Ink";

/** Preloaded shared textures. No resource loads during weapon changes. */
export class ComicAssets {
  static ready = false;
  static error = "";
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
      const [texture, supplement, native, shotgun, mech] = await Promise.all([load("comic"), load("supplement"), load("native"), load("shotgun"), load("mech")]);
      // Clamp padded atlas edges on WebGL 1 and WeChat; V0.5.3 is 2048 square.
      texture.setWrapMode(
        Texture2D.WrapMode.CLAMP_TO_EDGE,
        Texture2D.WrapMode.CLAMP_TO_EDGE,
      );
      supplement.setWrapMode(Texture2D.WrapMode.CLAMP_TO_EDGE, Texture2D.WrapMode.CLAMP_TO_EDGE);
      native.setWrapMode(Texture2D.WrapMode.CLAMP_TO_EDGE, Texture2D.WrapMode.CLAMP_TO_EDGE);
      shotgun.setWrapMode(Texture2D.WrapMode.CLAMP_TO_EDGE, Texture2D.WrapMode.CLAMP_TO_EDGE);
      mech.setWrapMode(Texture2D.WrapMode.CLAMP_TO_EDGE, Texture2D.WrapMode.CLAMP_TO_EDGE);
      for (const id of Object.keys(ComicFrames) as ComicFrameId[]) {
        const data = ComicFrames[id],
          f = new SpriteFrame();
        f.name = id;
        f.texture = id in MechFrames ? mech : id in ShotgunFrames ? shotgun : id in DirectFrames ? native : id in SupplementFrames ? supplement : texture;
        f.rect = new Rect(...data.atlas);
        f.originalSize = new Size(...data.size);
        this.frames.set(id, f);
      }
      this.ready = true;
      console.info(
        `[Breakout] Comic atlases loaded: ${this.frames.size} frames, 5 textures.`,
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
  get capacity(): number {
    return this.slots.length;
  }
  /** Cropped repeat tiles keep exactly one uniform scale in both axes. */
  tile(id: ComicFrameId, x: number, y: number, scale: number, crop: readonly [number, number, number, number]): void {
    this.putRegion(id,x,y,scale,crop);
  }
  putRegion(id: ComicFrameId, x:number, y:number, scale:number, crop:readonly[number,number,number,number], angle=0, anchor:readonly[number,number]=[0,0]): Node {
    const result=this.put(id, x, y, crop[2] * scale, crop[3] * scale, angle, 255, 1, anchor);
    this.slots[this.cursor - 1].sprite.spriteFrame = ComicAssets.region(id, crop);
    // A later ordinary put must restore its full frame even when the ID matches.
    this.slots[this.cursor - 1].id = undefined;
    return result;
  }
}

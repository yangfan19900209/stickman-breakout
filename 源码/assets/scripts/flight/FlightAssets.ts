import {
  assetManager,
  AssetManager,
  Texture2D,
  SpriteFrame,
  Rect,
  Size,
  Node,
  Sprite,
  UITransform,
  Color,
} from "cc";
import { node } from "../render/Ink";
import { FlightFrames, FlightFrameId } from "./FlightFrames";

/** Only chapter-three resources are owned here; shared comic assets remain alive. */
export class FlightAssets {
  static ready = false;
  static error = "";
  static frames = new Map<FlightFrameId, SpriteFrame>();
  private static pending?: Promise<void>;
  private static bundle?: AssetManager.Bundle;
  private static texture?: Texture2D;
  private static generation = 0;
  static load(): Promise<void> {
    if (this.ready) return Promise.resolve();
    if (this.pending) return this.pending;
    const generation = this.generation;
    this.pending = new Promise<void>((resolve, reject) => {
      assetManager.loadBundle("level03", (error, bundle) => {
        if (error) {
          reject(error);
          return;
        }
        if (generation !== this.generation) {
          reject(new Error("Flight loading cancelled"));
          return;
        }
        this.bundle = bundle;
        bundle.load("flight-atlas/texture", Texture2D, (err, texture) => {
          if (err) {
            reject(err);
            return;
          }
          if (generation !== this.generation) {
            reject(new Error("Flight loading cancelled"));
            return;
          }
          this.bundle = bundle;
          this.texture = texture;
          texture.setWrapMode(
            Texture2D.WrapMode.CLAMP_TO_EDGE,
            Texture2D.WrapMode.CLAMP_TO_EDGE,
          );
          for (const id of Object.keys(FlightFrames) as FlightFrameId[]) {
            const d = FlightFrames[id],
              frame = new SpriteFrame();
            frame.name = id;
            frame.texture = texture;
            frame.rect = new Rect(...d.atlas);
            frame.originalSize = new Size(...d.size);
            this.frames.set(id, frame);
          }
          this.ready = true;
          this.error = "";
          resolve();
        });
      });
    }).catch((error) => {
      if (generation === this.generation) {
        this.error = String(error);
        this.pending = undefined;
      }
      throw error;
    });
    return this.pending;
  }
  static release(): void {
    this.generation++;
    for (const frame of this.frames.values()) frame.destroy();
    this.frames.clear();
    this.bundle?.releaseAll();
    if (this.bundle) assetManager.removeBundle(this.bundle);
    this.bundle = undefined;
    this.texture = undefined;
    this.pending = undefined;
    this.ready = false;
    this.error = "";
  }
}

/** Pooled image sprites, drawn in source-pixel scale to preserve proportions. */
export class FlightBatch {
  private slots: { n: Node; sprite: Sprite; t: UITransform; color: Color }[] =
    [];
  private cursor = 0;
  constructor(private parent: Node) {}
  begin(): void {
    this.cursor = 0;
  }
  put(
    id: FlightFrameId,
    x: number,
    y: number,
    scale: number,
    angle = 0,
    flip = 1,
    alpha = 255,
    anchor?: readonly number[],
  ): Node {
    const frame = FlightAssets.frames.get(id);
    if (!frame) throw new Error(`Missing flight frame ${id}`);
    let slot = this.slots[this.cursor];
    if (!slot) {
      const n = node(this.parent, `Flight image ${this.cursor}`),
        sprite = n.addComponent(Sprite);
      sprite.sizeMode = Sprite.SizeMode.CUSTOM;
      sprite.trim = false;
      slot = { n, sprite, t: n.getComponent(UITransform)!, color: new Color() };
      this.slots.push(slot);
    }
    this.cursor++;
    const data = FlightFrames[id];
    slot.n.active = true;
    slot.sprite.spriteFrame = frame;
    const a = anchor ?? data.anchor;
    slot.t.setAnchorPoint(a[0], a[1]);
    slot.t.setContentSize(
      data.sourceSize[0] * scale,
      data.sourceSize[1] * scale,
    );
    slot.n.setPosition(x, y);
    slot.n.setScale(flip, 1, 1);
    slot.n.angle = angle;
    slot.color.set(255, 255, 255, alpha);
    slot.sprite.color = slot.color;
    return slot.n;
  }
  end(): void {
    for (let i = this.cursor; i < this.slots.length; i++)
      this.slots[i].n.active = false;
  }
}

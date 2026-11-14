import {
  assetManager,
  Texture2D,
  SpriteFrame,
  Rect,
  Size,
  Node,
  Sprite,
  UITransform,
  Color,
  macro,
} from "cc";
import { node } from "../render/Ink";
import { OceanFrames } from "./OceanFrames";
import { OceanCombatAtlas } from "./OceanCombatAtlas";
import { CombatRegions } from "./OceanCombatFrames";
import { MiniRegions } from "./OceanMiniFrames";
import { FeedbackRegions } from "./OceanFeedbackFrames";
import { OceanUpdateRegions } from "./OceanUpdateFrames";
import { OceanJellyfishRegions } from "./OceanJellyfishFrames";
import { OceanSonarRegions } from "./OceanSonarFrames";
export class OceanAssets {
  static ready = false;
  static error = "";
  private static pending?: Promise<void>;
  private static generation = 0;
  private static textures = new Set<Texture2D>();
  static frames = new Map<string, SpriteFrame>();
  private static regions = new Map<string, SpriteFrame>();
  static region(id:string,crop:readonly number[]):SpriteFrame {
    const key=id+"/"+crop.join(","),cached=this.regions.get(key);
    if(cached)return cached;
    const base=this.frames.get(id)!,frame=new SpriteFrame();
    frame.name=id;frame.texture=base.texture;
    frame.rect=new Rect(base.rect.x+crop[0],base.rect.y+crop[1],crop[2],crop[3]);
    frame.originalSize=new Size(crop[2],crop[3]);this.regions.set(key,frame);return frame;
  }
  /** Call only after chapter sprites and chapter audio have dropped their references. */
  static release(): void {
    this.generation++;
    this.clearOwned();
    this.pending = undefined;
    this.error = "";
  }
  private static clearOwned(): void {
    for(const frame of this.regions.values())frame.destroy();
    this.regions.clear();
    for (const frame of this.frames.values()) frame.destroy();
    this.frames.clear();
    for (const texture of this.textures) assetManager.releaseAsset(texture);
    this.textures.clear();
    this.ready = false;
  }
  static load(): Promise<void> {
    if (this.ready) return Promise.resolve();
    if (this.pending) return this.pending;
    const generation = this.generation;
    const cancelled = () => new Error("Ocean loading cancelled");
    this.pending = new Promise<void>((resolve, reject) =>
      assetManager.loadBundle("level02", (error, bundle) => {
        if (generation !== this.generation) { reject(cancelled()); return; }
        if (error) {
          reject(error);
          return;
        }
        const textures = new Map<string, Promise<Texture2D>>();
        const loadTexture = (file: string) => {
          let pending = textures.get(file);
          if (!pending) {
            pending = new Promise<Texture2D>((ok, fail) =>
              bundle.load(file + "/texture", Texture2D, (err, texture) => {
                // A later load may share this cached texture. A cancelled
                // callback must neither publish it nor release that new load's asset.
                if (generation !== this.generation) { fail(cancelled()); return; }
                if (err) {
                  fail(err);
                  return;
                }
                texture.setWrapMode(
                  Texture2D.WrapMode.CLAMP_TO_EDGE,
                  Texture2D.WrapMode.CLAMP_TO_EDGE,
                );
                this.textures.add(texture);
                ok(texture);
              }),
            );
            textures.set(file, pending);
          }
          return pending;
        };
        Promise.allSettled(
          Object.entries(OceanFrames).map(async ([id, d]) => {
            // Browser already packs small sprites dynamically. Mini games
            // discard source images, so use the prepacked combat texture there.
            const current = OceanJellyfishRegions[id] ?? OceanSonarRegions[id] ?? OceanUpdateRegions[id] ?? FeedbackRegions[id] ?? MiniRegions[id] ?? CombatRegions[id];
            const region =
              current ??
              (macro.CLEANUP_IMAGE_CACHE ? OceanCombatAtlas[id] : undefined);
            const t = await loadTexture(
              current ? d.file : region ? "combat-atlas" : d.file,
            );
            if (generation !== this.generation) throw cancelled();
            const f = new SpriteFrame();
            f.name = id;
            f.texture = t;
            f.rect = region
              ? new Rect(...region)
              : new Rect(0, 0, t.width, t.height);
            f.originalSize = new Size(d.size[0], d.size[1]);
            this.frames.set(id, f);
          }),
        ).then((results) => {
          if (generation !== this.generation) { reject(cancelled()); return; }
          const failed = results.find((r): r is PromiseRejectedResult => r.status === "rejected");
          if (failed) { reject(failed.reason); return; }
          this.ready = true;
          this.error = "";
          resolve();
        }, reject);
      }),
    ).catch((error) => {
      if (generation === this.generation) {
        this.clearOwned();
        this.error = String(error);
        this.pending = undefined;
      }
      throw error;
    });
    return this.pending;
  }
}
export class OceanBatch {
  private slots: {
    n: Node;
    s: Sprite;
    t: UITransform;
    color: Color;
    alpha: number;
    tinted?: boolean;
  }[] = [];
  private static readonly center = [0.5, 0.5] as const;
  private cursor = 0;
  constructor(private parent: Node) {}
  begin() {
    this.cursor = 0;
  }
  put(
    id: string,
    x: number,
    y: number,
    w: number,
    h?: number,
    angle = 0,
    flip = 1,
    alpha = 255,
    anchor: readonly number[] = OceanBatch.center,
  ) {
    const f = OceanAssets.frames.get(id);
    if (!f) throw new Error(`Missing ocean frame: ${id}`);
    let slot = this.slots[this.cursor];
    if (!slot) {
      const n = node(this.parent, `Sea sprite ${this.cursor}`),
        s = n.addComponent(Sprite);
      s.sizeMode = Sprite.SizeMode.CUSTOM;
      s.trim = false;
      slot = {
        n,
        s,
        t: n.getComponent(UITransform)!,
        color: new Color(),
        alpha: -1,
      };
      this.slots.push(slot);
    }
    this.cursor++;
    slot.n.active = true;
    if (slot.s.spriteFrame !== f) slot.s.spriteFrame = f;
    slot.t.setAnchorPoint(anchor[0], anchor[1]);
    slot.t.setContentSize(
      w,
      h ?? (w * f.originalSize.height) / f.originalSize.width,
    );
    slot.n.setPosition(x, y);
    slot.n.setScale(flip, 1, 1);
    slot.n.angle = angle;
    if (slot.alpha !== alpha || slot.tinted) {
      slot.color.set(255, 255, 255, alpha);
      slot.s.color = slot.color;
      slot.alpha = alpha;
      slot.tinted = false;
    }
    return slot.n;
  }
  end() {
    for (let i = this.cursor; i < this.slots.length; i++)
      this.slots[i].n.active = false;
  }
  tintLast(rgb: readonly [number, number, number]): void {
    const slot = this.slots[this.cursor - 1];
    slot.color.set(rgb[0], rgb[1], rgb[2], slot.color.a);
    slot.s.color = slot.color;
    slot.tinted = true;
  }
  putRegion(id:string,x:number,y:number,w:number,h:number,angle:number,crop:readonly number[]) {
    const n=this.put(id,x,y,w,h,angle,1,255,[1,.5]);
    this.slots[this.cursor-1].s.spriteFrame=OceanAssets.region(id,crop);
    return n;
  }
  destroy(): void {
    for (const slot of this.slots) {
      slot.s.spriteFrame = null;
      slot.n.active = false;
      slot.n.destroy();
    }
    this.slots.length = 0;
    this.cursor = 0;
  }
}

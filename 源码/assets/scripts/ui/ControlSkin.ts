import {
  assetManager,
  Color,
  Node,
  Rect,
  Size,
  Sprite,
  SpriteFrame,
  Texture2D,
  UITransform,
} from "cc";
import { node } from "../render/Ink";
import { ControlFrames, ControlFrameId } from "./ControlFrames";

/** Generated comic art, preloaded once for both chapters. No procedural art fallback. */
export class ControlArt {
  static ready = false;
  private static frames = new Map<ControlFrameId, SpriteFrame>();
  static async load(): Promise<void> {
    if (this.ready) return;
    const bundle = await new Promise<import("cc").AssetManager.Bundle>(
      (resolve, reject) =>
        assetManager.loadBundle("landart", (error, loaded) =>
          error ? reject(error) : resolve(loaded),
        ),
    );
    const texture = await new Promise<Texture2D>((resolve, reject) =>
      bundle.load("controls/texture", Texture2D, (error, loaded) =>
        error ? reject(error) : resolve(loaded),
      ),
    );
    texture.setWrapMode(
      Texture2D.WrapMode.CLAMP_TO_EDGE,
      Texture2D.WrapMode.CLAMP_TO_EDGE,
    );
    for (const id of Object.keys(ControlFrames) as ControlFrameId[]) {
      const data = ControlFrames[id],
        frame = new SpriteFrame();
      frame.name = `ui.${id}`;
      frame.texture = texture;
      frame.rect = new Rect(...data.rect);
      frame.originalSize = new Size(...data.size);
      if (id === "menu")
        frame.insetLeft =
          frame.insetRight =
          frame.insetTop =
          frame.insetBottom =
            64;
      this.frames.set(id, frame);
    }
    this.ready = true;
  }
  static sprite(
    parent: Node,
    name: string,
    id: ControlFrameId,
    w: number,
    h: number,
  ): Sprite {
    let target = parent.getChildByName(name);
    if (!target) target = node(parent, name);
    let sprite = target.getComponent(Sprite);
    if (!sprite) sprite = target.addComponent(Sprite);
    sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    sprite.trim = false;
    sprite.type = id === "menu" ? Sprite.Type.SLICED : Sprite.Type.SIMPLE;
    const frame = this.frames.get(id);
    if (!frame) throw new Error(`Control art not preloaded: ${id}`);
    if (sprite.spriteFrame !== frame) sprite.spriteFrame = frame;
    // The generated menu has rounded corners extending about 60 source pixels.
    // Slice past the whole corner, then convert that source scale to UI units;
    // tiny insets stretch the curved outline across the button's middle.
    const scale = id === "menu" ? 0.35 : 1;
    if (id === "menu") target.setScale(scale, scale, 1);
    target.getComponent(UITransform)!.setContentSize(w / scale, h / scale);
    return sprite;
  }
}
export const controlColors = {
  ink: new Color(24, 24, 24),
  normal: new Color(255, 255, 255),
  pressed: new Color(226, 226, 226),
  disabled: new Color(172, 172, 172),
};

/** Keep the playfield visible while clearly separating ready and disabled controls. */
export const combatControlColors = {
  normal: new Color(255, 255, 255, 200),
  pressed: new Color(242, 242, 242, 240),
  disabled: new Color(172, 172, 172, 80),
  cooldown: new Color(145, 145, 145, 45),
};

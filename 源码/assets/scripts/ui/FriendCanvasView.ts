import { ImageAsset, Node, Sprite, SpriteFrame, Texture2D } from "cc";
import { OpenContext } from "../platform/SocialBridge";

/** Public engine texture APIs, with a landscape sharedCanvas. No pixel readback. */
export class FriendCanvasView {
  private context?: OpenContext;
  private image?: ImageAsset;
  private texture?: Texture2D;
  private frame?: SpriteFrame;
  private elapsed = 0;
  constructor(readonly node: Node) {}
  attach(context: OpenContext): void {
    if (this.context) return;
    this.context = context;
    context.canvas.width = 960; context.canvas.height = 340;
    this.image = new ImageAsset(); this.image.reset(context.canvas);
    this.texture = new Texture2D(); this.texture.image = this.image; this.texture.create(960, 340);
    this.frame = new SpriteFrame(); this.frame.texture = this.texture;
    const sprite = this.node.addComponent(Sprite); sprite.sizeMode = Sprite.SizeMode.CUSTOM;
    sprite.spriteFrame = this.frame;
  }
  update(dt: number): void {
    if (!this.node.activeInHierarchy || !this.context || !this.texture) return;
    this.elapsed += dt; if (this.elapsed < 1 / 15) return; this.elapsed = 0;
    this.texture.uploadData(this.context.canvas);
  }
  destroy(): void { this.frame?.destroy(); this.texture?.destroy(); this.image?.destroy(); this.context = undefined; }
}

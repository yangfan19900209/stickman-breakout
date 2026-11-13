import { ComicAssets, ComicBatch } from "./ComicAssets";
import { GameSession } from "../core/GameSession";
import { DestructibleObject } from "../world/DestructibleObject";
import { Ink } from "./Ink";
import { drawnPlatformTiles } from "./LandDrawnPlan";
import { objectPresentation, pickupPresentation } from "./ObjectPresentation";
import { Sprite, UITransform } from "cc";

export class ComicObjectArt {
  readonly rendered:{id:string;frame:string;width:number;height:number;alive:boolean;y:number}[]=[];
  readonly renderedPickups:{kind:string;frame:string;width:number;height:number;x:number;y:number}[]=[];
  readonly renderedMechanisms:{x:number;y:number;width:number;height:number;segments:{x:number;y:number;width:number;height:number}[]}[]=[];
  private batch?: ComicBatch;
  begin(ink: Ink): void {
    this.rendered.length=0;
    this.renderedPickups.length=0;
    this.renderedMechanisms.length=0;
    this.batch ??= new ComicBatch(ink.node, "Comic objects");
    this.batch.begin();
  }
  end(): void {
    this.batch?.end();
  }
  draw(o: DestructibleObject, cam: number): boolean {
    if (!ComicAssets.enabled || o.kind === "rope") return false;
    const visual=objectPresentation(o),id=visual.id;
    const x = o.x - cam + o.w / 2;
    if (o.alive) {
      const n=this.batch!.put(
        id,
        x + (o.hitTime > 0 ? Math.sin(o.hitTime * 120) * 1.5 : 0),
        o.y,
        visual.width,
        visual.height,
        0,
        // Timber stays opaque so background outlines cannot ghost through it
        // and resemble a second nested crate during the hit flash.
        (o.kind==='wood'||o.kind==='hanging')?255:o.hitTime > 0.12 ? 180 : 255,
        1,
        [0.5, 0],
      );
      const t=n.getComponent(UITransform)!;
      this.rendered.push({id:o.id,frame:n.getComponent(Sprite)!.spriteFrame!.name,width:t.width,height:t.height,alive:true,y:n.position.y});
    } else if (o.kind === "sandbag") {
      // Physical bag fragments replace the pile; never squeeze its old image.
    } else if (o.kind === "barrel") {
      // This supplied frame is a bursting barrel, not a flattened wreck.
      if (o.deadTime < 0.4) this.batch!.put(
        id, x, o.y - 2, o.w * (2.2 + o.deadTime), undefined,
        0, Math.round(255 * (1 - o.deadTime / 0.4)), 1, [0.5, 0],
      );
    } else if (o.deadTime < 3) {
      const n = this.batch!.put(
        id,
        x,
        o.y - 2,
        o.w * 1.25,
        Math.min(o.h * 0.52, 25),
        0,
        Math.min(255, (3 - o.deadTime) * 255),
        1,
        [0.5, 0],
      );
      const t = n.getComponent(UITransform)!;
      this.rendered.push({id:o.id,frame:n.getComponent(Sprite)!.spriteFrame!.name,width:t.width,height:t.height,alive:false,y:n.position.y});
    }
    return true;
  }
  mechanism(x: number, y: number, w: number, h: number, cam=0): void {
    const segments=[];
    for(const t of drawnPlatformTiles(x,y+h,w)){
      const n=this.batch!.tile(t,cam),size=n.getComponent(UITransform)!;
      segments.push({x:n.position.x,y:n.position.y,width:size.width*Math.abs(n.scale.x),height:size.height*Math.abs(n.scale.y)});
    }
    this.renderedMechanisms.push({x:x-cam,y,width:w,height:h,segments});
  }
  pickup(s: GameSession, p: GameSession["pickups"]["items"][number]): void {
    const visual = pickupPresentation(p.kind);
    const n = this.batch!.put(
      visual.id,
      p.x - s.camera.x,
      p.y - 4 + Math.sin(p.age * 5) * 2,
      visual.width,
      visual.height,
      0,
      255,
      1,
      [0.5, 0],
    );
    const t = n.getComponent(UITransform)!;
    this.renderedPickups.push({kind:p.kind,frame:n.getComponent(Sprite)!.spriteFrame!.name,
      width:t.width,height:t.height,x:n.position.x,y:n.position.y});
  }
}

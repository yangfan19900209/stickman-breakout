import { Label, Node } from "cc";
import { LevelController } from "../level/LevelController";
import { Ink, colors, node } from "./Ink";
export class LevelRenderer {
  private far: Node;
  private mid: Node;
  private terrain: Node;
  private gate: Ink;
  constructor(parent: Node, level: LevelController) {
    this.far = node(parent, "Distant skyline");
    this.mid = node(parent, "Wires and buildings");
    this.terrain = node(parent, "Terrain");
    const far = new Ink(this.far),
      mid = new Ink(this.mid),
      ground = new Ink(this.terrain);
    for (let x = -400; x < 4800; x += 270) {
      const h = 110 + (Math.abs(x * 17) % 140);
      far.rect(x, 150, 180, h, colors.far, undefined, 1.5);
      far.line(
        [
          { x: x - 10, y: 150 + h },
          { x: x + 70, y: 170 + h },
          { x: x + 190, y: 150 + h },
        ],
        1.5,
        colors.far,
      );
      for (let wy = 185; wy < 150 + h - 15; wy += 35)
        for (let wx = x + 20; wx < x + 165; wx += 40)
          far.rect(wx, wy, 16, 19, colors.far, undefined, 1);
    }
    for (let x = 0; x < 4400; x += 520) {
      mid.line(
        [
          { x: x + 160, y: 150 },
          { x: x + 160, y: 410 },
          { x: x + 150, y: 414 },
        ],
        2,
        colors.muted,
      );
      mid.line(
        [
          { x: x + 128, y: 386 },
          { x: x + 190, y: 386 },
        ],
        2,
        colors.muted,
      );
      mid.line(
        [
          { x: x + 160, y: 395 },
          { x: x + 320, y: 353 },
          { x: x + 500, y: 353 },
          { x: x + 680, y: 395 },
        ],
        1,
        colors.far,
      );
    }
    for (const x of [820, 1660, 2820, 3430]) {
      mid.rect(x, 150, 360, 220, colors.far, undefined, 2);
      mid.line(
        [
          { x: x - 12, y: 370 },
          { x: x + 380, y: 370 },
        ],
        3,
        colors.far,
      );
      mid.rect(x + 70, 150, 76, 106, colors.far, undefined, 2);
      mid.rect(x + 220, 240, 70, 48, colors.far, undefined, 2);
    }
    for (const s of level.solids) {
      ground.rect(
        s.x,
        s.y,
        s.w,
        s.h,
        colors.ink,
        colors.paper,
        s.kind === "ground" ? 3 : 2.5,
      );
      if (s.kind === "crate") {
        ground.line(
          [
            { x: s.x + 7, y: s.y + 7 },
            { x: s.x + s.w - 7, y: s.y + s.h - 7 },
          ],
          2,
        );
        ground.line(
          [
            { x: s.x + 7, y: s.y + s.h - 7 },
            { x: s.x + s.w - 7, y: s.y + 7 },
          ],
          2,
        );
        ground.rect(
          s.x + 5,
          s.y + 5,
          s.w - 10,
          s.h - 10,
          colors.ink,
          undefined,
          1,
        );
      } else {
        for (let x = s.x + 12; x < s.x + s.w; x += 24)
          ground.line(
            [
              { x, y: s.y + s.h - 6 },
              { x: x - 7, y: s.y + s.h - 15 },
            ],
            1,
            colors.muted,
          );
      }
      if (s.kind === "platform")
        for (const x of [s.x + 20, s.x + s.w - 20])
          ground.line(
            [
              { x, y: 150 },
              { x, y: s.y },
            ],
            2,
            colors.muted,
          );
    }
    for (let x = 50; x < 4000; x += 103)
      ground.line(
        [
          { x, y: 131 },
          { x: x + 15, y: 127 },
          { x: x + 32, y: 131 },
        ],
        1,
        colors.far,
      );
    const sign = (text: string, x: number, y: number, size = 16) => {
      const n = node(this.terrain, text, x, y, 220, 36);
      const l = n.addComponent(Label);
      l.string = text;
      l.fontSize = size;
      l.color = colors.muted;
      l.fontFamily = "sans-serif";
    };
    sign("01 / ABANDONED BASE", 240, 310);
    sign("仓储区 →", 1120, 427, 22);
    sign("限制区域", 3180, 340, 22);
    sign("出口  /  EXIT", 3850, 336, 22);
    ground.line(
      [
        { x: 3780, y: 150 },
        { x: 3780, y: 300 },
        { x: 3920, y: 300 },
        { x: 3920, y: 150 },
      ],
      4,
    );
    ground.line(
      [
        { x: 3840, y: 265 },
        { x: 3870, y: 265 },
        { x: 3860, y: 276 },
      ],
      2,
    );
    this.gate = new Ink(node(this.terrain, "Exit gate"));
    this.update(0, false);
  }
  update(cameraX: number, unlocked: boolean): void {
    this.far.setPosition(-cameraX * 0.18, 0);
    this.mid.setPosition(-cameraX * 0.45, 0);
    this.terrain.setPosition(-cameraX, 0);
    this.gate.clear();
    if (!unlocked)
      for (let x = 3800; x < 3920; x += 22)
        this.gate.line(
          [
            { x, y: 154 },
            { x, y: 292 },
          ],
          2,
          colors.muted,
        );
    else
      this.gate.line(
        [
          { x: 3800, y: 208 },
          { x: 3828, y: 190 },
          { x: 3878, y: 235 },
        ],
        4,
      );
  }
}

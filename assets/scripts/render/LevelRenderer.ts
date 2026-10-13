import { Label, Node } from "cc";
import { LevelController } from "../level/LevelController";
import { Ink, colors, node } from "./Ink";
import { SceneryArt as Art } from "./SceneryArt";
interface Chunk {
  node: Node;
  x: number;
  factor: number;
}
export class LevelRenderer {
  private chunks: Chunk[] = [];
  private gate: Ink;
  visibleChunks = 0;
  constructor(parent: Node, level: LevelController) {
    for (const factor of [0.16, 0.42, 1])
      for (let x = -800; x < level.data.width + 1600; x += 800) {
        const n = node(parent, `Scenery ${factor}/${x}`, x, 0, 820, 650),
          g = new Ink(n),
          index = Math.floor(x / 800);
        this.chunks.push({ node: n, x, factor });
        if (factor === 0.16) {
          for (let i = 0; i < 3; i++)
            Art.cloud(
              g,
              30 + i * 260,
              490 + ((index + i + 9) % 3) * 47,
              0.8 + ((index + i + 8) % 2) * 0.3,
            );
          g.line(
            [
              { x: -10, y: 240 },
              { x: 70, y: 333 },
              { x: 140, y: 291 },
              { x: 260, y: 403 },
              { x: 380, y: 290 },
              { x: 470, y: 350 },
              { x: 580, y: 303 },
              { x: 700, y: 377 },
              { x: 810, y: 240 },
            ],
            1.5,
            colors.far,
          );
          for (let i = 0; i < 2; i++) {
            const bx = 170 + i * 340;
            g.rect(bx, 150, 190, 160 + i * 40, colors.far, undefined, 1);
            for (let wy = 185; wy < 290; wy += 37)
              for (let wx = bx + 18; wx < bx + 176; wx += 40)
                g.rect(wx, wy, 16, 22, colors.far, undefined, 1);
          }
          Art.truck(g, 590, 158);
        } else if (factor === 0.42) {
          if ((index + 9) % 3 === 0) Art.bunker(g, 180, 150, 300);
          else if ((index + 9) % 3 === 1) Art.factory(g, 120, 150);
          else Art.crane(g, 300, 150);
          Art.tower(g, 690, 150);
          g.segment(24, 150, 24, 390, 2, colors.muted);
          g.segment(6, 363, 46, 363, 2, colors.muted);
          g.line(
            [
              { x: 24, y: 377 },
              { x: 165, y: 346 },
              { x: 315, y: 328 },
              { x: 490, y: 345 },
              { x: 700, y: 377 },
            ],
            1,
            colors.muted,
          );
          for (let px = 25; px < 770; px += 80) {
            g.segment(px, 150, px, 212, 1.2, colors.far);
            g.segment(px, 195, px + 80, 195, 1, colors.far);
          }
        } else {
          for (const s of level.staticSolids) {
            if (s.x + s.w <= x || s.x >= x + 800) continue;
            const left = Math.max(s.x, x) - x,
              right = Math.min(s.x + s.w, x + 800) - x;
            if (s.kind === "ground") {
              g.g.fillColor = colors.paper;
              g.g.rect(left, s.y, right - left, s.h);
              g.g.fill();
              for (let px = left; px < right; px += 32)
                g.segment(
                  px,
                  s.y + s.h + Math.sin((x + px) * 0.15) * 0.65,
                  Math.min(right, px + 32),
                  s.y + s.h + Math.sin((x + px + 32) * 0.15) * 0.65,
                  3,
                );
              g.segment(left, 50, right, 50, 2);
              for (let px = left + 12; px < right; px += 63) {
                g.line(
                  [
                    { x: px, y: 132 },
                    { x: px + 10, y: 126 },
                    { x: px + 26, y: 130 },
                  ],
                  1,
                  colors.muted,
                );
                g.ellipse(px + 30, 145, 5, 2, colors.muted, undefined, 1);
              }
            } else {
              g.rect(left, s.y, right - left, s.h, colors.ink, colors.paper, 3);
              g.segment(
                left,
                s.y + s.h - 5,
                right,
                s.y + s.h - 5,
                1,
                colors.muted,
              );
              for (let px = left + 10; px < right - 6; px += 30) {
                g.circle(
                  px,
                  s.y + Math.min(s.h / 2, 9),
                  1.8,
                  colors.ink,
                  colors.ink,
                  1,
                );
              }
              if (s.kind === "platform")
                for (const wx of [s.x + 12, s.x + s.w - 12])
                  if (wx >= x && wx < x + 800) {
                    g.segment(wx - x, 150, wx - x, s.y, 2, colors.muted);
                    for (let h = 160; h < s.y - 20; h += 25)
                      g.segment(
                        wx - x - 6,
                        h,
                        wx - x + 6,
                        h + 20,
                        1,
                        colors.muted,
                      );
                  }
            }
          }
          for (let px = 80; px < 790; px += 220) {
            g.ellipse(px, 137, 9, 4, colors.muted, undefined, 1.5);
            g.segment(px - 20, 119, px - 13, 117, 1.2, colors.muted);
            g.segment(px + 35, 126, px + 39, 128, 1.2, colors.muted);
          }
          if (index === 0) {
            this.label(n, "废弃前哨站 / SECTOR 01", 250, 423, 19);
            g.rect(102, 354, 170, 45, colors.ink, colors.paper, 2);
            this.label(n, "注意：可破坏补给箱", 188, 376, 14);
            g.segment(115, 150, 115, 354, 3, colors.muted);
            g.segment(261, 150, 261, 354, 3, colors.muted);
          }
        }
      }
    const exitRoot = node(parent, "Exit gate"),
      exit = level.data.exit.x;
    this.gate = new Ink(exitRoot);
    this.label(exitRoot, "出口 / EXIT", exit, 327, 23);
    this.gate.node.setPosition(0, 0);
    this.exitX = exit;
  }
  private exitX = 0;
  private label(
    parent: Node,
    value: string,
    x: number,
    y: number,
    size: number,
  ): void {
    const n = node(parent, value, x, y, 500, 42),
      l = n.addComponent(Label);
    l.string = value;
    l.fontSize = size;
    l.color = colors.muted;
    l.fontFamily = "sans-serif";
  }
  update(cameraX: number, unlocked: boolean): void {
    this.visibleChunks = 0;
    for (const c of this.chunks) {
      const px = c.x - cameraX * c.factor;
      c.node.setPosition(px, 0);
      c.node.active = px < 1350 && px + 820 > -70;
      if (c.node.active) this.visibleChunks++;
    }
    this.gate.node.setPosition(-cameraX, 0);
    this.gate.clear();
    const x = this.exitX;
    this.gate.line(
      [
        { x: x - 75, y: 150 },
        { x: x - 75, y: 298 },
        { x: x + 75, y: 298 },
        { x: x + 75, y: 150 },
      ],
      4,
    );
    if (!unlocked)
      for (let px = x - 55; px < x + 70; px += 22)
        this.gate.segment(px, 154, px, 291, 2, colors.muted);
    else
      this.gate.line(
        [
          { x: x - 42, y: 210 },
          { x: x - 14, y: 192 },
          { x: x + 40, y: 241 },
        ],
        4,
      );
  }
}

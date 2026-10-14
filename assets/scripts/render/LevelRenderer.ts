import { Label, Node } from "cc";
import { surfaceY } from "../core/Types";
import { LevelController } from "../level/LevelController";
import { Ink, colors, node } from "./Ink";
import { SceneryArt as Art } from "./SceneryArt";
import { GameConfig as C } from "../core/GameConfig";
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
        if (factor === 1) g.strokeScale = C.rendering.lineWidths.platform / 3;
        if (factor === 0.16) {
          for (let i = 0; i < 3; i++)
            Art.cloud(
              g,
              30 + i * 260,
              365 + ((index + i + 9) % 3) * 24,
              0.8 + ((index + i + 8) % 2) * 0.3,
            );
          Art.ridge(g, index + 12);
          Art.truck(g, 590, 158);
        } else if (factor === 0.42) {
          if ((index + 9) % 3 === 0) Art.bunker(g, 180, 150, 300);
          else if ((index + 9) % 3 === 1) Art.factory(g, 120, 150);
          else Art.crane(g, 300, 150);
          if ((index + 9) % 2 === 0) Art.tower(g, 700, 150);
          Art.serviceBay(g, 510, 150);
          g.segment(24, 150, 21, 344, 2.5, colors.mid);
          g.segment(3, 329, 44, 327, 3, colors.mid);
          for (const px of [8, 37]) {
            g.ellipse(px, 334, 3, 5, colors.mid, colors.paper, 1.5);
          }
          g.g.moveTo(24, 338);
          g.g.bezierCurveTo(224, 268, 510, 279, 812, 338);
          g.g.strokeColor = colors.mid;
          g.g.lineWidth = 1.8;
          g.g.stroke();
        } else {
          for (const s of level.staticSolids) {
            if (s.x + s.w <= x || s.x >= x + 800) continue;
            const left = Math.max(s.x, x) - x,
              right = Math.min(s.x + s.w, x + 800) - x;
            if (s.kind === "ground") {
              const top = (px: number) => surfaceY(s, x + px);
              const outline: { x: number; y: number }[] = [];
              for (let px = left; px < right; px += 14)
                outline.push({
                  x: px,
                  y: top(px) + Math.sin((x + px) * 0.17) * 0.75,
                });
              outline.push({
                x: right,
                y: top(right) + Math.sin((x + right) * 0.17) * 0.75,
              });
              g.polygon(
                [...outline, { x: right, y: -240 }, { x: left, y: -240 }],
                colors.paper,
              );
              g.line(outline, 3, colors.ink);
              // Broken strata follow the actual contour; only the walking edge is solid black.
              for (let px = left + 8; px < right - 30; px += 71) {
                const py = top(px);
                g.line(
                  [
                    { x: px, y: py - 9 },
                    { x: px + 13, y: py - 12 },
                    { x: px + 28, y: top(px + 28) - 10 },
                  ],
                  1.1,
                  colors.muted,
                );
                g.line(
                  [
                    { x: px + 14, y: py - 43 },
                    { x: px + 22, y: py - 48 },
                    { x: px + 40, y: py - 44 },
                  ],
                  0.8,
                  colors.mid,
                );
                if (Math.floor((x + px) / 71) % 3 === 0)
                  Art.rock(g, px + 12, py - 3, 0.32, true);
              }
              const count = Math.ceil((right - left) / 13);
              for (let i = 0; i < count; i++) {
                const px =
                  left + ((i * 137 + index * 41 + 8000) % (right - left));
                g.g.circle(
                  px,
                  top(px) - 21 - ((i * 71 + 19) % 320),
                  i % 7 === 0 ? 1.6 : 0.75,
                );
              }
              g.g.fillColor = colors.mid;
              g.g.fill();
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
                    g.rect(
                      wx - x - 5,
                      level.groundY(wx),
                      10,
                      s.y - level.groundY(wx),
                      colors.ink,
                      colors.wall,
                      1.8,
                    );
                  }
              if (s.kind === "platform" && s.x >= x && s.x + s.w <= x + 800) {
                const a = s.x - x + 18,
                  b = s.x - x + s.w - 18;
                g.segment(
                  a,
                  level.groundY(x + a) + 3,
                  b,
                  s.y - 4,
                  6,
                  colors.ink,
                );
                g.segment(
                  a,
                  level.groundY(x + a) + 3,
                  b,
                  s.y - 4,
                  2.6,
                  colors.wall,
                );
                g.segment(
                  b,
                  level.groundY(x + b) + 3,
                  a,
                  s.y - 4,
                  6,
                  colors.ink,
                );
                g.segment(
                  b,
                  level.groundY(x + b) + 3,
                  a,
                  s.y - 4,
                  2.6,
                  colors.wall,
                );
              }
            }
          }
          if (index === 0) {
            g.segment(310, 150, 310, 221, 4, colors.mid);
            g.rect(275, 204, 102, 27, colors.mid, colors.paper, 1.4);
            this.label(n, "前哨站  →", 326, 218, 15);
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
  private lastUnlocked: boolean | null = null;
  update(cameraX: number, unlocked: boolean, visibleWidth = 1280): void {
    this.visibleChunks = 0;
    for (const c of this.chunks) {
      const px = c.x - cameraX * c.factor;
      c.node.setPosition(px, 0);
      c.node.active = px < visibleWidth + 70 && px + 820 > -70;
      if (c.node.active) this.visibleChunks++;
    }
    this.gate.node.setPosition(-cameraX, 0);
    this.gate.node.active = this.exitX - cameraX < visibleWidth + 100;
    if (this.lastUnlocked === unlocked) return;
    this.lastUnlocked = unlocked;
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

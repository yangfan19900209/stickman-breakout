import { Color, Label, Node } from "cc";
import { GameSession } from "../core/GameSession";
import { Ink, colors, node } from "./Ink";
export class ObjectRenderer {
  private ink: Ink;
  private labels: Label[] = [];
  constructor(parent: Node) {
    this.ink = new Ink(node(parent, "Destructibles and pickups"));
    this.ink.strokeScale = 1.8;
    for (let i = 0; i < 32; i++) {
      const n = node(parent, "Pickup glyph", 0, 0, 44, 40),
        l = n.addComponent(Label);
      l.fontSize = 20;
      l.color = colors.ink;
      l.fontFamily = "sans-serif";
      this.labels.push(l);
    }
  }
  draw(s: GameSession): void {
    const ink = this.ink,
      cam = s.camera.x;
    ink.clear();
    for (const o of s.level.objects.objects) {
      if (o.x + o.w < cam - 50 || o.x > cam + s.camera.visibleWidth + 50)
        continue;
      const x = o.x - cam,
        y = o.y,
        w = o.w,
        h = o.h;
      if (!o.alive) {
        if (o.kind === "barrel" && o.deadTime < 0.09) {
          ink.rect(x - 2, y - 2, w + 4, h + 4, colors.ink, colors.white, 4);
          ink.segment(x, y, x + w, y + h, 4);
          ink.segment(x + w, y, x, y + h, 4);
        } else if (o.deadTime < 0.75) {
          for (let n = 0; n < 6; n++) {
            const age = o.deadTime,
              dx = x + w / 2 + (n - 2.5) * age * 80,
              dy = y + h * 0.5 + (90 + (n % 3) * 65) * age - age * age * 310;
            const angle = n + age * (n % 2 ? 6 : -6),
              cs = Math.cos(angle),
              sn = Math.sin(angle);
            const pts = [
              { x: dx - 12 * cs + 4 * sn, y: dy - 12 * sn - 4 * cs },
              { x: dx + 12 * cs + 4 * sn, y: dy + 12 * sn - 4 * cs },
              { x: dx + 10 * cs - 4 * sn, y: dy + 10 * sn + 4 * cs },
              { x: dx - 10 * cs - 4 * sn, y: dy - 10 * sn + 4 * cs },
            ];
            ink.polygon(
              pts,
              o.kind === "wood" || o.kind === "hanging"
                ? colors.paper
                : colors.mid,
            );
            pts.push(pts[0]);
            ink.line(pts, 2.5);
          }
        }
        continue;
      }
      const shade = o.hitTime > 0 ? new Color(185, 185, 180) : colors.paper;
      if (o.kind === "rope") {
        ink.segment(x + w / 2, y, x + w / 2, y + h, 3);
        for (let t = y; t < y + h; t += 9)
          ink.segment(x + w / 2 - 3, t, x + w / 2 + 3, t + 5, 1, colors.muted);
      } else if (o.kind === "barrel") {
        ink.rect(x, y, w, h, colors.ink, shade, 2.5);
        ink.line(
          [
            { x: x + 3, y: y + 12 },
            { x: x + w - 3, y: y + 12 },
          ],
          3,
        );
        ink.line(
          [
            { x: x + 3, y: y + h - 12 },
            { x: x + w - 3, y: y + h - 12 },
          ],
          3,
        );
        ink.circle(x + w / 2, y + h / 2, 8, colors.ink, undefined, 2);
        ink.line(
          [
            { x: x + w / 2 - 4, y: y + h / 2 + 4 },
            { x: x + w / 2 + 4, y: y + h / 2 - 4 },
          ],
          2,
        );
        ink.rect(x + 5, y + h - 4, 8, 4, colors.ink, colors.paper, 1);
      } else if (o.kind === "sandbag") {
        for (let row = 0; row < 3; row++)
          for (let n = 0; n < 3; n++) {
            const bx = x + (n * w) / 3 + (row % 2 ? 5 : 0);
            // Rounded sacks distinguish soft cover from the box/steel silhouettes.
            const g = ink.g;
            g.roundRect(bx, y + (row * h) / 3, w / 3 - 3, h / 3 - 2, 7);
            g.fillColor = shade;
            g.fill();
            g.strokeColor = colors.ink;
            g.lineWidth = 3.6;
            g.stroke();
            ink.line(
              [
                { x: bx + 5, y: y + (row * h) / 3 + 4 },
                { x: bx + 12, y: y + (row * h) / 3 + 6 },
              ],
              1,
              colors.muted,
            );
          }
      } else {
        ink.rect(
          x,
          y,
          w,
          h,
          colors.ink,
          shade,
          o.category === "indestructible" ? 5 : 2.5,
        );
        ink.rect(x + 5, y + 5, w - 10, h - 10, colors.muted, undefined, 1);
        if (o.kind === "wood" || o.kind === "hanging") {
          ink.segment(
            x + 9,
            y + h - 9,
            x + w * 0.4,
            y + h - 10,
            1,
            colors.muted,
          );
          ink.segment(x + w * 0.65, y + 9, x + w - 9, y + 10, 1, colors.muted);
        }
        if (o.kind === "steel" || o.kind === "concrete") {
          for (const a of [8, w - 8])
            for (const b of [8, h - 8])
              ink.circle(x + a, y + b, 2, colors.ink, colors.ink, 1);
          ink.line(
            [
              { x: x + 10, y: y + h / 2 },
              { x: x + w - 10, y: y + h / 2 },
            ],
            3,
          );
        } else {
          ink.line(
            [
              { x: x + 6, y: y + 6 },
              { x: x + w - 6, y: y + h - 6 },
            ],
            2,
          );
          ink.line(
            [
              { x: x + 6, y: y + h - 6 },
              { x: x + w - 6, y: y + 6 },
            ],
            2,
          );
        }
        if (o.data.drop && !o.data.hidden) {
          ink.rect(
            x + w / 2 - 10,
            y + h / 2 - 9,
            20,
            18,
            colors.ink,
            colors.paper,
            1.5,
          );
          ink.line(
            [
              { x: x + w / 2 - 5, y: y + h / 2 },
              { x: x + w / 2 + 5, y: y + h / 2 },
            ],
            2,
          );
          ink.line(
            [
              { x: x + w / 2, y: y + h / 2 - 5 },
              { x: x + w / 2, y: y + h / 2 + 5 },
            ],
            2,
          );
        }
      }
      if (o.health < o.maxHealth) {
        const damage = 1 - o.health / o.maxHealth;
        ink.line(
          [
            { x: x + w * 0.28, y: y + h },
            { x: x + w * 0.4, y: y + h * 0.62 },
            { x: x + w * 0.58, y: y + h * 0.7 },
            { x: x + w * 0.47, y: y + h * (0.6 - damage * 0.5) },
          ],
          2.5,
        );
      }
      if (o.kind === "hanging" && !o.triggered)
        ink.line(
          [
            { x: x + w / 2, y: y + h },
            { x: x + w / 2, y: y + h + 80 },
          ],
          2,
        );
    }
    for (const m of s.level.mechanisms) {
      const r = m.rect,
        x = r.x - cam;
      if (x + r.w < 0 || x > s.camera.visibleWidth) continue;
      ink.rect(x, r.y, r.w, r.h, colors.ink, colors.paper, 3);
      for (let t = 12; t < r.w - 8; t += 24)
        ink.circle(x + t, r.y + r.h / 2, 2, colors.ink, colors.ink, 1);
      if (m.data.kind === "lift") {
        ink.segment(x + 12, 150, x + 12, m.data.maxY + 44, 1.5, colors.muted);
        ink.segment(
          x + r.w - 12,
          150,
          x + r.w - 12,
          m.data.maxY + 44,
          1.5,
          colors.muted,
        );
        ink.segment(
          x + r.w / 2,
          r.y + 8,
          x + r.w / 2,
          m.data.maxY + 42,
          2,
          colors.muted,
        );
      } else if (!m.released) {
        ink.segment(x + 16, r.y + r.h, x + 16, r.y + 100, 2);
        ink.segment(x + r.w - 16, r.y + r.h, x + r.w - 16, r.y + 100, 2);
      }
    }
    for (const z of s.level.data.zones ?? []) {
      if (z.id === "D" || s.level.clearedZones.has(z.id)) continue;
      const x = z.end - cam;
      if (x < 0 || x > s.camera.visibleWidth) continue;
      ink.segment(x, 150, x, 530, 4);
      ink.rect(x - 10, 510, 32, 28, colors.ink, colors.paper, 3);
      ink.circle(x + 6, 524, 5, colors.ink, colors.ink, 1);
      for (let y = 164; y < 510; y += 30)
        ink.segment(x - 4, y, x + 8, y + 17, 2, colors.muted);
    }
    for (let i = 0; i < s.pickups.items.length; i++) {
      const p = s.pickups.items[i],
        l = this.labels[i],
        visible =
          p.active && p.x > cam - 30 && p.x < cam + s.camera.visibleWidth + 30;
      l.node.active = visible;
      if (!visible) continue;
      const x = p.x - cam,
        y = p.y + Math.sin(p.age * 5) * 3;
      ink.circle(x, y, 18, colors.ink, colors.paper, 2);
      ink.circle(x, y, 23, colors.far, undefined, 1);
      l.node.setPosition(x, y);
      l.string =
        p.kind === "health"
          ? "+"
          : p.kind === "grenades"
            ? "G"
            : p.kind === "shotgun"
              ? "S"
              : p.kind === "rocket"
                ? "R"
                : "A";
    }
  }
}

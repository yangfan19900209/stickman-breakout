import { Color } from "cc";
import { Vec } from "../core/Types";
import { Ink, colors } from "./Ink";
/** Original ink contours: authored irregular silhouettes, sparse material strokes. */
export class SceneryArt {
  private static readonly rockInk = new Color(198, 198, 192);
  private static stroke(
    g: Ink,
    x: number,
    y: number,
    points: number[],
    width = 2,
    color = colors.mid,
    fill?: Color,
    smooth = 0.12,
  ): void {
    const p: Vec[] = [];
    for (let i = 0; i < points.length; i += 2)
      p.push({ x: x + points[i], y: y + points[i + 1] });
    const closed = !!fill,
      n = p.length,
      ctx = g.g;
    ctx.moveTo(p[0].x, p[0].y);
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const a = p[i],
        b = p[(i + 1) % n],
        prev = p[(i - 1 + n) % n],
        next = p[(i + 2) % n];
      const before = !closed && i === 0 ? a : prev,
        after = !closed && i === n - 2 ? b : next;
      ctx.bezierCurveTo(
        a.x + (b.x - before.x) * smooth,
        a.y + (b.y - before.y) * smooth,
        b.x - (after.x - a.x) * smooth,
        b.y - (after.y - a.y) * smooth,
        b.x,
        b.y,
      );
    }
    if (fill) {
      ctx.close();
      ctx.fillColor = fill;
      ctx.fill();
    }
    ctx.strokeColor = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }
  static cloud(g: Ink, x: number, y: number, size = 1): void {
    this.stroke(
      g,
      x,
      y,
      [
        0, 0, 4, 8, 21, 9, 28, 20, 42, 20, 50, 14, 64, 29, 82, 26, 90, 13, 107,
        16, 112, 7, 126, 5, 129, -1, 93, -3, 42, -2, 0, 0,
      ].map((v) => v * size),
      2,
      colors.far,
    );
  }
  static ridge(g: Ink, variant: number): void {
    // Rounded eroded escarpment; asymmetry and long resting contours avoid triangular mountains.
    const shift = (variant % 3) * 12;
    this.stroke(
      g,
      0,
      0,
      [
        -16,
        209,
        35,
        222,
        64,
        243,
        99,
        247,
        122,
        263,
        135,
        306,
        145,
        324 + shift,
        170,
        337 + shift,
        209,
        335 + shift,
        227,
        341 + shift,
        252,
        334,
        271,
        283,
        291,
        275,
        311,
        247,
        350,
        233,
        408,
        228,
        439,
        254,
        474,
        260,
        501,
        286,
        526,
        298,
        534,
        321,
        560,
        327,
        593,
        324,
        620,
        334,
        643,
        317,
        651,
        292,
        680,
        262,
        701,
        259,
        745,
        218,
        816,
        209,
      ],
      2.5,
      this.rockInk,
    );
    for (const [x, y] of [
      [154, 325 + shift],
      [220, 324],
      [550, 315],
      [605, 316],
    ]) {
      this.stroke(
        g,
        x,
        y,
        [0, 0, -4, -25, 2, -41, -8, -68, -5, -89],
        1.5,
        this.rockInk,
      );
      this.stroke(g, x - 12, y - 42, [0, 0, 18, -3, 32, 0], 1.2, this.rockInk);
    }
    this.stroke(
      g,
      0,
      0,
      [
        -10, 188, 56, 204, 99, 201, 134, 218, 168, 211, 201, 196, 258, 193, 298,
        214, 342, 209, 397, 191, 456, 206, 494, 203, 553, 189, 609, 209, 658,
        207, 707, 192, 815, 188,
      ],
      1.8,
      this.rockInk,
    );
  }
  static rock(
    g: Ink,
    x: number,
    y: number,
    size = 1,
    foreground = false,
  ): void {
    const c = foreground ? colors.muted : colors.mid;
    this.stroke(
      g,
      x,
      y,
      [-18, 0, -22, 8, -13, 21, 0, 25, 12, 19, 21, 8, 18, 0].map(
        (v) => v * size,
      ),
      foreground ? 2.2 : 1.6,
      c,
      colors.paper,
      0.08,
    );
    this.stroke(
      g,
      x,
      y,
      [-12, 18, 0, 15, 7, 5, 18, 1].map((v) => v * size),
      1.2,
      c,
    );
  }
  static tower(g: Ink, x: number, y: number): void {
    const c = colors.mid;
    for (const side of [-1, 1]) {
      g.segment(x + side * 36, y, x + side * 27, y + 171, 6, c);
      g.segment(x + side * 36, y, x + side * 27, y + 171, 2.5, colors.paper);
    }
    for (let h = 10; h < 150; h += 48) {
      g.segment(x - 32, y + h, x + 31, y + h + 43, 2.4, c);
      g.segment(x + 32, y + h, x - 31, y + h + 43, 2.4, c);
    }
    this.stroke(
      g,
      x,
      y,
      [-42, 171, -42, 183, 42, 184, 42, 170],
      2.5,
      c,
      colors.paper,
      0.025,
    );
    this.stroke(g, x, y, [-36, 185, -36, 209, 35, 210, 35, 185], 2.5, c);
    for (let p = -28; p <= 28; p += 18)
      g.segment(x + p, y + 186, x + p, y + 209, 2, c);
    g.segment(x + 25, y + 211, x + 25, y + 254, 2.5, c);
    this.stroke(
      g,
      x,
      y,
      [26, 249, 41, 245, 48, 247, 46, 231, 37, 229, 26, 233],
      2,
      c,
      colors.wall,
    );
  }
  static bunker(g: Ink, x: number, y: number, width = 280): void {
    const s = width / 280,
      p = (a: number[]) => a.map((v, i) => (i % 2 ? v : v * s)),
      c = colors.mid;
    this.stroke(
      g,
      x,
      y,
      p([
        0, 0, -2, 91, 2, 145, 25, 148, 26, 166, 53, 172, 94, 172, 111, 163, 178,
        163, 179, 146, 226, 147, 237, 136, 277, 136, 280, 58, 277, 0,
      ]),
      2.6,
      c,
      colors.wall,
      0.025,
    );
    this.stroke(
      g,
      x,
      y,
      p([-7, 146, 26, 150, 27, 163, 61, 166, 98, 165, 110, 157, 175, 157]),
      2.2,
      c,
    );
    // Recessed arched doorway and a boarded observation window.
    this.stroke(
      g,
      x,
      y,
      p([21, 0, 22, 65, 29, 84, 47, 90, 65, 82, 72, 63, 72, 0]),
      2.2,
      c,
      colors.paper,
    );
    this.stroke(
      g,
      x,
      y,
      p([29, 0, 30, 60, 38, 75, 56, 74, 63, 59, 63, 0]),
      1.3,
      c,
    );
    this.stroke(
      g,
      x,
      y,
      p([123, 69, 123, 103, 186, 105, 188, 70]),
      2,
      c,
      colors.paper,
      0.035,
    );
    this.stroke(
      g,
      x,
      y,
      p([120, 81, 190, 86, 190, 91, 121, 86]),
      1.4,
      c,
      colors.wall,
      0.025,
    );
    this.stroke(g, x, y, p([232, 135, 221, 112, 232, 98, 217, 83]), 1.7, c);
    this.stroke(g, x, y, p([246, 32, 230, 35, 221, 26, 212, 30]), 1.5, c);
    for (const [bx, by] of [
      [92, 22],
      [98, 33],
      [189, 125],
      [199, 117],
    ])
      g.segment(x + bx * s, y + by, x + (bx + 12) * s, y + by + 1, 1.4, c);
    // Curved roof tank and a short bent pipe replace the old window lattice.
    this.stroke(
      g,
      x,
      y,
      p([39, 174, 40, 192, 47, 201, 71, 201, 80, 191, 80, 174]),
      1.8,
      c,
      colors.paper,
    );
    this.stroke(
      g,
      x,
      y,
      p([59, 200, 59, 224, 66, 231, 80, 231, 85, 224, 85, 215]),
      5,
      colors.wall,
    );
    this.stroke(
      g,
      x,
      y,
      p([59, 200, 59, 224, 66, 231, 80, 231, 85, 224, 85, 215]),
      1.8,
      c,
    );
    this.rock(g, x + width - 3, y, 0.75);
    this.rock(g, x + width + 19, y - 1, 0.48);
  }
  static factory(g: Ink, x: number, y: number): void {
    // A ruined pump house, not a repeated box of identical windows.
    this.bunker(g, x, y, 250);
    const c = colors.mid;
    this.stroke(
      g,
      x,
      y,
      [
        212, 138, 211, 202, 206, 214, 212, 238, 226, 244, 242, 239, 247, 225,
        242, 202, 244, 138,
      ],
      2.2,
      c,
      colors.paper,
    );
    this.stroke(g, x, y, [211, 229, 228, 226, 246, 230], 1.7, c);
    this.stroke(
      g,
      x,
      y,
      [253, 20, 286, 23, 301, 42, 300, 91, 286, 107, 267, 108],
      9,
      colors.wall,
    );
    this.stroke(
      g,
      x,
      y,
      [253, 20, 286, 23, 301, 42, 300, 91, 286, 107, 267, 108],
      2,
      c,
    );
    g.ellipse(x + 282, y + 60, 13, 15, c, colors.paper, 2);
    g.segment(x + 271, y + 60, x + 293, y + 60, 1.7, c);
    this.rock(g, x + 294, y, 1.1);
  }
  static crane(g: Ink, x: number, y: number): void {
    // Small broken loading gantry; large blank openings keep the battle readable.
    const c = colors.mid;
    this.stroke(
      g,
      x,
      y,
      [0, 0, 3, 192, 13, 199, 27, 196, 24, 0],
      2.4,
      c,
      colors.wall,
      0.02,
    );
    this.stroke(
      g,
      x,
      y,
      [9, 188, 12, 207, 229, 208, 230, 190],
      2.5,
      c,
      colors.paper,
      0.02,
    );
    this.stroke(
      g,
      x,
      y,
      [210, 0, 211, 187, 226, 190, 232, 0],
      2.3,
      c,
      colors.wall,
      0.02,
    );
    g.segment(x + 17, y + 146, x + 70, y + 191, 2, c);
    this.stroke(
      g,
      x,
      y,
      [129, 190, 128, 136, 137, 124, 135, 100, 128, 96, 122, 103],
      2.3,
      c,
    );
    this.stroke(
      g,
      x,
      y,
      [26, 56, 40, 69, 73, 65, 87, 54, 84, 0, 22, 0],
      2,
      c,
      colors.wall,
    );
    this.rock(g, x + 214, y, 0.8);
  }
  static truck(g: Ink, x: number, y: number): void {
    const c = colors.far;
    this.stroke(
      g,
      x,
      y,
      [0, 18, 1, 60, 18, 73, 87, 73, 99, 65, 99, 18],
      1.8,
      c,
      undefined,
      0.04,
    );
    this.stroke(
      g,
      x,
      y,
      [100, 19, 149, 19, 148, 53, 132, 69, 103, 68, 100, 19],
      1.8,
      c,
    );
    g.circle(x + 24, y + 17, 12, c, undefined, 1.5);
    g.circle(x + 127, y + 17, 12, c, undefined, 1.5);
  }
  static serviceBay(g: Ink, x: number, y: number): void {
    // A low weathered wall with vegetation and rubble, not another box machine.
    const c = colors.mid;
    this.stroke(
      g,
      x,
      y,
      [
        0, 0, 0, 44, 12, 49, 23, 43, 31, 51, 56, 48, 63, 30, 83, 34, 95, 25,
        113, 28, 119, 0,
      ],
      2,
      c,
      colors.wall,
      0.06,
    );
    this.stroke(g, x, y, [30, 47, 26, 28, 37, 20, 32, 10], 1.6, c);
    this.rock(g, x + 99, y, 0.9);
    this.rock(g, x + 119, y, 0.5);
    this.stroke(g, x - 14, y, [0, 0, -3, 14, -8, 26, -5, 35], 2, c);
    this.stroke(g, x - 14, y, [-2, 12, 10, 18, 14, 29], 2, c);
  }
}

import { Ink, colors } from "./Ink";
/** Purposeful industrial silhouettes. No randomly scattered decorative lines. */
export class SceneryArt {
  static cloud(g: Ink, x: number, y: number, size = 1): void {
    const c = colors.far;
    g.line(
      [
        { x, y },
        { x: x + 18 * size, y },
        { x: x + 23 * size, y: y + 7 * size },
        { x: x + 38 * size, y: y + 9 * size },
        { x: x + 43 * size, y: y + 18 * size },
        { x: x + 63 * size, y: y + 20 * size },
        { x: x + 77 * size, y: y + 9 * size },
        { x: x + 98 * size, y: y + 7 * size },
        { x: x + 109 * size, y },
        { x: x + 126 * size, y },
      ],
      1.4,
      c,
    );
  }
  static tower(g: Ink, x: number, y: number): void {
    const c = colors.muted;
    g.line(
      [
        { x: x - 35, y },
        { x: x - 18, y: y + 150 },
        { x, y: y + 210 },
        { x: x + 18, y: y + 150 },
        { x: x + 35, y },
      ],
      2,
      c,
    );
    for (let h = 20; h < 165; h += 28) {
      const w = 34 - h * 0.13;
      g.segment(x - w, y + h, x + w, y + h, 1, c);
      g.segment(x - w, y + h, x + w - 4, y + h + 28, 1, c);
      g.segment(x + w, y + h, x - w + 4, y + h + 28, 1, c);
    }
    g.segment(x - 32, y + 160, x + 32, y + 160, 2, c);
    g.segment(x, y + 210, x, y + 250, 1.5, c);
    g.circle(x, y + 246, 3, c, undefined, 1);
    g.ellipse(x + 30, y + 155, 18, 8, c, undefined, 2);
    g.segment(x + 15, y + 147, x + 5, y + 130, 2, c);
  }
  static bunker(g: Ink, x: number, y: number, width = 280): void {
    const c = colors.muted;
    g.rect(x, y, width, 152, c, colors.paper, 2);
    g.line(
      [
        { x: x - 10, y: y + 152 },
        { x: x + 14, y: y + 167 },
        { x: x + width - 14, y: y + 167 },
        { x: x + width + 10, y: y + 152 },
      ],
      2,
      c,
    );
    g.rect(x + 20, y, 61, 92, c, undefined, 2);
    g.rect(x + 26, y + 7, 49, 78, c, undefined, 1);
    g.circle(x + 67, y + 44, 2, c, c, 1);
    for (let i = 0; i < 3; i++) {
      const wx = x + 105 + i * 51;
      g.rect(wx, y + 78, 37, 39, c, undefined, 1.5);
      g.segment(wx, y + 98, wx + 37, y + 98, 1, c);
      g.segment(wx + 18, y + 78, wx + 18, y + 117, 1, c);
    }
    g.rect(x + 100, y + 12, width - 119, 39, c, undefined, 1.5);
    for (let i = 0; i < 10; i++)
      g.segment(x + 107 + i * 15, y + 19, x + 107 + i * 15, y + 44, 1, c);
    g.rect(x + 25, y + 174, 45, 23, c, undefined, 1.5);
    g.segment(x + 35, y + 197, x + 35, y + 245, 1.5, c);
    g.segment(x + 15, y + 229, x + 55, y + 229, 1.5, c);
  }
  static factory(g: Ink, x: number, y: number): void {
    const c = colors.muted;
    g.rect(x, y, 340, 244, c, colors.paper, 2);
    for (let n = 0; n < 3; n++) {
      const px = x + 36 + n * 82;
      g.rect(px, y + 90, 42, 125, c, undefined, 2);
      g.ellipse(px + 21, y + 215, 21, 8, c, colors.paper, 2);
      g.segment(px + 21, y + 224, px + 21, y + 278, 7, colors.far);
      g.segment(px + 21, y + 224, px + 21, y + 278, 1.5, c);
    }
    g.rect(x + 25, y + 14, 150, 52, c, undefined, 2);
    for (let n = 0; n < 8; n++)
      g.segment(x + 38 + n * 17, y + 25, x + 38 + n * 17, y + 56, 1, c);
    g.rect(x + 246, y, 63, 126, c, undefined, 2);
    g.circle(x + 270, y + 88, 9, c, undefined, 1.5);
    g.segment(x + 271, y + 88, x + 276, y + 94, 1, c);
    g.line(
      [
        { x: x + 17, y: y + 79 },
        { x: x - 28, y: y + 79 },
        { x: x - 28, y: y + 137 },
        { x: x - 67, y: y + 137 },
      ],
      5,
      colors.far,
    );
    g.line(
      [
        { x: x + 17, y: y + 79 },
        { x: x - 28, y: y + 79 },
        { x: x - 28, y: y + 137 },
        { x: x - 67, y: y + 137 },
      ],
      1.5,
      c,
    );
    for (let n = 0; n < 6; n++) g.circle(x + 22 + n * 56, y + 232, 2, c, c, 1);
    g.segment(x - 75, y + 137, x - 75, y + 7, 8, colors.far);
    g.segment(x - 75, y + 137, x - 75, y + 7, 1.5, c);
  }
  static crane(g: Ink, x: number, y: number): void {
    const c = colors.muted;
    g.rect(x, y, 35, 280, c, undefined, 2);
    g.rect(x + 270, y, 35, 280, c, undefined, 2);
    for (let h = 0; h < 270; h += 35) {
      g.segment(x, y + h, x + 35, y + h + 35, 1, c);
      g.segment(x + 270, y + h, x + 305, y + h + 35, 1, c);
    }
    g.rect(x - 12, y + 280, 330, 24, c, undefined, 2);
    for (let xx = x; xx < x + 300; xx += 28)
      g.segment(xx, y + 280, xx + 24, y + 304, 1, c);
    g.segment(x + 135, y + 280, x + 135, y + 182, 1.5, c);
    g.segment(x + 152, y + 280, x + 152, y + 180, 1.5, c);
    g.rect(x + 117, y + 158, 52, 23, c, undefined, 2);
    g.segment(x + 134, y + 157, x + 134, y + 140, 2, c);
    g.line(
      [
        { x: x + 125, y: y + 137 },
        { x: x + 136, y: y + 125 },
        { x: x + 148, y: y + 136 },
      ],
      2,
      c,
    );
    g.circle(x + 9, y + 57, 11, c, undefined, 2);
    g.circle(x + 284, y + 57, 11, c, undefined, 2);
  }
  static truck(g: Ink, x: number, y: number): void {
    const c = colors.far;
    g.rect(x, y + 19, 115, 52, c, undefined, 1.5);
    g.line(
      [
        { x: x + 115, y: y + 19 },
        { x: x + 160, y: y + 19 },
        { x: x + 160, y: y + 54 },
        { x: x + 145, y: y + 77 },
        { x: x + 115, y: y + 77 },
      ],
      1.5,
      c,
    );
    g.rect(x + 122, y + 47, 22, 23, c, undefined, 1);
    g.circle(x + 27, y + 17, 14, c, undefined, 1.5);
    g.circle(x + 130, y + 17, 14, c, undefined, 1.5);
  }
}

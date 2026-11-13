import { Ink, colors } from "./Ink";
import type { RenderActor } from "./StickmanRenderer";

/** Original armored walking colossus. Large negative spaces keep the silhouette readable. */
export class ColossusArt {
  draw(ink: Ink, a: RenderActor, cam: number): void {
    const x = a.x - cam,
      y = a.y,
      d = a.facing,
      g = ink.g,
      dead = a.animation === "Dead";
    const collapse = dead ? Math.min(1, a.deadTime / 1.4) * 100 : 0;
    const bob = dead ? 0 : Math.sin(a.animationTime * 2) * 1.8;
    const p = (xx: number, yy: number) => ({
      x: x + xx * d,
      y: y + yy - collapse + bob,
    });
    const plate = (coords: number[], fill = colors.paper, w = 4) => {
      const pts = [];
      for (let i = 0; i < coords.length; i += 2)
        pts.push(p(coords[i], coords[i + 1]));
      ink.polygon(pts, fill);
      ink.line([...pts, pts[0]], w, colors.ink);
    };
    const line = (
      ax: number,
      ay: number,
      bx: number,
      by: number,
      w = 2,
      tint = colors.ink,
    ) => {
      const v = p(ax, ay),
        u = p(bx, by);
      ink.segment(v.x, v.y, u.x, u.y, w, tint);
    };
    ink.ellipse(x, y - 3, 145, 7, colors.far, colors.far, 1);
    // Pistons and wide grounded feet: clearly a walking machine, separate from the tank tracks.
    for (const side of [-1, 1]) {
      const lift =
        !dead && a.action === "stomp" && (a.windup ?? 0) > 0 && side === 1
          ? Math.min(30, (1.1 - a.windup!) * 42)
          : 0;
      ink.segment(
        x + side * 52,
        y + 116,
        x + side * 79,
        y + 63 + lift,
        30,
        colors.ink,
      );
      ink.segment(
        x + side * 52,
        y + 116,
        x + side * 79,
        y + 63 + lift,
        20,
        colors.wall,
      );
      ink.segment(
        x + side * 79,
        y + 63 + lift,
        x + side * 97,
        y + 20 + lift,
        25,
        colors.ink,
      );
      ink.segment(
        x + side * 79,
        y + 63 + lift,
        x + side * 97,
        y + 20 + lift,
        16,
        colors.paper,
      );
      ink.rect(
        x + side * 97 - 32,
        y + lift,
        64,
        20,
        colors.ink,
        colors.wall,
        4,
      );
      ink.rect(
        x + side * 79 - 14,
        y + 52 + lift,
        28,
        23,
        colors.ink,
        colors.paper,
        3,
      );
      ink.segment(
        x + side * 58,
        y + 95,
        x + side * 87,
        y + 30 + lift,
        3,
        colors.muted,
      );
    }
    plate(
      [
        -63, 109, -101, 158, -110, 211, -73, 227, 70, 227, 109, 210, 99, 155,
        62, 109,
      ],
      colors.ink,
      5,
    );
    plate(
      [
        -56, 112, -80, 159, -83, 211, -61, 221, 60, 221, 83, 211, 80, 159, 56,
        112,
      ],
      colors.paper,
      4,
    );
    plate([-49, 109, -48, 131, 48, 131, 49, 109], colors.mid, 3);
    line(-40, 121, 40, 121, 3);
    plate(
      [-112, 192, -147, 207, -149, 241, -125, 249, -87, 237, -83, 213],
      colors.wall,
      4,
    );
    plate(
      [112, 192, 147, 207, 149, 241, 125, 249, 87, 237, 83, 213],
      colors.wall,
      4,
    );
    for (const side of [-1, 1])
      for (let n = 0; n < 3; n++) {
        const v = p(side * (104 + n * 12), 225);
        ink.circle(v.x, v.y, 4.8, colors.ink, colors.ink, 1);
      }
    // Heavy forearms and a forward cannon match the gameplay emission height/side.
    plate(
      [-97, 192, -128, 181, -143, 129, -117, 113, -96, 127, -90, 163],
      colors.wall,
      4,
    );
    plate(
      [98, 192, 121, 180, 139, 135, 118, 118, 98, 133, 90, 162],
      colors.wall,
      4,
    );
    plate([112, 157, 158, 158, 166, 145, 164, 126, 112, 125], colors.paper, 4);
    line(116, 141, 186 - a.recoil * 4, 141, 19);
    line(119, 145, 183 - a.recoil * 4, 145, 6, colors.paper);
    line(184 - a.recoil * 4, 130, 184 - a.recoil * 4, 152, 4);
    plate(
      [-145, 130, -113, 126, -112, 101, -140, 97, -151, 108],
      colors.mid,
      3,
    );
    for (let n = 0; n < 3; n++) line(-143 + n * 9, 103, -141 + n * 9, 119, 2);
    const core = p(0, 176);
    ink.circle(core.x, core.y, 25, colors.ink, colors.mid, 4);
    ink.circle(
      core.x,
      core.y,
      16,
      colors.ink,
      (a.windup ?? 0) > 0 ? colors.white : colors.paper,
      3,
    );
    line(-8, 176, 8, 176, 3);
    line(0, 168, 0, 184, 3);
    for (const side of [-1, 1]) {
      plate(
        [side * 38, 158, side * 69, 166, side * 71, 196, side * 38, 191],
        colors.wall,
        2.5,
      );
      for (let n = 0; n < 3; n++)
        line(side * 43, 166 + n * 8, side * 63, 171 + n * 8, 2);
      line(side * 31, 209, side * 49, 216, 3);
    }
    // Narrow armored visor and shoulder silhouette dominate the infantry's round heads.
    plate(
      [
        -38, 228, -48, 250, -33, 279, -12, 287, 22, 285, 45, 271, 43, 242, 28,
        228,
      ],
      colors.wall,
      4,
    );
    plate(
      [-35, 253, -22, 268, 28, 266, 37, 252, 23, 239, -22, 240],
      colors.ink,
      3,
    );
    line(-22, 257, 24, 256, 4, colors.white);
    plate([-14, 239, -9, 226, 16, 227, 22, 240], colors.paper, 2.5);
    line(-7, 234, 12, 234, 2);
    line(-21, 278, -32, 305, 5);
    line(21, 279, 30, 303, 5);
    for (let n = 0; n < 4; n++) {
      const v = p(-63 + n * 42, 216);
      ink.circle(v.x, v.y, 2.5, colors.ink, colors.ink, 1);
    }
    if (dead)
      for (let n = 0; n < 4; n++) {
        const t = a.deadTime,
          dx = (n - 1.5) * t * 80,
          dy = t * 100 - t * t * 90;
        ink.rect(x + dx - 8, y + 160 + dy, 16, 9, colors.ink, colors.wall, 2);
      }
  }
}

import { Ink, colors } from "./Ink";
import type { RenderActor } from "./StickmanRenderer";
export class MechanicalEnemyArt {
  draw(ink: Ink, a: RenderActor, cam: number): void {
    const x = a.x - cam,
      y = a.y,
      d = a.facing,
      dead = a.animation === "Dead";
    if (a.kind === "turret") {
      if (dead) {
        ink.segment(x - 25, y + 8, x + 30, y + 3, 3);
        ink.segment(x, y + 8, x + 21, y + 28, 3);
        return;
      }
      ink.rect(x - 26, y, 52, 14, colors.ink, colors.paper, 3);
      ink.segment(x - 15, y + 14, x - 11, y + 36, 4);
      ink.segment(x + 15, y + 14, x + 11, y + 36, 4);
      ink.ellipse(
        x,
        y + 47,
        22,
        17,
        colors.ink,
        a.windup && a.windup > 0 ? colors.far : colors.paper,
        3,
      );
      ink.circle(x, y + 47, 7, colors.ink, undefined, 2);
      ink.segment(x, y + 47, x + 4, y + 52, 2);
      const angle = a.aimPitch ?? 0;
      ink.segment(
        x,
        y + 50,
        x + d * 36 * Math.cos(angle),
        y + 50 + 36 * Math.sin(angle),
        7,
      );
      ink.segment(x - 12, y + 66, x - 12, y + 80, 2);
      ink.circle(x - 12, y + 82, 3, colors.ink, colors.ink, 1);
      for (let n = 0; n < 4; n++)
        ink.segment(x - 17 + n * 10, y + 21, x - 12 + n * 10, y + 27, 1.5);
      return;
    }
    const shift = dead
      ? Math.min(a.deadTime, 1) * 14
      : a.animation === "Hit"
        ? Math.sin(a.animationTime * 75) * 2
        : 0;
    ink.ellipse(x, y + 26, 117, 25, colors.ink, colors.far, 4);
    for (let i = 0; i < 6; i++) {
      const wx = x - 88 + i * 35;
      ink.circle(wx, y + 25, 15, colors.ink, colors.paper, 2.5);
      ink.circle(wx, y + 25, 5, colors.ink, colors.far, 2);
      for (let j = 0; j < 4; j++) {
        const angle = a.animationTime * 2 + (j * Math.PI) / 2;
        ink.segment(
          wx + Math.cos(angle) * 6,
          y + 25 + Math.sin(angle) * 6,
          wx + Math.cos(angle) * 13,
          y + 25 + Math.sin(angle) * 13,
          1,
        );
      }
    }
    for (let i = 0; i < 11; i++) {
      ink.segment(x - 95 + i * 19, y + 50, x - 88 + i * 19, y + 45, 2);
      ink.segment(x - 95 + i * 19, y + 2, x - 88 + i * 19, y + 6, 2);
    }
    ink.line(
      [
        { x: x - 106, y: y + 53 },
        { x: x - 83, y: y + 99 - shift },
        { x: x + 66, y: y + 108 - shift },
        { x: x + 104, y: y + 73 },
        { x: x + 96, y: y + 51 },
        { x: x - 106, y: y + 53 },
      ],
      3.5,
    );
    ink.rect(x - 55, y + 58, 58, 29, colors.ink, colors.paper, 2);
    ink.circle(x - 38, y + 72, 6, colors.ink, undefined, 2);
    ink.segment(x - 42, y + 72, x - 33, y + 72, 1.5);
    ink.rect(x + 10, y + 58, 65, 27, colors.ink, colors.paper, 2);
    for (let n = 0; n < 6; n++)
      ink.segment(x + 18 + n * 9, y + 63, x + 18 + n * 9, y + 80, 1.6);
    ink.line(
      [
        { x: x - 57, y: y + 101 - shift },
        { x: x - 30, y: y + 130 - shift },
        { x: x + 23, y: y + 130 - shift },
        { x: x + 53, y: y + 108 - shift },
        { x: x - 57, y: y + 101 - shift },
      ],
      3,
    );
    const recoil = a.recoil * 3,
      gunY = y + 92 - shift;
    ink.segment(
      x + d * 4 - recoil * d,
      gunY,
      x + d * 123 - recoil * d,
      gunY,
      12,
    );
    ink.segment(x + d * 9, gunY + 4, x + d * 120, gunY + 4, 1.6, colors.paper);
    ink.rect(x - 3, y + 114 - shift, 21, 9, colors.ink, colors.paper, 2);
    ink.segment(x + 40, y + 115, x + 45, y + 157, 2.2);
    ink.segment(x + 45, y + 157, x + 73, y + 153, 1.6);
    ink.circle(x + 44, y + 162, 3, colors.ink, colors.ink, 1);
    for (let n = 0; n < 8; n++)
      ink.circle(
        x - 83 + n * 23,
        y + 93 - shift,
        1.8,
        colors.ink,
        colors.ink,
        1,
      );
    if (dead) {
      for (let n = 0; n < 6; n++) {
        const age = a.deadTime,
          dx = (n - 2.5) * age * 72,
          dy = age * 120 - age * age * 140;
        ink.rect(x + dx - 8, y + 55 + dy, 16, 7, colors.ink, colors.far, 2);
      }
    } else if (a.recoil > 1.4) {
      ink.line(
        [
          { x: x + d * 130, y: gunY - 10 },
          { x: x + d * 148, y: gunY },
          { x: x + d * 130, y: gunY + 10 },
        ],
        3,
      );
    }
  }
}

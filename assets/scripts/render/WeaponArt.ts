import { Color, Graphics } from "cc";
import { WeaponId } from "../core/GameConfig";
import { Ink, colors } from "./Ink";

// Original silhouettes, relative to the firing hand. Tips match GameConfig.muzzleLength.
const rifle = [
  -23, 3, -12, 3, -10, 6, 8, 6, 10, 2, 17, 2, 17, -2, 8, -2, 7, -13, 2, -14, 0,
  -3, -5, -3, -8, -10, -13, -9, -10, -2, -17, -2, -23, -7,
];
const shotgun = [
  -25, 3, -12, 4, -7, 6, 27, 6, 27, -1, 1, -1, -3, -8, -9, -8, -8, -2, -17, -2,
  -25, -7,
];
const launcher = [
  -25, 8, -20, 5, 20, 5, 26, 8, 26, -8, 20, -5, 4, -5, 2, -12, -3, -12, -2, -5,
  -20, -5, -25, -8,
];
export class WeaponArt {
  draw(
    ink: Ink,
    id: WeaponId,
    x: number,
    y: number,
    facing = 1,
    pitch = 0,
    scale = 1,
    outline = colors.ink,
    fill: Color = colors.paper,
  ): void {
    const cs = Math.cos(pitch),
      sn = Math.sin(pitch),
      g = ink.g;
    const px = (a: number, b: number) => x + (a * cs - b * sn) * facing * scale;
    const py = (a: number, b: number) => y + (a * sn + b * cs) * scale;
    const shape =
      id === "rocket" ? launcher : id === "shotgun" ? shotgun : rifle;
    g.moveTo(px(shape[0], shape[1]), py(shape[0], shape[1]));
    for (let i = 2; i < shape.length; i += 2)
      g.lineTo(px(shape[i], shape[i + 1]), py(shape[i], shape[i + 1]));
    g.close();
    g.fillColor = fill;
    g.fill();
    g.strokeColor = outline;
    g.lineWidth = 2.6 * scale * ink.strokeScale;
    g.stroke();
    g.lineCap = Graphics.LineCap.BUTT;
    const line = (
      a: number,
      b: number,
      c: number,
      d: number,
      width = 1.5,
      tint = outline,
    ) =>
      ink.segment(px(a, b), py(a, b), px(c, d), py(c, d), width * scale, tint);
    if (id === "rifle") {
      line(-7, 8, 8, 8, 2.2);
      line(-2, 6, -2, 8);
      line(10, 1, 17, 1);
      line(3, -7, 6, -7);
      line(-19, 1, -19, -2);
    } else if (id === "shotgun") {
      line(-6, 2, 27, 2);
      line(8, -2, 19, -2, 5.5, colors.mid);
      for (let i = 10; i < 20; i += 4) line(i, -4, i, 0, 1);
      line(-22, 0, -14, 0);
    } else {
      line(-15, -4, -15, 4, 3, colors.mid);
      line(15, -4, 15, 4, 3, colors.mid);
      line(-20, 1, 19, 1, 1, colors.mid);
      line(4, 6, 4, 12, 2);
      line(4, 12, 10, 12, 2);
      line(26, -5, 26, 5, 2);
    }
    g.lineCap = Graphics.LineCap.ROUND;
  }
}

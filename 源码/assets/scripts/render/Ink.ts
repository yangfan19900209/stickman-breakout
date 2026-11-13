import { Color, Graphics, Layers, Node, UITransform } from "cc";
import { Vec } from "../core/Types";
export const colors = {
  ink: new Color(24, 24, 24),
  paper: new Color(250, 249, 245),
  muted: new Color(126, 126, 122),
  mid: new Color(175, 175, 168),
  wall: new Color(237, 237, 231),
  far: new Color(215, 215, 209),
  white: new Color(255, 255, 255),
};
export function node(
  parent: Node,
  name: string,
  x = 0,
  y = 0,
  w = 1,
  h = 1,
): Node {
  const n = new Node(name);
  n.layer = Layers.Enum.UI_2D;
  n.parent = parent;
  n.setPosition(x, y);
  n.addComponent(UITransform).setContentSize(w, h);
  return n;
}
export class Ink {
  readonly g: Graphics;
  /** Per-layer style, never a global multiplier for both foreground and scenery. */
  strokeScale = 1;
  constructor(readonly node: Node) {
    this.g = node.addComponent(Graphics);
    this.g.lineCap = Graphics.LineCap.ROUND;
    this.g.lineJoin = Graphics.LineJoin.ROUND;
  }
  clear(): void {
    this.g.clear();
  }
  segment(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    width = 3,
    color = colors.ink,
  ): void {
    this.g.strokeColor = color;
    this.g.lineWidth = width * this.strokeScale;
    this.g.moveTo(x1, y1);
    this.g.lineTo(x2, y2);
    this.g.stroke();
  }
  ellipse(
    x: number,
    y: number,
    rx: number,
    ry: number,
    stroke = colors.ink,
    fill?: Color,
    width = 2,
  ): void {
    this.g.strokeColor = stroke;
    this.g.lineWidth = width * this.strokeScale;
    this.g.ellipse(x, y, rx, ry);
    if (fill) {
      this.g.fillColor = fill;
      this.g.fill();
    }
    this.g.stroke();
  }
  polygon(points: Vec[], color = colors.ink): void {
    if (points.length < 3) return;
    this.g.fillColor = color;
    this.g.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++)
      this.g.lineTo(points[i].x, points[i].y);
    this.g.close();
    this.g.fill();
  }
  line(points: Vec[], width = 3, color = colors.ink): void {
    if (points.length < 2) return;
    this.g.strokeColor = color;
    this.g.lineWidth = width * this.strokeScale;
    this.g.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++)
      this.g.lineTo(points[i].x, points[i].y);
    this.g.stroke();
  }
  rect(
    x: number,
    y: number,
    w: number,
    h: number,
    stroke = colors.ink,
    fill?: Color,
    width = 2,
  ): void {
    this.g.lineWidth = width * this.strokeScale;
    this.g.strokeColor = stroke;
    this.g.rect(x, y, w, h);
    if (fill) {
      this.g.fillColor = fill;
      this.g.fill();
    }
    this.g.stroke();
  }
  circle(
    x: number,
    y: number,
    r: number,
    stroke = colors.ink,
    fill?: Color,
    width = 3,
  ): void {
    this.g.strokeColor = stroke;
    this.g.lineWidth = width * this.strokeScale;
    this.g.circle(x, y, r);
    if (fill) {
      this.g.fillColor = fill;
      this.g.fill();
    }
    this.g.stroke();
  }
}

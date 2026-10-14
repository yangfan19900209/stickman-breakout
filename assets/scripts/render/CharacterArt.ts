import { Color, Graphics } from "cc";
import { GameConfig as C } from "../core/GameConfig";
import { Vec } from "../core/Types";
import { Ink, colors } from "./Ink";
import { StickmanAnimator } from "./StickmanAnimator";
import { WeaponArt } from "./WeaponArt";
import type { RenderActor } from "./StickmanRenderer";

/** Comic volumes follow the same joint rig used by the actual weapon muzzle. */
export class CharacterArt {
  private animator = new StickmanAnimator();
  private weapon = new WeaponArt();
  private outline = new Color();
  private paper = new Color();
  private shade = new Color();
  draw(ink: Ink, a: RenderActor, cameraX: number): void {
    const armed = a.kind !== "melee",
      pose = this.animator.sample(
        a.animation,
        a.animationTime,
        a.recoil,
        armed,
        a.deadTime,
        a.aimPitch ?? 0,
      );
    const alpha =
      a.animation === "Dead"
        ? Math.max(0, 1 - a.deadTime / 1.25)
        : a.invincible && Math.floor(a.invincible * 14) % 2 === 0
          ? 0.35
          : 1;
    const hit =
      a.animation === "Hit" && Math.floor(a.animationTime * 35) % 2 === 0;
    this.outline.set(
      hit ? 135 : 24,
      hit ? 135 : 24,
      hit ? 135 : 24,
      alpha * 255,
    );
    this.paper.set(250, 249, 245, alpha * 255);
    this.shade.set(175, 175, 170, alpha * 255);
    const color = this.outline,
      paper = this.paper,
      shade = this.shade;
    const x = a.x - cameraX,
      y = a.y,
      d = a.facing;
    const outline =
      (a.kind ? C.rendering.lineWidths.enemy : C.rendering.lineWidths.hero) *
      0.52;
    const line = (
      ax: number,
      ay: number,
      bx: number,
      by: number,
      w = 1.7,
      tint = color,
    ) => {
      ink.g.lineCap = Graphics.LineCap.BUTT;
      ink.segment(x + ax * d, y + ay, x + bx * d, y + by, w, tint);
      ink.g.lineCap = Graphics.LineCap.ROUND;
    };
    const shape = (coords: number[], fill = paper, w = outline) => {
      const g = ink.g;
      g.moveTo(x + coords[0] * d, y + coords[1]);
      for (let i = 2; i < coords.length; i += 2)
        g.lineTo(x + coords[i] * d, y + coords[i + 1]);
      g.close();
      g.fillColor = fill;
      g.fill();
      g.strokeColor = color;
      g.lineWidth = w;
      g.stroke();
    };
    const limb = (
      v: Vec,
      u: Vec,
      thickness: number,
      fill = paper,
      joint?: Vec,
    ) => {
      // One continuous path per limb avoids duplicated round caps at every elbow/knee.
      const g = ink.g;
      for (let pass = 0; pass < 2; pass++) {
        g.moveTo(x + v.x * d, y + v.y);
        if (joint) g.lineTo(x + joint.x * d, y + joint.y);
        g.lineTo(x + u.x * d, y + u.y);
        g.lineWidth = pass === 0 ? thickness + outline * 2 : thickness;
        g.strokeColor = pass === 0 ? color : fill;
        g.stroke();
      }
    };
    const circle = (
      cx: number,
      cy: number,
      r: number,
      fill = paper,
      w = outline,
    ) => ink.circle(x + cx * d, y + cy, r, color, fill, w);
    if (a.animation !== "Dead")
      ink.ellipse(x, y - 2, 21, 3, colors.far, colors.far, 1);
    limb(pose.leftHip, pose.leftAnkle, 4.5, shade, pose.leftKnee);
    const boot = (v: Vec) => {
      shape(
        [
          v.x - 5,
          v.y + 6,
          v.x + 4,
          v.y + 5,
          v.x + 10,
          v.y + 1,
          v.x + 9,
          v.y - 2,
          v.x - 6,
          v.y - 2,
        ],
        color,
        2,
      );
      line(v.x - 3, v.y + 3, v.x + 3, v.y + 3, 1.4, paper);
    };
    boot(pose.leftAnkle);
    const t = pose.torso,
      n = pose.neck;
    const packX = t.x - (a.kind === "ranged" ? 14 : 12),
      packY = t.y + 13;
    ink.ellipse(x + packX * d, y + packY, 9, 13, color, shade, outline);
    shape(
      [
        packX - 6,
        packY + 8,
        packX + 6,
        packY + 9,
        packX + 6,
        packY + 3,
        packX - 6,
        packY + 2,
      ],
      paper,
      2,
    );
    line(packX - 3, packY - 8, packX - 3, packY, 1.6);
    line(packX + 3, packY - 8, packX + 3, packY, 1.6);
    limb(pose.leftShoulder, pose.leftHand, 4.2, shade, pose.leftElbow);
    shape([
      n.x - 7,
      n.y - 3,
      n.x + 7,
      n.y - 5,
      t.x + 8,
      t.y + 1,
      t.x - 7,
      t.y - 1,
      n.x - 8,
      n.y - 16,
    ]);
    line(n.x - 4, n.y - 5, t.x - 3, t.y + 3, 3, shade);
    line(n.x + 3, n.y - 8, t.x + 4, t.y + 4, 1.7);
    shape(
      [t.x - 8, t.y + 3, t.x + 8, t.y + 2, t.x + 8, t.y - 3, t.x - 8, t.y - 3],
      shade,
      2,
    );
    shape(
      [
        t.x - 2,
        t.y + 10,
        t.x + 5,
        t.y + 10,
        t.x + 5,
        t.y + 4,
        t.x - 2,
        t.y + 4,
      ],
      shade,
      1.5,
    );
    limb(pose.rightHip, pose.rightAnkle, 4.5, paper, pose.rightKnee);
    boot(pose.rightAnkle);
    limb(pose.rightShoulder, pose.rightHand, 4.8, paper, pose.rightElbow);
    const h = pose.head;
    ink.ellipse(x + h.x * d, y + h.y, 11.8, 11.5, color, paper, outline);
    if (a.kind === "melee") {
      line(h.x - 11, h.y + 5, h.x + 11, h.y + 5, 5);
      line(h.x - 11, h.y + 5, h.x - 21, h.y + 2, 2.3);
      line(h.x - 12, h.y + 3, h.x - 18, h.y - 3, 2.3);
    } else if (a.kind === "ranged") {
      shape(
        [
          h.x - 12,
          h.y + 5,
          h.x - 10,
          h.y + 12,
          h.x + 5,
          h.y + 14,
          h.x + 11,
          h.y + 8,
          h.x + 18,
          h.y + 6,
          h.x + 13,
          h.y + 3,
        ],
        shade,
      );
      line(h.x - 9, h.y + 8, h.x + 8, h.y + 8, 1.4, paper);
    } else {
      shape(
        [
          h.x - 13,
          h.y + 3,
          h.x - 13,
          h.y + 8,
          h.x - 7,
          h.y + 14,
          h.x + 4,
          h.y + 15,
          h.x + 11,
          h.y + 11,
          h.x + 13,
          h.y + 4,
        ],
        a.kind === "shield" ? shade : paper,
      );
      line(h.x - 12, h.y + 5, h.x + 14, h.y + 5, 3);
      if (a.kind === "shield") {
        shape(
          [
            h.x - 4,
            h.y + 4,
            h.x + 11,
            h.y + 3,
            h.x + 10,
            h.y - 7,
            h.x + 1,
            h.y - 9,
            h.x - 4,
            h.y - 3,
          ],
          shade,
          2,
        );
        line(h.x + 2, h.y, h.x + 8, h.y, 2, paper);
      } else {
        shape(
          [
            h.x - 3,
            h.y + 8,
            h.x + 8,
            h.y + 8,
            h.x + 10,
            h.y + 4,
            h.x - 4,
            h.y + 4,
          ],
          shade,
          1.7,
        );
        line(h.x - 1, h.y + 7, h.x + 4, h.y + 7, 1.2, paper);
      }
    }
    if (a.animation === "Hit" || a.animation === "Dead") {
      line(h.x + 2, h.y + 2, h.x + 7, h.y - 2);
      line(h.x + 2, h.y - 2, h.x + 7, h.y + 2);
    } else if (a.kind !== "shield") {
      line(h.x + 1, h.y + 2, h.x + 7, h.y + 1, 1.8);
      circle(h.x + 6, h.y - 1, 1.2, color, 1);
      line(h.x + 11, h.y - 2, h.x + 13, h.y - 4, 1.5);
      line(h.x + 3, h.y - 7, h.x + 8, h.y - 6, 1.6);
    }
    if (armed && a.animation !== "Dead")
      this.weapon.draw(
        ink,
        a.weaponId ?? "rifle",
        x + pose.rightHand.x * d,
        y + pose.rightHand.y,
        d,
        a.aimPitch ?? 0,
        1,
        color,
        paper,
      );
    else if (a.kind === "melee" && a.animation !== "Dead") {
      limb(
        pose.rightHand,
        { x: pose.rightHand.x + 8, y: pose.rightHand.y + 24 },
        3,
        shade,
      );
    }
    circle(pose.leftHand.x, pose.leftHand.y, 3.6, paper, 2);
    circle(pose.rightHand.x, pose.rightHand.y, 3.8, paper, 2);
    if (
      a.kind === "shield" &&
      (a.shieldHealth ?? 0) > 0 &&
      a.animation !== "Dead"
    ) {
      shape([18, 60, 28, 65, 39, 58, 38, 16, 28, 7, 18, 17], shade, 3.5);
      shape([23, 49, 34, 49, 34, 43, 23, 43], paper, 2);
      line(22, 20, 34, 20, 2);
      line(22, 25, 34, 25, 1.5);
    }
    if (a.animation === "Run") {
      line(-25, 40, -34, 38, 1.6, shade);
      line(-24, 34, -30, 33, 1.4, shade);
    } else if (a.animation === "Hit") {
      line(h.x - 17, h.y + 8, h.x - 24, h.y + 13, 2.3);
      line(h.x - 18, h.y - 2, h.x - 26, h.y - 2, 2);
    }
  }
}

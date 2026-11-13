import { Color, Graphics } from "cc";
import { Vec } from "../core/Types";
import { GameConfig as C } from "../core/GameConfig";
import { Ink, colors } from "./Ink";
import { StickmanAnimator } from "./StickmanAnimator";
import { WeaponArt } from "./WeaponArt";
import type { RenderActor } from "./StickmanRenderer";

/** Original rounded comic infantry; volumes track the same joints as the muzzle. */
export class CharacterArt {
  private animator = new StickmanAnimator();
  private weapon = new WeaponArt();
  private outline = new Color();
  private paper = new Color();
  private shade = new Color();
  draw(ink: Ink, a: RenderActor, cameraX: number): void {
    const armed = a.kind !== "melee";
    const pose = this.animator.sample(
      a.animation,
      a.animationTime,
      a.recoil,
      armed,
      a.deadTime,
      a.aimPitch ?? 0,
      a,
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
      hit ? 120 : 20,
      hit ? 120 : 20,
      hit ? 120 : 20,
      alpha * 255,
    );
    this.paper.set(253, 253, 251, alpha * 255);
    this.shade.set(179, 179, 174, alpha * 255);
    const black = this.outline,
      white = this.paper,
      gray = this.shade;
    const x = a.x - cameraX,
      y = a.y,
      d = a.facing,
      g = ink.g;
    const width =
      (a.kind ? C.rendering.lineWidths.enemy : C.rendering.lineWidths.hero) *
      0.55;
    const px = (v: number) => x + v * d,
      py = (v: number) => y + v;
    const line = (
      ax: number,
      ay: number,
      bx: number,
      by: number,
      w = 1.7,
      tint = black,
    ) => {
      g.lineCap = Graphics.LineCap.BUTT;
      ink.segment(px(ax), py(ay), px(bx), py(by), w, tint);
      g.lineCap = Graphics.LineCap.ROUND;
    };
    const finish = (fill = white, w = width) => {
      g.close();
      g.fillColor = fill;
      g.fill();
      g.strokeColor = black;
      g.lineWidth = w;
      g.stroke();
    };
    const shape = (pts: number[], fill = white, w = width) => {
      g.moveTo(px(pts[0]), py(pts[1]));
      for (let i = 2; i < pts.length; i += 2)
        g.lineTo(px(pts[i]), py(pts[i + 1]));
      finish(fill, w);
    };
    const curve = (
      ax: number,
      ay: number,
      bx: number,
      by: number,
      cx: number,
      cy: number,
    ) => g.bezierCurveTo(px(ax), py(ay), px(bx), py(by), px(cx), py(cy));
    const limb = (
      start: Vec,
      joint: Vec,
      end: Vec,
      w: number,
      fill = white,
    ) => {
      for (let pass = 0; pass < 2; pass++) {
        g.moveTo(px(start.x), py(start.y));
        g.lineTo(px(joint.x), py(joint.y));
        g.lineTo(px(end.x), py(end.y));
        g.strokeColor = pass ? fill : black;
        g.lineWidth = pass ? w : w + width * 2;
        g.stroke();
      }
    };
    const boot = (v: Vec) => {
      g.moveTo(px(v.x - 6), py(v.y + 6));
      curve(v.x - 3, v.y + 9, v.x + 4, v.y + 6, v.x + 5, v.y + 3);
      curve(v.x + 16, v.y + 3, v.x + 15, v.y - 2, v.x + 10, v.y - 2);
      g.lineTo(px(v.x - 7), py(v.y - 2));
      finish(black, 2);
      line(v.x - 4, v.y + 1, v.x + 9, v.y + 1, 1.6, gray);
    };
    if (a.animation !== "Dead")
      ink.ellipse(x, y - 3, 25, 3, colors.far, colors.far, 1);
    if ((a.airJumpTime ?? 0) > 0) {
      ink.ellipse(
        x,
        y - 7,
        26 + (0.18 - a.airJumpTime!) * 80,
        5,
        black,
        undefined,
        2.5,
      );
      line(-16, -13, -28, -18, 1.7, gray);
      line(15, -13, 28, -18, 1.7, gray);
    }
    limb(pose.leftHip, pose.leftKnee, pose.leftAnkle, 6, gray);
    boot(pose.leftAnkle);
    const t = pose.torso,
      n = pose.neck;
    // A curved pack with a distinct rolled blanket; no rectangular body substitute.
    const bx = t.x - 15,
      by = t.y + 13;
    g.moveTo(px(bx - 9), py(by - 12));
    curve(bx - 15, by - 5, bx - 14, by + 15, bx - 5, by + 16);
    curve(bx + 14, by + 20, bx + 13, by - 13, bx + 4, by - 15);
    curve(bx, by - 17, bx - 6, by - 15, bx - 9, by - 12);
    finish(gray, 3);
    ink.ellipse(px(bx - 1), py(by + 13), 12, 5, black, gray, 2.5);
    line(bx - 7, by + 14, bx + 6, by + 14, 1.8, white);
    line(bx - 6, by - 9, bx - 3, by + 6, 2.4);
    line(bx + 2, by - 9, bx + 5, by + 6, 2.4);
    g.moveTo(px(bx - 8), py(by + 2));
    curve(bx - 7, by - 4, bx + 4, by - 4, bx + 6, by + 2);
    g.strokeColor = black;
    g.lineWidth = 1.6;
    g.stroke();
    line(bx - 1, by, bx - 1, by - 4, 2.5);
    limb(pose.leftShoulder, pose.leftElbow, pose.leftHand, 6, gray);
    // Vest shoulders and waist form a soft tapered silhouette around the rig.
    g.moveTo(px(n.x - 9), py(n.y - 2));
    curve(n.x - 16, n.y - 10, t.x - 12, t.y + 5, t.x - 8, t.y - 1);
    curve(t.x - 2, t.y - 5, t.x + 9, t.y - 3, t.x + 11, t.y + 2);
    curve(t.x + 14, t.y + 10, n.x + 15, n.y - 7, n.x + 8, n.y - 3);
    finish();
    line(n.x - 6, n.y - 5, t.x - 4, t.y + 3, 3.5, gray);
    line(n.x-6,n.y-4,n.x,n.y-8,1.8);
    line(n.x,n.y-8,n.x+6,n.y-4,1.8);
    line(t.x-6,t.y+11,t.x-1,t.y+10,1.4,gray);
    line(t.x - 8, t.y + 1, t.x + 9, t.y + 1, 4.5);
    shape(
      [t.x - 2, t.y + 3, t.x + 3, t.y + 3, t.x + 3, t.y - 1, t.x - 2, t.y - 1],
      white,
      1.4,
    );
    shape(
      [t.x + 1, t.y + 12, t.x + 9, t.y + 11, t.x + 8, t.y + 4, t.x, t.y + 4],
      gray,
      2,
    );
    limb(pose.rightHip, pose.rightKnee, pose.rightAnkle, 6.5);
    // Cloth folds, articulated knee pad and ankle cuff read as a uniform at phone scale.
    const k = pose.rightKnee,
      f = pose.rightAnkle;
    ink.ellipse(px(k.x + 1), py(k.y), 4.5, 5.5, black, gray, 1.6);
    line(f.x - 3, f.y + 8, f.x + 4, f.y + 8, 2.1);
    line(pose.rightHip.x + 1, pose.rightHip.y - 5, k.x - 2, k.y + 8, 1.3, gray);
    boot(pose.rightAnkle);
    limb(pose.rightShoulder, pose.rightElbow, pose.rightHand, 7);
    ink.ellipse(
      px(pose.rightShoulder.x),
      py(pose.rightShoulder.y - 3),
      5,
      5.5,
      black,
      white,
      1.7,
    );
    line(
      pose.rightShoulder.x - 2,
      pose.rightShoulder.y - 2,
      pose.rightShoulder.x + 2,
      pose.rightShoulder.y - 4,
      1.4,
    );
    // Keep the receiver and magazine visible in front of the sleeve; hand/muzzle still share the rig.
    if (armed && a.animation !== "Dead")
      this.weapon.draw(
        ink,
        a.weaponId ?? "rifle",
        px(pose.rightHand.x),
        py(pose.rightHand.y),
        d,
        a.aimPitch ?? 0,
        1,
        black,
        white,
      );
    const h = pose.head;
    g.moveTo(px(h.x - 11), py(h.y + 5));
    curve(h.x - 16, h.y - 5, h.x - 5, h.y - 15, h.x + 4, h.y - 11);
    curve(h.x + 11, h.y - 11, h.x + 12, h.y - 7, h.x + 12, h.y - 4);
    curve(h.x + 18, h.y - 3, h.x + 15, h.y + 1, h.x + 12, h.y + 2);
    curve(h.x + 11, h.y + 15, h.x - 9, h.y + 17, h.x - 11, h.y + 5);
    finish();
    if (a.kind === "melee") {
      line(h.x - 13, h.y + 5, h.x + 12, h.y + 5, 5.5);
      shape(
        [
          h.x - 11,
          h.y + 5,
          h.x - 24,
          h.y + 9,
          h.x - 19,
          h.y + 1,
          h.x - 24,
          h.y - 5,
          h.x - 12,
          h.y + 2,
        ],
        black,
        1,
      );
    } else {
      // Round steel dome and broad rolled rim; rifle troops use a forward visor.
      g.moveTo(px(h.x - 15), py(h.y + 5));
      curve(h.x - 16, h.y + 21, h.x + 12, h.y + 23, h.x + 15, h.y + 6);
      g.lineTo(px(h.x + (a.kind === "ranged" ? 21 : 15)), py(h.y + 3));
      g.lineTo(px(h.x - 15), py(h.y + 3));
      finish(a.kind ? gray : white, width);
      line(h.x - 13, h.y + 7, h.x + 12, h.y + 7, 2.5);
      // Hero goggles sit on the rim with a broad pale lens, visibly separate from the face.
      if (!a.kind) {
        shape(
          [
            h.x - 3,
            h.y + 12,
            h.x + 7,
            h.y + 12,
            h.x + 10,
            h.y + 7,
            h.x - 4,
            h.y + 7,
          ],
          gray,
          2.3,
        );
        line(h.x - 1, h.y + 10, h.x + 5, h.y + 10, 1.6, white);
      }
    }
    if (a.kind === "shield") {
      shape(
        [h.x - 4, h.y + 3, h.x + 13, h.y + 2, h.x + 11, h.y - 9, h.x, h.y - 10],
        gray,
        2,
      );
      line(h.x, h.y - 1, h.x + 8, h.y - 1, 3, white);
    } else {
      line(h.x + 1, h.y + 1, h.x + 8, h.y, 2.1);
      line(h.x + 7, h.y - 1, h.x + 7, h.y - 4, 2.5);
      line(h.x + 3, h.y - 8, h.x + 9, h.y - 8, 1.8);
      ink.ellipse(px(h.x - 8), py(h.y - 1), 3, 4, black, white, 1.5);
      g.moveTo(px(h.x - 10), py(h.y + 3));
      curve(h.x - 12, h.y - 9, h.x - 1, h.y - 14, h.x + 5, h.y - 11);
      g.strokeColor = black;
      g.lineWidth = 1.5;
      g.stroke();
      if (a.animation === "Hit" || a.animation === "Dead")
        line(h.x + 2, h.y - 3, h.x + 8, h.y + 2, 2);
    }
    ink.circle(
      px(pose.rightHand.x),
      py(pose.rightHand.y),
      3.6,
      black,
      white,
      2.5,
    );
    if (armed && a.animation !== "Dead") {
      ink.ellipse(
        px(pose.leftHand.x),
        py(pose.leftHand.y),
        4.6,
        3.8,
        black,
        white,
        2,
      );
      line(
        pose.leftHand.x - 1,
        pose.leftHand.y + 1,
        pose.leftHand.x + 3,
        pose.leftHand.y + 1,
        1.1,
      );
      if(a.action==="reload")
        shape([pose.leftHand.x-2,pose.leftHand.y-2,pose.leftHand.x+3,pose.leftHand.y-3,pose.leftHand.x+3,pose.leftHand.y-11,pose.leftHand.x-2,pose.leftHand.y-10],gray,1.6);
    }
    if (a.kind === "melee" && a.animation !== "Dead") {
      line(
        pose.rightHand.x + 2,
        pose.rightHand.y + 2,
        pose.rightHand.x + 13,
        pose.rightHand.y + 29,
        7,
      );
      line(
        pose.rightHand.x + 4,
        pose.rightHand.y + 8,
        pose.rightHand.x + 11,
        pose.rightHand.y + 26,
        2,
        gray,
      );
    }
    if (
      a.kind === "shield" &&
      (a.shieldHealth ?? 0) > 0 &&
      a.animation !== "Dead"
    ) {
      shape([18, 60, 30, 66, 44, 58, 43, 15, 30, 6, 18, 17], gray, 4);
      shape([24, 50, 38, 50, 38, 42, 24, 42], white, 2);
      line(24, 21, 37, 21, 2.5);
      line(24, 27, 37, 27, 2);
    }
    if (a.animation === "Run" || a.animation === "Shoot") {
      line(-32, 44, -43, 42, 2.2, gray);
      line(-32, 35, -40, 34, 2, gray);
    } else if (a.animation === "Hit") {
      line(h.x - 21, h.y + 8, h.x - 29, h.y + 13, 3);
      line(h.x - 20, h.y - 2, h.x - 30, h.y - 2, 2.5);
    }
    if(a.action==="chargeWindup" || a.action==="bash") {
      line(h.x+22,h.y+21,h.x+22,h.y+11,3);
      ink.circle(px(h.x+22),py(h.y+6),1.8,black,black,1);
    }
  }
}

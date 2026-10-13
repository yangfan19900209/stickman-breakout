import { Color } from "cc";
import { GameConfig as C, WeaponId } from "../core/GameConfig";
import { Vec } from "../core/Types";
import { Ink, colors } from "./Ink";
import { StickmanAnimator } from "./StickmanAnimator";
import type { RenderActor } from "./StickmanRenderer";

/** Joint driven drawing. Scratch colors/pose points are reused across every actor. */
export class CharacterArt {
  private animator = new StickmanAnimator();
  private color = new Color(24, 24, 24);
  private shade = new Color(175, 175, 168);
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
          ? 0.3
          : 1;
    const hit =
      a.animation === "Hit" && Math.floor(a.animationTime * 35) % 2 === 0;
    this.color.set(hit ? 150 : 24, hit ? 150 : 24, hit ? 146 : 24, alpha * 255);
    this.shade.a = alpha * 255;
    const color = this.color,
      shade = this.shade;
    const scale = a.kind === "guard" ? 1.08 : 1,
      baseX = a.x - cameraX,
      baseY = a.y,
      dir = a.facing,
      fx = dir * scale;
    const weight = a.kind
      ? C.rendering.lineWidths.enemy
      : C.rendering.lineWidths.hero;
    const line = (v: Vec, w: Vec, width = 3.3) =>
      ink.segment(
        baseX + v.x * fx,
        baseY + v.y * scale,
        baseX + w.x * fx,
        baseY + w.y * scale,
        (width / 3.3) * weight,
        color,
      );
    const local = (x: number, y: number, x2: number, y2: number, width = 2) =>
      ink.segment(
        baseX + x * fx,
        baseY + y * scale,
        baseX + x2 * fx,
        baseY + y2 * scale,
        Math.max(C.rendering.lineWidths.detail, width * 1.3),
        color,
      );
    const circle = (x: number, y: number, r: number, fill?: Color) =>
      ink.circle(baseX + x * fx, baseY + y * scale, r * scale, color, fill, 2);
    if (a.animation !== "Dead")
      ink.ellipse(baseX, baseY - 2, 18, 3, colors.far, colors.far, 1);
    // Backpack and shoulder strap sit behind the rig, remaining recognizable in both directions.
    const torso = pose.torso,
      neck = pose.neck;
    ink.ellipse(
      baseX + (torso.x - 9) * fx,
      baseY + (torso.y + 10) * scale,
      8 * scale,
      12 * scale,
      color,
      shade,
      weight * 0.65,
    );
    local(torso.x - 12, torso.y + 15, neck.x + 3, neck.y - 5, 1.5);
    line(pose.neck, pose.torso, 3.6);
    line(pose.leftShoulder, pose.leftElbow);
    line(pose.leftElbow, pose.leftHand);
    line(pose.rightShoulder, pose.rightElbow);
    line(pose.rightElbow, pose.rightHand);
    line(pose.leftHip, pose.leftKnee, 3.8);
    line(pose.leftKnee, pose.leftAnkle, 3.5);
    line(pose.rightHip, pose.rightKnee, 3.8);
    line(pose.rightKnee, pose.rightAnkle, 3.5);
    for (const foot of [pose.leftAnkle, pose.rightAnkle]) {
      ink.ellipse(
        baseX + (foot.x + 3) * fx,
        baseY + (foot.y + 2) * scale,
        8 * scale,
        3.5 * scale,
        color,
        color,
        1,
      );
      local(foot.x - 2, foot.y + 5, foot.x + 5, foot.y + 5, 1);
    }
    circle(pose.leftHand.x, pose.leftHand.y, 3, colors.paper);
    circle(pose.rightHand.x, pose.rightHand.y, 3, colors.paper);
    const head = pose.head,
      hx = baseX + head.x * fx,
      hy = baseY + head.y * scale;
    ink.ellipse(
      hx,
      hy,
      10.5 * scale,
      11 * scale,
      color,
      colors.paper,
      weight * 0.85,
    );
    if (!a.kind) {
      local(head.x - 10, head.y + 5, head.x + 10, head.y + 5, 2.7);
      local(head.x - 10, head.y + 5, head.x - 15, head.y + 3, 2);
      local(head.x - 14, head.y + 4, head.x - 20, head.y - 2, 2);
      local(head.x - 3, head.y + 11, head.x + 1, head.y + 15, 1.5);
      local(head.x + 1, head.y + 15, head.x + 3, head.y + 11, 1.5);
    } else {
      ink.ellipse(hx, hy + 7 * scale, 12 * scale, 5 * scale, color, shade, 2);
      local(head.x - 12, head.y + 5, head.x + 13, head.y + 5, 2);
    }
    if (a.animation === "Hit" || a.animation === "Dead") {
      local(head.x + 2, head.y - 1, head.x + 7, head.y + 3, 1.7);
      local(head.x + 2, head.y + 3, head.x + 7, head.y - 1, 1.7);
      circle(head.x + 4, head.y - 6, 2.6);
    } else {
      circle(head.x + 5, head.y + 1, 1.7, color);
      local(head.x + 1, head.y + 5, head.x + 7, head.y + 4, 1.6);
      local(head.x + 2, head.y - 6, head.x + 7, head.y - 5, 1.4);
    }
    local(neck.x - 3, neck.y - 5, neck.x + 5, neck.y - 8, 2);
    local(torso.x - 4, torso.y + 2, torso.x + 5, torso.y + 2, 2);
    if (
      a.kind === "shield" &&
      (a.shieldHealth ?? 0) > 0 &&
      a.animation !== "Dead"
    ) {
      const bx = baseX + 26 * dir;
      ink.ellipse(bx, baseY + 35, 13, 31, color, shade, weight);
      ink.ellipse(bx, baseY + 35, 5, 8, color, colors.paper, 2);
      ink.segment(bx - 8, baseY + 55, bx + 8, baseY + 55, 2);
    }
    if (armed && a.animation !== "Dead") {
      const hand = pose.rightHand,
        angle = a.aimPitch ?? 0,
        cs = Math.cos(angle),
        sn = Math.sin(angle),
        weapon: WeaponId = a.weaponId ?? "rifle";
      const gun = (
        x: number,
        y: number,
        x2: number,
        y2: number,
        width = 3,
        tint = color,
      ) =>
        ink.segment(
          baseX + (hand.x + x * cs - y * sn) * fx,
          baseY + (hand.y + x * sn + y * cs) * scale,
          baseX + (hand.x + x2 * cs - y2 * sn) * fx,
          baseY + (hand.y + x2 * sn + y2 * cs) * scale,
          tint === colors.paper ? width : width * 1.35,
          tint,
        );
      gun(
        -13,
        0,
        C.weapons[weapon].muzzleLength,
        0,
        weapon === "rocket" ? 10 : 5.5,
      );
      gun(-12, 0, -21, -3, 5);
      gun(0, -1, -2, -8, 4);
      gun(6, 3, 12, 3, 1.2, colors.paper);
      if (weapon === "shotgun") {
        gun(0, 4, 27, 4, 3);
        gun(8, -5, 17, -5, 3);
        gun(-5, -3, 2, -3, 2, shade);
      }
      if (weapon === "rocket") {
        gun(-23, 0, -15, 0, 13);
        gun(-10, 4, 21, 4, 1, colors.paper);
        gun(5, 5, 5, 11, 2);
      }
    }
  }
}

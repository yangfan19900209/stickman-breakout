import { Color } from "cc";
import { GameConfig as C } from "../core/GameConfig";
import { AnimationState, Facing, Vec } from "../core/Types";
import { Ink, colors } from "./Ink";
import { StickmanAnimator } from "./StickmanAnimator";
export interface RenderActor {
  x: number;
  y: number;
  facing: Facing;
  animation: AnimationState;
  animationTime: number;
  recoil: number;
  deadTime: number;
  invincible?: number;
  kind?: string;
}
export class StickmanRenderer {
  private animator = new StickmanAnimator();
  draw(ink: Ink, a: RenderActor, cameraX: number): void {
    const armed = a.kind !== "melee",
      pose = this.animator.sample(
        a.animation,
        a.animationTime,
        a.recoil,
        armed,
        a.deadTime,
      );
    const alpha =
      a.animation === "Dead"
        ? Math.max(0, 1 - a.deadTime / 1.1)
        : a.invincible && Math.floor(a.invincible * 14) % 2 === 0
          ? 0.28
          : 1;
    const color = new Color(24, 24, 24, alpha * 255);
    const scale = a.kind === "guard" ? 1.08 : 1;
    const p = (v: Vec): Vec => ({
      x: a.x - cameraX + v.x * a.facing * scale,
      y: a.y + v.y * scale,
    });
    const line = (...j: Vec[]) =>
      ink.line(j.map(p), C.rendering.lineWidth, color);
    const head = p(pose.head);
    ink.circle(
      head.x,
      head.y,
      C.rendering.headRadius * scale,
      color,
      undefined,
      C.rendering.lineWidth,
    );
    line(pose.neck, pose.torso);
    line(pose.leftShoulder, pose.leftElbow, pose.leftHand);
    line(pose.rightShoulder, pose.rightElbow, pose.rightHand);
    line(pose.leftHip, pose.leftKnee, pose.leftAnkle);
    line(pose.rightHip, pose.rightKnee, pose.rightAnkle);
    // Tiny boots, eye direction and an armband distinguish the player without introducing color.
    line(pose.leftAnkle, { x: pose.leftAnkle.x + 6, y: pose.leftAnkle.y });
    line(pose.rightAnkle, { x: pose.rightAnkle.x + 6, y: pose.rightAnkle.y });
    line(
      { x: pose.head.x + 4, y: pose.head.y + 1 },
      { x: pose.head.x + 7, y: pose.head.y + 1 },
    );
    if (!a.kind)
      line(
        { x: pose.neck.x - 4, y: pose.neck.y - 8 },
        { x: pose.neck.x + 5, y: pose.neck.y - 10 },
      );
    else {
      line(
        { x: pose.head.x - 10, y: pose.head.y + 7 },
        { x: pose.head.x + 11, y: pose.head.y + 7 },
      );
    }
    if (armed && a.animation !== "Dead") {
      const hand = p(pose.rightHand),
        dir = a.facing;
      ink.line(
        [
          { x: hand.x - 10 * dir, y: hand.y },
          { x: hand.x + 17 * dir, y: hand.y },
        ],
        6,
        color,
      );
      ink.line(
        [
          { x: hand.x, y: hand.y - 1 },
          { x: hand.x - 2 * dir, y: hand.y - 8 },
        ],
        4,
        color,
      );
      ink.line(
        [
          { x: hand.x - 12 * dir, y: hand.y },
          { x: hand.x - 17 * dir, y: hand.y - 3 },
        ],
        4,
        color,
      );
    }
    if (a.kind === "guard" && a.animation !== "Dead")
      line(
        { x: -8, y: 47 },
        { x: 6, y: 47 },
        { x: 9, y: 33 },
        { x: -7, y: 33 },
        { x: -8, y: 47 },
      );
  }
}

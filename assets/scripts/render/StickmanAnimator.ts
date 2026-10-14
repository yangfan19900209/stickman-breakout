import { AnimationState, Vec } from "../core/Types";
export interface Pose {
  head: Vec;
  neck: Vec;
  torso: Vec;
  leftShoulder: Vec;
  rightShoulder: Vec;
  leftElbow: Vec;
  rightElbow: Vec;
  leftHand: Vec;
  rightHand: Vec;
  leftHip: Vec;
  rightHip: Vec;
  leftKnee: Vec;
  rightKnee: Vec;
  leftAnkle: Vec;
  rightAnkle: Vec;
}
const p = (x: number, y: number): Vec => ({ x, y });

export class StickmanAnimator {
  private readonly points: Vec[] = Array.from({ length: 64 }, () => p(0, 0));
  private cursor = 0;
  private point = (x: number, y: number): Vec => {
    const v = this.points[this.cursor++];
    v.x = x;
    v.y = y;
    return v;
  };
  /** Local coordinates face right, origin at feet. Upper body remains aimed while running. */
  sample(
    state: AnimationState,
    time: number,
    recoil: number,
    armed: boolean,
    deadTime = 0,
    aimPitch = 0,
  ): Pose {
    this.cursor = 0;
    const p = this.point;
    const run = state === "Run",
      air = state === "Jump" || state === "Fall";
    const wave = Math.sin(time * 15),
      breathe = Math.sin(time * 3) * 0.8;
    const bob = run ? Math.abs(Math.cos(time * 15)) * 3 : breathe;
    const lean =
      (run ? 7 : state === "Hit" ? -15 : state === "Shoot" ? 3 : 1) -
      recoil * 2.4;
    const kick = recoil * 4.8;
    const pose: Pose = {
      head: p(lean, 64 + bob),
      neck: p(lean, 53 + bob),
      torso: p(0, 29 + bob),
      leftShoulder: p(lean - 2, 49 + bob),
      rightShoulder: p(lean + 2, 49 + bob),
      leftElbow: p(8 - kick, 37 + bob),
      rightElbow: p(15 - kick, 42 + bob),
      leftHand: p(21 - kick, 44 + bob),
      rightHand: p(25 - kick, 44 + bob),
      leftHip: p(-2, 29 + bob),
      rightHip: p(2, 29 + bob),
      leftKnee: p(run ? wave * 16 : -6, 15),
      rightKnee: p(run ? -wave * 16 : 6, 15),
      leftAnkle: p(run ? wave * 24 : -11, run ? Math.max(0, -wave) * 11 : 0),
      rightAnkle: p(run ? -wave * 24 : 11, run ? Math.max(0, wave) * 11 : 0),
    };
    if (armed && run) {
      // Counter-swing while carrying a rifle; firing blends back into the aimed pose.
      const swing = wave * (1 - recoil);
      pose.leftElbow.x -= swing * 5;
      pose.rightElbow.x += swing * 5;
      pose.leftHand.y += swing * 2;
      pose.rightHand.y -= swing * 2;
    }
    if (!armed) {
      pose.leftElbow = p(run ? -wave * 12 : -9, 35 + bob);
      pose.rightElbow = p(run ? wave * 12 : 10, 35 + bob);
      pose.leftHand = p(run ? -wave * 20 : -12, 26 + bob);
      pose.rightHand = p(
        state === "Shoot" ? 36 : run ? wave * 20 : 13,
        state === "Shoot" ? 43 : 27 + bob,
      );
    }
    if (state === "Crouch" || state === "Land") {
      const amount = state === "Crouch" ? 0.6 : 0.88;
      for (const joint of Object.values(pose)) joint.y *= amount;
      pose.leftKnee = p(-12, 12);
      pose.rightKnee = p(15, 12);
      pose.leftAnkle = p(-17, 0);
      pose.rightAnkle = p(18, 0);
    }
    if (armed && aimPitch > 0) {
      const base = state === "Crouch" ? 26 : 44 + bob;
      pose.rightHand = p(
        20 + 5 * Math.cos(aimPitch) - kick,
        base + 22 * Math.sin(aimPitch),
      );
      pose.leftHand = p(
        16 + 6 * Math.cos(aimPitch) - kick,
        base + 15 * Math.sin(aimPitch),
      );
      pose.rightElbow = p(24, base + 5);
      pose.leftElbow = p(11, base - 4);
    }
    if (air) {
      pose.leftKnee = p(11, 21);
      pose.leftAnkle = p(2, 9);
      pose.rightKnee = p(-11, 17);
      pose.rightAnkle = p(-17, 5);
      if (state === "Fall") {
        pose.leftKnee = p(8, 18);
        pose.leftAnkle = p(12, 1);
      }
    }
    if (state === "Dead") {
      const angle = (Math.min(1, deadTime / 0.42) * -Math.PI) / 2;
      for (const joint of Object.values(pose)) {
        const x = joint.x,
          y = joint.y;
        joint.x = x * Math.cos(angle) - y * Math.sin(angle);
        joint.y = Math.max(3, x * Math.sin(angle) + y * Math.cos(angle) + 5);
      }
    }
    return pose;
  }
}

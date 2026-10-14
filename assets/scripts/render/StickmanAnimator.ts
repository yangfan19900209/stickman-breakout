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
export interface MotionPose {
  stride?: number;
  groundSlope?: number;
  facing?: number;
  landTime?: number;
  vx?: number;
}

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
    motion: MotionPose = {},
  ): Pose {
    this.cursor = 0;
    const p = this.point;
    const run = state === "Run",
      air = state === "Jump" || state === "Fall";
    const phase = motion.stride ?? time * 2.5;
    const wave = Math.sin(phase * Math.PI * 2),
      breathe = Math.sin(time * 3) * 0.8;
    const bob = run ? -1.5 * Math.cos(phase * Math.PI * 4) : breathe;
    const lean =
      (run ? 9 : state === "Hit" ? -12 : state === "Shoot" ? 7 : 4) -
      recoil * 3;
    const kick = recoil * 4.8;
    const pose: Pose = {
      head: p(lean, 68 + bob * 0.65),
      neck: p(lean, 54 + bob),
      torso: p(0, 32 + bob),
      leftShoulder: p(lean - 4, 49 + bob),
      rightShoulder: p(lean + 4, 49 + bob),
      leftElbow: p(18 - kick, 34 + bob),
      rightElbow: p(12 - kick, 36 + bob),
      leftHand: p(35 - kick, 42 + bob),
      rightHand: p(25 - kick, 45 + bob),
      leftHip: p(-3, 32 + bob),
      rightHip: p(3, 32 + bob),
      leftKnee: p(run ? wave * 19 : -13, 16),
      rightKnee: p(run ? -wave * 19 : 15, 17),
      leftAnkle: p(run ? wave * 28 : -19, run ? Math.max(0, -wave) * 15 : 0),
      rightAnkle: p(run ? -wave * 28 : 21, run ? Math.max(0, wave) * 15 : 0),
    };
    if (run) {
      const foot = (offset: number): Vec => {
        const u = (((phase + offset) % 1) + 1) % 1;
        // Stance: constant reverse speed cancels body travel. Swing: eased recovery arc.
        if (u < 0.56) return p(31.36 - 112 * u, 0);
        const t = (u - 0.56) / 0.44,
          ease = t * t * (3 - 2 * t);
        return p(-31.36 + 62.72 * ease, Math.sin(t * Math.PI) * 19);
      };
      pose.leftAnkle = foot(0.5);
      pose.rightAnkle = foot(0);
    }
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
      const amount =
        state === "Crouch"
          ? 0.6
          : 1 -
            0.16 *
              Math.sin(Math.min(1, (motion.landTime ?? 0.08) / 0.14) * Math.PI);
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
    if (!air && state !== "Dead") {
      const slope = (motion.groundSlope ?? 0) * (motion.facing ?? 1);
      pose.leftAnkle.y += pose.leftAnkle.x * slope;
      pose.rightAnkle.y += pose.rightAnkle.x * slope;
    }
    // Two-link knees preserve limb lengths and bend forward instead of swinging rigid sticks.
    const knee = (hip: Vec, ankle: Vec): Vec => {
      const dx = ankle.x - hip.x,
        dy = ankle.y - hip.y;
      const dist = Math.max(1, Math.hypot(dx, dy));
      const bend = Math.sqrt(Math.max(0, 24 * 24 - (dist * dist) / 4));
      return p(
        (hip.x + ankle.x) / 2 - (dy / dist) * bend,
        (hip.y + ankle.y) / 2 + (dx / dist) * bend,
      );
    };
    pose.leftKnee = knee(pose.leftHip, pose.leftAnkle);
    pose.rightKnee = knee(pose.rightHip, pose.rightAnkle);
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

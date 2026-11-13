// Generated from imagegen art by scripts/pack-v0814-shield.mjs.
export const ShieldBreakFrames = {"shield.break.0":{"atlas":[4,4,160,160],"size":[160,160],"sourceSize":[106,106],"anchor":[0.5,0.09]},"shield.break.1":{"atlas":[172,4,160,160],"size":[160,160],"sourceSize":[106,106],"anchor":[0.5,0.09]},"shield.break.2":{"atlas":[340,4,160,160],"size":[160,160],"sourceSize":[106,106],"anchor":[0.5,0.09]},"shield.break.3":{"atlas":[4,172,160,160],"size":[160,160],"sourceSize":[106,106],"anchor":[0.5,0.09]},"shield.break.4":{"atlas":[172,172,160,160],"size":[160,160],"sourceSize":[106,106],"anchor":[0.5,0.09]},"shield.break.5":{"atlas":[340,172,160,160],"size":[160,160],"sourceSize":[106,106],"anchor":[0.5,0.09]}} as const;
export const ShieldBreakDuration = .9;
export function shieldBreakFrame(age: number): keyof typeof ShieldBreakFrames {
  const index = age < .07 ? 1 : age < .16 ? 2 : age < .28 ? 3 : age < .46 ? 4 : 5;
  return `shield.break.${index}` as keyof typeof ShieldBreakFrames;
}

import type { MechanismData } from "../level/LevelData";

/** One cable junction is shared by the drawn bridle and the cuttable rope. */
export function bridgeRig(m: Pick<MechanismData,"x"|"y"|"w"|"h">) {
  const top=m.y+m.h,cx=m.x+m.w/2;
  return {top,cx,junctionY:top+58,pulleyY:top+166,
    leftX:m.x+16,rightX:m.x+m.w-16,
    rope:{x:cx-7,y:top+58,w:14,h:108}};
}

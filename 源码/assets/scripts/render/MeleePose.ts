import { GameConfig as C } from "../core/GameConfig";
import type { ComicFrameId } from "./ComicFrames";
import { meleeHand } from "../combat/MeleeGeometry";
export interface MeleeActor {
  meleeTime?:number;meleeProgress?:number;meleeStage?:number;
  meleeStance?:"stand"|"crouch"|"jump";crouched?:boolean;
}
/** Shared blade/arc attachment and body selection; all poses reuse supplied pixels. */
export function meleePose(a:MeleeActor) {
  const stage=Math.max(1,a.meleeStage??1),c=C.melee.combo[Math.min(2,stage-1)],
    progress=a.meleeProgress??(C.melee.duration-(a.meleeTime??0))/C.melee.duration,
    elapsed=progress*c.duration,t=Math.max(0,Math.min(1,(elapsed-c.windup)/c.active)),
    stance=a.meleeStance??(a.crouched?"crouch":"stand"),windup=elapsed<c.windup;
  const frame:ComicFrameId=stance==="crouch"?"unarmed.player.crouch.0":stance==="jump"?"unarmed.player.jump.1":windup?"player.throw.0":stage===1?"player.throw.3":stage===2?"player.throw.1":"player.throw.4";
  const hand=windup&&stance==="stand"?{x:-27,y:49}:meleeHand(stage,stance);
  const bladeWidth=(stance==="crouch"?78:c.range)-meleeHand(stage,stance).x;
  return {frame,hand,angle:windup?c.start:c.start+(c.end-c.start)*t,start:c.start,end:c.start+(c.end-c.start)*t,
    active:!windup&&t<1,range:bladeWidth,originY:hand.y,stage,width:bladeWidth,progress};
}

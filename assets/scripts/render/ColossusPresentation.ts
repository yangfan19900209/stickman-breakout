import { MechFrames, MechSockets, MechScale } from "./MechFrames";
import type { Facing } from "../core/Types";

export interface MechPose {
  x:number;y:number;facing:Facing;animation:string;animationTime:number;deadTime:number;
  health?:number;maxHealth?:number;action?:string;windup?:number;recoil:number;hitTime?:number;
  laserTime?:number;
}
export function colossusPresentation(a:MechPose) {
  let id:keyof typeof MechSockets='mech.idle';
  if(a.animation==='Dead')id=a.deadTime<.65?'mech.damaged':a.deadTime<1.35?'mech.collapse':'mech.wreck';
  else if(a.action==='laser'&&((a.windup??0)>0||(a.laserTime??0)>0||a.recoil>.1))id='mech.charge';
  else if(a.recoil>.1&&['salvo','sweep','burst'].includes(a.action??''))id='mech.charge';
  else if(a.action==='stomp'&&(a.windup??0)>0)id=a.windup!>.45?'mech.step.0':'mech.step.1';
  else if((a.health??1)/(a.maxHealth??1)<.35)id='mech.damaged';
  else if(a.action==='intro')id=Math.floor(a.animationTime*3)%2?'mech.step.0':'mech.step.1';
  const f=MechFrames[id];
  return{id,scale:MechScale,width:f.size[0]*MechScale,height:f.size[1]*MechScale,flip:-a.facing,anchor:f.anchor};
}
export function colossusSocket(a:MechPose,slot:'muzzle'|'core'|'leftPod'|'rightPod'='muzzle') {
  const view=colossusPresentation(a),map=MechSockets[view.id] as Partial<Record<typeof slot,readonly[number,number]>>;
  const local=map[slot]??MechSockets['mech.idle'][slot];
  return{x:a.x-local[0]*a.facing,y:a.y+local[1]};
}

import { BossFrames, BossSockets, RhinoScale } from './BossFrames';
import type { MechPose } from './ColossusPresentation';

export function tankPresentation(a:MechPose) {
  let id: keyof typeof BossFrames = 'rhino.idle';
  if(a.animation==='Dead')id=a.deadTime<.45?'rhino.damaged':'rhino.wreck';
  else if(a.action==='jump-tell')id='rhino.ram-tell';
  else if(a.action==='jump')id=a.animation==='Jump'?'rhino.roll.1':'rhino.roll.0';
  else if(a.action==='ram')id='rhino.ram';
  else if(a.action==='ram-tell')id='rhino.ram-tell';
  else if(a.recoil>.1)id='rhino.fire';
  else if((a.hitTime??0)>.06)id='rhino.damaged';
  else if(Math.abs(a.vx??0)>1)id=Math.floor((a.stride??0)*4)%2?'rhino.roll.1':'rhino.roll.0';
  const f=BossFrames[id];
  return {id,scale:RhinoScale,width:f.size[0]*RhinoScale,height:f.size[1]*RhinoScale,flip:-a.facing,anchor:f.anchor};
}
export function tankSocket(a:MechPose) {
  const v=tankPresentation(a),local=BossSockets[v.id].muzzle;
  return {x:a.x-local[0]*RhinoScale*a.facing,y:a.y+local[1]*RhinoScale};
}

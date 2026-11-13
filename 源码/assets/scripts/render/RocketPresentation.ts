import { GameConfig as C } from "../core/GameConfig";

/** Reveal the original sprite from its nose while it is leaving the barrel.
 * Four-source-pixel steps bound the region cache to 50 entries for this sheet.
 */
export function rocketCrop(distance:number, sourceWidth:number, sourceHeight:number,fullLength:number=C.rocketLaunch.visualLength): readonly[number,number,number,number] {
  const exposed=Math.min(fullLength,C.rocketLaunch.exposedNose+Math.max(0,distance));
  const width=Math.min(sourceWidth,Math.max(4,Math.ceil(exposed/fullLength*sourceWidth/4)*4));
  return [sourceWidth-width,0,width,sourceHeight];
}

/** A bullet's long painted trail must emerge from the muzzle, never the torso.
 * Quantized inward so the revealed tail cannot extend behind the launch point. */
export function bulletCrop(distance:number, sourceWidth:number, sourceHeight:number,fullLength:number): readonly[number,number,number,number] {
  const width = distance >= fullLength ? sourceWidth : Math.max(1, Math.floor(Math.max(0, distance) / fullLength * sourceWidth / 4) * 4);
  return [sourceWidth-width,0,width,sourceHeight];
}

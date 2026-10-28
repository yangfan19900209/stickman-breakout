import { GameConfig as C } from "../core/GameConfig";

/** Reveal the original sprite from its nose while it is leaving the barrel.
 * Four-source-pixel steps bound the region cache to 50 entries for this sheet.
 */
export function rocketCrop(distance:number, sourceWidth:number, sourceHeight:number): readonly[number,number,number,number] {
  const exposed=Math.min(C.rocketLaunch.visualLength,C.rocketLaunch.exposedNose+Math.max(0,distance));
  const width=Math.min(sourceWidth,Math.max(4,Math.ceil(exposed/C.rocketLaunch.visualLength*sourceWidth/4)*4));
  return [sourceWidth-width,0,width,sourceHeight];
}

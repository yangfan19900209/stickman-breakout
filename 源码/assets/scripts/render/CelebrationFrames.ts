// Original transparent image is preserved in art/source/v063. Rects reference
// four equal cells directly; no repainted or stretched character pieces.
export const CelebrationFrames = {
  "celebrate.0":{atlas:[60,90,450,580],anchor:[.5,10/580],sourceSize:[450,580],size:[450,580]},
  "celebrate.1":{atlas:[603,90,450,580],anchor:[.5,10/580],sourceSize:[450,580],size:[450,580]},
  "celebrate.2":{atlas:[1146,90,450,580],anchor:[.5,10/580],sourceSize:[450,580],size:[450,580]},
  "celebrate.3":{atlas:[1689,90,450,580],anchor:[.5,10/580],sourceSize:[450,580],size:[450,580]},
} as const;
export function celebrationFrame(time:number):keyof typeof CelebrationFrames {
  const loop=[0,1,2,1,3,1,2,1] as const;
  return `celebrate.${loop[Math.floor(Math.max(0,time)*6)%loop.length]}`;
}

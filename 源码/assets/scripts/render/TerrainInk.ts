import { Color } from "cc";
import { Ink, colors } from "./Ink";

/** Shared final-world-scale vocabulary for both chapters, alongside the hero. */
export const TerrainStyle = {
  outline: 2.8,
  detail: 1.5,
  stone: new Color(247, 248, 245),
  shade: new Color(228, 232, 229),
  water: new Color(213, 232, 241, 245),
};

/** A bounded surface band and sparse embedded stones, never repeated floor rows. */
export function soil(ink:Ink,x:number,top:number,w:number):void {
  const lip=[];
  for(let dx=0;dx<w;dx+=8)
    lip.push({x:x+dx,y:top-12-2.4*Math.sin((x+dx)*.23)-1.3*Math.sin((x+dx)*.61)});
  lip.push({x:x+w,y:top-12});
  ink.polygon([{x,y:top}, {x:x+w,y:top},...lip.slice().reverse()],colors.paper);
  ink.line(lip,1.6);
  for(let px=x+28;px<x+w-18;px+=73){
    const depth=34+21*(1+Math.sin(px*.119));
    const sx=7+4*(1+Math.cos(px*.17)),y=top-depth;
    const p=[{x:px-sx,y},{x:px-sx*.6,y:y+7},{x:px+sx*.3,y:y+9},{x:px+sx,y:y+2},{x:px+sx*.4,y:y-3}];
    ink.polygon(p,colors.paper);ink.line([...p,p[0]],1.5,colors.muted);
    if(w>100)ink.line([{x:px,y:top-15},{x:px-4,y:top-27},{x:px+2,y:top-36}],1.2,colors.mid);
  }
  for(let px=x+65;px<x+w-50;px+=193){
    const y=top-114-35*Math.sin(px*.047);
    const p=[{x:px-18,y},{x:px-10,y:y+13},{x:px+12,y:y+15},{x:px+27,y:y-3},{x:px+5,y:y-12}];
    ink.polygon(p,colors.paper);ink.line([...p,p[0]],1.6,colors.muted);
    ink.segment(px-10,y+13,px+5,y-12,1.1,colors.mid);
    ink.segment(px+40,y-30,px+44,y-31,1.7,colors.mid);
  }
}

export function grass(ink: Ink, x: number, y: number, scale = 1): void {
  const shape = [[-17,0],[-23,17],[-9,8],[-8,27],[0,10],[13,23],[9,5],[22,12],[17,0]];
  const p = shape.map(([dx,dy]) => ({x:x+dx*scale,y:y+dy*scale}));
  ink.polygon(p, colors.paper);
  ink.line(p, TerrainStyle.outline);
}

export function stone(ink: Ink, x: number, y: number, scale = 1): void {
  const p = [[-24,0],[-20,12],[-5,23],[12,20],[25,6],[22,0]].map(([dx,dy])=>({x:x+dx*scale,y:y+dy*scale}));
  ink.polygon(p, TerrainStyle.stone);
  ink.line([...p,p[0]], TerrainStyle.outline);
  ink.line([{x:x-5*scale,y:y+23*scale},{x:x+2*scale,y:y+9*scale},{x:x+25*scale,y:y+6*scale}],TerrainStyle.detail,colors.muted);
}

/** Rails and braces are scenery; the opaque beam follows the actual platform. */
export function bridge(ink:Ink,x:number,top:number,w:number,h:number):void {
  const bottom=top-h;
  ink.polygon([{x:x+18,y:bottom},{x:x+48,y:bottom-32},{x:x+70,y:bottom},{x:x+60,y:bottom},{x:x+48,y:bottom-20},{x:x+30,y:bottom}],TerrainStyle.shade);
  for (const bx of [x+18,x+w-70])
    ink.line([{x:bx,y:bottom},{x:bx+30,y:bottom-32},{x:bx+52,y:bottom}],TerrainStyle.outline);
  ink.rect(x, bottom, w, h, colors.ink, TerrainStyle.stone, TerrainStyle.outline);
  const railTop=top+28;
  ink.line([{x:x+8,y:top},{x:x+8,y:railTop},{x:x+w-8,y:railTop},{x:x+w-8,y:top}],TerrainStyle.outline);
  ink.segment(x+8,top+14,x+w-8,top+14,TerrainStyle.detail);
  for(let px=x+52;px<x+w-28;px+=76){
    ink.segment(px,top+1,px,railTop,TerrainStyle.detail);
    ink.circle(px,top-h/2,1.5,colors.ink,colors.paper,1.3);
  }
}

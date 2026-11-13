import { ComicFrameId } from "./ComicFrames";
import { TerrainTile } from "./TerrainTiles";
import { TerrainSpan } from "./TerrainSurface";
import { landConcrete } from "./LandTerrainPlan";
import { LandDeckArt, landScaffoldThickness } from "../level/LandDeckProfile";
import { TerrainV088Frames } from "./TerrainV088Frames";

/** Material changes never create a physical ledge. */
export function landMaterialSpans(spans: readonly TerrainSpan[]): TerrainSpan[] {
  return spans.flatMap(s => {
    const cuts = [s.x, ...[3950,6800,8500].filter(x=>x>s.x&&x<s.x+s.w), s.x+s.w];
    return cuts.slice(1).map((right,i)=>({x:cuts[i],w:right-cuts[i],top:s.top}));
  });
}

/** Surface material once, independent interior below; every piece retains scale. */
export const groundDecorClear=(x:number,w:number,blocked:readonly {x:number;w:number}[]):boolean=>
  !blocked.some(r=>x+w>r.x-24&&x<r.x+r.w+24);

export function drawnGroundTiles(spans:readonly TerrainSpan[],base=-260,blocked:readonly {x:number;w:number}[]=[]):TerrainTile[]{
  const out:TerrainTile[]=[],scale=.25,fillScale=.875,tw=512*fillScale,th=512*fillScale;
  for(const s of landMaterialSpans(spans)){
    const concrete=landConcrete(s.x),id='terrain088.grass' as const,
      fillId:ComicFrameId='unified.fill',
      [sourceW,sourceH]=TerrainV088Frames[id].size,capBottom=s.top-sourceH*scale;
    // One two-dimensional WORLD phase, including material cuts and road steps.
    // Mirrored neighbouring cells share identical edge pixels in both axes.
    for(let y=base;y<capBottom-.001;){
      const row=Math.floor((y+1e-7)/th),py=Math.max(0,y-row*th),h=Math.min(th-py,capBottom-y),mirrorY=Math.abs(row%2)===1;
      for(let x=s.x;x<s.x+s.w-.001;){
        const col=Math.floor((x+1e-7)/tw),px=Math.max(0,x-col*tw),
          w=Math.min(tw-px,s.x+s.w-x),mirrorX=Math.abs(col%2)===1;
        out.push({id:fillId,x,y,scale:fillScale,opacity:205,mirrorX,mirrorY,crop:[mirrorX?512-(px+w)/fillScale:px/fillScale,mirrorY?py/fillScale:512-(py+h)/fillScale,w/fillScale,h/fillScale]});
        x+=w;
      }
      y+=h;
    }
    for(let x=s.x;x<s.x+s.w-.001;){
      const cell=Math.floor((x+1e-7)/(sourceW*scale)),phase=Math.max(0,x/scale-cell*sourceW),
        w=Math.min((sourceW-phase)*scale,s.x+s.w-x),mirrorX=Math.abs(cell%2)===1;
      out.push({id,x,y:capBottom,scale,mirrorX,crop:[mirrorX?sourceW-phase-w/scale:phase,0,w/scale,sourceH]});x+=w;
    }
    // Complete crowns only: partial spans use separate whole shrubs, so no
    // tall leaf is sliced at a step or at the end of a repeating cap.
    if(!concrete)for(let x=s.x+28;x+293<s.x+s.w-22;x+=560)
      if(groundDecorClear(x,293,blocked))out.push({id:'drawn.grass',x,y:s.top,scale:.5,crop:[0,0,586,82]});
  }
  return out;
}

export const DrawnSteel=LandDeckArt;
export function drawnPlatformTiles(x:number,top:number,width:number,base?:number):TerrainTile[]{
  const id=Math.floor(x/100)%2?'terrain088.deck.rib':'terrain088.deck.panel',
    [sw,sh]=TerrainV088Frames[id].size,scale=landScaffoldThickness(width)/(sh-6),beamY=top-(sh-3)*scale;
  const rib=id.endsWith('rib'),out:TerrainTile[]=[],capSource=rib?620:220,cap=Math.min(capSource*scale,width*.46);
  // The capped ends keep the two complete diagonal braces. Only the quiet
  // central panel repeats; line weight and beam depth are never stretched.
  out.push({id,x,y:beamY,scale,crop:[0,0,cap/scale,sh]});
  if(rib)for(let px=x+cap;px<x+width-cap-.001;){
    const w=Math.min(100*scale,x+width-cap-px);
    out.push({id,x:px,y:beamY,scale,crop:[540,0,w/scale,sh]});px+=w;
  }else{
    const available=width-cap*2,panel=292*scale,count=Math.floor(available/(335*scale)),gap=(available-count*panel)/(count+1);
    let px=x+cap;
    for(let i=0;i<=count;i++){
      // Only a blank rim/paint column extends horizontally; complete inset
      // panels, end caps and vertical outlines retain uniform native scale.
      if(gap>.001)out.push({id,x:px,y:beamY,scale:gap/15,scaleY:scale,crop:[526,0,15,sh]});
      px+=gap;
      if(i<count){out.push({id,x:px,y:beamY,scale,crop:[231,0,292,sh]});px+=panel;}
    }
  }
  out.push({id,x:x+width-cap,y:beamY,scale,crop:[sw-cap/scale,0,cap/scale,sh]});
  return out;
}

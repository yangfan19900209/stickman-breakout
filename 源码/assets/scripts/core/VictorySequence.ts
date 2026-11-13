import { clamp } from "./Types";

export const victoryBursts = [
  { at: .08, x: -68, y: 154, radius: 85, shake: 5, haptic: "light" },
  { at: .43, x: 72, y: 122, radius: 110, shake: 7, haptic: "light" },
  { at: .88, x: -36, y: 62, radius: 125, shake: 8, haptic: "light" },
  { at: 1.37, x: 0, y: 28, radius: 220, shake: 14, haptic: "heavy" },
  { at: 1.92, x: 86, y: 32, radius: 95, shake: 5, haptic: "light" },
] as const;
const smooth = (t:number) => { const n=clamp(t,0,1);return n*n*(3-2*n); };

/** Simulation-owned timeline: one-shot impacts survive pauses and frame skips. */
export class VictorySequence {
  active=false;
  time=0;
  impactSerial=0;
  haptic: "light"|"heavy"="light";
  private nextBurst=0;
  reset():void {this.active=false;this.time=0;this.nextBurst=this.impactSerial=0;this.haptic="light";}
  start():void {if(this.active)return;this.reset();this.active=true;}
  advance(dt:number): (typeof victoryBursts)[number][] {
    if(!this.active)return [];
    this.time+=dt;const events:(typeof victoryBursts)[number][]=[];
    while(this.nextBurst<victoryBursts.length&&this.time>=victoryBursts[this.nextBurst].at){
      const event=victoryBursts[this.nextBurst++];events.push(event);this.impactSerial++;this.haptic=event.haptic;
    }
    return events;
  }
  get phase(): "idle"|"collapse"|"focus"|"cheer"|"settlement" {
    return !this.active?"idle":this.time<2.55?"collapse":this.time<3.7?"focus":this.time<5.8?"cheer":"settlement";
  }
  get focus():number {return this.active?smooth((this.time-2.55)/1.15):0;}
  get cheerTime():number {return this.active?Math.max(0,this.time-3.25):0;}
  get resultProgress():number {return this.active?smooth((this.time-5.8)/.75):0;}
  get resultsReady():boolean {return this.active&&this.time>=6.55;}
  get flash():number {return this.active?Math.max(0,1-Math.abs(this.time-1.41)/.11):0;}
  snapshot(){return{active:this.active,time:this.time,phase:this.phase,focus:this.focus,cheerTime:this.cheerTime,
    resultProgress:this.resultProgress,resultsReady:this.resultsReady,impactSerial:this.impactSerial,haptic:this.haptic,flash:this.flash};}
}

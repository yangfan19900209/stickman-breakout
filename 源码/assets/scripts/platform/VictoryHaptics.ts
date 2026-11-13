interface Runtime {
  wx?: { vibrateShort?: (options:{type:"light"|"heavy";fail:()=>void})=>void };
  navigator?: { vibrate?: (pattern:number|number[])=>boolean };
}
/** Optional device feedback; unsupported/denied vibration never blocks victory. */
export class VictoryHaptics {
  private last=0;
  requests=0;
  supported=false;
  constructor(private runtime:Runtime=globalThis as Runtime){}
  update(v:{active:boolean;impactSerial:number;haptic:"light"|"heavy"},enabled=true):void {
    if(!v.active){this.last=0;return;}
    if(v.impactSerial<=this.last)return;
    this.last=v.impactSerial;if(!enabled)return;
    try {
      if(this.runtime.wx?.vibrateShort){
        this.supported=true;this.requests++;
        this.runtime.wx.vibrateShort({type:v.haptic,fail:()=>{}});
      } else if(this.runtime.navigator?.vibrate){
        this.supported=true;this.requests++;
        this.runtime.navigator.vibrate(v.haptic==="heavy"?[55,40,70]:18);
      }
    } catch { /* A platform restriction does not affect the visual sequence. */ }
  }
}

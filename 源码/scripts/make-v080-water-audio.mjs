import {writeFileSync} from 'node:fs';
// Short pressure crack, descending low thump, filtered water tail. Deterministic
// synthesis avoids a long flat sine tone and keeps simultaneous hits bounded.
const rate=22050,duration=.64,count=Math.round(rate*duration),pcm=Buffer.alloc(count*2);
let seed=27,low=0,peak=0,sum=0;
for(let i=0;i<count;i++){
 const t=i/rate;seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;
 const noise=(seed>>>0)/2147483648-1;low=low*.82+noise*.18;
 const attack=Math.min(1,t/.003),thump=Math.sin(2*Math.PI*(52*t+88*.065*(1-Math.exp(-t/.065))));
 const value=attack*(thump*.7*Math.exp(-t/.14)+noise*.34*Math.exp(-t/.026)+low*.62*Math.exp(-t/.19)+Math.sin(2*Math.PI*185*t)*.1*Math.exp(-t/.045));
 const v=Math.max(-.94,Math.min(.94,value));peak=Math.max(peak,Math.abs(v));sum+=v*v;pcm.writeInt16LE(Math.round(v*32767),i*2);
}
const header=Buffer.alloc(44);header.write('RIFF');header.writeUInt32LE(36+pcm.length,4);header.write('WAVEfmt ',8);header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);header.writeUInt16LE(1,22);header.writeUInt32LE(rate,24);header.writeUInt32LE(rate*2,28);header.writeUInt16LE(2,32);header.writeUInt16LE(16,34);header.write('data',36);header.writeUInt32LE(pcm.length,40);
writeFileSync('assets/level02/water-blast.wav',Buffer.concat([header,pcm]));
writeFileSync('../开发进度/验证记录/v080-water-audio.json',JSON.stringify({source:'scripts/make-v080-water-audio.mjs',rate,duration,peak,rms:Math.sqrt(sum/count),bytes:pcm.length+44},null,2));

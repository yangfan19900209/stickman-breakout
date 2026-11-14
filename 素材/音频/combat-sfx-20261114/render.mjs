import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const here = path.dirname(fileURLToPath(import.meta.url));
const runtime = path.resolve(here, '../../../源码/assets/resources/audio');
const rate = 22050;
const specs = {
  rocket: .62, 'rocket-blast': .86, 'enemy-shot': .105, 'boss-shot': .18,
  cannon: .32, beam: .85, slam: .55, charge: .46, 'enemy-melee': .22, 'enemy-sonar': .52,
};
function wav(samples) {
  const data = Buffer.alloc(44 + samples.length * 2);
  data.write('RIFF'); data.writeUInt32LE(data.length - 8, 4); data.write('WAVEfmt ', 8);
  data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(1, 22);
  data.writeUInt32LE(rate, 24); data.writeUInt32LE(rate * 2, 28);
  data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34);
  data.write('data', 36); data.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((v, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), 44 + i * 2));
  return data;
}
function synth(name, duration) {
  const samples = new Float64Array(Math.round(duration * rate));
  let seed = 0x25a17, slow = 0, mid = 0, phase = 0, sub = 0;
  for (let i = 0; i < samples.length; i++) {
    const t = i / rate, u = t / duration;
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const noise = seed / 2147483648 - 1;
    slow += .045 * (noise - slow); mid += .35 * (noise - mid);
    const band = mid - slow, high = noise - mid;
    let v = 0, hz = 100;
    if (name === 'rocket') {
      // Dry tube impulse, then a delayed motor hiss; no continuous flight loop.
      hz = 115 - 65 * u;
      const motor = Math.max(0, Math.min(1, (t - .022) / .045)) * Math.exp(-4.5 * t);
      v = (high * .28 + slow * 2) * Math.exp(-55 * t)
        + (band * 1.6 + slow * 1.1) * motor * (1 + .13 * Math.sin(t * 460));
    } else if (name === 'rocket-blast') {
      hz = 105 * Math.exp(-4 * t) + 32;
      v = high * .48 * Math.exp(-60 * t) + slow * 4.5 * Math.exp(-6 * t)
        + band * 1.5 * Math.exp(-12 * t);
    } else if (name === 'enemy-shot' || name === 'boss-shot') {
      hz = (name === 'boss-shot' ? 150 : 340) * (1 - .65 * u);
      v = (high * .55 + band * .85 + slow * (name === 'boss-shot' ? 2.4 : .4)) * Math.exp(-7 * u);
    } else if (name === 'cannon' || name === 'slam') {
      hz = (name === 'cannon' ? 140 : 88) * Math.exp(-8 * t) + 38;
      v = (slow * 3.7 + band * .8) * Math.exp(-7 * u) + high * .35 * Math.exp(-65 * t);
    } else if (name === 'beam') {
      hz = 850 * Math.exp(-2.8 * t) + 150;
      v = band * .12 + Math.sin(phase + 1.5 * Math.sin(phase * 2.015)) * .52;
      v *= Math.min(1, t / .025) * Math.pow(1 - u, .6) * (.82 + .18 * Math.cos(t * 110));
    } else if (name === 'charge') {
      hz = 75 + 230 * u;
      v = (slow * 1.7 + band * .9 + Math.sin(phase) * .4) * Math.sin(Math.PI * u) ** .7;
    } else if (name === 'enemy-melee') {
      hz = 220 - 150 * u;
      v = (band * 1.8 + high * .3) * Math.sin(Math.PI * u) ** 1.5;
    } else {
      hz = 530 - 330 * u;
      v = Math.sin(phase + .4 * Math.sin(phase * 2)) * Math.exp(-4 * u)
        * (.8 + .2 * Math.cos(t * 65));
    }
    phase += Math.PI * 2 * hz / rate;
    sub += Math.PI * 2 * (name === 'rocket-blast' ? 65 - 33 * u : hz) / rate;
    if (['rocket', 'rocket-blast', 'boss-shot', 'cannon', 'slam'].includes(name))
      v += Math.sin(sub) * (name === 'rocket' ? .36 : .6) * Math.exp(-8 * u);
    samples[i] = Math.tanh(v * 1.5) * Math.min(1, t / .0025, (duration - t) / .018);
  }
  // Remove DC and taper again; normalize without hard clipping.
  const mean = samples.reduce((a, v) => a + v, 0) / samples.length;
  let peak = 0;
  for (let i = 0; i < samples.length; i++) {
    samples[i] = (samples[i] - mean) * Math.min(1, i / 55, (samples.length - 1 - i) / 220);
    peak = Math.max(peak, Math.abs(samples[i]));
  }
  for (let i = 0; i < samples.length; i++) samples[i] *= .8 / peak;
  return samples;
}
export function buildCombatSounds() {
  const output = path.join(here, 'output');
  fs.mkdirSync(output, { recursive: true });
  fs.mkdirSync(runtime, { recursive: true });
  const files = [], audition = [];
  for (const [name, duration] of Object.entries(specs)) {
    const samples = synth(name, duration), bytes = wav(samples), filename = `${name}.wav`;
    fs.writeFileSync(path.join(output, filename), bytes);
    fs.writeFileSync(path.join(runtime, filename), bytes);
    const metaPath = path.join(runtime, filename + '.meta');
    if (!fs.existsSync(metaPath)) {
      const hex = createHash('md5').update(`assets/resources/audio/${filename}`).digest('hex');
      const uuid = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
      fs.writeFileSync(metaPath, JSON.stringify({ ver: '1.0.0', importer: 'audio-clip', imported: true,
        uuid, files: ['.json', '.wav'], subMetas: {}, userData: { downloadMode: 0 } }, null, 2) + '\n');
    }
    files.push({ file: filename, seconds: samples.length / rate, bytes: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex'), peakDbfs: 20 * Math.log10(.8),
      rmsDbfs: 20 * Math.log10(Math.sqrt(samples.reduce((s, v) => s + v * v, 0) / samples.length)) });
    audition.push(...samples, ...new Float64Array(rate * .45));
  }
  fs.writeFileSync(path.join(output, 'combat-sfx-audition.wav'), wav(audition));
  const manifest = { date: '2026-11-14', source: 'Original deterministic oscillator/noise synthesis; no sampled recordings',
    sampleRate: rate, channels: 1, bits: 16, files, totalRuntimeBytes: files.reduce((s, f) => s + f.bytes, 0) };
  fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Generated ${files.length} combat effects (${manifest.totalRuntimeBytes} bytes).`);
  return manifest;
}
if (path.resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) buildCombatSounds();

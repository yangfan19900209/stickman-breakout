// Offline, deterministic chiptune arrangement. No samples or npm dependencies.
// The source score and MIDI are credited in README.md.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = dirname(fileURLToPath(import.meta.url));
const BPM = 100;
const RATE = 44100;
const BEATS = 64;
const SPB = 60 / BPM;
const TAU = 2 * Math.PI;
const frames = Math.round(BEATS * SPB * RATE);
const source = readFileSync(join(dir, 'source/mozart-k331-rondo.mid'));

function readMidi(buf) {
  let p = 0;
  const tag = () => { const s = buf.toString('ascii', p, p + 4); p += 4; return s; };
  const u32 = () => { const n = buf.readUInt32BE(p); p += 4; return n; };
  const u16 = () => { const n = buf.readUInt16BE(p); p += 2; return n; };
  const vlq = () => {
    let n = 0;
    for (let k = 0; k < 4; k++) {
      const b = buf[p++]; n = (n << 7) | (b & 127);
      if (!(b & 128)) return n;
    }
    throw new Error('Invalid MIDI variable-length number');
  };
  if (tag() !== 'MThd' || u32() !== 6) throw new Error('Invalid MIDI header');
  const format = u16(), trackCount = u16(), ppq = u16();
  if (format !== 1 || ppq & 0x8000) throw new Error('Expected type-1 PPQ MIDI');
  const tracks = [];
  for (let ti = 0; ti < trackCount; ti++) {
    if (tag() !== 'MTrk') throw new Error('Invalid track header');
    const size = u32(), end = p + size, active = new Map(), notes = [];
    let tick = 0, running = 0;
    while (p < end) {
      tick += vlq();
      let status = buf[p];
      if (status & 128) p++;
      else status = running;
      if (status === 0xff) {
        p++; const len = vlq(); p += len;
        continue;
      }
      if (status === 0xf0 || status === 0xf7) {
        const len = vlq(); p += len; running = 0;
        continue;
      }
      if (status < 0x80 || status >= 0xf0) throw new Error('Invalid running status');
      running = status;
      const type = status >> 4, channel = status & 15, pitch = buf[p++];
      const value = (type === 12 || type === 13) ? 0 : buf[p++];
      const key = `${channel}:${pitch}`;
      if (type === 9 && value > 0) {
        const q = active.get(key) ?? [];
        q.push({ tick, pitch, velocity: value }); active.set(key, q);
      } else if (type === 8 || (type === 9 && value === 0)) {
        const n = active.get(key)?.shift();
        if (!n) throw new Error('Unpaired MIDI note-off');
        notes.push({ beat: n.tick / ppq, length: (tick - n.tick) / ppq,
          pitch, velocity: n.velocity });
      }
    }
    if (p !== end || [...active.values()].some(q => q.length)) throw new Error('Incomplete MIDI track');
    tracks.push(notes.sort((a, b) => a.beat - b.beat || b.pitch - a.pitch));
  }
  if (p !== buf.length) throw new Error('Unexpected trailing MIDI data');
  return { ppq, tracks };
}

const midi = readMidi(source);
if (midi.tracks.length !== 3 || midi.tracks[1].length !== 838 || midi.tracks[2].length !== 776)
  throw new Error('Unexpected source arrangement; review musical selection first');
const left = new Float32Array(frames);
const right = new Float32Array(frames);
const send = new Float32Array(frames);
const tables = new Map();

function oscillator(kind, pitch) {
  const key = `${kind}:${pitch}`;
  if (tables.has(key)) return tables.get(key);
  const freq = 440 * 2 ** ((pitch - 69) / 12);
  const count = 2048;
  const table = new Float32Array(count);
  const limit = Math.min(28, Math.floor(8500 / freq));
  for (let i = 0; i < count; i++) {
    const phase = i / count;
    let s = 0;
    for (let h = 1; h <= limit; h++) {
      // A soft spectral roll-off keeps pulse notes from becoming piercing.
      const rolloff = Math.exp(-(((freq * h) / (kind === 'lead' ? 5800 : 4300)) ** 2));
      if (kind === 'lead') {
        s += 2 * Math.sin(Math.PI * h * 0.3) / (Math.PI * h)
          * Math.cos(TAU * h * (phase - 0.15)) * rolloff;
      } else if (h % 2) {
        s += (h % 4 === 1 ? 1 : -1) * Math.sin(TAU * h * phase) / (h * h) * rolloff;
      }
    }
    table[i] = s;
  }
  let peak = 0;
  for (const x of table) peak = Math.max(peak, Math.abs(x));
  for (let i = 0; i < count; i++) table[i] /= peak;
  tables.set(key, table);
  return table;
}

function sampleTable(table, phase) {
  const x = (phase - Math.floor(phase)) * table.length;
  const i = Math.floor(x), f = x - i;
  return table[i] * (1 - f) + table[(i + 1) % table.length] * f;
}

function tone(note, kind, gain, pan = 0) {
  const frequency = 440 * 2 ** ((note.pitch - 69) / 12);
  const gate = Math.min(note.length * SPB * (kind === 'lead' ? 0.92 : 0.79),
    (BEATS - note.beat) * SPB);
  const release = kind === 'lead' ? 0.034 : kind === 'bass' ? 0.065 : 0.042;
  const attack = kind === 'lead' ? 0.006 : 0.009;
  const start = Math.round(note.beat * SPB * RATE);
  const count = Math.ceil((gate + release) * RATE);
  const table = oscillator(kind === 'lead' ? 'lead' : 'triangle', note.pitch);
  const gl = Math.cos((pan + 1) * Math.PI / 4) * gain;
  const gr = Math.sin((pan + 1) * Math.PI / 4) * gain;
  let phase = 0;
  for (let j = 0; j < count; j++) {
    const t = j / RATE;
    const env = Math.min(1, t / attack)
      * (0.69 + 0.31 * Math.exp(-t * (kind === 'bass' ? 9 : 13)))
      * Math.max(0, 1 - Math.max(0, t - gate) / release);
    const vibrato = kind === 'lead' && t > 0.12
      ? 0.0019 * Math.min(1, (t - 0.12) * 5) * Math.sin(TAU * 4.3 * t) : 0;
    phase += frequency / RATE * (1 + vibrato);
    let s = sampleTable(table, phase);
    if (kind === 'bass') {
      s = s * 0.45 + 0.55 * Math.sin(TAU * phase + 0.8 * Math.exp(-t * 15) * Math.sin(TAU * phase * 2));
    } else if (kind === 'harmony') {
      s = s * 0.75 + 0.25 * Math.sin(TAU * phase + 1.1 * Math.exp(-t * 11) * Math.sin(TAU * phase * 2));
    }
    s *= env;
    const at = (start + j) % frames;
    left[at] += s * gl; right[at] += s * gr;
    if (kind !== 'bass') send[at] += s * gain * (kind === 'lead' ? 0.12 : 0.07);
  }
}

function groups(notes) {
  const map = new Map();
  for (const note of notes.filter(n => n.beat < BEATS)) {
    const list = map.get(note.beat) ?? []; list.push(note); map.set(note.beat, list);
  }
  return [...map.values()];
}

for (const chord of groups(midi.tracks[1])) {
  const top = chord[0];
  const accent = Math.abs(((top.beat - 1) % 2)) < 0.001 ? 1.045 : 1;
  tone(top, 'lead', 0.19 * accent * (top.pitch > 83 ? 0.85 : 1), -0.06);
  // Do not double the main pulse at octave passages: retain just quiet harmony.
  for (const n of chord.slice(1)) tone(n, 'harmony', 0.048 / Math.sqrt(chord.length), 0.27);
}
for (const chord of groups(midi.tracks[2])) {
  const low = chord.at(-1);
  const bass = low.pitch <= 57 && (chord.length === 1 || chord[0].pitch - low.pitch >= 12);
  if (bass) tone({ ...low, pitch: low.pitch - (low.pitch >= 45 ? 12 : 0) }, 'bass', 0.22, 0);
  for (const n of chord) {
    if (bass && n === low) continue;
    tone(n, 'harmony', 0.085 / Math.sqrt(chord.length), -0.33);
  }
}

let seed = 20261114;
function noise() { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2147483648 - 1; }
function drum(beat, kind, gain) {
  const start = Math.round(beat * SPB * RATE);
  const duration = kind === 'kick' ? 0.24 : kind === 'snare' ? 0.15 : 0.042;
  let phase = 0, low = 0, previous = 0;
  for (let i = 0; i < Math.ceil(duration * RATE); i++) {
    const t = i / RATE, n = noise();
    low += 0.22 * (n - low);
    let s;
    if (kind === 'kick') {
      phase += TAU * (49 + 65 * Math.exp(-t * 34)) / RATE;
      s = Math.sin(phase) * Math.exp(-t * 19);
    } else if (kind === 'snare') {
      s = (low * 0.8 + Math.sin(TAU * 180 * t) * 0.2) * Math.exp(-t * 32);
    } else {
      s = (n - previous) * 0.4 * Math.exp(-t * 92); previous = n;
    }
    s *= gain * Math.min(1, t * 900) * Math.min(1, (duration - t) * 400);
    const at = (start + i) % frames;
    left[at] += s * 0.707; right[at] += s * 0.707;
  }
}
// Quiet half-time groove. Avoid busy sixteenth-note hats at the slower tempo.
for (let beat = 1; beat < BEATS; beat++) {
  drum(beat, 'hat', 0.017);
  if ((beat - 1) % 4 === 0) drum(beat, 'kick', 0.16);
  if ((beat - 3) % 4 === 0) drum(beat, 'snare', 0.052);
}

// Circular short reflections preserve ambience when the WAV repeats.
for (const [delay, gain, side] of [[0.071, 0.48, left], [0.103, 0.43, right], [0.149, 0.20, left], [0.183, 0.18, right]]) {
  const shift = Math.round(delay * RATE);
  let filtered = 0;
  for (let i = 0; i < frames + shift; i++) {
    filtered += 0.32 * (send[i % frames] - filtered);
    if (i >= shift) side[(i + shift) % frames] += filtered * gain;
  }
}

let peak = 0, sum = 0;
for (let i = 0; i < frames; i++) {
  peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
  sum += left[i] ** 2 + right[i] ** 2;
}
const scale = 0.76 / peak;
for (let i = 0; i < frames; i++) { left[i] *= scale; right[i] *= scale; }

function wav(path, repeats, tail, fadeOut) {
  const count = frames * repeats + Math.round(tail * RATE);
  const buf = Buffer.alloc(44 + count * 4);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + count * 4, 4); buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(RATE, 24); buf.writeUInt32LE(RATE * 4, 28);
  buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(count * 4, 40);
  for (let i = 0; i < count; i++) {
    const ending = fadeOut ? Math.min(1, Math.max(0, (frames * repeats - i) / (RATE * 1.1))) : 1;
    const beginning = fadeOut ? Math.min(1, i / (RATE * 0.006)) : 1;
    const env = beginning * ending;
    const at = i % frames;
    buf.writeInt16LE(Math.round(left[at] * env * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(right[at] * env * 32767), 46 + i * 4);
  }
  writeFileSync(join(dir, path), buf);
  return { file: path, seconds: count / RATE, bytes: buf.length,
    sha256: createHash('sha256').update(buf).digest('hex') };
}

const outputs = [wav('turkish-march-100bpm-loop.wav', 1, 0, false),
  wav('turkish-march-100bpm-preview.wav', 2, 0.25, true)];
const verification = {
  date: '2026-11-14', bpm: BPM, sampleRate: RATE, bits: 16, channels: 2,
  selection: 'Source beats [0,64), opening A minor and A major themes, no repeat expansion',
  sourceSha256: createHash('sha256').update(source).digest('hex'),
  sourceNoteCounts: midi.tracks.map(t => t.length),
  selectedNoteCounts: midi.tracks.map(t => t.filter(n => n.beat < BEATS).length),
  loopBeats: BEATS, loopSeconds: frames / RATE,
  samplePeakDbfs: 20 * Math.log10(0.76),
  rmsDbfs: 20 * Math.log10(Math.sqrt(sum / (frames * 2)) * scale),
  loopBoundaryStep: { left: Math.abs(left[0] - left.at(-1)), right: Math.abs(right[0] - right.at(-1)) },
  outputs,
  scope: 'Audition asset only; not imported into Cocos and not included in the WeChat package',
};
writeFileSync(join(dir, 'verification.json'), JSON.stringify(verification, null, 2) + '\n');
console.log(JSON.stringify(verification, null, 2));

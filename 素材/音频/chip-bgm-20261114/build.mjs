import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { randomUUID, createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(dir, '../../..');
const output = join(dir, 'output'), runtime = join(root, '源码/assets/bgm');
mkdirSync(output, { recursive: true }); mkdirSync(runtime, { recursive: true });
const json = (file, value) => writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
const meta = (file, data) => {
  if (!existsSync(file)) json(file, { ...data, imported: true, uuid: randomUUID(), subMetas: {} });
};
meta(`${runtime}.meta`, { ver: '1.2.0', importer: 'directory', files: [],
  userData: { isBundle: true, bundleConfigID: 'chapter-local', bundleName: 'bgm', priority: 1 } });
const files = [];
// Fixed linear gain from measured EBU R128 loudness of the deterministic masters.
// Match all four compressed loops near -16 LUFS without changing dynamics or pitch.
const gainDb = { 'turkish-march-80bpm': -1.9, 'turkish-march-120bpm': -1.4,
  'canon-80bpm': -3.2, 'canon-120bpm': -2.9 };
for (const song of ['turkish-march', 'canon']) for (const bpm of [80, 120]) {
  const stem = `${song}-${bpm}bpm`, mp3 = `${stem}.mp3`;
  if (!process.argv.includes('--encode-only')) execFileSync(process.execPath,
    [join(dir, 'render.mjs'), song, String(bpm)], { stdio: 'ignore' });
  execFileSync(process.env.FFMPEG ?? 'ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y',
    '-i', join(output, `${stem}.wav`), '-af', `volume=${gainDb[stem]}dB`, '-c:a', 'libmp3lame', '-b:a', '96k',
    '-metadata', `title=${song} ${bpm} BPM`, '-metadata', 'artist=Stickman Breakout', join(output, mp3)]);
  copyFileSync(join(output, mp3), join(runtime, mp3));
  meta(join(runtime, `${mp3}.meta`), { ver: '1.0.0', importer: 'audio-clip',
    files: ['.json', '.mp3'], userData: { downloadMode: 0 } });
  const data = readFileSync(join(output, mp3));
  files.push({ file: mp3, bytes: data.length, seconds: 64 * 60 / bpm, bpm, gainDb: gainDb[stem],
    sha256: createHash('sha256').update(data).digest('hex') });
}
for (const name of ['MusicBridge', 'MusicCue']) meta(join(root, `源码/assets/scripts/platform/${name}.ts.meta`),
  { ver: '4.0.24', importer: 'typescript', files: [], userData: {} });
const credits = readFileSync(join(dir, 'AUDIO-CREDITS.txt'), 'utf8');
json(join(runtime, 'credits.json'), { credits });
meta(join(runtime, 'credits.json.meta'), { ver: '2.0.2', importer: 'json', files: ['.json'], userData: {} });
copyFileSync(join(dir, 'AUDIO-CREDITS.txt'), join(root, '源码/build-templates/wechatgame/AUDIO-CREDITS.txt'));
json(join(output, 'manifest.json'), { generated: '2026-11-14', runtimeFolder: '源码/assets/bgm', files,
  totalCompressedBytes: files.reduce((sum, f) => sum + f.bytes, 0) });
console.log(JSON.stringify(files, null, 2));

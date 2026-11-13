import { mkdirSync, writeFileSync } from "node:fs";
mkdirSync("assets/resources/audio", { recursive: true });
const specs = {
  rifle: [190, 0.06],
  shotgun: [95, 0.13],
  rocket: [75, 0.19],
  blast: [52, 0.45],
  hit: [260, 0.12],
  step: [130, 0.065],
  pickup: [620, 0.24],
};
for (const [name, [freq, duration]] of Object.entries(specs)) {
  const rate = 22050,
    count = Math.floor(rate * duration),
    buffer = Buffer.alloc(44 + count * 2);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + count * 2, 4);
  buffer.write("WAVEfmt ", 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(rate, 24);
  buffer.writeUInt32LE(rate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(count * 2, 40);
  let phase = 0,
    seed = 197;
  for (let i = 0; i < count; i++) {
    const t = i / rate,
      ratio = t / duration;
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const noise = (seed / 4294967296) * 2 - 1;
    phase +=
      (Math.PI *
        2 *
        (name === "pickup"
          ? freq * (1 + Math.floor(ratio * 3) * 0.24)
          : freq * (1 - 0.65 * ratio))) /
      rate;
    const sound =
      name === "pickup"
        ? Math.sin(phase)
        : Math.sin(phase) * 0.45 + noise * 0.55;
    const envelope =
      Math.min(1, t * 600) *
      Math.exp(-ratio * (name === "blast" ? 4 : 6)) *
      (1 - ratio);
    buffer.writeInt16LE(Math.round(sound * envelope * 18000), 44 + i * 2);
  }
  writeFileSync(`assets/resources/audio/${name}.wav`, buffer);
}
console.log("Generated seven original mono PCM effects (22.05kHz).");

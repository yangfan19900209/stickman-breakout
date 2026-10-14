import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
const crc = (b) => {
  let c = 0xffffffff;
  for (const v of b) {
    c ^= v;
    for (let n = 0; n < 8; n++) c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
  }
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (name, data) => {
  const type = Buffer.from(name),
    len = Buffer.alloc(4),
    tail = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  tail.writeUInt32BE(crc(Buffer.concat([type, data])));
  return Buffer.concat([len, type, data, tail]);
};
mkdirSync("web-shell/icons", { recursive: true });
for (const [name, size] of [
  ["icon-192", 192],
  ["icon-512", 512],
  ["apple-touch-icon", 180],
]) {
  const pixels = Buffer.alloc((size * 4 + 1) * size);
  const k = size / 512;
  const segments = [
    [231, 203, 236, 314, 20],
    [236, 314, 178, 401, 20],
    [236, 314, 300, 400, 20],
    [231, 232, 286, 269, 18],
    [286, 269, 333, 259, 18],
    [229, 238, 199, 271, 18],
    [199, 271, 274, 274, 18],
    [318, 257, 408, 257, 23],
    [323, 259, 316, 286, 13],
    [334, 250, 393, 250, 3],
    [154, 422, 408, 422, 8],
  ];
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const px = x / k,
        py = y / k;
      let ink = Math.abs(Math.hypot(px - 230, py - 164) - 37) < 8;
      for (const [ax, ay, bx, by, w] of segments) {
        const dx = bx - ax,
          dy = by - ay,
          t = Math.max(
            0,
            Math.min(
              1,
              ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy),
            ),
          );
        if (Math.hypot(px - ax - t * dx, py - ay - t * dy) < w / 2) ink = true;
      }
      const offset = y * (size * 4 + 1) + 1 + x * 4;
      pixels[offset] = ink ? 24 : 250;
      pixels[offset + 1] = ink ? 24 : 249;
      pixels[offset + 2] = ink ? 24 : 245;
      pixels[offset + 3] = 255;
    }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  writeFileSync(
    `web-shell/icons/${name}.png`,
    Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      chunk("IHDR", header),
      chunk("IDAT", deflateSync(pixels)),
      chunk("IEND", Buffer.alloc(0)),
    ]),
  );
}
console.log("Original programmatic black-and-white app icons generated.");

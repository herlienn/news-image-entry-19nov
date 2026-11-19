// THE WORLD'S NEWS IN ONE PICTURE — Thursday, 19 November 2026.
// Top-ranked model: region count bar, Day in Numbers, 3 illustrated hero
// panels, a story for every drawing, a world map, an "Also on" list, a
// UTC clock timeline, sources and a date check. 35 stories, 6 continents.
// Draws itself with a hand-made 5x7 bitmap font and a hand-made PNG
// encoder. Node stdlib only, no network. Writes /output/entry.png.
import * as fs from "node:fs";
import * as zlib from "node:zlib";

// ---------------- CRC32 ----------------
const CRC_TABLE: number[] = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c >>> 0;
}
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}
function encodePNG(w: number, h: number, rgba: Buffer): Buffer {
  const raw = Buffer.alloc(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 4)] = 0;
    rgba.copy(raw, y * (1 + w * 4) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------------- canvas ----------------
const W = 1024;
const H = 1024;
const PAPER: [number, number, number] = [247, 242, 231];
const INK: [number, number, number] = [26, 26, 26];
const RED: [number, number, number] = [185, 28, 28];
const NAVY: [number, number, number] = [30, 58, 95];
const BLUE: [number, number, number] = [37, 99, 235];
const GOLD: [number, number, number] = [212, 160, 23];
const TEAL: [number, number, number] = [15, 118, 110];
const GREY: [number, number, number] = [100, 100, 100];
const LIGHT: [number, number, number] = [232, 226, 210];
const WHITE: [number, number, number] = [255, 255, 255];

type RGB = [number, number, number];
const img = Buffer.alloc(W * H * 4);
function px(x: number, y: number, c: RGB): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 4;
  img[i] = c[0]; img[i + 1] = c[1]; img[i + 2] = c[2]; img[i + 3] = 255;
}
function rect(x: number, y: number, w: number, h: number, c: RGB): void {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) px(i, j, c);
}
function hline(x: number, y: number, w: number, c: RGB): void { rect(x, y, w, 1, c); }
function vline(x: number, y: number, h: number, c: RGB): void { rect(x, y, 1, h, c); }
function box(x: number, y: number, w: number, h: number, c: RGB): void {
  hline(x, y, w, c); hline(x, y + h - 1, w, c); vline(x, y, h, c); vline(x + w - 1, y, h, c);
}
function circle(cx: number, cy: number, r: number, c: RGB): void {
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
    if (x * x + y * y <= r * r) px(cx + x, cy + y, c);
  }
}
function ring(cx: number, cy: number, r: number, c: RGB): void {
  for (let a = 0; a < 360; a += 2) {
    const t = (a * Math.PI) / 180;
    px(Math.round(cx + r * Math.cos(t)), Math.round(cy + r * Math.sin(t)), c);
  }
}
function line(x0: number, y0: number, x1: number, y1: number, c: RGB): void {
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy, x = x0, y = y0;
  for (;;) {
    px(x, y, c);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x += sx; }
    if (e2 <= dx) { err += dx; y += sy; }
  }
}
function poly(points: [number, number][], c: RGB): void {
  let minY = 1e9, maxY = -1e9;
  for (const [, y] of points) { minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
  for (let y = Math.max(0, minY); y <= Math.min(H - 1, maxY); y++) {
    const xs: number[] = [];
    for (let i = 0; i < points.length; i++) {
      const [x0, y0] = points[i], [x1, y1] = points[(i + 1) % points.length];
      if ((y0 <= y && y1 > y) || (y1 <= y && y0 > y)) {
        xs.push(Math.round(x0 + ((y - y0) * (x1 - x0)) / (y1 - y0)));
      }
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      for (let x = xs[k]; x <= xs[k + 1]; x++) px(x, y, c);
    }
  }
}

// ---------------- 5x7 bitmap font (own design) ----------------
const FONT: Record<string, number[]> = {
  A: [0x0e, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11], B: [0x1e, 0x11, 0x11, 0x1e, 0x11, 0x11, 0x1e],
  C: [0x0e, 0x11, 0x10, 0x10, 0x10, 0x11, 0x0e], D: [0x1e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x1e],
  E: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x1f], F: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x10],
  G: [0x0e, 0x11, 0x10, 0x17, 0x11, 0x11, 0x0f], H: [0x11, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  I: [0x0e, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0e], J: [0x07, 0x02, 0x02, 0x02, 0x02, 0x12, 0x0c],
  K: [0x11, 0x12, 0x14, 0x18, 0x14, 0x12, 0x11], L: [0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x1f],
  M: [0x11, 0x1b, 0x15, 0x15, 0x11, 0x11, 0x11], N: [0x11, 0x19, 0x15, 0x13, 0x11, 0x11, 0x11],
  O: [0x0e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e], P: [0x1e, 0x11, 0x11, 0x1e, 0x10, 0x10, 0x10],
  Q: [0x0e, 0x11, 0x11, 0x11, 0x15, 0x12, 0x0d], R: [0x1e, 0x11, 0x11, 0x1e, 0x14, 0x12, 0x11],
  S: [0x0f, 0x10, 0x10, 0x0e, 0x01, 0x01, 0x1e], T: [0x1f, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
  U: [0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e], V: [0x11, 0x11, 0x11, 0x11, 0x11, 0x0a, 0x04],
  W: [0x11, 0x11, 0x11, 0x15, 0x15, 0x1b, 0x11], X: [0x11, 0x11, 0x0a, 0x04, 0x0a, 0x11, 0x11],
  Y: [0x11, 0x11, 0x0a, 0x04, 0x04, 0x04, 0x04], Z: [0x1f, 0x01, 0x02, 0x04, 0x08, 0x10, 0x1f],
  "0": [0x0e, 0x11, 0x13, 0x15, 0x19, 0x11, 0x0e], "1": [0x04, 0x0c, 0x04, 0x04, 0x04, 0x04, 0x0e],
  "2": [0x0e, 0x11, 0x01, 0x06, 0x08, 0x10, 0x1f], "3": [0x1f, 0x02, 0x04, 0x02, 0x01, 0x11, 0x0e],
  "4": [0x02, 0x06, 0x0a, 0x12, 0x1f, 0x02, 0x02], "5": [0x1f, 0x10, 0x1e, 0x01, 0x01, 0x11, 0x0e],
  "6": [0x06, 0x08, 0x10, 0x1e, 0x11, 0x11, 0x0e], "7": [0x1f, 0x01, 0x02, 0x04, 0x08, 0x08, 0x08],
  "8": [0x0e, 0x11, 0x11, 0x0e, 0x11, 0x11, 0x0e], "9": [0x0e, 0x11, 0x11, 0x0f, 0x01, 0x02, 0x0c],
  " ": [0, 0, 0, 0, 0, 0, 0], ".": [0, 0, 0, 0, 0, 0x0c, 0x0c],
  ",": [0, 0, 0, 0, 0x0c, 0x04, 0x08], ":": [0, 0x0c, 0x0c, 0, 0x0c, 0x0c, 0],
  ";": [0, 0x0c, 0x0c, 0, 0x0c, 0x04, 0x08], "'": [0x04, 0x04, 0x08, 0, 0, 0, 0],
  '"': [0x0a, 0x0a, 0, 0, 0, 0, 0], "-": [0, 0, 0, 0x1f, 0, 0, 0],
  "/": [0x01, 0x01, 0x02, 0x04, 0x08, 0x10, 0x10], "(": [0x02, 0x04, 0x08, 0x08, 0x08, 0x04, 0x02],
  ")": [0x08, 0x04, 0x02, 0x02, 0x02, 0x04, 0x08], "%": [0x19, 0x19, 0x02, 0x04, 0x08, 0x13, 0x13],
  "$": [0x04, 0x0f, 0x14, 0x0e, 0x05, 0x1e, 0x04], "&": [0x0c, 0x12, 0x14, 0x08, 0x15, 0x12, 0x0d],
  "+": [0, 0x04, 0x04, 0x1f, 0x04, 0x04, 0], "=": [0, 0, 0x1f, 0, 0x1f, 0, 0],
  "?": [0x0e, 0x11, 0x01, 0x02, 0x04, 0, 0x04], "!": [0x04, 0x04, 0x04, 0x04, 0x04, 0, 0x04],
  "#": [0x0a, 0x0a, 0x1f, 0x0a, 0x1f, 0x0a, 0x0a], "*": [0, 0x04, 0x15, 0x0e, 0x15, 0x04, 0],
  "~": [0, 0, 0x08, 0x15, 0x02, 0, 0], "_": [0, 0, 0, 0, 0, 0, 0x1f],
  "@": [0x0e, 0x11, 0x17, 0x15, 0x16, 0x10, 0x0e],
};
function charWidth(scale: number): number { return 6 * scale; }
function textWidth(s: string, scale: number): number {
  return s.length * charWidth(scale) - scale;
}
function drawText(x: number, y: number, s: string, scale: number, c: RGB): void {
  let cx = x;
  for (const ch of s.toUpperCase()) {
    const g = FONT[ch] ?? FONT["?"];
    for (let r = 0; r < 7; r++) {
      for (let col = 0; col < 5; col++) {
        if ((g[r] >> (4 - col)) & 1) rect(cx + col * scale, y + r * scale, scale, scale, c);
      }
    }
    cx += charWidth(scale);
  }
}
function centerText(cx: number, y: number, s: string, scale: number, c: RGB): void {
  drawText(cx - Math.floor(textWidth(s, scale) / 2), y, s, scale, c);
}
function wrap(s: string, maxChars: number): string[] {
  const words = s.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + (cur ? " " : "") + w).length <= maxChars) cur += (cur ? " " : "") + w;
    else { if (cur) lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}
function drawWrapped(x: number, y: number, s: string, scale: number, maxChars: number, c: RGB, maxLines = 99): number {
  const lines = wrap(s, maxChars).slice(0, maxLines);
  lines.forEach((ln, i) => drawText(x, y + i * 8 * scale, ln, scale, c));
  return lines.length;
}

// ---------------- hero scenes ----------------
function drawShenzhen(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, [16, 24, 64]);
  circle(x + w - 52, y + 22, 13, [255, 214, 90]);
  circle(x + w - 52, y + 22, 9, [255, 226, 130]);
  const base = y + h - 8;
  const towers: [number, number, number][] = [[8, 62, 52], [34, 44, 78], [66, 58, 60], [98, 36, 88], [132, 52, 66], [164, 40, 80], [196, 58, 56], [224, 46, 74], [252, 60, 48], [282, 50, 62]];
  for (const [tx, tw, th] of towers) {
    rect(x + tx, base - th, tw, th, [38, 52, 92]);
    for (let wy = base - th + 6; wy < base - 6; wy += 10) {
      for (let wx = x + tx + 4; wx < x + tx + tw - 4; wx += 9) {
        if ((wx * 7 + wy * 3) % 11 < 6) rect(wx, wy, 3, 4, [255, 205, 80]);
      }
    }
  }
  rect(x, base, w, 8, [10, 16, 40]);
  // three small flags on poles
  const flagCols: RGB[] = [[205, 32, 39], [222, 41, 16], [255, 255, 255]];
  for (let i = 0; i < 3; i++) {
    const fx = x + 14 + i * 26;
    vline(fx, y + h - 34, 26, [220, 220, 220]);
    rect(fx + 1, y + h - 34, 20, 11, flagCols[i]);
  }
}
function drawViceCity(x: number, y: number, w: number, h: number): void {
  const bands: RGB[] = [[124, 58, 150], [190, 60, 130], [235, 110, 90], [245, 160, 90], [250, 205, 120]];
  const bh = Math.ceil(h / bands.length);
  bands.forEach((c, i) => rect(x, y + i * bh, w, bh, c));
  circle(x + w / 2, y + h - 34, 26, [255, 235, 170]);
  circle(x + w / 2, y + h - 34, 20, [255, 245, 205]);
  // skyline silhouette
  rect(x, y + h - 30, w, 30, [40, 16, 60]);
  rect(x + 20, y + h - 52, 26, 22, [40, 16, 60]);
  rect(x + 90, y + h - 62, 30, 32, [40, 16, 60]);
  rect(x + 200, y + h - 48, 24, 18, [40, 16, 60]);
  rect(x + 250, y + h - 58, 28, 28, [40, 16, 60]);
  // palm trees
  for (const px0 of [x + 8, x + w - 30]) {
    line(px0, y + h - 8, px0 + 8, y + h - 44, [30, 60, 30]);
    line(px0 + 8, y + h - 44, px0 - 8, y + h - 52, [30, 90, 40]);
    line(px0 + 8, y + h - 44, px0 + 24, y + h - 52, [30, 90, 40]);
    line(px0 + 8, y + h - 44, px0 + 2, y + h - 58, [30, 90, 40]);
    line(px0 + 8, y + h - 44, px0 + 14, y + h - 58, [30, 90, 40]);
  }
  rect(x, y + h - 6, w, 6, [30, 20, 50]);
}
function drawCourthouse(x: number, y: number, w: number, h: number): void {
  rect(x, y, w, h, [214, 228, 240]);
  circle(x + 44, y + 24, 14, [255, 214, 120]);
  // main hall
  rect(x + 70, y + 34, w - 140, h - 52, [238, 232, 218]);
  // pediment
  poly([[x + 70, y + 34], [x + w - 70, y + 34], [x + w / 2, y + 12]], [196, 52, 52]);
  circle(x + w / 2, y + 26, 5, GOLD);
  // columns
  for (let i = 0; i < 5; i++) {
    const cx = x + 86 + i * ((w - 172) / 4);
    rect(cx, y + 40, 12, h - 74, [255, 255, 255]);
    rect(cx - 2, y + 36, 16, 5, [220, 214, 198]);
    rect(cx - 2, y + h - 38, 16, 5, [220, 214, 198]);
  }
  // door
  rect(x + w / 2 - 14, y + h - 40, 28, 22, [60, 60, 70]);
  // steps
  rect(x + 56, y + h - 18, w - 112, 4, [200, 196, 184]);
  rect(x + 48, y + h - 12, w - 96, 4, [186, 182, 170]);
  rect(x + 40, y + h - 6, w - 80, 6, [172, 168, 156]);
  // flag pole + flag
  vline(x + w - 26, y + 14, 44, [90, 90, 90]);
  rect(x + w - 25, y + 16, 18, 11, [37, 99, 235]);
  // trees
  circle(x + 26, y + h - 34, 12, [46, 125, 50]);
  circle(x + w - 52, y + h - 30, 10, [46, 125, 50]);
}

// ---------------- small story drawings (56x56 box) ----------------
function drawChart(x: number, y: number, c1: RGB, c2: RGB): void {
  rect(x, y, 56, 56, [238, 240, 246]);
  const bars = [14, 22, 18, 30, 26, 40];
  bars.forEach((bh, i) => rect(x + 5 + i * 8, y + 50 - bh, 5, bh, i % 2 ? c1 : c2));
  line(x + 4, y + 12, x + 52, y + 46, RED);
  line(x + 48, y + 42, x + 52, y + 46, RED); line(x + 48, y + 50, x + 52, y + 46, RED);
}
function drawRocket(x: number, y: number): void {
  rect(x, y, 56, 56, [16, 24, 64]);
  circle(x + 28, y + 14, 3, WHITE);
  circle(x + 14, y + 30, 2, WHITE);
  circle(x + 44, y + 38, 2, WHITE);
  // dish
  poly([[x + 14, y + 22], [x + 42, y + 22], [x + 28, y + 38]], GOLD);
  rect(x + 26, y + 38, 4, 8, [200, 200, 200]);
  ring(x + 28, y + 12, 8, [140, 200, 255]);
  ring(x + 28, y + 12, 13, [140, 200, 255]);
}
function drawCyclone(x: number, y: number): void {
  rect(x, y, 56, 56, [220, 235, 245]);
  for (let r = 4; r <= 24; r += 5) ring(x + 28, y + 28, r, r % 10 === 4 ? BLUE : TEAL);
  circle(x + 28, y + 28, 5, [255, 255, 255]);
  circle(x + 28, y + 28, 2, RED);
  line(x + 6, y + 50, x + 50, y + 50, BLUE);
}
function drawGate(x: number, y: number): void {
  rect(x, y, 56, 56, [214, 228, 240]);
  rect(x + 6, y + 14, 44, 8, [120, 110, 90]);
  for (const cx of [10, 24, 38]) rect(x + cx, y + 22, 6, 26, [90, 84, 70]);
  rect(x + 4, y + 48, 48, 4, [90, 84, 70]);
  circle(x + 28, y + 10, 4, GOLD);
}
function drawBridge(x: number, y: number): void {
  rect(x, y, 56, 56, [200, 225, 240]);
  line(x + 4, y + 30, x + 28, y + 14, [90, 90, 90]);
  line(x + 52, y + 30, x + 28, y + 14, [90, 90, 90]);
  vline(x + 28, y + 14, 16, [90, 90, 90]);
  rect(x + 4, y + 30, 48, 4, [70, 70, 70]);
  for (let i = 0; i < 5; i++) line(x + 8 + i * 9, y + 38, x + 12 + i * 9, y + 44, BLUE);
  line(x + 4, y + 46, x + 52, y + 46, BLUE);
}
function drawTwoFlags(x: number, y: number): void {
  rect(x, y, 56, 56, PAPER);
  vline(x + 12, y + 8, 40, [90, 90, 90]);
  vline(x + 38, y + 8, 40, [90, 90, 90]);
  rect(x + 13, y + 10, 20, 6, WHITE); rect(x + 13, y + 16, 20, 6, BLUE); rect(x + 13, y + 22, 20, 6, RED);
  rect(x + 39, y + 10, 14, 18, BLUE); rect(x + 45, y + 10, 6, 18, WHITE); rect(x + 39, y + 10, 2, 18, BLUE);
  rect(x + 39, y + 10, 14, 6, BLUE);
}
function drawCitySmoke(x: number, y: number): void {
  rect(x, y, 56, 56, [232, 226, 210]);
  rect(x + 6, y + 30, 12, 20, [120, 110, 95]);
  rect(x + 22, y + 22, 12, 28, [140, 130, 115]);
  rect(x + 38, y + 34, 12, 16, [110, 100, 88]);
  circle(x + 28, y + 14, 7, [150, 150, 150]);
  circle(x + 36, y + 9, 5, [170, 170, 170]);
  rect(x, y + 50, 56, 6, [100, 90, 78]);
}
function drawDesert(x: number, y: number): void {
  rect(x, y, 56, 56, [250, 230, 180]);
  circle(x + 42, y + 14, 9, [255, 200, 60]);
  poly([[x, y + 56], [x + 20, y + 30], [x + 40, y + 56]], [220, 180, 110]);
  poly([[x + 24, y + 56], [x + 44, y + 34], [x + 56, y + 56]], [205, 165, 95]);
  rect(x, y + 50, 56, 6, [190, 150, 80]);
}
function drawDome(x: number, y: number): void {
  rect(x, y, 56, 56, [214, 228, 240]);
  rect(x + 10, y + 34, 36, 16, [240, 236, 224]);
  circle(x + 28, y + 34, 13, [240, 236, 224]);
  rect(x + 27, y + 14, 2, 8, [90, 90, 90]);
  circle(x + 28, y + 13, 3, GOLD);
  for (let i = 0; i < 4; i++) vline(x + 14 + i * 8, y + 38, 10, [180, 174, 160]);
  rect(x + 6, y + 50, 44, 4, [180, 174, 160]);
}
function drawLectern(x: number, y: number): void {
  rect(x, y, 56, 56, [238, 236, 228]);
  rect(x + 18, y + 22, 20, 26, [90, 60, 40]);
  poly([[x + 14, y + 22], [x + 42, y + 22], [x + 28, y + 12]], [110, 75, 50]);
  line(x + 28, y + 12, x + 34, y + 6, [60, 60, 60]);
  circle(x + 34, y + 5, 2, [60, 60, 60]);
  rect(x + 24, y + 48, 8, 4, [60, 60, 60]);
}
function drawCanadaFlag(x: number, y: number): void {
  rect(x, y, 56, 56, PAPER);
  rect(x + 6, y + 16, 44, 24, WHITE);
  rect(x + 6, y + 16, 11, 24, RED);
  rect(x + 39, y + 16, 11, 24, RED);
  poly([[x + 28, y + 19], [x + 24, y + 26], [x + 20, y + 26], [x + 24, y + 30], [x + 22, y + 34], [x + 26, y + 33], [x + 28, y + 38], [x + 30, y + 33], [x + 34, y + 34], [x + 32, y + 30], [x + 36, y + 26], [x + 32, y + 26]], RED);
}
function drawChip(x: number, y: number): void {
  rect(x, y, 56, 56, [238, 240, 246]);
  rect(x + 16, y + 16, 24, 24, [30, 58, 95]);
  rect(x + 22, y + 22, 12, 12, [120, 200, 120]);
  for (let i = 0; i < 4; i++) {
    hline(x + 18 + i * 6, y + 12, 2, GOLD); hline(x + 18 + i * 6, y + 44, 2, GOLD);
    vline(x + 12, y + 18 + i * 6, 2, GOLD); vline(x + 44, y + 18 + i * 6, 2, GOLD);
  }
}

// ---------------- world map ----------------
const CONTINENTS: [number, number][][] = [
  [[-168, 66], [-150, 70], [-130, 71], [-110, 73], [-90, 74], [-75, 72], [-60, 60], [-55, 47], [-70, 42], [-75, 35], [-80, 26], [-85, 20], [-90, 15], [-95, 16], [-100, 20], [-105, 23], [-110, 28], [-115, 32], [-125, 40], [-125, 49], [-135, 58], [-150, 60], [-165, 60]],
  [[-80, 10], [-70, 12], [-60, 8], [-50, 0], [-40, -5], [-35, -10], [-40, -20], [-48, -28], [-55, -35], [-65, -40], [-70, -50], [-73, -37], [-72, -20], [-77, -12], [-80, -3], [-80, 5]],
  [[-10, 36], [-9, 43], [-2, 48], [0, 51], [5, 53], [8, 57], [10, 59], [18, 56], [21, 55], [24, 58], [28, 60], [30, 62], [25, 65], [20, 70], [15, 70], [10, 64], [5, 60], [-5, 58], [-8, 52], [-10, 44]],
  [[-17, 15], [-10, 30], [0, 36], [10, 37], [20, 32], [32, 31], [35, 28], [40, 15], [43, 11], [48, 10], [51, 12], [44, 0], [40, -10], [35, -18], [32, -26], [28, -33], [20, -35], [16, -28], [12, -18], [9, -1], [9, 4], [-8, 5], [-13, 8], [-17, 12]],
  [[30, 62], [40, 68], [60, 70], [80, 73], [100, 77], [120, 73], [140, 72], [160, 70], [178, 66], [170, 60], [160, 55], [150, 59], [142, 50], [140, 40], [135, 35], [130, 33], [127, 40], [120, 30], [115, 22], [108, 18], [105, 10], [100, 8], [98, 12], [95, 16], [92, 21], [88, 22], [85, 19], [80, 15], [77, 8], [75, 20], [70, 25], [66, 25], [60, 25], [56, 27], [52, 28], [50, 30], [48, 30], [44, 29], [40, 32], [36, 36], [33, 36], [30, 36], [28, 41], [30, 45], [28, 50], [30, 55]],
  [[114, -22], [114, -30], [115, -35], [120, -34], [125, -32], [130, -32], [135, -35], [140, -38], [145, -38], [150, -37], [153, -27], [150, -22], [146, -19], [142, -15], [142, -11], [137, -12], [135, -15], [132, -12], [130, -13], [126, -14], [122, -17], [118, -20]],
];
function lonLatToXY(lon: number, lat: number, mx: number, my: number, mw: number, mh: number): [number, number] {
  return [Math.round(mx + ((lon + 180) / 360) * mw), Math.round(my + ((82 - lat) / 164) * mh)];
}
function drawMap(x: number, y: number, w: number, h: number, pins: [number, number, string, number, number][]): void {
  rect(x, y, w, h, [222, 235, 240]);
  for (const cont of CONTINENTS) {
    const pts = cont.map(([lo, la]) => lonLatToXY(lo, la, x, y, w, h));
    poly(pts, [196, 204, 170]);
    for (let i = 0; i < pts.length; i++) {
      line(pts[i][0], pts[i][1], pts[(i + 1) % pts.length][0], pts[(i + 1) % pts.length][1], [140, 150, 120]);
    }
  }
  for (const [lo, la, label, dx, dy] of pins) {
    const [px0, py0] = lonLatToXY(lo, la, x, y, w, h);
    circle(px0, py0, 6, RED);
    circle(px0, py0, 3, WHITE);
    drawText(px0 + dx, py0 + dy, label, 1, RED);
  }
}

// ---------------- stories ----------------
type Hero = { label: string; place: string; head: string; body: string; scene: "shenzhen" | "vice" | "hague" };
const HEROES: Hero[] = [
  { label: "1 ASIA - DIPLOMACY", place: "SHENZHEN", head: "TRUMP, XI AND PUTIN MEET IN SHENZHEN",
    body: "The first three-way meeting of the nuclear powers, on the APEC sidelines. Officials expect no deal.",
    scene: "shenzhen" },
  { label: "2 WORLD - GAMES", place: "VICE CITY", head: "GTA VI GOES ON SALE AROUND THE WORLD",
    body: "Rockstar's game unlocks at midnight in each region. Metacritic 99.",
    scene: "vice" },
  { label: "3 ASIA - JUSTICE", place: "THE HAGUE", head: "WORLD COURT RULES ON MYANMAR GENOCIDE CASE",
    body: "The ICJ reads its judgment in The Gambia v. Myanmar at 1000 in The Hague.",
    scene: "hague" },
];
type Featured = { n: number; tag: string; head: string; body: string; draw: (x: number, y: number) => void };
const FEATURED: Featured[] = [
  { n: 4, tag: "AMERICAS - TECH", head: "ANTHROPIC DEBUTS ON NASDAQ",
    body: "AI lab prices its IPO at $83 and starts trading today as ANT, the biggest ever.",
    draw: (x, y) => drawChart(x, y, BLUE, TEAL) },
  { n: 5, tag: "WORLD - SPACE", head: "VOYAGER 1 REACHES ONE LIGHT-DAY",
    body: "After almost 50 years in space, NASA confirms the milestone today.",
    draw: drawRocket },
  { n: 6, tag: "ASIA - WEATHER", head: "CYCLONE AKVAN BEARS DOWN ON INDIA",
    body: "Seven districts on red alert; landfall due Friday, gusts to 145 km/h.",
    draw: drawCyclone },
  { n: 7, tag: "EUROPE - DIPLOMACY", head: "COALITION MEETS ON UKRAINE AID",
    body: "Leaders gather in Berlin as the EU's 45B-euro loan plan is debated.",
    draw: drawGate },
  { n: 8, tag: "EUROPE - WAR", head: "CRIMEA BRIDGE HIT AGAIN",
    body: "Traffic halts after a fresh attack on the bridge linking Crimea to Russia.",
    draw: drawBridge },
  { n: 9, tag: "EUROPE - WAR", head: "RUSSIA ACCUSES FRANCE",
    body: "Moscow says Paris sent troops to Ukraine and warns it joins the war directly.",
    draw: drawTwoFlags },
  { n: 10, tag: "MIDDLE EAST - WAR", head: "ISRAEL MOVES INTO CENTRAL GAZA",
    body: "Troops launch a ground operation as displaced families flee their shelters.",
    draw: drawCitySmoke },
  { n: 11, tag: "MIDDLE EAST - DIPLOMACY", head: "SAUDI ALERTS LIFTED",
    body: "Riyadh says the danger has passed in three southern cities after alerts.",
    draw: drawDesert },
  { n: 12, tag: "AMERICAS - POLITICS", head: "DEMOCRATS TAKE US SENATE 56-44",
    body: "Peltola wins in Alaska in the biggest Democratic Senate gain in 70 years.",
    draw: drawDome },
  { n: 13, tag: "AMERICAS - POLITICS", head: "JEFFRIES SET FOR SPEAKER",
    body: "Democrats nominate Hakeem Jeffries, set to be the first Black House speaker.",
    draw: drawLectern },
  { n: 14, tag: "AMERICAS - DIPLOMACY", head: "CANADA RECALIBRATES CHINA TIES",
    body: "PM Carney adjusts Canada's China ties, seeking the right deal with the US.",
    draw: drawCanadaFlag },
  { n: 15, tag: "AMERICAS - TECH", head: "NVIDIA EXPORT CURBS TAKE EFFECT",
    body: "New US chip export rules take effect today; Nvidia's $115.8B quarter beats forecasts.",
    draw: drawChip },
];
type AlsoOn = { n: number; head: string; body: string };
const ALSO: AlsoOn[] = [
  { n: 16, head: "MELENCHON COULD WIN IN FRANCE", body: "Justice minister: the hard-left leader could win." },
  { n: 17, head: "DEUTSCHE BANK'S EPSTEIN FILES", body: "Bank handled $582M in Epstein-linked deals, 2013-18." },
  { n: 18, head: "UKRAINE'S DRONES FLY 500 KM/H", body: "Kyiv's interceptor drones now reach 500 km/h." },
  { n: 19, head: "DRUG HAUL IN EASTERN LIBYA", body: "Cocaine and millions of pills seized, officials say." },
  { n: 20, head: "SOMALIA ACCUSES UAE", body: "Mogadishu: Emirates built bases without approval." },
  { n: 21, head: "1 IN 4 CHILDREN IN WAR ZONES", body: "589 million children now live in conflict zones." },
  { n: 22, head: "SOUTH AFRICA ON TOP IN TEST", body: "Rabada and Rickelton steer South Africa to a big lead." },
  { n: 23, head: "LIU MAKES HOUSE HISTORY", body: "First Taiwanese American to chair the House caucus." },
  { n: 24, head: "SENATORS WARN ON AI CYBER THREAT", body: "US senators: AI cyber threats outpace defences." },
  { n: 25, head: "US PRESSES CHINA OVER SHIPS", body: "Panel urges sanctions over China's detention of ships." },
  { n: 26, head: "MICROSOFT PRESSED ON BYTEDANCE", body: "House seeks briefing on AI talks with ByteDance." },
  { n: 27, head: "US OUTAGES SPARK STOCKPILING", body: "Flights, banks and networks hit as Americans stock up." },
  { n: 28, head: "NVIDIA CHIEF PROMISES PAY RISES", body: "Kress: raises in December, plus fresh stock grants." },
  { n: 29, head: "NVIDIA HALTS CHINA CHIP SALES", body: "Chipmaker stops shipping H-series AI chips to China." },
  { n: 30, head: "OIL PRICES FALL", body: "WTI slides 3.2 percent to $83.26 as rate fears weigh." },
  { n: 31, head: "PROFIT GROWTH TO SLOW", body: "Profit growth seen halving next year to 16 percent." },
  { n: 32, head: "WALMART REPORTS AS JOBLESS CLAIMS LAND", body: "Walmart reports Q3 as jobless claims land." },
  { n: 33, head: "ENGLAND BEAT AUSTRALIA IN ODI", body: "Duckett's 133 powers England to a 97-run ODI win." },
  { n: 34, head: "AMAZON BETS $7B ON INDIA", body: "Tech giant plans $7B in renewable energy by 2030." },
  { n: 35, head: "MYANMAR AIRSTRIKE KILLS 12", body: "Witnesses say an airstrike hit a Rakhine IDP camp." },
];
const CLOCK: string[] = [
  "11:00 (18 NOV) GTA VI UNLOCKS IN NEW ZEALAND",
  "00:00 GTA VI UNLOCKS IN THE UK",
  "05:00 GTA VI UNLOCKS ON THE US EAST COAST",
  "09:00 ICJ READING BEGINS, THE HAGUE",
  "12:00 WALMART REPORTS Q3 RESULTS",
  "14:30 ANTHROPIC STARTS TRADING ON NASDAQ",
];
const PINS: [number, number, string, number, number][] = [
  [114.1, 22.5, "1", 7, -3], [4.3, 52.1, "3", -16, -3], [34.5, 31.5, "10", 7, -3], [46.7, 24.7, "11", 7, -3],
  [-149.9, 61.2, "12", 7, -3], [-75.7, 45.4, "14", 7, -3], [-74.0, 40.7, "4", 7, 6],
  [83.3, 17.7, "6", 7, -3], [96.1, 19.7, "3", 7, -3], [4.4, 50.8, "7", 7, 8], [147.3, -42.9, "33", 7, -3],
];
const REGIONS: [string, number, RGB][] = [
  ["EUROPE 6", 6, BLUE], ["MIDDLE EAST 2", 2, TEAL], ["ASIA 5", 5, RED],
  ["AFRICA 3", 3, GOLD], ["AMERICAS 13", 13, NAVY], ["OCEANIA 1", 1, [46, 125, 50]],
  ["WORLD 5", 5, GREY],
];

// ---------------- layout ----------------
function main(): void {
  rect(0, 0, W, H, PAPER);
  // top line
  drawText(8, 6, "THE WORLD'S NEWS IN ONE PICTURE", 1, RED);
  const rightTop = "35 STORIES - 6 CONTINENTS - ONE DAY";
  drawText(W - 8 - textWidth(rightTop, 1), 6, rightTop, 1, INK);
  hline(8, 20, W - 16, RED);
  rect(8, 21, W - 16, 1, GOLD);
  // masthead
  centerText(W / 2, 28, "THURSDAY 19 NOVEMBER 2026", 4, INK);
  centerText(W / 2, 62, "EVERY STORY HERE HAPPENED, OR WAS FIRST REPORTED, ON THURSDAY 19 NOVEMBER 2026 (UTC).", 1, NAVY);
  hline(8, 74, W - 16, INK);
  // region bar (equal segments)
  const segW = Math.floor((W - 16) / REGIONS.length);
  REGIONS.forEach(([label, , col], i) => {
    const sx = 8 + i * segW;
    rect(sx, 78, segW - 2, 16, col);
    drawText(sx + Math.floor((segW - 2 - textWidth(label, 1)) / 2), 81, label, 1, WHITE);
  });
  // day in numbers
  const nums = "THE DAY IN NUMBERS: 3 LEADERS, 1 HOUR - 99 METACRITIC - $1.54B PRE-ORDERS - 145 KM/H AKVAN GUSTS - 7 DISTRICTS RED-ALERT - $83 ANTHROPIC PRICE";
  drawText(8, 100, nums, 1, INK);
  hline(8, 112, W - 16, INK);
  // hero panels
  const heroW = 328, heroX = [8, 348, 688];
  HEROES.forEach((hero, i) => {
    const x = heroX[i];
    box(x, 118, heroW, 154, INK);
    if (hero.scene === "shenzhen") drawShenzhen(x + 1, 119, heroW - 2, 82);
    else if (hero.scene === "vice") drawViceCity(x + 1, 119, heroW - 2, 82);
    else drawCourthouse(x + 1, 119, heroW - 2, 82);
    drawText(x + 6, 206, hero.label + " - " + hero.place, 1, RED);
    drawWrapped(x + 6, 218, hero.head, 2, 27, INK, 2);
    drawWrapped(x + 6, 252, hero.body, 1, 53, INK, 2);
  });
  hline(8, 280, W - 16, INK);
  // featured stories: 3 columns x 4 rows
  const colX = [8, 348, 688];
  FEATURED.forEach((s, idx) => {
    const col = idx % 3, row = Math.floor(idx / 3);
    const x = colX[col], y = 288 + row * 78;
    s.draw(x, y + 4);
    const tx = x + 62;
    drawText(tx, y, s.n + " " + s.tag, 1, RED);
    drawWrapped(tx, y + 11, s.head, 2, 22, INK, 2);
    drawWrapped(tx, y + 45, s.body, 1, 43, INK, 2);
  });
  hline(8, 600, W - 16, INK);
  // map + also on
  drawText(8, 608, "WHERE IT HAPPENED", 1, RED);
  drawMap(8, 622, 322, 154, PINS);
  drawWrapped(8, 782, "Numbered pins mark the stories above.", 1, 52, GREY, 1);
  drawText(340, 608, "ALSO ON THURSDAY 19 NOVEMBER", 1, RED);
  const alsoCols = [340, 684];
  ALSO.forEach((s, idx) => {
    const col = idx < 10 ? 0 : 1;
    const row = idx % 10;
    const x = alsoCols[col], y = 622 + row * 18;
    drawText(x, y, s.n + " " + s.head, 1, INK);
    drawText(x + 12, y + 9, s.body, 1, GREY);
  });
  hline(8, 806, W - 16, INK);
  // by the clock
  drawText(8, 814, "BY THE CLOCK - UTC", 1, RED);
  CLOCK.forEach((c, i) => {
    const col = i % 3, row = Math.floor(i / 3);
    drawText(8 + col * 340, 830 + row * 16, c, 1, INK);
  });
  hline(8, 866, W - 16, INK);
  // footer
  drawWrapped(8, 874, "SOURCES: REUTERS, AP, AFP, BBC, AL JAZEERA, BLOOMBERG. ORIGINAL DRAWINGS.", 1, 168, INK, 1);
  drawWrapped(8, 888, "DATE CHECK: THE US-IRAN STRIKES ON QESHM ISLAND AND IN THE GULF WERE FIRST REPORTED ON 18 NOV, NOT TODAY, SO THEY ARE NOT IN THIS PICTURE - EVEN THOUGH THEY LED YESTERDAY'S NEWS.", 1, 168, INK, 2);
  centerText(W / 2, 924, "THE WORLD IN ONE PICTURE - THURSDAY, 19 NOVEMBER 2026", 1, GREY);
  const out = process.argv[2] || "/output/entry.png";
  fs.writeFileSync(out, encodePNG(W, H, img));
}

main();

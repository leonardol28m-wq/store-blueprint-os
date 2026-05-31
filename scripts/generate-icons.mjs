/**
 * Store Blueprint OS — Icon Generator
 * Creates PNG icons using pure Node.js (no external dependencies)
 */
import { deflateSync } from 'zlib';
import { writeFileSync, mkdirSync } from 'fs';

mkdirSync('public/icons', { recursive: true });

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (const b of buf) crc = crcTable[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const lenBuf = Buffer.allocUnsafe(4);
  lenBuf.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.allocUnsafe(4);
  crcBuf.writeUInt32BE(crc32(body));
  return Buffer.concat([lenBuf, body, crcBuf]);
}

function lerp(a, b, t) { return Math.round(a + (b - a) * t); }

function createIconPixels(size) {
  const pixels = [];
  const startR = 0x63, startG = 0x66, startB = 0xf1;
  const endR = 0x8b, endG = 0x5c, endB = 0xf6;
  const outerR = size * 0.22;
  const gridPad = Math.round(size * 0.22);
  const gridGap = Math.round(size * 0.06);
  const cellSize = Math.floor((size - gridPad * 2 - gridGap) / 2);
  const cellR = Math.max(1, Math.round(cellSize * 0.25));

  function inRoundedRect(x, y, rx, ry, w, h, r) {
    if (x < rx || x > rx + w || y < ry || y > ry + h) return false;
    const corners = [[rx+r,ry+r],[rx+w-r,ry+r],[rx+r,ry+h-r],[rx+w-r,ry+h-r]];
    for (const [cx, cy] of corners) {
      if (Math.abs(x-cx) <= r && Math.abs(y-cy) <= r) {
        if ((x-cx)**2+(y-cy)**2 > r*r) return false;
      }
    }
    return true;
  }

  const cells = [
    { x: gridPad, y: gridPad, op: 0.95 },
    { x: gridPad+cellSize+gridGap, y: gridPad, op: 0.65 },
    { x: gridPad, y: gridPad+cellSize+gridGap, op: 0.65 },
    { x: gridPad+cellSize+gridGap, y: gridPad+cellSize+gridGap, op: 0.95 },
  ];

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const t = (px+py)/(2*(size-1));
      let r = lerp(startR,endR,t), g = lerp(startG,endG,t), b = lerp(startB,endB,t), a = 255;
      const inCorner = (
        (px<outerR&&py<outerR&&(px-outerR)**2+(py-outerR)**2>outerR**2)||
        (px>=size-outerR&&py<outerR&&(px-(size-outerR))**2+(py-outerR)**2>outerR**2)||
        (px<outerR&&py>=size-outerR&&(px-outerR)**2+(py-(size-outerR))**2>outerR**2)||
        (px>=size-outerR&&py>=size-outerR&&(px-(size-outerR))**2+(py-(size-outerR))**2>outerR**2)
      );
      if (inCorner) { pixels.push(0,0,0,0); continue; }
      for (const cell of cells) {
        if (inRoundedRect(px,py,cell.x,cell.y,cellSize,cellSize,cellR)) {
          r=lerp(r,255,cell.op); g=lerp(g,255,cell.op); b=lerp(b,255,cell.op); break;
        }
      }
      pixels.push(r,g,b,a);
    }
  }
  return pixels;
}

function createPNG(size) {
  const pixels = createIconPixels(size);
  const sig = Buffer.from([137,80,78,71,13,10,26,10]);
  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(size,0); ihdr.writeUInt32BE(size,4);
  ihdr[8]=8; ihdr[9]=6; ihdr[10]=0; ihdr[11]=0; ihdr[12]=0;
  const raw = Buffer.allocUnsafe(size*(1+size*4));
  for (let y=0;y<size;y++) {
    raw[y*(1+size*4)]=0;
    for (let x=0;x<size;x++) {
      const pi=(y*size+x)*4, ri=y*(1+size*4)+1+x*4;
      raw[ri]=pixels[pi]; raw[ri+1]=pixels[pi+1]; raw[ri+2]=pixels[pi+2]; raw[ri+3]=pixels[pi+3];
    }
  }
  return Buffer.concat([sig,pngChunk('IHDR',ihdr),pngChunk('IDAT',deflateSync(raw,{level:6})),pngChunk('IEND',Buffer.alloc(0))]);
}

for (const size of [16,48,128]) {
  writeFileSync(`public/icons/icon${size}.png`, createPNG(size));
  console.log(`✅ Generated public/icons/icon${size}.png`);
}
console.log('🎨 Icons ready!');

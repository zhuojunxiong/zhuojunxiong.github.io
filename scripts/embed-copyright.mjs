import { readFile, writeFile } from "node:fs/promises";
import { readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

function encodeBigEndian(value, bytes) {
  const buffer = Buffer.alloc(bytes);
  for (let i = 0; i < bytes; i++) {
    buffer[bytes - 1 - i] = (value >> (i * 8)) & 0xff;
  }
  return buffer;
}

function buildExifBlock(copyright, artist) {
  const copyrightBytes = Buffer.from(copyright + "\0", "ascii");
  const artistBytes = Buffer.from(artist + "\0", "ascii");

  // TIFF header: "MM" (big-endian) + magic 0x002A + offset to IFD0
  const tiffHeader = Buffer.alloc(8);
  tiffHeader.write("MM", 0, "ascii");
  tiffHeader.writeUInt16BE(0x002a, 2);
  tiffHeader.writeUInt32BE(0x00000008, 4); // IFD0 right after TIFF header

  // IFD0: 2 entries
  // Entry: tag(2) + type(2) + count(4) + value/offset(4) = 12 bytes
  const entryCount = 2;
  const ifdSize = 2 + entryCount * 12 + 4; // count + entries + next IFD offset
  const ifd = Buffer.alloc(ifdSize);
  let offset = 0;

  // Number of directory entries
  ifd.writeUInt16BE(entryCount, offset);
  offset += 2;

  // String data starts right after IFD (relative to TIFF header start = byte 8 of APP1 payload)
  const app1PayloadOffset = 8; // TIFF header is at byte 8 of APP1 payload
  let stringDataOffset = app1PayloadOffset + ifdSize;

  // Entry 1: Artist (0x013B), type ASCII (2), count = artistBytes.length
  ifd.writeUInt16BE(0x013b, offset); // tag
  offset += 2;
  ifd.writeUInt16BE(2, offset); // type = ASCII
  offset += 2;
  ifd.writeUInt32BE(artistBytes.length, offset); // count
  offset += 4;
  ifd.writeUInt32BE(stringDataOffset, offset); // offset to data
  offset += 4;

  stringDataOffset += artistBytes.length;

  // Entry 2: Copyright (0x8298), type ASCII (2), count = copyrightBytes.length
  ifd.writeUInt16BE(0x8298, offset); // tag
  offset += 2;
  ifd.writeUInt16BE(2, offset); // type = ASCII
  offset += 2;
  ifd.writeUInt32BE(copyrightBytes.length, offset); // count
  offset += 4;
  ifd.writeUInt32BE(stringDataOffset, offset); // offset to data
  offset += 4;

  // Next IFD offset (0 = no more IFDs)
  ifd.writeUInt32BE(0, offset);

  // Assemble the full APP1 payload
  const exifHeader = Buffer.from("Exif\0\0", "ascii");
  const fullPayload = Buffer.concat([exifHeader, tiffHeader, ifd, artistBytes, copyrightBytes]);

  // APP1 marker
  const app1Marker = Buffer.from([0xff, 0xe1]);
  const length = Buffer.alloc(2);
  length.writeUInt16BE(2 + fullPayload.length, 0); // 2 bytes for length field itself

  return Buffer.concat([app1Marker, length, fullPayload]);
}

function findSoiApp1(buffer) {
  // JPEG starts with SOI (0xFFD8), then optional APP markers
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return -1;
  let pos = 2;
  while (pos + 4 <= buffer.length) {
    if (buffer[pos] === 0xff && buffer[pos + 1] === 0xe1) {
      return pos; // Found existing APP1
    }
    if (buffer[pos] !== 0xff) break;
    const marker = buffer[pos + 1];
    // Markers 0xD8, 0xD9, 0xDA, 0xD0-0xD7 have no length
    if (marker === 0xd9 || marker === 0xda || (marker >= 0xd0 && marker <= 0xd7)) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {
      pos += 2;
      continue;
    }
    if (pos + 4 > buffer.length) break;
    const segLen = buffer.readUInt16BE(pos + 2);
    pos += 2 + segLen;
  }
  return -1;
}

async function embedCopyright(filePath, copyright, artist) {
  const buffer = await readFile(filePath);

  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    console.log(`  跳过（非 JPEG）：${path.basename(filePath)}`);
    return false;
  }

  const existingApp1 = findSoiApp1(buffer);
  const exifBlock = buildExifBlock(copyright, artist);

  let result;
  if (existingApp1 >= 0) {
    // Replace existing APP1 with our minimal one
    const oldSegLen = buffer.readUInt16BE(existingApp1 + 2);
    result = Buffer.concat([
      buffer.subarray(0, existingApp1),
      exifBlock,
      buffer.subarray(existingApp1 + 2 + oldSegLen),
    ]);
  } else {
    // Insert after SOI marker
    result = Buffer.concat([buffer.subarray(0, 2), exifBlock, buffer.subarray(2)]);
  }

  await writeFile(filePath, result);
  return true;
}

async function main() {
  const dir = process.argv[2];
  if (!dir) {
    console.error(
      '用法：node scripts/embed-copyright.mjs "public/images/photography/作品集文件夹"',
    );
    console.error("或：  npm run copyright:embed -- 作品集文件夹名");
    process.exit(1);
  }

  const targetDir = path.isAbsolute(dir) ? dir : path.resolve(process.cwd(), dir);
  const copyright = process.argv[3] || "(c) Liuwuxin. All rights reserved.";
  const artist = process.argv[4] || "Liuwuxin";

  let files;
  try {
    files = (await readdir(targetDir, { withFileTypes: true }))
      .filter((e) => e.isFile())
      .map((e) => e.name);
  } catch {
    console.error(`无法读取目录：${targetDir}`);
    process.exit(1);
  }

  if (files.length === 0) {
    console.log("目录为空。");
    return;
  }

  console.log(`目录：${targetDir}`);
  console.log(`版权：${copyright}`);
  console.log(`作者：${artist}\n`);

  let count = 0;
  for (const fileName of files) {
    const filePath = path.join(targetDir, fileName);
    const ok = await embedCopyright(filePath, copyright, artist);
    if (ok) {
      console.log(`  ✓ ${fileName}`);
      count++;
    }
  }

  console.log(`\n完成，已为 ${count} 张照片嵌入版权信息。`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

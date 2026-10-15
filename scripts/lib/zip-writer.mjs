// Minimal ZIP archive writer (PKWARE APPNOTE 6.3): deflated entries, UTF-8 names, no ZIP64,
// so the archive and each entry must stay under 4 GB. Every entry gets the same fixed
// timestamp (1980-01-01 00:00) so packaging the same files twice gives identical bytes.

import zlib from 'node:zlib';

const LOCAL_FILE_HEADER = 0x04034b50;
const CENTRAL_DIRECTORY_HEADER = 0x02014b50;
const END_OF_CENTRAL_DIRECTORY = 0x06054b50;
const VERSION_2_0 = 20;
const FLAG_UTF8_NAMES = 0x0800;
const METHOD_DEFLATE = 8;
const DOS_TIME = 0;
const DOS_DATE = (0 << 9) | (1 << 5) | 1;

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function sharedHeaderFields(entry) {
  const fields = Buffer.alloc(26);
  fields.writeUInt16LE(VERSION_2_0, 0);
  fields.writeUInt16LE(FLAG_UTF8_NAMES, 2);
  fields.writeUInt16LE(METHOD_DEFLATE, 4);
  fields.writeUInt16LE(DOS_TIME, 6);
  fields.writeUInt16LE(DOS_DATE, 8);
  fields.writeUInt32LE(entry.crc, 10);
  fields.writeUInt32LE(entry.compressed.length, 14);
  fields.writeUInt32LE(entry.size, 18);
  fields.writeUInt16LE(entry.name.length, 22);
  fields.writeUInt16LE(0, 24);
  return fields;
}

function localHeader(entry) {
  const signature = Buffer.alloc(4);
  signature.writeUInt32LE(LOCAL_FILE_HEADER, 0);
  return Buffer.concat([signature, sharedHeaderFields(entry), entry.name]);
}

function centralHeader(entry) {
  const prefix = Buffer.alloc(6);
  prefix.writeUInt32LE(CENTRAL_DIRECTORY_HEADER, 0);
  prefix.writeUInt16LE(VERSION_2_0, 4);
  // comment length, disk number, internal and external attributes stay 0; then the offset.
  const suffix = Buffer.alloc(14);
  suffix.writeUInt32LE(entry.offset, 10);
  return Buffer.concat([prefix, sharedHeaderFields(entry), suffix, entry.name]);
}

function endOfCentralDirectory(entryCount, directorySize, directoryOffset) {
  const record = Buffer.alloc(22);
  record.writeUInt32LE(END_OF_CENTRAL_DIRECTORY, 0);
  record.writeUInt16LE(entryCount, 8);
  record.writeUInt16LE(entryCount, 10);
  record.writeUInt32LE(directorySize, 12);
  record.writeUInt32LE(directoryOffset, 16);
  return record;
}

/**
 * Builds a ZIP archive in memory.
 * @param {{ name: string, content: Buffer }[]} files  `name` is the entry path; it must use `/`.
 * @returns {Buffer}
 */
export function createZip(files) {
  const chunks = [];
  const entries = [];
  let offset = 0;
  for (const file of files) {
    if (file.name.includes('\\')) throw new Error(`ZIP entry name must use forward slashes: ${file.name}`);
    const entry = {
      name: Buffer.from(file.name, 'utf8'),
      size: file.content.length,
      crc: crc32(file.content),
      compressed: zlib.deflateRawSync(file.content),
      offset,
    };
    const header = localHeader(entry);
    chunks.push(header, entry.compressed);
    offset += header.length + entry.compressed.length;
    entries.push(entry);
  }
  const directory = Buffer.concat(entries.map(centralHeader));
  return Buffer.concat([...chunks, directory, endOfCentralDirectory(entries.length, directory.length, offset)]);
}

import exifr from 'exifr';

export interface ShutterCountResult {
  found: boolean;
  count: number | null;
  secondaryCount?: number | null;
  secondaryLabel?: string;
  sourceTag: string;
  confidence: 'exact' | 'xmp-aux' | 'unsupported-brand' | 'stripped';
  cameraMake: string;
  cameraModel: string;
  serialNumber?: string;
  lensModel?: string;
  fileNumber?: string;
  explanationEn: string;
  explanationBn: string;
}

export interface MetadataEntry {
  group: string;
  key: string;
  value: string;
}

export interface ExtractedImageMetadata {
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  extension: string;
  width: number | null;
  height: number | null;
  megapixels: string | null;
  cameraMake: string;
  cameraModel: string;
  lensModel: string;
  serialNumber: string;
  software: string;
  dateTaken: string;
  exposureTime: string;
  fNumber: string;
  iso: string;
  focalLength: string;
  exposureProgram: string;
  whiteBalance: string;
  flash: string;
  colorSpace: string;
  gps: {
    latitude: number;
    longitude: number;
    altitude: number | null;
  } | null;
  shutter: ShutterCountResult;
  groups: Record<string, MetadataEntry[]>;
  allEntries: MetadataEntry[];
  makerNoteBytes: number;
  hasExif: boolean;
  hasXmp: boolean;
  hasIptc: boolean;
  hasIcc: boolean;
}

function readU16(view: DataView, offset: number, le: boolean): number {
  if (offset < 0 || offset + 2 > view.byteLength) return 0;
  return view.getUint16(offset, le);
}

function readU32(view: DataView, offset: number, le: boolean): number {
  if (offset < 0 || offset + 4 > view.byteLength) return 0;
  return view.getUint32(offset, le);
}

function readAscii(bytes: Uint8Array, offset: number, len: number): string {
  const end = Math.min(bytes.length, offset + len);
  let out = '';
  for (let i = offset; i < end; i++) {
    const ch = bytes[i];
    if (ch === 0) break;
    if (ch >= 32 && ch <= 126) out += String.fromCharCode(ch);
  }
  return out.trim();
}

function formatRationalOrValue(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (val instanceof Date) {
    return Number.isNaN(val.getTime()) ? String(val) : val.toLocaleString();
  }
  if (val instanceof Uint8Array || ArrayBuffer.isView(val)) {
    const arr = new Uint8Array(val.buffer, val.byteOffset, Math.min(16, val.byteLength));
    const hex = Array.from(arr)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join(' ');
    return `[Binary ${val.byteLength} bytes: ${hex}${val.byteLength > 16 ? ' ...' : ''}]`;
  }
  if (Array.isArray(val)) {
    if (val.length > 24) {
      return `[Array(${val.length}): ${val.slice(0, 8).join(', ')} ...]`;
    }
    return val.map((v) => formatRationalOrValue(v)).join(', ');
  }
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  }
  return String(val);
}

function formatExposureTime(val: unknown): string {
  const num = typeof val === 'number' ? val : Number(val);
  if (!Number.isFinite(num) || num <= 0) return '';
  if (num >= 1) return `${num.toFixed(1).replace(/\.0$/, '')} s`;
  const denom = Math.round(1 / num);
  return denom > 0 ? `1/${denom} s` : `${num} s`;
}

/**
 * Locate TIFF header byte offset in JPEG APP1 ("Exif\0\0") or RAW/TIFF file.
 */
function findTiffBaseOffset(bytes: Uint8Array): number | null {
  if (bytes.length < 12) return null;

  // Direct TIFF / CR2 / NEF / ARW / DNG / PEF / ORF
  if (
    (bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2a && bytes[3] === 0x00) ||
    (bytes[0] === 0x4d && bytes[1] === 0x4d && bytes[2] === 0x00 && bytes[3] === 0x2a) ||
    (bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x52 && bytes[3] === 0x4f) ||
    (bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x55 && bytes[3] === 0x00)
  ) {
    return 0;
  }

  // JPEG SOI (FF D8) -> walk APP markers to find Exif\0\0
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let pos = 2;
    while (pos + 4 < bytes.length) {
      if (bytes[pos] !== 0xff) break;
      const marker = bytes[pos + 1];
      if (marker === 0xda || marker === 0xd9) break; // SOS / EOI
      if (marker === 0x00 || (marker >= 0xd0 && marker <= 0xd7)) {
        pos += 2;
        continue;
      }
      const segLen = (bytes[pos + 2] << 8) | bytes[pos + 3];
      if (segLen < 2) break;
      if (
        marker === 0xe1 &&
        pos + 10 < bytes.length &&
        bytes[pos + 4] === 0x45 &&
        bytes[pos + 5] === 0x78 &&
        bytes[pos + 6] === 0x69 &&
        bytes[pos + 7] === 0x66 &&
        bytes[pos + 8] === 0x00 &&
        bytes[pos + 9] === 0x00
      ) {
        return pos + 10;
      }
      pos += 2 + segLen;
    }
  }

  return null;
}

interface TiffIfdEntry {
  tag: number;
  type: number;
  count: number;
  valueOrOffset: number;
  entryOffset: number;
}

function readIfdEntries(
  view: DataView,
  ifdOffset: number,
  le: boolean
): TiffIfdEntry[] {
  if (ifdOffset < 0 || ifdOffset + 2 > view.byteLength) return [];
  const numEntries = readU16(view, ifdOffset, le);
  if (numEntries <= 0 || numEntries > 512) return [];
  const entries: TiffIfdEntry[] = [];
  for (let i = 0; i < numEntries; i++) {
    const eOff = ifdOffset + 2 + i * 12;
    if (eOff + 12 > view.byteLength) break;
    entries.push({
      tag: readU16(view, eOff, le),
      type: readU16(view, eOff + 2, le),
      count: readU32(view, eOff + 4, le),
      valueOrOffset: readU32(view, eOff + 8, le),
      entryOffset: eOff,
    });
  }
  return entries;
}

const TIFF_TYPE_SIZE: Record<number, number> = {
  1: 1, // BYTE
  2: 1, // ASCII
  3: 2, // SHORT
  4: 4, // LONG
  5: 8, // RATIONAL
  6: 1, // SBYTE
  7: 1, // UNDEFINED
  8: 2, // SSHORT
  9: 4, // SLONG
  10: 8, // SRATIONAL
  11: 4, // FLOAT
  12: 8, // DOUBLE
};

function getEntryBytes(
  bytes: Uint8Array,
  view: DataView,
  entry: TiffIfdEntry,
  baseOffset: number
): Uint8Array | null {
  const unitSize = TIFF_TYPE_SIZE[entry.type] || 1;
  const totalBytes = entry.count * unitSize;
  if (totalBytes <= 0 || totalBytes > 10_000_000) return null;
  if (totalBytes <= 4) {
    return bytes.slice(entry.entryOffset + 8, entry.entryOffset + 8 + totalBytes);
  }
  const absOffset = baseOffset + entry.valueOrOffset;
  if (absOffset < 0 || absOffset + totalBytes > bytes.length) return null;
  return bytes.slice(absOffset, absOffset + totalBytes);
}

function getEntryScalarUint(
  view: DataView,
  entry: TiffIfdEntry,
  le: boolean,
  baseOffset: number
): number | null {
  if (entry.count < 1) return null;
  if (entry.type === 3 && entry.count === 1) {
    return readU16(view, entry.entryOffset + 8, le);
  }
  if ((entry.type === 4 || entry.type === 9) && entry.count === 1) {
    return readU32(view, entry.entryOffset + 8, le);
  }
  const unitSize = TIFF_TYPE_SIZE[entry.type] || 1;
  const totalBytes = entry.count * unitSize;
  const start = totalBytes <= 4 ? entry.entryOffset + 8 : baseOffset + entry.valueOrOffset;
  if (start < 0 || start + unitSize > view.byteLength) return null;
  if (entry.type === 3) return readU16(view, start, le);
  if (entry.type === 4 || entry.type === 9) return readU32(view, start, le);
  return null;
}

/**
 * Locate MakerNote raw slice + outer TIFF base inside JPEG/TIFF/RAW bytes
 */
function findMakerNoteLocation(
  bytes: Uint8Array,
  view: DataView
): { tiffBase: number; tiffLe: boolean; mnOffset: number; mnLength: number } | null {
  const tiffBase = findTiffBaseOffset(bytes);
  if (tiffBase === null || tiffBase + 8 > bytes.length) return null;

  const tiffLe = bytes[tiffBase] === 0x49 && bytes[tiffBase + 1] === 0x49;
  const firstIfdRel = readU32(view, tiffBase + 4, tiffLe);
  const ifd0Entries = readIfdEntries(view, tiffBase + firstIfdRel, tiffLe);

  const exifPtr = ifd0Entries.find((e) => e.tag === 0x8769);
  if (!exifPtr) return null;
  const exifEntries = readIfdEntries(view, tiffBase + exifPtr.valueOrOffset, tiffLe);
  const mnEntry = exifEntries.find((e) => e.tag === 0x927c);
  if (!mnEntry) return null;

  const mnAbsOffset = tiffBase + mnEntry.valueOrOffset;
  if (mnAbsOffset < 0 || mnAbsOffset >= bytes.length) return null;
  return {
    tiffBase,
    tiffLe,
    mnOffset: mnAbsOffset,
    mnLength: Math.min(mnEntry.count, bytes.length - mnAbsOffset),
  };
}

/**
 * Build Sony's deterministic 256-byte Tag 0x9050 substitution cipher lookup table
 * Inverse of enc(x) = (x^3) mod 249 for x < 249, identity for x >= 249.
 */
const SONY_DECRYPT_TABLE = (() => {
  const table = new Uint8Array(256);
  for (let i = 0; i < 249; i++) {
    const enc = (i * i * i) % 249;
    table[enc] = i;
  }
  for (let i = 249; i < 256; i++) {
    table[i] = i;
  }
  return table;
})();

function extractRawXmpXml(bytes: Uint8Array): string {
  // Scan ASCII/UTF-8 window around first 256 KB (or full file up to 2 MB) for <x:xmpmeta
  const limit = Math.min(bytes.length, 2_500_000);
  const decoder = new TextDecoder('latin1');
  const chunk = decoder.decode(bytes.subarray(0, limit));
  const start = chunk.indexOf('<x:xmpmeta');
  if (start === -1) return '';
  const end = chunk.indexOf('</x:xmpmeta>', start);
  return end !== -1 ? chunk.slice(start, end + 12) : chunk.slice(start, start + 32000);
}

function extractNumberFromXmp(xmpXml: string, xmpParsed: Record<string, unknown> | undefined): {
  count: number;
  tag: string;
} | null {
  const candidates: { tag: string; raw: unknown }[] = [];
  if (xmpParsed) {
    if (xmpParsed.ImageNumber !== undefined) {
      candidates.push({ tag: 'XMP aux:ImageNumber', raw: xmpParsed.ImageNumber });
    }
    if (xmpParsed.ShutterCount !== undefined) {
      candidates.push({ tag: 'XMP ShutterCount', raw: xmpParsed.ShutterCount });
    }
  }
  if (xmpXml) {
    const patterns: { regex: RegExp; label: string }[] = [
      { regex: /aux:ImageNumber[^>]*>(\d+)</i, label: 'XMP aux:ImageNumber' },
      { regex: /aux:ImageNumber="(\d+)"/i, label: 'XMP aux:ImageNumber' },
      { regex: /exifEX?:ShutterCount[^>]*>(\d+)</i, label: 'XMP ShutterCount' },
      { regex: /ShutterCount="(\d+)"/i, label: 'XMP ShutterCount' },
    ];
    for (const p of patterns) {
      const m = xmpXml.match(p.regex);
      if (m && m[1]) {
        candidates.push({ tag: p.label, raw: Number(m[1]) });
      }
    }
  }
  for (const c of candidates) {
    const n = Number(c.raw);
    if (Number.isInteger(n) && n > 0 && n < 10_000_000) {
      return { count: n, tag: c.tag };
    }
  }
  return null;
}

function decodeCameraShutterCount(
  bytes: Uint8Array,
  view: DataView,
  make: string,
  model: string,
  xmpXml: string,
  xmpParsed: Record<string, unknown> | undefined,
  exifParsed: Record<string, unknown> | undefined
): ShutterCountResult {
  const upperMake = make.toUpperCase();
  const upperModel = model.toUpperCase();
  const mnLoc = findMakerNoteLocation(bytes, view);

  let detectedLens = typeof exifParsed?.LensModel === 'string' ? exifParsed.LensModel : '';
  let detectedSerial =
    typeof exifParsed?.BodySerialNumber === 'string' ? exifParsed.BodySerialNumber : '';
  let canonFileNumber = '';

  if (mnLoc) {
    const { tiffBase, tiffLe, mnOffset, mnLength } = mnLoc;
    const mnMagic = readAscii(bytes, mnOffset, 12);

    // 1. NIKON DSLR / Z MIRRORLESS (NEF, NRW, JPG)
    if (upperMake.includes('NIKON') || mnMagic.startsWith('Nikon')) {
      let nikonIfdOffset = mnOffset;
      let nikonBase = tiffBase;
      let nikonLe = tiffLe;

      // Modern Nikon MakerNote ("Nikon\0" + 2-byte version + 2-byte pad + embedded TIFF header at +10)
      if (
        bytes[mnOffset] === 0x4e &&
        bytes[mnOffset + 1] === 0x69 &&
        bytes[mnOffset + 2] === 0x6b &&
        bytes[mnOffset + 3] === 0x6f &&
        bytes[mnOffset + 4] === 0x6e &&
        mnLength > 18
      ) {
        const subTiff = mnOffset + 10;
        if (
          (bytes[subTiff] === 0x49 && bytes[subTiff + 1] === 0x49) ||
          (bytes[subTiff] === 0x4d && bytes[subTiff + 1] === 0x4d)
        ) {
          nikonBase = subTiff;
          nikonLe = bytes[subTiff] === 0x49;
          const relIfd = readU32(view, subTiff + 4, nikonLe);
          nikonIfdOffset = subTiff + relIfd;
        }
      }

      const entries = readIfdEntries(view, nikonIfdOffset, nikonLe);
      const shutterEntry = entries.find((e) => e.tag === 0x00a7);
      const serialEntry = entries.find((e) => e.tag === 0x001d);
      const lensEntry = entries.find((e) => e.tag === 0x0084);

      if (serialEntry && !detectedSerial) {
        const sb = getEntryBytes(bytes, view, serialEntry, nikonBase);
        if (sb) detectedSerial = readAscii(sb, 0, sb.length);
      }
      if (lensEntry && !detectedLens) {
        // Lens rational tuple can be complex; keep Exif LensModel if already present
      }

      if (shutterEntry) {
        const count = getEntryScalarUint(view, shutterEntry, nikonLe, nikonBase);
        if (count !== null && count >= 0 && count < 10_000_000) {
          return {
            found: true,
            count,
            sourceTag: 'Nikon MakerNote Tag 0x00A7 (ShutterCount)',
            confidence: 'exact',
            cameraMake: make,
            cameraModel: model,
            serialNumber: detectedSerial,
            lensModel: detectedLens,
            explanationEn:
              'Exact mechanical/total shutter actuations read directly from Nikon MakerNote tag 0x00A7.',
            explanationBn:
              'Nikon ক্যামেরার আসল MakerNote (Tag 0x00A7) থেকে সঠিক শাটার কাউন্ট পাওয়া গেছে।',
          };
        }
      }
    }

    // 2. SONY ALPHA DSLR / SLT / ILCE MIRRORLESS (ARW, JPG)
    if (upperMake.includes('SONY') || mnMagic.startsWith('SONY')) {
      const hasHeader =
        mnLength > 14 &&
        bytes[mnOffset] === 0x53 &&
        bytes[mnOffset + 1] === 0x4f &&
        bytes[mnOffset + 2] === 0x4e &&
        bytes[mnOffset + 3] === 0x59;
      const sonyIfdOffset = hasHeader ? mnOffset + 12 : mnOffset;
      const entries = readIfdEntries(view, sonyIfdOffset, tiffLe);
      const tag9050 = entries.find((e) => e.tag === 0x9050);

      if (tag9050) {
        const rawBlock = getEntryBytes(bytes, view, tag9050, tiffBase);
        if (rawBlock && rawBlock.length >= 64) {
          const dec = new Uint8Array(rawBlock.length);
          for (let i = 0; i < rawBlock.length; i++) {
            dec[i] = SONY_DECRYPT_TABLE[rawBlock[i]];
          }
          const decView = new DataView(dec.buffer);

          const val32 = dec.length >= 0x36 ? decView.getUint32(0x0032, true) : 0;
          const val3a = dec.length >= 0x3e ? decView.getUint32(0x003a, true) : 0;
          const val0a = dec.length >= 0x0e ? decView.getUint32(0x000a, true) : 0;

          const isNewerIlce =
            /ILCE-(7M[345]|7RM[345]|7SM3|7C|9|1|6100|6400|6600|6700)|ZV-E/.test(
              upperModel
            );

          let primary: number | null = null;
          let secondary: number | null = null;
          let offsetUsed = '0x0032';

          if (isNewerIlce) {
            if (val3a > 0 && val3a < 10_000_000) {
              primary = val3a;
              offsetUsed = '0x003A';
              if (val32 > 0 && val32 < 10_000_000 && val32 !== val3a) secondary = val32;
            } else if (val32 > 0 && val32 < 10_000_000) {
              primary = val32;
              offsetUsed = '0x0032';
            } else if (val0a > 0 && val0a < 10_000_000) {
              primary = val0a;
              offsetUsed = '0x000A';
            }
          } else {
            if (val32 > 0 && val32 < 10_000_000) {
              primary = val32;
              offsetUsed = '0x0032';
              if (val3a > 0 && val3a < 10_000_000 && val3a !== val32) secondary = val3a;
            } else if (val3a > 0 && val3a < 10_000_000) {
              primary = val3a;
              offsetUsed = '0x003A';
            }
          }

          if (primary !== null) {
            return {
              found: true,
              count: primary,
              secondaryCount: secondary,
              secondaryLabel: secondary ? 'Secondary ImageCount' : undefined,
              sourceTag: `Sony MakerNote Tag 0x9050 Decrypted (${offsetUsed})`,
              confidence: 'exact',
              cameraMake: make,
              cameraModel: model,
              serialNumber: detectedSerial,
              lensModel: detectedLens,
              explanationEn:
                'Decrypted directly from Sony MakerNote cipher block (Tag 0x9050) embedded inside the original camera file.',
              explanationBn:
                'Sony ক্যামেরার এনক্রিপ্টেড MakerNote (Tag 0x9050) ডিকোড করে আসল শাটার কাউন্ট বের করা হয়েছে।',
            };
          }
        }
      }
    }

    // 3. FUJIFILM X / GFX SERIES (RAF, JPG) -> Tag 0x1438 ImageCount
    if (upperMake.includes('FUJI') || mnMagic.startsWith('FUJIFILM')) {
      let fujiIfd = mnOffset;
      if (mnMagic.startsWith('FUJIFILM') && mnLength >= 16) {
        const rel = readU32(view, mnOffset + 8, true);
        fujiIfd = mnOffset + rel;
      }
      const entries = readIfdEntries(view, fujiIfd, true);
      const imageCountEntry = entries.find((e) => e.tag === 0x1438);
      if (imageCountEntry) {
        const count = getEntryScalarUint(view, imageCountEntry, true, mnOffset);
        if (count !== null && count > 0 && count < 10_000_000) {
          return {
            found: true,
            count,
            sourceTag: 'Fujifilm MakerNote Tag 0x1438 (ImageCount)',
            confidence: 'exact',
            cameraMake: make,
            cameraModel: model,
            serialNumber: detectedSerial,
            lensModel: detectedLens,
            explanationEn:
              'Read directly from Fujifilm MakerNote Tag 0x1438 (ImageCount).',
            explanationBn:
              'Fujifilm ক্যামেরার MakerNote (Tag 0x1438) থেকে আসল শাটার/ইমেজ কাউন্ট পাওয়া গেছে।',
          };
        }
      }
    }

    // 4. PENTAX / RICOH (PEF, DNG, JPG) -> Tag 0x005D XOR Date (0x0006) XOR Time (0x0007)
    if (upperMake.includes('PENTAX') || upperMake.includes('RICOH') || mnMagic.startsWith('AOC')) {
      let pentaxIfd = mnOffset;
      let pentaxLe = tiffLe;
      if (bytes[mnOffset] === 0x41 && bytes[mnOffset + 1] === 0x4f && bytes[mnOffset + 2] === 0x43) {
        pentaxLe = !(bytes[mnOffset + 4] === 0x4d && bytes[mnOffset + 5] === 0x4d);
        pentaxIfd = mnOffset + 6;
      }
      const entries = readIfdEntries(view, pentaxIfd, pentaxLe);
      const dateEntry = entries.find((e) => e.tag === 0x0006);
      const timeEntry = entries.find((e) => e.tag === 0x0007);
      const shutterEntry = entries.find((e) => e.tag === 0x005d);

      if (dateEntry && timeEntry && shutterEntry) {
        const db = getEntryBytes(bytes, view, dateEntry, tiffBase);
        const tb = getEntryBytes(bytes, view, timeEntry, tiffBase);
        const sb = getEntryBytes(bytes, view, shutterEntry, tiffBase);
        if (db && tb && sb && db.length >= 4 && tb.length >= 4 && sb.length >= 4) {
          const dVal = new DataView(db.buffer, db.byteOffset, 4).getUint32(0, false);
          const tVal = new DataView(tb.buffer, tb.byteOffset, 4).getUint32(0, false);
          const sVal = new DataView(sb.buffer, sb.byteOffset, 4).getUint32(0, pentaxLe);
          const decoded = (sVal ^ dVal ^ tVal) >>> 0;
          if (decoded > 0 && decoded < 5_000_000) {
            return {
              found: true,
              count: decoded,
              sourceTag: 'Pentax MakerNote Tag 0x005D (Date/Time XOR Decoded)',
              confidence: 'exact',
              cameraMake: make,
              cameraModel: model,
              serialNumber: detectedSerial,
              lensModel: detectedLens,
              explanationEn:
                'Decoded from Pentax encrypted ShutterCount tag 0x005D using MakerNote Date & Time.',
              explanationBn:
                'Pentax ক্যামেরার এনক্রিপ্টেড Tag 0x005D ডিকোড করে আসল শাটার কাউন্ট পাওয়া গেছে।',
            };
          }
        }
      }
    }

    // 5. CANON EOS (CR2 / JPG) -> Check 0x0008 FileNumber & 1D-series 0x0093 CanonFileInfo
    if (upperMake.includes('CANON')) {
      const entries = readIfdEntries(view, mnOffset, tiffLe);
      const fileNumEntry = entries.find((e) => e.tag === 0x0008);
      if (fileNumEntry) {
        const fn = getEntryScalarUint(view, fileNumEntry, tiffLe, tiffBase);
        if (fn && fn > 0) {
          const folder = Math.floor(fn / 10000);
          const fileIdx = fn % 10000;
          canonFileNumber = `${folder}-${String(fileIdx).padStart(4, '0')}`;
        }
      }

      // Legacy Canon 1D / 1Ds store true ShutterCount inside 0x0093 FileInfo (byte offset 4 uint32 on 1D/1Ds Mk II/III)
      const is1DSeries = /EOS-1D|EOS 1D/.test(upperModel);
      const fileInfoEntry = entries.find((e) => e.tag === 0x0093);
      if (is1DSeries && fileInfoEntry) {
        const fiBytes = getEntryBytes(bytes, view, fileInfoEntry, tiffBase);
        if (fiBytes && fiBytes.length >= 8) {
          const fiView = new DataView(fiBytes.buffer, fiBytes.byteOffset, fiBytes.byteLength);
          const c = fiView.getUint32(2, tiffLe);
          if (c > 0 && c < 5_000_000) {
            return {
              found: true,
              count: c,
              sourceTag: 'Canon EOS-1D FileInfo (Tag 0x0093)',
              confidence: 'exact',
              cameraMake: make,
              cameraModel: model,
              serialNumber: detectedSerial,
              lensModel: detectedLens,
              fileNumber: canonFileNumber,
              explanationEn:
                'Read from Canon EOS-1D Series CanonFileInfo tag 0x0093 inside MakerNote.',
              explanationBn:
                'Canon EOS-1D সিরিজের CanonFileInfo (0x0093) থেকে শাটার কাউন্ট পাওয়া গেছে।',
            };
          }
        }
      }
    }
  }

  // 6. XMP aux:ImageNumber or EXIF ImageNumber fallback (Adobe Camera Raw / Lightroom / Some Leica & Sony)
  const xmpFound = extractNumberFromXmp(xmpXml, xmpParsed);
  if (xmpFound) {
    return {
      found: true,
      count: xmpFound.count,
      sourceTag: xmpFound.tag,
      confidence: 'xmp-aux',
      cameraMake: make,
      cameraModel: model,
      serialNumber: detectedSerial,
      lensModel: detectedLens,
      fileNumber: canonFileNumber || undefined,
      explanationEn:
        'Extracted from embedded Adobe XMP camera actuation metadata (aux:ImageNumber).',
      explanationBn:
        'ফাইলের ভেতরে থাকা XMP মেটাডেটা (aux:ImageNumber) থেকে শাটার সংখ্যা পাওয়া গেছে।',
    };
  }

  if (exifParsed && typeof exifParsed.ImageNumber === 'number' && exifParsed.ImageNumber > 0) {
    return {
      found: true,
      count: exifParsed.ImageNumber,
      sourceTag: 'EXIF Tag 0x9211 (ImageNumber)',
      confidence: 'xmp-aux',
      cameraMake: make,
      cameraModel: model,
      serialNumber: detectedSerial,
      lensModel: detectedLens,
      explanationEn: 'Read from standard EXIF ImageNumber tag (0x9211).',
      explanationBn: 'EXIF ImageNumber (0x9211) ট্যাগ থেকে কাউন্ট পাওয়া গেছে।',
    };
  }

  // Honest explanation when no shutter count is embedded
  if (!make && !model && !mnLoc) {
    return {
      found: false,
      count: null,
      sourceTag: 'No EXIF / MakerNote Present',
      confidence: 'stripped',
      cameraMake: '',
      cameraModel: '',
      explanationEn:
        'This file contains no camera EXIF or MakerNote data. WhatsApp, Facebook, screenshots, and web-compressed images strip DSLR shutter count. Always upload an original unedited JPEG or RAW file (.NEF, .ARW, .CR2, .PEF, .RAF) straight from your SD card.',
      explanationBn:
        'এই ছবিতে ক্যামেরার আসল EXIF বা MakerNote ডেটা নেই। হোয়াটসঅ্যাপ, ফেসবুক বা এডিট করা ছবিতে শাটার কাউন্ট মুছে যায়। সরাসরি মেমোরি কার্ড থেকে তোলা অরিজিনাল JPG বা RAW (.NEF, .ARW, .RAF) আপলোড করুন।',
    };
  }

  if (upperMake.includes('CANON')) {
    return {
      found: false,
      count: null,
      sourceTag: 'Canon EOS (MakerNote omits mechanical count)',
      confidence: 'unsupported-brand',
      cameraMake: make,
      cameraModel: model,
      serialNumber: detectedSerial,
      lensModel: detectedLens,
      fileNumber: canonFileNumber || undefined,
      explanationEn:
        `Canon ${model || 'EOS'} bodies do not write mechanical shutter count inside JPEG/CR2/CR3 EXIF metadata (unlike Nikon & Sony). Only Canon 1D-series or USB utility tools (EOSInfo / Tornadoscf) read Canon body EEPROM directly.${
          canonFileNumber ? ` Note: Camera Folder File Number is ${canonFileNumber} (not lifetime shutter count).` : ''
        }`,
      explanationBn:
        `Canon ${model || 'EOS'} ক্যামেরা সাধারণত ছবি বা RAW ফাইলের EXIF-এর ভেতর আসল শাটার কাউন্ট লেখে না (Nikon বা Sony-র মতো নয়)। এটি জানতে ল্যাপটপে USB কেবল দিয়ে Canon EOSInfo সফটওয়্যার ব্যবহার করতে হয়।${
          canonFileNumber ? ` (ফাইলের নম্বর: ${canonFileNumber})` : ''
        }`,
    };
  }

  return {
    found: false,
    count: null,
    sourceTag: `${make || 'Unknown Camera'} — Not Stored in Image EXIF`,
    confidence: 'unsupported-brand',
    cameraMake: make,
    cameraModel: model,
    serialNumber: detectedSerial,
    lensModel: detectedLens,
    explanationEn: `${
      make || 'This camera'
    } ${model} did not embed a standard shutter actuation tag inside this file (or editing software stripped MakerNote). Try uploading an unedited RAW/JPEG directly from the camera card.`,
    explanationBn: `${
      make || 'এই ক্যামেরার'
    } ${model} ছবির ভেতরে শাটার কাউন্ট ট্যাগ সংরক্ষণ করেনি অথবা এডিটিং সফটওয়্যারে তা মুছে গেছে। সরাসরি ক্যামেরার অরিজিনাল ফাইল দিয়ে চেষ্টা করুন।`,
  };
}

export async function inspectImageMetadata(file: File): Promise<ExtractedImageMetadata> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

  let parsedGroups: Record<string, Record<string, unknown>> = {};
  try {
    const res = await exifr.parse(buffer, {
      tiff: true,
      ifd1: true,
      exif: true,
      gps: true,
      xmp: true,
      iptc: true,
      icc: true,
      jfif: true,
      ihdr: true,
      makerNote: true,
      userComment: true,
      translateKeys: true,
      translateValues: true,
      reviveValues: true,
      mergeOutput: false,
    });
    if (res && typeof res === 'object') {
      parsedGroups = res as Record<string, Record<string, unknown>>;
    }
  } catch {
    // Continue gracefully for formats like WebP/BMP/PNG without EXIF
  }

  const ifd0 = (parsedGroups.ifd0 || {}) as Record<string, unknown>;
  const exif = (parsedGroups.exif || {}) as Record<string, unknown>;
  const gps = (parsedGroups.gps || {}) as Record<string, unknown>;
  const xmp = (parsedGroups.xmp || {}) as Record<string, unknown>;
  const iptc = (parsedGroups.iptc || {}) as Record<string, unknown>;
  const icc = (parsedGroups.icc || {}) as Record<string, unknown>;
  const ihdr = (parsedGroups.ihdr || {}) as Record<string, unknown>;
  const jfif = (parsedGroups.jfif || {}) as Record<string, unknown>;

  const make = String(ifd0.Make || xmp.Make || '').trim();
  const model = String(ifd0.Model || xmp.Model || '').trim();
  const xmpXml = extractRawXmpXml(bytes);

  const shutter = decodeCameraShutterCount(
    bytes,
    view,
    make,
    model,
    xmpXml,
    xmp,
    exif
  );

  // Measure pixel dimensions via Image decode fallback + EXIF fields
  let width: number | null =
    Number(exif.ExifImageWidth || ihdr.ImageWidth || ifd0.ImageWidth) || null;
  let height: number | null =
    Number(exif.ExifImageHeight || ihdr.ImageHeight || ifd0.ImageHeight) || null;

  if ((!width || !height) && file.type.startsWith('image/')) {
    try {
      const url = URL.createObjectURL(file);
      const dims = await new Promise<{ w: number; h: number }>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = reject;
        img.src = url;
      });
      URL.revokeObjectURL(url);
      width = dims.w;
      height = dims.h;
    } catch {
      // RAW files may not decode natively via <img>; keep EXIF dims
    }
  }

  const megapixels =
    width && height ? ((width * height) / 1_000_000).toFixed(2) : null;

  const groups: Record<string, MetadataEntry[]> = {};
  const allEntries: MetadataEntry[] = [];

  const groupOrder: { key: string; label: string }[] = [
    { key: 'ifd0', label: 'Camera / IFD0' },
    { key: 'exif', label: 'EXIF Exposure' },
    { key: 'gps', label: 'GPS Location' },
    { key: 'xmp', label: 'XMP' },
    { key: 'iptc', label: 'IPTC' },
    { key: 'icc', label: 'ICC Color Profile' },
    { key: 'ihdr', label: 'PNG Header' },
    { key: 'jfif', label: 'JFIF' },
    { key: 'ifd1', label: 'Thumbnail IFD1' },
  ];

  for (const g of groupOrder) {
    const obj = parsedGroups[g.key];
    if (!obj || typeof obj !== 'object') continue;
    const entries: MetadataEntry[] = [];
    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined || v === null) continue;
      const formatted = formatRationalOrValue(v);
      if (!formatted) continue;
      const entry = { group: g.label, key: k, value: formatted };
      entries.push(entry);
      allEntries.push(entry);
    }
    if (entries.length > 0) {
      groups[g.label] = entries;
    }
  }

  const lat = typeof gps.latitude === 'number' ? gps.latitude : null;
  const lon = typeof gps.longitude === 'number' ? gps.longitude : null;
  const alt = typeof gps.GPSAltitude === 'number' ? gps.GPSAltitude : null;

  const mnRaw = parsedGroups.makerNote as unknown;
  const makerNoteBytes =
    mnRaw instanceof Uint8Array
      ? mnRaw.byteLength
      : findMakerNoteLocation(bytes, view)?.mnLength || 0;

  const extMatch = file.name.split('.').pop()?.toUpperCase() || 'FILE';

  return {
    fileName: file.name,
    fileSizeBytes: file.size,
    mimeType: file.type || extMatch,
    extension: extMatch,
    width,
    height,
    megapixels,
    cameraMake: make,
    cameraModel: model,
    lensModel: String(exif.LensModel || shutter.lensModel || xmp.Lens || '').trim(),
    serialNumber: String(
      exif.BodySerialNumber || shutter.serialNumber || xmp.SerialNumber || ''
    ).trim(),
    software: String(ifd0.Software || xmp.CreatorTool || '').trim(),
    dateTaken: formatRationalOrValue(
      exif.DateTimeOriginal || exif.CreateDate || ifd0.ModifyDate || ''
    ),
    exposureTime: formatExposureTime(exif.ExposureTime),
    fNumber: exif.FNumber ? `f/${exif.FNumber}` : '',
    iso: exif.ISO ? `ISO ${exif.ISO}` : '',
    focalLength: exif.FocalLength
      ? `${exif.FocalLength} mm${
          exif.FocalLengthIn35mmFormat
            ? ` (${exif.FocalLengthIn35mmFormat} mm eq)`
            : ''
        }`
      : '',
    exposureProgram: String(exif.ExposureProgram || '').trim(),
    whiteBalance: String(exif.WhiteBalance || '').trim(),
    flash: String(exif.Flash || '').trim(),
    colorSpace: String(exif.ColorSpace || icc.ProfileDescription || '').trim(),
    gps:
      lat !== null && lon !== null && Number.isFinite(lat) && Number.isFinite(lon)
        ? { latitude: lat, longitude: lon, altitude: alt }
        : null,
    shutter,
    groups,
    allEntries,
    makerNoteBytes,
    hasExif: Object.keys(exif).length > 0 || Object.keys(ifd0).length > 0,
    hasXmp: Object.keys(xmp).length > 0 || xmpXml.length > 0,
    hasIptc: Object.keys(iptc).length > 0,
    hasIcc: Object.keys(icc).length > 0,
  };
}

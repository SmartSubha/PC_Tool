import React, { useEffect, useRef, useState } from 'react';
import {
  Upload,
  Download,
  Printer,
  RefreshCw,
  CheckCircle2,
  SlidersHorizontal,
  Crop,
  RotateCw,
  ScanLine,
  Eraser,
  Pipette,
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { printImageOnA4 } from '../../utils/printHelper';
import { PhotoSignatureCombiner } from './PhotoSignatureCombiner';
import { DocWatermarkProtector } from './DocWatermarkProtector';
import { BgRemoverWorkspace } from './BgRemoverWorkspace';
import { BatchImageFixer } from './BatchImageFixer';
import { DocStampSignPlacer } from './DocStampSignPlacer';

interface ImageToolsWorkspaceProps {
  toolId: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to export image'));
      },
      mime,
      quality
    );
  });
}

export const ImageToolsWorkspace: React.FC<ImageToolsWorkspaceProps> = ({ toolId }) => {
  if (toolId === 'photo-signature-combiner') {
    return <PhotoSignatureCombiner />;
  }
  if (toolId === 'doc-watermark-protector') {
    return <DocWatermarkProtector />;
  }
  if (toolId === 'bg-remover') {
    return <BgRemoverWorkspace />;
  }
  if (toolId === 'batch-image-fixer') {
    return <BatchImageFixer />;
  }
  if (toolId === 'doc-stamp-sign-placer') {
    return <DocStampSignPlacer />;
  }
  return <StandardImageToolsWorkspace toolId={toolId} />;
};

const StandardImageToolsWorkspace: React.FC<ImageToolsWorkspaceProps> = ({ toolId }) => {
  const [files, setFiles] = useState<{ file: File; url: string; width: number; height: number }[]>([]);
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultSize, setResultSize] = useState<number>(0);
  const [resultMime, setResultMime] = useState<string>('image/jpeg');
  const [statusMsg, setStatusMsg] = useState<string>('');

  // Compress Image state
  const [targetKb, setTargetKb] = useState<number>(50);
  const [quality, setQuality] = useState<number>(80);
  const [compressMode, setCompressMode] = useState<'exact-kb' | 'quality'>('exact-kb');

  // Resize / Increase state
  const [targetWidth, setTargetWidth] = useState<number>(413);
  const [targetHeight, setTargetHeight] = useState<number>(531);
  const [lockAspect, setLockAspect] = useState<boolean>(true);
  const [outputFormat, setOutputFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf'>('image/jpeg');
  const [minKbTarget, setMinKbTarget] = useState<number>(80);
  const [upscaleFactor, setUpscaleFactor] = useState<number>(2);

  // Passport Photo + Free-Size 4-Edge Crop + Rotate/Brightness/Contrast + Paper Size + Name & Date
  const [passportPreset, setPassportPreset] = useState<'35x45' | '20x25' | '25x35' | '51x51' | 'free'>('35x45');
  const [edgeCrop, setEdgeCrop] = useState<{ left: number; right: number; top: number; bottom: number }>({
    left: 0,
    right: 100,
    top: 0,
    bottom: 100,
  });
  const [freeColsPerRow, setFreeColsPerRow] = useState<number>(2);
  const [freeTileWidthPct, setFreeTileWidthPct] = useState<number>(44);
  const [paperSize, setPaperSize] = useState<'A4' | '4x6'>('A4');
  const [photoBgColor, setPhotoBgColor] = useState<string>('#ffffff');
  const [sheetCount, setSheetCount] = useState<number>(8);
  const [addBorder, setAddBorder] = useState<boolean>(true);
  const [rotateDeg, setRotateDeg] = useState<number>(0);
  const [brightnessPct, setBrightnessPct] = useState<number>(100);
  const [contrastPct, setContrastPct] = useState<number>(100);
  const [showNameDate, setShowNameDate] = useState<boolean>(false);
  const [photoNameText, setPhotoNameText] = useState<string>('');
  const [photoDateText, setPhotoDateText] = useState<string>('');
  const [passportRemoveBg, setPassportRemoveBg] = useState<boolean>(false);
  const [passportBgTolerance, setPassportBgTolerance] = useState<number>(36);
  const [passportSampleRgb, setPassportSampleRgb] = useState<[number, number, number] | null>(null);
  const [passportPickingBg, setPassportPickingBg] = useState<boolean>(false);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [cropRegion, setCropRegion] = useState<{ x: number; y: number; size: number }>({
    x: 15,
    y: 5,
    size: 70,
  });
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const cropImgRef = useRef<HTMLDivElement | null>(null);

  // Document Scan & High-Contrast B&W Cleaner state
  const [scanMode, setScanMode] = useState<'bw-threshold' | 'clean-doc' | 'grayscale'>('bw-threshold');
  const [scanThreshold, setScanThreshold] = useState<number>(145);
  const [scanContrast, setScanContrast] = useState<number>(155);
  const [scanBrightness, setScanBrightness] = useState<number>(112);

  // Converter batch outputs
  const [convertedItems, setConvertedItems] = useState<{ name: string; url: string; size: number }[]>([]);

  const primaryFile = files[0] || null;

  useEffect(() => {
    setResultUrl(null);
    setSheetUrl(null);
    setConvertedItems([]);
    setStatusMsg('');
    setPassportRemoveBg(false);
    setPassportBgTolerance(36);
    setPassportSampleRgb(null);
    setPassportPickingBg(false);
    setRotateDeg(0);
    setBrightnessPct(100);
    setContrastPct(100);
    setEdgeCrop({ left: 0, right: 100, top: 0, bottom: 100 });
  }, [toolId]);

  const passportDims = {
    '35x45': { w: 413, h: 531, label: '35×45 mm' },
    '20x25': { w: 236, h: 295, label: '20×25 mm' },
    '25x35': { w: 295, h: 413, label: '25×35 mm' },
    '51x51': { w: 600, h: 600, label: '2×2 inch' },
    free: { w: 600, h: 600, label: 'Free Size (Custom)' },
  }[passportPreset];

  const getCropBoxPercent = () => {
    if (passportPreset === 'free') {
      const x = Math.max(0, Math.min(95, edgeCrop.left));
      const y = Math.max(0, Math.min(95, edgeCrop.top));
      const w = Math.max(5, Math.min(100 - x, edgeCrop.right - x));
      const h = Math.max(5, Math.min(100 - y, edgeCrop.bottom - y));
      return { x, y, w, h };
    }
    if (!primaryFile) return { x: cropRegion.x, y: cropRegion.y, w: cropRegion.size, h: cropRegion.size };
    const imgRatio = primaryFile.width / primaryFile.height;
    const targetRatio = passportDims.w / passportDims.h;
    const wPct = Math.min(100, Math.max(15, cropRegion.size));
    let hPct = wPct * (imgRatio / targetRatio);
    let finalWPct = wPct;
    if (hPct > 100) {
      hPct = 100;
      finalWPct = hPct * (targetRatio / imgRatio);
    }
    const maxX = Math.max(0, 100 - finalWPct);
    const maxY = Math.max(0, 100 - hPct);
    return {
      x: Math.min(maxX, Math.max(0, cropRegion.x)),
      y: Math.min(maxY, Math.max(0, cropRegion.y)),
      w: finalWPct,
      h: hPct,
    };
  };

  const handleCropPointerMove = (clientX: number, clientY: number) => {
    if (!cropImgRef.current || !primaryFile) return;
    if (passportPreset === 'free') {
      const rect = cropImgRef.current.getBoundingClientRect();
      const box = getCropBoxPercent();
      const px = ((clientX - rect.left) / rect.width) * 100;
      const py = ((clientY - rect.top) / rect.height) * 100;
      const newX = Math.round(Math.min(100 - box.w, Math.max(0, px - box.w / 2)));
      const newY = Math.round(Math.min(100 - box.h, Math.max(0, py - box.h / 2)));
      setEdgeCrop({
        left: newX,
        right: Math.min(100, Math.round(newX + box.w)),
        top: newY,
        bottom: Math.min(100, Math.round(newY + box.h)),
      });
      return;
    }
    const rect = cropImgRef.current.getBoundingClientRect();
    const box = getCropBoxPercent();
    const px = ((clientX - rect.left) / rect.width) * 100;
    const py = ((clientY - rect.top) / rect.height) * 100;
    const newX = Math.min(100 - box.w, Math.max(0, px - box.w / 2));
    const newY = Math.min(100 - box.h, Math.max(0, py - box.h / 2));
    setCropRegion((prev) => ({ ...prev, x: Math.round(newX), y: Math.round(newY) }));
  };

  const handleFileInput = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const loaded: { file: File; url: string; width: number; height: number }[] = [];
    for (const file of Array.from(fileList)) {
      const url = URL.createObjectURL(file);
      try {
        const img = await loadImageElement(url);
        loaded.push({ file, url, width: img.naturalWidth, height: img.naturalHeight });
      } catch {
        // skip invalid
      }
    }
    if (loaded.length > 0) {
      setFiles(loaded);
      setResultUrl(null);
      setSheetUrl(null);
      setConvertedItems([]);
      setStatusMsg('');
      setPassportSampleRgb(null);
      setPassportPickingBg(false);
      setCropRegion({ x: 15, y: 5, size: 70 });
      setEdgeCrop({ left: 0, right: 100, top: 0, bottom: 100 });
      if (toolId === 'resize-image') {
        setTargetWidth(loaded[0].width);
        setTargetHeight(loaded[0].height);
      }
      if (toolId === 'increase-image-size') {
        setTargetWidth(loaded[0].width * 2);
        setTargetHeight(loaded[0].height * 2);
      }
    }
  };

  // Compress Image handler
  const runCompress = async () => {
    if (!primaryFile) return;
    setProcessing(true);
    setStatusMsg('');
    try {
      const img = await loadImageElement(primaryFile.url);
      const canvas = document.createElement('canvas');
      let scale = 1;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      let bestBlob: Blob | null = null;
      if (compressMode === 'quality') {
        bestBlob = await canvasToBlob(canvas, 'image/jpeg', quality / 100);
      } else {
        const targetBytes = Math.max(5, targetKb) * 1024;
        for (let attempt = 0; attempt < 4; attempt++) {
          const w = Math.max(80, Math.round(img.naturalWidth * scale));
          const h = Math.max(80, Math.round(img.naturalHeight * scale));
          canvas.width = w;
          canvas.height = h;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);

          let low = 0.05;
          let high = 0.96;
          let candidate: Blob | null = null;
          for (let i = 0; i < 8; i++) {
            const mid = (low + high) / 2;
            const blob = await canvasToBlob(canvas, 'image/jpeg', mid);
            if (blob.size <= targetBytes) {
              candidate = blob;
              low = mid;
            } else {
              high = mid;
            }
          }
          if (candidate) {
            bestBlob = candidate;
            break;
          }
          bestBlob = await canvasToBlob(canvas, 'image/jpeg', 0.08);
          scale *= 0.72;
        }
      }

      if (bestBlob) {
        setResultUrl(URL.createObjectURL(bestBlob));
        setResultSize(bestBlob.size);
        setResultMime('image/jpeg');
        setStatusMsg(`Compressed to ${formatBytes(bestBlob.size)}`);
      }
    } finally {
      setProcessing(false);
    }
  };

  // Resize Image handler
  const runResize = async () => {
    if (!primaryFile) return;
    setProcessing(true);
    try {
      const img = await loadImageElement(primaryFile.url);
      const w = Math.max(10, targetWidth);
      const h = Math.max(10, targetHeight);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      if (outputFormat === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, w, h);

      const mime = outputFormat === 'application/pdf' ? 'image/jpeg' : outputFormat;
      const blob = await canvasToBlob(canvas, mime, 0.92);
      setResultUrl(URL.createObjectURL(blob));
      setResultSize(blob.size);
      setResultMime(mime);
      setStatusMsg(`Resized to ${w} × ${h} px (${formatBytes(blob.size)})`);
    } finally {
      setProcessing(false);
    }
  };

  // Increase Image Size handler
  const runIncreaseSize = async () => {
    if (!primaryFile) return;
    setProcessing(true);
    try {
      const img = await loadImageElement(primaryFile.url);
      const minBytes = Math.max(10, minKbTarget) * 1024;
      let mult = upscaleFactor;
      let blob: Blob | null = null;

      for (let step = 0; step < 5; step++) {
        const w = Math.min(5000, Math.round(img.naturalWidth * mult));
        const h = Math.min(5000, Math.round(img.naturalHeight * mult));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h);

        blob = await canvasToBlob(canvas, 'image/jpeg', 0.99);
        if (blob.size >= minBytes) break;
        mult += 0.65;
      }

      if (blob) {
        setResultUrl(URL.createObjectURL(blob));
        setResultSize(blob.size);
        setResultMime('image/jpeg');
        setStatusMsg(`Generated ${formatBytes(blob.size)} high-detail JPEG`);
      }
    } finally {
      setProcessing(false);
    }
  };

  // Passport Photo / Free Size + Rotate/Brightness/Contrast + Integrated BG Remover + Fill + Name&Date + A4 / 4x6 Sheet
  const runPassportPhoto = async () => {
    if (!primaryFile) return;
    setProcessing(true);
    try {
      const img = await loadImageElement(primaryFile.url);
      const box = getCropBoxPercent();

      // Step 1: Rotate & apply brightness/contrast on intermediate source canvas
      const rotCanvas = document.createElement('canvas');
      rotCanvas.width = img.naturalWidth;
      rotCanvas.height = img.naturalHeight;
      const rCtx = rotCanvas.getContext('2d')!;
      if (!passportRemoveBg) {
        rCtx.fillStyle = photoBgColor;
        rCtx.fillRect(0, 0, rotCanvas.width, rotCanvas.height);
      }
      rCtx.filter = `brightness(${brightnessPct}%) contrast(${contrastPct}%)`;
      rCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
      rCtx.rotate((rotateDeg * Math.PI) / 180);
      rCtx.drawImage(img, -rotCanvas.width / 2, -rotCanvas.height / 2, rotCanvas.width, rotCanvas.height);

      const sx = (box.x / 100) * rotCanvas.width;
      const sy = (box.y / 100) * rotCanvas.height;
      const sw = Math.max(10, (box.w / 100) * rotCanvas.width);
      const sh = Math.max(10, (box.h / 100) * rotCanvas.height);

      // Preserve exact custom aspect ratio when Free Size is selected (zero half-cutting!)
      let targetOutW = passportDims.w;
      let targetOutH = passportDims.h;
      if (passportPreset === 'free') {
        targetOutW = Math.min(1200, Math.max(160, Math.round(sw)));
        targetOutH = Math.max(80, Math.round((targetOutW * sh) / sw));
      }

      // Step 2: Extract cropped region into single canvas (with optional BG removal + color fill)
      const singleCanvas = document.createElement('canvas');
      singleCanvas.width = targetOutW;
      singleCanvas.height = targetOutH;
      const sCtx = singleCanvas.getContext('2d')!;
      sCtx.fillStyle = photoBgColor;
      sCtx.fillRect(0, 0, targetOutW, targetOutH);

      if (passportRemoveBg) {
        const fgCanvas = document.createElement('canvas');
        fgCanvas.width = targetOutW;
        fgCanvas.height = targetOutH;
        const fgCtx = fgCanvas.getContext('2d')!;
        fgCtx.drawImage(rotCanvas, sx, sy, sw, sh, 0, 0, targetOutW, targetOutH);

        const cw = fgCanvas.width;
        const ch = fgCanvas.height;
        const imgData = fgCtx.getImageData(0, 0, cw, ch);
        const data = imgData.data;

        const topRightOffset = (cw - 1) * 4;
        const ref: [number, number, number] = passportSampleRgb || [
          Math.round((data[0] + data[topRightOffset]) / 2),
          Math.round((data[1] + data[topRightOffset + 1]) / 2),
          Math.round((data[2] + data[topRightOffset + 2]) / 2),
        ];

        const maxDist = passportBgTolerance * 2.2;
        const visited = new Uint8Array(cw * ch);
        const queue = new Int32Array(cw * ch);
        let head = 0;
        let tail = 0;

        const pushIfMatch = (x: number, y: number) => {
          const idx = y * cw + x;
          if (visited[idx]) return;
          const p = idx * 4;
          if (data[p + 3] === 0) {
            visited[idx] = 1;
            queue[tail++] = idx;
            return;
          }
          const dist = Math.sqrt(
            (data[p] - ref[0]) ** 2 + (data[p + 1] - ref[1]) ** 2 + (data[p + 2] - ref[2]) ** 2
          );
          if (dist <= maxDist) {
            visited[idx] = 1;
            queue[tail++] = idx;
          }
        };

        for (let x = 0; x < cw; x++) {
          pushIfMatch(x, 0);
        }
        const sideLimit = Math.floor(ch * 0.72);
        for (let y = 0; y < sideLimit; y++) {
          pushIfMatch(0, y);
          pushIfMatch(cw - 1, y);
        }

        while (head < tail) {
          const idx = queue[head++];
          const p = idx * 4;
          data[p + 3] = 0;
          const x = idx % cw;
          const y = (idx - x) / cw;
          if (x > 0) pushIfMatch(x - 1, y);
          if (x < cw - 1) pushIfMatch(x + 1, y);
          if (y > 0) pushIfMatch(x, y - 1);
          if (y < ch - 1) pushIfMatch(x, y + 1);
        }

        const featherLimit = passportBgTolerance * 2.95;
        for (let y = 1; y < ch - 1; y++) {
          for (let x = 1; x < cw - 1; x++) {
            const idx = y * cw + x;
            if (visited[idx]) continue;
            const touchesBg =
              visited[idx - 1] || visited[idx + 1] || visited[idx - cw] || visited[idx + cw];
            if (touchesBg) {
              const p = idx * 4;
              const dist = Math.sqrt(
                (data[p] - ref[0]) ** 2 + (data[p + 1] - ref[1]) ** 2 + (data[p + 2] - ref[2]) ** 2
              );
              if (dist <= featherLimit) {
                data[p + 3] = Math.min(data[p + 3], 125);
              }
            }
          }
        }

        fgCtx.putImageData(imgData, 0, 0);
        sCtx.drawImage(fgCanvas, 0, 0);
      } else {
        sCtx.drawImage(rotCanvas, sx, sy, sw, sh, 0, 0, targetOutW, targetOutH);
      }

      // Optional Name + Date bottom white slate strip
      if (showNameDate && (photoNameText.trim() || photoDateText.trim())) {
        const stripH = Math.max(36, Math.round(targetOutH * 0.16));
        sCtx.fillStyle = '#ffffff';
        sCtx.fillRect(0, targetOutH - stripH, targetOutW, stripH);
        sCtx.strokeStyle = '#cbd5e1';
        sCtx.lineWidth = 2;
        sCtx.beginPath();
        sCtx.moveTo(0, targetOutH - stripH);
        sCtx.lineTo(targetOutW, targetOutH - stripH);
        sCtx.stroke();

        sCtx.fillStyle = '#0f172a';
        sCtx.textAlign = 'center';
        const hasBoth = Boolean(photoNameText.trim() && photoDateText.trim());
        const fontSize = Math.max(14, Math.min(34, Math.round(targetOutW * 0.068)));
        sCtx.font = `700 ${fontSize}px sans-serif`;
        if (hasBoth) {
          sCtx.fillText(photoNameText.trim().toUpperCase(), targetOutW / 2, targetOutH - stripH * 0.54);
          sCtx.font = `700 ${Math.round(fontSize * 0.88)}px sans-serif`;
          sCtx.fillText(photoDateText.trim().toUpperCase(), targetOutW / 2, targetOutH - stripH * 0.16);
        } else {
          const singleLine = (photoNameText.trim() || photoDateText.trim()).toUpperCase();
          sCtx.fillText(singleLine, targetOutW / 2, targetOutH - stripH * 0.34);
        }
      }

      if (addBorder) {
        sCtx.strokeStyle = '#0f172a';
        sCtx.lineWidth = Math.max(2, Math.round(Math.min(targetOutW, targetOutH) * 0.008));
        sCtx.strokeRect(2, 2, targetOutW - 4, targetOutH - 4);
      }

      const singleBlob = await canvasToBlob(singleCanvas, 'image/jpeg', 0.95);
      setResultUrl(URL.createObjectURL(singleBlob));
      setResultSize(singleBlob.size);
      setResultMime('image/jpeg');

      // Step 3: Build print sheet (A4 = 1654x2339 @ 200 DPI, 4x6 (4R) = 1200x1800 @ 300 DPI)
      const is4x6 = paperSize === '4x6';
      const sheetW = is4x6 ? 1200 : 1654;
      const sheetH = is4x6 ? 1800 : 2339;
      const pad = is4x6 ? 40 : 50;
      const gap = is4x6 ? 22 : 26;

      const sheet = document.createElement('canvas');
      sheet.width = sheetW;
      sheet.height = sheetH;
      const shCtx = sheet.getContext('2d')!;
      shCtx.fillStyle = '#ffffff';
      shCtx.fillRect(0, 0, sheetW, sheetH);

      let cellW = 0;
      let cellH = 0;

      if (passportPreset === 'free') {
        const usableW = sheetW - pad * 2;
        const usableH = sheetH - pad * 2;
        if (freeColsPerRow > 0) {
          cellW = Math.floor((usableW - gap * (freeColsPerRow - 1)) / freeColsPerRow);
        } else {
          cellW = Math.floor(usableW * (freeTileWidthPct / 100));
        }
        cellH = Math.round((cellW * targetOutH) / targetOutW);
        if (cellH > usableH) {
          cellH = usableH;
          cellW = Math.round((cellH * targetOutW) / targetOutH);
        }
      } else {
        const scaleFactor = is4x6
          ? passportPreset === '51x51'
            ? 0.85
            : 0.95
          : passportPreset === '51x51'
          ? 0.56
          : 0.66;
        cellW = Math.round(targetOutW * scaleFactor);
        cellH = Math.round(targetOutH * scaleFactor);
      }

      const cols = Math.max(1, Math.floor((sheetW - pad * 2 + gap) / (cellW + gap)));
      const maxRows = Math.max(1, Math.floor((sheetH - pad * 2 + gap) / (cellH + gap)));
      const maxFitPerPage = cols * maxRows;
      const clampedCopies = Math.max(1, Math.min(maxFitPerPage, sheetCount));

      for (let i = 0; i < clampedCopies; i++) {
        const r = Math.floor(i / cols);
        const c = i % cols;
        const x = pad + c * (cellW + gap);
        const y = pad + r * (cellH + gap);
        if (y + cellH > sheetH - pad + 4) break;
        shCtx.drawImage(singleCanvas, x, y, cellW, cellH);
      }

      const sheetBlob = await canvasToBlob(sheet, 'image/jpeg', 0.96);
      setSheetUrl(sheet.toDataURL('image/jpeg', 0.96));
      setStatusMsg(
        `Generated ${passportPreset === 'free' ? 'Free Size' : passportDims.label} + ${paperSize === '4x6' ? '4×6 (4R)' : 'A4'} sheet (${clampedCopies} of max ${maxFitPerPage} fitting copies · ${formatBytes(sheetBlob.size)})`
      );
    } finally {
      setProcessing(false);
    }
  };

  // Document Scan & High-Contrast B&W Cleaner
  const runDocScanner = async () => {
    if (!primaryFile) return;
    setProcessing(true);
    try {
      const img = await loadImageElement(primaryFile.url);
      const maxDim = 2200;
      const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.filter = `brightness(${scanBrightness}%) contrast(${scanContrast}%)`;
      ctx.drawImage(img, 0, 0, w, h);
      ctx.filter = 'none';

      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      for (let i = 0; i < data.length; i += 4) {
        const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        if (scanMode === 'bw-threshold') {
          const val = lum >= scanThreshold ? 255 : Math.max(0, Math.round((lum / scanThreshold) * 45));
          data[i] = val;
          data[i + 1] = val;
          data[i + 2] = val;
        } else if (scanMode === 'clean-doc') {
          // Whiten light grey shadows while keeping dark ink & blue stamps crisp
          if (lum >= scanThreshold + 25) {
            data[i] = 255;
            data[i + 1] = 255;
            data[i + 2] = 255;
          } else {
            data[i] = Math.max(0, data[i] - 18);
            data[i + 1] = Math.max(0, data[i + 1] - 18);
            data[i + 2] = Math.max(0, data[i + 2] - 18);
          }
        } else {
          const g = lum >= 220 ? 255 : Math.round(lum);
          data[i] = g;
          data[i + 1] = g;
          data[i + 2] = g;
        }
      }

      ctx.putImageData(imgData, 0, 0);
      const blob = await canvasToBlob(canvas, 'image/jpeg', 0.94);
      setResultUrl(canvas.toDataURL('image/jpeg', 0.94));
      setResultSize(blob.size);
      setResultMime('image/jpeg');
      setStatusMsg(`Document cleaned (${w} × ${h} px · ${formatBytes(blob.size)})`);
    } finally {
      setProcessing(false);
    }
  };

  // Universal Converter
  const runConvert = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    try {
      if (outputFormat === 'application/pdf') {
        const pdfDoc = await PDFDocument.create();
        for (const item of files) {
          const img = await loadImageElement(item.url);
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d')!;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          const jpgBlob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
          const bytes = await jpgBlob.arrayBuffer();
          const embedded = await pdfDoc.embedJpg(bytes);
          const page = pdfDoc.addPage([embedded.width, embedded.height]);
          page.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height });
        }
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
        setConvertedItems([
          {
            name: `${files[0].file.name.replace(/\.[^.]+$/, '')}.pdf`,
            url: URL.createObjectURL(blob),
            size: blob.size,
          },
        ]);
        setStatusMsg(`Converted ${files.length} image(s) into PDF`);
      } else {
        const ext = outputFormat === 'image/png' ? 'png' : outputFormat === 'image/webp' ? 'webp' : 'jpg';
        const out: { name: string; url: string; size: number }[] = [];
        for (const item of files) {
          const img = await loadImageElement(item.url);
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d')!;
          if (outputFormat === 'image/jpeg') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          ctx.drawImage(img, 0, 0);
          const blob = await canvasToBlob(canvas, outputFormat, 0.92);
          out.push({
            name: `${item.file.name.replace(/\.[^.]+$/, '')}.${ext}`,
            url: URL.createObjectURL(blob),
            size: blob.size,
          });
        }
        setConvertedItems(out);
        setStatusMsg(`Converted ${out.length} file(s) to ${ext.toUpperCase()}`);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handlePassportSamplePick = async (clientX: number, clientY: number) => {
    if (!cropImgRef.current || !primaryFile) return;
    const rect = cropImgRef.current.getBoundingClientRect();
    const rx = (clientX - rect.left) / rect.width;
    const ry = (clientY - rect.top) / rect.height;
    const img = await loadImageElement(primaryFile.url);
    const rotCanvas = document.createElement('canvas');
    rotCanvas.width = img.naturalWidth;
    rotCanvas.height = img.naturalHeight;
    const rCtx = rotCanvas.getContext('2d')!;
    rCtx.filter = `brightness(${brightnessPct}%) contrast(${contrastPct}%)`;
    rCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
    rCtx.rotate((rotateDeg * Math.PI) / 180);
    rCtx.drawImage(img, -rotCanvas.width / 2, -rotCanvas.height / 2, rotCanvas.width, rotCanvas.height);

    const px = Math.min(rotCanvas.width - 1, Math.max(0, Math.floor(rx * rotCanvas.width)));
    const py = Math.min(rotCanvas.height - 1, Math.max(0, Math.floor(ry * rotCanvas.height)));
    const d = rCtx.getImageData(px, py, 1, 1).data;
    setPassportSampleRgb([d[0], d[1], d[2]]);
    setPassportRemoveBg(true);
    setPassportPickingBg(false);
  };

  const downloadExt = resultMime === 'image/png' ? 'png' : resultMime === 'image/webp' ? 'webp' : 'jpg';
  const activeCropBox = getCropBoxPercent();

  return (
    <div className="space-y-6">
      {/* Upload Dropzone */}
      <label className="block border-2 border-dashed border-violet-300 dark:border-violet-700 hover:border-violet-500 bg-violet-50/50 dark:bg-violet-950/30 rounded-2xl p-8 text-center cursor-pointer transition-colors no-print">
        <input
          type="file"
          accept="image/*"
          multiple={toolId === 'universal-converter'}
          onChange={(e) => handleFileInput(e.target.files)}
          className="hidden"
        />
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-violet-500/25">
          <Upload className="w-6 h-6" />
        </div>
        <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
          {primaryFile
            ? `${files.length} file(s) selected — click to replace`
            : 'Click to upload an image (JPG, PNG, WEBP)'}
        </div>
        {primaryFile && (
          <div className="mt-1 text-xs text-slate-600 dark:text-slate-400 tabular-nums">
            {primaryFile.file.name} · {primaryFile.width} × {primaryFile.height} px ·{' '}
            {formatBytes(primaryFile.file.size)}
          </div>
        )}
      </label>

      {primaryFile && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 no-print shadow-xs">
            <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
              <SlidersHorizontal className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              <span>Tool Settings</span>
            </div>

            {toolId === 'image-compress' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setCompressMode('exact-kb')}
                    className={`py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      compressMode === 'exact-kb'
                        ? 'bg-white dark:bg-slate-900 text-violet-700 dark:text-violet-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Target Exact KB
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompressMode('quality')}
                    className={`py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      compressMode === 'quality'
                        ? 'bg-white dark:bg-slate-900 text-violet-700 dark:text-violet-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    By Quality %
                  </button>
                </div>

                {compressMode === 'exact-kb' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Maximum File Size (KB)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={5000}
                      value={targetKb}
                      onChange={(e) => setTargetKb(Number(e.target.value) || 20)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm tabular-nums focus:outline-none focus:border-violet-500"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {[20, 30, 50, 100, 200].map((kb) => (
                        <button
                          key={kb}
                          type="button"
                          onClick={() => setTargetKb(kb)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                            targetKb === kb
                              ? 'bg-violet-600 text-white border-violet-600'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          {kb} KB
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      <span>JPEG Quality</span>
                      <span className="tabular-nums">{quality}%</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={95}
                      value={quality}
                      onChange={(e) => setQuality(Number(e.target.value))}
                      className="w-full accent-violet-600"
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={runCompress}
                  disabled={processing}
                  className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors cursor-pointer disabled:opacity-60"
                >
                  {processing ? 'Compressing...' : 'Compress Image'}
                </button>
              </div>
            )}

            {toolId === 'passport-size-photo' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Photo Size Preset
                    </label>
                    <select
                      value={passportPreset}
                      onChange={(e) => setPassportPreset(e.target.value as typeof passportPreset)}
                      className="w-full px-2.5 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs font-semibold focus:outline-none focus:border-violet-500"
                    >
                      <option value="35x45">Passport (35×45 mm)</option>
                      <option value="25x35">PAN Size (25×35 mm)</option>
                      <option value="20x25">Stamp (20×25 mm)</option>
                      <option value="51x51">Square (2×2 in)</option>
                      <option value="free">Free Size (Custom Edges · কাটা ছাড়া)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Print Paper Size
                    </label>
                    <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                      <button
                        type="button"
                        onClick={() => {
                          setPaperSize('A4');
                          if (sheetCount > 48) setSheetCount(12);
                        }}
                        className={`py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                          paperSize === 'A4'
                            ? 'bg-violet-600 text-white shadow-xs'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        A4
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPaperSize('4x6');
                          setSheetCount((prev) => Math.min(12, Math.max(1, prev)));
                        }}
                        className={`py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                          paperSize === '4x6'
                            ? 'bg-violet-600 text-white shadow-xs'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        4×6 (4R)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Alert if standard passport crop clips wide/tall images significantly */}
                {passportPreset !== 'free' &&
                  primaryFile &&
                  (primaryFile.width / primaryFile.height > (passportDims.w / passportDims.h) * 1.35 ||
                    passportDims.w / passportDims.h > (primaryFile.width / primaryFile.height) * 1.35) && (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/45 border border-amber-300 dark:border-amber-700 text-[11px] text-amber-950 dark:text-amber-200 flex items-center justify-between gap-2">
                      <span>
                        ছবিটি চওড়া/লম্বা — Passport অনুপাতে পাশ থেকে কিছুটা কাটবে। পুরো ছবি চাইলে Free Size ব্যবহার করুন।
                      </span>
                      <button
                        type="button"
                        onClick={() => setPassportPreset('free')}
                        className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold shrink-0 cursor-pointer hover:bg-amber-700"
                      >
                        Switch Free Size
                      </button>
                    </div>
                  )}

                {/* Interactive Crop Part Controls (Standard Aspect vs Free Size 4-Edge) */}
                {passportPreset === 'free' ? (
                  <div className="p-3.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-200">
                        <Crop className="w-3.5 h-3.5" />
                        <span>Free Size 4-Edge Crop (৪ দিক ইচ্ছামতো কাটুন)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEdgeCrop({ left: 0, right: 100, top: 0, bottom: 100 })}
                        className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 hover:underline cursor-pointer"
                      >
                        Full Image
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          <span>Left Edge</span>
                          <span className="tabular-nums">{edgeCrop.left}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={Math.max(0, edgeCrop.right - 10)}
                          value={edgeCrop.left}
                          onChange={(e) =>
                            setEdgeCrop((p) => ({ ...p, left: Number(e.target.value) }))
                          }
                          className="w-full accent-indigo-600"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          <span>Right Edge</span>
                          <span className="tabular-nums">{edgeCrop.right}%</span>
                        </div>
                        <input
                          type="range"
                          min={Math.min(100, edgeCrop.left + 10)}
                          max={100}
                          value={edgeCrop.right}
                          onChange={(e) =>
                            setEdgeCrop((p) => ({ ...p, right: Number(e.target.value) }))
                          }
                          className="w-full accent-indigo-600"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          <span>Top Edge</span>
                          <span className="tabular-nums">{edgeCrop.top}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={Math.max(0, edgeCrop.bottom - 10)}
                          value={edgeCrop.top}
                          onChange={(e) =>
                            setEdgeCrop((p) => ({ ...p, top: Number(e.target.value) }))
                          }
                          className="w-full accent-indigo-600"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          <span>Bottom Edge</span>
                          <span className="tabular-nums">{edgeCrop.bottom}%</span>
                        </div>
                        <input
                          type="range"
                          min={Math.min(100, edgeCrop.top + 10)}
                          max={100}
                          value={edgeCrop.bottom}
                          onChange={(e) =>
                            setEdgeCrop((p) => ({ ...p, bottom: Number(e.target.value) }))
                          }
                          className="w-full accent-indigo-600"
                        />
                      </div>
                    </div>

                    <div className="pt-1 border-t border-indigo-200/70 dark:border-indigo-800/70 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        <span>Columns on Sheet (পাশাপাশি কয়টি ছবি):</span>
                      </div>
                      <div className="grid grid-cols-5 gap-1">
                        {[
                          { v: 1, l: '1/row' },
                          { v: 2, l: '2/row' },
                          { v: 3, l: '3/row' },
                          { v: 4, l: '4/row' },
                          { v: 0, l: 'Custom' },
                        ].map((opt) => (
                          <button
                            key={opt.v}
                            type="button"
                            onClick={() => setFreeColsPerRow(opt.v)}
                            className={`py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                              freeColsPerRow === opt.v
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {opt.l}
                          </button>
                        ))}
                      </div>
                      {freeColsPerRow === 0 && (
                        <div>
                          <div className="flex justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                            <span>Custom Print Width</span>
                            <span className="tabular-nums">{freeTileWidthPct}%</span>
                          </div>
                          <input
                            type="range"
                            min={15}
                            max={96}
                            value={freeTileWidthPct}
                            onChange={(e) => setFreeTileWidthPct(Number(e.target.value))}
                            className="w-full accent-indigo-600"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-violet-50/70 dark:bg-violet-950/35 border border-violet-200 dark:border-violet-800 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-violet-900 dark:text-violet-200">
                      <Crop className="w-3.5 h-3.5" />
                      <span>Photo Crop &amp; Select Part (drag on preview)</span>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                        <span>Crop Box Zoom</span>
                        <span className="tabular-nums">{cropRegion.size}%</span>
                      </div>
                      <input
                        type="range"
                        min={20}
                        max={100}
                        value={cropRegion.size}
                        onChange={(e) => setCropRegion((prev) => ({ ...prev, size: Number(e.target.value) }))}
                        className="w-full accent-violet-600"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                          <span>Left (X)</span>
                          <span className="tabular-nums">{Math.round(activeCropBox.x)}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={95}
                          value={cropRegion.x}
                          onChange={(e) => setCropRegion((prev) => ({ ...prev, x: Number(e.target.value) }))}
                          className="w-full accent-violet-600"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                          <span>Top (Y)</span>
                          <span className="tabular-nums">{Math.round(activeCropBox.y)}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={95}
                          value={cropRegion.y}
                          onChange={(e) => setCropRegion((prev) => ({ ...prev, y: Number(e.target.value) }))}
                          className="w-full accent-violet-600"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Integrated Background Remover + Studio Color Fill */}
                <div className="p-3.5 rounded-xl bg-emerald-50/75 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-xs font-extrabold text-emerald-950 dark:text-emerald-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={passportRemoveBg}
                        onChange={(e) => {
                          setPassportRemoveBg(e.target.checked);
                          if (!e.target.checked) setPassportPickingBg(false);
                        }}
                        className="accent-emerald-600 w-4 h-4"
                      />
                      <Eraser className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Auto Remove &amp; Replace BG</span>
                    </label>
                    {passportSampleRgb && (
                      <button
                        type="button"
                        onClick={() => setPassportSampleRgb(null)}
                        className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer"
                      >
                        Reset Sample
                      </button>
                    )}
                  </div>

                  {passportRemoveBg && (
                    <div className="space-y-2.5 pt-1 border-t border-emerald-200/80 dark:border-emerald-800/70">
                      <div>
                        <div className="flex justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                          <span>BG Removal Tolerance</span>
                          <span className="tabular-nums">{passportBgTolerance}</span>
                        </div>
                        <input
                          type="range"
                          min={12}
                          max={85}
                          value={passportBgTolerance}
                          onChange={(e) => setPassportBgTolerance(Number(e.target.value))}
                          className="w-full accent-emerald-600"
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setPassportPickingBg((prev) => !prev)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                            passportPickingBg
                              ? 'bg-emerald-600 text-white border-emerald-600 animate-pulse'
                              : 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100/70'
                          }`}
                        >
                          <Pipette className="w-3.5 h-3.5" />
                          <span>
                            {passportPickingBg
                              ? 'Click background on photo →'
                              : 'Pick BG color from photo'}
                          </span>
                        </button>

                        {passportSampleRgb ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-slate-400 inline-block"
                              style={{
                                backgroundColor: `rgb(${passportSampleRgb[0]}, ${passportSampleRgb[1]}, ${passportSampleRgb[2]})`,
                              }}
                            />
                            Sampled
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Auto corner mode
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Background Fill Color
                    </span>
                    <div className="flex items-center gap-1.5">
                      {[
                        { col: '#ffffff', title: 'Pure White' },
                        { col: '#dbeafe', title: 'Passport Light Blue' },
                        { col: '#0ea5e9', title: 'Studio Sky Blue' },
                        { col: '#e2e8f0', title: 'Soft Grey' },
                        { col: '#dc2626', title: 'Crimson Red' },
                      ].map(({ col, title }) => (
                        <button
                          key={col}
                          type="button"
                          title={title}
                          onClick={() => setPhotoBgColor(col)}
                          style={{ backgroundColor: col }}
                          className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-transform ${
                            photoBgColor.toLowerCase() === col
                              ? 'border-violet-600 dark:border-amber-400 scale-115 ring-2 ring-violet-300 dark:ring-amber-400/40'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                          aria-label={`Color ${title}`}
                        />
                      ))}
                      <label
                        title="Pick custom studio background color"
                        className="relative w-6 h-6 rounded-full border-2 border-slate-400 dark:border-slate-500 overflow-hidden cursor-pointer flex items-center justify-center bg-gradient-to-tr from-rose-500 via-amber-400 to-sky-500"
                      >
                        <input
                          type="color"
                          value={photoBgColor}
                          onChange={(e) => setPhotoBgColor(e.target.value)}
                          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                          aria-label="Custom background fill color"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Fine Rotate + Brightness + Contrast Studio Controls */}
                <div className="p-3.5 rounded-xl bg-sky-50/70 dark:bg-sky-950/35 border border-sky-200 dark:border-sky-800 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-sky-900 dark:text-sky-200">
                    <span className="inline-flex items-center gap-1.5">
                      <RotateCw className="w-3.5 h-3.5" />
                      Rotate, Brightness &amp; Contrast
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setRotateDeg(0);
                        setBrightnessPct(100);
                        setContrastPct(100);
                      }}
                      className="text-[11px] text-sky-700 dark:text-sky-300 hover:underline cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      <span>Rotate Angle (বাঁকা ঠিক করুন)</span>
                      <span className="tabular-nums">{rotateDeg}°</span>
                    </div>
                    <input
                      type="range"
                      min={-15}
                      max={15}
                      step={0.5}
                      value={rotateDeg}
                      onChange={(e) => setRotateDeg(Number(e.target.value))}
                      className="w-full accent-sky-600"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        <span>Brightness</span>
                        <span className="tabular-nums">{brightnessPct}%</span>
                      </div>
                      <input
                        type="range"
                        min={60}
                        max={160}
                        value={brightnessPct}
                        onChange={(e) => setBrightnessPct(Number(e.target.value))}
                        className="w-full accent-sky-600"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        <span>Contrast</span>
                        <span className="tabular-nums">{contrastPct}%</span>
                      </div>
                      <input
                        type="range"
                        min={60}
                        max={160}
                        value={contrastPct}
                        onChange={(e) => setContrastPct(Number(e.target.value))}
                        className="w-full accent-sky-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Custom Copies Input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Custom Copies on {paperSize === '4x6' ? '4×6 (4R)' : 'A4'} Sheet (1–{paperSize === '4x6' ? 16 : 48})
                  </label>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="number"
                      min={1}
                      max={paperSize === '4x6' ? 16 : 48}
                      value={sheetCount}
                      onChange={(e) => {
                        const maxC = paperSize === '4x6' ? 16 : 48;
                        const val = parseInt(e.target.value, 10);
                        setSheetCount(Number.isNaN(val) ? 1 : Math.max(1, Math.min(maxC, val)));
                      }}
                      className="w-24 px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm font-bold tabular-nums focus:outline-none focus:border-violet-500"
                    />
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      copies on {paperSize === '4x6' ? '4×6 photo paper' : 'A4 sheet'}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {(paperSize === '4x6' ? [4, 6, 8, 9, 12] : [4, 8, 12, 24, 36]).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setSheetCount(n)}
                        className={`py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                          sheetCount === n
                            ? 'bg-violet-600 text-white border-violet-600'
                            : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name + Date on Photo Option */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showNameDate}
                      onChange={(e) => setShowNameDate(e.target.checked)}
                      className="accent-violet-600"
                    />
                    Print Name &amp; Date on Photo Bottom (ছবির নিচে নাম ও তারিখ)
                  </label>
                  {showNameDate && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <input
                        type="text"
                        value={photoNameText}
                        onChange={(e) => setPhotoNameText(e.target.value)}
                        placeholder="Candidate Name"
                        className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        value={photoDateText}
                        onChange={(e) => setPhotoDateText(e.target.value)}
                        placeholder="DOP: DD/MM/YYYY"
                        className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg text-xs"
                      />
                    </div>
                  )}
                </div>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addBorder}
                    onChange={(e) => setAddBorder(e.target.checked)}
                    className="accent-violet-600"
                  />
                  Add clean cut border around each photo
                </label>

                <button
                  type="button"
                  onClick={runPassportPhoto}
                  disabled={processing}
                  className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors cursor-pointer"
                >
                  {processing
                    ? 'Generating...'
                    : `Crop Photo & Generate ${paperSize === '4x6' ? '4×6' : 'A4'} Sheet`}
                </button>
              </div>
            )}

            {toolId === 'doc-scanner-cleaner' && (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 leading-relaxed flex items-start gap-2">
                  <ScanLine className="w-4 h-4 shrink-0 mt-0.5 text-amber-700 dark:text-amber-400" />
                  <span>
                    Turn dim phone camera snaps or signatures into high-contrast clean white-paper scans ready for portals or B&amp;W printing.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Scan Mode
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'bw-threshold', label: 'Crisp B&W' },
                      { id: 'clean-doc', label: 'Clean Color' },
                      { id: 'grayscale', label: 'Grayscale' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setScanMode(m.id as typeof scanMode)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border cursor-pointer ${
                          scanMode === m.id
                            ? 'bg-slate-900 dark:bg-violet-600 text-white border-slate-900 dark:border-violet-600'
                            : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <span>White Paper Threshold (ব্যাকগ্রাউন্ড সাদা)</span>
                    <span className="tabular-nums">{scanThreshold}</span>
                  </div>
                  <input
                    type="range"
                    min={80}
                    max={220}
                    value={scanThreshold}
                    onChange={(e) => setScanThreshold(Number(e.target.value))}
                    className="w-full accent-slate-900 dark:accent-violet-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      <span>Ink Contrast</span>
                      <span className="tabular-nums">{scanContrast}%</span>
                    </div>
                    <input
                      type="range"
                      min={100}
                      max={250}
                      value={scanContrast}
                      onChange={(e) => setScanContrast(Number(e.target.value))}
                      className="w-full accent-slate-900 dark:accent-violet-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      <span>Brightness</span>
                      <span className="tabular-nums">{scanBrightness}%</span>
                    </div>
                    <input
                      type="range"
                      min={80}
                      max={160}
                      value={scanBrightness}
                      onChange={(e) => setScanBrightness(Number(e.target.value))}
                      className="w-full accent-slate-900 dark:accent-violet-500"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={runDocScanner}
                  disabled={processing}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-violet-600 dark:hover:bg-violet-700 text-white text-sm font-bold cursor-pointer"
                >
                  {processing ? 'Cleaning Document...' : 'Clean & Enhance Scan'}
                </button>
              </div>
            )}

            {toolId === 'resize-image' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Portal Quick Presets
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: 'PAN Photo 213×213', w: 213, h: 213 },
                      { label: 'PAN Sign 400×200', w: 400, h: 200 },
                      { label: 'Passport 413×531', w: 413, h: 531 },
                      { label: 'SSC Sign 140×60', w: 140, h: 60 },
                    ].map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => {
                          setLockAspect(false);
                          setTargetWidth(p.w);
                          setTargetHeight(p.h);
                        }}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-violet-950/50 hover:border-violet-300 cursor-pointer"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Width (px)
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={6000}
                      value={targetWidth}
                      onChange={(e) => {
                        const w = Number(e.target.value) || 10;
                        setTargetWidth(w);
                        if (lockAspect && primaryFile) {
                          setTargetHeight(Math.round((w * primaryFile.height) / primaryFile.width));
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Height (px)
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={6000}
                      value={targetHeight}
                      onChange={(e) => {
                        const h = Number(e.target.value) || 10;
                        setTargetHeight(h);
                        if (lockAspect && primaryFile) {
                          setTargetWidth(Math.round((h * primaryFile.width) / primaryFile.height));
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm tabular-nums"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lockAspect}
                    onChange={(e) => setLockAspect(e.target.checked)}
                    className="accent-violet-600"
                  />
                  Lock original aspect ratio
                </label>

                <button
                  type="button"
                  onClick={runResize}
                  disabled={processing}
                  className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold cursor-pointer"
                >
                  Resize Image Now
                </button>
              </div>
            )}

            {toolId === 'increase-image-size' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Minimum Target File Size (KB)
                  </label>
                  <input
                    type="number"
                    min={20}
                    max={5000}
                    value={minKbTarget}
                    onChange={(e) => setMinKbTarget(Number(e.target.value) || 50)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Initial Resolution Upscale
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[1.5, 2, 3].map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setUpscaleFactor(f)}
                        className={`py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                          upscaleFactor === f
                            ? 'bg-violet-600 text-white border-violet-600'
                            : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {f}× Scale
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={runIncreaseSize}
                  disabled={processing}
                  className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold cursor-pointer"
                >
                  Increase Image Size
                </button>
              </div>
            )}

            {toolId === 'universal-converter' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Convert To Format
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { mime: 'image/jpeg', label: 'JPG (.jpg)' },
                      { mime: 'image/png', label: 'PNG (.png)' },
                      { mime: 'image/webp', label: 'WEBP (.webp)' },
                      { mime: 'application/pdf', label: 'PDF (.pdf)' },
                    ].map((fmt) => (
                      <button
                        key={fmt.mime}
                        type="button"
                        onClick={() => setOutputFormat(fmt.mime as typeof outputFormat)}
                        className={`py-2 rounded-xl text-xs font-semibold border cursor-pointer ${
                          outputFormat === fmt.mime
                            ? 'bg-violet-600 text-white border-violet-600'
                            : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {fmt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={runConvert}
                  disabled={processing}
                  className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold cursor-pointer"
                >
                  <span className="inline-flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Convert {files.length} File(s)
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Preview & Download Column */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                {toolId === 'passport-size-photo' ? 'Select Crop Area & Output' : 'Preview & Output'}
              </span>
              {statusMsg && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  {statusMsg}
                </span>
              )}
            </div>

            {toolId === 'universal-converter' ? (
              <div className="space-y-3">
                {convertedItems.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 py-8 text-center">
                    Choose a target format on the left and click Convert.
                  </p>
                ) : (
                  convertedItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    >
                      <div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                          {formatBytes(item.size)}
                        </div>
                      </div>
                      <a
                        href={item.url}
                        download={item.name}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </a>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50 dark:bg-slate-800/70">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                    {toolId === 'passport-size-photo'
                      ? passportPickingBg
                        ? 'Click anywhere on background to sample color'
                        : 'Interactive Crop Selection (Click or Drag)'
                      : `Original (${formatBytes(primaryFile.file.size)})`}
                  </div>
                  {toolId === 'passport-size-photo' ? (
                    <div
                      ref={cropImgRef}
                      onMouseDown={(e) => {
                        if (passportPickingBg) {
                          handlePassportSamplePick(e.clientX, e.clientY);
                          return;
                        }
                        setIsDraggingCrop(true);
                        handleCropPointerMove(e.clientX, e.clientY);
                      }}
                      onMouseMove={(e) => {
                        if (isDraggingCrop && !passportPickingBg) {
                          handleCropPointerMove(e.clientX, e.clientY);
                        }
                      }}
                      onMouseUp={() => setIsDraggingCrop(false)}
                      onMouseLeave={() => setIsDraggingCrop(false)}
                      onTouchStart={(e) => {
                        if (passportPickingBg && e.touches[0]) {
                          handlePassportSamplePick(e.touches[0].clientX, e.touches[0].clientY);
                          return;
                        }
                        setIsDraggingCrop(true);
                        if (e.touches[0]) handleCropPointerMove(e.touches[0].clientX, e.touches[0].clientY);
                      }}
                      onTouchMove={(e) => {
                        if (isDraggingCrop && !passportPickingBg && e.touches[0]) {
                          handleCropPointerMove(e.touches[0].clientX, e.touches[0].clientY);
                        }
                      }}
                      onTouchEnd={() => setIsDraggingCrop(false)}
                      className={`relative inline-block w-full rounded-lg overflow-hidden bg-slate-900 select-none ${
                        passportPickingBg ? 'cursor-crosshair ring-2 ring-emerald-500' : 'cursor-move'
                      }`}
                    >
                      <img
                        src={primaryFile.url}
                        alt="Crop source"
                        style={{
                          transform: `rotate(${rotateDeg}deg)`,
                          filter: `brightness(${brightnessPct}%) contrast(${contrastPct}%)`,
                        }}
                        className="w-full block pointer-events-none transition-transform"
                      />
                      <div
                        style={{
                          left: `${activeCropBox.x}%`,
                          top: `${activeCropBox.y}%`,
                          width: `${activeCropBox.w}%`,
                          height: `${activeCropBox.h}%`,
                        }}
                        className="absolute border-2 border-violet-400 shadow-[0_0_0_9999px_rgba(15,23,42,0.48)] pointer-events-none"
                      >
                        <span className="bg-violet-600 text-white text-[10px] font-bold px-1.5 py-0.5">
                          CROP AREA
                        </span>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={primaryFile.url}
                      alt="Original upload"
                      className="w-full max-h-72 object-contain rounded-lg bg-white"
                    />
                  )}
                </div>

                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50 dark:bg-slate-800/70 flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                      Output {resultSize > 0 ? `(${formatBytes(resultSize)})` : ''}
                    </div>
                    {resultUrl ? (
                      <div
                        className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700"
                        style={{
                          backgroundImage:
                            'linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)',
                          backgroundSize: '16px 16px',
                          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
                        }}
                      >
                        <img
                          src={resultUrl}
                          alt="Processed output"
                          className="w-full max-h-72 object-contain mx-auto"
                        />
                      </div>
                    ) : (
                      <div className="h-56 flex items-center justify-center text-xs text-slate-400 text-center px-4">
                        Adjust settings on the left and click the action button to generate output.
                      </div>
                    )}
                  </div>

                  {resultUrl && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      <a
                        href={resultUrl}
                        download={`${toolId}-output.${downloadExt}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download Image
                      </a>
                      {toolId === 'doc-scanner-cleaner' && (
                        <button
                          type="button"
                          onClick={() => printImageOnA4(resultUrl, 'Cleaned Document Scan', 'A4')}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Print A4
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Printable Sheet Preview for Passport Photo Maker */}
            {sheetUrl && (
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {paperSize === '4x6' ? '4×6 (4R) Photo Paper' : 'A4'} Printable Sheet ({sheetCount} Copies)
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        printImageOnA4(
                          sheetUrl,
                          `Passport Size Photos (${paperSize})`,
                          paperSize
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print {paperSize === '4x6' ? '4×6' : 'A4'}
                    </button>
                    <a
                      href={sheetUrl}
                      download={`passport-photos-${paperSize}-sheet.jpg`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download {paperSize === '4x6' ? '4×6' : 'A4'} Sheet
                    </a>
                  </div>
                </div>
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-white">
                  <img
                    src={sheetUrl}
                    alt="Passport photo print sheet"
                    className="w-full max-h-[420px] object-contain mx-auto"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

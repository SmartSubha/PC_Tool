import React, { useState } from 'react';
import {
  Upload,
  Download,
  Printer,
  RotateCw,
  ArrowUp,
  ArrowDown,
  Trash2,
  CheckCircle2,
  Scissors,
  LayoutGrid,
  AlertTriangle,
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { printMultipleImagesOnA4 } from '../../utils/printHelper';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface SlipItem {
  id: string;
  name: string;
  url: string;
  width: number;
  height: number;
  rotate: 0 | 90 | 180 | 270;
  included: boolean;
}

type XeroxLayoutMode = '2-vertical' | '2-side' | '4-grid' | '6-grid';

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const MultiSlipXeroxSaver: React.FC = () => {
  const [items, setItems] = useState<SlipItem[]>([]);
  const [pdfPassword, setPdfPassword] = useState('');
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [layoutMode, setLayoutMode] = useState<XeroxLayoutMode>('2-vertical');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [inkSaverBw, setInkSaverBw] = useState(false);
  const [bwThreshold, setBwThreshold] = useState(175);
  const [showCutLines, setShowCutLines] = useState(true);
  const [showTileBorder, setShowTileBorder] = useState(true);
  const [sheetMarginMm, setSheetMarginMm] = useState<'tight' | 'normal'>('normal');

  const [generatedSheets, setGeneratedSheets] = useState<string[]>([]);
  const [pdfDownloadUrl, setPdfDownloadUrl] = useState<string | null>(null);
  const [pdfDownloadSize, setPdfDownloadSize] = useState<number>(0);

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setLoadingFiles(true);
    setErrorMsg('');
    setGeneratedSheets([]);
    setPdfDownloadUrl(null);

    const added: SlipItem[] = [];
    try {
      for (const file of Array.from(fileList)) {
        const isPdf =
          file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        if (isPdf) {
          const bytes = new Uint8Array(await file.arrayBuffer());
          try {
            const loadingTask = pdfjsLib.getDocument({
              data: bytes,
              password: pdfPassword.trim() || undefined,
            });
            const pdf = await loadingTask.promise;
            for (let p = 1; p <= pdf.numPages; p++) {
              const page = await pdf.getPage(p);
              const viewport = page.getViewport({ scale: 2.1 });
              const canvas = document.createElement('canvas');
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              const ctx = canvas.getContext('2d')!;
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              await page.render({ canvasContext: ctx, canvas, viewport }).promise;
              added.push({
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                name: `${file.name} (P${p})`,
                url: canvas.toDataURL('image/png'),
                width: canvas.width,
                height: canvas.height,
                rotate: 0,
                included: true,
              });
            }
          } catch {
            setErrorMsg(
              `Could not open "${file.name}". If it has a password, type the password above before uploading.`
            );
          }
        } else if (file.type.startsWith('image/')) {
          const url = URL.createObjectURL(file);
          try {
            const img = await loadImg(url);
            added.push({
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              name: file.name,
              url,
              width: img.naturalWidth,
              height: img.naturalHeight,
              rotate: 0,
              included: true,
            });
          } catch {
            // ignore invalid image
          }
        }
      }
      if (added.length > 0) {
        setItems((prev) => [...prev, ...added]);
      }
    } finally {
      setLoadingFiles(false);
    }
  };

  const rotateItem = (id: string) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, rotate: ((it.rotate + 90) % 360) as 0 | 90 | 180 | 270 } : it
      )
    );
  };

  const toggleInclude = (id: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, included: !it.included } : it))
    );
  };

  const moveItem = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    setItems((prev) => {
      const copy = [...prev];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const getLayoutGrid = (mode: XeroxLayoutMode): { cols: number; rows: number; perSheet: number } => {
    switch (mode) {
      case '2-vertical':
        return { cols: 1, rows: 2, perSheet: 2 };
      case '2-side':
        return { cols: 2, rows: 1, perSheet: 2 };
      case '4-grid':
        return { cols: 2, rows: 2, perSheet: 4 };
      case '6-grid':
        return { cols: 2, rows: 3, perSheet: 6 };
    }
  };

  const applyOrientationSwitch = (mode: XeroxLayoutMode) => {
    setLayoutMode(mode);
    if (mode === '2-side') setOrientation('landscape');
    else if (mode === '2-vertical') setOrientation('portrait');
  };

  const renderRotatedSourceCanvas = async (item: SlipItem): Promise<HTMLCanvasElement> => {
    const img = await loadImg(item.url);
    const swap = item.rotate === 90 || item.rotate === 270;
    const cw = swap ? img.naturalHeight : img.naturalWidth;
    const ch = swap ? img.naturalWidth : img.naturalHeight;

    const c = document.createElement('canvas');
    c.width = cw;
    c.height = ch;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cw, ch);

    ctx.save();
    ctx.translate(cw / 2, ch / 2);
    ctx.rotate((item.rotate * Math.PI) / 180);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();

    if (inkSaverBw) {
      const imgData = ctx.getImageData(0, 0, cw, ch);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        if (lum >= bwThreshold) {
          d[i] = 255;
          d[i + 1] = 255;
          d[i + 2] = 255;
        } else {
          const crisp = Math.max(0, Math.round((lum / bwThreshold) * 65));
          d[i] = crisp;
          d[i + 1] = crisp;
          d[i + 2] = crisp;
        }
      }
      ctx.putImageData(imgData, 0, 0);
    }
    return c;
  };

  const generateSheets = async () => {
    const active = items.filter((it) => it.included);
    if (active.length === 0) return;

    setProcessing(true);
    setErrorMsg('');
    try {
      const { cols, rows, perSheet } = getLayoutGrid(layoutMode);
      const isLandscape = orientation === 'landscape';
      const sheetW = isLandscape ? 2339 : 1654; // A4 @ 200 DPI
      const sheetH = isLandscape ? 1654 : 2339;
      const pad = sheetMarginMm === 'tight' ? 32 : 58;
      const gap = showCutLines ? 34 : 22;

      const cellW = (sheetW - pad * 2 - gap * (cols - 1)) / cols;
      const cellH = (sheetH - pad * 2 - gap * (rows - 1)) / rows;

      const sheetDataUrls: string[] = [];
      const pdfDoc = await PDFDocument.create();

      for (let start = 0; start < active.length; start += perSheet) {
        const chunk = active.slice(start, start + perSheet);
        const sheetCanvas = document.createElement('canvas');
        sheetCanvas.width = sheetW;
        sheetCanvas.height = sheetH;
        const sCtx = sheetCanvas.getContext('2d')!;
        sCtx.fillStyle = '#ffffff';
        sCtx.fillRect(0, 0, sheetW, sheetH);

        for (let i = 0; i < chunk.length; i++) {
          const r = Math.floor(i / cols);
          const c = i % cols;
          const x = pad + c * (cellW + gap);
          const y = pad + r * (cellH + gap);

          const srcCanvas = await renderRotatedSourceCanvas(chunk[i]);
          const scale = Math.min((cellW - 12) / srcCanvas.width, (cellH - 12) / srcCanvas.height);
          const drawW = srcCanvas.width * scale;
          const drawH = srcCanvas.height * scale;
          const dx = x + (cellW - drawW) / 2;
          const dy = y + (cellH - drawH) / 2;

          sCtx.imageSmoothingEnabled = true;
          sCtx.imageSmoothingQuality = 'high';
          sCtx.drawImage(srcCanvas, dx, dy, drawW, drawH);

          if (showTileBorder) {
            sCtx.strokeStyle = '#cbd5e1';
            sCtx.lineWidth = 2;
            sCtx.strokeRect(x, y, cellW, cellH);
          }
        }

        if (showCutLines) {
          sCtx.save();
          sCtx.strokeStyle = '#94a3b8';
          sCtx.lineWidth = 2;
          sCtx.setLineDash([12, 10]);
          for (let c = 1; c < cols; c++) {
            const gx = pad + c * cellW + (c - 0.5) * gap;
            sCtx.beginPath();
            sCtx.moveTo(gx, pad / 2);
            sCtx.lineTo(gx, sheetH - pad / 2);
            sCtx.stroke();
          }
          for (let r = 1; r < rows; r++) {
            const gy = pad + r * cellH + (r - 0.5) * gap;
            sCtx.beginPath();
            sCtx.moveTo(pad / 2, gy);
            sCtx.lineTo(sheetW - pad / 2, gy);
            sCtx.stroke();
          }
          sCtx.restore();
        }

        const dataUrl = sheetCanvas.toDataURL('image/jpeg', 0.94);
        sheetDataUrls.push(dataUrl);

        const jpgBytes = await (await fetch(dataUrl)).arrayBuffer();
        const embedded = await pdfDoc.embedJpg(jpgBytes);
        const pdfW = isLandscape ? 841.89 : 595.28;
        const pdfH = isLandscape ? 595.28 : 841.89;
        const page = pdfDoc.addPage([pdfW, pdfH]);
        page.drawImage(embedded, { x: 0, y: 0, width: pdfW, height: pdfH });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      setGeneratedSheets(sheetDataUrls);
      setPdfDownloadUrl(URL.createObjectURL(blob));
      setPdfDownloadSize(blob.size);
    } finally {
      setProcessing(false);
    }
  };

  const activeCount = items.filter((it) => it.included).length;

  return (
    <div className="space-y-6">
      {/* Optional PDF Password + Multi Upload */}
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block border-2 border-dashed border-violet-300 dark:border-violet-700 hover:border-violet-500 bg-violet-50/50 dark:bg-violet-950/30 rounded-2xl p-6 text-center cursor-pointer transition-colors">
              <input
                type="file"
                accept=".pdf,application/pdf,image/*"
                multiple
                onChange={(e) => handleUpload(e.target.files)}
                className="hidden"
              />
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center mx-auto mb-2.5 shadow-md">
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {loadingFiles
                  ? 'Rendering PDF pages...'
                  : 'Upload Portal PDF Slips / Receipts / Images (Multiple Allowed)'}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                ১টি A4 পাতায় ২টি, ৪টি বা ৬টি রসিদ/স্লিপ একসাথে বসিয়ে কাগজ ও কালি বাঁচান
              </div>
            </label>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              PDF Password (Optional / যদি PDF-এ লক থাকে)
            </label>
            <input
              type="text"
              value={pdfPassword}
              onChange={(e) => setPdfPassword(e.target.value)}
              placeholder="Enter password before upload"
              className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs focus:outline-none focus:border-violet-500"
            />
            {items.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setItems([]);
                  setGeneratedSheets([]);
                  setPdfDownloadUrl(null);
                }}
                className="w-full py-2 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
              >
                Clear All Pages
              </button>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Panel */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
              <LayoutGrid className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              <span>Sheet Saver Layout ({activeCount} active slips)</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Choose Slips Per A4 Sheet
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: '2-vertical', title: '2-in-1 Stacked', sub: 'উপরে + নিচে (Half A4)' },
                  { id: '2-side', title: '2-in-1 Side-by-Side', sub: 'পাশাপাশি ২ পৃষ্ঠা' },
                  { id: '4-grid', title: '4-in-1 Grid (2×2)', sub: '১ পাতায় ৪টি স্লিপ' },
                  { id: '6-grid', title: '6-in-1 Compact (2×3)', sub: 'ছোট রসিদ ৬টি' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => applyOrientationSwitch(opt.id as XeroxLayoutMode)}
                    className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                      layoutMode === opt.id
                        ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:border-violet-400'
                    }`}
                  >
                    <div className="text-xs font-extrabold">{opt.title}</div>
                    <div
                      className={`text-[11px] mt-0.5 ${
                        layoutMode === opt.id ? 'text-violet-100' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {opt.sub}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  A4 Orientation
                </label>
                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setOrientation('portrait')}
                    className={`py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                      orientation === 'portrait'
                        ? 'bg-white dark:bg-slate-900 text-violet-700 dark:text-violet-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Portrait
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrientation('landscape')}
                    className={`py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                      orientation === 'landscape'
                        ? 'bg-white dark:bg-slate-900 text-violet-700 dark:text-violet-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Landscape
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Page Margins
                </label>
                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSheetMarginMm('normal')}
                    className={`py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                      sheetMarginMm === 'normal'
                        ? 'bg-white dark:bg-slate-900 text-violet-700 dark:text-violet-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Safe
                  </button>
                  <button
                    type="button"
                    onClick={() => setSheetMarginMm('tight')}
                    className={`py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                      sheetMarginMm === 'tight'
                        ? 'bg-white dark:bg-slate-900 text-violet-700 dark:text-violet-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Max Fill
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/75 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-2.5">
              <label className="flex items-center gap-2 text-xs font-extrabold text-amber-950 dark:text-amber-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inkSaverBw}
                  onChange={(e) => setInkSaverBw(e.target.checked)}
                  className="accent-amber-600 w-4 h-4"
                />
                <span>Ink Saver Crisp B&amp;W (কালি বাঁচান ও পটভূমি সাদা করুন)</span>
              </label>
              {inkSaverBw && (
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                    <span>White Clean Threshold</span>
                    <span className="tabular-nums">{bwThreshold}</span>
                  </div>
                  <input
                    type="range"
                    min={110}
                    max={225}
                    value={bwThreshold}
                    onChange={(e) => setBwThreshold(Number(e.target.value))}
                    className="w-full accent-amber-600"
                  />
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCutLines}
                  onChange={(e) => setShowCutLines(e.target.checked)}
                  className="accent-violet-600"
                />
                <Scissors className="w-3.5 h-3.5 text-slate-500" />
                Dashed Cut Guides
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTileBorder}
                  onChange={(e) => setShowTileBorder(e.target.checked)}
                  className="accent-violet-600"
                />
                Clean Box Border
              </label>
            </div>

            <button
              type="button"
              onClick={generateSheets}
              disabled={processing || activeCount === 0}
              className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold cursor-pointer disabled:opacity-60"
            >
              {processing ? 'Building A4 Sheet(s)...' : `Generate A4 Xerox Sheet(s) (${activeCount} slips)`}
            </button>

            {/* Page Queue List */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 max-h-72 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-2.5 p-2 rounded-xl border ${
                    item.included
                      ? 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                      : 'bg-slate-100/50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-55'
                  }`}
                >
                  <img
                    src={item.url}
                    alt={item.name}
                    style={{ transform: `rotate(${item.rotate}deg)` }}
                    className="w-10 h-12 object-contain bg-white rounded border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                      {idx + 1}. {item.name}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      {item.width}×{item.height}px {item.rotate > 0 ? `· Rotated ${item.rotate}°` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => rotateItem(item.id)}
                      title="Rotate 90°"
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(idx, -1)}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-35 cursor-pointer text-slate-700 dark:text-slate-200"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(idx, 1)}
                      disabled={idx === items.length - 1}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-35 cursor-pointer text-slate-700 dark:text-slate-200"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleInclude(item.id)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                        item.included
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {item.included ? 'Keep' : 'Skip'}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Generated A4 Sheets Output */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                Combined A4 Xerox Sheet Preview ({generatedSheets.length} Page{generatedSheets.length === 1 ? '' : 's'})
              </span>
              {generatedSheets.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => printMultipleImagesOnA4(generatedSheets, 'Multi-Slip A4 Xerox Sheet')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print A4 ({generatedSheets.length})
                  </button>
                  {pdfDownloadUrl && (
                    <a
                      href={pdfDownloadUrl}
                      download={`xerox-saver-${layoutMode}.pdf`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download PDF ({formatBytes(pdfDownloadSize)})
                    </a>
                  )}
                </div>
              )}
            </div>

            {generatedSheets.length === 0 ? (
              <div className="h-80 flex flex-col items-center justify-center text-center px-6 text-slate-500 dark:text-slate-400">
                <CheckCircle2 className="w-10 h-10 text-violet-300 dark:text-violet-700 mb-2" />
                <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Choose 2-in-1, 4-in-1, or 6-in-1 layout and click &ldquo;Generate A4 Xerox Sheet(s)&rdquo;
                </div>
                <p className="text-xs mt-1 max-w-md">
                  Ideal for printing two bank passbooks/slips, payment receipts, acknowledgement slips, or portal forms side-by-side on a single A4 page.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {generatedSheets.map((url, idx) => (
                  <div
                    key={idx}
                    className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50 dark:bg-slate-800/70 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                      <span>A4 Sheet #{idx + 1}</span>
                      <a
                        href={url}
                        download={`a4-xerox-sheet-${idx + 1}.jpg`}
                        className="text-violet-600 dark:text-violet-400 hover:underline inline-flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        Save JPG
                      </a>
                    </div>
                    <img
                      src={url}
                      alt={`Combined A4 sheet ${idx + 1}`}
                      className="w-full max-h-[540px] object-contain bg-white rounded-lg border border-slate-200"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

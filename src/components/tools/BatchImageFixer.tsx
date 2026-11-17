import React, { useState } from 'react';
import {
  Upload,
  RotateCcw,
  RotateCw,
  FlipHorizontal2,
  ArrowLeft,
  ArrowRight,
  Trash2,
  Download,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

interface BatchImageItem {
  id: string;
  origName: string;
  url: string;
  width: number;
  height: number;
  rotate: 0 | 90 | 180 | 270;
  flipH: boolean;
}

interface ExportedBatchFile {
  name: string;
  url: string;
  size: number;
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, q?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Export failed'))),
      mime,
      q
    );
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const BatchImageFixer: React.FC = () => {
  const [items, setItems] = useState<BatchImageItem[]>([]);
  // Prefix starts empty (no pre-filled value)
  const [namePrefix, setNamePrefix] = useState('');
  const [startNumber, setStartNumber] = useState(1);
  const [outputMime, setOutputMime] = useState<'image/jpeg' | 'image/png'>('image/jpeg');
  const [maxKbLimit, setMaxKbLimit] = useState(0); // 0 = high quality original size
  const [processing, setProcessing] = useState(false);

  const [exportedFiles, setExportedFiles] = useState<ExportedBatchFile[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfSize, setPdfSize] = useState(0);

  const handleFilesUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setExportedFiles([]);
    setPdfUrl(null);
    const loaded: BatchImageItem[] = [];
    for (const file of Array.from(fileList)) {
      if (!file.type.startsWith('image/')) continue;
      const url = URL.createObjectURL(file);
      try {
        const img = await loadImg(url);
        loaded.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          origName: file.name,
          url,
          width: img.naturalWidth,
          height: img.naturalHeight,
          rotate: 0,
          flipH: false,
        });
      } catch {
        // skip
      }
    }
    if (loaded.length > 0) setItems((prev) => [...prev, ...loaded]);
  };

  const rotateAll = (delta: 90 | 180 | 270) => {
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        rotate: ((it.rotate + delta) % 360) as 0 | 90 | 180 | 270,
      }))
    );
  };

  const rotateSingle = (id: string, delta: 90 | 180 | 270) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? { ...it, rotate: ((it.rotate + delta) % 360) as 0 | 90 | 180 | 270 }
          : it
      )
    );
  };

  const flipSingle = (id: string) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, flipH: !it.flipH } : it)));
  };

  const moveItem = (idx: number, dir: -1 | 1) => {
    const t = idx + dir;
    if (t < 0 || t >= items.length) return;
    setItems((prev) => {
      const next = [...prev];
      [next[idx], next[t]] = [next[t], next[idx]];
      return next;
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const renderItemCanvas = async (it: BatchImageItem): Promise<HTMLCanvasElement> => {
    const img = await loadImg(it.url);
    const swap = it.rotate === 90 || it.rotate === 270;
    const cw = swap ? img.naturalHeight : img.naturalWidth;
    const ch = swap ? img.naturalWidth : img.naturalHeight;

    const canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d')!;
    if (outputMime === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, cw, ch);
    }
    ctx.translate(cw / 2, ch / 2);
    ctx.rotate((it.rotate * Math.PI) / 180);
    if (it.flipH) ctx.scale(-1, 1);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    return canvas;
  };

  const compressCanvasToTarget = async (
    canvas: HTMLCanvasElement,
    mime: 'image/jpeg' | 'image/png',
    kbLimit: number
  ): Promise<Blob> => {
    if (mime === 'image/png' || kbLimit <= 0) {
      return canvasToBlob(canvas, mime, 0.93);
    }
    const targetBytes = kbLimit * 1024;
    let low = 0.1;
    let high = 0.95;
    let best: Blob | null = null;
    for (let i = 0; i < 7; i++) {
      const mid = (low + high) / 2;
      const b = await canvasToBlob(canvas, 'image/jpeg', mid);
      if (b.size <= targetBytes) {
        best = b;
        low = mid;
      } else {
        high = mid;
      }
    }
    return best || canvasToBlob(canvas, 'image/jpeg', 0.2);
  };

  const handleExportRenamedImages = async () => {
    if (items.length === 0) return;
    setProcessing(true);
    setPdfUrl(null);
    try {
      const ext = outputMime === 'image/png' ? 'png' : 'jpg';
      const cleanPrefix = namePrefix.trim() || 'Doc';
      const out: ExportedBatchFile[] = [];

      for (let i = 0; i < items.length; i++) {
        const numStr = String(startNumber + i).padStart(2, '0');
        const canvas = await renderItemCanvas(items[i]);
        const blob = await compressCanvasToTarget(canvas, outputMime, maxKbLimit);
        out.push({
          name: `${cleanPrefix}_${numStr}.${ext}`,
          url: URL.createObjectURL(blob),
          size: blob.size,
        });
      }
      setExportedFiles(out);
    } finally {
      setProcessing(false);
    }
  };

  const handleExportMultiPagePdf = async () => {
    if (items.length === 0) return;
    setProcessing(true);
    try {
      const pdfDoc = await PDFDocument.create();
      for (const item of items) {
        const canvas = await renderItemCanvas(item);
        const blob = await compressCanvasToTarget(
          canvas,
          'image/jpeg',
          maxKbLimit > 0 ? maxKbLimit : 0
        );
        const bytes = await blob.arrayBuffer();
        const embedded = await pdfDoc.embedJpg(bytes);

        const isLand = embedded.width > embedded.height;
        const pageW = isLand ? 841.89 : 595.28;
        const pageH = isLand ? 595.28 : 841.89;
        const margin = 16;
        const scale = Math.min(
          (pageW - margin * 2) / embedded.width,
          (pageH - margin * 2) / embedded.height
        );
        const w = embedded.width * scale;
        const h = embedded.height * scale;

        const page = pdfDoc.addPage([pageW, pageH]);
        page.drawImage(embedded, {
          x: (pageW - w) / 2,
          y: (pageH - h) / 2,
          width: w,
          height: h,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      setPdfUrl(URL.createObjectURL(blob));
      setPdfSize(blob.size);
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadAllSequentially = () => {
    exportedFiles.forEach((f, idx) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = f.url;
        a.download = f.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }, idx * 180);
    });
  };

  return (
    <div className="space-y-6">
      <label className="block border-2 border-dashed border-violet-300 dark:border-violet-700 hover:border-violet-500 bg-violet-50/50 dark:bg-violet-950/30 rounded-2xl p-7 text-center cursor-pointer transition-colors">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFilesUpload(e.target.files)}
          className="hidden"
        />
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
          <Upload className="w-6 h-6" />
        </div>
        <div className="text-sm font-bold text-slate-900 dark:text-white">
          Select 2 to 30+ Document Photos at Once (একসাথে ১০–১৫টি ছবি আপলোড করুন)
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          মোবাইলে উল্টো বা বাঁকা হয়ে তোলা সব ডকুমেন্ট ৯০° ঘুরিয়ে সিরিয়াল অনুযায়ী রিনেম বা PDF করুন
        </div>
      </label>

      {items.length > 0 && (
        <>
          {/* Bulk Controls Toolbar */}
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                  Bulk Rotate All ({items.length} images):
                </span>
                <button
                  type="button"
                  onClick={() => rotateAll(270)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-violet-500 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> -90° Left
                </button>
                <button
                  type="button"
                  onClick={() => rotateAll(90)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-violet-500 cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" /> +90° Right
                </button>
                <button
                  type="button"
                  onClick={() => rotateAll(180)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:border-violet-500 cursor-pointer"
                >
                  180° Flip
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setItems([]);
                  setExportedFiles([]);
                  setPdfUrl(null);
                }}
                className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
              >
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Rename Prefix (ফাইলের নাম)
                </label>
                <input
                  type="text"
                  value={namePrefix}
                  onChange={(e) => setNamePrefix(e.target.value)}
                  placeholder="e.g. Marksheet (defaults Doc)"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Start Serial No.
                </label>
                <input
                  type="number"
                  min={1}
                  value={startNumber}
                  onChange={(e) => setStartNumber(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Image Format
                </label>
                <select
                  value={outputMime}
                  onChange={(e) => setOutputMime(e.target.value as typeof outputMime)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs font-semibold"
                >
                  <option value="image/jpeg">JPEG (.jpg)</option>
                  <option value="image/png">PNG (.png)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Max KB per Image (0 = Original)
                </label>
                <input
                  type="number"
                  min={0}
                  max={5000}
                  value={maxKbLimit}
                  onChange={(e) => setMaxKbLimit(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs tabular-nums"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                onClick={handleExportRenamedImages}
                disabled={processing}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs sm:text-sm font-bold cursor-pointer"
              >
                <Download className="w-4 h-4" />
                {processing ? 'Processing...' : `Generate Renamed Images (${items.length})`}
              </button>
              <button
                type="button"
                onClick={handleExportMultiPagePdf}
                disabled={processing}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                {processing ? 'Building PDF...' : 'Combine All into Multi-Page A4 PDF'}
              </button>
            </div>
          </div>

          {/* Grid of Uploaded Images with Individual Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item, idx) => {
              const serialName = `${namePrefix.trim() || 'Doc'}_${String(startNumber + idx).padStart(2, '0')}`;
              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-3 space-y-2.5 shadow-xs"
                >
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    <span className="truncate">{serialName}</span>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-rose-500 hover:text-rose-700 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="h-44 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700">
                    <img
                      src={item.url}
                      alt={item.origName}
                      style={{
                        transform: `rotate(${item.rotate}deg) scaleX(${item.flipH ? -1 : 1})`,
                      }}
                      className="max-h-full max-w-full object-contain transition-transform"
                    />
                  </div>

                  <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {item.origName} ({item.rotate}°)
                  </div>

                  <div className="grid grid-cols-5 gap-1">
                    <button
                      type="button"
                      onClick={() => moveItem(idx, -1)}
                      disabled={idx === 0}
                      title="Move earlier"
                      className="py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-35 flex items-center justify-center text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => rotateSingle(item.id, 270)}
                      title="Rotate -90°"
                      className="py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => rotateSingle(item.id, 90)}
                      title="Rotate +90°"
                      className="py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => flipSingle(item.id)}
                      title="Flip Horizontal"
                      className="py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <FlipHorizontal2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(idx, 1)}
                      disabled={idx === items.length - 1}
                      title="Move later"
                      className="py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-35 flex items-center justify-center text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Combined PDF Download Box */}
          {pdfUrl && (
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-5 h-5" />
                <div>
                  <div className="text-sm font-bold">
                    Combined {items.length}-Page A4 PDF Ready
                  </div>
                  <div className="text-xs tabular-nums">{formatBytes(pdfSize)}</div>
                </div>
              </div>
              <a
                href={pdfUrl}
                download={`${namePrefix.trim() || 'Documents'}_bundle.pdf`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </a>
            </div>
          )}

          {/* Renamed Files List */}
          {exportedFiles.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                  Serialized Renamed Files ({exportedFiles.length})
                </span>
                <button
                  type="button"
                  onClick={handleDownloadAllSequentially}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download All ({exportedFiles.length})
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {exportedFiles.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {file.name}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">
                        {formatBytes(file.size)}
                      </div>
                    </div>
                    <a
                      href={file.url}
                      download={file.name}
                      className="px-2.5 py-1.5 rounded-lg bg-violet-600 text-white text-[11px] font-bold hover:bg-violet-700 shrink-0"
                    >
                      Save
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

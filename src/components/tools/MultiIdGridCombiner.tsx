import React, { useState } from 'react';
import { Upload, Trash2, Download, Printer, Grid2x2, CheckCircle2, Plus } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { printImageOnA4 } from '../../utils/printHelper';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface CardSlotItem {
  id: string;
  label: string;
  imageUrl: string;
  fitMode: 'contain' | 'cover';
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export const MultiIdGridCombiner: React.FC = () => {
  const [slots, setSlots] = useState<CardSlotItem[]>([]);
  const [fitMode, setFitMode] = useState<'contain' | 'cover'>('contain');
  const [showCutGuides, setShowCutGuides] = useState<boolean>(true);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const fileToImageDataUrl = async (file: File): Promise<string> => {
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      const page = await pdf.getPage(1);
      const vp = page.getViewport({ scale: 2.0 });
      const c = document.createElement('canvas');
      c.width = Math.round(vp.width);
      c.height = Math.round(vp.height);
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, c.width, c.height);
      await page.render({ canvasContext: ctx, viewport: vp, canvas: c }).promise;
      return c.toDataURL('image/png');
    }
    return URL.createObjectURL(file);
  };

  const handleBulkUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setProcessing(true);
    try {
      const added: CardSlotItem[] = [];
      for (const file of Array.from(fileList)) {
        if (slots.length + added.length >= 8) break;
        try {
          const url = await fileToImageDataUrl(file);
          const idx = slots.length + added.length + 1;
          added.push({
            id: String(Date.now() + Math.random()),
            label: `Card ${idx} (${file.name.replace(/\.[^.]+$/, '')})`,
            imageUrl: url,
            fitMode,
          });
        } catch {
          // skip unreadable files
        }
      }
      if (added.length > 0) {
        setSlots((prev) => [...prev, ...added].slice(0, 8));
        setSheetUrl(null);
      }
    } finally {
      setProcessing(false);
    }
  };

  const generateGridSheet = async () => {
    if (slots.length === 0) return;
    setProcessing(true);
    try {
      // 300 DPI A4 canvas (2480 x 3508 px)
      const a4 = document.createElement('canvas');
      a4.width = 2480;
      a4.height = 3508;
      const ctx = a4.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, a4.width, a4.height);

      // Exact CR80 smartcard dimensions at 300 DPI: 85.6 x 54 mm = 1011 x 638 px
      const cardW = 1011;
      const cardH = 638;
      const gapX = 140;
      const gapY = 140;
      const startX = Math.round((a4.width - (cardW * 2 + gapX)) / 2);
      const startY = 180;

      for (let i = 0; i < Math.min(8, slots.length); i++) {
        const item = slots[i];
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = startX + col * (cardW + gapX);
        const y = startY + row * (cardH + gapY);

        const img = await loadImage(item.imageUrl);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, y, cardW, cardH);

        const srcW = img.naturalWidth;
        const srcH = img.naturalHeight;
        if (fitMode === 'cover') {
          const srcRatio = srcW / srcH;
          const dstRatio = cardW / cardH;
          let sx = 0;
          let sy = 0;
          let sw = srcW;
          let sh = srcH;
          if (srcRatio > dstRatio) {
            sw = srcH * dstRatio;
            sx = (srcW - sw) / 2;
          } else {
            sh = srcW / dstRatio;
            sy = (srcH - sh) / 2;
          }
          ctx.drawImage(img, sx, sy, sw, sh, x, y, cardW, cardH);
        } else {
          const scale = Math.min(cardW / srcW, cardH / srcH);
          const dw = srcW * scale;
          const dh = srcH * scale;
          ctx.drawImage(img, x + (cardW - dw) / 2, y + (cardH - dh) / 2, dw, dh);
        }

        if (showCutGuides) {
          ctx.save();
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 2;
          ctx.setLineDash([12, 8]);
          ctx.strokeRect(x, y, cardW, cardH);
          ctx.restore();
        }
      }

      setSheetUrl(a4.toDataURL('image/jpeg', 0.95));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 rounded-2xl p-4 text-xs text-violet-950 dark:text-violet-200 no-print">
        <strong>Multi-ID Card A4 Grid Combiner:</strong> Upload up to <strong>8 cropped card faces</strong> (e.g.
        2–4 family members&apos; Aadhaar, Voter, PAN, or Ration Card Front + Back images) to arrange them neatly at
        exact <strong>85.6 × 54 mm</strong> size on a single A4 page for Xerox / Lamination printing.
      </div>

      <label className="block border-2 border-dashed border-violet-300 dark:border-violet-700 hover:border-violet-500 bg-white dark:bg-slate-900 rounded-2xl p-7 text-center cursor-pointer transition-colors no-print">
        <input
          type="file"
          multiple
          accept="image/*,application/pdf,.pdf"
          onChange={(e) => handleBulkUpload(e.target.files)}
          className="hidden"
        />
        <Upload className="w-6 h-6 text-violet-600 dark:text-violet-400 mx-auto mb-2" />
        <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Select 1 to 8 ID Card Front / Back Images or PDFs ({slots.length}/8 added)
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Click to add more card faces — arranged 2 cards per row × up to 4 rows on A4
        </div>
      </label>

      {slots.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 no-print shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                Card Queue ({slots.length}/8)
              </span>
              <button
                type="button"
                onClick={() => {
                  setSlots([]);
                  setSheetUrl(null);
                }}
                className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
              >
                Clear All
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {slots.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.label}
                    className="w-14 h-9 object-contain bg-white rounded border border-slate-200 dark:border-slate-700 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      Slot {idx + 1} · Row {Math.floor(idx / 2) + 1}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{item.label}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSlots((prev) => prev.filter((x) => x.id !== item.id));
                      setSheetUrl(null);
                    }}
                    className="p-1.5 text-red-500 hover:text-red-700 dark:hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setFitMode('contain')}
                className={`py-2 rounded-lg text-xs font-bold cursor-pointer ${
                  fitMode === 'contain'
                    ? 'bg-white dark:bg-slate-900 text-violet-700 dark:text-violet-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Fit Whole Card
              </button>
              <button
                type="button"
                onClick={() => setFitMode('cover')}
                className={`py-2 rounded-lg text-xs font-bold cursor-pointer ${
                  fitMode === 'cover'
                    ? 'bg-white dark:bg-slate-900 text-violet-700 dark:text-violet-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Fill CR80 Box
              </button>
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showCutGuides}
                onChange={(e) => setShowCutGuides(e.target.checked)}
                className="accent-violet-600"
              />
              Show dashed cutting border around each card
            </label>

            <div className="flex gap-2">
              {slots.length < 8 && (
                <label className="inline-flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 cursor-pointer">
                  <Plus className="w-3.5 h-3.5" />
                  Add Card
                  <input
                    type="file"
                    multiple
                    accept="image/*,application/pdf,.pdf"
                    onChange={(e) => handleBulkUpload(e.target.files)}
                    className="hidden"
                  />
                </label>
              )}
              <button
                type="button"
                onClick={generateGridSheet}
                disabled={processing}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold cursor-pointer"
              >
                <Grid2x2 className="w-4 h-4" />
                {processing ? 'Building A4 Grid...' : 'Generate A4 Multi-Card Sheet'}
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                A4 Sheet Preview (300 DPI)
              </span>
              {sheetUrl && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  {slots.length} Card(s) Placed
                </span>
              )}
            </div>

            {sheetUrl ? (
              <div className="space-y-4">
                <img
                  src={sheetUrl}
                  alt="Multi ID A4 Grid"
                  className="w-full max-h-[540px] object-contain border border-slate-200 dark:border-slate-700 rounded-xl bg-white"
                />
                <div className="flex flex-wrap justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => printImageOnA4(sheetUrl, 'Multi-ID Card A4 Sheet', 'A4')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    Print A4 Now
                  </button>
                  <a
                    href={sheetUrl}
                    download="multi-id-cards-a4-grid.jpg"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                  >
                    <Download className="w-4 h-4" />
                    Download A4 Sheet
                  </a>
                </div>
              </div>
            ) : (
              <div className="py-24 text-center text-xs text-slate-400">
                Click &ldquo;Generate A4 Multi-Card Sheet&rdquo; to preview &amp; print all uploaded cards on one A4 page.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

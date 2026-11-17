import React, { useState } from 'react';
import { Upload, Download, Printer, ShieldAlert, CheckCircle2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { printImageOnA4 } from '../../utils/printHelper';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export const DocWatermarkProtector: React.FC = () => {
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [stampText, setStampText] = useState<string>('');
  const [includeDate, setIncludeDate] = useState<boolean>(true);
  const [pattern, setPattern] = useState<'tiled' | 'center' | 'banner'>('tiled');
  const [inkColor, setInkColor] = useState<string>('#dc2626');
  const [opacityPct, setOpacityPct] = useState<number>(28);
  const [fontScale, setFontScale] = useState<number>(100);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setFileName(file.name);
    setOutputUrl(null);
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
      setSourceUrl(c.toDataURL('image/png'));
    } else {
      setSourceUrl(URL.createObjectURL(file));
    }
  };

  const applyWatermark = async () => {
    if (!sourceUrl) return;
    const labelBase = stampText.trim() || 'FOR VERIFICATION PURPOSE ONLY';
    const fullLabel = includeDate
      ? `${labelBase} (${new Date().toLocaleDateString('en-IN')})`
      : labelBase;

    setProcessing(true);
    try {
      const img = await loadImage(sourceUrl);
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
      ctx.drawImage(img, 0, 0, w, h);

      ctx.save();
      ctx.globalAlpha = Math.max(0.08, Math.min(0.85, opacityPct / 100));
      ctx.fillStyle = inkColor;
      ctx.strokeStyle = inkColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const baseFontSize = Math.max(18, Math.round((w * 0.036 * fontScale) / 100));

      if (pattern === 'tiled') {
        ctx.font = `800 ${Math.round(baseFontSize * 0.85)}px sans-serif`;
        const stepX = Math.max(260, ctx.measureText(fullLabel).width + 90);
        const stepY = Math.max(160, baseFontSize * 4.2);

        ctx.translate(w / 2, h / 2);
        ctx.rotate((-32 * Math.PI) / 180);

        for (let y = -h; y <= h; y += stepY) {
          for (let x = -w; x <= w; x += stepX) {
            ctx.fillText(fullLabel, x, y);
          }
        }
      } else if (pattern === 'center') {
        ctx.translate(w / 2, h / 2);
        ctx.rotate((-30 * Math.PI) / 180);
        const largeSize = Math.round(baseFontSize * 1.45);
        ctx.font = `900 ${largeSize}px sans-serif`;
        const metrics = ctx.measureText(fullLabel);
        const boxW = metrics.width + 48;
        const boxH = largeSize * 1.8;
        ctx.lineWidth = Math.max(3, Math.round(w * 0.004));
        ctx.strokeRect(-boxW / 2, -boxH / 2, boxW, boxH);
        ctx.fillText(fullLabel, 0, 0);
      } else {
        ctx.globalAlpha = Math.max(0.75, opacityPct / 100 + 0.4);
        const barH = Math.max(44, Math.round(h * 0.065));
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, h - barH, w, barH);
        ctx.lineWidth = 2;
        ctx.strokeRect(1, h - barH, w - 2, barH);
        ctx.fillStyle = inkColor;
        ctx.font = `800 ${Math.round(barH * 0.42)}px sans-serif`;
        ctx.fillText(fullLabel, w / 2, h - barH / 2);
      }

      ctx.restore();
      setOutputUrl(canvas.toDataURL('image/jpeg', 0.94));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <label className="block border-2 border-dashed border-rose-300 dark:border-rose-700 hover:border-rose-500 bg-rose-50/40 dark:bg-rose-950/30 rounded-2xl p-7 text-center cursor-pointer transition-colors no-print">
        <input
          type="file"
          accept="image/*,application/pdf,.pdf"
          onChange={(e) => handleFile(e.target.files?.[0])}
          className="hidden"
        />
        <Upload className="w-6 h-6 text-rose-600 dark:text-rose-400 mx-auto mb-2" />
        <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
          {sourceUrl ? `Loaded: ${fileName} — Click to replace` : 'Upload Aadhaar, Admit Card, Marksheet, or Certificate (Image / PDF)'}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Protect photocopies from misuse by adding custom security stamps locally in your browser
        </div>
      </label>

      {sourceUrl && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 no-print shadow-xs">
            <div className="text-sm font-extrabold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
              Security Stamp Settings
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Watermark Purpose Text
              </label>
              <input
                type="text"
                value={stampText}
                onChange={(e) => setStampText(e.target.value)}
                placeholder="e.g. FOR SIM CARD KYC ONLY"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[
                  'FOR VERIFICATION PURPOSE ONLY',
                  'SELF ATTESTED COPY',
                  'FOR BANK KYC ONLY',
                  'DUPLICATE COPY',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setStampText(preset)}
                    className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={includeDate}
                onChange={(e) => setIncludeDate(e.target.checked)}
                className="accent-rose-600"
              />
              Include today&apos;s date beside stamp
            </label>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Stamp Layout Style
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'tiled', label: 'Tiled Grid' },
                  { id: 'center', label: 'Center Seal' },
                  { id: 'banner', label: 'Bottom Strip' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPattern(m.id as typeof pattern)}
                    className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                      pattern === m.id
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Stamp Darkness (Opacity)</span>
                <span className="tabular-nums">{opacityPct}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={75}
                value={opacityPct}
                onChange={(e) => setOpacityPct(Number(e.target.value))}
                className="w-full accent-rose-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Text Size</span>
                <span className="tabular-nums">{fontScale}%</span>
              </div>
              <input
                type="range"
                min={65}
                max={160}
                value={fontScale}
                onChange={(e) => setFontScale(Number(e.target.value))}
                className="w-full accent-rose-600"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Ink Color</span>
              <div className="flex gap-2">
                {['#dc2626', '#1d4ed8', '#0f172a', '#475569'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setInkColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-6 h-6 rounded-full border-2 cursor-pointer ${
                      inkColor === c ? 'border-slate-900 dark:border-amber-400 scale-110' : 'border-white'
                    }`}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={applyWatermark}
              disabled={processing}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4" />
              {processing ? 'Stamping...' : 'Protect Document Copy'}
            </button>
          </div>

          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm font-extrabold text-slate-900 dark:text-white">Protected Copy Preview</span>
              {outputUrl && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  Ready to Print / Download
                </span>
              )}
            </div>

            <img
              src={outputUrl || sourceUrl}
              alt="Document copy preview"
              className="w-full max-h-[520px] object-contain rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50"
            />

            {outputUrl && (
              <div className="flex flex-wrap justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => printImageOnA4(outputUrl, 'Protected Document Copy A4', 'A4')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Print A4
                </button>
                <a
                  href={outputUrl}
                  download="protected-copy.jpg"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  <Download className="w-4 h-4" />
                  Download JPG
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

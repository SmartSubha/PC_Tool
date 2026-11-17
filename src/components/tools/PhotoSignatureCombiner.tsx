import React, { useState } from 'react';
import { Upload, Download, Printer, Combine, CheckCircle2 } from 'lucide-react';
import { printImageOnA4 } from '../../utils/printHelper';

function loadImage(src: string): Promise<HTMLImageElement> {
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

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export const PhotoSignatureCombiner: React.FC = () => {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string>('');
  const [sigUrl, setSigUrl] = useState<string | null>(null);
  const [sigName, setSigName] = useState<string>('');

  const [layout, setLayout] = useState<'vertical' | 'horizontal'>('vertical');
  const [outWidth, setOutWidth] = useState<number>(400);
  const [outHeight, setOutHeight] = useState<number>(560);
  const [sigRatioPct, setSigRatioPct] = useState<number>(28);
  const [targetKb, setTargetKb] = useState<number>(50);
  const [addBorder, setAddBorder] = useState<boolean>(true);
  const [cleanSigBg, setCleanSigBg] = useState<boolean>(true);
  const [labelText, setLabelText] = useState<string>('');

  const [processing, setProcessing] = useState(false);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [outputBytes, setOutputBytes] = useState<number>(0);

  const handlePhotoUpload = (file: File | undefined) => {
    if (!file) return;
    setPhotoUrl(URL.createObjectURL(file));
    setPhotoName(file.name);
    setOutputUrl(null);
  };

  const handleSigUpload = (file: File | undefined) => {
    if (!file) return;
    setSigUrl(URL.createObjectURL(file));
    setSigName(file.name);
    setOutputUrl(null);
  };

  const applyPreset = (mode: 'vertical' | 'horizontal', w: number, h: number, kb: number) => {
    setLayout(mode);
    setOutWidth(w);
    setOutHeight(h);
    setTargetKb(kb);
  };

  const handleCombine = async () => {
    if (!photoUrl || !sigUrl) return;
    setProcessing(true);
    try {
      const [photoImg, sigImg] = await Promise.all([loadImage(photoUrl), loadImage(sigUrl)]);

      const w = Math.max(120, Math.min(3000, outWidth));
      const h = Math.max(120, Math.min(3000, outHeight));

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);

      const pad = Math.round(Math.min(w, h) * 0.03);
      const labelH = labelText.trim() ? Math.max(24, Math.round(h * 0.07)) : 0;

      // Prepare cleaned signature canvas if enabled
      const sigCanvas = document.createElement('canvas');
      sigCanvas.width = sigImg.naturalWidth;
      sigCanvas.height = sigImg.naturalHeight;
      const sCtx = sigCanvas.getContext('2d')!;
      sCtx.fillStyle = '#ffffff';
      sCtx.fillRect(0, 0, sigCanvas.width, sigCanvas.height);
      sCtx.drawImage(sigImg, 0, 0);
      if (cleanSigBg) {
        const imgData = sCtx.getImageData(0, 0, sigCanvas.width, sigCanvas.height);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          if (lum > 175) {
            d[i] = 255;
            d[i + 1] = 255;
            d[i + 2] = 255;
          } else {
            d[i] = Math.max(0, d[i] - 25);
            d[i + 1] = Math.max(0, d[i + 1] - 25);
            d[i + 2] = Math.max(0, d[i + 2] - 25);
          }
        }
        sCtx.putImageData(imgData, 0, 0);
      }

      const drawContained = (
        src: CanvasImageSource,
        srcW: number,
        srcH: number,
        boxX: number,
        boxY: number,
        boxW: number,
        boxH: number,
        cover = false
      ) => {
        if (cover) {
          const srcRatio = srcW / srcH;
          const dstRatio = boxW / boxH;
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
          ctx.drawImage(src, sx, sy, sw, sh, boxX, boxY, boxW, boxH);
        } else {
          const scale = Math.min(boxW / srcW, boxH / srcH);
          const dw = srcW * scale;
          const dh = srcH * scale;
          const dx = boxX + (boxW - dw) / 2;
          const dy = boxY + (boxH - dh) / 2;
          ctx.drawImage(src, 0, 0, srcW, srcH, dx, dy, dw, dh);
        }
      };

      if (layout === 'vertical') {
        const usableH = h - pad * 3 - labelH;
        const sigH = Math.round((usableH * sigRatioPct) / 100);
        const photoH = usableH - sigH;
        const innerW = w - pad * 2;

        drawContained(photoImg, photoImg.naturalWidth, photoImg.naturalHeight, pad, pad, innerW, photoH, true);

        const sigY = pad * 2 + photoH;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(pad, sigY, innerW, sigH);
        drawContained(sigCanvas, sigCanvas.width, sigCanvas.height, pad + 6, sigY + 4, innerW - 12, sigH - 8, false);

        if (addBorder) {
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(pad, sigY - Math.round(pad / 2));
          ctx.lineTo(w - pad, sigY - Math.round(pad / 2));
          ctx.stroke();
        }
      } else {
        const usableW = w - pad * 3;
        const photoW = Math.round(usableW * 0.52);
        const sigW = usableW - photoW;
        const innerH = h - pad * 2 - labelH;

        drawContained(photoImg, photoImg.naturalWidth, photoImg.naturalHeight, pad, pad, photoW, innerH, true);

        const sigX = pad * 2 + photoW;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sigX, pad, sigW, innerH);
        drawContained(sigCanvas, sigCanvas.width, sigCanvas.height, sigX + 6, pad + 6, sigW - 12, innerH - 12, false);

        if (addBorder) {
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(sigX - Math.round(pad / 2), pad);
          ctx.lineTo(sigX - Math.round(pad / 2), pad + innerH);
          ctx.stroke();
        }
      }

      if (labelH > 0) {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(pad, h - pad - labelH, w - pad * 2, labelH);
        ctx.fillStyle = '#0f172a';
        ctx.font = `700 ${Math.max(12, Math.round(labelH * 0.52))}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(labelText.trim().toUpperCase(), w / 2, h - pad - labelH / 2);
      }

      if (addBorder) {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3;
        ctx.strokeRect(1.5, 1.5, w - 3, h - 3);
      }

      // Binary search quality to hit target KB
      const maxBytes = Math.max(8, targetKb) * 1024;
      let low = 0.08;
      let high = 0.96;
      let bestBlob: Blob | null = null;
      for (let i = 0; i < 8; i++) {
        const mid = (low + high) / 2;
        const b = await canvasToBlob(canvas, 'image/jpeg', mid);
        if (b.size <= maxBytes) {
          bestBlob = b;
          low = mid;
        } else {
          high = mid;
        }
      }
      if (!bestBlob) {
        bestBlob = await canvasToBlob(canvas, 'image/jpeg', 0.12);
      }
      const dataUrl = await blobToDataUrl(bestBlob);
      setOutputUrl(dataUrl);
      setOutputBytes(bestBlob.size);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 no-print">
        <label className="block border-2 border-dashed border-sky-300 dark:border-sky-700 hover:border-sky-500 bg-sky-50/40 dark:bg-sky-950/30 rounded-2xl p-6 text-center cursor-pointer transition-colors">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handlePhotoUpload(e.target.files?.[0])}
            className="hidden"
          />
          <Upload className="w-6 h-6 text-sky-600 dark:text-sky-400 mx-auto mb-2" />
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {photoUrl ? `Photo: ${photoName}` : '1. Upload Passport Photo'}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">JPG, PNG, WEBP</div>
        </label>

        <label className="block border-2 border-dashed border-violet-300 dark:border-violet-700 hover:border-violet-500 bg-violet-50/40 dark:bg-violet-950/30 rounded-2xl p-6 text-center cursor-pointer transition-colors">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleSigUpload(e.target.files?.[0])}
            className="hidden"
          />
          <Upload className="w-6 h-6 text-violet-600 dark:text-violet-400 mx-auto mb-2" />
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
            {sigUrl ? `Signature: ${sigName}` : '2. Upload Signature Photo'}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Black/Blue ink on white paper</div>
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 no-print shadow-xs">
          <div className="text-sm font-extrabold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
            Combine &amp; Portal Settings
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Portal Quick Presets
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => applyPreset('vertical', 400, 560, 50)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-violet-50 dark:hover:bg-violet-950/50 cursor-pointer"
              >
                Vertical 400×560 (50 KB)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('vertical', 350, 500, 30)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-violet-50 dark:hover:bg-violet-950/50 cursor-pointer"
              >
                Exam 350×500 (30 KB)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('horizontal', 640, 320, 50)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-violet-50 dark:hover:bg-violet-950/50 cursor-pointer"
              >
                Side-by-Side 640×320
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setLayout('vertical')}
              className={`py-2 rounded-lg text-xs font-bold cursor-pointer ${
                layout === 'vertical'
                  ? 'bg-white dark:bg-slate-900 text-violet-700 dark:text-violet-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Top + Bottom
            </button>
            <button
              type="button"
              onClick={() => setLayout('horizontal')}
              className={`py-2 rounded-lg text-xs font-bold cursor-pointer ${
                layout === 'horizontal'
                  ? 'bg-white dark:bg-slate-900 text-violet-700 dark:text-violet-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Side-by-Side
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Width (px)
              </label>
              <input
                type="number"
                min={120}
                max={3000}
                value={outWidth}
                onChange={(e) => setOutWidth(Number(e.target.value) || 400)}
                className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Height (px)
              </label>
              <input
                type="number"
                min={120}
                max={3000}
                value={outHeight}
                onChange={(e) => setOutHeight(Number(e.target.value) || 560)}
                className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Max KB
              </label>
              <input
                type="number"
                min={10}
                max={1000}
                value={targetKb}
                onChange={(e) => setTargetKb(Number(e.target.value) || 50)}
                className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm tabular-nums"
              />
            </div>
          </div>

          {layout === 'vertical' && (
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <span>Signature Box Height Ratio</span>
                <span className="tabular-nums">{sigRatioPct}%</span>
              </div>
              <input
                type="range"
                min={18}
                max={45}
                value={sigRatioPct}
                onChange={(e) => setSigRatioPct(Number(e.target.value))}
                className="w-full accent-violet-600"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Optional Bottom Name / Date Label
            </label>
            <input
              type="text"
              value={labelText}
              onChange={(e) => setLabelText(e.target.value)}
              placeholder="Leave blank if not required"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
            />
          </div>

          <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={cleanSigBg}
                onChange={(e) => setCleanSigBg(e.target.checked)}
                className="accent-violet-600"
              />
              Whiten signature paper background automatically
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={addBorder}
                onChange={(e) => setAddBorder(e.target.checked)}
                className="accent-violet-600"
              />
              Add clean outer border &amp; divider line
            </label>
          </div>

          <button
            type="button"
            disabled={!photoUrl || !sigUrl || processing}
            onClick={handleCombine}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-bold cursor-pointer"
          >
            <Combine className="w-4 h-4" />
            {processing ? 'Combining...' : 'Combine Photo + Signature'}
          </button>
        </div>

        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-sm font-extrabold text-slate-900 dark:text-white">
              Combined Output Preview
            </span>
            {outputBytes > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                <CheckCircle2 className="w-4 h-4" />
                {(outputBytes / 1024).toFixed(1)} KB ({outWidth}×{outHeight} px)
              </span>
            )}
          </div>

          {outputUrl ? (
            <div className="space-y-4 text-center">
              <img
                src={outputUrl}
                alt="Combined Photo and Signature"
                className="max-h-96 mx-auto rounded-xl border border-slate-300 dark:border-slate-700 shadow-xs"
              />
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => printImageOnA4(outputUrl, 'Photo + Signature Sheet', 'A4')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Print A4
                </button>
                <a
                  href={outputUrl}
                  download="photo-signature-combined.jpg"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  <Download className="w-4 h-4" />
                  Download JPG
                </a>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-xs text-slate-400">
              Upload both Passport Photo and Signature above, then click Combine Photo + Signature.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

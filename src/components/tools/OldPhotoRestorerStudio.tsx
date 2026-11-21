import React, { useEffect, useState } from 'react';
import { Sparkles, Upload, Download, Printer, RotateCcw } from 'lucide-react';
import type { AppLang } from '../../data/i18n';
import { printImageOnA4 } from '../../utils/printHelper';

interface OldPhotoRestorerStudioProps {
  appLang: AppLang;
}

type ColorStyle = 'natural-restore' | 'studio-warm-color' | 'vintage-sepia' | 'crisp-bw-portrait';

export const OldPhotoRestorerStudio: React.FC<OldPhotoRestorerStudioProps> = ({ appLang }) => {
  const isBn = appLang === 'bn';
  const [srcUrl, setSrcUrl] = useState<string | null>(null);
  const [restoredUrl, setRestoredUrl] = useState<string | null>(null);
  const [splitPct, setSplitPct] = useState(50);

  const [denoiseLevel, setDenoiseLevel] = useState(35);
  const [sharpness, setSharpness] = useState(55);
  const [autoLevels, setAutoLevels] = useState(true);
  const [upscale2x, setUpscale2x] = useState(true);
  const [colorStyle, setColorStyle] = useState<ColorStyle>('natural-restore');
  const [processing, setProcessing] = useState(false);

  const handleUpload = (file: File | undefined) => {
    if (!file) return;
    setSrcUrl(URL.createObjectURL(file));
  };

  useEffect(() => {
    if (!srcUrl) return;
    let cancelled = false;
    setProcessing(true);

    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      const baseMax = upscale2x ? 1600 : 1000;
      const factor = upscale2x ? Math.min(2, baseMax / Math.max(img.width, img.height, 1)) : Math.min(1, baseMax / Math.max(img.width, img.height, 1));
      const w = Math.max(120, Math.round(img.width * factor));
      const h = Math.max(120, Math.round(img.height * factor));

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, w, h);

      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      // Step 1: 3x3 Dust/Speckle Denoise Blend (reduces vintage grain & pinhole dust spots)
      if (denoiseLevel > 0) {
        const copy = new Uint8ClampedArray(data);
        const blend = (denoiseLevel / 100) * 0.65;
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const idx = (y * w + x) * 4;
            for (let c = 0; c < 3; c++) {
              const sum =
                copy[idx - w * 4 - 4 + c] + copy[idx - w * 4 + c] + copy[idx - w * 4 + 4 + c] +
                copy[idx - 4 + c] + copy[idx + c] * 2 + copy[idx + 4 + c] +
                copy[idx + w * 4 - 4 + c] + copy[idx + w * 4 + c] + copy[idx + w * 4 + 4 + c];
              const avg = sum / 10;
              // Preserve edges while smoothing flat grain/dust
              const diff = Math.abs(copy[idx + c] - avg);
              const wgt = diff > 38 ? blend * 0.25 : blend;
              data[idx + c] = Math.round(copy[idx + c] * (1 - wgt) + avg * wgt);
            }
          }
        }
      }

      // Step 2: Auto Histogram Contrast Stretch (fixes faded yellow/washed-out old photos)
      if (autoLevels) {
        let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0;
        for (let i = 0; i < data.length; i += 16) {
          if (data[i] < minR) minR = data[i];
          if (data[i] > maxR) maxR = data[i];
          if (data[i + 1] < minG) minG = data[i + 1];
          if (data[i + 1] > maxG) maxG = data[i + 1];
          if (data[i + 2] < minB) minB = data[i + 2];
          if (data[i + 2] > maxB) maxB = data[i + 2];
        }
        const spanR = Math.max(20, maxR - minR);
        const spanG = Math.max(20, maxG - minG);
        const spanB = Math.max(20, maxB - minB);
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, Math.max(0, Math.round(((data[i] - minR) / spanR) * 250)));
          data[i + 1] = Math.min(255, Math.max(0, Math.round(((data[i + 1] - minG) / spanG) * 250)));
          data[i + 2] = Math.min(255, Math.max(0, Math.round(((data[i + 2] - minB) / spanB) * 250)));
        }
      }

      // Step 3: Unsharp Mask Convolution (restores facial sharpness & eye clarity)
      if (sharpness > 0) {
        const copy = new Uint8ClampedArray(data);
        const amt = (sharpness / 100) * 1.1;
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const idx = (y * w + x) * 4;
            for (let c = 0; c < 3; c++) {
              const blur =
                (copy[idx - w * 4 + c] + copy[idx + w * 4 + c] + copy[idx - 4 + c] + copy[idx + 4 + c] + copy[idx + c] * 4) / 8;
              const sharp = copy[idx + c] + (copy[idx + c] - blur) * amt;
              data[idx + c] = Math.min(255, Math.max(0, Math.round(sharp)));
            }
          }
        }
      }

      // Step 4: Colorization / Studio Tonal Finishing
      if (colorStyle === 'studio-warm-color') {
        for (let i = 0; i < data.length; i += 4) {
          const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          // Split-tone portrait warmth: warm skin midtones, deep cool-neutral shadows
          const r = lum < 128 ? lum * 1.05 + 10 : Math.min(255, lum * 1.08 + 14);
          const g = lum * 0.99 + 4;
          const b = lum < 128 ? lum * 0.94 : lum * 0.90;
          data[i] = Math.min(255, Math.max(0, Math.round(data[i] * 0.45 + r * 0.55)));
          data[i + 1] = Math.min(255, Math.max(0, Math.round(data[i + 1] * 0.45 + g * 0.55)));
          data[i + 2] = Math.min(255, Math.max(0, Math.round(data[i + 2] * 0.45 + b * 0.55)));
        }
      } else if (colorStyle === 'vintage-sepia') {
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          data[i] = Math.min(255, Math.round(r * 0.393 + g * 0.769 + b * 0.189));
          data[i + 1] = Math.min(255, Math.round(r * 0.349 + g * 0.686 + b * 0.168));
          data[i + 2] = Math.min(255, Math.round(r * 0.272 + g * 0.534 + b * 0.131));
        }
      } else if (colorStyle === 'crisp-bw-portrait') {
        for (let i = 0; i < data.length; i += 4) {
          const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
          const boosted = Math.min(255, Math.max(0, Math.round((lum - 128) * 1.15 + 128)));
          data[i] = data[i + 1] = data[i + 2] = boosted;
        }
      }

      ctx.putImageData(imgData, 0, 0);
      setRestoredUrl(canvas.toDataURL('image/jpeg', 0.95));
      setProcessing(false);
    };
    img.src = srcUrl;
    return () => {
      cancelled = true;
    };
  }, [srcUrl, denoiseLevel, sharpness, autoLevels, upscale2x, colorStyle]);

  return (
    <div className="space-y-6">
      <div className="bg-slate-950 text-white rounded-2xl p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span>{isBn ? 'পুরোনো ঝাপসা বা ফাটা ছবি শার্প, দাগমুক্ত, ২× HD আপস্কেল ও কালারাইজ করুন' : '2× HD Upscale · Dust/Grain Denoiser · Auto-Level Restore · Split Before/After'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-1">
            {isBn ? 'পুরোনো ছবি রিস্টোরার ও কালারাইজার স্টুডিও' : 'Old Photo Restorer, HD Enhancer & Colorizer Studio'}
          </h2>
        </div>

        <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer">
          <Upload className="w-4 h-4" />
          {isBn ? 'পুরোনো ছবি আপলোড করুন' : 'Upload Old / Blurry Photo'}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0])} />
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div>
            <div className="text-xs font-bold text-slate-700 mb-2">Restoration Finish</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'natural-restore', label: 'Natural HD Restore' },
                { id: 'studio-warm-color', label: 'Warm Studio Color' },
                { id: 'vintage-sepia', label: 'Classic Sepia' },
                { id: 'crisp-bw-portrait', label: 'Crisp B&W Frame' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setColorStyle(s.id as ColorStyle)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border cursor-pointer ${
                    colorStyle === s.id ? 'bg-slate-900 text-amber-300 border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <label className="block text-xs">
            <span className="font-bold text-slate-700">Detail Sharpness ({sharpness}%)</span>
            <input type="range" min={0} max={100} value={sharpness} onChange={(e) => setSharpness(Number(e.target.value))} className="w-full accent-indigo-600 mt-1" />
          </label>

          <label className="block text-xs">
            <span className="font-bold text-slate-700">Dust & Grain Denoise ({denoiseLevel}%)</span>
            <input type="range" min={0} max={100} value={denoiseLevel} onChange={(e) => setDenoiseLevel(Number(e.target.value))} className="w-full accent-indigo-600 mt-1" />
          </label>

          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
              <input type="checkbox" checked={autoLevels} onChange={(e) => setAutoLevels(e.target.checked)} className="accent-indigo-600" />
              <span>Auto-Fix Faded Contrast & Yellow Tint</span>
            </label>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
              <input type="checkbox" checked={upscale2x} onChange={(e) => setUpscale2x(e.target.checked)} className="accent-indigo-600" />
              <span>2× High-Resolution Frame Print Upscale</span>
            </label>
          </div>

          <button
            type="button"
            onClick={() => { setDenoiseLevel(35); setSharpness(55); setAutoLevels(true); setUpscale2x(true); setColorStyle('natural-restore'); }}
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Settings
          </button>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <a
              href={restoredUrl || undefined}
              download="restored-hd-photo.jpg"
              className={`py-3 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 ${
                restoredUrl ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-200 text-slate-400 pointer-events-none'
              }`}
            >
              <Download className="w-4 h-4" /> Save HD JPG
            </a>
            <button
              type="button"
              disabled={!restoredUrl}
              onClick={() => restoredUrl && printImageOnA4(restoredUrl, 'Restored Photo Print')}
              className="py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print Frame
            </button>
          </div>
        </div>

        {/* Right Interactive Before/After Comparison Stage */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800">
              {processing ? 'Restoring photo pixels...' : 'Interactive Before / After Split Preview'}
            </span>
            {restoredUrl && (
              <span className="font-mono text-slate-500">Slide bar: {splitPct}%</span>
            )}
          </div>

          {srcUrl && restoredUrl ? (
            <div className="space-y-3">
              <div className="relative w-full max-h-[520px] overflow-hidden rounded-xl border border-slate-300 bg-slate-950 select-none">
                <img src={restoredUrl} alt="Restored" className="w-full max-h-[520px] object-contain mx-auto block" />
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ clipPath: `inset(0 ${100 - splitPct}% 0 0)` }}
                >
                  <img src={srcUrl} alt="Original" className="w-full h-full object-contain mx-auto block" />
                </div>
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-amber-400 shadow-lg pointer-events-none"
                  style={{ left: `${splitPct}%` }}
                />
                <span className="absolute top-3 left-3 px-2 py-1 rounded bg-slate-950/75 text-white text-[10px] font-bold">
                  BEFORE
                </span>
                <span className="absolute top-3 right-3 px-2 py-1 rounded bg-emerald-600/90 text-white text-[10px] font-bold">
                  RESTORED HD
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={splitPct}
                onChange={(e) => setSplitPct(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>
          ) : (
            <div className="h-80 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center p-6 text-center text-xs text-slate-400 gap-2">
              <Sparkles className="w-9 h-9 text-slate-300" />
              <span>
                {isBn
                  ? 'পুরোনো বা ঝাপসা পারিবারিক ছবি আপলোড করলে এখানে Before/After স্লাইডারসহ HD রিস্টোর দেখাবে।'
                  : 'Upload a vintage, faded, or blurry portrait to inspect instant Before/After HD restoration.'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

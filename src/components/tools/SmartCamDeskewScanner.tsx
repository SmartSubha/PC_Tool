import React, { useRef, useState } from 'react';
import { Upload, Download, Printer, ScanLine, RotateCcw, Sparkles } from 'lucide-react';
import type { AppLang } from '../../data/i18n';
import { printImageOnA4 } from '../../utils/printHelper';

interface SmartCamDeskewScannerProps {
  appLang: AppLang;
}

interface Point {
  x: number; // 0..1 normalized
  y: number; // 0..1 normalized
}

type EnhanceMode = 'magic-color' | 'white-paper' | 'crisp-bw' | 'original';

// Solve 8x8 linear system for projective homography mapping dst(u,v) -> src(x,y)
function computeHomography(dstPts: [number, number][], srcPts: [number, number][]): number[] {
  const A: number[][] = [];
  const b: number[] = [];
  for (let i = 0; i < 4; i++) {
    const [u, v] = dstPts[i];
    const [x, y] = srcPts[i];
    A.push([u, v, 1, 0, 0, 0, -u * x, -v * x]);
    b.push(x);
    A.push([0, 0, 0, u, v, 1, -u * y, -v * y]);
    b.push(y);
  }
  // Gaussian elimination with partial pivoting
  const n = 8;
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(A[row][col]) > Math.abs(A[pivot][col])) pivot = row;
    }
    [A[col], A[pivot]] = [A[pivot], A[col]];
    [b[col], b[pivot]] = [b[pivot], b[col]];
    const div = A[col][col] || 1e-12;
    for (let j = col; j < n; j++) A[col][j] /= div;
    b[col] /= div;
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = A[row][col];
      for (let j = col; j < n; j++) A[row][j] -= factor * A[col][j];
      b[row] -= factor * b[col];
    }
  }
  return [...b, 1];
}

export const SmartCamDeskewScanner: React.FC<SmartCamDeskewScannerProps> = ({ appLang }) => {
  const isBn = appLang === 'bn';
  const [srcUrl, setSrcUrl] = useState<string | null>(null);
  const [imgDims, setImgDims] = useState<{ w: number; h: number } | null>(null);
  const [corners, setCorners] = useState<[Point, Point, Point, Point]>([
    { x: 0.1, y: 0.1 },
    { x: 0.9, y: 0.1 },
    { x: 0.9, y: 0.9 },
    { x: 0.1, y: 0.9 },
  ]);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [enhanceMode, setEnhanceMode] = useState<EnhanceMode>('white-paper');
  const [shadowRemoval, setShadowRemoval] = useState(72);
  const [aspectPreset, setAspectPreset] = useState<'auto' | 'a4-portrait' | 'a4-landscape' | 'id-card'>('auto');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const stageRef = useRef<HTMLDivElement | null>(null);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImgDims({ w: img.width, h: img.height });
      setSrcUrl(url);
      setResultUrl(null);
      setCorners([
        { x: 0.08, y: 0.08 },
        { x: 0.92, y: 0.08 },
        { x: 0.92, y: 0.92 },
        { x: 0.08, y: 0.92 },
      ]);
    };
    img.src = url;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingIdx === null || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const nx = Math.max(0.01, Math.min(0.99, (e.clientX - rect.left) / rect.width));
    const ny = Math.max(0.01, Math.min(0.99, (e.clientY - rect.top) / rect.height));
    setCorners((prev) => {
      const next = [...prev] as [Point, Point, Point, Point];
      next[draggingIdx] = { x: nx, y: ny };
      return next;
    });
  };

  const runDeskewAndClean = () => {
    if (!srcUrl || !imgDims) return;
    setProcessing(true);

    const img = new Image();
    img.onload = () => {
      const sw = img.width;
      const sh = img.height;
      const srcCanvas = document.createElement('canvas');
      srcCanvas.width = sw;
      srcCanvas.height = sh;
      const sctx = srcCanvas.getContext('2d')!;
      sctx.drawImage(img, 0, 0);
      const srcData = sctx.getImageData(0, 0, sw, sh).data;

      const srcPts: [number, number][] = corners.map((c) => [c.x * sw, c.y * sh]);

      // Determine output width & height
      const topW = Math.hypot(srcPts[1][0] - srcPts[0][0], srcPts[1][1] - srcPts[0][1]);
      const botW = Math.hypot(srcPts[2][0] - srcPts[3][0], srcPts[2][1] - srcPts[3][1]);
      const leftH = Math.hypot(srcPts[3][0] - srcPts[0][0], srcPts[3][1] - srcPts[0][1]);
      const rightH = Math.hypot(srcPts[2][0] - srcPts[1][0], srcPts[2][1] - srcPts[1][1]);

      let outW = Math.round(Math.max(topW, botW));
      let outH = Math.round(Math.max(leftH, rightH));
      const maxDim = 1500;
      if (aspectPreset === 'a4-portrait') {
        outW = 1240;
        outH = 1754;
      } else if (aspectPreset === 'a4-landscape') {
        outW = 1754;
        outH = 1240;
      } else if (aspectPreset === 'id-card') {
        outW = 1012;
        outH = 638;
      } else {
        const scale = Math.min(1, maxDim / Math.max(outW, outH, 1));
        outW = Math.max(300, Math.round(outW * scale));
        outH = Math.max(300, Math.round(outH * scale));
      }

      const dstPts: [number, number][] = [
        [0, 0],
        [outW - 1, 0],
        [outW - 1, outH - 1],
        [0, outH - 1],
      ];
      const H = computeHomography(dstPts, srcPts);

      const outCanvas = document.createElement('canvas');
      outCanvas.width = outW;
      outCanvas.height = outH;
      const octx = outCanvas.getContext('2d')!;
      const outImg = octx.createImageData(outW, outH);
      const od = outImg.data;

      // Bilinear projective warp
      for (let y = 0; y < outH; y++) {
        for (let x = 0; x < outW; x++) {
          const denom = H[6] * x + H[7] * y + 1;
          const sx = (H[0] * x + H[1] * y + H[2]) / denom;
          const sy = (H[3] * x + H[4] * y + H[5]) / denom;
          const x0 = Math.floor(sx);
          const y0 = Math.floor(sy);
          const idx = (y * outW + x) * 4;
          if (x0 >= 0 && x0 < sw - 1 && y0 >= 0 && y0 < sh - 1) {
            const dx = sx - x0;
            const dy = sy - y0;
            const i00 = (y0 * sw + x0) * 4;
            const i10 = i00 + 4;
            const i01 = i00 + sw * 4;
            const i11 = i01 + 4;
            for (let c = 0; c < 3; c++) {
              const v0 = srcData[i00 + c] * (1 - dx) + srcData[i10 + c] * dx;
              const v1 = srcData[i01 + c] * (1 - dx) + srcData[i11 + c] * dx;
              od[idx + c] = Math.round(v0 * (1 - dy) + v1 * dy);
            }
            od[idx + 3] = 255;
          } else {
            od[idx] = 255;
            od[idx + 1] = 255;
            od[idx + 2] = 255;
            od[idx + 3] = 255;
          }
        }
      }
      octx.putImageData(outImg, 0, 0);

      // Adaptive shadow removal via downsampled background illumination division
      if (enhanceMode !== 'original') {
        const blurW = Math.max(24, Math.round(outW / 24));
        const blurH = Math.max(24, Math.round(outH / 24));
        const bgSmall = document.createElement('canvas');
        bgSmall.width = blurW;
        bgSmall.height = blurH;
        const bctx = bgSmall.getContext('2d')!;
        bctx.filter = 'blur(4px)';
        bctx.drawImage(outCanvas, 0, 0, blurW, blurH);

        const bgUp = document.createElement('canvas');
        bgUp.width = outW;
        bgUp.height = outH;
        const uctx = bgUp.getContext('2d')!;
        uctx.drawImage(bgSmall, 0, 0, outW, outH);
        const bgData = uctx.getImageData(0, 0, outW, outH).data;

        const cur = octx.getImageData(0, 0, outW, outH);
        const cd = cur.data;
        const strength = shadowRemoval / 100;

        for (let i = 0; i < cd.length; i += 4) {
          const r = cd[i], g = cd[i + 1], b = cd[i + 2];
          const br = Math.max(40, bgData[i]);
          const bg = Math.max(40, bgData[i + 1]);
          const bb = Math.max(40, bgData[i + 2]);

          // Illumination-divided normalized pixel
          let nr = Math.min(255, (r / br) * 248);
          let ng = Math.min(255, (g / bg) * 248);
          let nb = Math.min(255, (b / bb) * 248);

          nr = r * (1 - strength) + nr * strength;
          ng = g * (1 - strength) + ng * strength;
          nb = b * (1 - strength) + nb * strength;

          if (enhanceMode === 'crisp-bw') {
            const lum = 0.299 * nr + 0.587 * ng + 0.114 * nb;
            const v = lum < 178 ? Math.max(0, (lum - 35) * 1.15) : 255;
            cd[i] = cd[i + 1] = cd[i + 2] = Math.min(255, Math.max(0, Math.round(v)));
          } else if (enhanceMode === 'white-paper') {
            const lum = 0.299 * nr + 0.587 * ng + 0.114 * nb;
            if (lum > 205) {
              cd[i] = cd[i + 1] = cd[i + 2] = 255;
            } else {
              // Boost ink richness while keeping colored seals/stamps intact
              const contrast = 1.24;
              cd[i] = Math.min(255, Math.max(0, Math.round((nr - 128) * contrast + 122)));
              cd[i + 1] = Math.min(255, Math.max(0, Math.round((ng - 128) * contrast + 122)));
              cd[i + 2] = Math.min(255, Math.max(0, Math.round((nb - 128) * contrast + 122)));
            }
          } else {
            // magic-color
            const contrast = 1.16;
            cd[i] = Math.min(255, Math.max(0, Math.round((nr - 128) * contrast + 132)));
            cd[i + 1] = Math.min(255, Math.max(0, Math.round((ng - 128) * contrast + 132)));
            cd[i + 2] = Math.min(255, Math.max(0, Math.round((nb - 128) * contrast + 132)));
          }
        }
        octx.putImageData(cur, 0, 0);
      }

      setResultUrl(outCanvas.toDataURL('image/jpeg', 0.94));
      setProcessing(false);
    };
    img.src = srcUrl;
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-950 text-white rounded-2xl p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
            <ScanLine className="w-4 h-4" />
            <span>{isBn ? '৪-কর্নার পার্সপেক্টিভ সোজা করা + ছায়া ও অন্ধকার রিমুভার' : '4-Corner Perspective Flatten · Shadow & Illumination Remover'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-1">
            {isBn ? 'স্মার্ট মোবাইল ক্যাম ডকুমেন্ট অটো-ডেসকিউ ও ছায়া ক্লিনার' : 'Smart Mobile Cam Auto-Deskew & Shadow Remover Pro'}
          </h2>
        </div>

        <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer">
          <Upload className="w-4 h-4" />
          {isBn ? 'বাঁকা ডকুমেন্ট ছবি আপলোড' : 'Upload Crooked Photo'}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
        </label>
      </div>

      {/* Controls Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'white-paper', label: isBn ? 'সাদা কাগজ (স্ট্যাম্পসহ)' : 'White Paper (Keep Seals)' },
            { id: 'crisp-bw', label: isBn ? 'গাঢ় সাদা-কালো জেরক্স' : 'Crisp B&W Scan' },
            { id: 'magic-color', label: 'Magic Color' },
            { id: 'original', label: 'Deskew Only' },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setEnhanceMode(m.id as EnhanceMode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                enhanceMode === m.id ? 'bg-slate-900 text-amber-300' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <select
          value={aspectPreset}
          onChange={(e) => setAspectPreset(e.target.value as typeof aspectPreset)}
          className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white"
        >
          <option value="auto">Auto Aspect Ratio</option>
          <option value="a4-portrait">A4 Portrait</option>
          <option value="a4-landscape">A4 Landscape</option>
          <option value="id-card">ID Smart Card</option>
        </select>

        {enhanceMode !== 'original' && (
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <span>Shadow Removal ({shadowRemoval}%)</span>
            <input
              type="range"
              min={20}
              max={100}
              value={shadowRemoval}
              onChange={(e) => setShadowRemoval(Number(e.target.value))}
              className="w-28 accent-indigo-600"
            />
          </label>
        )}

        <button
          type="button"
          disabled={!srcUrl || processing}
          onClick={runDeskewAndClean}
          className="ml-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-black inline-flex items-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          {processing ? 'Flattening...' : isBn ? 'সোজা ও পরিষ্কার স্ক্যান বানান' : 'Flatten & Remove Shadows'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Interactive 4-Corner Selection Stage */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              {isBn ? '৪টি নীল পয়েন্ট টেনে ডকুমেন্টের ৪ কোনায় বসান' : 'Drag the 4 Corner Handles onto the Document Corners'}
            </span>
            {srcUrl && (
              <button
                type="button"
                onClick={() =>
                  setCorners([
                    { x: 0.08, y: 0.08 },
                    { x: 0.92, y: 0.08 },
                    { x: 0.92, y: 0.92 },
                    { x: 0.08, y: 0.92 },
                  ])
                }
                className="text-xs font-semibold text-slate-500 hover:text-indigo-600 inline-flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Corners
              </button>
            )}
          </div>

          {srcUrl ? (
            <div
              ref={stageRef}
              onPointerMove={handlePointerMove}
              onPointerUp={() => setDraggingIdx(null)}
              onPointerLeave={() => setDraggingIdx(null)}
              className="relative w-full select-none touch-none rounded-xl overflow-hidden border border-slate-300 bg-slate-900"
            >
              <img src={srcUrl} alt="Source crooked document" className="w-full h-auto block pointer-events-none" />
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
                <polygon
                  points={corners.map((c) => `${c.x * 100},${c.y * 100}`).join(' ')}
                  fill="rgba(79,70,229,0.14)"
                  stroke="#38bdf8"
                  strokeWidth="0.8"
                />
              </svg>
              {corners.map((pt, idx) => (
                <div
                  key={idx}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                    setDraggingIdx(idx);
                  }}
                  style={{ left: `${pt.x * 100}%`, top: `${pt.y * 100}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-sky-500 border-2 border-white shadow-lg flex items-center justify-center text-[10px] font-black text-white cursor-grab active:cursor-grabbing"
                >
                  {['TL', 'TR', 'BR', 'BL'][idx]}
                </div>
              ))}
            </div>
          ) : (
            <div className="h-80 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center p-6 text-center text-xs text-slate-500 gap-2">
              <ScanLine className="w-9 h-9 text-slate-400" />
              <span>
                {isBn
                  ? 'মোবাইলে বাঁকা হয়ে বা ছায়া পড়ে তোলা আধার, মার্কশিট বা দলিলের ছবি আপলোড করুন'
                  : 'Upload a skewed or shadowed phone photo of any paper document to deskew & brighten'}
              </span>
            </div>
          )}
        </div>

        {/* Right: Flattened Clean Output */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between gap-4">
          <div className="text-xs font-bold text-slate-800">
            {isBn ? 'সোজা ও ঝকঝকে স্ক্যান আউটপুট' : 'Flattened & Shadow-Free Scan Output'}
          </div>
          {resultUrl ? (
            <img src={resultUrl} alt="Cleaned flattened scan" className="w-full max-h-[520px] object-contain rounded-xl border border-slate-200 bg-slate-50" />
          ) : (
            <div className="h-80 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-400 p-6 text-center">
              {isBn
                ? '৪ কোনা মিলিয়ে "সোজা ও পরিষ্কার স্ক্যান বানান" বাটনে ক্লিক করুন।'
                : 'Align the 4 corners and click "Flatten & Remove Shadows" to preview.'}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <a
              href={resultUrl || undefined}
              download="deskewed-clean-scan.jpg"
              className={`py-3 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-2 ${
                resultUrl ? 'bg-slate-900 hover:bg-slate-800 text-white' : 'bg-slate-200 text-slate-400 pointer-events-none'
              }`}
            >
              <Download className="w-4 h-4" /> Download Scan JPG
            </a>
            <button
              type="button"
              disabled={!resultUrl}
              onClick={() => resultUrl && printImageOnA4(resultUrl, 'Cleaned Document Scan')}
              className="py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-black inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print A4 Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

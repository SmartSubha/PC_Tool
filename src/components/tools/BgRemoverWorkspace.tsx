import React, { useEffect, useRef, useState } from 'react';
import {
  Upload,
  Download,
  Printer,
  Eraser,
  Pipette,
  Undo2,
  Paintbrush,
  Sparkles,
  CheckCircle2,
  Image as ImageIcon,
  SlidersHorizontal,
} from 'lucide-react';
import { printImageOnA4 } from '../../utils/printHelper';

type BgFillMode =
  | { type: 'transparent' }
  | { type: 'solid'; color: string }
  | { type: 'gradient'; from: string; to: string; label: string }
  | { type: 'image'; url: string };

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

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
        else reject(new Error('Failed to generate image'));
      },
      mime,
      quality
    );
  });
}

const SOLID_SWATCHES = [
  { color: '#ffffff', label: 'Pure White' },
  { color: '#dbeafe', label: 'Passport Light Blue' },
  { color: '#0ea5e9', label: 'Studio Sky Blue' },
  { color: '#1d4ed8', label: 'Royal Blue' },
  { color: '#e2e8f0', label: 'Soft Studio Grey' },
  { color: '#dc2626', label: 'Crimson Red' },
];

const GRADIENT_PRESETS = [
  { from: '#eff6ff', to: '#93c5fd', label: 'Sky Blue Gradient' },
  { from: '#f8fafc', to: '#cbd5e1', label: 'Studio Silver' },
  { from: '#fff1f2', to: '#fda4af', label: 'Soft Rose Studio' },
];

export const BgRemoverWorkspace: React.FC = () => {
  const [sourceFile, setSourceFile] = useState<{
    file: File;
    url: string;
    origW: number;
    origH: number;
    workW: number;
    workH: number;
  } | null>(null);

  const [removalMode, setRemovalMode] = useState<'edge-flood' | 'global-key'>('edge-flood');
  const [tolerance, setTolerance] = useState<number>(36);
  const [featherLevel, setFeatherLevel] = useState<number>(1);
  const [dehaloEdges, setDehaloEdges] = useState<boolean>(true);
  const [samplePoints, setSamplePoints] = useState<[number, number, number][]>([]);
  const [bgFill, setBgFill] = useState<BgFillMode>({ type: 'transparent' });
  const [customSolidColor, setCustomSolidColor] = useState<string>('#2563eb');
  const [targetKb, setTargetKb] = useState<number>(50);

  // Brush tool state: 'view' | 'erase' | 'restore'
  const [brushMode, setBrushMode] = useState<'view' | 'erase' | 'restore'>('view');
  const [brushSize, setBrushSize] = useState<number>(24);
  const [brushStrokeCount, setBrushStrokeCount] = useState<number>(0);

  const [processing, setProcessing] = useState<boolean>(false);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [outputBytes, setOutputBytes] = useState<number>(0);
  const [statusMsg, setStatusMsg] = useState<string>('');

  // Internal offscreen buffers
  const origImageDataRef = useRef<ImageData | null>(null);
  const manualMaskRef = useRef<Int8Array | null>(null); // 0 = auto, -1 = force erase, 1 = force restore
  const autoAlphaRef = useRef<Uint8ClampedArray | null>(null);
  const finalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgImgElementRef = useRef<HTMLImageElement | null>(null);
  const isPaintingRef = useRef<boolean>(false);
  const previewWrapRef = useRef<HTMLDivElement | null>(null);

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = await loadImage(url);
    const maxDim = 1400;
    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
    const workW = Math.max(1, Math.round(img.naturalWidth * scale));
    const workH = Math.max(1, Math.round(img.naturalHeight * scale));

    const off = document.createElement('canvas');
    off.width = workW;
    off.height = workH;
    const ctx = off.getContext('2d')!;
    ctx.drawImage(img, 0, 0, workW, workH);
    origImageDataRef.current = ctx.getImageData(0, 0, workW, workH);
    manualMaskRef.current = new Int8Array(workW * workH);
    autoAlphaRef.current = new Uint8ClampedArray(workW * workH);

    setSourceFile({
      file,
      url,
      origW: img.naturalWidth,
      origH: img.naturalHeight,
      workW,
      workH,
    });
    setSamplePoints([]);
    setBrushStrokeCount(0);
    setBrushMode('view');
    setStatusMsg('');
  };

  // Compute auto-removal alpha mask whenever parameters change
  useEffect(() => {
    if (!sourceFile || !origImageDataRef.current) return;
    let cancelled = false;

    const computeAndComposite = async () => {
      setProcessing(true);
      const src = origImageDataRef.current!;
      const w = src.width;
      const h = src.height;
      const d = src.data;
      const alpha = new Uint8ClampedArray(w * h);
      for (let i = 0; i < w * h; i++) {
        alpha[i] = d[i * 4 + 3];
      }

      // Reference colors: either user-clicked points or auto corner samples
      const refs: [number, number, number][] =
        samplePoints.length > 0
          ? samplePoints
          : (() => {
              const corners = [
                [0, 0],
                [w - 1, 0],
                [Math.floor(w / 2), 0],
                [0, Math.floor(h * 0.25)],
                [w - 1, Math.floor(h * 0.25)],
              ];
              return corners.map(([cx, cy]) => {
                const p = (cy * w + cx) * 4;
                return [d[p], d[p + 1], d[p + 2]] as [number, number, number];
              });
            })();

      const maxDist = tolerance * 2.25;

      const colorDistToRefs = (r: number, g: number, b: number): number => {
        let best = Infinity;
        for (let k = 0; k < refs.length; k++) {
          const ref = refs[k];
          const dist = Math.sqrt((r - ref[0]) ** 2 + (g - ref[1]) ** 2 + (b - ref[2]) ** 2);
          if (dist < best) best = dist;
        }
        return best;
      };

      if (removalMode === 'global-key') {
        for (let idx = 0; idx < w * h; idx++) {
          const p = idx * 4;
          const dist = colorDistToRefs(d[p], d[p + 1], d[p + 2]);
          if (dist <= maxDist) {
            alpha[idx] = 0;
          } else if (featherLevel > 0 && dist <= maxDist + featherLevel * 18) {
            const ratio = (dist - maxDist) / (featherLevel * 18);
            alpha[idx] = Math.round(alpha[idx] * Math.min(1, Math.max(0, ratio)));
          }
        }
      } else {
        const visited = new Uint8Array(w * h);
        const queue = new Int32Array(w * h);
        let head = 0;
        let tail = 0;

        const pushIfMatch = (x: number, y: number) => {
          const idx = y * w + x;
          if (visited[idx]) return;
          const p = idx * 4;
          if (d[p + 3] === 0) {
            visited[idx] = 1;
            queue[tail++] = idx;
            return;
          }
          const dist = colorDistToRefs(d[p], d[p + 1], d[p + 2]);
          if (dist <= maxDist) {
            visited[idx] = 1;
            queue[tail++] = idx;
          }
        };

        for (let x = 0; x < w; x++) {
          pushIfMatch(x, 0);
          pushIfMatch(x, h - 1);
        }
        for (let y = 0; y < h; y++) {
          pushIfMatch(0, y);
          pushIfMatch(w - 1, y);
        }

        while (head < tail) {
          const idx = queue[head++];
          alpha[idx] = 0;
          const x = idx % w;
          const y = (idx - x) / w;
          if (x > 0) pushIfMatch(x - 1, y);
          if (x < w - 1) pushIfMatch(x + 1, y);
          if (y > 0) pushIfMatch(x, y - 1);
          if (y < h - 1) pushIfMatch(x, y + 1);
        }

        // Smooth edge feathering passes
        if (featherLevel > 0) {
          for (let pass = 0; pass < featherLevel; pass++) {
            const copy = new Uint8ClampedArray(alpha);
            for (let y = 1; y < h - 1; y++) {
              for (let x = 1; x < w - 1; x++) {
                const idx = y * w + x;
                if (copy[idx] === 0) continue;
                const zeroNeighbors =
                  (copy[idx - 1] === 0 ? 1 : 0) +
                  (copy[idx + 1] === 0 ? 1 : 0) +
                  (copy[idx - w] === 0 ? 1 : 0) +
                  (copy[idx + w] === 0 ? 1 : 0);
                if (zeroNeighbors > 0) {
                  const avg = Math.round(
                    (copy[idx] * 2 +
                      copy[idx - 1] +
                      copy[idx + 1] +
                      copy[idx - w] +
                      copy[idx + w]) /
                      6
                  );
                  alpha[idx] = avg;
                }
              }
            }
          }
        }
      }

      autoAlphaRef.current = alpha;

      if (bgFill.type === 'image') {
        try {
          bgImgElementRef.current = await loadImage(bgFill.url);
        } catch {
          bgImgElementRef.current = null;
        }
      } else {
        bgImgElementRef.current = null;
      }

      if (!cancelled) {
        await compositeFinalOutput();
        setProcessing(false);
      }
    };

    computeAndComposite();
    return () => {
      cancelled = true;
    };
  }, [sourceFile, removalMode, tolerance, featherLevel, dehaloEdges, samplePoints, bgFill]);

  const compositeFinalOutput = async () => {
    if (!origImageDataRef.current || !autoAlphaRef.current || !manualMaskRef.current) return;
    const src = origImageDataRef.current;
    const w = src.width;
    const h = src.height;
    const d = src.data;
    const autoA = autoAlphaRef.current;
    const manual = manualMaskRef.current;

    // Build foreground canvas
    const fgCanvas = document.createElement('canvas');
    fgCanvas.width = w;
    fgCanvas.height = h;
    const fgCtx = fgCanvas.getContext('2d')!;
    const outData = fgCtx.createImageData(w, h);
    const od = outData.data;

    for (let idx = 0; idx < w * h; idx++) {
      const p = idx * 4;
      let r = d[p];
      let g = d[p + 1];
      let b = d[p + 2];
      let a = autoA[idx];

      if (manual[idx] === -1) a = 0;
      else if (manual[idx] === 1) a = d[p + 3];

      // Subtle edge de-halo / desaturate on semi-transparent border pixels
      if (dehaloEdges && a > 0 && a < 215 && manual[idx] !== 1) {
        const avg = Math.round((r + g + b) / 3);
        r = Math.round(r * 0.65 + avg * 0.35);
        g = Math.round(g * 0.65 + avg * 0.35);
        b = Math.round(b * 0.65 + avg * 0.35);
      }

      od[p] = r;
      od[p + 1] = g;
      od[p + 2] = b;
      od[p + 3] = a;
    }
    fgCtx.putImageData(outData, 0, 0);

    // Final composite canvas
    const comp = finalCanvasRef.current || document.createElement('canvas');
    finalCanvasRef.current = comp;
    comp.width = w;
    comp.height = h;
    const cCtx = comp.getContext('2d')!;
    cCtx.clearRect(0, 0, w, h);

    if (bgFill.type === 'solid') {
      cCtx.fillStyle = bgFill.color;
      cCtx.fillRect(0, 0, w, h);
    } else if (bgFill.type === 'gradient') {
      const grad = cCtx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, bgFill.from);
      grad.addColorStop(1, bgFill.to);
      cCtx.fillStyle = grad;
      cCtx.fillRect(0, 0, w, h);
    } else if (bgFill.type === 'image' && bgImgElementRef.current) {
      const bgImg = bgImgElementRef.current;
      const scale = Math.max(w / bgImg.naturalWidth, h / bgImg.naturalHeight);
      const dw = bgImg.naturalWidth * scale;
      const dh = bgImg.naturalHeight * scale;
      cCtx.drawImage(bgImg, (w - dw) / 2, (h - dh) / 2, dw, dh);
    }

    cCtx.drawImage(fgCanvas, 0, 0);
    const blob = await canvasToBlob(comp, 'image/png');
    setOutputUrl(comp.toDataURL('image/png'));
    setOutputBytes(blob.size);
    setStatusMsg(`${w} × ${h} px ready`);
  };

  const handleSampleSourceClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!origImageDataRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const rx = (e.clientX - rect.left) / rect.width;
    const ry = (e.clientY - rect.top) / rect.height;
    const src = origImageDataRef.current;
    const px = Math.min(src.width - 1, Math.max(0, Math.floor(rx * src.width)));
    const py = Math.min(src.height - 1, Math.max(0, Math.floor(ry * src.height)));
    const p = (py * src.width + px) * 4;
    const rgb: [number, number, number] = [src.data[p], src.data[p + 1], src.data[p + 2]];
    setSamplePoints((prev) => [...prev.slice(-4), rgb]);
  };

  const applyBrushAt = (clientX: number, clientY: number) => {
    if (brushMode === 'view' || !previewWrapRef.current || !manualMaskRef.current || !origImageDataRef.current) {
      return;
    }
    const rect = previewWrapRef.current.getBoundingClientRect();
    const rx = (clientX - rect.left) / rect.width;
    const ry = (clientY - rect.top) / rect.height;
    const w = origImageDataRef.current.width;
    const h = origImageDataRef.current.height;
    const cx = Math.floor(rx * w);
    const cy = Math.floor(ry * h);
    const radius = Math.max(3, Math.round((brushSize / rect.width) * w * 0.45));
    const r2 = radius * radius;
    const mask = manualMaskRef.current;
    const val = brushMode === 'erase' ? -1 : 1;

    const minY = Math.max(0, cy - radius);
    const maxY = Math.min(h - 1, cy + radius);
    const minX = Math.max(0, cx - radius);
    const maxX = Math.min(w - 1, cx + radius);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= r2) {
          mask[y * w + x] = val;
        }
      }
    }
    compositeFinalOutput();
  };

  const handleDownloadJpg = async (exactKb?: number) => {
    if (!finalCanvasRef.current) return;
    const srcComp = finalCanvasRef.current;
    const jpgCanvas = document.createElement('canvas');
    jpgCanvas.width = srcComp.width;
    jpgCanvas.height = srcComp.height;
    const ctx = jpgCanvas.getContext('2d')!;
    // Ensure clean white behind transparent cutouts when saving as JPEG
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, jpgCanvas.width, jpgCanvas.height);
    ctx.drawImage(srcComp, 0, 0);

    let blob: Blob;
    if (exactKb) {
      const targetBytes = exactKb * 1024;
      let low = 0.08;
      let high = 0.96;
      let best = await canvasToBlob(jpgCanvas, 'image/jpeg', 0.5);
      for (let i = 0; i < 8; i++) {
        const mid = (low + high) / 2;
        const candidate = await canvasToBlob(jpgCanvas, 'image/jpeg', mid);
        if (candidate.size <= targetBytes) {
          best = candidate;
          low = mid;
        } else {
          high = mid;
        }
      }
      blob = best;
    } else {
      blob = await canvasToBlob(jpgCanvas, 'image/jpeg', 0.94);
    }

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = exactKb ? `bg-removed-${exactKb}kb.jpg` : 'bg-removed.jpg';
    a.click();
    setStatusMsg(`Exported JPG (${formatBytes(blob.size)})`);
  };

  return (
    <div className="space-y-6">
      {/* Upload Dropzone */}
      <label className="block border-2 border-dashed border-violet-300 dark:border-violet-700 hover:border-violet-500 bg-violet-50/50 dark:bg-violet-950/30 rounded-2xl p-8 text-center cursor-pointer transition-colors">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleUpload(e.target.files?.[0])}
          className="hidden"
        />
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-violet-500/25">
          <Upload className="w-6 h-6" />
        </div>
        <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
          {sourceFile
            ? `${sourceFile.file.name} (${sourceFile.origW} × ${sourceFile.origH} px) — click to replace`
            : 'Upload Portrait, Product, Signature or Stamp (JPG, PNG, WEBP)'}
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Smart Edge Flood-Fill + Global Signature/Logo Key + Erase/Restore Touch-Up Brush
        </p>
      </label>

      {sourceFile && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Panel */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-slate-100">
                <SlidersHorizontal className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                <span>BG Remover Pro Controls</span>
              </div>
              {samplePoints.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSamplePoints([])}
                  className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
                >
                  Reset Samples
                </button>
              )}
            </div>

            {/* Mode Switch */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Removal Engine Mode
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setRemovalMode('edge-flood')}
                  className={`py-2 px-2 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    removalMode === 'edge-flood'
                      ? 'bg-white dark:bg-slate-900 text-violet-700 dark:text-violet-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Portrait / Photo (Edges)
                </button>
                <button
                  type="button"
                  onClick={() => setRemovalMode('global-key')}
                  className={`py-2 px-2 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    removalMode === 'global-key'
                      ? 'bg-white dark:bg-slate-900 text-violet-700 dark:text-violet-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Sign / Stamp / Logo
                </button>
              </div>
            </div>

            {/* Tolerance & Feathering */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Color Tolerance</span>
                  <span className="tabular-nums">{tolerance}</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={95}
                  value={tolerance}
                  onChange={(e) => setTolerance(Number(e.target.value))}
                  className="w-full accent-violet-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Edge Smoothness (Feather)</span>
                  <span className="tabular-nums">{featherLevel} px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={3}
                  step={1}
                  value={featherLevel}
                  onChange={(e) => setFeatherLevel(Number(e.target.value))}
                  className="w-full accent-violet-600"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dehaloEdges}
                  onChange={(e) => setDehaloEdges(e.target.checked)}
                  className="accent-violet-600 w-4 h-4"
                />
                Reduce Color Halo on Edges (চুলের ধার পরিষ্কার)
              </label>
            </div>

            {/* Multi-Point Sample Strip */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                <span className="inline-flex items-center gap-1.5">
                  <Pipette className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                  Sampled BG Colors ({samplePoints.length || 'Auto'})
                </span>
                <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                  Click photo to add (up to 5)
                </span>
              </div>
              {samplePoints.length > 0 && (
                <div className="flex items-center gap-2 pt-1">
                  {samplePoints.map((rgb, i) => (
                    <button
                      key={i}
                      type="button"
                      title="Click to remove this sample color"
                      onClick={() => setSamplePoints((prev) => prev.filter((_, idx) => idx !== i))}
                      style={{ backgroundColor: `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})` }}
                      className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-600 shadow-xs cursor-pointer"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Touch-Up Brush Controls */}
            <div className="p-3.5 rounded-xl bg-emerald-50/75 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-950 dark:text-emerald-200">
                  <Paintbrush className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Manual Touch-Up Brush
                </span>
                {brushStrokeCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (manualMaskRef.current) manualMaskRef.current.fill(0);
                      setBrushStrokeCount(0);
                      compositeFinalOutput();
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 hover:underline cursor-pointer"
                  >
                    <Undo2 className="w-3 h-3" />
                    Reset Edits
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'view', label: 'Inspect' },
                  { id: 'erase', label: 'Erase BG' },
                  { id: 'restore', label: 'Restore' },
                ].map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBrushMode(b.id as typeof brushMode)}
                    className={`py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                      brushMode === b.id
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-emerald-200 dark:border-emerald-800'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>

              {brushMode !== 'view' && (
                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                    <span>Brush Size ({brushMode === 'erase' ? 'Draw on Output to Erase' : 'Draw on Output to Restore'})</span>
                    <span className="tabular-nums">{brushSize} px</span>
                  </div>
                  <input
                    type="range"
                    min={8}
                    max={64}
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                </div>
              )}
            </div>

            {/* Replacement Background Studio */}
            <div className="space-y-2.5 pt-1">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                New Studio Background Fill
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBgFill({ type: 'transparent' })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                    bgFill.type === 'transparent'
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Transparent
                </button>

                {SOLID_SWATCHES.map((sw) => {
                  const active = bgFill.type === 'solid' && bgFill.color.toLowerCase() === sw.color;
                  return (
                    <button
                      key={sw.color}
                      type="button"
                      title={sw.label}
                      onClick={() => setBgFill({ type: 'solid', color: sw.color })}
                      style={{ backgroundColor: sw.color }}
                      className={`w-7 h-7 rounded-full border-2 cursor-pointer transition-transform ${
                        active
                          ? 'border-violet-600 dark:border-amber-400 scale-115 ring-2 ring-violet-300'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    />
                  );
                })}

                <label
                  title="Pick any custom solid color"
                  className="relative w-7 h-7 rounded-full border-2 border-slate-400 dark:border-slate-500 overflow-hidden cursor-pointer bg-gradient-to-tr from-rose-500 via-amber-400 to-sky-500"
                >
                  <input
                    type="color"
                    value={customSolidColor}
                    onChange={(e) => {
                      setCustomSolidColor(e.target.value);
                      setBgFill({ type: 'solid', color: e.target.value });
                    }}
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                  />
                </label>
              </div>

              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {GRADIENT_PRESETS.map((g) => {
                  const active = bgFill.type === 'gradient' && bgFill.label === g.label;
                  return (
                    <button
                      key={g.label}
                      type="button"
                      onClick={() => setBgFill({ type: 'gradient', ...g })}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border cursor-pointer truncate ${
                        active
                          ? 'border-violet-600 bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full mr-1 align-middle"
                        style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }}
                      />
                      {g.label.replace(' Gradient', '').replace(' Studio', '')}
                    </button>
                  );
                })}
              </div>

              <label className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                <ImageIcon className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                <span>Use Custom Background Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setBgFill({ type: 'image', url: URL.createObjectURL(f) });
                  }}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Interactive Preview & Export */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-slate-100">
                <Eraser className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                <span>Interactive Studio Preview</span>
              </div>
              {statusMsg && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  {processing ? 'Processing...' : statusMsg}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Source Photo (Click to Sample BG) */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50 dark:bg-slate-800/70">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                  <span>1. Click BG on Original</span>
                  <span className="tabular-nums text-[11px]">{formatBytes(sourceFile.file.size)}</span>
                </div>
                <img
                  src={sourceFile.url}
                  alt="Original upload — click background to sample"
                  onClick={handleSampleSourceClick}
                  className="w-full max-h-80 object-contain rounded-lg bg-white cursor-crosshair"
                />
              </div>

              {/* Output Preview (Interactive Brush) */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50 dark:bg-slate-800/70">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                  <span>
                    {brushMode === 'view'
                      ? '2. Cutout Output'
                      : brushMode === 'erase'
                      ? 'Draw to Erase'
                      : 'Draw to Restore'}
                  </span>
                  {outputBytes > 0 && (
                    <span className="tabular-nums text-[11px]">{formatBytes(outputBytes)} PNG</span>
                  )}
                </div>

                {outputUrl ? (
                  <div
                    ref={previewWrapRef}
                    onMouseDown={(e) => {
                      if (brushMode !== 'view') {
                        isPaintingRef.current = true;
                        setBrushStrokeCount((c) => c + 1);
                        applyBrushAt(e.clientX, e.clientY);
                      }
                    }}
                    onMouseMove={(e) => {
                      if (isPaintingRef.current && brushMode !== 'view') {
                        applyBrushAt(e.clientX, e.clientY);
                      }
                    }}
                    onMouseUp={() => {
                      isPaintingRef.current = false;
                    }}
                    onMouseLeave={() => {
                      isPaintingRef.current = false;
                    }}
                    onTouchStart={(e) => {
                      if (brushMode !== 'view' && e.touches[0]) {
                        isPaintingRef.current = true;
                        setBrushStrokeCount((c) => c + 1);
                        applyBrushAt(e.touches[0].clientX, e.touches[0].clientY);
                      }
                    }}
                    onTouchMove={(e) => {
                      if (isPaintingRef.current && brushMode !== 'view' && e.touches[0]) {
                        applyBrushAt(e.touches[0].clientX, e.touches[0].clientY);
                      }
                    }}
                    onTouchEnd={() => {
                      isPaintingRef.current = false;
                    }}
                    className={`relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 select-none ${
                      brushMode !== 'view' ? 'cursor-crosshair ring-2 ring-emerald-500' : ''
                    }`}
                    style={{
                      backgroundImage:
                        'linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)',
                      backgroundSize: '16px 16px',
                      backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
                    }}
                  >
                    <img
                      src={outputUrl}
                      alt="Background removed preview"
                      className="w-full max-h-80 object-contain mx-auto pointer-events-none"
                    />
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                    Processing cutout...
                  </div>
                )}
              </div>
            </div>

            {/* Download & Portal Export Bar */}
            {outputUrl && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex flex-wrap gap-2.5">
                  <a
                    href={outputUrl}
                    download={bgFill.type === 'transparent' ? 'bg-removed-transparent.png' : 'bg-replaced-studio.png'}
                    className="flex-1 min-w-[150px] inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    Download PNG
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDownloadJpg()}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-bold border border-transparent dark:border-slate-700 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Download JPG
                  </button>
                  <button
                    type="button"
                    onClick={() => printImageOnA4(outputUrl, 'Cutout Image Print', 'A4')}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    Print A4
                  </button>
                </div>

                {/* Portal Exact KB Export */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Portal KB Export:</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[20, 50, 100].map((kb) => (
                      <button
                        key={kb}
                        type="button"
                        onClick={() => {
                          setTargetKb(kb);
                          handleDownloadJpg(kb);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border cursor-pointer tabular-nums ${
                          targetKb === kb
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-emerald-400'
                        }`}
                      >
                        {kb} KB JPG
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

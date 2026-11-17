import React, { useEffect, useState } from 'react';
import { Upload, Download, Printer, Scissors, CheckCircle2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { printImageOnA4 } from '../../utils/printHelper';
import { MultiIdGridCombiner } from './MultiIdGridCombiner';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface IdCardCropperWorkspaceProps {
  toolId: string;
  toolName: string;
}

interface CropBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

const DEFAULT_PRESETS: Record<string, { front: CropBox; back: CropBox; hint: string }> = {
  'aadhar-cropper': {
    front: { x: 6, y: 66, w: 41, h: 24 },
    back: { x: 52, y: 66, w: 41, h: 24 },
    hint: 'Upload your e-Aadhaar PDF (enter 8-char password like SUBH1998) or card image.',
  },
  'pan-cropper': {
    front: { x: 8, y: 62, w: 40, h: 25 },
    back: { x: 52, y: 62, w: 40, h: 25 },
    hint: 'Upload e-PAN PDF or scanned PAN card image. Adjust front & back boxes to align.',
  },
  default: {
    front: { x: 6, y: 12, w: 42, h: 32 },
    back: { x: 52, y: 12, w: 42, h: 32 },
    hint: 'Upload card PDF or image, adjust Front & Back crop boxes, and generate an A4 85.6×54mm print sheet.',
  },
};

export const IdCardCropperWorkspace: React.FC<IdCardCropperWorkspaceProps> = (props) => {
  if (props.toolId === 'multi-id-a4-grid') {
    return <MultiIdGridCombiner />;
  }
  return <SingleIdCardCropperWorkspace {...props} />;
};

const SingleIdCardCropperWorkspace: React.FC<IdCardCropperWorkspaceProps> = ({ toolId, toolName }) => {
  const preset = DEFAULT_PRESETS[toolId] || DEFAULT_PRESETS.default;
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null);
  const [pdfPassword, setPdfPassword] = useState<string>('');
  const [rawPdfBytes, setRawPdfBytes] = useState<Uint8Array | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [frontBox, setFrontBox] = useState<CropBox>(preset.front);
  const [backBox, setBackBox] = useState<CropBox>(preset.back);
  const [a4SheetUrl, setA4SheetUrl] = useState<string | null>(null);
  const [frontPreviewUrl, setFrontPreviewUrl] = useState<string | null>(null);
  const [backPreviewUrl, setBackPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const p = DEFAULT_PRESETS[toolId] || DEFAULT_PRESETS.default;
    setFrontBox(p.front);
    setBackBox(p.back);
    setSourceImageUrl(null);
    setRawPdfBytes(null);
    setA4SheetUrl(null);
    setFrontPreviewUrl(null);
    setBackPreviewUrl(null);
    setErrorMsg('');
  }, [toolId]);

  const renderPdfToDataUrl = async (bytes: Uint8Array, password?: string) => {
    setErrorMsg('');
    try {
      const task = pdfjsLib.getDocument({ data: bytes.slice(), password: password || undefined });
      const pdf = await task.promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 2.2 });
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport, canvas }).promise;
      setSourceImageUrl(canvas.toDataURL('image/png'));
    } catch {
      setErrorMsg('PDF appears password-protected. Enter the PDF password and click Unlock.');
    }
  };

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    setErrorMsg('');
    setA4SheetUrl(null);
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      setRawPdfBytes(bytes);
      await renderPdfToDataUrl(bytes, pdfPassword);
    } else {
      setRawPdfBytes(null);
      setSourceImageUrl(URL.createObjectURL(file));
    }
  };

  const generateCroppedSheet = async () => {
    if (!sourceImageUrl) return;
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = sourceImageUrl;
    });

    const cardW = 1011;
    const cardH = 638;

    const cropRegion = (box: CropBox): HTMLCanvasElement => {
      const c = document.createElement('canvas');
      c.width = cardW;
      c.height = cardH;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, cardW, cardH);

      const sx = (box.x / 100) * img.naturalWidth;
      const sy = (box.y / 100) * img.naturalHeight;
      const sw = Math.max(10, (box.w / 100) * img.naturalWidth);
      const sh = Math.max(10, (box.h / 100) * img.naturalHeight);
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cardW, cardH);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, cardW - 2, cardH - 2);
      return c;
    };

    const frontCanvas = cropRegion(frontBox);
    const backCanvas = cropRegion(backBox);
    setFrontPreviewUrl(frontCanvas.toDataURL('image/png'));
    setBackPreviewUrl(backCanvas.toDataURL('image/png'));

    const a4 = document.createElement('canvas');
    a4.width = 2480;
    a4.height = 3508;
    const ctx = a4.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, a4.width, a4.height);

    const startY = 180;
    const leftX = 160;
    const rightX = 160 + cardW + 130;
    ctx.drawImage(frontCanvas, leftX, startY);
    ctx.drawImage(backCanvas, rightX, startY);

    setA4SheetUrl(a4.toDataURL('image/jpeg', 0.95));
  };

  const currentBox = activeSide === 'front' ? frontBox : backBox;
  const setCurrentBox = (updated: CropBox) => {
    if (activeSide === 'front') setFrontBox(updated);
    else setBackBox(updated);
  };

  return (
    <div className="space-y-6">
      <div className="bg-violet-50/70 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-800 rounded-2xl p-4 text-xs text-violet-900 dark:text-violet-200 no-print">
        <strong>{toolName}:</strong> {preset.hint}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end no-print">
        <label className="md:col-span-7 block border-2 border-dashed border-violet-200 dark:border-violet-700 hover:border-violet-400 bg-white dark:bg-slate-900 rounded-2xl p-6 text-center cursor-pointer transition-colors">
          <input
            type="file"
            accept="application/pdf,.pdf,image/*"
            onChange={(e) => handleUpload(e.target.files?.[0])}
            className="hidden"
          />
          <div className="flex items-center justify-center gap-3">
            <Upload className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              Upload {toolName.replace(' Cropper', '')} PDF or Image
            </span>
          </div>
        </label>

        <div className="md:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            PDF Password (optional, for e-Aadhaar / e-PAN)
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              value={pdfPassword}
              onChange={(e) => setPdfPassword(e.target.value)}
              placeholder="e.g. SUBH1998"
              className="flex-1 px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
            />
            {rawPdfBytes && (
              <button
                type="button"
                onClick={() => renderPdfToDataUrl(rawPdfBytes, pdfPassword)}
                className="px-3 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-semibold cursor-pointer"
              >
                Unlock
              </button>
            )}
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-medium">
          {errorMsg}
        </div>
      )}

      {sourceImageUrl && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 no-print">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Source Page Preview (Purple = Front, Emerald = Back)
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveSide('front')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                    activeSide === 'front'
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Adjust Front
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSide('back')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                    activeSide === 'back'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Adjust Back
                </button>
              </div>
            </div>

            <div className="relative inline-block w-full border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
              <img src={sourceImageUrl} alt="ID card source" className="w-full block select-none" />
              <div
                onClick={() => setActiveSide('front')}
                style={{
                  left: `${frontBox.x}%`,
                  top: `${frontBox.y}%`,
                  width: `${frontBox.w}%`,
                  height: `${frontBox.h}%`,
                }}
                className="absolute border-2 border-violet-600 bg-violet-500/15 cursor-pointer"
              >
                <span className="bg-violet-600 text-white text-[10px] font-bold px-1.5 py-0.5">FRONT</span>
              </div>
              <div
                onClick={() => setActiveSide('back')}
                style={{
                  left: `${backBox.x}%`,
                  top: `${backBox.y}%`,
                  width: `${backBox.w}%`,
                  height: `${backBox.h}%`,
                }}
                className="absolute border-2 border-emerald-600 bg-emerald-500/15 cursor-pointer"
              >
                <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5">BACK</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 no-print">
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {activeSide === 'front' ? 'Front Side Crop Position' : 'Back Side Crop Position'}
            </div>

            {(
              [
                { key: 'x', label: 'Left Offset (%)' },
                { key: 'y', label: 'Top Offset (%)' },
                { key: 'w', label: 'Width (%)' },
                { key: 'h', label: 'Height (%)' },
              ] as const
            ).map((field) => (
              <div key={field.key}>
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <span>{field.label}</span>
                  <span className="tabular-nums">{currentBox[field.key]}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={98}
                  value={currentBox[field.key]}
                  onChange={(e) =>
                    setCurrentBox({
                      ...currentBox,
                      [field.key]: Number(e.target.value),
                    })
                  }
                  className="w-full accent-violet-600"
                />
              </div>
            ))}

            <button
              type="button"
              onClick={generateCroppedSheet}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold cursor-pointer"
            >
              <Scissors className="w-4 h-4" />
              Crop &amp; Generate A4 Print Sheet
            </button>
          </div>
        </div>
      )}

      {a4SheetUrl && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 no-print">
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              Ready at CR80 Smartcard Size (85.6 × 54 mm)
            </span>
            <div className="flex flex-wrap gap-2">
              {frontPreviewUrl && (
                <a
                  href={frontPreviewUrl}
                  download={`${toolId}-front.png`}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Download Front
                </a>
              )}
              {backPreviewUrl && (
                <a
                  href={backPreviewUrl}
                  download={`${toolId}-back.png`}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Download Back
                </a>
              )}
              <button
                type="button"
                onClick={() => printImageOnA4(a4SheetUrl, `${toolName} A4 Sheet`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print A4
              </button>
              <a
                href={a4SheetUrl}
                download={`${toolId}-a4-sheet.jpg`}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
              >
                <Download className="w-3.5 h-3.5" />
                Download A4 Sheet
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white">
            {frontPreviewUrl && (
              <img src={frontPreviewUrl} alt="Cropped Front" className="w-full rounded-lg border border-slate-200" />
            )}
            {backPreviewUrl && (
              <img src={backPreviewUrl} alt="Cropped Back" className="w-full rounded-lg border border-slate-200" />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

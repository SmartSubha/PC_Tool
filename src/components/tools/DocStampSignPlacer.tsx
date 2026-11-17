import React, { useEffect, useRef, useState } from 'react';
import {
  Upload,
  Highlighter,
  Stamp,
  Download,
  Printer,
  Trash2,
  Type,
  CheckCircle2,
  Eraser,
  Layers,
  PenTool,
  SlidersHorizontal,
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { printImageOnA4 } from '../../utils/printHelper';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface HighlightStrip {
  id: string;
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
  color: string;
  opacity: number;
}

type InkTintMode = 'original' | 'blue' | 'black' | 'red';

interface SignStampOverlay {
  id: string;
  label: string;
  rawUrl: string;
  processedUrl: string;
  removeWhiteBg: boolean;
  whiteThreshold: number;
  inkTint: InkTintMode;
  xPct: number;
  yPct: number;
  wPct: number;
  rotate: number;
  opacity: number;
}

interface TextStampOverlay {
  id: string;
  text: string;
  xPct: number;
  yPct: number;
  color: string;
  sizePt: number;
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function processSignatureImage(
  rawUrl: string,
  removeWhiteBg: boolean,
  threshold: number,
  inkTint: InkTintMode
): Promise<string> {
  if (!removeWhiteBg && inkTint === 'original') return rawUrl;
  const img = await loadImg(rawUrl);
  const c = document.createElement('canvas');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const imgData = ctx.getImageData(0, 0, c.width, c.height);
  const d = imgData.data;

  for (let i = 0; i < d.length; i += 4) {
    const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    if (removeWhiteBg && lum >= threshold) {
      d[i + 3] = 0;
    } else if (d[i + 3] > 20) {
      if (inkTint === 'blue') {
        d[i] = 20;
        d[i + 1] = 56;
        d[i + 2] = 195;
      } else if (inkTint === 'black') {
        d[i] = 15;
        d[i + 1] = 23;
        d[i + 2] = 42;
      } else if (inkTint === 'red') {
        d[i] = 185;
        d[i + 1] = 28;
        d[i + 2] = 28;
      }
    }
  }
  ctx.putImageData(imgData, 0, 0);
  return c.toDataURL('image/png');
}

export const DocStampSignPlacer: React.FC = () => {
  const [docPages, setDocPages] = useState<{ label: string; url: string; w: number; h: number }[]>([]);
  const [activePageIdx, setActivePageIdx] = useState(0);

  const [highlights, setHighlights] = useState<HighlightStrip[]>([]);
  const [stamps, setStamps] = useState<SignStampOverlay[]>([]);
  const [notes, setNotes] = useState<TextStampOverlay[]>([]);

  const [selectedType, setSelectedType] = useState<'highlight' | 'stamp' | 'note' | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  // Starts strictly empty
  const [newNoteInput, setNewNoteInput] = useState('');
  const [resultPngUrl, setResultPngUrl] = useState<string | null>(null);
  const [resultPdfUrl, setResultPdfUrl] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const activeDoc = docPages[activePageIdx] || null;

  useEffect(() => {
    setResultPngUrl(null);
    setResultPdfUrl(null);
  }, [activePageIdx, highlights, stamps, notes]);

  const handleDocUpload = async (file: File | null) => {
    if (!file) return;
    setDocPages([]);
    setActivePageIdx(0);
    setResultPngUrl(null);
    setResultPdfUrl(null);

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (isPdf) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      const pages: { label: string; url: string; w: number; h: number }[] = [];
      for (let p = 1; p <= Math.min(20, pdf.numPages); p++) {
        const pg = await pdf.getPage(p);
        const vp = pg.getViewport({ scale: 2 });
        const c = document.createElement('canvas');
        c.width = vp.width;
        c.height = vp.height;
        const ctx = c.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, c.width, c.height);
        await pg.render({ canvasContext: ctx, canvas: c, viewport: vp }).promise;
        pages.push({ label: `Page ${p}`, url: c.toDataURL('image/png'), w: c.width, h: c.height });
      }
      setDocPages(pages);
    } else {
      const url = URL.createObjectURL(file);
      const img = await loadImg(url);
      setDocPages([{ label: file.name, url, w: img.naturalWidth, h: img.naturalHeight }]);
    }
  };

  const handleAddStampOrSign = async (file: File | null, label: string) => {
    if (!file) return;
    const rawUrl = URL.createObjectURL(file);
    const processedUrl = await processSignatureImage(rawUrl, true, 185, 'original');
    const id = `st-${Date.now()}`;
    const item: SignStampOverlay = {
      id,
      label,
      rawUrl,
      processedUrl,
      removeWhiteBg: true,
      whiteThreshold: 185,
      inkTint: 'original',
      xPct: label === 'Signature' ? 60 : 54,
      yPct: label === 'Signature' ? 76 : 64,
      wPct: label === 'Signature' ? 25 : 22,
      rotate: 0,
      opacity: 96,
    };
    setStamps((prev) => [...prev, item]);
    setSelectedType('stamp');
    setSelectedId(id);
  };

  const updateStampAndReprocess = async (
    id: string,
    patch: Partial<SignStampOverlay>,
    reprocess = false
  ) => {
    const target = stamps.find((s) => s.id === id);
    if (!target) return;
    const merged = { ...target, ...patch };
    if (reprocess) {
      merged.processedUrl = await processSignatureImage(
        merged.rawUrl,
        merged.removeWhiteBg,
        merged.whiteThreshold,
        merged.inkTint
      );
    }
    setStamps((prev) => prev.map((s) => (s.id === id ? merged : s)));
  };

  const addHighlight = (color: string) => {
    const id = `hl-${Date.now()}`;
    setHighlights((prev) => [
      ...prev,
      { id, xPct: 12, yPct: 28, wPct: 48, hPct: 4, color, opacity: 45 },
    ]);
    setSelectedType('highlight');
    setSelectedId(id);
  };

  const addTextNote = (customValue?: string) => {
    const val = (customValue ?? newNoteInput).trim();
    if (!val) return;
    const id = `nt-${Date.now()}`;
    setNotes((prev) => [
      ...prev,
      { id, text: val, xPct: 12, yPct: 82, color: '#0f172a', sizePt: 18 },
    ]);
    if (!customValue) setNewNoteInput('');
    setSelectedType('note');
    setSelectedId(id);
  };

  const handleStagePointer = (clientX: number, clientY: number) => {
    if (!stageRef.current || !selectedId || !selectedType) return;
    const rect = stageRef.current.getBoundingClientRect();
    const xPct = Math.min(96, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    const yPct = Math.min(96, Math.max(0, ((clientY - rect.top) / rect.height) * 100));

    if (selectedType === 'highlight') {
      setHighlights((prev) =>
        prev.map((h) =>
          h.id === selectedId
            ? {
                ...h,
                xPct: Math.min(100 - h.wPct, Math.max(0, xPct - h.wPct / 2)),
                yPct: Math.min(100 - h.hPct, Math.max(0, yPct - h.hPct / 2)),
              }
            : h
        )
      );
    } else if (selectedType === 'stamp') {
      setStamps((prev) =>
        prev.map((s) =>
          s.id === selectedId
            ? {
                ...s,
                xPct: Math.min(100 - s.wPct, Math.max(0, xPct - s.wPct / 2)),
                yPct: Math.min(94, Math.max(0, yPct - 4)),
              }
            : s
        )
      );
    } else if (selectedType === 'note') {
      setNotes((prev) =>
        prev.map((n) => (n.id === selectedId ? { ...n, xPct, yPct } : n))
      );
    }
  };

  const renderFinalCompositeCanvas = async (): Promise<HTMLCanvasElement> => {
    if (!activeDoc) throw new Error('No document loaded');
    const docImg = await loadImg(activeDoc.url);
    const canvas = document.createElement('canvas');
    canvas.width = docImg.naturalWidth;
    canvas.height = docImg.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(docImg, 0, 0);

    for (const hl of highlights) {
      ctx.save();
      ctx.globalAlpha = hl.opacity / 100;
      ctx.fillStyle = hl.color;
      ctx.fillRect(
        (hl.xPct / 100) * canvas.width,
        (hl.yPct / 100) * canvas.height,
        (hl.wPct / 100) * canvas.width,
        (hl.hPct / 100) * canvas.height
      );
      ctx.restore();
    }

    for (const st of stamps) {
      const sImg = await loadImg(st.processedUrl);
      const drawW = (st.wPct / 100) * canvas.width;
      const drawH = (drawW * sImg.naturalHeight) / Math.max(1, sImg.naturalWidth);
      const cx = (st.xPct / 100) * canvas.width + drawW / 2;
      const cy = (st.yPct / 100) * canvas.height + drawH / 2;

      ctx.save();
      ctx.globalAlpha = st.opacity / 100;
      ctx.translate(cx, cy);
      ctx.rotate((st.rotate * Math.PI) / 180);
      ctx.drawImage(sImg, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
    }

    for (const nt of notes) {
      ctx.save();
      ctx.fillStyle = nt.color;
      const pxSize = Math.max(18, Math.round((nt.sizePt / 16) * (canvas.width * 0.02)));
      ctx.font = `700 ${pxSize}px sans-serif`;
      ctx.fillText(nt.text, (nt.xPct / 100) * canvas.width, (nt.yPct / 100) * canvas.height);
      ctx.restore();
    }

    return canvas;
  };

  const handleExportAll = async () => {
    if (!activeDoc) return;
    setExporting(true);
    try {
      const canvas = await renderFinalCompositeCanvas();
      const pngUrl = canvas.toDataURL('image/png');
      setResultPngUrl(pngUrl);

      const jpgDataUrl = canvas.toDataURL('image/jpeg', 0.94);
      const jpgBytes = await (await fetch(jpgDataUrl)).arrayBuffer();
      const pdfDoc = await PDFDocument.create();
      const embedded = await pdfDoc.embedJpg(jpgBytes);
      const page = pdfDoc.addPage([embedded.width, embedded.height]);
      page.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height });
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      setResultPdfUrl(URL.createObjectURL(blob));
    } finally {
      setExporting(false);
    }
  };

  const selectedHighlight = highlights.find((h) => h.id === selectedId) || null;
  const selectedStamp = stamps.find((s) => s.id === selectedId) || null;
  const selectedNote = notes.find((n) => n.id === selectedId) || null;
  const totalLayers = highlights.length + stamps.length + notes.length;

  return (
    <div className="space-y-6">
      {/* High-Contrast Dark Studio Upload / Header Bar */}
      <div className="bg-slate-950 text-white border-2 border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
              <PenTool className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                Digital Stamp, e-Sign &amp; Highlighter Studio
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                PDF বা ইমেজে আপনার সিগনেচার, দোকানের রাবার স্ট্যাম্প PNG ও কালার হাইলাইট বসিয়ে সরাসরি A4 প্রিন্ট বা PDF সেভ করুন।
              </p>
            </div>
          </div>

          <label className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs sm:text-sm font-black cursor-pointer transition-colors whitespace-nowrap shrink-0 shadow-sm">
            <Upload className="w-4 h-4" />
            <span>{activeDoc ? 'Replace Document / PDF' : 'Upload Document / PDF'}</span>
            <input
              type="file"
              accept="image/*,.pdf,application/pdf"
              onChange={(e) => handleDocUpload(e.target.files?.[0] || null)}
              className="hidden"
            />
          </label>
        </div>

        {!activeDoc && (
          <label className="mt-5 block border-2 border-dashed border-slate-700 hover:border-amber-400 bg-slate-900/70 rounded-2xl p-8 text-center cursor-pointer transition-colors">
            <input
              type="file"
              accept="image/*,.pdf,application/pdf"
              onChange={(e) => handleDocUpload(e.target.files?.[0] || null)}
              className="hidden"
            />
            <div className="text-sm font-extrabold text-amber-300">
              Click here to load a PDF Form, Application, Receipt, or Image
            </div>
            <div className="text-xs text-slate-400 mt-1">
              যেকোনো সাদা কাগজে তোলা সই বা স্ট্যাম্পের ব্যাকগ্রাউন্ড ১ ক্লিকেই স্বচ্ছ (Transparent) হয়ে যাবে
            </div>
          </label>
        )}
      </div>

      {activeDoc && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left High-Contrast Controls Workbench */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border-2 border-slate-950 dark:border-slate-700 rounded-2xl overflow-hidden shadow-md">
            <div className="px-5 py-3.5 bg-slate-950 text-white border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-300">
                <SlidersHorizontal className="w-4 h-4" />
                <span>Studio Controls ({totalLayers} layers)</span>
              </div>
              {docPages.length > 1 && (
                <span className="text-xs font-bold text-slate-300 tabular-nums">
                  Page {activePageIdx + 1}/{docPages.length}
                </span>
              )}
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {docPages.length > 1 && (
                <div className="p-4 space-y-2">
                  <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                    PDF Pages
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {docPages.map((pg, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActivePageIdx(idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-extrabold border-2 cursor-pointer transition-colors ${
                          activePageIdx === idx
                            ? 'bg-slate-950 dark:bg-amber-400 text-white dark:text-slate-950 border-slate-950 dark:border-amber-400'
                            : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {pg.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Signature / Stamp PNG */}
              <div className="p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-950 dark:text-sky-300">
                  <Stamp className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>১. সিগনেচার বা দোকানের স্ট্যাম্প PNG বসান</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <label className="py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400 text-white dark:text-slate-950 text-xs font-extrabold text-center cursor-pointer transition-colors">
                    + Upload Signature
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleAddStampOrSign(e.target.files?.[0] || null, 'Signature')}
                      className="hidden"
                    />
                  </label>
                  <label className="py-2.5 px-3 rounded-xl bg-indigo-700 hover:bg-indigo-600 dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-slate-950 text-xs font-extrabold text-center cursor-pointer transition-colors">
                    + Upload Shop Stamp
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleAddStampOrSign(e.target.files?.[0] || null, 'Stamp')}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Add Color Highlight Strips */}
              <div className="p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-950 dark:text-amber-300">
                  <Highlighter className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>২. গুরুত্বপূর্ণ লাইন কালার হাইলাইট করুন</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { c: '#fde047', label: 'Yellow' },
                    { c: '#86efac', label: 'Green' },
                    { c: '#7dd3fc', label: 'Cyan' },
                    { c: '#f9a8d4', label: 'Pink' },
                  ].map((opt) => (
                    <button
                      key={opt.c}
                      type="button"
                      onClick={() => addHighlight(opt.c)}
                      style={{ backgroundColor: opt.c }}
                      className="py-2 rounded-xl text-xs font-black text-slate-950 border-2 border-slate-900/20 cursor-pointer hover:scale-[1.03] transition-transform shadow-xs"
                    >
                      + {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Verification Text / Date */}
              <div className="p-4 sm:p-5 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-950 dark:text-slate-200">
                  <Type className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  <span>৩. তারিখ বা টেক্সট স্ট্যাম্প যোগ (ঐচ্ছিক)</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNoteInput}
                    onChange={(e) => setNewNoteInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addTextNote();
                    }}
                    placeholder="Type text or date (empty by default)"
                    className="flex-1 px-3 py-2 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-950 dark:text-white rounded-xl text-xs font-semibold focus:outline-none focus:border-slate-950 dark:focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => addTextNote()}
                    className="px-4 py-2 rounded-xl bg-slate-950 dark:bg-amber-400 text-white dark:text-slate-950 text-xs font-extrabold cursor-pointer whitespace-nowrap"
                  >
                    Place
                  </button>
                </div>
              </div>

              {/* Active Selected Layer Inspector */}
              {selectedStamp && (
                <div className="p-4 sm:p-5 bg-sky-50/90 dark:bg-sky-950/35 space-y-3">
                  <div className="flex items-center justify-between text-xs font-black text-slate-950 dark:text-sky-200">
                    <span>Active Layer: {selectedStamp.label}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setStamps((p) => p.filter((s) => s.id !== selectedStamp.id));
                        setSelectedId(null);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-bold cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-extrabold text-slate-900 dark:text-slate-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedStamp.removeWhiteBg}
                      onChange={(e) =>
                        updateStampAndReprocess(
                          selectedStamp.id,
                          { removeWhiteBg: e.target.checked },
                          true
                        )
                      }
                      className="accent-slate-950 w-4 h-4"
                    />
                    <Eraser className="w-3.5 h-3.5 text-sky-700 dark:text-sky-300" />
                    <span>Auto Remove White Paper BG (স্বচ্ছ PNG করুন)</span>
                  </label>

                  {selectedStamp.removeWhiteBg && (
                    <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      <div className="flex justify-between mb-0.5">
                        <span>White Paper Cleanup Strength</span>
                        <span className="tabular-nums">{selectedStamp.whiteThreshold}</span>
                      </div>
                      <input
                        type="range"
                        min={120}
                        max={240}
                        value={selectedStamp.whiteThreshold}
                        onChange={(e) =>
                          updateStampAndReprocess(
                            selectedStamp.id,
                            { whiteThreshold: Number(e.target.value) },
                            true
                          )
                        }
                        className="w-full accent-sky-600"
                      />
                    </div>
                  )}

                  <div>
                    <div className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                      Ink Color Tone
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {(
                        [
                          { id: 'original', label: 'Original' },
                          { id: 'blue', label: 'Blue Ink' },
                          { id: 'black', label: 'Black Ink' },
                          { id: 'red', label: 'Stamp Red' },
                        ] as { id: InkTintMode; label: string }[]
                      ).map((ink) => (
                        <button
                          key={ink.id}
                          type="button"
                          onClick={() =>
                            updateStampAndReprocess(selectedStamp.id, { inkTint: ink.id }, true)
                          }
                          className={`py-1.5 rounded-lg text-[11px] font-extrabold border-2 cursor-pointer transition-colors ${
                            selectedStamp.inkTint === ink.id
                              ? 'bg-slate-950 dark:bg-amber-400 text-white dark:text-slate-950 border-slate-950 dark:border-amber-400'
                              : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {ink.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                    <div>
                      <div className="flex justify-between">
                        <span>Size</span>
                        <span className="tabular-nums">{selectedStamp.wPct}%</span>
                      </div>
                      <input
                        type="range"
                        min={6}
                        max={65}
                        value={selectedStamp.wPct}
                        onChange={(e) =>
                          updateStampAndReprocess(selectedStamp.id, { wPct: Number(e.target.value) })
                        }
                        className="w-full accent-sky-600"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between">
                        <span>Rotate</span>
                        <span className="tabular-nums">{selectedStamp.rotate}°</span>
                      </div>
                      <input
                        type="range"
                        min={-45}
                        max={45}
                        value={selectedStamp.rotate}
                        onChange={(e) =>
                          updateStampAndReprocess(selectedStamp.id, { rotate: Number(e.target.value) })
                        }
                        className="w-full accent-sky-600"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between">
                        <span>Opacity</span>
                        <span className="tabular-nums">{selectedStamp.opacity}%</span>
                      </div>
                      <input
                        type="range"
                        min={30}
                        max={100}
                        value={selectedStamp.opacity}
                        onChange={(e) =>
                          updateStampAndReprocess(selectedStamp.id, { opacity: Number(e.target.value) })
                        }
                        className="w-full accent-sky-600"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedHighlight && (
                <div className="p-4 sm:p-5 bg-amber-50/90 dark:bg-amber-950/35 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-black text-slate-950 dark:text-amber-200">
                    <span>Selected Highlight Strip</span>
                    <button
                      type="button"
                      onClick={() => {
                        setHighlights((p) => p.filter((h) => h.id !== selectedHighlight.id));
                        setSelectedId(null);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-bold cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                    <div>
                      Width: <span className="tabular-nums">{Math.round(selectedHighlight.wPct)}%</span>
                      <input
                        type="range"
                        min={5}
                        max={95}
                        value={selectedHighlight.wPct}
                        onChange={(e) =>
                          setHighlights((p) =>
                            p.map((h) =>
                              h.id === selectedHighlight.id
                                ? { ...h, wPct: Number(e.target.value) }
                                : h
                            )
                          )
                        }
                        className="w-full accent-amber-600"
                      />
                    </div>
                    <div>
                      Height: <span className="tabular-nums">{selectedHighlight.hPct}%</span>
                      <input
                        type="range"
                        min={1}
                        max={25}
                        step={0.5}
                        value={selectedHighlight.hPct}
                        onChange={(e) =>
                          setHighlights((p) =>
                            p.map((h) =>
                              h.id === selectedHighlight.id
                                ? { ...h, hPct: Number(e.target.value) }
                                : h
                            )
                          )
                        }
                        className="w-full accent-amber-600"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedNote && (
                <div className="p-4 sm:p-5 bg-slate-100 dark:bg-slate-800/70 space-y-2">
                  <div className="flex items-center justify-between text-xs font-black text-slate-950 dark:text-white">
                    <span>Note: &ldquo;{selectedNote.text}&rdquo;</span>
                    <button
                      type="button"
                      onClick={() => {
                        setNotes((p) => p.filter((n) => n.id !== selectedNote.id));
                        setSelectedId(null);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-bold cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                    <span className="tabular-nums">Size: {selectedNote.sizePt}pt</span>
                    <input
                      type="range"
                      min={10}
                      max={40}
                      value={selectedNote.sizePt}
                      onChange={(e) =>
                        setNotes((p) =>
                          p.map((n) =>
                            n.id === selectedNote.id ? { ...n, sizePt: Number(e.target.value) } : n
                          )
                        )
                      }
                      className="flex-1 accent-slate-950 dark:accent-amber-400"
                    />
                  </div>
                </div>
              )}

              {/* Active Layers Quick Switcher */}
              {totalLayers > 0 && (
                <div className="p-4 space-y-2 bg-slate-50/70 dark:bg-slate-950/40">
                  <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-600 dark:text-slate-400">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Placed Layers (Click to select &amp; drag on sheet)</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {stamps.map((st, i) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          setSelectedType('stamp');
                          setSelectedId(st.id);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                          selectedId === st.id
                            ? 'bg-slate-950 text-white dark:bg-amber-400 dark:text-slate-950 border-slate-950'
                            : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {st.label} #{i + 1}
                      </button>
                    ))}
                    {highlights.map((hl, i) => (
                      <button
                        key={hl.id}
                        type="button"
                        onClick={() => {
                          setSelectedType('highlight');
                          setSelectedId(hl.id);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                          selectedId === hl.id
                            ? 'bg-slate-950 text-white dark:bg-amber-400 dark:text-slate-950 border-slate-950'
                            : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        Highlight #{i + 1}
                      </button>
                    ))}
                    {notes.map((nt, i) => (
                      <button
                        key={nt.id}
                        type="button"
                        onClick={() => {
                          setSelectedType('note');
                          setSelectedId(nt.id);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                          selectedId === nt.id
                            ? 'bg-slate-950 text-white dark:bg-amber-400 dark:text-slate-950 border-slate-950'
                            : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        Text #{i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 sm:p-5">
                <button
                  type="button"
                  onClick={handleExportAll}
                  disabled={exporting}
                  className="w-full py-3 rounded-xl bg-slate-950 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 text-sm font-black transition-colors cursor-pointer"
                >
                  {exporting
                    ? 'Generating Printable Document...'
                    : 'Apply Overlays & Generate PNG / PDF / Print'}
                </button>
              </div>
            </div>
          </div>

          {/* Right High-Contrast Document Preview Stage */}
          <div className="lg:col-span-7 bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg text-white">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <span className="text-xs sm:text-sm font-extrabold text-amber-300">
                ডকুমেন্টের ওপর ক্লিক বা ড্র্যাগ করে সই, স্ট্যাম্প ও হাইলাইট বসান
              </span>
              <span className="text-xs font-semibold text-slate-400 tabular-nums">
                {activeDoc.label}
              </span>
            </div>

            <div
              ref={stageRef}
              onMouseDown={(e) => {
                setDragging(true);
                handleStagePointer(e.clientX, e.clientY);
              }}
              onMouseMove={(e) => {
                if (dragging) handleStagePointer(e.clientX, e.clientY);
              }}
              onMouseUp={() => setDragging(false)}
              onMouseLeave={() => setDragging(false)}
              onTouchStart={(e) => {
                setDragging(true);
                if (e.touches[0]) handleStagePointer(e.touches[0].clientX, e.touches[0].clientY);
              }}
              onTouchMove={(e) => {
                if (dragging && e.touches[0])
                  handleStagePointer(e.touches[0].clientX, e.touches[0].clientY);
              }}
              onTouchEnd={() => setDragging(false)}
              className="relative w-full border-2 border-slate-700 rounded-xl overflow-hidden bg-white select-none cursor-crosshair"
            >
              <img
                src={activeDoc.url}
                alt="Document stage"
                className="w-full block pointer-events-none"
              />

              {highlights.map((hl) => (
                <div
                  key={hl.id}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setSelectedType('highlight');
                    setSelectedId(hl.id);
                    setDragging(true);
                  }}
                  style={{
                    left: `${hl.xPct}%`,
                    top: `${hl.yPct}%`,
                    width: `${hl.wPct}%`,
                    height: `${hl.hPct}%`,
                    backgroundColor: hl.color,
                    opacity: hl.opacity / 100,
                  }}
                  className={`absolute cursor-move ${
                    selectedId === hl.id ? 'ring-2 ring-slate-950' : ''
                  }`}
                />
              ))}

              {stamps.map((st) => (
                <img
                  key={st.id}
                  src={st.processedUrl}
                  alt={st.label}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setSelectedType('stamp');
                    setSelectedId(st.id);
                    setDragging(true);
                  }}
                  style={{
                    left: `${st.xPct}%`,
                    top: `${st.yPct}%`,
                    width: `${st.wPct}%`,
                    opacity: st.opacity / 100,
                    transform: `rotate(${st.rotate}deg)`,
                  }}
                  className={`absolute cursor-move ${
                    selectedId === st.id ? 'ring-2 ring-sky-600 bg-sky-500/10 rounded' : ''
                  }`}
                />
              ))}

              {notes.map((nt) => (
                <div
                  key={nt.id}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setSelectedType('note');
                    setSelectedId(nt.id);
                    setDragging(true);
                  }}
                  style={{
                    left: `${nt.xPct}%`,
                    top: `${nt.yPct}%`,
                    color: nt.color,
                    fontSize: `${nt.sizePt}px`,
                  }}
                  className={`absolute font-bold cursor-move whitespace-nowrap ${
                    selectedId === nt.id ? 'ring-2 ring-amber-500 px-1 rounded' : ''
                  }`}
                >
                  {nt.text}
                </div>
              ))}
            </div>

            {resultPngUrl && (
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-emerald-950 border-2 border-emerald-500 text-white">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-emerald-300">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>Stamped &amp; Highlighted Document Ready</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => printImageOnA4(resultPngUrl, 'Signed Document Print', 'A4')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-slate-950 text-xs font-black hover:bg-slate-200 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print A4
                  </button>
                  <a
                    href={resultPngUrl}
                    download="stamped-document.png"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-black hover:bg-amber-300"
                  >
                    <Download className="w-3.5 h-3.5" /> PNG
                  </a>
                  {resultPdfUrl && (
                    <a
                      href={resultPdfUrl}
                      download="stamped-document.pdf"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-400 text-slate-950 text-xs font-black hover:bg-emerald-300"
                    >
                      <Download className="w-3.5 h-3.5" /> PDF
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

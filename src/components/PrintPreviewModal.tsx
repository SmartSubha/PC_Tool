import React, { useEffect, useState } from 'react';
import {
  Printer,
  X,
  FileText,
  Maximize2,
  Hash,
  Eye,
  Check,
  SlidersHorizontal,
} from 'lucide-react';
import type { AppLang } from '../data/i18n';
import {
  MARGIN_PRESET_MM,
  executePrintJob,
  subscribePrintPreview,
  type MarginPreset,
  type PrintJobPayload,
  type WatermarkPosition,
} from '../utils/printHelper';

interface PrintPreviewModalProps {
  lang: AppLang;
}

const MARGIN_OPTIONS: {
  id: MarginPreset;
  mm: number;
  labelEn: string;
  labelBn: string;
  hintEn: string;
  hintBn: string;
}[] = [
  {
    id: 'none',
    mm: 0,
    labelEn: 'No Margin',
    labelBn: 'মার্জিন ছাড়া',
    hintEn: '0 mm · Edge-to-Edge',
    hintBn: '০ মিমি · ফুল পেজ',
  },
  {
    id: 'narrow',
    mm: 3,
    labelEn: 'Narrow',
    labelBn: 'সরু মার্জিন',
    hintEn: '3 mm · Photo / Slip',
    hintBn: '৩ মিমি · ফটো/স্লিপ',
  },
  {
    id: 'standard',
    mm: 10,
    labelEn: 'Standard',
    labelBn: 'সাধারণ',
    hintEn: '10 mm · Normal Doc',
    hintBn: '১০ মিমি · সাধারণ পেজ',
  },
  {
    id: 'wide',
    mm: 18,
    labelEn: 'Wide',
    labelBn: 'চওড়া মার্জিন',
    hintEn: '18 mm · Official Form',
    hintBn: '১৮ মিমি · অফিশিয়াল ফর্ম',
  },
];

const WATERMARK_POSITIONS: {
  id: WatermarkPosition;
  labelEn: string;
  labelBn: string;
}[] = [
  { id: 'bottom-right', labelEn: 'Bottom Right', labelBn: 'ডানে নিচে' },
  { id: 'bottom-center', labelEn: 'Bottom Center', labelBn: 'মাঝে নিচে' },
  { id: 'diagonal', labelEn: 'Diagonal Stamp', labelBn: 'হালকা তির্যক' },
];

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({ lang }) => {
  const [job, setJob] = useState<PrintJobPayload | null>(null);
  const [marginPreset, setMarginPreset] = useState<MarginPreset>('narrow');
  const [showPageWatermark, setShowPageWatermark] = useState<boolean>(false);
  const [watermarkPosition, setWatermarkPosition] =
    useState<WatermarkPosition>('bottom-right');
  const [showMarginGuides, setShowMarginGuides] = useState<boolean>(true);
  const [zoomPct, setZoomPct] = useState<65 | 85 | 100>(85);

  useEffect(() => {
    return subscribePrintPreview((incoming) => {
      setJob(incoming);
      setMarginPreset(incoming.defaultMargin);
    });
  }, []);

  useEffect(() => {
    if (!job) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setJob(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [job]);

  if (!job) return null;

  const marginMm = MARGIN_PRESET_MM[marginPreset];
  const is4x6 = job.paperSize === '4x6';
  const totalPages =
    job.kind === 'multi-image' && job.imageDataUrls
      ? job.imageDataUrls.length
      : 1;

  // Base simulated sheet width in CSS pixels mapped from zoom scale
  const baseWidthPx = is4x6
    ? zoomPct === 65
      ? 310
      : zoomPct === 85
      ? 380
      : 440
    : zoomPct === 65
    ? 460
    : zoomPct === 85
    ? 590
    : 710;

  // Scale millimeter margins proportionally onto the simulated paper width
  const paperWidthMm = is4x6 ? 101.6 : 210;
  const previewMarginPx = Math.round((marginMm / paperWidthMm) * baseWidthPx);

  const handleConfirmPrint = () => {
    const activeJob = job;
    setJob(null);
    executePrintJob(activeJob, {
      marginPreset,
      showPageWatermark,
      watermarkPosition,
    });
  };

  const renderSimulatedWatermark = (pageNum: number) => {
    if (!showPageWatermark) return null;

    if (watermarkPosition === 'diagonal') {
      return (
        <div className="pointer-events-none select-none absolute inset-0 flex items-center justify-center overflow-hidden z-20">
          <span className="-rotate-30 font-mono text-4xl sm:text-5xl font-black tracking-widest text-slate-900/10 whitespace-nowrap">
            PAGE {pageNum} / {totalPages}
          </span>
        </div>
      );
    }

    return (
      <div
        className={`pointer-events-none select-none absolute bottom-2.5 z-20 font-mono text-[11px] font-extrabold text-slate-700 bg-white/90 border border-slate-300 px-2.5 py-0.5 rounded shadow-2xs ${
          watermarkPosition === 'bottom-center'
            ? 'left-1/2 -translate-x-1/2'
            : 'right-3'
        }`}
      >
        Page {pageNum} of {totalPages}
      </div>
    );
  };

  const renderSimulatedSheet = (pageIndex: number, content: React.ReactNode) => (
    <div key={pageIndex} className="flex flex-col items-center gap-2 shrink-0">
      <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-slate-300">
        <span>
          {lang === 'bn'
            ? `পৃষ্ঠা ${pageIndex + 1} / ${totalPages}`
            : `Sheet ${pageIndex + 1} of ${totalPages}`}
        </span>
        <span aria-hidden="true">·</span>
        <span>{is4x6 ? '4 × 6 in' : 'A4 (210 × 297 mm)'}</span>
        <span aria-hidden="true">·</span>
        <span>
          {marginMm} mm {lang === 'bn' ? 'মার্জিন' : 'margin'}
        </span>
      </div>

      <div
        className={`relative bg-white text-slate-900 shadow-2xl overflow-hidden transition-all duration-200 ${
          is4x6
            ? 'aspect-[4/6]'
            : job.kind === 'html'
            ? 'min-h-[820px]'
            : 'aspect-[210/297]'
        }`}
        style={{
          width: `${baseWidthPx}px`,
          padding: `${previewMarginPx}px`,
        }}
      >
        {/* Dashed Margin Boundary Guide Overlay (Preview-Only) */}
        {showMarginGuides && marginMm > 0 && (
          <div
            className="pointer-events-none absolute border border-dashed border-sky-400/70 z-10"
            style={{
              top: `${previewMarginPx}px`,
              left: `${previewMarginPx}px`,
              right: `${previewMarginPx}px`,
              bottom: `${previewMarginPx}px`,
            }}
          />
        )}

        {/* Simulated Printable Body */}
        <div className="relative z-0 w-full h-full">{content}</div>

        {/* Simulated Page Number Watermark */}
        {renderSimulatedWatermark(pageIndex + 1)}
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 no-print"
      role="dialog"
      aria-modal="true"
      aria-label={lang === 'bn' ? 'প্রিন্ট প্রিভিউ' : 'Print Preview'}
    >
      <div className="w-full max-w-[1260px] h-[94vh] bg-white dark:bg-slate-950 border-2 border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Dark Command Header */}
        <div className="bg-slate-950 text-white px-4 sm:px-6 py-3.5 border-b-2 border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
              <Printer className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-white truncate">
                  {lang === 'bn'
                    ? 'প্রিন্ট প্রিভিউ — A4 লেআউট যাচাই করুন'
                    : 'Print Preview — Verify Page Layout'}
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-amber-300 text-[11px] font-black tabular-nums whitespace-nowrap">
                  {is4x6 ? '4×6 Photo' : 'A4 · 210×297 mm'}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-black tabular-nums whitespace-nowrap">
                  {totalPages} {lang === 'bn' ? 'টি পাতা' : totalPages === 1 ? 'Page' : 'Pages'}
                </span>
              </div>
              <div className="text-xs text-slate-400 font-semibold truncate mt-0.5">
                {job.title}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setJob(null)}
            aria-label={lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Split Body */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Controls Workbench */}
          <div className="w-full lg:w-[340px] shrink-0 bg-white dark:bg-slate-900 border-b-2 lg:border-b-0 lg:border-r-2 border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex flex-col justify-between gap-4 overflow-y-auto">
            <div className="space-y-5">
              {/* 1. Page Margins Selector */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-950 dark:text-amber-300 uppercase tracking-wide">
                    <Maximize2 className="w-3.5 h-3.5 text-sky-600 dark:text-amber-400" />
                    <span>{lang === 'bn' ? 'পৃষ্ঠার মার্জিন' : 'Page Margins'}</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400 tabular-nums">
                    {marginMm} mm
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {MARGIN_OPTIONS.map((opt) => {
                    const active = marginPreset === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setMarginPreset(opt.id)}
                        className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                          active
                            ? 'bg-slate-950 dark:bg-amber-400 text-white dark:text-slate-950 border-slate-950 dark:border-amber-400 shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700 hover:border-slate-950 dark:hover:border-amber-400'
                        }`}
                      >
                        <div className="text-xs font-black leading-tight">
                          {lang === 'bn' ? opt.labelBn : opt.labelEn}
                        </div>
                        <div
                          className={`text-[10px] font-bold mt-0.5 tabular-nums ${
                            active
                              ? 'text-amber-300 dark:text-slate-800'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {lang === 'bn' ? opt.hintBn : opt.hintEn}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <label className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
                  <span className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <Eye className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    {lang === 'bn'
                      ? 'প্রিভিউতে মার্জিন লাইন দেখুন'
                      : 'Show margin guide border'}
                  </span>
                  <input
                    type="checkbox"
                    checked={showMarginGuides}
                    onChange={(e) => setShowMarginGuides(e.target.checked)}
                    className="w-4 h-4 accent-slate-950 dark:accent-amber-400 rounded cursor-pointer"
                  />
                </label>
              </div>

              {/* 2. Page Number Watermark Switch */}
              <div className="space-y-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs font-black text-slate-950 dark:text-amber-300 uppercase tracking-wide">
                  <Hash className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    {lang === 'bn' ? 'পেজ নম্বর ওয়াটারমার্ক' : 'Page Number Watermark'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPageWatermark((v) => !v)}
                  className={`w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl border-2 text-left transition-colors cursor-pointer ${
                    showPageWatermark
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-600 text-emerald-950 dark:text-emerald-100'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100'
                  }`}
                >
                  <div>
                    <div className="text-xs font-black">
                      {showPageWatermark
                        ? lang === 'bn'
                          ? 'পেজ নম্বর ওয়াটারমার্ক চালু আছে'
                          : 'Page Watermark Enabled'
                        : lang === 'bn'
                        ? 'পেজ নম্বর ওয়াটারমার্ক যোগ করুন'
                        : 'Add Page Number Watermark'}
                    </div>
                    <div className="text-[11px] font-semibold opacity-75 mt-0.5">
                      {lang === 'bn'
                        ? 'প্রতিটি পাতায় "Page 1 of N" প্রিন্ট হবে'
                        : 'Prints "Page 1 of N" cleanly on each sheet'}
                    </div>
                  </div>
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                      showPageWatermark
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-transparent'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                  </span>
                </button>

                {showPageWatermark && (
                  <div className="grid grid-cols-3 gap-1.5">
                    {WATERMARK_POSITIONS.map((pos) => {
                      const active = watermarkPosition === pos.id;
                      return (
                        <button
                          key={pos.id}
                          type="button"
                          onClick={() => setWatermarkPosition(pos.id)}
                          className={`px-2 py-2 rounded-lg text-[11px] font-extrabold border-2 transition-colors cursor-pointer whitespace-nowrap ${
                            active
                              ? 'bg-slate-950 dark:bg-amber-400 text-white dark:text-slate-950 border-slate-950 dark:border-amber-400'
                              : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-500'
                          }`}
                        >
                          {lang === 'bn' ? pos.labelBn : pos.labelEn}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 3. Simulated Sheet Zoom */}
              <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs font-black text-slate-950 dark:text-slate-200 uppercase tracking-wide">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600 dark:text-amber-400" />
                  <span>{lang === 'bn' ? 'প্রিভিউ জুম স্কেল' : 'Preview Zoom'}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {([65, 85, 100] as const).map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setZoomPct(pct)}
                      className={`py-1.5 rounded-lg text-xs font-black border-2 tabular-nums transition-colors cursor-pointer ${
                        zoomPct === pct
                          ? 'bg-slate-950 dark:bg-amber-400 text-white dark:text-slate-950 border-slate-950 dark:border-amber-400'
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Print Now & Cancel Buttons */}
            <div className="space-y-2 pt-4 border-t-2 border-slate-200 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={handleConfirmPrint}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-black shadow-md transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>
                  {lang === 'bn'
                    ? 'এখনই প্রিন্ট ডায়ালগ খুলুন'
                    : 'Print Now / Save PDF'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setJob(null)}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-extrabold transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'ফিরে যান (বাতিল)' : 'Back to Editor'}</span>
              </button>
            </div>
          </div>

          {/* Right Simulated A4 Paper Drafting Mat */}
          <div className="flex-1 bg-slate-900 overflow-auto p-4 sm:p-8 flex flex-col items-center gap-6">
            {job.kind === 'image' &&
              job.imageDataUrl &&
              renderSimulatedSheet(
                0,
                <img
                  src={job.imageDataUrl}
                  alt={job.title}
                  className="w-full h-full object-contain block mx-auto"
                />
              )}

            {job.kind === 'multi-image' &&
              job.imageDataUrls &&
              job.imageDataUrls.map((url, idx) =>
                renderSimulatedSheet(
                  idx,
                  <img
                    src={url}
                    alt={`${job.title} - Page ${idx + 1}`}
                    className="w-full h-full object-contain block mx-auto"
                  />
                )
              )}

            {job.kind === 'html' &&
              job.htmlContent &&
              renderSimulatedSheet(
                0,
                <div
                  className="a4-preview-html text-slate-900 bg-white"
                  dangerouslySetInnerHTML={{ __html: job.htmlContent }}
                />
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

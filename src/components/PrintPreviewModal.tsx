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
  Ruler,
  Stamp,
} from 'lucide-react';
import type { AppLang } from '../data/i18n';
import {
  MARGIN_PRESET_MM,
  executePrintJob,
  subscribePrintPreview,
  type CustomWatermarkStyle,
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

const CUSTOM_WATERMARK_STYLES: {
  id: CustomWatermarkStyle;
  labelEn: string;
  labelBn: string;
}[] = [
  { id: 'diagonal', labelEn: 'Diagonal Center', labelBn: 'মাঝে তির্যক' },
  { id: 'header', labelEn: 'Top Right', labelBn: 'উপরে ডানে' },
  { id: 'footer', labelEn: 'Bottom Left', labelBn: 'নিচে বামে' },
];

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({ lang }) => {
  const [job, setJob] = useState<PrintJobPayload | null>(null);
  const [marginPreset, setMarginPreset] = useState<MarginPreset>('narrow');
  const [lastNonZeroMargin, setLastNonZeroMargin] = useState<MarginPreset>('standard');
  const [showPageWatermark, setShowPageWatermark] = useState<boolean>(false);
  const [watermarkPosition, setWatermarkPosition] =
    useState<WatermarkPosition>('bottom-right');
  const [customWatermarkText, setCustomWatermarkText] = useState<string>('');
  const [customWatermarkStyle, setCustomWatermarkStyle] =
    useState<CustomWatermarkStyle>('diagonal');
  const [showMarginGuides, setShowMarginGuides] = useState<boolean>(true);
  const [showRuler, setShowRuler] = useState<boolean>(true);
  const [zoomPct, setZoomPct] = useState<65 | 85 | 100>(85);

  useEffect(() => {
    return subscribePrintPreview((incoming) => {
      setJob(incoming);
      setMarginPreset(incoming.defaultMargin);
      if (incoming.defaultMargin !== 'none') {
        setLastNonZeroMargin(incoming.defaultMargin);
      }
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

  // Base simulated sheet width & height in CSS pixels mapped from zoom scale
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

  const paperWidthMm = is4x6 ? 101.6 : 210;
  const paperHeightMm = is4x6 ? 152.4 : 297;
  const pxPerMm = baseWidthPx / paperWidthMm;
  const previewMarginPx = Math.round(marginMm * pxPerMm);
  const trimmedWatermark = customWatermarkText.trim();

  const handleSelectMargin = (preset: MarginPreset) => {
    setMarginPreset(preset);
    if (preset !== 'none') setLastNonZeroMargin(preset);
  };

  const handleToggleMargins = () => {
    if (marginPreset === 'none') {
      setMarginPreset(lastNonZeroMargin);
    } else {
      setLastNonZeroMargin(marginPreset);
      setMarginPreset('none');
    }
  };

  const handleConfirmPrint = () => {
    const activeJob = job;
    setJob(null);
    executePrintJob(activeJob, {
      marginPreset,
      showPageWatermark,
      watermarkPosition,
      customWatermarkText,
      customWatermarkStyle,
    });
  };

  const renderHorizontalRuler = () => {
    const ticks: number[] = [];
    const maxMm = Math.floor(paperWidthMm);
    for (let mm = 0; mm <= maxMm; mm += 5) {
      ticks.push(mm);
    }

    return (
      <div
        className="relative h-7 bg-slate-800 border-b border-slate-600 select-none overflow-hidden shrink-0"
        style={{ width: `${baseWidthPx}px` }}
        aria-hidden="true"
      >
        {/* Active Left & Right Margin Highlight Zones on Ruler */}
        {marginMm > 0 && (
          <>
            <div
              className="absolute top-0 bottom-0 left-0 bg-sky-400/25 border-r border-sky-400"
              style={{ width: `${previewMarginPx}px` }}
            />
            <div
              className="absolute top-0 bottom-0 right-0 bg-sky-400/25 border-l border-sky-400"
              style={{ width: `${previewMarginPx}px` }}
            />
          </>
        )}

        {ticks.map((mm) => {
          const leftPx = mm * pxPerMm;
          const isMajor = mm % 20 === 0;
          const isMid = mm % 10 === 0 && !isMajor;
          return (
            <div
              key={mm}
              className="absolute bottom-0 flex flex-col items-start"
              style={{ left: `${leftPx}px` }}
            >
              {isMajor && mm < maxMm - 6 && (
                <span className="text-[9px] font-mono font-bold text-amber-300 leading-none mb-0.5 pl-0.5 tabular-nums">
                  {mm}
                </span>
              )}
              <div
                className={`w-px ${
                  isMajor
                    ? 'h-3 bg-amber-300'
                    : isMid
                    ? 'h-2 bg-slate-400'
                    : 'h-1.5 bg-slate-600'
                }`}
              />
            </div>
          );
        })}
      </div>
    );
  };

  const renderVerticalRuler = () => {
    const ticks: number[] = [];
    const maxMm = Math.floor(paperHeightMm);
    for (let mm = 0; mm <= maxMm; mm += 5) {
      ticks.push(mm);
    }

    return (
      <div
        className="relative w-7 bg-slate-800 border-r border-slate-600 select-none overflow-hidden shrink-0"
        aria-hidden="true"
      >
        {/* Active Top & Bottom Margin Highlight Zones on Ruler */}
        {marginMm > 0 && (
          <>
            <div
              className="absolute left-0 right-0 top-0 bg-sky-400/25 border-b border-sky-400"
              style={{ height: `${previewMarginPx}px` }}
            />
            <div
              className="absolute left-0 right-0 bottom-0 bg-sky-400/25 border-t border-sky-400"
              style={{ height: `${previewMarginPx}px` }}
            />
          </>
        )}

        {ticks.map((mm) => {
          const topPx = mm * pxPerMm;
          const isMajor = mm % 20 === 0;
          const isMid = mm % 10 === 0 && !isMajor;
          return (
            <div
              key={mm}
              className="absolute right-0 flex items-center justify-end"
              style={{ top: `${topPx}px` }}
            >
              {isMajor && mm > 0 && mm < maxMm - 8 && (
                <span className="text-[8px] font-mono font-bold text-amber-300 leading-none pr-0.5 tabular-nums">
                  {mm}
                </span>
              )}
              <div
                className={`h-px ${
                  isMajor
                    ? 'w-2.5 bg-amber-300'
                    : isMid
                    ? 'w-1.5 bg-slate-400'
                    : 'w-1 bg-slate-600'
                }`}
              />
            </div>
          );
        })}
      </div>
    );
  };

  const renderSimulatedCustomWatermark = () => {
    if (!trimmedWatermark) return null;

    if (customWatermarkStyle === 'diagonal') {
      return (
        <div className="pointer-events-none select-none absolute inset-0 flex items-center justify-center overflow-hidden z-20">
          <span className="-rotate-32 text-2xl sm:text-3xl font-black uppercase tracking-widest text-slate-900/15 whitespace-nowrap px-4">
            {trimmedWatermark}
          </span>
        </div>
      );
    }

    if (customWatermarkStyle === 'header') {
      return (
        <div className="pointer-events-none select-none absolute top-2.5 right-3 z-20 font-mono text-[10px] font-extrabold text-slate-700 bg-white/90 border border-slate-300 px-2.5 py-0.5 rounded shadow-2xs">
          {trimmedWatermark}
        </div>
      );
    }

    return (
      <div className="pointer-events-none select-none absolute bottom-2.5 left-3 z-20 font-mono text-[10px] font-extrabold text-slate-700 bg-white/90 border border-slate-300 px-2.5 py-0.5 rounded shadow-2xs">
        {trimmedWatermark}
      </div>
    );
  };

  const renderSimulatedPageWatermark = (pageNum: number) => {
    if (!showPageWatermark) return null;

    if (watermarkPosition === 'diagonal') {
      return (
        <div className="pointer-events-none select-none absolute inset-0 flex items-center justify-center overflow-hidden z-20">
          <span
            className={`-rotate-30 font-mono text-3xl sm:text-4xl font-black tracking-widest text-slate-900/10 whitespace-nowrap ${
              trimmedWatermark && customWatermarkStyle === 'diagonal' ? 'translate-y-10' : ''
            }`}
          >
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
        <span>{is4x6 ? '4 × 6 in (102 × 152 mm)' : 'A4 (210 × 297 mm)'}</span>
        <span aria-hidden="true">·</span>
        <span>
          {marginMm} mm {lang === 'bn' ? 'মার্জিন' : 'margin'}
        </span>
      </div>

      {/* Sheet Frame with Optional Top & Left Precision Millimeter Rulers */}
      <div className="inline-flex flex-col rounded-lg overflow-hidden shadow-2xl border border-slate-700">
        {showRuler && (
          <div className="flex items-stretch">
            <div className="w-7 h-7 bg-slate-950 border-r border-b border-slate-600 flex items-center justify-center text-[9px] font-mono font-black text-amber-300 shrink-0">
              mm
            </div>
            {renderHorizontalRuler()}
          </div>
        )}

        <div className="flex items-stretch">
          {showRuler && renderVerticalRuler()}

          <div
            className={`relative bg-white text-slate-900 overflow-hidden transition-all duration-200 ${
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
                className="pointer-events-none absolute border border-dashed border-sky-500/75 z-10"
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

            {/* Simulated Custom Text Watermark Overlay */}
            {renderSimulatedCustomWatermark()}

            {/* Simulated Page Number Watermark */}
            {renderSimulatedPageWatermark(pageIndex + 1)}
          </div>
        </div>
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
      <div className="w-full max-w-[1280px] h-[94vh] bg-white dark:bg-slate-950 border-2 border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
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
                    ? 'প্রিন্ট প্রিভিউ — A4 লেআউট ও রুলার যাচাই'
                    : 'Print Preview — Verify A4 Layout & Ruler'}
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
          <div className="w-full lg:w-[360px] shrink-0 bg-white dark:bg-slate-900 border-b-2 lg:border-b-0 lg:border-r-2 border-slate-200 dark:border-slate-800 p-4 sm:p-5 flex flex-col justify-between gap-4 overflow-y-auto">
            <div className="space-y-4">
              {/* 1. Toggleable Page Margins */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-950 dark:text-amber-300 uppercase tracking-wide">
                    <Maximize2 className="w-3.5 h-3.5 text-sky-600 dark:text-amber-400" />
                    <span>{lang === 'bn' ? 'পৃষ্ঠার মার্জিন' : 'Page Margins'}</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleMargins}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black tabular-nums border transition-colors cursor-pointer whitespace-nowrap ${
                      marginPreset !== 'none'
                        ? 'bg-sky-600 text-white border-sky-700'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {marginPreset !== 'none'
                      ? `${lang === 'bn' ? 'মার্জিন চালু' : 'Margins ON'} (${marginMm}mm)`
                      : lang === 'bn'
                      ? 'মার্জিন বন্ধ (0mm)'
                      : 'Margins OFF (0mm)'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {MARGIN_OPTIONS.map((opt) => {
                    const active = marginPreset === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectMargin(opt.id)}
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

                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                      <Ruler className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>{lang === 'bn' ? 'মিলিমিটার রুলার' : 'Visual Ruler'}</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={showRuler}
                      onChange={(e) => setShowRuler(e.target.checked)}
                      className="w-4 h-4 accent-slate-950 dark:accent-amber-400 rounded cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                      <Eye className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                      <span>{lang === 'bn' ? 'মার্জিন লাইন' : 'Guide Box'}</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={showMarginGuides}
                      onChange={(e) => setShowMarginGuides(e.target.checked)}
                      className="w-4 h-4 accent-slate-950 dark:accent-amber-400 rounded cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* 2. Custom Text Watermark Input */}
              <div className="space-y-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-950 dark:text-amber-300 uppercase tracking-wide">
                    <Stamp className="w-3.5 h-3.5 text-violet-600 dark:text-amber-400" />
                    <span>{lang === 'bn' ? 'কাস্টম ওয়াটারমার্ক' : 'Watermark'}</span>
                  </div>
                  {trimmedWatermark && (
                    <button
                      type="button"
                      onClick={() => setCustomWatermarkText('')}
                      className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                    >
                      {lang === 'bn' ? 'মুছুন' : 'Clear'}
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  value={customWatermarkText}
                  onChange={(e) => setCustomWatermarkText(e.target.value)}
                  placeholder="Generated by PC Tool"
                  className="w-full px-3 py-2 border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-950 dark:text-white rounded-xl text-xs font-bold focus:outline-none focus:border-slate-950 dark:focus:border-amber-400"
                />

                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCustomWatermarkText('Generated by PC Tool')}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 dark:bg-amber-400 text-white dark:text-slate-950 text-[11px] font-extrabold cursor-pointer hover:opacity-90"
                  >
                    + Generated by PC Tool
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomWatermarkText('CUSTOMER COPY')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-bold cursor-pointer hover:border-slate-950"
                  >
                    + CUSTOMER COPY
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomWatermarkText('VERIFIED')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-bold cursor-pointer hover:border-slate-950"
                  >
                    + VERIFIED
                  </button>
                </div>

                {trimmedWatermark && (
                  <div className="grid grid-cols-3 gap-1.5">
                    {CUSTOM_WATERMARK_STYLES.map((st) => {
                      const active = customWatermarkStyle === st.id;
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setCustomWatermarkStyle(st.id)}
                          className={`px-2 py-1.5 rounded-lg text-[11px] font-extrabold border-2 transition-colors cursor-pointer whitespace-nowrap ${
                            active
                              ? 'bg-slate-950 dark:bg-amber-400 text-white dark:text-slate-950 border-slate-950 dark:border-amber-400'
                              : 'bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-500'
                          }`}
                        >
                          {lang === 'bn' ? st.labelBn : st.labelEn}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 3. Page Number Watermark Switch */}
              <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs font-black text-slate-950 dark:text-amber-300 uppercase tracking-wide">
                  <Hash className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    {lang === 'bn' ? 'পেজ নম্বর ওয়াটারমার্ক' : 'Page Number Stamp'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPageWatermark((v) => !v)}
                  className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border-2 text-left transition-colors cursor-pointer ${
                    showPageWatermark
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-600 text-emerald-950 dark:text-emerald-100'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100'
                  }`}
                >
                  <div>
                    <div className="text-xs font-black">
                      {showPageWatermark
                        ? lang === 'bn'
                          ? 'পেজ নম্বর চালু ("Page 1 of N")'
                          : 'Page Number Enabled'
                        : lang === 'bn'
                        ? 'পেজ নম্বর যোগ করুন'
                        : 'Add Page Number'}
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
                          className={`px-2 py-1.5 rounded-lg text-[11px] font-extrabold border-2 transition-colors cursor-pointer whitespace-nowrap ${
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

              {/* 4. Simulated Sheet Zoom */}
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

import React, { useMemo, useRef, useState } from 'react';
import {
  Camera,
  Upload,
  FileSearch,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  Printer,
  Download,
  ShieldCheck,
  AlertTriangle,
  Search,
  Trash2,
  Aperture,
  Clock,
  Cpu,
  X,
} from 'lucide-react';
import type { AppLang } from '../../data/i18n';
import {
  inspectImageMetadata,
  type ExtractedImageMetadata,
} from '../../utils/cameraMetadataParser';
import { printElementHtml } from '../../utils/printHelper';

interface CameraMetadataWorkspaceProps {
  mode: 'shutter' | 'metadata';
  lang?: AppLang;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const CameraMetadataWorkspace: React.FC<CameraMetadataWorkspaceProps> = ({
  mode,
  lang = 'en',
}) => {
  const [activeView, setActiveView] = useState<'shutter' | 'metadata'>(mode);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<ExtractedImageMetadata | null>(null);
  const [history, setHistory] = useState<
    { fileName: string; model: string; count: number | null; sourceTag: string }[]
  >([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [stripping, setStripping] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const printReportRef = useRef<HTMLDivElement>(null);

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setLoading(true);
    setErrorMsg('');

    try {
      const files = Array.from(fileList);
      let latestMeta: ExtractedImageMetadata | null = null;
      let latestPreview: string | null = null;
      const batchHistory: {
        fileName: string;
        model: string;
        count: number | null;
        sourceTag: string;
      }[] = [];

      for (const file of files) {
        const parsed = await inspectImageMetadata(file);
        latestMeta = parsed;
        batchHistory.push({
          fileName: parsed.fileName,
          model: `${parsed.cameraMake} ${parsed.cameraModel}`.trim() || 'Unknown',
          count: parsed.shutter.found ? parsed.shutter.count : null,
          sourceTag: parsed.shutter.sourceTag,
        });
      }

      if (latestMeta) {
        const lastFile = files[files.length - 1];
        if (lastFile.type.startsWith('image/')) {
          latestPreview = URL.createObjectURL(lastFile);
        } else {
          latestPreview = null;
        }
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return latestPreview;
        });
        setMeta(latestMeta);
        setSelectedGroup('ALL');
        setHistory((prev) => [...batchHistory.reverse(), ...prev].slice(0, 8));
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Could not read this file. Please try an unedited JPG, PNG, or RAW file.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      // Ignore clipboard permission errors
    }
  };

  const handleDownloadJson = () => {
    if (!meta) return;
    const exportPayload = {
      fileName: meta.fileName,
      fileSizeBytes: meta.fileSizeBytes,
      dimensions: meta.width && meta.height ? `${meta.width}x${meta.height}` : null,
      camera: {
        make: meta.cameraMake,
        model: meta.cameraModel,
        lens: meta.lensModel,
        serialNumber: meta.serialNumber,
      },
      shutterCount: meta.shutter,
      gps: meta.gps,
      groups: meta.groups,
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${meta.fileName.replace(/\.[^/.]+$/, '')}-metadata.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleStripAndDownloadClean = async () => {
    if (!previewUrl || !meta) return;
    setStripping(true);
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = previewUrl;
      });
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');
      ctx.drawImage(img, 0, 0);

      const isPng = meta.extension === 'PNG';
      const mime = isPng ? 'image/png' : 'image/jpeg';
      const cleanBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Failed to encode clean image'))),
          mime,
          0.95
        );
      });
      const url = URL.createObjectURL(cleanBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${meta.fileName.replace(/\.[^/.]+$/, '')}-clean-no-exif.${
        isPng ? 'png' : 'jpg'
      }`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setErrorMsg('Clean export is supported for standard JPG, PNG, and WEBP images.');
    } finally {
      setStripping(false);
    }
  };

  const groupNames = useMemo(() => {
    if (!meta) return [];
    return Object.keys(meta.groups);
  }, [meta]);

  const filteredEntries = useMemo(() => {
    if (!meta) return [];
    const base =
      selectedGroup === 'ALL' ? meta.allEntries : meta.groups[selectedGroup] || [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (item) =>
        item.key.toLowerCase().includes(q) ||
        item.value.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q)
    );
  }, [meta, selectedGroup, searchQuery]);

  const isBn = lang === 'bn';

  return (
    <div className="space-y-6">
      {/* Dark High-Contrast Studio Header */}
      <div className="bg-slate-950 text-white border-2 border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <span className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
              {activeView === 'shutter' ? (
                <Camera className="w-6 h-6" />
              ) : (
                <FileSearch className="w-6 h-6" />
              )}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">
                  {activeView === 'shutter'
                    ? isBn
                      ? 'DSLR ক্যামেরা শাটার কাউন্ট চেকার (Real EXIF)'
                      : 'DSLR & Mirrorless Shutter Count Checker'
                    : isBn
                    ? 'ইমেজ মেটাডেটা এক্সট্র্যাক্টর (EXIF · GPS · XMP)'
                    : 'Image Metadata Extractor (EXIF · GPS · XMP · ICC)'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-400 text-slate-950 text-[11px] font-black uppercase">
                  100% Real Binary Parser
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">
                {activeView === 'shutter'
                  ? isBn
                    ? 'সরাসরি ক্যামেরার আসল JPG বা RAW (.NEF, .ARW, .CR2, .RAF, .PEF, .DNG) থেকে প্রকৃত শাটার কাউন্ট পড়ুন — ব্রাউজার থেকেই সম্পূর্ণ প্রাইভেট।'
                    : 'Reads genuine mechanical shutter actuations directly from MakerNote binary & XMP tags in Nikon NEF/JPG, Sony ARW/JPG, Fujifilm RAF/JPG & Pentax PEF/DNG.'
                  : isBn
                  ? 'ছবির ক্যামেরা মডেল, লেন্স, শাটার স্পিড, ISO, GPS লোকেশন ও সব গোপন ট্যাগ দেখুন অথবা মেটাডেটা মুছে পরিষ্কার ছবি ডাউনলোড করুন।'
                  : 'Inspect complete EXIF, camera serial, lens telemetry, GPS map coordinates, XMP/IPTC/ICC tags, or strip all metadata for privacy.'}
              </p>
            </div>
          </div>

          {/* Mode Toggle Switcher */}
          <div className="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-700 shrink-0">
            <button
              type="button"
              onClick={() => setActiveView('shutter')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-colors cursor-pointer whitespace-nowrap ${
                activeView === 'shutter'
                  ? 'bg-amber-400 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Aperture className="w-3.5 h-3.5" />
              <span>{isBn ? 'শাটার কাউন্ট' : 'Shutter Count'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('metadata')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-colors cursor-pointer whitespace-nowrap ${
                activeView === 'metadata'
                  ? 'bg-amber-400 text-slate-950'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <FileSearch className="w-3.5 h-3.5" />
              <span>{isBn ? 'মেটাডেটা এক্সট্র্যাক্টর' : 'All Metadata'}</span>
            </button>
          </div>
        </div>

        {/* Supported Camera Formats Strip */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-bold">
          {[
            'Nikon (.NEF / .JPG)',
            'Sony Alpha (.ARW / .JPG)',
            'Fujifilm (.RAF / .JPG)',
            'Pentax / Ricoh (.PEF / .DNG)',
            'Canon (.CR2 / .CR3 / .JPG)',
            'Smartphone / GPS / PNG / WEBP',
          ].map((label) => (
            <span
              key={label}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300"
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Drag & Drop File Upload Box */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFilesSelected(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-400 dark:border-slate-600 hover:border-slate-950 dark:hover:border-amber-400 bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.tif,.tiff,.heic,.avif,.nef,.nrw,.arw,.cr2,.cr3,.raf,.pef,.dng,.orf,.rw2,image/*"
          onChange={(e) => handleFilesSelected(e.target.files)}
          className="hidden"
        />
        <div className="w-12 h-12 rounded-2xl bg-slate-950 dark:bg-amber-400 text-amber-300 dark:text-slate-950 flex items-center justify-center mx-auto mb-3">
          <Upload className="w-6 h-6" />
        </div>
        <div className="text-sm sm:text-base font-black text-slate-950 dark:text-white">
          {loading
            ? isBn
              ? 'ফাইলের বাইনারি EXIF ও MakerNote বিশ্লেষণ হচ্ছে...'
              : 'Parsing EXIF, XMP & Camera MakerNote binary...'
            : isBn
            ? 'অরিজিনাল ক্যামেরা ছবি বা RAW ফাইল এখানে দিন (ক্লিক করুন)'
            : 'Drop or Select Unedited Camera Photo / RAW File'}
        </div>
        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1 max-w-xl mx-auto">
          {isBn
            ? 'সঠিক শাটার কাউন্টের জন্য হোয়াটসঅ্যাপ বা এডিট ছাড়া সরাসরি SD কার্ড থেকে তোলা ছবি (.JPG, .NEF, .ARW, .CR2, .RAF, .PEF) দিন। একসাথে একাধিক টেস্ট শটও তুলনা করতে পারবেন।'
            : 'Works offline in your browser — files never leave your computer. Upload straight-out-of-camera JPG or RAW files for exact DSLR shutter count.'}
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-500 text-rose-900 dark:text-rose-200 text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Results View */}
      {meta && (
        <div ref={printReportRef} className="print-area space-y-6">
          {/* SHUTTER COUNT HERO CARD */}
          {(activeView === 'shutter' || meta.shutter.found) && (
            <div
              className={`rounded-2xl border-2 overflow-hidden shadow-md ${
                meta.shutter.found
                  ? 'bg-slate-950 text-white border-emerald-500'
                  : 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white border-amber-500'
              }`}
            >
              <div className="p-5 sm:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black ${
                        meta.shutter.found
                          ? 'bg-emerald-400 text-slate-950'
                          : 'bg-amber-400 text-slate-950'
                      }`}
                    >
                      {meta.shutter.found ? (
                        <ShieldCheck className="w-3.5 h-3.5" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {meta.shutter.found
                          ? isBn
                            ? 'আসল শাটার কাউন্ট পাওয়া গেছে'
                            : 'VERIFIED SHUTTER COUNT'
                          : isBn
                          ? 'এই ফাইলে শাটার কাউন্ট ট্যাগ নেই'
                          : 'SHUTTER COUNT NOT EMBEDDED'}
                      </span>
                    </span>
                    <span
                      className={`text-xs font-mono font-bold ${
                        meta.shutter.found
                          ? 'text-slate-300'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {meta.shutter.sourceTag}
                    </span>
                  </div>

                  <div className="text-lg sm:text-2xl font-black">
                    {meta.cameraMake || meta.cameraModel
                      ? `${meta.cameraMake} ${meta.cameraModel}`.trim()
                      : meta.fileName}
                  </div>

                  <p
                    className={`text-xs sm:text-sm font-medium leading-relaxed max-w-2xl ${
                      meta.shutter.found
                        ? 'text-slate-300'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {isBn ? meta.shutter.explanationBn : meta.shutter.explanationEn}
                  </p>

                  {/* Camera Details Chips */}
                  <div className="flex flex-wrap gap-2 pt-1 text-xs font-bold">
                    {meta.lensModel && (
                      <span
                        className={`px-2.5 py-1 rounded-lg border ${
                          meta.shutter.found
                            ? 'bg-slate-900 border-slate-700 text-sky-300'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        Lens: {meta.lensModel}
                      </span>
                    )}
                    {meta.serialNumber && (
                      <span
                        className={`px-2.5 py-1 rounded-lg border font-mono ${
                          meta.shutter.found
                            ? 'bg-slate-900 border-slate-700 text-amber-300'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        Body S/N: {meta.serialNumber}
                      </span>
                    )}
                    {meta.shutter.fileNumber && (
                      <span
                        className={`px-2.5 py-1 rounded-lg border font-mono ${
                          meta.shutter.found
                            ? 'bg-slate-900 border-slate-700 text-slate-200'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        File #: {meta.shutter.fileNumber}
                      </span>
                    )}
                  </div>
                </div>

                {/* Numeric Readout Box */}
                {meta.shutter.found && meta.shutter.count !== null && (
                  <div className="w-full lg:w-auto min-w-[240px] bg-slate-900 border-2 border-emerald-400/60 rounded-2xl p-5 text-center space-y-1.5 shrink-0">
                    <div className="text-[11px] font-black uppercase tracking-widest text-emerald-300">
                      {isBn ? 'মোট শাটার অ্যাকচুয়েশন' : 'Total Shutter Actuations'}
                    </div>
                    <div className="text-4xl sm:text-5xl font-black text-white tabular-nums tracking-tight">
                      {meta.shutter.count.toLocaleString()}
                    </div>
                    {meta.shutter.secondaryCount && (
                      <div className="text-[11px] font-mono text-slate-400">
                        {meta.shutter.secondaryLabel}:{' '}
                        {meta.shutter.secondaryCount.toLocaleString()}
                      </div>
                    )}
                    <div className="pt-2">
                      <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            meta.shutter.count < 50000
                              ? 'bg-emerald-400'
                              : meta.shutter.count < 120000
                              ? 'bg-amber-400'
                              : 'bg-rose-400'
                          }`}
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(4, Math.round((meta.shutter.count / 150000) * 100))
                            )}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1 tabular-nums">
                        <span>0</span>
                        <span>
                          {isBn ? 'গড় DSLR সীমা ~150k' : '150k DSLR Ref.'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Bar inside Shutter Result */}
              <div
                className={`px-5 py-3 border-t flex flex-wrap items-center justify-between gap-2 no-print ${
                  meta.shutter.found
                    ? 'bg-slate-900/90 border-slate-800 text-slate-300'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="text-xs font-semibold truncate">
                  {meta.fileName} · {formatBytes(meta.fileSizeBytes)}
                  {meta.dateTaken ? ` · ${meta.dateTaken}` : ''}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {meta.shutter.found && meta.shutter.count !== null && (
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyText(
                          'shutter',
                          `${meta.cameraMake} ${meta.cameraModel} | Shutter Count: ${meta.shutter.count?.toLocaleString()} | Source: ${meta.shutter.sourceTag}`
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-black cursor-pointer"
                    >
                      {copiedKey === 'shutter' ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {copiedKey === 'shutter'
                          ? isBn
                            ? 'কপি হয়েছে!'
                            : 'Copied!'
                          : isBn
                          ? 'রিপোর্ট কপি'
                          : 'Copy Result'}
                      </span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      printElementHtml(
                        printReportRef.current,
                        `Camera Inspection - ${meta.fileName}`
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-slate-950 border border-slate-300 hover:bg-slate-100 text-xs font-black cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{isBn ? 'প্রিন্ট রিপোর্ট (A4)' : 'Print Report'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Multi-Shot Comparison History (Useful when checking 2+ test photos from a used DSLR) */}
          {activeView === 'shutter' && history.length > 1 && (
            <div className="bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-2xl overflow-hidden no-print">
              <div className="px-4 py-3 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-black text-slate-950 dark:text-amber-300">
                  {isBn
                    ? 'সাম্প্রতিক চেক করা ছবির তুলনা (Serial Verification)'
                    : 'Recent Checked Shots Comparison'}
                </span>
                <button
                  type="button"
                  onClick={() => setHistory((prev) => prev.slice(0, 1))}
                  className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-rose-600 cursor-pointer"
                >
                  {isBn ? 'তালিকা মুছুন' : 'Clear History'}
                </button>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {history.map((h, i) => (
                  <div
                    key={`${h.fileName}-${i}`}
                    className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div className="font-bold text-slate-900 dark:text-slate-100">
                      {h.fileName}{' '}
                      <span className="text-slate-500 font-medium">({h.model})</span>
                    </div>
                    <div className="font-mono font-black tabular-nums text-emerald-700 dark:text-emerald-400">
                      {h.count !== null ? h.count.toLocaleString() : 'Not Embedded'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Image Preview + File & Exposure Telemetry Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Thumbnail & Quick Privacy Cleaner */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-2xl overflow-hidden shadow-xs">
              <div className="bg-slate-950 p-4 flex items-center justify-center min-h-[210px]">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={meta.fileName}
                    className="max-h-[260px] w-auto object-contain rounded-lg"
                  />
                ) : (
                  <div className="text-center text-slate-400 space-y-2 py-6">
                    <Camera className="w-10 h-10 mx-auto text-amber-300" />
                    <div className="text-xs font-bold text-slate-300">
                      {meta.extension} RAW Container
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Binary EXIF & MakerNote decoded directly
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">
                      Resolution
                    </div>
                    <div className="font-black text-slate-950 dark:text-white tabular-nums mt-0.5">
                      {meta.width && meta.height
                        ? `${meta.width} × ${meta.height}`
                        : 'RAW / Unknown'}
                    </div>
                    {meta.megapixels && (
                      <div className="text-[10px] font-bold text-sky-600 dark:text-sky-400 tabular-nums">
                        {meta.megapixels} MP
                      </div>
                    )}
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">
                      File Size
                    </div>
                    <div className="font-black text-slate-950 dark:text-white tabular-nums mt-0.5">
                      {formatBytes(meta.fileSizeBytes)}
                    </div>
                    <div className="text-[10px] font-bold text-slate-500">
                      {meta.extension} · MakerNote {meta.makerNoteBytes} B
                    </div>
                  </div>
                </div>

                {/* Metadata Privacy Stripper Button */}
                {previewUrl && (
                  <button
                    type="button"
                    disabled={stripping}
                    onClick={handleStripAndDownloadClean}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-950 dark:bg-amber-400 hover:bg-slate-800 dark:hover:bg-amber-300 text-white dark:text-slate-950 text-xs font-black transition-colors cursor-pointer no-print"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>
                      {stripping
                        ? 'Cleaning...'
                        : isBn
                        ? 'সব মেটাডেটা/GPS মুছে সেভ করুন'
                        : 'Strip EXIF/GPS & Save Clean Copy'}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Right Exposure Telemetry + GPS Card */}
            <div className="lg:col-span-8 space-y-5">
              {/* Camera Shooting Parameters */}
              <div className="bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-2xl overflow-hidden shadow-xs">
                <div className="px-4 py-3 bg-slate-950 text-white border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black text-amber-300">
                    <Cpu className="w-4 h-4" />
                    <span>
                      {isBn
                        ? 'ক্যামেরা ও এক্সপোজার সেটিংস'
                        : 'Camera & Exposure Telemetry'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-black">
                    {meta.hasExif && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                        EXIF
                      </span>
                    )}
                    {meta.hasXmp && (
                      <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300">
                        XMP
                      </span>
                    )}
                    {meta.hasIptc && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                        IPTC
                      </span>
                    )}
                    {meta.hasIcc && (
                      <span className="px-2 py-0.5 rounded bg-violet-500/20 text-violet-300">
                        ICC
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {[
                    { label: 'Camera Make', val: meta.cameraMake || '—' },
                    { label: 'Camera Model', val: meta.cameraModel || '—' },
                    { label: 'Aperture', val: meta.fNumber || '—' },
                    { label: 'Shutter Speed', val: meta.exposureTime || '—' },
                    { label: 'ISO Speed', val: meta.iso || '—' },
                    { label: 'Focal Length', val: meta.focalLength || '—' },
                    { label: 'White Balance', val: meta.whiteBalance || '—' },
                    { label: 'Software', val: meta.software || '—' },
                  ].map((cell) => (
                    <div
                      key={cell.label}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                    >
                      <div className="text-[10px] font-bold text-slate-500 uppercase">
                        {cell.label}
                      </div>
                      <div className="font-extrabold text-slate-950 dark:text-slate-100 mt-0.5 break-words tabular-nums">
                        {cell.val}
                      </div>
                    </div>
                  ))}
                </div>

                {meta.dateTaken && (
                  <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span>Capture Date/Time: {meta.dateTaken}</span>
                  </div>
                )}
              </div>

              {/* GPS Location Card */}
              <div
                className={`rounded-2xl border-2 p-4 sm:p-5 ${
                  meta.gps
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500'
                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        meta.gps
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      <MapPin className="w-5 h-5" />
                    </span>
                    <div>
                      <div className="text-xs font-black text-slate-950 dark:text-white">
                        {meta.gps
                          ? isBn
                            ? 'ছবিতে GPS লোকেশন পাওয়া গেছে'
                            : 'Embedded GPS Location Found'
                          : isBn
                          ? 'এই ছবিতে কোনো GPS লোকেশন নেই'
                          : 'No GPS Coordinates Embedded'}
                      </div>
                      {meta.gps ? (
                        <div className="text-xs font-mono font-bold text-emerald-900 dark:text-emerald-300 mt-1 tabular-nums">
                          {meta.gps.latitude.toFixed(6)}, {meta.gps.longitude.toFixed(6)}
                          {meta.gps.altitude !== null
                            ? ` · Alt ${meta.gps.altitude.toFixed(1)} m`
                            : ''}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                          {isBn
                            ? 'ক্যামেরা বা ফোন লোকেশন বন্ধ ছিল অথবা শেয়ার করার সময় মুছে ফেলা হয়েছে।'
                            : 'Location tagging was disabled on device or stripped prior to upload.'}
                        </div>
                      )}
                    </div>
                  </div>

                  {meta.gps && (
                    <div className="flex flex-wrap gap-2 no-print">
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyText(
                            'gps',
                            `${meta.gps!.latitude.toFixed(6)}, ${meta.gps!.longitude.toFixed(6)}`
                          )
                        }
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-emerald-500 text-emerald-900 dark:text-emerald-300 text-xs font-extrabold cursor-pointer"
                      >
                        {copiedKey === 'gps' ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedKey === 'gps' ? 'Copied' : 'Copy GPS'}</span>
                      </button>
                      <a
                        href={`https://maps.google.com/?q=${meta.gps.latitude},${meta.gps.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold"
                      >
                        <span>Open Map</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* FULL EXTRACTED METADATA TABLE EXPLORER */}
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-950 dark:border-slate-700 rounded-2xl overflow-hidden shadow-md">
            <div className="bg-slate-950 text-white px-4 sm:px-5 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileSearch className="w-4 h-4 text-amber-300" />
                <span className="text-xs sm:text-sm font-black">
                  {isBn
                    ? `সম্পূর্ণ মেটাডেটা তালিকা (${meta.allEntries.length} টি ট্যাগ)`
                    : `Full Extracted Metadata Explorer (${meta.allEntries.length} Tags)`}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 no-print">
                <button
                  type="button"
                  onClick={handleDownloadJson}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleCopyText(
                      'all-meta',
                      meta.allEntries
                        .map((e) => `[${e.group}] ${e.key}: ${e.value}`)
                        .join('\n')
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold cursor-pointer"
                >
                  {copiedKey === 'all-meta' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedKey === 'all-meta' ? 'Copied' : 'Copy All'}</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    printElementHtml(
                      printReportRef.current,
                      `Metadata Report - ${meta.fileName}`
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-slate-950 hover:bg-slate-200 text-xs font-black cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print A4</span>
                </button>
              </div>
            </div>

            {/* Filter Tabs & Search Box */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 space-y-3 no-print">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    isBn
                      ? 'যেকোনো ট্যাগ খুঁজুন (যেমন ISO, Lens, Model, Copyright, Serial)...'
                      : 'Search metadata tag or value (e.g. ISO, Lens, Serial, Software, GPS)...'
                  }
                  className="w-full pl-9 pr-9 py-2 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-950 dark:text-white text-xs font-semibold focus:outline-none focus:border-slate-950 dark:focus:border-amber-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedGroup('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-colors cursor-pointer whitespace-nowrap ${
                    selectedGroup === 'ALL'
                      ? 'bg-slate-950 dark:bg-amber-400 text-white dark:text-slate-950 border-slate-950 dark:border-amber-400'
                      : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  All ({meta.allEntries.length})
                </button>
                {groupNames.map((gName) => (
                  <button
                    key={gName}
                    type="button"
                    onClick={() => setSelectedGroup(gName)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-colors cursor-pointer whitespace-nowrap ${
                      selectedGroup === gName
                        ? 'bg-slate-950 dark:bg-amber-400 text-white dark:text-slate-950 border-slate-950 dark:border-amber-400'
                        : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {gName} ({meta.groups[gName].length})
                  </button>
                ))}
              </div>
            </div>

            {filteredEntries.length === 0 ? (
              <div className="p-8 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                {meta.allEntries.length === 0
                  ? isBn
                    ? 'এই ফাইলটিতে কোনো EXIF, XMP বা IPTC মেটাডেটা ট্যাগ পাওয়া যায়নি (সম্ভবত WhatsApp বা ওয়েব থেকে ডাউনলোড করা)।'
                    : 'No EXIF, XMP, or IPTC tags found inside this file.'
                  : 'No matching tags found for your search filter.'}
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-[520px] overflow-y-auto">
                {filteredEntries.map((entry, idx) => (
                  <div
                    key={`${entry.group}-${entry.key}-${idx}`}
                    className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-[200px] sm:w-1/3 shrink-0">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold shrink-0">
                        {entry.group}
                      </span>
                      <span className="font-extrabold text-slate-950 dark:text-amber-300 break-all">
                        {entry.key}
                      </span>
                    </div>
                    <div className="flex-1 font-mono text-[11px] sm:text-xs text-slate-800 dark:text-slate-200 break-all">
                      {entry.value}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyText(`row-${idx}`, `${entry.key}: ${entry.value}`)
                      }
                      aria-label={`Copy ${entry.key}`}
                      className="self-end sm:self-center p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 shrink-0 cursor-pointer no-print"
                    >
                      {copiedKey === `row-${idx}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import {
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Trash2,
  ShieldCheck,
  Copy,
} from 'lucide-react';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { MultiSlipXeroxSaver } from './MultiSlipXeroxSaver';
import { AutoPdfUnlockerPro } from './AutoPdfUnlockerPro';
import { PdfBookletImposition } from './PdfBookletImposition';
import type { AppLang } from '../../data/i18n';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface PdfToolsWorkspaceProps {
  toolId: string;
  appLang?: AppLang;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const PdfToolsWorkspace: React.FC<PdfToolsWorkspaceProps> = ({ toolId, appLang = 'en' }) => {
  if (toolId === 'multi-slip-xerox-saver') {
    return <MultiSlipXeroxSaver />;
  }
  if (toolId === 'auto-pdf-unlocker-pro') {
    return <AutoPdfUnlockerPro appLang={appLang} />;
  }
  if (toolId === 'pdf-booklet-imposition') {
    return <PdfBookletImposition appLang={appLang} />;
  }
  return <StandardPdfToolsWorkspace toolId={toolId} />;
};

const StandardPdfToolsWorkspace: React.FC<PdfToolsWorkspaceProps> = ({ toolId }) => {
  const [pdfFiles, setPdfFiles] = useState<{ file: File; bytes: Uint8Array; pageCount: number }[]>([]);
  const [imgFiles, setImgFiles] = useState<{ file: File; url: string }[]>([]);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState<string>('output.pdf');
  const [downloadSize, setDownloadSize] = useState<number>(0);

  // Tool-specific states
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [removedPages, setRemovedPages] = useState<Set<number>>(new Set());
  const [renderedPages, setRenderedPages] = useState<{ pageNum: number; url: string }[]>([]);
  const [extractedText, setExtractedText] = useState<string>('');
  const [pdfPassword, setPdfPassword] = useState<string>('');

  // Watermark & Numbering
  const [watermarkText, setWatermarkText] = useState<string>('CONFIDENTIAL');
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(25);
  const [numberPosition, setNumberPosition] = useState<'bottom-center' | 'bottom-right' | 'top-right'>('bottom-center');
  const [compressQuality, setCompressQuality] = useState<number>(65);
  const [imagePageMode, setImagePageMode] = useState<'a4' | 'fit'>('a4');

  // Signature verification result
  const [sigReport, setSigReport] = useState<{
    fileName: string;
    pageCount: number;
    hasSignatureField: boolean;
    hasByteRange: boolean;
    signatureCount: number;
    title: string;
    author: string;
    creator: string;
    producer: string;
    creationDate: string;
    signers: string[];
  } | null>(null);

  useEffect(() => {
    setPdfFiles([]);
    setImgFiles([]);
    setErrorMsg('');
    setStatusMsg('');
    setDownloadUrl(null);
    setPageOrder([]);
    setRemovedPages(new Set());
    setRenderedPages([]);
    setExtractedText('');
    setSigReport(null);
    setPdfPassword('');
  }, [toolId]);

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setErrorMsg('');
    setStatusMsg('');
    setDownloadUrl(null);
    setRenderedPages([]);
    setExtractedText('');
    setSigReport(null);

    if (toolId === 'image-to-pdf') {
      const imgs = Array.from(fileList).map((file) => ({
        file,
        url: URL.createObjectURL(file),
      }));
      setImgFiles((prev) => [...prev, ...imgs]);
      return;
    }

    const loaded: { file: File; bytes: Uint8Array; pageCount: number }[] = [];
    for (const file of Array.from(fileList)) {
      const buf = new Uint8Array(await file.arrayBuffer());
      let count = 1;
      try {
        const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
        count = doc.getPageCount();
      } catch {
        // Fallback via pdfjs if password protected
        try {
          const loadingTask = pdfjsLib.getDocument({ data: buf.slice(), password: pdfPassword || undefined });
          const pdf = await loadingTask.promise;
          count = pdf.numPages;
        } catch {
          // handled on action
        }
      }
      loaded.push({ file, bytes: buf, pageCount: count });
    }

    if (toolId === 'pdf-merge') {
      setPdfFiles((prev) => [...prev, ...loaded]);
    } else if (loaded.length > 0) {
      setPdfFiles([loaded[0]]);
      const indices = Array.from({ length: loaded[0].pageCount }, (_, i) => i + 1);
      setPageOrder(indices);
      setRemovedPages(new Set());
    }
  };

  const makePdfDownload = (bytes: Uint8Array, name: string) => {
    const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
    setDownloadUrl(URL.createObjectURL(blob));
    setDownloadName(name);
    setDownloadSize(blob.size);
  };

  // 1. Image to PDF
  const runImageToPdf = async () => {
    if (imgFiles.length === 0) return;
    setProcessing(true);
    setErrorMsg('');
    try {
      const pdfDoc = await PDFDocument.create();
      for (const item of imgFiles) {
        const imgEl = await new Promise<HTMLImageElement>((res, rej) => {
          const i = new Image();
          i.onload = () => res(i);
          i.onerror = rej;
          i.src = item.url;
        });
        const c = document.createElement('canvas');
        c.width = imgEl.naturalWidth;
        c.height = imgEl.naturalHeight;
        const ctx = c.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(imgEl, 0, 0);
        const jpgBlob = await new Promise<Blob>((r) => c.toBlob((b) => r(b!), 'image/jpeg', 0.92));
        const jpgBytes = await jpgBlob.arrayBuffer();
        const embedded = await pdfDoc.embedJpg(jpgBytes);

        if (imagePageMode === 'fit') {
          const page = pdfDoc.addPage([embedded.width, embedded.height]);
          page.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height });
        } else {
          // A4 portrait 595 x 842 pt
          const a4W = 595.28;
          const a4H = 841.89;
          const margin = 24;
          const page = pdfDoc.addPage([a4W, a4H]);
          const maxW = a4W - margin * 2;
          const maxH = a4H - margin * 2;
          const scale = Math.min(maxW / embedded.width, maxH / embedded.height);
          const drawW = embedded.width * scale;
          const drawH = embedded.height * scale;
          page.drawImage(embedded, {
            x: (a4W - drawW) / 2,
            y: (a4H - drawH) / 2,
            width: drawW,
            height: drawH,
          });
        }
      }
      const outBytes = await pdfDoc.save();
      makePdfDownload(outBytes, 'images-combined.pdf');
      setStatusMsg(`Created PDF with ${imgFiles.length} page(s)`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create PDF');
    } finally {
      setProcessing(false);
    }
  };

  // 2. Merge PDF
  const runMergePdf = async () => {
    if (pdfFiles.length < 2) {
      setErrorMsg('Please upload at least 2 PDF files to merge.');
      return;
    }
    setProcessing(true);
    setErrorMsg('');
    try {
      const merged = await PDFDocument.create();
      for (const item of pdfFiles) {
        const src = await PDFDocument.load(item.bytes);
        const copied = await merged.copyPages(src, src.getPageIndices());
        copied.forEach((p) => merged.addPage(p));
      }
      const out = await merged.save();
      makePdfDownload(out, 'merged-document.pdf');
      setStatusMsg(`Merged ${pdfFiles.length} PDF files (${merged.getPageCount()} pages total)`);
    } catch {
      setErrorMsg('One of the PDFs may be encrypted. Unlock it first before merging.');
    } finally {
      setProcessing(false);
    }
  };

  // 3. Remove or Rearrange PDF Pages
  const runReorderOrRemove = async () => {
    const primary = pdfFiles[0];
    if (!primary) return;
    setProcessing(true);
    setErrorMsg('');
    try {
      const src = await PDFDocument.load(primary.bytes);
      const outDoc = await PDFDocument.create();
      const targetIndices =
        toolId === 'pdf-rearrange'
          ? pageOrder.map((p) => p - 1)
          : Array.from({ length: src.getPageCount() }, (_, i) => i).filter(
              (idx) => !removedPages.has(idx + 1)
            );
      if (targetIndices.length === 0) {
        setErrorMsg('You cannot remove every page from the PDF.');
        setProcessing(false);
        return;
      }
      const copied = await outDoc.copyPages(src, targetIndices);
      copied.forEach((p) => outDoc.addPage(p));
      const out = await outDoc.save();
      makePdfDownload(out, `${toolId}-output.pdf`);
      setStatusMsg(`Saved PDF with ${targetIndices.length} page(s)`);
    } catch {
      setErrorMsg('Unable to edit this PDF (it may be password-locked).');
    } finally {
      setProcessing(false);
    }
  };

  // 4. Page Numbers or Watermark
  const runNumberOrWatermark = async () => {
    const primary = pdfFiles[0];
    if (!primary) return;
    setProcessing(true);
    setErrorMsg('');
    try {
      const doc = await PDFDocument.load(primary.bytes);
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      const pages = doc.getPages();
      const total = pages.length;

      pages.forEach((page, idx) => {
        const { width, height } = page.getSize();
        if (toolId === 'pdf-numbering') {
          const label = `Page ${idx + 1} of ${total}`;
          const textWidth = font.widthOfTextAtSize(label, 10);
          let x = (width - textWidth) / 2;
          let y = 20;
          if (numberPosition === 'bottom-right') {
            x = width - textWidth - 28;
            y = 20;
          } else if (numberPosition === 'top-right') {
            x = width - textWidth - 28;
            y = height - 28;
          }
          page.drawText(label, {
            x,
            y,
            size: 10,
            font,
            color: rgb(0.2, 0.25, 0.35),
          });
        } else {
          const text = watermarkText || 'CONFIDENTIAL';
          const fontSize = Math.max(24, Math.min(54, width / 11));
          const textW = font.widthOfTextAtSize(text, fontSize);
          page.drawText(text, {
            x: width / 2 - textW / 3,
            y: height / 2 - fontSize / 2,
            size: fontSize,
            font,
            color: rgb(0.48, 0.23, 0.93),
            opacity: Math.max(0.08, Math.min(0.8, watermarkOpacity / 100)),
            rotate: degrees(35),
          });
        }
      });

      const out = await doc.save();
      makePdfDownload(out, `${toolId}-output.pdf`);
      setStatusMsg(`Processed ${total} page(s)`);
    } catch {
      setErrorMsg('Could not modify this PDF.');
    } finally {
      setProcessing(false);
    }
  };

  // 5. PDF to Image OR Compress PDF OR Unlock PDF
  const runPdfJsPipeline = async () => {
    const primary = pdfFiles[0];
    if (!primary) return;
    setProcessing(true);
    setErrorMsg('');
    try {
      const loadingTask = pdfjsLib.getDocument({
        data: primary.bytes.slice(),
        password: pdfPassword || undefined,
      });
      const pdf = await loadingTask.promise;

      if (toolId === 'pdf-ocr') {
        const chunks: string[] = [];
        for (let p = 1; p <= pdf.numPages; p++) {
          const page = await pdf.getPage(p);
          const textContent = await page.getTextContent();
          const line = textContent.items
            .map((item) => ('str' in item ? item.str : ''))
            .join(' ');
          chunks.push(`--- Page ${p} ---\n${line}`);
        }
        const combined = chunks.join('\n\n');
        setExtractedText(combined || 'No selectable embedded text found on these pages.');
        setStatusMsg(`Extracted text from ${pdf.numPages} page(s)`);
        setProcessing(false);
        return;
      }

      const scale = toolId === 'pdf-to-image' ? 2.0 : compressQuality < 55 ? 1.15 : 1.45;
      const outImages: { pageNum: number; url: string }[] = [];
      const outPdf = await PDFDocument.create();

      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;

        if (toolId === 'pdf-to-image') {
          const blob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), 'image/png'));
          outImages.push({ pageNum: p, url: URL.createObjectURL(blob) });
        } else {
          const q = toolId === 'pdf-compress' ? compressQuality / 100 : 0.9;
          const jpgBlob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), 'image/jpeg', q));
          const embedded = await outPdf.embedJpg(await jpgBlob.arrayBuffer());
          const origVp = page.getViewport({ scale: 1 });
          const newPage = outPdf.addPage([origVp.width, origVp.height]);
          newPage.drawImage(embedded, { x: 0, y: 0, width: origVp.width, height: origVp.height });
        }
      }

      if (toolId === 'pdf-to-image') {
        setRenderedPages(outImages);
        setStatusMsg(`Converted ${outImages.length} page(s) to PNG`);
      } else {
        const outBytes = await outPdf.save();
        makePdfDownload(outBytes, `${toolId}-output.pdf`);
        setStatusMsg(
          toolId === 'pdf-compress'
            ? `Compressed from ${formatBytes(primary.file.size)} to ${formatBytes(outBytes.length)}`
            : `Unlocked & exported clean copy (${pdf.numPages} pages)`
        );
      }
    } catch {
      setErrorMsg('Failed to open PDF. If this PDF is password protected (e.g. Aadhaar), enter its password above.');
    } finally {
      setProcessing(false);
    }
  };

  // 6. PDF Signature Verifier
  const runSignatureVerify = async () => {
    const primary = pdfFiles[0];
    if (!primary) return;
    setProcessing(true);
    setErrorMsg('');
    try {
      const textDecoder = new TextDecoder('latin1');
      const rawText = textDecoder.decode(primary.bytes);
      const hasSig = /\/Type\s*\/Sig\b|\/FT\s*\/Sig\b/.test(rawText);
      const hasByteRange = /\/ByteRange\s*\[/.test(rawText);
      const sigMatches = rawText.match(/\/ByteRange\s*\[/g) || [];
      const signerNames = [...rawText.matchAll(/\/Name\s*\(([^)]+)\)/g)].map((m) => m[1]);

      const doc = await PDFDocument.load(primary.bytes, { ignoreEncryption: true });
      setSigReport({
        fileName: primary.file.name,
        pageCount: doc.getPageCount(),
        hasSignatureField: hasSig,
        hasByteRange,
        signatureCount: sigMatches.length,
        title: doc.getTitle() || '—',
        author: doc.getAuthor() || '—',
        creator: doc.getCreator() || '—',
        producer: doc.getProducer() || '—',
        creationDate: doc.getCreationDate()?.toLocaleString() || '—',
        signers: Array.from(new Set(signerNames)),
      });
      setStatusMsg('Inspection completed');
    } catch {
      setErrorMsg('Unable to parse PDF metadata.');
    } finally {
      setProcessing(false);
    }
  };

  const primaryPdf = pdfFiles[0] || null;

  return (
    <div className="space-y-6">
      {/* Upload Box */}
      <label className="block border-2 border-dashed border-violet-200 dark:border-violet-800 hover:border-violet-400 dark:hover:border-violet-600 bg-violet-50/40 dark:bg-violet-950/30 rounded-2xl p-8 text-center cursor-pointer transition-colors">
        <input
          type="file"
          accept={toolId === 'image-to-pdf' ? 'image/*' : 'application/pdf,.pdf'}
          multiple={toolId === 'pdf-merge' || toolId === 'image-to-pdf'}
          onChange={(e) => handleUpload(e.target.files)}
          className="hidden"
        />
        <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/60 text-violet-600 dark:text-violet-300 flex items-center justify-center mx-auto mb-3">
          <Upload className="w-6 h-6" />
        </div>
        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {toolId === 'image-to-pdf'
            ? 'Click to select or add images (JPG, PNG, WEBP)'
            : toolId === 'pdf-merge'
            ? 'Click to select multiple PDF files to combine'
            : primaryPdf
            ? `${primaryPdf.file.name} (${primaryPdf.pageCount} pages · ${formatBytes(primaryPdf.file.size)})`
            : 'Click to upload a PDF file'}
        </div>
      </label>

      {errorMsg && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Image to PDF queue */}
      {toolId === 'image-to-pdf' && imgFiles.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{imgFiles.length} Image(s) Queued</span>
            <div className="flex items-center gap-2">
              <select
                value={imagePageMode}
                onChange={(e) => setImagePageMode(e.target.value as 'a4' | 'fit')}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-xs font-semibold"
              >
                <option value="a4">Standard A4 Page</option>
                <option value="fit">Fit Page to Image Size</option>
              </select>
              <button
                type="button"
                onClick={runImageToPdf}
                disabled={processing}
                className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 cursor-pointer"
              >
                {processing ? 'Building PDF...' : 'Create PDF'}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {imgFiles.map((item, idx) => (
              <div
                key={idx}
                className="relative border border-slate-200 dark:border-slate-700 rounded-xl p-1.5 bg-slate-50 dark:bg-slate-800"
              >
                <img src={item.url} alt="" className="w-full h-24 object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => setImgFiles((prev) => prev.filter((_, i) => i !== idx))}
                  className="mt-1 w-full text-[11px] text-red-600 dark:text-red-400 font-semibold hover:underline cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Merge PDF queue */}
      {toolId === 'pdf-merge' && pdfFiles.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Files to Merge ({pdfFiles.length})
            </span>
            <button
              type="button"
              onClick={runMergePdf}
              disabled={processing}
              className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 cursor-pointer"
            >
              {processing ? 'Merging...' : 'Merge PDFs'}
            </button>
          </div>
          <div className="space-y-2">
            {pdfFiles.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.file.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    {item.pageCount} pages · {formatBytes(item.file.size)}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() =>
                      setPdfFiles((prev) => {
                        const copy = [...prev];
                        [copy[idx - 1], copy[idx]] = [copy[idx], copy[idx - 1]];
                        return copy;
                      })
                    }
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 disabled:opacity-40 cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === pdfFiles.length - 1}
                    onClick={() =>
                      setPdfFiles((prev) => {
                        const copy = [...prev];
                        [copy[idx + 1], copy[idx]] = [copy[idx], copy[idx + 1]];
                        return copy;
                      })
                    }
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 disabled:opacity-40 cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPdfFiles((prev) => prev.filter((_, i) => i !== idx))}
                    className="p-1.5 rounded-lg border border-red-200 dark:border-red-900 bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Single PDF Tools */}
      {primaryPdf && toolId !== 'pdf-merge' && toolId !== 'image-to-pdf' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-5">
          {(toolId === 'pdf-lock-unlock' ||
            toolId === 'pdf-compress' ||
            toolId === 'pdf-to-image' ||
            toolId === 'pdf-ocr') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  PDF Password (only if file is locked, e.g. Aadhaar PDF)
                </label>
                <input
                  type="password"
                  value={pdfPassword}
                  onChange={(e) => setPdfPassword(e.target.value)}
                  placeholder="Optional password..."
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
                />
              </div>

              {toolId === 'pdf-compress' && (
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <span>Compression Quality</span>
                    <span className="tabular-nums">{compressQuality}%</span>
                  </div>
                  <input
                    type="range"
                    min={25}
                    max={90}
                    value={compressQuality}
                    onChange={(e) => setCompressQuality(Number(e.target.value))}
                    className="w-full accent-violet-600"
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={runPdfJsPipeline}
                  disabled={processing}
                  className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold cursor-pointer"
                >
                  {processing
                    ? 'Processing PDF...'
                    : toolId === 'pdf-to-image'
                    ? 'Convert Pages to Images'
                    : toolId === 'pdf-ocr'
                    ? 'Extract Text from PDF'
                    : toolId === 'pdf-compress'
                    ? 'Compress PDF Now'
                    : 'Unlock & Export Clean PDF'}
                </button>
              </div>
            </div>
          )}

          {(toolId === 'pdf-numbering' || toolId === 'pdf-watermark') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              {toolId === 'pdf-numbering' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Page Number Position
                  </label>
                  <select
                    value={numberPosition}
                    onChange={(e) => setNumberPosition(e.target.value as typeof numberPosition)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
                  >
                    <option value="bottom-center">Bottom Center</option>
                    <option value="bottom-right">Bottom Right</option>
                    <option value="top-right">Top Right</option>
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Watermark Text
                    </label>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      <span>Opacity</span>
                      <span className="tabular-nums">{watermarkOpacity}%</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={75}
                      value={watermarkOpacity}
                      onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                      className="w-full accent-violet-600"
                    />
                  </div>
                </>
              )}

              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={runNumberOrWatermark}
                  disabled={processing}
                  className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold cursor-pointer"
                >
                  {processing ? 'Applying...' : toolId === 'pdf-numbering' ? 'Add Page Numbers' : 'Apply Watermark'}
                </button>
              </div>
            </div>
          )}

          {(toolId === 'pdf-rearrange' || toolId === 'pdf-remove-pages') && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {toolId === 'pdf-rearrange'
                    ? 'Move pages up/down or reverse page order:'
                    : 'Click pages below to mark them for removal:'}
                </span>
                {toolId === 'pdf-rearrange' && (
                  <button
                    type="button"
                    onClick={() => setPageOrder((prev) => [...prev].reverse())}
                    className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Reverse All Pages
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {pageOrder.map((pageNum, idx) => {
                  const isRemoved = removedPages.has(pageNum);
                  return (
                    <div
                      key={`${pageNum}-${idx}`}
                      className={`p-3 rounded-xl border text-center ${
                        isRemoved
                          ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      <div className="text-xs font-bold mb-2">Page {pageNum}</div>
                      {toolId === 'pdf-rearrange' ? (
                        <div className="flex justify-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() =>
                              setPageOrder((prev) => {
                                const c = [...prev];
                                [c[idx - 1], c[idx]] = [c[idx], c[idx - 1]];
                                return c;
                              })
                            }
                            className="p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === pageOrder.length - 1}
                            onClick={() =>
                              setPageOrder((prev) => {
                                const c = [...prev];
                                [c[idx + 1], c[idx]] = [c[idx], c[idx + 1]];
                                return c;
                              })
                            }
                            className="p-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            setRemovedPages((prev) => {
                              const next = new Set(prev);
                              if (next.has(pageNum)) next.delete(pageNum);
                              else next.add(pageNum);
                              return next;
                            })
                          }
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                            isRemoved
                              ? 'bg-red-600 text-white'
                              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          {isRemoved ? 'Removed' : 'Keep'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={runReorderOrRemove}
                disabled={processing}
                className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold cursor-pointer"
              >
                {processing ? 'Building PDF...' : 'Export Updated PDF'}
              </button>
            </div>
          )}

          {toolId === 'pdf-signature-verify' && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={runSignatureVerify}
                disabled={processing}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                {processing ? 'Inspecting...' : 'Verify Digital Signature & Metadata'}
              </button>

              {sigReport && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold">
                    {sigReport.hasSignatureField && sigReport.hasByteRange ? (
                      <span className="text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Digital Signature Dictionary Found ({sigReport.signatureCount} signature block)
                      </span>
                    ) : (
                      <span className="text-amber-700 dark:text-amber-400 inline-flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        No Embedded Cryptographic Signature (/Sig /ByteRange) Found
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <div><span className="font-semibold">File:</span> {sigReport.fileName}</div>
                    <div><span className="font-semibold">Pages:</span> {sigReport.pageCount}</div>
                    <div><span className="font-semibold">Title:</span> {sigReport.title}</div>
                    <div><span className="font-semibold">Author:</span> {sigReport.author}</div>
                    <div><span className="font-semibold">Creator:</span> {sigReport.creator}</div>
                    <div><span className="font-semibold">Producer:</span> {sigReport.producer}</div>
                    <div className="sm:col-span-2"><span className="font-semibold">Created:</span> {sigReport.creationDate}</div>
                    {sigReport.signers.length > 0 && (
                      <div className="sm:col-span-2">
                        <span className="font-semibold">Signer Name(s):</span> {sigReport.signers.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Download Box */}
      {downloadUrl && (
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
          <div className="flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div>
              <div className="text-sm font-bold">{statusMsg || 'PDF Ready'}</div>
              <div className="text-xs text-emerald-700 dark:text-emerald-400 tabular-nums">
                {downloadName} · {formatBytes(downloadSize)}
              </div>
            </div>
          </div>
          <a
            href={downloadUrl}
            download={downloadName}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </a>
        </div>
      )}

      {/* Rendered PDF Pages (PDF to Image) */}
      {renderedPages.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Rendered Pages ({renderedPages.length})
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {renderedPages.map((pg) => (
              <div
                key={pg.pageNum}
                className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50 dark:bg-slate-800 space-y-2"
              >
                <img src={pg.url} alt={`Page ${pg.pageNum}`} className="w-full h-56 object-contain bg-white rounded-lg" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Page {pg.pageNum}</span>
                  <a
                    href={pg.url}
                    download={`page-${pg.pageNum}.png`}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700"
                  >
                    <Download className="w-3 h-3" />
                    PNG
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OCR Output */}
      {extractedText && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Extracted Text</span>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(extractedText)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy Text
            </button>
          </div>
          <textarea
            readOnly
            value={extractedText}
            rows={10}
            className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
          />
        </div>
      )}
    </div>
  );
};

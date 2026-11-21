import React, { useState } from 'react';
import { BookOpen, Upload, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { PDFDocument, rgb } from 'pdf-lib';
import type { AppLang } from '../../data/i18n';

interface PdfBookletImpositionProps {
  appLang: AppLang;
}

interface SheetSpread {
  sheetNo: number;
  side: 'Front' | 'Back';
  leftPage: number | null; // 1-based or null if blank pad
  rightPage: number | null;
}

function buildSaddleStitchSpreads(origCount: number): { paddedTotal: number; spreads: SheetSpread[] } {
  const paddedTotal = Math.max(4, Math.ceil(origCount / 4) * 4);
  const spreads: SheetSpread[] = [];
  const totalSheets = paddedTotal / 4;

  for (let s = 0; s < totalSheets; s++) {
    const frontLeft = paddedTotal - 2 * s;
    const frontRight = 1 + 2 * s;
    const backLeft = 2 + 2 * s;
    const backRight = paddedTotal - 1 - 2 * s;

    spreads.push({
      sheetNo: s + 1,
      side: 'Front',
      leftPage: frontLeft <= origCount ? frontLeft : null,
      rightPage: frontRight <= origCount ? frontRight : null,
    });
    spreads.push({
      sheetNo: s + 1,
      side: 'Back',
      leftPage: backLeft <= origCount ? backLeft : null,
      rightPage: backRight <= origCount ? backRight : null,
    });
  }
  return { paddedTotal, spreads };
}

export const PdfBookletImposition: React.FC<PdfBookletImpositionProps> = ({ appLang }) => {
  const isBn = appLang === 'bn';
  const [fileName, setFileName] = useState('');
  const [rawBytes, setRawBytes] = useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [drawFoldLine, setDrawFoldLine] = useState(true);
  const [marginPt, setMarginPt] = useState(14);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [bookletUrl, setBookletUrl] = useState<string | null>(null);

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    setErrorMsg('');
    setBookletUrl(null);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      setFileName(file.name);
      setRawBytes(bytes);
      setPageCount(doc.getPageCount());
    } catch {
      setErrorMsg('Could not read this PDF. If it is password-locked, unlock it first with Auto PDF Unlocker.');
    }
  };

  const imposition = pageCount > 0 ? buildSaddleStitchSpreads(pageCount) : null;

  const generateBookletPdf = async () => {
    if (!rawBytes || !imposition) return;
    setProcessing(true);
    setErrorMsg('');
    try {
      const srcDoc = await PDFDocument.load(rawBytes, { ignoreEncryption: true });
      const outDoc = await PDFDocument.create();
      const embeddedPages = await outDoc.embedPages(srcDoc.getPages());

      // Landscape A4 in points: 841.89 x 595.28
      const sheetW = 841.89;
      const sheetH = 595.28;
      const halfW = sheetW / 2;

      for (const spread of imposition.spreads) {
        const page = outDoc.addPage([sheetW, sheetH]);

        const drawSlot = (pageNum: number | null, slotIndex: 0 | 1) => {
          if (!pageNum) return;
          const emb = embeddedPages[pageNum - 1];
          const availW = halfW - marginPt * 2;
          const availH = sheetH - marginPt * 2;
          const scale = Math.min(availW / emb.width, availH / emb.height);
          const drawW = emb.width * scale;
          const drawH = emb.height * scale;
          const slotOriginX = slotIndex === 0 ? 0 : halfW;
          const x = slotOriginX + (halfW - drawW) / 2;
          const y = (sheetH - drawH) / 2;
          page.drawPage(emb, { x, y, width: drawW, height: drawH });
        };

        drawSlot(spread.leftPage, 0);
        drawSlot(spread.rightPage, 1);

        if (drawFoldLine) {
          page.drawLine({
            start: { x: halfW, y: 12 },
            end: { x: halfW, y: sheetH - 12 },
            thickness: 0.6,
            color: rgb(0.75, 0.78, 0.82),
            dashArray: [4, 4],
          });
        }
      }

      const outBytes = await outDoc.save();
      const blob = new Blob([new Uint8Array(outBytes)], { type: 'application/pdf' });
      setBookletUrl(URL.createObjectURL(blob));
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Booklet generation failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-950 text-white rounded-2xl p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" />
            <span>{isBn ? 'নোটস, বই বা প্রশ্নব্যাংক ভাঁজ করে ছোট বুকলেট প্রিন্ট করার অটো পেজ-অর্ডার (Saddle-Stitch)' : 'Automatic Saddle-Stitch Duplex Booklet Imposition · Landscape A4 2-Up'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-1">
            {isBn ? 'অটো PDF বুকলেট ও ডুপ্লেক্স প্রিন্ট মেকার' : 'PDF Booklet & Duplex Imposition Maker'}
          </h2>
        </div>

        <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer">
          <Upload className="w-4 h-4" />
          {isBn ? 'PDF ফাইল আপলোড করুন' : 'Upload Multi-Page PDF'}
          <input type="file" accept="application/pdf" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0])} />
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <strong>{isBn ? 'কিভাবে প্রিন্ট করবেন:' : 'How to Print:'}</strong>{' '}
            {isBn
              ? 'ডাউনলোড করা PDF-টি প্রিন্ট করার সময় Landscape + Flip on Short Edge (Duplex) সিলেক্ট করে প্রিন্ট করুন, তারপর মাঝখান থেকে ভাঁজ করে স্টেপল করলেই বই রেডি!'
              : 'Print the output PDF in Landscape mode with "Flip on Short Edge" (2-sided duplex). Fold the stack down the center and staple!'}
          </div>

          {fileName && (
            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs">
              <div className="font-bold text-indigo-950 truncate">{fileName}</div>
              <div className="text-indigo-700 font-mono mt-0.5">
                {pageCount} pages → {imposition?.paddedTotal} booklet slots ({(imposition?.paddedTotal || 0) / 4} physical A4 sheets)
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
            <input type="checkbox" checked={drawFoldLine} onChange={(e) => setDrawFoldLine(e.target.checked)} className="accent-indigo-600" />
            <span>{isBn ? 'মাঝখানে হালকা ডটেড ভাঁজ-দাগ (Fold Line) দিন' : 'Draw subtle center dashed fold guide'}</span>
          </label>

          <label className="block text-xs">
            <span className="font-bold text-slate-700">Page Margin ({marginPt} pt)</span>
            <input type="range" min={0} max={36} value={marginPt} onChange={(e) => setMarginPt(Number(e.target.value))} className="w-full accent-indigo-600 mt-1" />
          </label>

          <button
            type="button"
            disabled={!rawBytes || processing}
            onClick={generateBookletPdf}
            className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-sm cursor-pointer"
          >
            {processing ? 'Imposing Booklet Pages...' : isBn ? 'বুকলেট PDF তৈরি করুন' : 'Build Saddle-Stitch Booklet PDF'}
          </button>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {errorMsg}
            </div>
          )}

          {bookletUrl && (
            <a
              href={bookletUrl}
              download={`booklet_${fileName || 'output.pdf'}`}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs inline-flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <CheckCircle2 className="w-4 h-4" />
              {isBn ? 'রেডি বুকলেট PDF ডাউনলোড করুন' : 'Download Booklet PDF'}
            </a>
          )}
        </div>

        {/* Right Visual Imposition Order Map */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-3">
            {isBn ? 'ডুপ্লেক্স শিট পেজ সাজানোর ম্যাপ (Imposition Order)' : 'Physical Sheet Folding & Page Order Map'}
          </h3>
          {!imposition ? (
            <div className="h-64 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-400">
              {isBn ? 'যেকোনো মাল্টি-পেইজ PDF আপলোড করলে এখানে ফোল্ডিং ম্যাপ দেখাবে।' : 'Upload a PDF to inspect its saddle-stitch front/back page mapping.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
              {imposition.spreads.map((sp, i) => (
                <div key={i} className="p-3 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="text-[11px] font-bold text-slate-600 mb-2 flex justify-between">
                    <span>Sheet #{sp.sheetNo}</span>
                    <span className={sp.side === 'Front' ? 'text-indigo-700' : 'text-amber-700'}>{sp.side} Side</span>
                  </div>
                  <div className="grid grid-cols-2 border border-slate-400 rounded-lg overflow-hidden bg-white text-center font-mono">
                    <div className="py-5 border-r border-dashed border-slate-400">
                      <div className="text-[10px] text-slate-400">LEFT</div>
                      <div className="text-base font-black text-slate-900">{sp.leftPage ? `P.${sp.leftPage}` : 'Blank'}</div>
                    </div>
                    <div className="py-5">
                      <div className="text-[10px] text-slate-400">RIGHT</div>
                      <div className="text-base font-black text-slate-900">{sp.rightPage ? `P.${sp.rightPage}` : 'Blank'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

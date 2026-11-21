import React, { useState } from 'react';
import { Unlock, Upload, Download, Printer, KeyRound, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { AppLang } from '../../data/i18n';
import { printImageOnA4 } from '../../utils/printHelper';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface AutoPdfUnlockerProProps {
  appLang: AppLang;
}

export const AutoPdfUnlockerPro: React.FC<AutoPdfUnlockerProProps> = ({ appLang }) => {
  const isBn = appLang === 'bn';
  const [fileName, setFileName] = useState('');
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);

  // Empty-default smart formula helper inputs
  const [holderName, setHolderName] = useState('');
  const [dob, setDob] = useState(''); // YYYY-MM-DD
  const [manualPassword, setManualPassword] = useState('');

  const [working, setWorking] = useState(false);
  const [matchedPassword, setMatchedPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [unlockedPdfUrl, setUnlockedPdfUrl] = useState<string | null>(null);
  const [previewImages, setPreviewImages] = useState<string[]>([]);

  const handleFileUpload = async (file: File | undefined) => {
    if (!file) return;
    setErrorMsg('');
    setMatchedPassword('');
    setUnlockedPdfUrl(null);
    setPreviewImages([]);
    setFileName(file.name);
    const bytes = new Uint8Array(await file.arrayBuffer());
    setPdfBytes(bytes);
  };

  const buildCandidatePasswords = (): string[] => {
    const candidates: string[] = [];
    if (manualPassword.trim()) candidates.push(manualPassword.trim());

    const cleanLetters = holderName.replace(/[^a-zA-Z]/g, '');
    const first4Upper = cleanLetters.slice(0, 4).toUpperCase();
    const first4Lower = cleanLetters.slice(0, 4).toLowerCase();

    if (dob && /^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      const [yyyy, mm, dd] = dob.split('-');
      const yy = yyyy.slice(-2);
      // e-Aadhaar standard: FIRST4CAPS + YYYY
      if (first4Upper.length === 4) {
        candidates.push(`${first4Upper}${yyyy}`);
        candidates.push(`${first4Upper}${dd}${mm}`);
        candidates.push(`${first4Upper}${dd}${mm}${yyyy}`);
        candidates.push(`${first4Lower}${dd}${mm}`);
        candidates.push(`${first4Lower}${yyyy}`);
        candidates.push(`${first4Lower}${dd}${mm}${yy}`);
      }
      // e-PAN / Income Tax standard: DDMMYYYY
      candidates.push(`${dd}${mm}${yyyy}`);
      candidates.push(`${dd}${mm}${yy}`);
      candidates.push(`${yyyy}${mm}${dd}`);
      candidates.push(`${dd}-${mm}-${yyyy}`);
    }
    // Also try empty password (in case PDF only has print/owner restriction)
    candidates.push('');

    return Array.from(new Set(candidates));
  };

  const handleSmartUnlock = async () => {
    if (!pdfBytes) return;
    setWorking(true);
    setErrorMsg('');
    setMatchedPassword('');
    setUnlockedPdfUrl(null);
    setPreviewImages([]);

    const candidates = buildCandidatePasswords();
    let unlockedDoc: pdfjsLib.PDFDocumentProxy | null = null;
    let usedPassword = '';

    for (const pwd of candidates) {
      try {
        const task = pdfjsLib.getDocument({
          data: pdfBytes.slice(),
          password: pwd || undefined,
        });
        const doc = await task.promise;
        unlockedDoc = doc;
        usedPassword = pwd;
        break;
      } catch {
        // Try next candidate
      }
    }

    if (!unlockedDoc) {
      setWorking(false);
      setErrorMsg(
        isBn
          ? 'কোনো পাসওয়ার্ড ম্যাচ করেনি। অনুগ্রহ করে সঠিক নাম (ইংরেজি), জন্মতারিখ অথবা ম্যানুয়াল পাসওয়ার্ড দিয়ে আবার চেষ্টা করুন।'
          : 'None of the generated passwords matched this PDF. Please verify Name, DOB, or enter the exact manual password.'
      );
      return;
    }

    try {
      const outPdf = await PDFDocument.create();
      const pageImgs: string[] = [];

      for (let p = 1; p <= unlockedDoc.numPages; p++) {
        const page = await unlockedDoc.getPage(p);
        const viewport = page.getViewport({ scale: 2.2 });
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;

        const dataUrl = canvas.toDataURL('image/jpeg', 0.94);
        pageImgs.push(dataUrl);

        const imgBytes = await fetch(dataUrl).then((r) => r.arrayBuffer());
        const embedded = await outPdf.embedJpg(imgBytes);
        const origVp = page.getViewport({ scale: 1 });
        const pdfPage = outPdf.addPage([origVp.width, origVp.height]);
        pdfPage.drawImage(embedded, {
          x: 0,
          y: 0,
          width: origVp.width,
          height: origVp.height,
        });
      }

      const finalBytes = await outPdf.save();
      const blob = new Blob([new Uint8Array(finalBytes)], { type: 'application/pdf' });
      setUnlockedPdfUrl(URL.createObjectURL(blob));
      setPreviewImages(pageImgs);
      setMatchedPassword(usedPassword || '(No user password required)');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to rebuild unlocked PDF.');
    } finally {
      setWorking(false);
    }
  };

  const previewFormulaCount = buildCandidatePasswords().filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="bg-slate-950 text-white rounded-2xl p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
            <KeyRound className="w-4 h-4" />
            <span>{isBn ? 'ই-আধার, ই-প্যান ও ব্যাংক স্টেটমেন্ট অটো-পাসওয়ার্ড আনলকার' : 'Auto-Password Formula Engine · e-Aadhaar · e-PAN · Bank Statements'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-1">
            {isBn ? 'স্মার্ট PDF পাসওয়ার্ড আনলকার প্রো (Aadhaar / PAN / Bank)' : 'Smart e-Aadhaar / e-PAN / Bank PDF Unlocker Pro'}
          </h2>
        </div>

        <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer">
          <Upload className="w-4 h-4" />
          {isBn ? 'লকড PDF আপলোড করুন' : 'Upload Locked PDF'}
          <input type="file" accept="application/pdf" className="hidden" onChange={(e) => handleFileUpload(e.target.files?.[0])} />
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Auto-Formula Inputs */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
            <div className="font-bold text-slate-900 mb-1">
              {isBn ? 'কিভাবে অটো-পাসওয়ার্ড কাজ করে?' : 'Supported Indian Portal Formulas:'}
            </div>
            <ul className="space-y-0.5 text-[11px] text-slate-600">
              <li>· <strong>e-Aadhaar:</strong> First 4 letters CAPS + Birth Year (e.g. SUBH1998)</li>
              <li>· <strong>e-PAN / ITR:</strong> DDMMYYYY (e.g. 15081998)</li>
              <li>· <strong>HDFC / SBI / ICICI / Axis:</strong> First 4 letters + DDMM</li>
            </ul>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isBn ? 'কাস্টমারের নাম (ইংরেজিতে)' : 'Holder Name (English)'}
            </label>
            <input
              type="text"
              value={holderName}
              onChange={(e) => setHolderName(e.target.value)}
              placeholder="e.g. Subhajit Das"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isBn ? 'জন্মতারিখ (Date of Birth)' : 'Date of Birth'}
            </label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isBn ? 'অথবা সরাসরি পাসওয়ার্ড লিখুন (ঐচ্ছিক)' : 'Or Enter Exact Password Directly (Optional)'}
            </label>
            <input
              type="text"
              value={manualPassword}
              onChange={(e) => setManualPassword(e.target.value)}
              placeholder="Known PDF password (optional)"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <button
            type="button"
            disabled={!pdfBytes || working}
            onClick={handleSmartUnlock}
            className="w-full py-3.5 rounded-xl bg-slate-950 hover:bg-slate-800 disabled:opacity-50 text-amber-300 font-black text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            {working ? <Sparkles className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
            {working
              ? 'Testing formulas & unlocking...'
              : isBn
              ? `অটো আনলক করুন (${previewFormulaCount} ফর্মুলা)`
              : `Smart Unlock PDF (${previewFormulaCount} patterns)`}
          </button>

          {fileName && (
            <div className="text-xs text-slate-600 font-mono truncate">
              Loaded: <strong>{fileName}</strong>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {matchedPassword && unlockedPdfUrl && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Unlocked! Matched Pattern: <code className="font-mono bg-white px-1.5 py-0.5 rounded border">{matchedPassword}</code></span>
              </div>
              <a
                href={unlockedPdfUrl}
                download={`unlocked_${fileName || 'document.pdf'}`}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> Download Password-Free PDF
              </a>
            </div>
          )}
        </div>

        {/* Right Unlocked Pages Preview */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900">
              {isBn ? 'আনলকড পেজ প্রিভিউ ও ডিরেক্ট প্রিন্ট' : 'Unlocked Pages Preview & Direct Print'}
            </h3>
            {previewImages.length > 0 && (
              <span className="text-xs font-mono text-slate-500">{previewImages.length} page(s)</span>
            )}
          </div>

          {previewImages.length === 0 ? (
            <div className="h-80 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center p-6 text-center text-xs text-slate-400 gap-2">
              <Unlock className="w-9 h-9 text-slate-300" />
              <span>
                {isBn
                  ? 'লকড PDF আপলোড করে নাম ও জন্মতারিখ দিলে অটো আনলক হয়ে এখানে প্রিভিউ দেখাবে।'
                  : 'Upload a locked e-Aadhaar, e-PAN, or Bank PDF and click Smart Unlock.'}
              </span>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
              {previewImages.map((imgUrl, idx) => (
                <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                  <div className="px-3 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs font-bold">
                    <span>Page {idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => printImageOnA4(imgUrl, `${fileName} - Page ${idx + 1}`)}
                      className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print Page
                    </button>
                  </div>
                  <img src={imgUrl} alt={`Unlocked Page ${idx + 1}`} className="w-full h-auto" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

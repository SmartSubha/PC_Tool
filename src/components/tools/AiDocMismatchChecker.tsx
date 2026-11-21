import React, { useRef, useState } from 'react';
import {
  ShieldCheck,
  Upload,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Printer,
  Sparkles,
  FileWarning,
} from 'lucide-react';
import type { AppLang } from '../../data/i18n';
import { printElementHtml } from '../../utils/printHelper';

interface AiDocMismatchCheckerProps {
  appLang: AppLang;
}

interface UploadedDoc {
  id: string;
  label: string;
  previewUrl: string;
  mimeType: string;
  base64Data: string;
}

interface ExtractedDoc {
  docLabel: string;
  detectedType: string;
  fullName: string;
  guardianName: string;
  dob: string;
  gender: string;
  address: string;
  idNumber: string;
}

interface ComparisonRow {
  field: string;
  status: 'match' | 'mismatch' | 'warning' | 'not-comparable';
  summaryEn: string;
  summaryBn: string;
}

interface VerificationReport {
  riskLevel: 'clean' | 'minor-warning' | 'high-mismatch';
  overallVerdictEn: string;
  overallVerdictBn: string;
  extractedDocs: ExtractedDoc[];
  comparisons: ComparisonRow[];
  actionStepsBn: string[];
}

const DOC_LABEL_SUGGESTIONS = ['Aadhaar Card', 'PAN Card', 'Voter EPIC', 'Madhyamik Admit', 'Bank Passbook', 'Caste / Ration Card'];

async function compressImageToBase64(file: File): Promise<{ previewUrl: string; base64Data: string; mimeType: string }> {
  const objUrl = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = objUrl;
  });
  const maxDim = 1300;
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height, 1));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(objUrl);

  const dataUrl = canvas.toDataURL('image/jpeg', 0.86);
  return {
    previewUrl: dataUrl,
    base64Data: dataUrl.split(',')[1] || '',
    mimeType: 'image/jpeg',
  };
}

export const AiDocMismatchChecker: React.FC<AiDocMismatchCheckerProps> = ({ appLang }) => {
  const isBn = appLang === 'bn';
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [report, setReport] = useState<VerificationReport | null>(null);
  const reportRef = useRef<HTMLDivElement | null>(null);

  const handleUploadFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setErrorMsg('');
    const remaining = Math.max(0, 5 - docs.length);
    const slice = Array.from(fileList).slice(0, remaining);
    const added: UploadedDoc[] = [];

    for (let i = 0; i < slice.length; i++) {
      const f = slice[i];
      if (!f.type.startsWith('image/')) continue;
      const compressed = await compressImageToBase64(f);
      added.push({
        id: crypto.randomUUID(),
        label: DOC_LABEL_SUGGESTIONS[docs.length + i] || f.name.replace(/\.[^.]+$/, ''),
        previewUrl: compressed.previewUrl,
        mimeType: compressed.mimeType,
        base64Data: compressed.base64Data,
      });
    }
    setDocs((prev) => [...prev, ...added]);
    setReport(null);
  };

  const runVerification = async () => {
    if (docs.length < 2) {
      setErrorMsg(isBn ? 'অন্তত ২টি ডকুমেন্ট আপলোড করুন (যেমন: আধার + প্যান বা মাধ্যমিক অ্যাডমিট)।' : 'Please upload at least 2 documents to cross-check.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setReport(null);
    try {
      const res = await fetch('/api/ai/doc-mismatch-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documents: docs.map((d) => ({
            label: d.label,
            mimeType: d.mimeType,
            data: d.base64Data,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.report) {
        throw new Error(data?.error || 'Verification failed');
      }
      setReport(data.report);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not verify documents.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-950 text-white rounded-2xl p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>{isBn ? 'ফর্ম রিজেক্ট হওয়া আটকান · নাম, বাবার নাম, DOB ও ঠিকানা ক্রস-ভেরিফায়ার' : 'Stop Form Rejections · Multi-Document Name, Guardian & DOB Cross-Verifier'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-1">
            {isBn ? 'AI ডকুমেন্ট অটো-ভেরিফায়ার ও মিসম্যাচ চেকার' : 'AI Document Auto-Verifier & Mismatch Checker'}
          </h2>
        </div>

        <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs cursor-pointer">
          <Upload className="w-4 h-4" />
          {isBn ? `ডকুমেন্ট ছবি যোগ করুন (${docs.length}/5)` : `Add Document Images (${docs.length}/5)`}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleUploadFiles(e.target.files)}
          />
        </label>
      </div>

      {/* Uploaded Document Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-bold text-slate-900">
            {isBn ? 'আপলোড করা ডকুমেন্ট (২ থেকে ৫টি)' : 'Uploaded Documents for Cross-Comparison (2–5 images)'}
          </span>
          <button
            type="button"
            disabled={docs.length < 2 || loading}
            onClick={runVerification}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-xs inline-flex items-center gap-2 cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading
              ? isBn ? 'AI সব ডকুমেন্ট মিলিয়ে দেখছে...' : 'AI Cross-Checking Documents...'
              : isBn ? 'মিসম্যাচ চেক শুরু করুন' : 'Run AI Cross-Verification'}
          </button>
        </div>

        {docs.length === 0 ? (
          <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50">
            <FileWarning className="w-10 h-10 text-slate-400 mb-2" />
            <div className="font-bold text-slate-800 text-sm">
              {isBn ? 'আধার, প্যান, ভোটার, মাধ্যমিক অ্যাডমিট বা পাসবুকের ছবি একসাথে দিন' : 'Upload Aadhaar, PAN, Voter, Admit Card or Bank Passbook photos'}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isBn ? 'AI বানানের একটি অক্ষরের ভুল বা জন্মতারিখের অমিল সাথে সাথে ধরে দেবে।' : 'AI detects even single-letter spelling or DOB discrepancies before portal submission.'}
            </p>
            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleUploadFiles(e.target.files)} />
          </label>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {docs.map((d) => (
              <div key={d.id} className="border border-slate-200 rounded-xl p-2.5 bg-slate-50 space-y-2 relative">
                <img src={d.previewUrl} alt={d.label} className="w-full h-28 object-cover rounded-lg border border-slate-200 bg-white" />
                <input
                  type="text"
                  value={d.label}
                  onChange={(e) => setDocs((prev) => prev.map((x) => (x.id === d.id ? { ...x, label: e.target.value } : x)))}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-bold"
                />
                <button
                  type="button"
                  onClick={() => setDocs((prev) => prev.filter((x) => x.id !== d.id))}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-900/80 text-white hover:bg-rose-600 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Verification Report */}
      {report && (
        <div ref={reportRef} className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-6">
          <div
            className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 ${
              report.riskLevel === 'clean'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : report.riskLevel === 'minor-warning'
                ? 'bg-amber-50 border-amber-300 text-amber-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}
          >
            <div className="flex items-start gap-3">
              {report.riskLevel === 'clean' ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              ) : report.riskLevel === 'minor-warning' ? (
                <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-black text-base">{report.overallVerdictEn}</div>
                <div className="text-sm font-semibold mt-0.5">{report.overallVerdictBn}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => reportRef.current && printElementHtml(reportRef.current, 'Document Mismatch Verification Report')}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold inline-flex items-center gap-1.5 print:hidden cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print Report
            </button>
          </div>

          {/* Field-by-Field Comparison Verdict */}
          <div className="space-y-2.5">
            <h3 className="text-sm font-bold text-slate-900">
              {isBn ? 'ফিল্ড অনুযায়ী অমিল / ম্যাচ রিপোর্ট' : 'Field-by-Field Cross-Check Matrix'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {report.comparisons.map((cmp, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border ${
                    cmp.status === 'match'
                      ? 'bg-emerald-50/60 border-emerald-200'
                      : cmp.status === 'mismatch'
                      ? 'bg-rose-50/70 border-rose-300'
                      : 'bg-amber-50/60 border-amber-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{cmp.field}</span>
                    <span
                      className={`text-xs font-black uppercase ${
                        cmp.status === 'match'
                          ? 'text-emerald-700'
                          : cmp.status === 'mismatch'
                          ? 'text-rose-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {cmp.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 mt-1">{cmp.summaryEn}</p>
                  <p className="text-xs text-slate-600 mt-0.5 font-medium">{cmp.summaryBn}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Extracted Table */}
          <div className="overflow-x-auto">
            <h3 className="text-sm font-bold text-slate-900 mb-2">
              {isBn ? 'প্রতিটি ডকুমেন্ট থেকে পড়া তথ্য' : 'Extracted Data per Document'}
            </h3>
            <table className="w-full text-xs border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="p-2.5 text-left">Document</th>
                  <th className="p-2.5 text-left">Full Name</th>
                  <th className="p-2.5 text-left">Father / Guardian</th>
                  <th className="p-2.5 text-left">DOB</th>
                  <th className="p-2.5 text-left">ID / Roll</th>
                  <th className="p-2.5 text-left">Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {report.extractedDocs.map((ed, i) => (
                  <tr key={i} className="bg-white">
                    <td className="p-2.5 font-bold text-slate-900">
                      {ed.docLabel}
                      <div className="text-[10px] text-slate-500 font-normal">{ed.detectedType}</div>
                    </td>
                    <td className="p-2.5 font-semibold">{ed.fullName}</td>
                    <td className="p-2.5">{ed.guardianName}</td>
                    <td className="p-2.5 font-mono">{ed.dob}</td>
                    <td className="p-2.5 font-mono">{ed.idNumber}</td>
                    <td className="p-2.5 max-w-xs">{ed.address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {report.actionStepsBn.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs font-bold text-slate-900 mb-1.5">
                {isBn ? 'পরবর্তী করণীয় (কাউন্টার গাইড)' : 'Recommended Action Steps'}
              </div>
              <ul className="list-disc pl-5 space-y-1 text-xs text-slate-700">
                {report.actionStepsBn.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

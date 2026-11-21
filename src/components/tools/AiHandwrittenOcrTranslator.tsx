import React, { useRef, useState } from 'react';
import { ScanText, Upload, Loader2, Copy, Check, FileText, Printer, Sparkles } from 'lucide-react';
import type { AppLang } from '../../data/i18n';
import { printElementHtml } from '../../utils/printHelper';

interface AiHandwrittenOcrTranslatorProps {
  appLang: AppLang;
}

export const AiHandwrittenOcrTranslator: React.FC<AiHandwrittenOcrTranslatorProps> = ({ appLang }) => {
  const isBn = appLang === 'bn';
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState('');
  const [mode, setMode] = useState<'ocr' | 'ocr-to-bn' | 'ocr-to-en'>('ocr');
  const [docHint, setDocHint] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [detectedLang, setDetectedLang] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [keyDetails, setKeyDetails] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const printRef = useRef<HTMLDivElement | null>(null);

  const handleUpload = (file: File | undefined) => {
    if (!file) return;
    setErrorMsg('');
    const objUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const maxDim = 1500;
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height, 1));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objUrl);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      setPreviewUrl(dataUrl);
      setBase64Data(dataUrl.split(',')[1] || '');
    };
    img.src = objUrl;
  };

  const runOcr = async () => {
    if (!base64Data) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/ai/ocr-translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mimeType: 'image/jpeg',
          data: base64Data,
          mode,
          docHint,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.result) {
        throw new Error(data?.error || 'OCR failed');
      }
      setDetectedLang(data.result.detectedLanguage || '');
      setExtractedText(data.result.extractedText || '');
      setTranslatedText(data.result.translatedText || '');
      setKeyDetails(Array.isArray(data.result.keyDetails) ? data.result.keyDetails : []);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'OCR request failed');
    } finally {
      setLoading(false);
    }
  };

  const activeText = translatedText.trim() || extractedText;

  const handleCopy = async () => {
    if (!activeText.trim()) return;
    await navigator.clipboard.writeText(activeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDownloadDoc = () => {
    if (!activeText.trim()) return;
    const escaped = activeText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:'Noto Sans Bengali',Arial,sans-serif;font-size:12.5pt;line-height:1.8;padding:24px;}</style></head><body>${escaped}</body></html>`;
    const blob = new Blob([html], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'digitized-document.doc';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-950 text-white rounded-2xl p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
            <ScanText className="w-4 h-4" />
            <span>{isBn ? 'হাতে লেখা বাংলা/ইংরেজি নোট, পুরোনো দলিল, খতিয়ান ও প্রেসক্রিপশন ডিজিটাইজার' : 'Handwritten Bengali/English Notes · Old Deeds · Prescriptions → Editable Text'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-1">
            {isBn ? 'হাতে লেখা নোট ও পুরোনো দলিল OCR + অনুবাদক (AI)' : 'AI Handwritten Note & Old Deed OCR + Translator'}
          </h2>
        </div>

        <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer">
          <Upload className="w-4 h-4" />
          {isBn ? 'ছবি আপলোড করুন' : 'Upload Note / Deed Photo'}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0])} />
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Image + Mode */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'ocr', label: isBn ? 'মূল ভাষা OCR' : 'Exact OCR' },
              { id: 'ocr-to-bn', label: isBn ? 'OCR → বাংলা' : 'OCR → বাংলা' },
              { id: 'ocr-to-en', label: 'OCR → English' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id as typeof mode)}
                className={`py-2 px-2 rounded-xl text-xs font-bold border cursor-pointer ${
                  mode === m.id ? 'bg-slate-900 text-amber-300 border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={docHint}
            onChange={(e) => setDocHint(e.target.value)}
            placeholder={isBn ? 'ডকুমেন্টের ধরন (যেমন: জমির দলিল / ডাক্তারের প্রেসক্রিপশন / দরখাস্ত)' : 'Optional context (e.g. Old Land Deed / Handwritten Letter)'}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
          />

          {previewUrl ? (
            <img src={previewUrl} alt="Uploaded note" className="w-full max-h-80 object-contain rounded-xl border border-slate-200 bg-slate-50" />
          ) : (
            <label className="h-64 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center p-6 text-center text-xs text-slate-500 cursor-pointer">
              <Upload className="w-8 h-8 text-slate-400 mb-2" />
              <span>{isBn ? 'হাতে লেখা কাগজ বা পুরোনো দলিলের পরিষ্কার ছবি দিন' : 'Upload a clear photo of handwritten notes, old deeds, or printed Bengali pages'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0])} />
            </label>
          )}

          <button
            type="button"
            disabled={!base64Data || loading}
            onClick={runOcr}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? (isBn ? 'AI লেখা পড়ছে...' : 'Extracting Text with AI...') : isBn ? 'ডিজিটাল টেক্সট তৈরি করুন' : 'Extract Editable Text'}
          </button>

          {errorMsg && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">{errorMsg}</div>}
        </div>

        {/* Right Editable Result */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isBn ? 'এডিটেবল ডিজিটাল টেক্সট' : 'Extracted Editable Document'}
              </h3>
              {detectedLang && <span className="text-xs text-slate-500">Detected: {detectedLang}</span>}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button type="button" onClick={handleCopy} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer">
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button type="button" onClick={handleDownloadDoc} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer">
                <FileText className="w-3.5 h-3.5" /> Word .DOC
              </button>
              <button
                type="button"
                disabled={!activeText.trim()}
                onClick={() => printRef.current && printElementHtml(printRef.current, 'Digitized Document')}
                className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-bold inline-flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <Printer className="w-3.5 h-3.5" /> Print A4
              </button>
            </div>
          </div>

          <textarea
            rows={10}
            value={extractedText}
            onChange={(e) => setExtractedText(e.target.value)}
            placeholder={isBn ? 'এখানে ছবি থেকে পাওয়া মূল লেখা দেখাবে (সরাসরি এডিট করতে পারবেন)...' : 'Transcribed text will appear here (fully editable)...'}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-3 text-sm leading-relaxed text-slate-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {mode !== 'ocr' && (
            <div>
              <label className="block text-xs font-bold text-indigo-700 mb-1">
                {mode === 'ocr-to-bn' ? 'বাংলা অনুবাদ (Bengali Translation)' : 'English Translation'}
              </label>
              <textarea
                rows={7}
                value={translatedText}
                onChange={(e) => setTranslatedText(e.target.value)}
                className="w-full rounded-xl border-2 border-indigo-200 bg-indigo-50/30 px-3.5 py-3 text-sm leading-relaxed text-slate-950 focus:bg-white"
              />
            </div>
          )}

          {keyDetails.length > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs font-bold text-slate-800 mb-1.5">Key Names / Dates / Plot Numbers Found:</div>
              <ul className="list-disc pl-5 text-xs text-slate-700 space-y-0.5">
                {keyDetails.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Hidden Print Block */}
      <div className="hidden">
        <div ref={printRef} className="p-8 bg-white text-slate-950 font-sans">
          <div className="whitespace-pre-wrap text-[14px] leading-[1.85]">{activeText}</div>
        </div>
      </div>
    </div>
  );
};

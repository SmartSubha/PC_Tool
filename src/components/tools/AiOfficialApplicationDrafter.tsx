import React, { useRef, useState } from 'react';
import { FilePenLine, Sparkles, Loader2, Printer, FileText, RotateCcw } from 'lucide-react';
import type { AppLang } from '../../data/i18n';
import { printElementHtml } from '../../utils/printHelper';

interface AiOfficialApplicationDrafterProps {
  appLang: AppLang;
}

interface DraftResult {
  heading: string;
  recipientLines: string[];
  subject: string;
  salutation: string;
  bodyParagraphs: string[];
  closingText: string;
  signatureTitle: string;
  enclosures: string[];
}

const QUICK_TOPICS = [
  'Bank Account KYC Update & Mobile Number Link Application',
  'Name Spelling Mistake Correction Affidavit (One and Same Person)',
  'School / College Leave or Transfer Certificate Application',
  'Gram Panchayat / BDO Residential & Income Certificate Request',
  'Police Station General Diary (GD) for Lost Document / Mobile',
  'Ration Card / Aadhaar Correction & Family Head Transfer Request',
];

export const AiOfficialApplicationDrafter: React.FC<AiOfficialApplicationDrafterProps> = ({ appLang }) => {
  const isBn = appLang === 'bn';
  const [language, setLanguage] = useState<'bn' | 'en'>(isBn ? 'bn' : 'en');
  const [tone, setTone] = useState<'application' | 'affidavit'>('application');

  // Empty-default inputs
  const [topic, setTopic] = useState('');
  const [recipient, setRecipient] = useState('');
  const [applicantName, setApplicantName] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [details, setDetails] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [draft, setDraft] = useState<DraftResult | null>(null);
  const [editableBody, setEditableBody] = useState('');

  const printRef = useRef<HTMLDivElement | null>(null);

  const generateDraft = async () => {
    if (!topic.trim()) {
      setErrorMsg(isBn ? 'আবেদনপত্রের বিষয় লিখুন বা কুইক অপশন বেছে নিন।' : 'Please enter the application topic or choose a quick preset.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/ai/draft-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          language,
          tone,
          applicantName,
          guardianName,
          address,
          phone,
          recipient,
          details,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.draft) {
        throw new Error(data?.error || 'Draft generation failed');
      }
      setDraft(data.draft);
      setEditableBody((data.draft.bodyParagraphs || []).join('\n\n'));
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not draft document');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadWord = () => {
    if (!printRef.current) return;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:'Noto Sans Bengali',Arial,sans-serif;font-size:12.5pt;line-height:1.75;padding:30px;color:#0f172a;}</style></head><body>${printRef.current.innerHTML}</body></html>`;
    const blob = new Blob([html], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `official-${tone}-${language}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-950 text-white rounded-2xl p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
            <FilePenLine className="w-4 h-4" />
            <span>{isBn ? 'ব্যাংক, থানা, স্কুল, পঞ্চায়েত ও কোর্ট এফিডেভিট — ১ ক্লিকে সরকারি ফরম্যাট' : 'Bank, Police GD, School, BDO & Legal Affidavits in Official WB Format'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-1">
            {isBn ? 'স্মার্ট বাংলা ও ইংরেজি অফিসিয়াল অ্যাপ্লিকেশন / এফিডেভিট ড্রাফ্টার (AI)' : 'AI Official Bengali & English Application / Affidavit Drafter'}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex p-1 bg-slate-900 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setLanguage('bn')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                language === 'bn' ? 'bg-amber-400 text-slate-950' : 'text-slate-300'
              }`}
            >
              বাংলা
            </button>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                language === 'en' ? 'bg-amber-400 text-slate-950' : 'text-slate-300'
              }`}
            >
              English
            </button>
          </div>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value as 'application' | 'affidavit')}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white"
          >
            <option value="application">Formal Application</option>
            <option value="affidavit">Self-Declaration / Affidavit</option>
          </select>
        </div>
      </div>

      {/* Quick Topic Chips */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="text-xs font-bold text-slate-600 mb-2">
          {isBn ? 'জনপ্রিয় আবেদনপত্র (১ ক্লিকে বিষয় বেছে নিন)' : 'Quick Official Scenarios'}
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_TOPICS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTopic(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                topic === t
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-indigo-400'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isBn ? 'আবেদনের বিষয় *' : 'Application Topic / Subject *'}
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={isBn ? 'যেমন: ব্যাংক অ্যাকাউন্টে মোবাইল নম্বর লিংক করার আবেদন' : 'e.g. Application for Bank KYC Update'}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold"
            />
          </div>

          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder={isBn ? 'কাকে পাঠাচ্ছেন (যেমন: The Branch Manager, SBI ...)' : 'Recipient / Authority (optional)'}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
          />

          <div className="grid grid-cols-2 gap-2.5">
            <input
              type="text"
              value={applicantName}
              onChange={(e) => setApplicantName(e.target.value)}
              placeholder={isBn ? 'আবেদনকারীর নাম' : 'Applicant Name'}
              className="rounded-xl border border-slate-300 px-3 py-2 text-xs"
            />
            <input
              type="text"
              value={guardianName}
              onChange={(e) => setGuardianName(e.target.value)}
              placeholder={isBn ? 'পিতা / স্বামীর নাম' : 'Father / Spouse Name'}
              className="rounded-xl border border-slate-300 px-3 py-2 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={isBn ? 'ঠিকানা' : 'Address'}
              className="rounded-xl border border-slate-300 px-3 py-2 text-xs"
            />
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={isBn ? 'মোবাইল / অ্যাকাউন্ট নং' : 'Mobile / Ref No'}
              className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono"
            />
          </div>

          <textarea
            rows={4}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder={isBn ? 'অতিরিক্ত বিবরণ (যেমন: আগে নামের বানান ভুল ছিল, সঠিক বানান..., অ্যাকাউন্ট নম্বর...)' : 'Any specific details, dates, account/ID numbers, or reason...'}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setTopic(''); setRecipient(''); setApplicantName(''); setGuardianName(''); setAddress(''); setPhone(''); setDetails(''); setDraft(null); setEditableBody('');
              }}
              className="px-3.5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={generateDraft}
              className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {loading ? (isBn ? 'AI ড্রাফট লিখছে...' : 'Drafting Official Document...') : isBn ? 'অফিসিয়াল ড্রাফট তৈরি করুন' : 'Generate Official Draft'}
            </button>
          </div>

          {errorMsg && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">{errorMsg}</div>}
        </div>

        {/* Right Live Editable A4 Letter Preview */}
        <div className="lg:col-span-7 space-y-3">
          {draft && (
            <div className="flex flex-wrap items-center justify-between gap-2 bg-white rounded-xl border border-slate-200 px-4 py-2.5">
              <span className="text-xs font-bold text-slate-700">
                {isBn ? 'প্রিন্টের আগে নিচের বডি টেক্সট চাইলে এডিট করতে পারবেন' : 'A4 Official Layout Ready (Edit body text below if needed)'}
              </span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={handleDownloadWord} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer">
                  <FileText className="w-3.5 h-3.5" /> Word .DOC
                </button>
                <button
                  type="button"
                  onClick={() => printRef.current && printElementHtml(printRef.current, draft.subject || 'Official Application')}
                  className="px-4 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-black inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Print A4 Preview
                </button>
              </div>
            </div>
          )}

          {draft ? (
            <>
              <div
                ref={printRef}
                className="bg-white border border-slate-300 rounded-xl p-8 sm:p-10 shadow-md text-slate-950 font-sans space-y-5 text-[14px] leading-[1.8]"
              >
                <div className="text-center border-b-2 border-slate-900 pb-2">
                  <h1 className="text-lg font-black uppercase tracking-wide">{draft.heading}</h1>
                </div>

                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-0.5 font-semibold">
                    {draft.recipientLines.map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </div>
                  <div className="text-xs font-semibold shrink-0">
                    {language === 'bn' ? 'তারিখ:' : 'Date:'} {new Date().toLocaleDateString('en-IN')}
                  </div>
                </div>

                <div className="font-bold underline underline-offset-4">
                  {language === 'bn' ? 'বিষয়: ' : 'Subject: '}
                  {draft.subject}
                </div>

                <div className="font-semibold">{draft.salutation}</div>

                <div className="whitespace-pre-wrap text-justify">{editableBody}</div>

                {draft.enclosures.length > 0 && (
                  <div className="pt-2">
                    <div className="font-bold text-xs uppercase mb-1">
                      {language === 'bn' ? 'সংযুক্ত নথিপত্র (Enclosures):' : 'Enclosures:'}
                    </div>
                    <ol className="list-decimal pl-5 text-xs space-y-0.5">
                      {draft.enclosures.map((enc, idx) => (
                        <li key={idx}>{enc}</li>
                      ))}
                    </ol>
                  </div>
                )}

                <div className="pt-8 flex justify-between items-end gap-6">
                  <div className="text-xs space-y-0.5 text-slate-700">
                    {address && <div>{language === 'bn' ? 'স্থান:' : 'Place:'} {address}</div>}
                    {phone && <div>{language === 'bn' ? 'মোবাইল:' : 'Mob:'} {phone}</div>}
                  </div>
                  <div className="text-center min-w-[200px]">
                    <div className="text-xs mb-8">{draft.closingText}</div>
                    <div className="border-t border-slate-900 pt-1 text-xs font-bold">
                      {applicantName.trim() || draft.signatureTitle}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-3">
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  {isBn ? 'মূল অংশ এডিট করুন (সরাসরি প্রিভিউতে আপডেট হবে)' : 'Quick Edit Body Paragraphs'}
                </label>
                <textarea
                  rows={5}
                  value={editableBody}
                  onChange={(e) => setEditableBody(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs leading-relaxed"
                />
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-14 text-center text-xs text-slate-400">
              <FilePenLine className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              {isBn
                ? 'বাম দিকে আবেদনের বিষয় লিখে "অফিসিয়াল ড্রাফট তৈরি করুন" বাটনে ক্লিক করুন।'
                : 'Choose a scenario or enter your topic on the left to generate a print-ready official A4 application.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

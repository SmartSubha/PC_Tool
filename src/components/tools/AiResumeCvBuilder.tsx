import React, { useRef, useState } from 'react';
import {
  FileUser,
  Sparkles,
  Loader2,
  Printer,
  FileText,
  Upload,
  RotateCcw,
} from 'lucide-react';
import type { AppLang } from '../../data/i18n';
import { printElementHtml } from '../../utils/printHelper';

interface AiResumeCvBuilderProps {
  appLang: AppLang;
}

type CvTemplate = 'executive-slate' | 'modern-split' | 'fresher-clean';

export const AiResumeCvBuilder: React.FC<AiResumeCvBuilderProps> = ({ appLang }) => {
  const isBn = appLang === 'bn';
  const [template, setTemplate] = useState<CvTemplate>('executive-slate');

  // Empty-default candidate fields
  const [fullName, setFullName] = useState('');
  const [headline, setHeadline] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [dob, setDob] = useState('');
  const [languages, setLanguages] = useState('');
  const [summary, setSummary] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [educationText, setEducationText] = useState('');
  const [experienceText, setExperienceText] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  // AI Quick Convert from Bengali / Rough notes
  const [rawNotes, setRawNotes] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const printRef = useRef<HTMLDivElement | null>(null);

  const handleAiConvert = async () => {
    if (!rawNotes.trim()) {
      setAiError(isBn ? 'বাংলা বা ইংরেজিতে আপনার পড়াশোনা, স্কিল ও অভিজ্ঞতা সংক্ষেপে লিখুন।' : 'Please enter rough education/skills/experience notes first.');
      return;
    }
    setAiLoading(true);
    setAiError('');
    try {
      const res = await fetch('/api/ai/resume-enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawNotes, targetRole: headline, fullName }),
      });
      const data = await res.json();
      if (!res.ok || !data?.resume) {
        throw new Error(data?.error || 'Could not enhance resume');
      }
      const r = data.resume;
      if (r.headline) setHeadline(r.headline);
      if (r.summary) setSummary(r.summary);
      if (Array.isArray(r.skills) && r.skills.length) setSkillsText(r.skills.join(', '));
      if (Array.isArray(r.educationBullets) && r.educationBullets.length) setEducationText(r.educationBullets.join('\n'));
      if (Array.isArray(r.experienceBullets) && r.experienceBullets.length) setExperienceText(r.experienceBullets.join('\n'));
      if (r.languages) setLanguages(r.languages);
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : 'AI resume builder failed');
    } finally {
      setAiLoading(false);
    }
  };

  const skillsList = skillsText
    .split(/,|\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const educationLines = educationText
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const experienceLines = experienceText
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const handleDownloadDoc = () => {
    if (!printRef.current) return;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;font-size:11pt;color:#0f172a;padding:24px;}</style></head><body>${printRef.current.innerHTML}</body></html>`;
    const blob = new Blob([html], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(fullName || 'resume').replace(/\s+/g, '_')}_CV.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFullName('');
    setHeadline('');
    setPhone('');
    setEmail('');
    setAddress('');
    setDob('');
    setLanguages('');
    setSummary('');
    setSkillsText('');
    setEducationText('');
    setExperienceText('');
    setRawNotes('');
    setPhotoUrl(null);
    setAiError('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-950 text-white rounded-2xl p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
            <FileUser className="w-4 h-4" />
            <span>{isBn ? 'বাংলা নোটস থেকে ১ ক্লিকে প্রফেশনাল ইংরেজি ATS রেজুমে / CV' : '1-Click Bengali-to-English ATS Resume · 3 Executive A4 Layouts'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-1">
            {isBn ? 'AI রেজুমে ও প্রফেশনাল CV বিল্ডার (ATS Friendly)' : 'AI Resume & Professional CV Builder'}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          <button
            type="button"
            onClick={handleDownloadDoc}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-4 h-4" /> Word .DOC
          </button>
          <button
            type="button"
            onClick={() => printRef.current && printElementHtml(printRef.current, `${fullName || 'Professional'} Resume`)}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print A4 CV
          </button>
        </div>
      </div>

      {/* AI Magic Box: Bengali/Rough Notes -> ATS English CV */}
      <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            {isBn
              ? 'AI স্মার্ট CV কনভার্টার — বাংলা বা সংক্ষিপ্ত ইংরেজিতে লিখুন, AI প্রফেশনাল CV বানিয়ে দেবে'
              : 'AI Smart CV Writer — Type rough Bengali or English notes to auto-fill ATS English Resume'}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <textarea
            rows={2}
            value={rawNotes}
            onChange={(e) => setRawNotes(e.target.value)}
            placeholder={
              isBn
                ? 'যেমন: আমি বি.কম পাস করেছি ২০২৪ সালে কলকাতা বিশ্ববিদ্যালয় থেকে, ট্যালি প্রাইম, এমএস এক্সেল ও বাংলা টাইপিং জানি, ১ বছর অফিসে ডেটা এন্ট্রি করেছি...'
                : 'e.g. B.Com graduate 2024, skilled in Tally Prime, MS Excel, Computer Operator, 1 year shop billing experience...'
            }
            className="flex-1 rounded-xl border border-indigo-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="button"
            disabled={aiLoading}
            onClick={handleAiConvert}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-xs inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {aiLoading ? 'Generating CV...' : isBn ? 'AI দিয়ে CV সাজান' : 'Build ATS CV'}
          </button>
        </div>
        {aiError && <p className="text-xs font-bold text-rose-600">{aiError}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Editor */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'executive-slate', label: 'Executive' },
              { id: 'modern-split', label: 'Two-Column' },
              { id: 'fresher-clean', label: 'Fresher ATS' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTemplate(t.id as CvTemplate)}
                className={`py-2 rounded-lg text-xs font-bold border cursor-pointer ${
                  template === t.id ? 'bg-slate-900 text-amber-300 border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name" className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold" />
            <input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Target Job Title" className="rounded-xl border border-slate-300 px-3 py-2 text-xs" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Mobile Number" className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" className="rounded-xl border border-slate-300 px-3 py-2 text-xs" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="City / Full Address" className="rounded-xl border border-slate-300 px-3 py-2 text-xs" />
            <input value={dob} onChange={(e) => setDob(e.target.value)} placeholder="DOB (e.g. 15 Aug 2001)" className="rounded-xl border border-slate-300 px-3 py-2 text-xs" />
          </div>

          <div className="flex items-center gap-2">
            <label className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> {photoUrl ? 'Change Photo' : 'Attach Passport Photo'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setPhotoUrl(URL.createObjectURL(f)); }} />
            </label>
            {photoUrl && (
              <button type="button" onClick={() => setPhotoUrl(null)} className="text-xs text-rose-600 font-bold cursor-pointer">Remove</button>
            )}
          </div>

          <textarea rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Career Objective / Professional Summary" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs" />
          <textarea rows={2} value={skillsText} onChange={(e) => setSkillsText(e.target.value)} placeholder="Key Skills (comma separated: MS Excel, Tally Prime, Data Entry...)" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs" />
          <textarea rows={3} value={educationText} onChange={(e) => setEducationText(e.target.value)} placeholder="Education (one degree per line)" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs" />
          <textarea rows={4} value={experienceText} onChange={(e) => setExperienceText(e.target.value)} placeholder="Work Experience / Projects (one bullet per line)" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs" />
          <input value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="Languages Known (e.g. Bengali, English, Hindi)" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs" />
        </div>

        {/* Right Live A4 Resume Sheet */}
        <div className="lg:col-span-7">
          <div
            ref={printRef}
            className="bg-white border border-slate-300 rounded-xl shadow-lg overflow-hidden text-slate-900 font-sans min-h-[720px]"
          >
            {template === 'modern-split' ? (
              <div className="grid grid-cols-12 min-h-[720px]">
                <div className="col-span-4 bg-slate-900 text-white p-6 space-y-5">
                  {photoUrl && (
                    <img src={photoUrl} alt="Candidate" className="w-24 h-28 object-cover rounded-lg border-2 border-amber-400 mx-auto" />
                  )}
                  <div>
                    <h1 className="text-xl font-black leading-tight">{fullName || 'YOUR FULL NAME'}</h1>
                    {headline && <div className="text-xs text-amber-300 font-semibold mt-1">{headline}</div>}
                  </div>
                  <div className="text-[11px] space-y-1.5 text-slate-300 border-t border-slate-700 pt-3">
                    {phone && <div>Ph: {phone}</div>}
                    {email && <div className="break-all">{email}</div>}
                    {address && <div>{address}</div>}
                    {dob && <div>DOB: {dob}</div>}
                  </div>
                  {skillsList.length > 0 && (
                    <div className="border-t border-slate-700 pt-3">
                      <div className="text-[11px] font-black tracking-wider uppercase text-amber-300 mb-2">Skills</div>
                      <ul className="space-y-1 text-xs text-slate-200">
                        {skillsList.map((s, i) => <li key={i}>• {s}</li>)}
                      </ul>
                    </div>
                  )}
                  {languages && (
                    <div className="border-t border-slate-700 pt-3">
                      <div className="text-[11px] font-black tracking-wider uppercase text-amber-300 mb-1">Languages</div>
                      <div className="text-xs text-slate-200">{languages}</div>
                    </div>
                  )}
                </div>

                <div className="col-span-8 p-7 space-y-5">
                  {summary && (
                    <div>
                      <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-1 mb-2">Professional Summary</h2>
                      <p className="text-xs leading-relaxed text-slate-700">{summary}</p>
                    </div>
                  )}
                  {experienceLines.length > 0 && (
                    <div>
                      <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-1 mb-2">Experience & Projects</h2>
                      <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-800 leading-relaxed">
                        {experienceLines.map((l, i) => <li key={i}>{l}</li>)}
                      </ul>
                    </div>
                  )}
                  {educationLines.length > 0 && (
                    <div>
                      <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b-2 border-slate-900 pb-1 mb-2">Education</h2>
                      <ul className="list-disc pl-4 space-y-1.5 text-xs text-slate-800">
                        {educationLines.map((l, i) => <li key={i}>{l}</li>)}
                      </ul>
                    </div>
                  )}
                  <div className="pt-8 text-xs text-slate-600 flex justify-between items-end">
                    <span>Date: {new Date().toLocaleDateString('en-IN')}</span>
                    <span className="border-t border-slate-800 pt-1 px-4 font-bold text-slate-900">Signature</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 space-y-5">
                {/* Header */}
                <div
                  className={`flex items-start justify-between gap-4 pb-4 ${
                    template === 'executive-slate'
                      ? 'bg-slate-900 text-white -m-8 mb-4 p-7'
                      : 'border-b-2 border-slate-900'
                  }`}
                >
                  <div>
                    <h1 className="text-2xl font-black tracking-tight">{fullName || 'CANDIDATE FULL NAME'}</h1>
                    {headline && (
                      <div className={`text-sm font-bold mt-0.5 ${template === 'executive-slate' ? 'text-amber-300' : 'text-indigo-700'}`}>
                        {headline}
                      </div>
                    )}
                    <div className={`mt-2 text-xs flex flex-wrap gap-x-3 gap-y-1 ${template === 'executive-slate' ? 'text-slate-300' : 'text-slate-600'}`}>
                      {phone && <span>{phone}</span>}
                      {email && <span>· {email}</span>}
                      {address && <span>· {address}</span>}
                      {dob && <span>· DOB: {dob}</span>}
                    </div>
                  </div>
                  {photoUrl && (
                    <img src={photoUrl} alt="Candidate" className="w-20 h-24 object-cover rounded border border-slate-400 shrink-0 bg-white" />
                  )}
                </div>

                {summary && (
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-1.5">Career Summary</h2>
                    <p className="text-xs leading-relaxed text-slate-800">{summary}</p>
                  </div>
                )}

                {educationLines.length > 0 && (
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-1.5">Academic Qualification</h2>
                    <ul className="list-disc pl-5 space-y-1 text-xs text-slate-800">
                      {educationLines.map((l, i) => <li key={i}>{l}</li>)}
                    </ul>
                  </div>
                )}

                {experienceLines.length > 0 && (
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-1.5">Experience & Highlights</h2>
                    <ul className="list-disc pl-5 space-y-1 text-xs text-slate-800 leading-relaxed">
                      {experienceLines.map((l, i) => <li key={i}>{l}</li>)}
                    </ul>
                  </div>
                )}

                {skillsList.length > 0 && (
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-1.5">Technical & Core Skills</h2>
                    <p className="text-xs text-slate-800 leading-relaxed">{skillsList.join(' · ')}</p>
                  </div>
                )}

                {languages && (
                  <div>
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-1.5">Languages</h2>
                    <p className="text-xs text-slate-800">{languages}</p>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-200 text-xs text-slate-700 space-y-6">
                  <p className="italic text-[11px]">
                    I hereby declare that all the information furnished above is true and correct to the best of my knowledge and belief.
                  </p>
                  <div className="flex justify-between items-end">
                    <div>
                      <div>Place: {address || '________________'}</div>
                      <div>Date: {new Date().toLocaleDateString('en-IN')}</div>
                    </div>
                    <div className="text-center">
                      <div className="border-t border-slate-900 pt-1 px-6 font-bold">
                        {fullName || 'Candidate Signature'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Award, Printer, Upload, RotateCcw } from 'lucide-react';
import type { AppLang } from '../../data/i18n';
import { printElementHtml } from '../../utils/printHelper';

interface QrCertificateMakerProps {
  appLang: AppLang;
}

const CERT_THEMES = {
  goldRoyal: {
    name: 'Royal Gold & Navy',
    outerBorder: '#0f172a',
    innerBorder: '#ca8a04',
    accent: '#b45309',
    bg: '#fffdf7',
    titleColor: '#0f172a',
  },
  emeraldAcademy: {
    name: 'Emerald Academic',
    outerBorder: '#064e3b',
    innerBorder: '#10b981',
    accent: '#047857',
    bg: '#f7fefb',
    titleColor: '#064e3b',
  },
  crimsonHonor: {
    name: 'Crimson Honors',
    outerBorder: '#7f1d1d',
    innerBorder: '#d97706',
    accent: '#991b1b',
    bg: '#fffbfa',
    titleColor: '#7f1d1d',
  },
  modernSlate: {
    name: 'Modern Tech Slate',
    outerBorder: '#1e293b',
    innerBorder: '#3b82f6',
    accent: '#1d4ed8',
    bg: '#ffffff',
    titleColor: '#0f172a',
  },
};

export const QrCertificateMaker: React.FC<QrCertificateMakerProps> = ({ appLang }) => {
  const isBn = appLang === 'bn';
  const [themeKey, setThemeKey] = useState<keyof typeof CERT_THEMES>('goldRoyal');

  // Strictly empty defaults
  const [instituteName, setInstituteName] = useState('');
  const [instituteSub, setInstituteSub] = useState('');
  const [certTitle, setCertTitle] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [courseOrEvent, setCourseOrEvent] = useState('');
  const [gradeOrRank, setGradeOrRank] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [serialNo, setSerialNo] = useState('');
  const [signatory1, setSignatory1] = useState('');
  const [signatory2, setSignatory2] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [sign1Img, setSign1Img] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState('');

  const certRef = useRef<HTMLDivElement | null>(null);
  const theme = CERT_THEMES[themeKey];

  useEffect(() => {
    const payload = [
      `VERIFIED CERTIFICATE`,
      `Org: ${instituteName || '-'}`,
      `Serial: ${serialNo || 'CERT-001'}`,
      `Recipient: ${recipientName || '-'}`,
      `Course/Event: ${courseOrEvent || '-'}`,
      `Grade: ${gradeOrRank || '-'}`,
      `Date: ${issueDate || '-'}`,
    ].join('\n');

    QRCode.toDataURL(payload, { width: 180, margin: 1, color: { dark: '#0f172a', light: '#ffffff' } })
      .then(setQrUrl)
      .catch(() => setQrUrl(''));
  }, [instituteName, serialNo, recipientName, courseOrEvent, gradeOrRank, issueDate]);

  const handleReset = () => {
    setInstituteName('');
    setInstituteSub('');
    setCertTitle('');
    setRecipientName('');
    setCourseOrEvent('');
    setGradeOrRank('');
    setIssueDate('');
    setSerialNo('');
    setSignatory1('');
    setSignatory2('');
    setLogoUrl(null);
    setSign1Img(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-950 text-white rounded-2xl p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
            <Award className="w-4 h-4" />
            <span>{isBn ? 'গোল্ড বর্ডার + অটো সিরিয়াল + লাইভ ভেরিফিকেশন QR কোড সার্টিফিকেট' : 'Premium Border · Auto Verification QR · Landscape A4 Print'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-1">
            {isBn ? 'QR-ভেরিফায়েড ডিজিটাল সার্টিফিকেট ও অ্যাওয়ার্ড মেকার' : 'QR-Verified Digital Certificate & Award Maker'}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
          <button
            type="button"
            onClick={() => certRef.current && printElementHtml(certRef.current, `Certificate - ${recipientName || 'Award'}`)}
            className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs inline-flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> {isBn ? 'সার্টিফিকেট প্রিন্ট করুন' : 'Print Certificate'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
          <div>
            <div className="text-xs font-bold text-slate-700 mb-1.5">Certificate Template</div>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(CERT_THEMES) as Array<keyof typeof CERT_THEMES>).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setThemeKey(k)}
                  className={`px-2.5 py-2 rounded-lg text-xs font-bold border cursor-pointer ${
                    themeKey === k ? 'bg-slate-900 text-amber-300 border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {CERT_THEMES[k].name}
                </button>
              ))}
            </div>
          </div>

          <input value={instituteName} onChange={(e) => setInstituteName(e.target.value)} placeholder="Institute / Club / School Name" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold" />
          <input value={instituteSub} onChange={(e) => setInstituteSub(e.target.value)} placeholder="Registration No / Address (optional)" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs" />
          <input value={certTitle} onChange={(e) => setCertTitle(e.target.value)} placeholder="Title (e.g. CERTIFICATE OF ACHIEVEMENT)" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs" />
          <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Recipient / Student Full Name" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold" />
          <input value={courseOrEvent} onChange={(e) => setCourseOrEvent(e.target.value)} placeholder="Course / Competition / Event Name" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <input value={gradeOrRank} onChange={(e) => setGradeOrRank(e.target.value)} placeholder="Grade / 1st Prize" className="rounded-xl border border-slate-300 px-3 py-2 text-xs" />
            <input value={serialNo} onChange={(e) => setSerialNo(e.target.value)} placeholder="Serial No (CERT-2026-01)" className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono" />
          </div>
          <input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono" />
          <div className="grid grid-cols-2 gap-2">
            <input value={signatory1} onChange={(e) => setSignatory1(e.target.value)} placeholder="Left Signatory Title" className="rounded-xl border border-slate-300 px-3 py-2 text-xs" />
            <input value={signatory2} onChange={(e) => setSignatory2(e.target.value)} placeholder="Right Signatory Title" className="rounded-xl border border-slate-300 px-3 py-2 text-xs" />
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <label className="flex-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> {logoUrl ? 'Change Logo' : 'Upload Logo'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setLogoUrl(URL.createObjectURL(f)); }} />
            </label>
            <label className="flex-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> {sign1Img ? 'Change Sign' : 'Director Sign'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setSign1Img(URL.createObjectURL(f)); }} />
            </label>
          </div>
        </div>

        {/* Right Live Certificate Canvas */}
        <div className="lg:col-span-8">
          <div
            ref={certRef}
            className="p-4 sm:p-6 shadow-xl rounded-xl"
            style={{ backgroundColor: theme.bg, border: `8px solid ${theme.outerBorder}` }}
          >
            <div
              className="p-6 sm:p-10 text-center relative flex flex-col justify-between min-h-[500px]"
              style={{ border: `3px double ${theme.innerBorder}` }}
            >
              {/* Top Serial & QR Header */}
              <div className="flex items-start justify-between text-left gap-4">
                <div className="text-[11px] font-mono text-slate-600">
                  <div>Serial No: <strong className="text-slate-950">{serialNo || 'CERT-2026-001'}</strong></div>
                  <div>Date: <strong className="text-slate-950">{issueDate || '____ / ____ / 20__'}</strong></div>
                </div>
                {logoUrl && (
                  <img src={logoUrl} alt="Institute Logo" className="h-14 w-auto object-contain mx-auto" />
                )}
                <div className="text-right">
                  {qrUrl && (
                    <div className="inline-flex flex-col items-center">
                      <img src={qrUrl} alt="Verification QR" className="w-16 h-16 border border-slate-300 p-0.5 bg-white" />
                      <span className="text-[9px] font-mono font-bold text-slate-500 mt-0.5">SCAN TO VERIFY</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Center Body */}
              <div className="my-6 space-y-3">
                <div className="text-xl sm:text-2xl font-black tracking-wide uppercase" style={{ color: theme.titleColor }}>
                  {instituteName.trim() || 'INSTITUTE / ORGANIZATION NAME'}
                </div>
                {instituteSub.trim() && <div className="text-xs text-slate-600">{instituteSub.trim()}</div>}

                <div
                  className="pt-2 text-2xl sm:text-4xl font-serif font-bold tracking-wider uppercase"
                  style={{ color: theme.accent }}
                >
                  {certTitle.trim() || 'CERTIFICATE OF COMPLETION'}
                </div>

                <div className="text-sm text-slate-600 italic pt-2">This is proudly presented to</div>

                <div
                  className="text-3xl sm:text-4xl font-serif font-extrabold pb-2 mx-auto max-w-lg border-b-2"
                  style={{ color: theme.titleColor, borderColor: theme.innerBorder }}
                >
                  {recipientName.trim() || '__________________________'}
                </div>

                <p className="text-sm sm:text-base text-slate-700 max-w-xl mx-auto leading-relaxed pt-2">
                  for successfully completing / participating in{' '}
                  <strong className="text-slate-950">{courseOrEvent.trim() || '__________________________'}</strong>
                  {gradeOrRank.trim() ? (
                    <>
                      {' '}with distinction / grade <strong style={{ color: theme.accent }}>{gradeOrRank.trim()}</strong>
                    </>
                  ) : null}
                  .
                </p>
              </div>

              {/* Bottom Signatures */}
              <div className="grid grid-cols-2 gap-10 pt-8 items-end">
                <div className="text-center">
                  <div className="h-12 flex items-end justify-center">
                    {sign1Img && <img src={sign1Img} alt="Signature" className="max-h-12 object-contain" />}
                  </div>
                  <div className="border-t border-slate-800 pt-1.5 text-xs font-bold text-slate-900">
                    {signatory1.trim() || 'Authorized Signatory'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="h-12" />
                  <div className="border-t border-slate-800 pt-1.5 text-xs font-bold text-slate-900">
                    {signatory2.trim() || 'Director / Head of Institution'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

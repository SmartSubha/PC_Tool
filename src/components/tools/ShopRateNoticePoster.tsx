import React, { useRef, useState } from 'react';
import { Printer, Plus, Trash2, Megaphone, Sparkles } from 'lucide-react';
import type { AppLang } from '../../data/i18n';
import { printElementHtml } from '../../utils/printHelper';

interface ShopRateNoticePosterProps {
  appLang: AppLang;
}

interface RateRow {
  id: string;
  service: string;
  unit: string;
  price: string;
}

interface JobNoticeRow {
  id: string;
  examName: string;
  qualification: string;
  lastDate: string;
  fees: string;
}

const POSTER_THEMES = {
  cyberNavy: {
    name: 'Executive Navy & Gold',
    header: 'bg-slate-950 text-white border-b-4 border-amber-400',
    accent: 'text-amber-300',
    tableHead: 'bg-slate-900 text-amber-300',
    border: 'border-slate-900',
  },
  emeraldSeva: {
    name: 'Emerald CSC Seva',
    header: 'bg-emerald-950 text-white border-b-4 border-emerald-400',
    accent: 'text-emerald-300',
    tableHead: 'bg-emerald-900 text-white',
    border: 'border-emerald-900',
  },
  crimsonAlert: {
    name: 'High-Visibility Crimson Notice',
    header: 'bg-rose-950 text-white border-b-4 border-yellow-400',
    accent: 'text-yellow-300',
    tableHead: 'bg-rose-900 text-yellow-200',
    border: 'border-rose-900',
  },
};

export const ShopRateNoticePoster: React.FC<ShopRateNoticePosterProps> = ({ appLang }) => {
  const isBn = appLang === 'bn';
  const [posterMode, setPosterMode] = useState<'rate-chart' | 'job-notice'>('rate-chart');
  const [themeKey, setThemeKey] = useState<keyof typeof POSTER_THEMES>('cyberNavy');

  // Empty-default shop inputs
  const [shopTitle, setShopTitle] = useState('');
  const [shopSubtitle, setShopSubtitle] = useState('');
  const [shopContact, setShopContact] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [footerNote, setFooterNote] = useState('');

  // Rate chart rows
  const [rates, setRates] = useState<RateRow[]>([]);
  const [draftService, setDraftService] = useState('');
  const [draftUnit, setDraftUnit] = useState('');
  const [draftPrice, setDraftPrice] = useState('');

  // Job notice rows
  const [jobs, setJobs] = useState<JobNoticeRow[]>([]);
  const [draftExam, setDraftExam] = useState('');
  const [draftQual, setDraftQual] = useState('');
  const [draftLastDate, setDraftLastDate] = useState('');
  const [draftFees, setDraftFees] = useState('');

  const posterRef = useRef<HTMLDivElement | null>(null);
  const theme = POSTER_THEMES[themeKey];

  const loadSampleRates = () => {
    setRates([
      { id: crypto.randomUUID(), service: 'B&W Xerox / জেরক্স (Single)', unit: 'Per Page', price: '₹2' },
      { id: crypto.randomUUID(), service: 'B&W Printout / সাদা-কালো প্রিন্ট', unit: 'Per Page', price: '₹5' },
      { id: crypto.randomUUID(), service: 'Color Printout / রঙিন প্রিন্ট (A4)', unit: 'Per Page', price: '₹15' },
      { id: crypto.randomUUID(), service: 'Passport Size Photo (8 Copies)', unit: 'Glossy Set', price: '₹40' },
      { id: crypto.randomUUID(), service: 'PVC / Smart ID Card Lamination', unit: 'Per Card', price: '₹30' },
      { id: crypto.randomUUID(), service: 'A4 Document Lamination', unit: 'Per Sheet', price: '₹25' },
      { id: crypto.randomUUID(), service: 'Online Job / Scholarship Form Fill-up', unit: 'Per Form', price: '₹50+' },
      { id: crypto.randomUUID(), service: 'New PAN / Aadhaar / Ration Update', unit: 'Service Charge', price: '₹150' },
    ]);
  };

  const loadSampleJobs = () => {
    setJobs([
      { id: crypto.randomUUID(), examName: 'SSC GD / CHSL / MTS Online Apply', qualification: '10th / 12th Pass', lastDate: 'Active Portal', fees: '₹100 (Free: SC/ST/Women)' },
      { id: crypto.randomUUID(), examName: 'RRB Railway NTPC / Group D', qualification: '10th / ITI / Graduate', lastDate: 'Active Portal', fees: '₹500 / ₹250' },
      { id: crypto.randomUUID(), examName: 'WB Police Constable / SI Recruitment', qualification: 'Madhyamik / Graduate', lastDate: 'Active Portal', fees: '₹170 / ₹20' },
      { id: crypto.randomUUID(), examName: 'SVMCM / Oasis / Aikyashree Scholarship', qualification: 'Class 11 to PG', lastDate: 'Open Now', fees: 'Zero Govt Fee' },
    ]);
  };

  const addRate = () => {
    if (!draftService.trim() || !draftPrice.trim()) return;
    setRates((prev) => [
      ...prev,
      { id: crypto.randomUUID(), service: draftService.trim(), unit: draftUnit.trim() || 'Per Unit', price: draftPrice.trim() },
    ]);
    setDraftService('');
    setDraftUnit('');
    setDraftPrice('');
  };

  const addJob = () => {
    if (!draftExam.trim()) return;
    setJobs((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        examName: draftExam.trim(),
        qualification: draftQual.trim() || '—',
        lastDate: draftLastDate.trim() || '—',
        fees: draftFees.trim() || '—',
      },
    ]);
    setDraftExam('');
    setDraftQual('');
    setDraftLastDate('');
    setDraftFees('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
            <Megaphone className="w-4 h-4" />
            <span>{isBn ? 'দোকানে ঝোলানোর জন্য A4/A3 হাই-কনট্রাস্ট পোস্টার' : 'Wall-Mountable A4/A3 Shop Rate Chart & Daily Job Notice'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-1">
            {isBn ? 'ডিজিটাল রেট-চার্ট ও ডেইলি চাকরির নোটিশ পোস্টার মেকার' : 'Shop Rate-Chart & Daily Job Notice Poster Maker'}
          </h2>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setPosterMode('rate-chart')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer ${
              posterMode === 'rate-chart' ? 'bg-amber-400 text-slate-950' : 'text-slate-300'
            }`}
          >
            {isBn ? 'সার্ভিস রেট চার্ট' : 'Service Rate Chart'}
          </button>
          <button
            type="button"
            onClick={() => setPosterMode('job-notice')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer ${
              posterMode === 'job-notice' ? 'bg-amber-400 text-slate-950' : 'text-slate-300'
            }`}
          >
            {isBn ? 'আজকের চাকরির নোটিশ বোর্ড' : 'Daily Job Notice Board'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Controls */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <input
              type="text"
              value={shopTitle}
              onChange={(e) => setShopTitle(e.target.value)}
              placeholder={isBn ? 'দোকানের নাম (যেমন: মা তারা সাইবার ক্যাফে)' : 'Shop / Cyber Cafe Name'}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold"
            />
            <input
              type="text"
              value={shopSubtitle}
              onChange={(e) => setShopSubtitle(e.target.value)}
              placeholder={isBn ? 'সাব-হেডিং (যেমন: অনলাইন ফর্ম, প্রিন্ট, জেরক্স, পাসপোর্ট ফটো)' : 'Subtitle / Services tagline'}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="text"
                value={shopContact}
                onChange={(e) => setShopContact(e.target.value)}
                placeholder={isBn ? 'মোবাইল / WhatsApp' : 'Phone / WhatsApp'}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={shopAddress}
                onChange={(e) => setShopAddress(e.target.value)}
                placeholder={isBn ? 'দোকানের ঠিকানা' : 'Shop Address'}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <input
              type="text"
              value={footerNote}
              onChange={(e) => setFooterNote(e.target.value)}
              placeholder={isBn ? 'নিচের নোট (যেমন: সকাল ৯টা – রাত ৯টা খোলা, UPI গৃহীত হয়)' : 'Bottom note (e.g. Open 9AM-9PM · UPI Accepted)'}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <div className="text-xs font-bold text-slate-600 mb-1.5">Poster Color Theme</div>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(POSTER_THEMES) as Array<keyof typeof POSTER_THEMES>).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setThemeKey(k)}
                  className={`px-2.5 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                    themeKey === k
                      ? 'bg-slate-900 text-amber-300 border-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {POSTER_THEMES[k].name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {posterMode === 'rate-chart' ? (
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">{isBn ? 'রেট লিস্ট আইটেম যোগ করুন' : 'Add Service Rate Row'}</span>
                <button
                  type="button"
                  onClick={loadSampleRates}
                  className="text-xs font-bold text-indigo-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isBn ? 'কুইক টেমপ্লেট লোড' : 'Load Standard Rates'}
                </button>
              </div>
              <input
                type="text"
                value={draftService}
                onChange={(e) => setDraftService(e.target.value)}
                placeholder="Service Name (e.g. Color Print A4)"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={draftUnit}
                  onChange={(e) => setDraftUnit(e.target.value)}
                  placeholder="Unit (e.g. Per Page)"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={draftPrice}
                  onChange={(e) => setDraftPrice(e.target.value)}
                  placeholder="Price (e.g. ₹15)"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono font-bold"
                />
              </div>
              <button
                type="button"
                onClick={addRate}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Service Row
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">{isBn ? 'চাকরি / ফর্ম ফিলাপ নোটিশ যোগ করুন' : 'Add Active Exam / Form Row'}</span>
                <button
                  type="button"
                  onClick={loadSampleJobs}
                  className="text-xs font-bold text-indigo-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isBn ? 'স্যাম্পল নোটিশ লোড' : 'Load Sample Board'}
                </button>
              </div>
              <input
                type="text"
                value={draftExam}
                onChange={(e) => setDraftExam(e.target.value)}
                placeholder="Exam / Scheme Name (e.g. WB Police Constable)"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={draftQual}
                  onChange={(e) => setDraftQual(e.target.value)}
                  placeholder="Qualification (e.g. 10th Pass)"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={draftLastDate}
                  onChange={(e) => setDraftLastDate(e.target.value)}
                  placeholder="Last Date (e.g. 30 Nov)"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <input
                type="text"
                value={draftFees}
                onChange={(e) => setDraftFees(e.target.value)}
                placeholder="Govt Fee (e.g. ₹100 / Free for Women)"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={addJob}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Job Notice Row
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => posterRef.current && printElementHtml(posterRef.current, posterMode === 'rate-chart' ? 'Shop Rate Chart' : 'Daily Job Notice Board')}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            {isBn ? 'A4 / A3 পোস্টার প্রিন্ট প্রিভিউ' : 'Print Poster (A4 / A3 Preview)'}
          </button>
        </div>

        {/* Right Live A4 Poster Preview */}
        <div className="lg:col-span-7">
          <div
            ref={posterRef}
            className={`bg-white border-4 ${theme.border} rounded-2xl overflow-hidden shadow-xl text-slate-950`}
          >
            <div className={`${theme.header} p-6 text-center`}>
              <div className={`text-xs font-extrabold tracking-widest uppercase ${theme.accent}`}>
                {posterMode === 'rate-chart'
                  ? 'OFFICIAL SERVICE RATE CHART · সরকারি ও অনলাইন পরিষেবা রেট লিস্ট'
                  : 'DAILY ACTIVE FORM FILL-UP NOTICE · আজকের চাকরির ও প্রকল্পের আবেদন'}
              </div>
              <h1 className="text-3xl font-black mt-1 tracking-tight">
                {shopTitle.trim() || 'YOUR CYBER CAFE / DIGITAL SEVA KENDRA'}
              </h1>
              {shopSubtitle.trim() && (
                <p className="text-sm opacity-90 mt-1">{shopSubtitle.trim()}</p>
              )}
              {(shopContact.trim() || shopAddress.trim()) && (
                <div className="mt-2.5 text-xs font-semibold opacity-95 flex flex-wrap justify-center gap-3">
                  {shopContact.trim() && <span>Mob / WhatsApp: {shopContact.trim()}</span>}
                  {shopAddress.trim() && <span>· {shopAddress.trim()}</span>}
                </div>
              )}
            </div>

            <div className="p-6">
              {posterMode === 'rate-chart' ? (
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className={theme.tableHead}>
                      <th className="text-left py-3 px-4 font-bold">SL</th>
                      <th className="text-left py-3 px-4 font-bold">Service / পরিষেবা</th>
                      <th className="text-left py-3 px-4 font-bold">Unit</th>
                      <th className="text-right py-3 px-4 font-bold">Rate (₹)</th>
                      <th className="w-8 print:hidden"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {rates.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                          Add service rates from the left panel or click "Load Standard Rates".
                        </td>
                      </tr>
                    ) : (
                      rates.map((r, i) => (
                        <tr key={r.id} className={i % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                          <td className="py-3 px-4 font-mono font-bold text-slate-500">{i + 1}</td>
                          <td className="py-3 px-4 font-bold text-slate-950">{r.service}</td>
                          <td className="py-3 px-4 text-slate-600">{r.unit}</td>
                          <td className="py-3 px-4 text-right font-mono font-black text-base text-slate-950">{r.price}</td>
                          <td className="py-2 pr-2 print:hidden">
                            <button
                              type="button"
                              onClick={() => setRates((prev) => prev.filter((x) => x.id !== r.id))}
                              className="text-slate-400 hover:text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className={theme.tableHead}>
                      <th className="text-left py-3 px-3 font-bold">Exam / Scheme Name</th>
                      <th className="text-left py-3 px-3 font-bold">Qualification</th>
                      <th className="text-left py-3 px-3 font-bold">Last Date</th>
                      <th className="text-right py-3 px-3 font-bold">Govt Fee</th>
                      <th className="w-8 print:hidden"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {jobs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                          Add active exams/schemes on the left or click "Load Sample Board".
                        </td>
                      </tr>
                    ) : (
                      jobs.map((j, i) => (
                        <tr key={j.id} className={i % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                          <td className="py-3 px-3 font-bold text-slate-950">{j.examName}</td>
                          <td className="py-3 px-3 text-slate-700">{j.qualification}</td>
                          <td className="py-3 px-3 font-bold text-rose-700">{j.lastDate}</td>
                          <td className="py-3 px-3 text-right font-semibold text-slate-900">{j.fees}</td>
                          <td className="py-2 pr-2 print:hidden">
                            <button
                              type="button"
                              onClick={() => setJobs((prev) => prev.filter((x) => x.id !== j.id))}
                              className="text-slate-400 hover:text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              <div className="mt-6 pt-3 border-t-2 border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
                <span>{footerNote.trim() || 'UPI / PhonePe / GPay / Cash Accepted · Fast & Accurate Service'}</span>
                <span className="font-mono">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

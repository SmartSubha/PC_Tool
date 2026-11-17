import React, { useRef, useState } from 'react';
import { ArrowLeft, Printer, Sparkles, RotateCcw } from 'lucide-react';
import type { OwnerContactConfig } from '../../data/ownerConfig';
import type { AppLang } from '../../data/i18n';
import { printElementHtml } from '../../utils/printHelper';

interface PostersPageProps {
  ownerConfig: OwnerContactConfig;
  lang: AppLang;
  onBack: () => void;
}

const POSTER_TEMPLATES = [
  {
    id: 'csc-services',
    title: 'CSC & Online Services Banner',
    titleBn: 'CSC ও অনলাইন সার্ভিস ব্যানার',
    headline: 'ALL ONLINE & CSC SERVICES AVAILABLE HERE',
    subhead: 'Aadhaar Print · PAN Card · Voter ID · Ration Card · Passport Photo · Income & Caste Certificate',
    bgClass: 'from-violet-700 via-indigo-700 to-purple-800',
  },
  {
    id: 'wb-schemes',
    title: 'WB Duare Sarkar & Welfare Desk',
    titleBn: 'লক্ষ্মীর ভাণ্ডার ও দুয়ারে সরকার ক্যাম্প',
    headline: 'লক্ষ্মীর ভাণ্ডার, কন্যাশ্রী ও সরকারি প্রকল্পের ফর্ম ফিলাপ',
    subhead: 'লক্ষ্মীর ভাণ্ডার · স্বাস্থ্যসাথী · কাস্ট সার্টিফিকেট · বার্ধক্য/বিধবা ভাতা · কৃষকবন্ধু আবেদন ও ডিক্লারেশন',
    bgClass: 'from-pink-700 via-rose-700 to-red-800',
  },
  {
    id: 'exam-forms',
    title: 'Student Exam & Scholarship Desk',
    titleBn: 'চাকরির ফর্ম ও স্কলারশিপ পোর্টাল',
    headline: 'ONLINE EXAM FORMS & SCHOLARSHIP PORTAL',
    subhead: 'SSC · WBPSC · Railway · SVMCM · NSP · Photo & Signature Exact KB Resize & PDF Merge',
    bgClass: 'from-blue-700 via-sky-700 to-indigo-800',
  },
  {
    id: 'banglarbhumi',
    title: 'Banglarbhumi Land & Mutation Desk',
    titleBn: 'জমির পরচা, খাজনা ও মিউটেশন',
    headline: 'জমির পরচা, খাজনা ও মিউটেশন (BANGLARBHUMI)',
    subhead: 'দাগ/খতিয়ান তথ্য · অনলাইন খাজনা রসিদ · মিউটেশন আবেদন · ওয়ারিশ ও বংশতালিকা প্রিন্ট',
    bgClass: 'from-emerald-700 via-teal-700 to-green-800',
  },
  {
    id: 'id-card-print',
    title: 'PVC & Laminated ID Card Studio',
    titleBn: 'স্মার্ট কার্ড ও ল্যামিনেশন প্রিন্ট',
    headline: 'SMART ID CARD PRINTING & LAMINATION',
    subhead: 'e-Aadhaar · e-PAN · e-EPIC Voter Card · ABHA Health Card · Digital Ration Card Express Print',
    bgClass: 'from-amber-600 via-orange-600 to-red-700',
  },
  {
    id: 'photo-studio',
    title: 'Urgent Passport Photo Studio',
    titleBn: 'আর্জেন্ট পাসপোর্ট ছবি (৫ মিনিটে)',
    headline: 'URGENT PASSPORT & STAMP SIZE PHOTO IN 5 MINS',
    subhead: 'High-Gloss 4×6 & A4 Photo Print · Name & Date Print · Background Change · Xerox & Color Scan',
    bgClass: 'from-cyan-700 via-sky-700 to-blue-900',
  },
  {
    id: 'travel-tickets',
    title: 'Train, Flight & Bus Ticket Counter',
    titleBn: 'ট্রেন, বাস ও ফ্লাইট টিকিট বুকিং',
    headline: 'CONFIRM TRAIN, FLIGHT & BUS TICKETS BOOKING',
    subhead: 'IRCTC Rail Ticket · Flight Ticket · Electricity Bill · Gas Cylinder Booking · PF & Pension Life Cert',
    bgClass: 'from-slate-800 via-indigo-900 to-slate-900',
  },
  {
    id: 'festive',
    title: 'Festive Greetings Poster',
    titleBn: 'উৎসবের শুভেচ্ছা পোস্টার',
    headline: 'WARM FESTIVE WISHES TO ALL OUR CUSTOMERS',
    subhead: 'Thank you for trusting our Digital Seva Centre for fast, reliable documentation & printing.',
    bgClass: 'from-rose-700 via-amber-600 to-orange-700',
  },
];

export const PostersPage: React.FC<PostersPageProps> = ({ ownerConfig, lang, onBack }) => {
  const [selectedId, setSelectedId] = useState(POSTER_TEMPLATES[0].id);
  const template = POSTER_TEMPLATES.find((t) => t.id === selectedId) || POSTER_TEMPLATES[0];
  const printAreaRef = useRef<HTMLDivElement | null>(null);

  // Start inputs empty (user chooses when to fill or click Fill SMART SUBHA Details)
  const [shopName, setShopName] = useState('');
  const [headline, setHeadline] = useState('');
  const [subhead, setSubhead] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const selectTemplate = (t: (typeof POSTER_TEMPLATES)[number]) => {
    setSelectedId(t.id);
    setHeadline(t.headline);
    setSubhead(t.subhead);
  };

  const fillOwnerDefaults = () => {
    setShopName(`${ownerConfig.brandName} ${ownerConfig.byline}`);
    setPhone(ownerConfig.phone);
    setEmail(ownerConfig.supportEmail);
    setAddress(ownerConfig.location);
    if (!headline.trim()) setHeadline(template.headline);
    if (!subhead.trim()) setSubhead(template.subhead);
  };

  const resetInputs = () => {
    setShopName('');
    setHeadline('');
    setSubhead('');
    setPhone('');
    setEmail('');
    setAddress('');
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 lg:px-6 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 no-print">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-700 dark:text-violet-400 hover:underline mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {lang === 'bn' ? 'হোমে ফিরুন' : 'Back to All Tools'}
          </button>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            {lang === 'bn' ? 'দোকান ও CSC পোস্টার স্টুডিও (৮টি টেমপ্লেট)' : 'Shop & CSC Posters Studio (8 Templates)'}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            {lang === 'bn'
              ? 'যেকোনো একটি টেমপ্লেট বেছে নিয়ে নিজের দোকানের নাম ও বিবরণ লিখে A4 প্রিন্ট করুন।'
              : 'Pick any of the 8 ready-made cyber cafe banner templates, type your shop details, and print cleanly on A4.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => printElementHtml(printAreaRef.current, 'Shop Poster A4')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold cursor-pointer shadow-sm"
        >
          <Printer className="w-4 h-4" />
          Print Poster (A4)
        </button>
      </div>

      {/* 8 Template Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 no-print">
        {POSTER_TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => selectTemplate(t)}
            className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
              selectedId === t.id
                ? 'border-violet-600 bg-violet-50 dark:bg-violet-950/40 ring-2 ring-violet-200 dark:ring-violet-800'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-violet-300 dark:hover:border-violet-600'
            }`}
          >
            <div className={`h-2.5 w-14 rounded-full bg-gradient-to-r ${t.bgClass} mb-2`} />
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {lang === 'bn' ? t.titleBn : t.title}
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 no-print shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-sm font-extrabold text-slate-900 dark:text-white">Customize Poster</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={fillOwnerDefaults}
                className="px-2 py-1 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 text-[11px] font-bold hover:bg-violet-100 dark:hover:bg-violet-900/60 cursor-pointer"
              >
                Fill SMART SUBHA
              </button>
              <button
                type="button"
                onClick={resetInputs}
                title="Clear fields"
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Center / Shop Name
            </label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="Enter center / shop name"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Main Headline
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder={template.headline}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Services / Subtitle
            </label>
            <textarea
              rows={3}
              value={subhead}
              onChange={(e) => setSubhead(e.target.value)}
              placeholder={template.subhead}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Contact Phone
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter mobile number"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter center address"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
            />
          </div>
        </div>

        <div className="lg:col-span-8">
          <div
            ref={printAreaRef}
            className={`print-area rounded-3xl bg-gradient-to-br ${template.bgClass} text-white p-8 md:p-12 shadow-xl flex flex-col justify-between min-h-[540px]`}
          >
            <div className="flex items-center justify-between border-b border-white/25 pb-4">
              <span className="text-lg font-extrabold tracking-tight">
                {shopName.trim() || `${ownerConfig.brandName} ${ownerConfig.byline}`}
              </span>
              <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full">
                Fast &amp; Trusted Seva
              </span>
            </div>

            <div className="py-10 text-center space-y-5">
              <h2 className="text-3xl md:text-4xl font-extrabold leading-tight tracking-tight">
                {headline.trim() || template.headline}
              </h2>
              <p className="text-base md:text-lg text-white/95 max-w-2xl mx-auto leading-relaxed">
                {subhead.trim() || template.subhead}
              </p>
            </div>

            <div className="bg-white/15 backdrop-blur-xs border border-white/25 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm">
              <div>
                <div className="text-xs text-white/80 uppercase font-bold">Visit Us</div>
                <div className="font-bold">{address.trim() || '________________________'}</div>
              </div>
              <div className="sm:text-right">
                <div className="font-extrabold text-base tabular-nums">{phone.trim() || '______________'}</div>
                <div className="text-xs text-white/90">{email.trim() || '________________________'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

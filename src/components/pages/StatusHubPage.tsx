import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ExternalLink,
  Search,
  Landmark,
  GraduationCap,
  IdCard,
  ShieldCheck,
  MapPinHouse,
  Star,
  Copy,
  Check,
  X,
  FileCheck2,
  LayoutGrid,
  List,
} from 'lucide-react';
import type { AppLang } from '../../data/i18n';

interface StatusHubPageProps {
  lang: AppLang;
  onBack: () => void;
}

interface StatusPortalItem {
  id: string;
  category: 'wb-welfare' | 'land-ration' | 'id-tax' | 'education';
  title: string;
  bnTitle: string;
  portalName: string;
  url: string;
  reqDocsEn: string;
  reqDocsBn: string;
  badge: string;
  badgeClass: string;
}

const SAVED_PORTALS_KEY = 'pctool_status_hub_saved';

const PORTALS: StatusPortalItem[] = [
  {
    id: 'lakshmir-bhandar',
    category: 'wb-welfare',
    title: 'Lakshmir Bhandar Payment & Application Status',
    bnTitle: 'লক্ষ্মীর ভাণ্ডার আবেদন ও পেমেন্ট স্ট্যাটাস',
    portalName: 'socialsecurity.wb.gov.in',
    url: 'https://socialsecurity.wb.gov.in/',
    reqDocsEn: 'Registered Mobile No. / Application ID / Aadhaar / Swasthya Sathi No.',
    reqDocsBn: 'আবেদন আইডি, রেজিস্টার্ড মোবাইল নম্বর, আধার বা স্বাস্থ্যসাথী নম্বর প্রয়োজন।',
    badge: 'WB Govt',
    badgeClass: 'bg-rose-600 text-white',
  },
  {
    id: 'swasthya-sathi',
    category: 'wb-welfare',
    title: 'Swasthya Sathi Card & Family URN Verification',
    bnTitle: 'স্বাস্থ্যসাথী কার্ড ও নামের তালিকা চেক',
    portalName: 'swasthyasathi.gov.in',
    url: 'https://swasthyasathi.gov.in/',
    reqDocsEn: 'District + Block/Municipality + Aadhaar Number or URN',
    reqDocsBn: 'জেলা, ব্লক/পুরসভা ও আধার নম্বর বা URN দিয়ে কার্ডের স্ট্যাটাস দেখা যায়।',
    badge: 'Health',
    badgeClass: 'bg-emerald-600 text-white',
  },
  {
    id: 'khadya-sathi',
    category: 'land-ration',
    title: 'Khadya Sathi Digital Ration Card Status & Download',
    bnTitle: 'খাদ্যসাথী ডিজিটাল রেশন কার্ড স্ট্যাটাস ও ডাউনলোড',
    portalName: 'food.wb.gov.in',
    url: 'https://food.wb.gov.in/',
    reqDocsEn: 'Form No. / Application ID / Registered Mobile No. (OTP) / RC Number',
    reqDocsBn: 'ফর্ম নম্বর/আবেদন আইডি অথবা রেশন কার্ড ও আধার লিংকড মোবাইল নম্বর।',
    badge: 'Ration',
    badgeClass: 'bg-lime-700 text-white',
  },
  {
    id: 'banglarbhumi',
    category: 'land-ration',
    title: 'Banglarbhumi Mutation, ROR (Porcha) & Khajna Status',
    bnTitle: 'বাংলারভূমি পর্চা, মিউটেশন ও খাজনা স্ট্যাটাস',
    portalName: 'banglarbhumi.gov.in',
    url: 'https://banglarbhumi.gov.in/',
    reqDocsEn: 'District, Block, Mouza (JL No.), Khatian / Plot (Dag) or Case Number',
    reqDocsBn: 'জেলা, ব্লক, মৌজা (JL No.), খতিয়ান বা দাগ নম্বর / মিউটেশন কেস নম্বর।',
    badge: 'Land / BLRO',
    badgeClass: 'bg-amber-600 text-white',
  },
  {
    id: 'krishak-bandhu',
    category: 'wb-welfare',
    title: 'Krishak Bandhu Beneficiary Status (Voter ID Search)',
    bnTitle: 'কৃষক বন্ধু টাকা ও নাম চেক (ভোটার কার্ড দিয়ে)',
    portalName: 'krishakbandhu.wb.gov.in',
    url: 'https://krishakbandhu.wb.gov.in/',
    reqDocsEn: 'Farmer Voter ID Card Number (EPIC)',
    reqDocsBn: 'আবেদনকারীর ভোটার কার্ড (EPIC) নম্বর দিয়ে স্ট্যাটাস ও টাকার তথ্য দেখা যায়।',
    badge: 'Farmer WB',
    badgeClass: 'bg-green-700 text-white',
  },
  {
    id: 'pm-kisan',
    category: 'wb-welfare',
    title: 'PM Kisan Samman Nidhi Installment Status',
    bnTitle: 'পিএম কিষাণ কিস্তি ও eKYC স্ট্যাটাস',
    portalName: 'pmkisan.gov.in',
    url: 'https://pmkisan.gov.in/',
    reqDocsEn: 'PM Kisan Registration No. or Registered Mobile Number (OTP)',
    reqDocsBn: 'রেজিস্ট্রেশন নম্বর বা রেজিস্টার্ড মোবাইল নম্বর ও ক্যাপচা।',
    badge: 'Central',
    badgeClass: 'bg-teal-600 text-white',
  },
  {
    id: 'caste-cert-wb',
    category: 'id-tax',
    title: 'WB SC / ST / OBC Caste Certificate Application Status',
    bnTitle: 'SC / ST / OBC কাস্ট সার্টিফিকেট স্ট্যাটাস',
    portalName: 'castcertificatewb.gov.in',
    url: 'https://castcertificatewb.gov.in/',
    reqDocsEn: 'Application Number (e.g. WB...)',
    reqDocsBn: 'কাস্ট সার্টিফিকেট আবেদন নম্বর (Application Number)।',
    badge: 'Certificate',
    badgeClass: 'bg-orange-600 text-white',
  },
  {
    id: 'voter-portal',
    category: 'id-tax',
    title: 'Voter Portal — e-EPIC Download & Form-6/8 Track',
    bnTitle: 'ভোটার কার্ড স্ট্যাটাস ট্র্যাক ও e-EPIC ডাউনলোড',
    portalName: 'voters.eci.gov.in',
    url: 'https://voters.eci.gov.in/',
    reqDocsEn: 'Reference ID / EPIC No. & Mobile OTP Login',
    reqDocsBn: 'রেফারেন্স নম্বর বা এপিক নম্বর এবং মোবাইল OTP।',
    badge: 'Election',
    badgeClass: 'bg-indigo-600 text-white',
  },
  {
    id: 'pan-nsdl-uti',
    category: 'id-tax',
    title: 'PAN Card Track Status (Protean NSDL & UTIITSL)',
    bnTitle: 'প্যান কার্ড স্ট্যাটাস চেক (NSDL / Protean)',
    portalName: 'tin.tin.nsdl.com',
    url: 'https://tin.tin.nsdl.com/pantan/StatusTrack.html',
    reqDocsEn: '15-digit Acknowledgement Number',
    reqDocsBn: '১৫ ডিজিটের একনলেজমেন্ট (Acknowledgement) নম্বর।',
    badge: 'PAN / Tax',
    badgeClass: 'bg-sky-600 text-white',
  },
  {
    id: 'svmcm',
    category: 'education',
    title: 'Swami Vivekananda Scholarship (SVMCM) Status',
    bnTitle: 'স্বামী বিবেকানন্দ স্কলারশিপ (SVMCM) স্ট্যাটাস',
    portalName: 'svmcm.wbhed.gov.in',
    url: 'https://svmcm.wbhed.gov.in/',
    reqDocsEn: 'Applicant ID & Login Password',
    reqDocsBn: 'আবেদনকারীর SVMCM ইউজার আইডি ও পাসওয়ার্ড।',
    badge: 'Scholarship',
    badgeClass: 'bg-violet-600 text-white',
  },
  {
    id: 'aikyashree-oasis',
    category: 'education',
    title: 'Oasis SC/ST/OBC & Aikyashree Scholarship Track',
    bnTitle: 'ওয়েসিস (Oasis) ও ঐক্যশ্রী স্কলারশিপ স্ট্যাটাস',
    portalName: 'oasis.gov.in',
    url: 'https://oasis.gov.in/',
    reqDocsEn: 'Student User ID, District & Session',
    reqDocsBn: 'স্টুডেন্ট ইউজার আইডি, জেলা ও শিক্ষাবর্ষ।',
    badge: 'Student WB',
    badgeClass: 'bg-fuchsia-600 text-white',
  },
  {
    id: 'uidai-aadhaar',
    category: 'id-tax',
    title: 'Aadhaar PVC / Enrolment Update & Bank Seeding Check',
    bnTitle: 'আধার আপডেট ও PVC কার্ড স্ট্যাটাস চেক',
    portalName: 'myaadhaar.uidai.gov.in',
    url: 'https://myaadhaar.uidai.gov.in/',
    reqDocsEn: '14-digit Enrolment ID / SRN / Aadhaar OTP',
    reqDocsBn: 'এনরোলমেন্ট আইডি (EID), SRN বা আধার OTP।',
    badge: 'UIDAI',
    badgeClass: 'bg-red-600 text-white',
  },
];

export const StatusHubPage: React.FC<StatusHubPageProps> = ({ lang, onBack }) => {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<'all' | StatusPortalItem['category']>('all');
  const [viewMode, setViewMode] = useState<'desk' | 'grid'>('desk');
  const [onlySaved, setOnlySaved] = useState(false);
  const [activeId, setActiveId] = useState<string>(PORTALS[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [savedIds, setSavedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(SAVED_PORTALS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(SAVED_PORTALS_KEY, JSON.stringify(savedIds));
    } catch {
      // ignore
    }
  }, [savedIds]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: PORTALS.length };
    PORTALS.forEach((p) => {
      map[p.category] = (map[p.category] || 0) + 1;
    });
    return map;
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return PORTALS.filter(
      (p) =>
        (!onlySaved || savedIds.includes(p.id)) &&
        (catFilter === 'all' || p.category === catFilter) &&
        (!q ||
          p.title.toLowerCase().includes(q) ||
          p.bnTitle.toLowerCase().includes(q) ||
          p.portalName.toLowerCase().includes(q) ||
          p.reqDocsEn.toLowerCase().includes(q) ||
          p.reqDocsBn.toLowerCase().includes(q))
    );
  }, [search, catFilter, onlySaved, savedIds]);

  const activePortal =
    filtered.find((p) => p.id === activeId) ||
    filtered[0] ||
    PORTALS.find((p) => p.id === activeId) ||
    PORTALS[0];

  const toggleSave = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSavedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleCopyPortal = async (item: StatusPortalItem) => {
    const msg = [
      `🌐 *${lang === 'bn' ? item.bnTitle : item.title}*`,
      `🔗 ${item.url}`,
      `📋 ${lang === 'bn' ? 'প্রয়োজনীয় তথ্য' : 'Required'}: ${
        lang === 'bn' ? item.reqDocsBn : item.reqDocsEn
      }`,
    ].join('\n');
    await navigator.clipboard.writeText(msg);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-6 sm:py-8 space-y-6">
      {/* Dark High-Contrast Command Header */}
      <div className="rounded-3xl bg-slate-950 text-white border-2 border-slate-800 p-6 md:p-8 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-amber-300 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{lang === 'bn' ? 'হোমে ফিরুন' : 'Back to Home'}</span>
          </button>

          <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-300 tabular-nums">
            <span>{PORTALS.length} {lang === 'bn' ? 'টি সরকারি পোর্টাল' : 'Official Portals'}</span>
            <span aria-hidden="true">·</span>
            <span>{lang === 'bn' ? 'ডিরেক্ট স্ট্যাটাস চেক' : '1-Click Live Tracking'}</span>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-sky-400 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
              {lang === 'bn'
                ? 'পশ্চিমবঙ্গ কুইক স্ট্যাটাস চেক হাব (অফিশিয়াল পোর্টাল)'
                : 'West Bengal Quick Status Check Hub (Official Portals)'}
            </h1>
            <p className="text-sm text-slate-300 mt-1.5 leading-relaxed max-w-3xl">
              {lang === 'bn'
                ? 'দোকানে আসা কাস্টমারদের সমস্ত সরকারি প্রকল্প, রেশন, জমি ও কার্ডের স্ট্যাটাস চেক করার আসল ওয়েবসাইট লিংক এবং কী কী ডকুমেন্ট/নম্বর লাগবে তার দ্রুত ডেস্ক।'
                : 'Direct official portal links and counter checklists for daily Cyber Cafe status inquiries.'}
            </p>
          </div>
        </div>
      </div>

      {/* Filter, View Mode & Search Bar */}
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-900/15 dark:border-slate-700 rounded-2xl p-4 space-y-3 shadow-xs">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2.5 px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl focus-within:border-slate-950 dark:focus-within:border-amber-400">
            <Search className="w-4 h-4 text-slate-600 dark:text-slate-300 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                lang === 'bn'
                  ? 'প্রকল্প, কার্ড বা পোর্টাল খুঁজুন (যেমন: লক্ষ্মীর ভাণ্ডার, রেশন, বাংলারভূমি, আধার)...'
                  : 'Search scheme or portal (e.g. Lakshmir Bhandar, Ration, Banglarbhumi)...'
              }
              className="w-full bg-transparent text-sm font-semibold text-slate-950 dark:text-white focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setOnlySaved((p) => !p)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border-2 text-xs font-extrabold cursor-pointer transition-colors ${
                onlySaved
                  ? 'bg-amber-400 border-amber-500 text-slate-950'
                  : 'bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100'
              }`}
            >
              <Star className={`w-4 h-4 ${onlySaved ? 'fill-slate-950' : 'text-amber-500'}`} />
              <span>{lang === 'bn' ? `পিন (${savedIds.length})` : `Pinned (${savedIds.length})`}</span>
            </button>

            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-1">
              <button
                type="button"
                onClick={() => setViewMode('desk')}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer ${
                  viewMode === 'desk'
                    ? 'bg-slate-950 dark:bg-amber-400 text-white dark:text-slate-950'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Desk</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-slate-950 dark:bg-amber-400 text-white dark:text-slate-950'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grid</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', labelEn: `All Portals (${counts.all})`, labelBn: `সব পোর্টাল (${counts.all})`, icon: <ShieldCheck className="w-3.5 h-3.5" /> },
            { id: 'wb-welfare', labelEn: `WB Welfare & Farmers (${counts['wb-welfare'] || 0})`, labelBn: `প্রকল্প ও কৃষক (${counts['wb-welfare'] || 0})`, icon: <Landmark className="w-3.5 h-3.5" /> },
            { id: 'land-ration', labelEn: `Land & Ration (${counts['land-ration'] || 0})`, labelBn: `জমি ও রেশন (${counts['land-ration'] || 0})`, icon: <MapPinHouse className="w-3.5 h-3.5" /> },
            { id: 'id-tax', labelEn: `ID, PAN & Caste (${counts['id-tax'] || 0})`, labelBn: `আইডি ও কাস্ট (${counts['id-tax'] || 0})`, icon: <IdCard className="w-3.5 h-3.5" /> },
            { id: 'education', labelEn: `Scholarships (${counts.education || 0})`, labelBn: `স্কলারশিপ (${counts.education || 0})`, icon: <GraduationCap className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCatFilter(tab.id as typeof catFilter)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold border-2 cursor-pointer transition-colors whitespace-nowrap shrink-0 tabular-nums ${
                catFilter === tab.id
                  ? 'bg-slate-950 dark:bg-amber-400 text-white dark:text-slate-950 border-slate-950 dark:border-amber-400'
                  : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-800 dark:text-slate-200 hover:border-slate-400'
              }`}
            >
              {tab.icon}
              <span>{lang === 'bn' ? tab.labelBn : tab.labelEn}</span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-2xl p-10 text-center space-y-3">
          <div className="text-base font-extrabold text-slate-900 dark:text-white">
            {lang === 'bn' ? 'কোনো পোর্টাল পাওয়া যায়নি' : 'No portals matched your search'}
          </div>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setCatFilter('all');
              setOnlySaved(false);
            }}
            className="px-4 py-2 rounded-xl bg-slate-950 dark:bg-amber-400 text-white dark:text-slate-950 text-xs font-extrabold cursor-pointer"
          >
            {lang === 'bn' ? 'সবগুলো দেখান' : 'Reset Filters'}
          </button>
        </div>
      ) : viewMode === 'desk' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left High-Contrast Portal Index */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border-2 border-slate-900/20 dark:border-slate-700 rounded-2xl overflow-hidden shadow-xs">
            <div className="px-4 py-3 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
              <span>
                {lang === 'bn' ? `সরকারি পোর্টাল (${filtered.length})` : `Portals Index (${filtered.length})`}
              </span>
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                {lang === 'bn' ? 'ক্লিক করুন' : 'Select →'}
              </span>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-[680px] overflow-y-auto">
              {filtered.map((item, idx) => {
                const selected = activePortal.id === item.id;
                const itemSaved = savedIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setActiveId(item.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') setActiveId(item.id);
                    }}
                    className={`w-full px-4 py-3.5 flex items-start gap-3 text-left transition-colors cursor-pointer ${
                      selected
                        ? 'bg-slate-950 text-white dark:bg-amber-400 dark:text-slate-950'
                        : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-xl text-xs font-black flex items-center justify-center shrink-0 tabular-nums mt-0.5 ${
                        selected
                          ? 'bg-amber-400 text-slate-950 dark:bg-slate-950 dark:text-amber-300'
                          : item.badgeClass
                      }`}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-extrabold leading-snug">
                        {lang === 'bn' ? item.bnTitle : item.title}
                      </div>
                      <div
                        className={`text-xs font-mono mt-0.5 truncate ${
                          selected
                            ? 'text-sky-300 dark:text-slate-900 font-bold'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {item.portalName}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => toggleSave(item.id, e)}
                      className="p-1.5 rounded-lg shrink-0 cursor-pointer"
                      aria-label="Pin portal"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          itemSaved
                            ? selected
                              ? 'fill-amber-400 text-amber-400 dark:fill-slate-950 dark:text-slate-950'
                              : 'fill-amber-400 text-amber-500'
                            : 'text-slate-400'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Active High-Contrast Portal Launchpad */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border-2 border-slate-950 dark:border-slate-600 rounded-2xl overflow-hidden shadow-md">
            <div className="bg-slate-950 text-white p-6 border-b-2 border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                  {activePortal.badge} · {activePortal.portalName}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleSave(activePortal.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                      savedIds.includes(activePortal.id)
                        ? 'bg-amber-400 text-slate-950 border-amber-400'
                        : 'bg-slate-900 text-slate-200 border-slate-700'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${savedIds.includes(activePortal.id) ? 'fill-slate-950' : ''}`} />
                    <span>{savedIds.includes(activePortal.id) ? 'Pinned' : 'Pin'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyPortal(activePortal)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-slate-950 hover:bg-slate-200 text-xs font-extrabold cursor-pointer"
                  >
                    {copiedId === activePortal.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === activePortal.id ? 'Copied!' : 'Copy Details'}</span>
                  </button>
                </div>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
                  {lang === 'bn' ? activePortal.bnTitle : activePortal.title}
                </h2>
                <div className="text-xs sm:text-sm text-slate-300 mt-1">
                  {lang === 'bn' ? activePortal.title : activePortal.bnTitle}
                </div>
              </div>

              <a
                href={activePortal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-sm font-black shadow-sm transition-colors"
              >
                <span>{lang === 'bn' ? 'অফিশিয়াল পোর্টাল খুলুন' : 'Launch Official Portal Now'}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="p-6 space-y-5">
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-100 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-xs font-black text-slate-950 dark:text-amber-300 uppercase tracking-wider">
                  <FileCheck2 className="w-4 h-4 text-emerald-600 dark:text-amber-400" />
                  <span>
                    {lang === 'bn'
                      ? 'স্ট্যাটাস চেক করতে কাস্টমারের কী কী তথ্য লাগবে?'
                      : 'What Number / Documents Needed from Customer'}
                  </span>
                </div>
                <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-relaxed">
                  {lang === 'bn' ? activePortal.reqDocsBn : activePortal.reqDocsEn}
                </p>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                {lang === 'bn'
                  ? 'টিপস: সরাসরি সরকারি পোর্টাল নতুন ট্যাবে খুলবে যাতে কাস্টমারের সামনে দ্রুত OTP ভেরিফাই ও স্ট্যাটাস প্রিন্ট করে দেওয়া যায়।'
                  : 'Tip: Clicking Launch opens the verified government URL cleanly in a new tab for instant OTP verification & status print.'}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* High-Contrast Grid View Option */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 border-2 border-slate-900/20 dark:border-slate-700 hover:border-slate-950 dark:hover:border-amber-400 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs transition-all"
            >
              <div className="bg-slate-950 text-white px-4 py-3 flex items-center justify-between gap-2">
                <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-black ${item.badgeClass}`}>
                  {item.badge}
                </span>
                <span className="text-[11px] font-mono text-slate-300 truncate">{item.portalName}</span>
              </div>

              <div className="p-5 space-y-3 flex-1">
                <h3 className="text-sm sm:text-base font-black text-slate-950 dark:text-white leading-snug">
                  {lang === 'bn' ? item.bnTitle : item.title}
                </h3>
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                  <span className="font-black text-slate-950 dark:text-amber-300">
                    {lang === 'bn' ? 'প্রয়োজনীয় তথ্য: ' : 'Needed: '}
                  </span>
                  {lang === 'bn' ? item.reqDocsBn : item.reqDocsEn}
                </div>
              </div>

              <div className="px-5 pb-5">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-950 hover:bg-emerald-600 dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-slate-950 text-xs font-black transition-colors"
                >
                  <span>{lang === 'bn' ? 'অফিশিয়াল পোর্টাল খুলুন' : 'Open Official Portal'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

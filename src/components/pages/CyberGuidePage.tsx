import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BookOpenCheck,
  Check,
  CheckSquare,
  Copy,
  ExternalLink,
  FileCheck,
  HelpCircle,
  IndianRupee,
  Printer,
  Search,
  Square,
  Star,
  Wrench,
  X,
  ListOrdered,
  FileSpreadsheet,
} from 'lucide-react';
import {
  CYBER_QUICK_TIPS,
  CYBER_SEVA_ITEMS,
  type CyberSevaItem,
} from '../../data/cyberSevaGuide';
import type { AppLang } from '../../data/i18n';
import { printElementHtml } from '../../utils/printHelper';

interface CyberGuidePageProps {
  lang: AppLang;
  onBack: () => void;
  onOpenToolById: (toolId: string) => void;
}

const SAVED_SERVICES_KEY = 'pctool_cyber_saved_ids';

const CATEGORY_META: Record<
  CyberSevaItem['category'],
  { en: string; bn: string; badgeClass: string }
> = {
  identity: {
    en: 'Voter, PAN & Passport',
    bn: 'ভোটার, আধার ও পাসপোর্ট',
    badgeClass: 'bg-sky-600 text-white',
  },
  land: {
    en: 'Banglarbhumi & Land',
    bn: 'বাংলারভূমি ও খাজনা',
    badgeClass: 'bg-emerald-600 text-white',
  },
  welfare: {
    en: 'WB Welfare & Scholarships',
    bn: 'সার্টিফিকেট, ভাতা ও স্কলারশিপ',
    badgeClass: 'bg-amber-600 text-white',
  },
  finance: {
    en: 'PAN, PF, Tax & Trade',
    bn: 'প্যান, PF, চ্যালাণ ও ব্যবসা',
    badgeClass: 'bg-indigo-600 text-white',
  },
  transport: {
    en: 'DL, Vahan & Tickets',
    bn: 'ড্রাইভিং, গাড়ি ও টিকিট',
    badgeClass: 'bg-rose-600 text-white',
  },
  utility: {
    en: 'Photo, Meter & Gas',
    bn: 'ফটো, ইলেকট্রিক ও গ্যাস',
    badgeClass: 'bg-violet-600 text-white',
  },
};

function getContextualTools(item: CyberSevaItem): { id: string; labelBn: string; labelEn: string }[] {
  const base = [
    { id: 'wb-job-scheme-checklist', labelBn: 'ডকুমেন্ট চেকলিস্ট জেনারেটর', labelEn: 'Doc Checklist Maker' },
    { id: 'multi-slip-xerox-saver', labelBn: '২/৪-ইন-১ A4 জেরক্স সেভার', labelEn: '2/4-in-1 Xerox Saver' },
  ];
  if (item.category === 'land') {
    return [
      { id: 'wb-land-mutation-warish', labelBn: 'মিউটেশন ও ওয়ারিশ ফর্ম', labelEn: 'Mutation & Warish Form' },
      { id: 'age-land-calculator', labelBn: 'শতক-কাঠা-বিঘা ক্যালকুলেটর', labelEn: 'WB Land Area Calc' },
      ...base,
    ];
  }
  if (item.category === 'identity') {
    return [
      { id: 'passport-size-photo', labelBn: 'পাসপোর্ট ও ফ্রি-সাইজ ফটো', labelEn: 'Passport / Free-Size Photo' },
      { id: 'doc-scanner-cleaner', labelBn: 'ডকুমেন্ট স্ক্যান ক্লিনার', labelEn: 'Doc Scan Cleaner' },
      { id: 'aadhar-cropper', labelBn: 'আধার / প্যান / ভোটার ক্রপার', labelEn: 'ID Card Croppers' },
    ];
  }
  if (item.category === 'welfare') {
    return [
      { id: 'wb-lakshmir-bhandar', labelBn: 'লক্ষ্মীর ভাণ্ডার ও বাংলা ফর্ম', labelEn: 'WB Welfare Bengali Forms' },
      { id: 'wb-status-hub', labelBn: 'WB স্ট্যাটাস চেক হাব', labelEn: 'WB Status Check Hub' },
      ...base,
    ];
  }
  return [
    { id: 'doc-stamp-sign-placer', labelBn: 'ডকুমেন্ট হাইলাইট ও সই/স্ট্যাম্প', labelEn: 'Doc Highlight & Sign' },
    { id: 'batch-image-fixer', labelBn: 'ব্যাচ ছবি রোটেট ও PDF', labelEn: 'Batch Rotate & PDF' },
    ...base,
  ];
}

function splitProcessSteps(processBn: string): string[] {
  if (processBn.includes('→')) {
    return processBn
      .split('→')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  const numbered = processBn.split(/(?=[১-৯০]+\)\s)/).map((s) => s.trim()).filter(Boolean);
  if (numbered.length > 1) return numbered;
  return [processBn];
}

export const CyberGuidePage: React.FC<CyberGuidePageProps> = ({
  lang,
  onBack,
  onOpenToolById,
}) => {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<'all' | CyberSevaItem['category']>('all');
  const [onlySaved, setOnlySaved] = useState(false);
  const [activeId, setActiveId] = useState<string>(CYBER_SEVA_ITEMS[0].id);
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(SAVED_SERVICES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore storage issues
    }
    return [];
  });

  const detailPrintRef = useRef<HTMLDivElement | null>(null);
  const detailPaneRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(SAVED_SERVICES_KEY, JSON.stringify(savedIds));
    } catch {
      // ignore
    }
  }, [savedIds]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: CYBER_SEVA_ITEMS.length };
    for (const item of CYBER_SEVA_ITEMS) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    return counts;
  }, []);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return CYBER_SEVA_ITEMS.filter((item) => {
      if (onlySaved && !savedIds.includes(item.id)) return false;
      if (catFilter !== 'all' && item.category !== catFilter) return false;
      if (!q) return true;
      return (
        item.titleBn.toLowerCase().includes(q) ||
        item.titleEn.toLowerCase().includes(q) ||
        item.processBn.toLowerCase().includes(q) ||
        item.whyBn.toLowerCase().includes(q) ||
        (item.docsBn && item.docsBn.some((d) => d.toLowerCase().includes(q)))
      );
    });
  }, [search, catFilter, onlySaved, savedIds]);

  const activeItem =
    filteredItems.find((it) => it.id === activeId) ||
    filteredItems[0] ||
    CYBER_SEVA_ITEMS.find((it) => it.id === activeId) ||
    CYBER_SEVA_ITEMS[0];

  const handleSelectItem = (id: string) => {
    setActiveId(id);
    if (window.innerWidth < 1024 && detailPaneRef.current) {
      setTimeout(() => {
        detailPaneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
  };

  const toggleSaveService = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleDocCheck = (serviceId: string, idx: number) => {
    const key = `${serviceId}-${idx}`;
    setCheckedDocs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopyServiceInfo = async (item: CyberSevaItem) => {
    const portalLine = item.portals.map((p) => `${p.label}: ${p.url}`).join('\n');
    const docsList =
      item.docsBn && item.docsBn.length > 0
        ? `\n\n📄 প্রয়োজনীয় ডকুমেন্টস:\n${item.docsBn.map((d, i) => `${i + 1}. ${d}`).join('\n')}`
        : '';
    const formsList =
      item.formsBn && item.formsBn.length > 0
        ? `\n\n📝 প্রযোজ্য ফর্ম:\n${item.formsBn.map((f) => `• ${f}`).join('\n')}`
        : '';

    const text = [
      `📌 *${item.titleBn}* (${item.titleEn})`,
      `🌐 ${portalLine}`,
      docsList,
      formsList,
      `\n💰 ${item.feesBn}`,
    ]
      .filter(Boolean)
      .join('\n');

    await navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isSaved = savedIds.includes(activeItem.id);
  const steps = splitProcessSteps(activeItem.processBn);
  const meta = CATEGORY_META[activeItem.category];
  const contextualTools = getContextualTools(activeItem);

  return (
    <div className="max-w-[1320px] mx-auto px-4 lg:px-6 py-6 sm:py-8 space-y-6">
      {/* High-Contrast Header Command Banner */}
      <div className="rounded-3xl bg-slate-950 text-white border-2 border-slate-800 p-6 md:p-8 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-amber-300 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{lang === 'bn' ? 'হোমে ফিরুন' : 'Back to Home'}</span>
          </button>

          <div className="flex items-center gap-3 text-xs font-semibold text-slate-300 tabular-nums">
            <span>{CYBER_SEVA_ITEMS.length} {lang === 'bn' ? 'টি সরকারি সেবা' : 'Services'}</span>
            <span aria-hidden="true">·</span>
            <span>{lang === 'bn' ? 'সরাসরি পোর্টাল লিংক' : 'Verified Portal URLs'}</span>
            <span aria-hidden="true">·</span>
            <span>{lang === 'bn' ? 'কাজের ধাপ ও ফি' : 'Step SOPs & Fees'}</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
              <BookOpenCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                {lang === 'bn'
                  ? 'অল টাইপ অফ সাইবার সেবা — কাউন্টার ডেস্ক গাইডবুক'
                  : 'All Type Of Cyber Seva — Counter Operations Desk'}
              </h1>
              <p className="text-sm text-slate-300 mt-1.5 leading-relaxed max-w-3xl">
                {lang === 'bn'
                  ? `বাম দিকের তালিকা থেকে যেকোনো কাজ বাছুন — ডানদিকে মুহূর্তেই আসল ওয়েবসাইট লিংক, ডকুমেন্ট চেকলিস্ট, ধাপে ধাপে কাজের নিয়ম ও ফি দেখা যাবে।`
                  : `Select any of the ${CYBER_SEVA_ITEMS.length} services on the left index to inspect verified portal links, interactive document checklists, step-by-step SOPs, and standard fee rates.`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenToolById('wb-job-scheme-checklist')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs sm:text-sm font-black shadow-sm transition-colors cursor-pointer whitespace-nowrap shrink-0 self-start md:self-center"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{lang === 'bn' ? 'চাকরি ও প্রকল্প চেকলিস্ট টুল' : 'Job & Scheme Checklists'}</span>
          </button>
        </div>
      </div>

      {/* Search & High-Contrast Segmented Category Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-900/15 dark:border-slate-700 rounded-2xl p-4 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2.5 px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl focus-within:border-slate-950 dark:focus-within:border-amber-400 transition-colors">
            <Search className="w-4 h-4 text-slate-600 dark:text-slate-300 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                lang === 'bn'
                  ? 'কাজের নাম বা ডকুমেন্ট লিখুন (যেমন: ভোটার, প্যান, খাজনা, আধার, স্কলারশিপ, কৃষক)...'
                  : 'Search service or doc (e.g. Voter, PAN, Banglarbhumi, Scholarship, Ration)...'
              }
              className="w-full bg-transparent text-sm font-semibold text-slate-950 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOnlySaved((p) => !p)}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              onlySaved
                ? 'bg-amber-400 border-amber-500 text-slate-950'
                : 'bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:border-slate-900 dark:hover:border-amber-400'
            }`}
          >
            <Star className={`w-4 h-4 ${onlySaved ? 'fill-slate-950' : 'text-amber-500'}`} />
            <span>
              {lang === 'bn'
                ? `পিন করা (${savedIds.length})`
                : `Pinned (${savedIds.length})`}
            </span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCatFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
              catFilter === 'all'
                ? 'bg-slate-950 dark:bg-amber-400 text-white dark:text-slate-950 border-slate-950 dark:border-amber-400'
                : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-800 dark:text-slate-200 hover:border-slate-400'
            }`}
          >
            {lang === 'bn' ? `সব (${categoryCounts.all})` : `All (${categoryCounts.all})`}
          </button>

          {(Object.keys(CATEGORY_META) as CyberSevaItem['category'][]).map((catKey) => {
            const c = CATEGORY_META[catKey];
            const isActive = catFilter === catKey;
            return (
              <button
                key={catKey}
                type="button"
                onClick={() => setCatFilter(catKey)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 tabular-nums ${
                  isActive
                    ? 'bg-slate-950 dark:bg-amber-400 text-white dark:text-slate-950 border-slate-950 dark:border-amber-400'
                    : 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-800 dark:text-slate-200 hover:border-slate-400'
                }`}
              >
                {lang === 'bn' ? c.bn : c.en} ({categoryCounts[catKey] || 0})
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Split-Pane Counter Desk */}
      {filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-2xl p-12 text-center space-y-3">
          <div className="text-base font-extrabold text-slate-900 dark:text-white">
            {lang === 'bn'
              ? 'কোনো সেবা খুঁজে পাওয়া যায়নি'
              : 'No matching services found'}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {lang === 'bn'
              ? 'অনুগ্রহ করে সার্চ শব্দ বদলান অথবা ফিল্টার রিসেট করুন।'
              : 'Try adjusting your search keywords or reset category filters.'}
          </p>
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
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Pane: High-Contrast Service Directory Index */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border-2 border-slate-900/20 dark:border-slate-700 rounded-2xl overflow-hidden shadow-xs">
            <div className="px-4 py-3 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                {lang === 'bn'
                  ? `কাজের তালিকা (${filteredItems.length})`
                  : `Services Directory (${filteredItems.length})`}
              </span>
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                {lang === 'bn' ? 'বিস্তারিত দেখতে ক্লিক করুন' : 'Click any item →'}
              </span>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-[760px] overflow-y-auto">
              {filteredItems.map((item) => {
                const selected = activeItem.id === item.id;
                const itemSaved = savedIds.includes(item.id);
                const itemMeta = CATEGORY_META[item.category];
                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectItem(item.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') handleSelectItem(item.id);
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
                          : itemMeta.badgeClass
                      }`}
                    >
                      {item.number}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-extrabold leading-snug">
                        {item.titleBn}
                      </div>
                      <div
                        className={`text-xs mt-0.5 truncate ${
                          selected
                            ? 'text-slate-300 dark:text-slate-800 font-semibold'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {item.titleEn}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => toggleSaveService(item.id, e)}
                      aria-label={itemSaved ? 'Remove pin' : 'Pin service'}
                      className={`p-1.5 rounded-lg shrink-0 cursor-pointer transition-colors ${
                        selected
                          ? 'hover:bg-white/15 dark:hover:bg-black/10'
                          : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          itemSaved
                            ? selected
                              ? 'fill-amber-400 text-amber-400 dark:fill-slate-950 dark:text-slate-950'
                              : 'fill-amber-400 text-amber-500'
                            : selected
                            ? 'text-slate-400 dark:text-slate-700'
                            : 'text-slate-400'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Pane: Active Operational Field Card */}
          <div
            ref={detailPaneRef}
            id="cyber-detail-pane"
            className="lg:col-span-7 bg-white dark:bg-slate-900 border-2 border-slate-950 dark:border-slate-600 rounded-2xl overflow-hidden shadow-md"
          >
            {/* Dark High-Contrast Title Header */}
            <div className="bg-slate-950 text-white p-5 sm:p-6 border-b-2 border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <span className="tabular-nums">#{activeItem.number}</span>
                  <span aria-hidden="true">·</span>
                  <span>{lang === 'bn' ? meta.bn : meta.en}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleSaveService(activeItem.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      isSaved
                        ? 'bg-amber-400 text-slate-950 border-amber-400'
                        : 'bg-slate-900 text-slate-200 border-slate-700 hover:border-amber-400'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${isSaved ? 'fill-slate-950' : ''}`} />
                    <span>{isSaved ? (lang === 'bn' ? 'পিন করা' : 'Pinned') : (lang === 'bn' ? 'পিন করুন' : 'Pin')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyServiceInfo(activeItem)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {copiedId === activeItem.id ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {copiedId === activeItem.id
                        ? lang === 'bn'
                          ? 'কপি হয়েছে!'
                          : 'Copied!'
                        : lang === 'bn'
                        ? 'তথ্য কপি'
                        : 'Copy Info'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => printElementHtml(detailPrintRef.current, activeItem.titleEn)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-slate-950 hover:bg-slate-200 text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'প্রিন্ট গাইড' : 'Print SOP'}</span>
                  </button>
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
                {activeItem.titleBn}
              </h2>
              <div className="text-xs sm:text-sm font-semibold text-slate-300 mt-1">
                {activeItem.titleEn}
              </div>
            </div>

            {/* Printable & High-Contrast Detail Body */}
            <div ref={detailPrintRef} className="divide-y divide-slate-200 dark:divide-slate-800">
              {/* Purpose */}
              <div className="p-5 sm:p-6 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-950 dark:text-amber-300">
                  <HelpCircle className="w-4 h-4 text-sky-600 dark:text-amber-400" />
                  <span>{lang === 'bn' ? 'কেন আবেদন করা হয় ও কাজের উদ্দেশ্য' : 'Purpose & Use Case'}</span>
                </div>
                <p className="text-sm sm:text-[15px] font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
                  {lang === 'bn' ? activeItem.whyBn : `${activeItem.whyEn} (${activeItem.whyBn})`}
                </p>
              </div>

              {/* Official Live Portals */}
              {activeItem.portals.length > 0 && (
                <div className="p-5 sm:p-6 space-y-3 bg-slate-50/70 dark:bg-slate-950/50">
                  <div className="text-xs font-extrabold text-slate-950 dark:text-sky-300">
                    {lang === 'bn' ? 'অফিশিয়াল পোর্টাল (সরাসরি খুলুন)' : 'Official Government Portals'}
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {activeItem.portals.map((p) => (
                      <a
                        key={p.url}
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-sky-700 dark:bg-sky-500 dark:hover:bg-sky-400 text-white dark:text-slate-950 text-xs sm:text-sm font-extrabold shadow-xs transition-colors"
                      >
                        <span>{p.label}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Forms & Interactive Documents Verification */}
              {((activeItem.formsBn && activeItem.formsBn.length > 0) ||
                (activeItem.docsBn && activeItem.docsBn.length > 0)) && (
                <div className="p-5 sm:p-6 space-y-4">
                  {activeItem.formsBn && activeItem.formsBn.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-extrabold text-slate-950 dark:text-indigo-300">
                        {lang === 'bn' ? 'ফর্মের ধরন ও গাইডলাইন' : 'Applicable Form Numbers'}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {activeItem.formsBn.map((f, i) => (
                          <div
                            key={i}
                            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-extrabold text-slate-900 dark:text-white"
                          >
                            {f}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeItem.docsBn && activeItem.docsBn.length > 0 && (() => {
                    const docsTotal = activeItem.docsBn.length;
                    const docsVerified = activeItem.docsBn.filter((_, idx) =>
                      Boolean(checkedDocs[`${activeItem.id}-${idx}`])
                    ).length;
                    const pct = docsTotal > 0 ? Math.round((docsVerified / docsTotal) * 100) : 0;

                    return (
                      <div className="space-y-3">
                        <div className="rounded-2xl bg-slate-950 text-white p-4 border-2 border-slate-800 space-y-2.5 print:bg-white print:text-slate-950 print:border-slate-300">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-emerald-300 print:text-slate-950">
                              <FileCheck className="w-4 h-4 text-emerald-400 print:text-slate-950" />
                              <span>
                                {lang === 'bn'
                                  ? 'প্রয়োজনীয় ডকুমেন্টস চেকলিস্ট (ক্লিক করে যাচাই করুন)'
                                  : 'Required Documents Checklist (Click to Verify)'}
                              </span>
                            </div>
                            <span
                              className={`px-2.5 py-1 rounded-lg text-xs font-black tabular-nums no-print ${
                                docsVerified === docsTotal
                                  ? 'bg-emerald-400 text-slate-950'
                                  : 'bg-slate-800 text-white border border-slate-700'
                              }`}
                            >
                              {docsVerified} / {docsTotal}{' '}
                              {lang === 'bn' ? 'যাচাইকৃত' : 'Checked'}
                            </span>
                          </div>

                          <div className="space-y-1 no-print">
                            <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className="h-full bg-emerald-400 transition-all duration-300"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                              <span>
                                {docsVerified === docsTotal
                                  ? lang === 'bn'
                                    ? 'সব কাগজপত্র প্রস্তুত — পোর্টালে আবেদন করুন'
                                    : 'All Documents Verified — Ready to Apply'
                                  : lang === 'bn'
                                  ? 'কাস্টমারের নথি হাতে নিয়ে একে একে টিক দিন'
                                  : 'Click each row as customer presents documents'}
                              </span>
                              <span className="tabular-nums text-emerald-300">{pct}%</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {activeItem.docsBn.map((doc, i) => {
                            const checked = Boolean(checkedDocs[`${activeItem.id}-${i}`]);
                            return (
                              <button
                                key={i}
                                type="button"
                                onClick={() => toggleDocCheck(activeItem.id, i)}
                                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                                  checked
                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-600 text-emerald-950 dark:text-emerald-100'
                                    : 'bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-950 dark:text-slate-100 hover:border-slate-950 dark:hover:border-amber-400'
                                }`}
                              >
                                <span
                                  className={`w-7 h-7 rounded-lg text-[11px] font-black flex items-center justify-center shrink-0 tabular-nums ${
                                    checked
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-slate-950 dark:bg-slate-800 text-amber-300'
                                  }`}
                                >
                                  {String(i + 1).padStart(2, '0')}
                                </span>
                                {checked ? (
                                  <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                ) : (
                                  <Square className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
                                )}
                                <span
                                  className={`flex-1 text-xs sm:text-sm font-bold leading-snug ${
                                    checked ? 'line-through opacity-75' : ''
                                  }`}
                                >
                                  {doc}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-wide shrink-0 no-print ${
                                    checked
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600'
                                  }`}
                                >
                                  {checked
                                    ? lang === 'bn'
                                      ? 'প্রস্তুত'
                                      : 'READY'
                                    : lang === 'bn'
                                    ? 'বাকি'
                                    : 'PENDING'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Step-by-Step Counter Workflow */}
              <div className="p-5 sm:p-6 space-y-3.5 bg-slate-50/80 dark:bg-slate-950/60">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-slate-950 dark:text-amber-300">
                    <span className="w-7 h-7 rounded-lg bg-slate-950 dark:bg-amber-400 text-amber-300 dark:text-slate-950 flex items-center justify-center shrink-0">
                      <ListOrdered className="w-4 h-4" />
                    </span>
                    <span>
                      {lang === 'bn'
                        ? 'কাজ কীভাবে করবেন — ধাপে ধাপে পদ্ধতি (Step-by-Step)'
                        : 'Step-by-Step Operating Procedure'}
                    </span>
                  </div>
                  <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 tabular-nums">
                    {steps.length} {lang === 'bn' ? 'টি ধাপ' : 'Steps'}
                  </span>
                </div>

                <div className="space-y-3">
                  {steps.map((stepText, idx) => (
                    <div
                      key={idx}
                      className="flex items-stretch gap-3 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 overflow-hidden shadow-xs"
                    >
                      <div className="px-3 py-3 bg-slate-950 dark:bg-amber-400 text-amber-300 dark:text-slate-950 flex flex-col items-center justify-center shrink-0 min-w-[64px]">
                        <span className="text-[9px] font-black tracking-widest uppercase opacity-80">
                          {lang === 'bn' ? 'ধাপ' : 'STEP'}
                        </span>
                        <span className="text-base font-black tabular-nums leading-none mt-0.5">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                      </div>
                      <div className="p-3.5 flex items-center">
                        <p className="text-xs sm:text-sm font-bold text-slate-950 dark:text-slate-100 leading-relaxed">
                          {stepText}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* High-Contrast Fees Banner */}
              <div className="p-5 sm:p-6 bg-emerald-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-2.5">
                  <IndianRupee className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                      {lang === 'bn' ? 'সরকারি ফি ও আনুমানিক ক্যাফে চার্জ' : 'Govt Fee & Recommended Counter Rate'}
                    </div>
                    <div className="text-sm sm:text-base font-extrabold text-white tabular-nums mt-0.5">
                      {activeItem.feesBn}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contextual Quick PC Tool Launchers */}
              <div className="p-5 sm:p-6 bg-slate-50 dark:bg-slate-950/60 space-y-2.5 no-print">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 dark:text-slate-200">
                  <Wrench className="w-3.5 h-3.5 text-violet-600 dark:text-amber-400" />
                  <span>
                    {lang === 'bn'
                      ? 'এই কাজের ফটো/ডকুমেন্ট তৈরি করতে PC Tool খুলুন:'
                      : 'Open matching PC Tool utilities for this service:'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {contextualTools.map((tool) => (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => onOpenToolById(tool.id)}
                      className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 hover:border-slate-950 dark:hover:border-amber-400 text-xs font-extrabold text-slate-950 dark:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {lang === 'bn' ? tool.labelBn : tool.labelEn} →
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* High-Contrast Counter Productivity Utilities */}
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-950 dark:border-slate-700 rounded-2xl overflow-hidden shadow-md">
        <div className="bg-slate-950 text-white px-5 py-4 border-b-2 border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
              <Wrench className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">
                {lang === 'bn'
                  ? 'দোকানের প্রতিদিনের কাজে সহায়ক দ্রুত টুলস'
                  : 'Essential Counter Utilities for Faster Delivery'}
              </h3>
              <p className="text-[11px] font-semibold text-slate-400">
                {lang === 'bn'
                  ? 'সরাসরি ক্লিক করে কাস্টমারের ছবি, স্লিপ ও PDF কাজ দ্রুত শেষ করুন'
                  : 'Launch any counter utility directly to process customer files faster'}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-lg bg-slate-800 text-amber-300 text-xs font-black tabular-nums">
            {CYBER_QUICK_TIPS.length} {lang === 'bn' ? 'টি টুল' : 'Tools'}
          </span>
        </div>

        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50/60 dark:bg-slate-950/40">
          {CYBER_QUICK_TIPS.map((tip, idx) => {
            const accents = [
              'bg-sky-400 text-slate-950',
              'bg-emerald-400 text-slate-950',
              'bg-amber-400 text-slate-950',
              'bg-indigo-400 text-slate-950',
              'bg-rose-400 text-slate-950',
              'bg-teal-400 text-slate-950',
            ];
            const badgeStyle = accents[idx % accents.length];
            return (
              <button
                key={tip.toolId}
                type="button"
                onClick={() => onOpenToolById(tip.toolId)}
                className="group rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-900/15 dark:border-slate-700 hover:border-slate-950 dark:hover:border-amber-400 text-left transition-all cursor-pointer overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md"
              >
                <div>
                  <div className="bg-slate-950 text-white px-4 py-2.5 flex items-center justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-black tabular-nums ${badgeStyle}`}>
                      #{String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[11px] font-black text-amber-300 group-hover:text-white transition-colors whitespace-nowrap">
                      {lang === 'bn' ? 'টুল খুলুন →' : 'OPEN TOOL →'}
                    </span>
                  </div>
                  <div className="p-4 space-y-1.5">
                    <div className="text-sm font-black text-slate-950 dark:text-white leading-snug">
                      {tip.name}
                    </div>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                      {lang === 'bn' ? tip.descBn : tip.descEn}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

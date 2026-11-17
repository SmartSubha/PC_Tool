import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckSquare,
  Square,
  ExternalLink,
  Printer,
  Copy,
  Check,
  Plus,
  Wrench,
  Camera,
  FileSignature,
  Search,
  Star,
  X,
  ListOrdered,
  IndianRupee,
  RotateCcw,
} from 'lucide-react';
import { WB_CHECKLIST_PRESETS, type WbChecklistPreset } from '../../data/wbChecklists';
import type { AppLang } from '../../data/i18n';
import { printElementHtml } from '../../utils/printHelper';

interface ChecklistGeneratorWorkspaceProps {
  appLang: AppLang;
  onOpenToolById?: (toolId: string) => void;
}

const SAVED_CHECKLIST_KEY = 'pctool_checklist_saved_ids';

const CATEGORY_META: Record<
  WbChecklistPreset['category'],
  { en: string; bn: string; badgeClass: string }
> = {
  job: {
    en: 'Govt Jobs (SSC / RRB / WBP)',
    bn: 'সরকারি চাকরি',
    badgeClass: 'bg-indigo-600 text-white',
  },
  identity: {
    en: 'PAN / Voter / Passport',
    bn: 'প্যান / ভোটার / পাসপোর্ট',
    badgeClass: 'bg-sky-600 text-white',
  },
  welfare: {
    en: 'Ration / Caste / Welfare',
    bn: 'রেশন / কাস্ট / ভাতা',
    badgeClass: 'bg-amber-600 text-white',
  },
  education: {
    en: 'Scholarships',
    bn: 'স্কলারশিপ',
    badgeClass: 'bg-emerald-600 text-white',
  },
};

const TOOL_LABELS: Record<string, { en: string; bn: string }> = {
  'passport-size-photo': { en: 'Passport & Free-Size Photo', bn: 'পাসপোর্ট ও ফ্রি-সাইজ ফটো' },
  'image-compress': { en: 'Exact KB Compressor', bn: 'নির্দিষ্ট KB কমপ্রেস' },
  'resize-image': { en: 'Pixel Resizer', bn: 'পিক্সেল রিসাইজার' },
  'photo-signature-combiner': { en: 'Photo+Sign Combiner', bn: 'ফটো+সই জোড়া' },
  'image-to-pdf': { en: 'Image to PDF', bn: 'ছবি থেকে PDF' },
  'pdf-compress': { en: 'PDF Compress', bn: 'PDF কমপ্রেস' },
  'pdf-merge': { en: 'PDF Merge', bn: 'PDF মার্জ' },
  'doc-scanner-cleaner': { en: 'Doc Scan Cleaner', bn: 'স্ক্যান ক্লিনার' },
  'age-land-calculator': { en: 'Age Calculator', bn: 'বয়স ক্যালকুলেটর' },
  'wb-caste-genealogy': { en: 'WB Caste Form', bn: 'বাংলা কাস্ট ফর্ম' },
  'caste-affidavit-form3': { en: 'Form-3 Affidavit', bn: 'Form-3 বংশতালিকা' },
  'wb-lakshmir-bhandar': { en: 'Lakshmir Bhandar Form', bn: 'লক্ষ্মীর ভাণ্ডার ফর্ম' },
  'wb-status-hub': { en: 'WB Status Hub', bn: 'WB স্ট্যাটাস হাব' },
  'voter-cropper': { en: 'Voter ID Cropper', bn: 'ভোটার কার্ড ক্রপার' },
};

function splitWorkflowSteps(text: string): string[] {
  const parts = text
    .split(/(?=[১-৯০0-9]+\)\s)/)
    .map((s) => s.trim().replace(/^[১-৯০0-9]+\)\s*/, ''))
    .filter(Boolean);
  return parts.length > 0 ? parts : [text];
}

export const ChecklistGeneratorWorkspace: React.FC<ChecklistGeneratorWorkspaceProps> = ({
  appLang,
  onOpenToolById,
}) => {
  const [lang, setLang] = useState<AppLang>(appLang);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<'all' | WbChecklistPreset['category']>('all');
  const [onlySaved, setOnlySaved] = useState(false);
  const [selectedId, setSelectedId] = useState<string>(WB_CHECKLIST_PRESETS[0].id);

  // All customer fields strictly start empty
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [noteText, setNoteText] = useState('');
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});
  const [customDocsByPreset, setCustomDocsByPreset] = useState<Record<string, string[]>>({});
  const [newCustomDoc, setNewCustomDoc] = useState('');
  const [copied, setCopied] = useState(false);

  const [savedIds, setSavedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(SAVED_CHECKLIST_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore storage issues
    }
    return [];
  });

  const printRef = useRef<HTMLDivElement | null>(null);
  const detailPaneRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLang(appLang);
  }, [appLang]);

  useEffect(() => {
    try {
      localStorage.setItem(SAVED_CHECKLIST_KEY, JSON.stringify(savedIds));
    } catch {
      // ignore
    }
  }, [savedIds]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: WB_CHECKLIST_PRESETS.length };
    for (const p of WB_CHECKLIST_PRESETS) {
      counts[p.category] = (counts[p.category] || 0) + 1;
    }
    return counts;
  }, []);

  const visiblePresets = useMemo(() => {
    const q = search.trim().toLowerCase();
    return WB_CHECKLIST_PRESETS.filter((p) => {
      if (onlySaved && !savedIds.includes(p.id)) return false;
      if (catFilter !== 'all' && p.category !== catFilter) return false;
      if (!q) return true;
      return (
        p.titleBn.toLowerCase().includes(q) ||
        p.titleEn.toLowerCase().includes(q) ||
        p.portalName.toLowerCase().includes(q) ||
        p.requiredDocsBn.some((d) => d.toLowerCase().includes(q)) ||
        p.requiredDocsEn.some((d) => d.toLowerCase().includes(q))
      );
    });
  }, [search, catFilter, onlySaved, savedIds]);

  const preset =
    visiblePresets.find((p) => p.id === selectedId) ||
    visiblePresets[0] ||
    WB_CHECKLIST_PRESETS.find((p) => p.id === selectedId) ||
    WB_CHECKLIST_PRESETS[0];

  const customDocs = customDocsByPreset[preset.id] || [];
  const baseDocs = lang === 'bn' ? preset.requiredDocsBn : preset.requiredDocsEn;
  const allDocs = [...baseDocs, ...customDocs];

  const toggleDoc = (idx: number) => {
    const key = `${preset.id}-${idx}`;
    setCheckedDocs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSavePreset = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectPreset = (id: string) => {
    setSelectedId(id);
    setCopied(false);
    if (window.innerWidth < 1024 && detailPaneRef.current) {
      setTimeout(() => {
        detailPaneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
  };

  const handleAddCustomDoc = () => {
    if (!newCustomDoc.trim()) return;
    setCustomDocsByPreset((prev) => ({
      ...prev,
      [preset.id]: [...(prev[preset.id] || []), newCustomDoc.trim()],
    }));
    setNewCustomDoc('');
  };

  const handleClearChecksForPreset = () => {
    setCheckedDocs((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (k.startsWith(`${preset.id}-`)) delete next[k];
      });
      return next;
    });
  };

  const handleCopySummary = async () => {
    const ready: string[] = [];
    const missing: string[] = [];
    allDocs.forEach((doc, idx) => {
      if (checkedDocs[`${preset.id}-${idx}`]) ready.push(`✅ ${doc}`);
      else missing.push(`⬜ ${doc}`);
    });

    const lines = [
      `📋 *${lang === 'bn' ? preset.titleBn : preset.titleEn}*`,
      customerName.trim()
        ? `👤 ${lang === 'bn' ? 'আবেদনকারী' : 'Applicant'}: ${customerName.trim()}`
        : '',
      `🌐 ${preset.portalName}: ${preset.portalUrl}`,
      `📷 ${lang === 'bn' ? 'ছবির মাপ' : 'Photo Spec'}: ${lang === 'bn' ? preset.photoSpecBn : preset.photoSpecEn}`,
      `✍️ ${lang === 'bn' ? 'সইয়ের মাপ' : 'Sign Spec'}: ${lang === 'bn' ? preset.signSpecBn : preset.signSpecEn}`,
      '',
      missing.length > 0
        ? `${lang === 'bn' ? '📌 যে নথিগুলো নিয়ে আসবেন / বাকি আছে:' : '📌 Documents Needed / Missing:'}\n${missing.join('\n')}`
        : `🎉 ${lang === 'bn' ? 'সমস্ত ডকুমেন্ট সম্পূর্ণ আছে!' : 'All documents complete!'}`,
      ready.length > 0
        ? `\n${lang === 'bn' ? '✔️ জমা করা হয়েছে:' : '✔️ Ready:'}\n${ready.join('\n')}`
        : '',
      noteText.trim() ? `\n📝 Note: ${noteText.trim()}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    await navigator.clipboard.writeText(lines);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const doneCount = allDocs.filter((_, idx) => checkedDocs[`${preset.id}-${idx}`]).length;
  const steps = splitWorkflowSteps(lang === 'bn' ? preset.stepsBn : preset.stepsEn);
  const presetIndex = WB_CHECKLIST_PRESETS.findIndex((p) => p.id === preset.id) + 1;
  const meta = CATEGORY_META[preset.category];
  const isSaved = savedIds.includes(preset.id);

  return (
    <div className="space-y-5">
      {/* High-Contrast Search + Category Segmented Controls Bar */}
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-900/15 dark:border-slate-700 rounded-2xl p-4 space-y-3 shadow-xs no-print">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2.5 px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl focus-within:border-slate-950 dark:focus-within:border-amber-400 transition-colors">
            <Search className="w-4 h-4 text-slate-600 dark:text-slate-300 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                lang === 'bn'
                  ? 'চাকরি বা প্রকল্প খুঁজুন (যেমন: SSC, রেল, পুলিশ, প্যান, রেশন, কাস্ট, লক্ষ্মীর ভাণ্ডার)...'
                  : 'Search exam or scheme (e.g. SSC, Railway, WBP, PAN, Ration, SVMCM)...'
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

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setOnlySaved((p) => !p)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border-2 text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                onlySaved
                  ? 'bg-amber-400 border-amber-500 text-slate-950'
                  : 'bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:border-slate-950 dark:hover:border-amber-400'
              }`}
            >
              <Star className={`w-4 h-4 ${onlySaved ? 'fill-slate-950' : 'text-amber-500'}`} />
              <span>{lang === 'bn' ? `পিন (${savedIds.length})` : `Pinned (${savedIds.length})`}</span>
            </button>

            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-1">
              <button
                type="button"
                onClick={() => setLang('bn')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-colors ${
                  lang === 'bn'
                    ? 'bg-slate-950 dark:bg-amber-400 text-white dark:text-slate-950'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                বাংলা
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-colors ${
                  lang === 'en'
                    ? 'bg-slate-950 dark:bg-amber-400 text-white dark:text-slate-950'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                English
              </button>
            </div>
          </div>
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
            {lang === 'bn' ? `সবগুলো (${categoryCounts.all})` : `All (${categoryCounts.all})`}
          </button>

          {(Object.keys(CATEGORY_META) as WbChecklistPreset['category'][]).map((catKey) => {
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

      {/* Main High-Contrast Split-Pane Desk */}
      {visiblePresets.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-2xl p-10 text-center space-y-3">
          <div className="text-base font-extrabold text-slate-900 dark:text-white">
            {lang === 'bn' ? 'কোনো চাকরি বা প্রকল্প মেলেনি' : 'No matching exam or scheme found'}
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
            {lang === 'bn' ? 'ফিল্টার রিসেট করুন' : 'Reset Filters'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Directory Index */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border-2 border-slate-900/20 dark:border-slate-700 rounded-2xl overflow-hidden shadow-xs no-print">
            <div className="px-4 py-3 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                {lang === 'bn'
                  ? `চাকরি ও প্রকল্প তালিকা (${visiblePresets.length})`
                  : `Exams & Schemes (${visiblePresets.length})`}
              </span>
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                {lang === 'bn' ? 'ক্লিক করে বিস্তারিত দেখুন' : 'Click to inspect →'}
              </span>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-[780px] overflow-y-auto">
              {visiblePresets.map((item) => {
                const selected = preset.id === item.id;
                const itemSaved = savedIds.includes(item.id);
                const itemMeta = CATEGORY_META[item.category];
                const globalNum = WB_CHECKLIST_PRESETS.findIndex((p) => p.id === item.id) + 1;
                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectPreset(item.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') handleSelectPreset(item.id);
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
                      {String(globalNum).padStart(2, '0')}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-extrabold leading-snug">
                        {lang === 'bn' ? item.titleBn : item.titleEn}
                      </div>
                      <div
                        className={`text-xs mt-0.5 truncate ${
                          selected
                            ? 'text-slate-300 dark:text-slate-800 font-semibold'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {item.portalName}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => toggleSavePreset(item.id, e)}
                      aria-label={itemSaved ? 'Remove pin' : 'Pin item'}
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

          {/* Right Pane: High-Contrast Active Job & Scheme Workbench */}
          <div
            ref={detailPaneRef}
            id="checklist-detail-pane"
            className="lg:col-span-7 bg-white dark:bg-slate-900 border-2 border-slate-950 dark:border-slate-600 rounded-2xl overflow-hidden shadow-md"
          >
            {/* Dark High-Contrast Header Band */}
            <div className="bg-slate-950 text-white p-5 sm:p-6 border-b-2 border-slate-800 space-y-4 no-print">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <span className="tabular-nums">#{String(presetIndex).padStart(2, '0')}</span>
                  <span aria-hidden="true">·</span>
                  <span>{lang === 'bn' ? meta.bn : meta.en}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleSavePreset(preset.id)}
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
                    onClick={handleCopySummary}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>
                      {copied
                        ? lang === 'bn'
                          ? 'কপি হয়েছে!'
                          : 'Copied!'
                        : lang === 'bn'
                        ? 'মেসেজ কপি'
                        : 'Copy Msg'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => printElementHtml(printRef.current, preset.titleEn)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-slate-950 hover:bg-slate-200 text-xs font-extrabold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'স্লিপ প্রিন্ট (A4)' : 'Print Slip'}</span>
                  </button>
                </div>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
                  {lang === 'bn' ? preset.titleBn : preset.titleEn}
                </h2>
                <div className="text-xs sm:text-sm font-semibold text-slate-300 mt-1">
                  {lang === 'bn' ? preset.titleEn : preset.titleBn}
                </div>
              </div>

              {/* Official Real Portal Links */}
              <div className="flex flex-wrap gap-2.5 pt-1">
                <a
                  href={preset.portalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 text-xs sm:text-sm font-black transition-colors"
                >
                  <span>{preset.portalName}</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>
                {preset.secondaryPortal && (
                  <a
                    href={preset.secondaryPortal.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-xs sm:text-sm font-bold transition-colors"
                  >
                    <span>{preset.secondaryPortal.label}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                )}
              </div>
            </div>

            {/* Clean Hairline-Divided Desk Body */}
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {/* Photo & Signature Specs + Quick Tool Launchers */}
              <div className="p-5 sm:p-6 space-y-4 bg-slate-50/70 dark:bg-slate-950/50 no-print">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-sky-700 dark:text-sky-300 mb-1">
                      <Camera className="w-4 h-4" />
                      <span>{lang === 'bn' ? 'ফটো সাইজ ও KB নিয়ম' : 'Photo Size & KB Rule'}</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                      {lang === 'bn' ? preset.photoSpecBn : preset.photoSpecEn}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-700 dark:text-amber-300 mb-1">
                      <FileSignature className="w-4 h-4" />
                      <span>{lang === 'bn' ? 'স্বাক্ষর (Signature) সাইজ' : 'Signature Size & KB'}</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                      {lang === 'bn' ? preset.signSpecBn : preset.signSpecEn}
                    </div>
                  </div>
                </div>

                {onOpenToolById && preset.quickToolIds.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 dark:text-slate-200">
                      <Wrench className="w-3.5 h-3.5 text-violet-600 dark:text-amber-400" />
                      <span>
                        {lang === 'bn'
                          ? 'এক ক্লিকে ফটো ও ডকুমেন্ট তৈরি করতে PC Tool খুলুন:'
                          : 'Prepare Photo, Signature & PDF in 1-Click:'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {preset.quickToolIds.map((tid) => {
                        const lbl = TOOL_LABELS[tid];
                        if (!lbl) return null;
                        return (
                          <button
                            key={tid}
                            type="button"
                            onClick={() => onOpenToolById(tid)}
                            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 hover:border-slate-950 dark:hover:border-amber-400 text-xs font-extrabold text-slate-950 dark:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
                          >
                            {lang === 'bn' ? lbl.bn : lbl.en} →
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Empty-Default Customer Info + Add Custom Doc */}
              <div className="p-5 sm:p-6 space-y-3 no-print">
                <div className="text-xs font-extrabold text-slate-950 dark:text-slate-200">
                  {lang === 'bn'
                    ? 'কাস্টমার স্লিপের জন্য তথ্য (ঐচ্ছিক — খালি রাখলে প্রিন্টে আসবে না)'
                    : 'Optional Customer Slip Details (Empty by default)'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={lang === 'bn' ? 'আবেদনকারীর নাম' : 'Applicant Name'}
                    className="px-3 py-2 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-950 dark:text-white rounded-xl text-xs font-semibold focus:outline-none focus:border-slate-950 dark:focus:border-amber-400"
                  />
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder={lang === 'bn' ? 'মোবাইল নম্বর' : 'Mobile Number'}
                    className="px-3 py-2 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-950 dark:text-white rounded-xl text-xs font-semibold focus:outline-none focus:border-slate-950 dark:focus:border-amber-400"
                  />
                  <input
                    type="text"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder={lang === 'bn' ? 'শেষ তারিখ / মন্তব্য' : 'Deadline / Note'}
                    className="px-3 py-2 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-950 dark:text-white rounded-xl text-xs font-semibold focus:outline-none focus:border-slate-950 dark:focus:border-amber-400"
                  />
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCustomDoc}
                    onChange={(e) => setNewCustomDoc(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddCustomDoc();
                    }}
                    placeholder={
                      lang === 'bn'
                        ? 'অতিরিক্ত কোনো ডকুমেন্ট তালিকায় যোগ করুন...'
                        : 'Add an extra custom document item...'
                    }
                    className="flex-1 px-3 py-2 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-950 dark:text-white rounded-xl text-xs font-semibold focus:outline-none focus:border-slate-950 dark:focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomDoc}
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-950 dark:bg-amber-400 text-white dark:text-slate-950 text-xs font-extrabold cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'যোগ করুন' : 'Add'}</span>
                  </button>
                </div>
              </div>

              {/* Interactive Checklist & Crisp A4 Print Area */}
              <div ref={printRef} className="print-area p-5 sm:p-6 space-y-4 bg-white dark:bg-slate-900">
                <div className="rounded-2xl bg-slate-950 text-white p-4 border-2 border-slate-800 space-y-3 print:bg-white print:text-slate-950 print:border-slate-300">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-xs sm:text-sm font-black text-amber-300 print:text-slate-950">
                        {lang === 'bn'
                          ? 'প্রয়োজনীয় ডকুমেন্টস চেকলিস্ট (ক্লিক করে যাচাই করুন)'
                          : 'Required Documents Checklist (Click to Verify)'}
                      </div>
                      <div className="hidden print:block text-sm font-black text-slate-950 mt-1">
                        {lang === 'bn' ? preset.titleBn : preset.titleEn} — {preset.portalUrl}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 no-print">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-black tabular-nums ${
                          doneCount === allDocs.length && allDocs.length > 0
                            ? 'bg-emerald-400 text-slate-950'
                            : 'bg-slate-800 text-white border border-slate-700'
                        }`}
                      >
                        {doneCount} / {allDocs.length}{' '}
                        {lang === 'bn' ? 'যাচাইকৃত' : 'Checked'}
                      </span>
                      {doneCount > 0 && (
                        <button
                          type="button"
                          onClick={handleClearChecksForPreset}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-200 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>{lang === 'bn' ? 'রিসেট' : 'Reset'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Dynamic Verification Progress Bar */}
                  <div className="space-y-1 no-print">
                    <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 transition-all duration-300"
                        style={{
                          width: `${allDocs.length > 0 ? Math.round((doneCount / allDocs.length) * 100) : 0}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                      <span>
                        {doneCount === allDocs.length && allDocs.length > 0
                          ? lang === 'bn'
                            ? 'সব ডকুমেন্ট সম্পূর্ণ প্রস্তুত — আবেদন শুরু করুন'
                            : 'All Documents Ready — Proceed to Portal'
                          : lang === 'bn'
                          ? 'কাস্টমারের নথি মিলিয়ে একে একে টিক দিন'
                          : 'Click each row as customer presents documents'}
                      </span>
                      <span className="tabular-nums text-emerald-300">
                        {allDocs.length > 0 ? Math.round((doneCount / allDocs.length) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                </div>

                {(customerName.trim() || customerPhone.trim() || noteText.trim()) && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-slate-100 dark:bg-slate-950 p-3 rounded-xl border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                    <div>
                      <strong>{lang === 'bn' ? 'নাম:' : 'Applicant:'}</strong>{' '}
                      {customerName.trim() || '—'}
                    </div>
                    <div>
                      <strong>{lang === 'bn' ? 'মোবাইল:' : 'Phone:'}</strong>{' '}
                      {customerPhone.trim() || '—'}
                    </div>
                    <div>
                      <strong>{lang === 'bn' ? 'নোট:' : 'Note:'}</strong>{' '}
                      {noteText.trim() || '—'}
                    </div>
                  </div>
                )}

                <div className="space-y-2.5">
                  {allDocs.map((doc, idx) => {
                    const isChecked = Boolean(checkedDocs[`${preset.id}-${idx}`]);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleDoc(idx)}
                        className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-600 text-emerald-950 dark:text-emerald-100'
                            : 'bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-950 dark:text-slate-100 hover:border-slate-950 dark:hover:border-amber-400'
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-lg text-[11px] font-black flex items-center justify-center shrink-0 tabular-nums ${
                            isChecked
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-950 dark:bg-slate-800 text-amber-300'
                          }`}
                        >
                          {String(idx + 1).padStart(2, '0')}
                        </span>

                        {isChecked ? (
                          <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
                        )}

                        <span
                          className={`flex-1 text-xs sm:text-sm font-bold leading-snug ${
                            isChecked ? 'line-through opacity-75' : ''
                          }`}
                        >
                          {doc}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-wide shrink-0 no-print ${
                            isChecked
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {isChecked
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

                {/* Spec footer included on printed A4 customer slip */}
                <div className="hidden print:grid grid-cols-2 gap-3 pt-3 border-t border-slate-300 text-xs text-slate-800">
                  <div>
                    <strong>{lang === 'bn' ? 'ফটো:' : 'Photo:'}</strong>{' '}
                    {lang === 'bn' ? preset.photoSpecBn : preset.photoSpecEn}
                  </div>
                  <div>
                    <strong>{lang === 'bn' ? 'স্বাক্ষর:' : 'Signature:'}</strong>{' '}
                    {lang === 'bn' ? preset.signSpecBn : preset.signSpecEn}
                  </div>
                </div>
              </div>

              {/* High-Contrast Step-by-Step Workflow */}
              <div className="p-5 sm:p-6 space-y-3.5 bg-slate-50/80 dark:bg-slate-950/60 no-print">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-slate-950 dark:text-amber-300">
                    <span className="w-7 h-7 rounded-lg bg-slate-950 dark:bg-amber-400 text-amber-300 dark:text-slate-950 flex items-center justify-center shrink-0">
                      <ListOrdered className="w-4 h-4" />
                    </span>
                    <span>
                      {lang === 'bn'
                        ? 'কাজ কীভাবে করবেন (স্টেপ-বাই-স্টেপ পদ্ধতি)'
                        : 'How To Process Step-by-Step'}
                    </span>
                  </div>
                  <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 tabular-nums">
                    {steps.length} {lang === 'bn' ? 'টি ধাপ' : 'Steps'}
                  </span>
                </div>

                <div className="relative space-y-3">
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

              {/* High-Contrast Govt Fee & Recommended Charge Banner */}
              <div className="p-5 sm:p-6 bg-emerald-950 text-white flex items-start sm:items-center gap-3 no-print">
                <IndianRupee className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                    {lang === 'bn' ? 'সরকারি ফি ও ক্যাফে সার্ভিস চার্জ' : 'Official Fee & Recommended Rate'}
                  </div>
                  <div className="text-sm sm:text-base font-extrabold text-white tabular-nums mt-0.5">
                    {preset.approxFeeBn}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

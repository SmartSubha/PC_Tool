import React, { useEffect, useMemo, useState } from 'react';
import {
  TrendingUp,
  ShieldCheck,
  MonitorSmartphone,
  ArrowLeft,
  SearchX,
  ChevronDown,
  Lock,
  BookOpenCheck,
  Sparkles,
  Clock,
  Star,
  Megaphone,
  Trash2,
  EyeOff,
} from 'lucide-react';
import {
  CATEGORIES,
  POPULAR_TOOL_IDS,
  TOOLS_CATALOG,
  type ToolCategoryId,
  type ToolItem,
} from './data/toolsCatalog';
import { OWNER_CONFIG } from './data/ownerConfig';
import { UI_TEXT, type AppLang } from './data/i18n';
import { Header, type ActivePage } from './components/Header';
import { Footer } from './components/Footer';
import { CategoryIcon, ToolVisualIcon } from './components/ToolIcon';
import { ImageToolsWorkspace } from './components/tools/ImageToolsWorkspace';
import { PdfToolsWorkspace } from './components/tools/PdfToolsWorkspace';
import { IdCardCropperWorkspace } from './components/tools/IdCardCropperWorkspace';
import { DocumentToolsWorkspace } from './components/tools/DocumentToolsWorkspace';
import { EventCardsWorkspace } from './components/tools/EventCardsWorkspace';
import { UtilityToolsWorkspace } from './components/tools/UtilityToolsWorkspace';
import { PostersPage } from './components/pages/PostersPage';
import { ContactPage } from './components/pages/ContactPage';
import { LegalAndInfoPages } from './components/pages/LegalAndInfoPages';
import { CyberGuidePage } from './components/pages/CyberGuidePage';
import { StatusHubPage } from './components/pages/StatusHubPage';
import { AdminInboxModal, type SiteAdminSettings } from './components/AdminInboxModal';
import { OfflineIndicator } from './components/PWAInstallBanner';
import { PrintPreviewModal } from './components/PrintPreviewModal';
import { MobileCustomerDropClient } from './components/tools/MobilePcQrTransfer';

const VALID_TOOL_IDS = new Set(TOOLS_CATALOG.map((item) => item.id));
const RECENT_STORAGE_KEY = 'pctool_recent_tools';
const FAVORITES_STORAGE_KEY = 'pctool_favorite_tools';
const THEME_STORAGE_KEY = 'pctool_theme';

export default function App() {
  const [dropCode, setDropCode] = useState<string>(() => {
    try {
      const fromSearch = new URLSearchParams(window.location.search).get('drop')?.trim().toUpperCase();
      if (fromSearch) return fromSearch;
      const hashMatch = window.location.hash.match(/drop=([A-Za-z0-9]+)/i);
      return hashMatch ? hashMatch[1].toUpperCase() : '';
    } catch {
      return '';
    }
  });

  const [lang, setLang] = useState<AppLang>(() => {
    try {
      const saved = localStorage.getItem('pctool_app_lang');
      return saved === 'bn' ? 'bn' : 'en';
    } catch {
      return 'en';
    }
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    } catch {
      return 'light';
    }
  });

  const [recentlyUsedIds, setRecentlyUsedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(RECENT_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((id): id is string => typeof id === 'string' && VALID_TOOL_IDS.has(id)).slice(0, 5);
    } catch {
      return [];
    }
  });

  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((id): id is string => typeof id === 'string' && VALID_TOOL_IDS.has(id));
    } catch {
      return [];
    }
  });

  const [siteSettings, setSiteSettings] = useState<SiteAdminSettings>({
    shopNotice: '',
    shopNoticeBn: '',
    disabledToolIds: [],
  });
  const [adminUnlocked, setAdminUnlocked] = useState<boolean>(false);

  const [activeCategory, setActiveCategory] = useState<ToolCategoryId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activePage, setActivePage] = useState<ActivePage>('home');
  const [selectedTool, setSelectedTool] = useState<ToolItem | null>(null);
  const [adminInboxOpen, setAdminInboxOpen] = useState<boolean>(false);

  const ownerConfig = OWNER_CONFIG;
  const t = UI_TEXT[lang];

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  useEffect(() => {
    let active = true;
    fetch('/api/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) return;
        setSiteSettings({
          shopNotice: typeof data.shopNotice === 'string' ? data.shopNotice : '',
          shopNoticeBn: typeof data.shopNoticeBn === 'string' ? data.shopNoticeBn : '',
          disabledToolIds: Array.isArray(data.disabledToolIds) ? data.disabledToolIds : [],
          updatedAt: data.updatedAt,
        });
      })
      .catch(() => {
        // Offline or server unavailable; keep defaults
      });
    return () => {
      active = false;
    };
  }, []);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleChangeLang = (next: AppLang) => {
    setLang(next);
    try {
      localStorage.setItem('pctool_app_lang', next);
    } catch {
      // ignore
    }
  };

  const trackToolUsage = (toolId: string) => {
    if (!VALID_TOOL_IDS.has(toolId)) return;
    setRecentlyUsedIds((prev) => {
      const next = [toolId, ...prev.filter((id) => id !== toolId)].slice(0, 5);
      try {
        localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleClearRecent = () => {
    setRecentlyUsedIds([]);
    try {
      localStorage.removeItem(RECENT_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent, toolId: string) => {
    e.stopPropagation();
    setFavoriteIds((prev) => {
      const exists = prev.includes(toolId);
      const next = exists ? prev.filter((id) => id !== toolId) : [toolId, ...prev];
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleOpenTool = (tool: ToolItem) => {
    trackToolUsage(tool.id);
    if (tool.id === 'wb-status-hub') {
      setSelectedTool(null);
      setActivePage('status-hub');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSelectedTool(tool);
    setActivePage('tool');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenToolById = (toolId: string) => {
    const found = TOOLS_CATALOG.find((item) => item.id === toolId);
    if (found) handleOpenTool(found);
  };

  const handleNavigate = (page: ActivePage) => {
    setActivePage(page);
    if (page !== 'tool') setSelectedTool(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const disabledSet = useMemo(() => new Set(siteSettings.disabledToolIds), [siteSettings.disabledToolIds]);

  const isToolVisible = (toolId: string) => adminUnlocked || !disabledSet.has(toolId);

  const recentTools = useMemo(
    () =>
      recentlyUsedIds
        .map((id) => TOOLS_CATALOG.find((tool) => tool.id === id))
        .filter((tool): tool is ToolItem => Boolean(tool))
        .filter((tool) => isToolVisible(tool.id)),
    [recentlyUsedIds, disabledSet, adminUnlocked]
  );

  const favoriteTools = useMemo(
    () =>
      favoriteIds
        .map((id) => TOOLS_CATALOG.find((tool) => tool.id === id))
        .filter((tool): tool is ToolItem => Boolean(tool))
        .filter((tool) => isToolVisible(tool.id)),
    [favoriteIds, disabledSet, adminUnlocked]
  );

  const popularTools = useMemo(
    () =>
      POPULAR_TOOL_IDS.map((id) => TOOLS_CATALOG.find((tool) => tool.id === id))
        .filter((tool): tool is ToolItem => Boolean(tool))
        .filter((tool) => isToolVisible(tool.id)),
    [disabledSet, adminUnlocked]
  );

  const filteredSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return CATEGORIES.filter((cat) => activeCategory === 'all' || cat.id === activeCategory)
      .map((cat) => ({
        category: cat,
        tools: TOOLS_CATALOG.filter(
          (tool) =>
            tool.category === cat.id &&
            isToolVisible(tool.id) &&
            (!q ||
              tool.name.toLowerCase().includes(q) ||
              tool.bnName.toLowerCase().includes(q) ||
              tool.shortDesc.toLowerCase().includes(q) ||
              tool.bnShortDesc.toLowerCase().includes(q) ||
              tool.categoryLabel.toLowerCase().includes(q))
        ),
      }))
      .filter((sec) => sec.tools.length > 0);
  }, [activeCategory, searchQuery, disabledSet, adminUnlocked]);

  const activeBannerText =
    lang === 'bn'
      ? siteSettings.shopNoticeBn.trim() || siteSettings.shopNotice.trim()
      : siteSettings.shopNotice.trim() || siteSettings.shopNoticeBn.trim();

  const renderToolWorkspace = (tool: ToolItem) => {
    switch (tool.category) {
      case 'image':
        return <ImageToolsWorkspace toolId={tool.id} lang={lang} />;
      case 'pdf':
        return <PdfToolsWorkspace toolId={tool.id} appLang={lang} />;
      case 'id-card':
        return <IdCardCropperWorkspace toolId={tool.id} toolName={tool.name} appLang={lang} />;
      case 'documents':
        return (
          <DocumentToolsWorkspace
            toolId={tool.id}
            toolName={tool.name}
            appLang={lang}
            onOpenToolById={handleOpenToolById}
          />
        );
      case 'event-card':
        return <EventCardsWorkspace toolId={tool.id} appLang={lang} />;
      case 'utility':
        return <UtilityToolsWorkspace toolId={tool.id} ownerConfig={ownerConfig} appLang={lang} />;
    }
  };

  const faqItems =
    lang === 'bn'
      ? [
          {
            q: 'আধার, প্যান, ভোটার, আভা (ABHA) ও রেশন কার্ড ক্রপার কীভাবে কাজ করে এবং প্রিন্ট সাইজ কত?',
            a: 'ই-আধার বা ডিজিটাল কার্ডের PDF কিংবা ছবি আপলোড করলে পাসওয়ার্ড-সুরক্ষিত PDF সরাসরি ব্রাউজারেই খোলে (যেমন আধারের জন্য নামের প্রথম ৪ অক্ষর + জন্ম সাল)। এরপর সামনের ও পেছনের অংশ নির্ভুলভাবে ক্রপ হয়ে ৮৫.৬ × ৫৪ মিমি স্মার্টকার্ড মাপে ৩০০ DPI A4 শিটে সাজিয়ে দেয় যাতে PVC বা লেমিনেশন পাউচে একদম নিখুঁতভাবে বসে।',
          },
          {
            q: 'পশ্চিমবঙ্গের লক্ষ্মীর ভাণ্ডার, কন্যাশ্রী, কাস্ট ও জমির মিউটেশন ডকুমেন্ট ফর্মে কী কী তথ্য লাগে?',
            a: 'ফর্মগুলোতে আগে থেকে কোনো ভুয়া তথ্য লেখা থাকে না। আপনার কাস্টমারের নাম, পিতা/স্বামীর নাম, আধার/ভোটার নম্বর, ঠিকানা, স্বাস্থ্যসাথী/ব্যাংক তথ্য বা জমির দাগ-খতিয়ান নম্বর বসিয়ে সরাসরি বাংলা বা ইংরেজিতে A4 পেজে প্রিন্ট করতে পারবেন। কাস্ট ও বংশতালিকার জন্য জেনারেশন-ভিত্তিক ফ্যামিলি ট্রি চার্টও যোগ করা যায়।',
          },
          {
            q: 'পাসপোর্ট সাইজ ছবিতে ব্যাকগ্রাউন্ড রিমুভ, কালার ফিল ও ৪×৬ / A4 প্রিন্ট কীভাবে করবেন?',
            a: 'পাসপোর্ট ফটো মেকারে "Auto Remove & Replace BG" অপশনটি চালু করে সাদা, নীল, স্কাই ব্লু বা লালসহ যেকোনো ব্যাকগ্রাউন্ড কালার বাছতে পারবেন। পাশাপাশি A4 বা ৪×৬ (4R) পেপার সাইজ, কাস্টম কপি সংখ্যা, -১৫° থেকে +১৫° রোটেট ও ছবির নিচে নাম-তারিখ প্রিন্ট করা যায়।',
          },
          {
            q: 'মোবাইলে তোলা আবছা ডকুমেন্ট বা সাদা কাগজ পরিষ্কার করার কোনো টুল আছে কি?',
            a: 'অবশ্যই। "ডকুমেন্ট স্ক্যান ও সাদা-কালো ক্লিনার" টুল দিয়ে ছায়া বা আবছা ব্যাকগ্রাউন্ড সরিয়ে ঝকঝকে সাদা কাগজ ও গাঢ় কালো লেখায় রূপান্তর করে সরাসরি প্রিন্ট বা PDF আপলোডের জন্য তৈরি করতে পারবেন।',
          },
          {
            q: 'অ্যাডমিন মোড (Admin Mode) কী এবং SMART SUBHA-এর সাথে কীভাবে যোগাযোগ করবেন?',
            a: `হেডার, মেনু বা ফুটারে থাকা "অ্যাডমিন" বাটনে ক্লিক করে গোপন পাসওয়ার্ড দিয়ে অ্যাডমিন কনসোল খুলতে পারবেন — সেখান থেকে কাস্টমারদের পাঠানো মেসেজ দেখা, CSV ডাউনলোড, লাইভ নোটিশ ব্যানার সেট ও টুলস লুকানো/দেখানো যায়। সরাসরি সাহায্যের জন্য ${ownerConfig.supportEmail} বা ${ownerConfig.phone} নম্বরে যোগাযোগ করুন।`,
          },
        ]
      : [
          {
            q: 'How do the ID Card Croppers (Aadhaar, PAN, Voter, ABHA, Ration) work and what is the print size?',
            a: 'Upload your e-Aadhaar, e-PAN, e-EPIC Voter, ABHA, or Ration Card PDF/image. Password-protected PDFs unlock directly inside your browser (for e-Aadhaar: first 4 letters of name in CAPS + birth year). You select front & back regions and export a 300-DPI A4 sheet aligned to exact 85.6 × 54 mm smartcard dimensions.',
          },
          {
            q: 'What details are required for West Bengal Document Forms (Lakshmir Bhandar, Kanyashree, Caste, Mutation)?',
            a: 'All form inputs start completely clean with zero pre-filled dummy values. Enter applicant name, guardian name, address, mobile, Swasthyasathi/bank info, or Banglarbhumi Mouza/Khatian/Dag numbers, add optional ancestor rows for Genealogy/Caste certificates, and print cleanly on A4 in Bengali or English.',
          },
          {
            q: 'Can the Passport Photo Maker remove photo background, fill colors & print on 4×6 or A4 sheets?',
            a: 'Yes! Enable "Auto Remove & Replace BG" right inside the Passport Photo Maker, optionally sample any background pixel on the photo, choose White, Blue, Sky, Grey, Red or a custom studio color, and print custom copy counts on A4 or 4×6 (4R) paper with optional Name & Date strip.',
          },
          {
            q: 'How does the Document Scan & High-Contrast B&W Cleaner help Cyber Cafes?',
            a: 'Customers often send dim phone photos of certificates or signatures. The Document Scan Cleaner removes grey shadows into crisp white paper and darkens faded ink for clean B&W printing and portal uploads.',
          },
          {
            q: 'Where is Admin Mode and how can I contact SMART SUBHA?',
            a: `Click the "Admin" button in the top bar, mobile menu, or footer to unlock SMART SUBHA's protected Admin Console (Inbox + Suggestions + CSV export, Live Homepage Notice Banner, and Tool Visibility Controls). You can also reach out at ${ownerConfig.supportEmail} or ${ownerConfig.phone}.`,
          },
        ];

  if (dropCode) {
    return (
      <MobileCustomerDropClient
        sessionCode={dropCode}
        onExit={() => {
          setDropCode('');
          try {
            const url = new URL(window.location.href);
            url.searchParams.delete('drop');
            window.history.replaceState({}, '', url.pathname + url.search);
          } catch {
            // ignore
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f6fb] dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Header
        ownerConfig={ownerConfig}
        lang={lang}
        onChangeLang={handleChangeLang}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activePage={activePage}
        onNavigate={handleNavigate}
        onOpenAdminInbox={() => setAdminInboxOpen(true)}
        adminUnlocked={adminUnlocked}
      />

      <main className="flex-1">
        {activePage === 'tool' && selectedTool ? (
          <div className="max-w-[1200px] mx-auto px-4 lg:px-6 py-8 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4 no-print">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                  <button
                    type="button"
                    onClick={() => handleNavigate('home')}
                    className="hover:text-violet-700 dark:hover:text-violet-400 font-semibold cursor-pointer"
                  >
                    {lang === 'bn' ? 'হোম' : 'Home'}
                  </button>
                  <span>›</span>
                  <span className="capitalize">{selectedTool.categoryLabel}</span>
                  <span>›</span>
                  <span className="text-slate-900 dark:text-slate-100 font-bold">
                    {lang === 'bn' ? selectedTool.bnName : selectedTool.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <ToolVisualIcon toolId={selectedTool.id} category={selectedTool.category} size="sm" />
                  <div>
                    <h1 className="text-2xl font-black text-slate-950 dark:text-white">
                      {lang === 'bn' ? selectedTool.bnName : selectedTool.name}
                    </h1>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {lang === 'bn' ? selectedTool.bnShortDesc : selectedTool.shortDesc}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full">
                  <Lock className="w-3.5 h-3.5" />
                  {t.runsLocally}
                </span>
                <button
                  type="button"
                  onClick={() => handleNavigate('home')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  {t.allToolsBtn}
                </button>
              </div>
            </div>

            {renderToolWorkspace(selectedTool)}
          </div>
        ) : activePage === 'posters' ? (
          <PostersPage
            ownerConfig={ownerConfig}
            lang={lang}
            onBack={() => handleNavigate('home')}
          />
        ) : activePage === 'cyber-guide' ? (
          <CyberGuidePage
            lang={lang}
            onBack={() => handleNavigate('home')}
            onOpenToolById={handleOpenToolById}
          />
        ) : activePage === 'status-hub' ? (
          <StatusHubPage lang={lang} onBack={() => handleNavigate('home')} />
        ) : activePage === 'contact' ? (
          <ContactPage ownerConfig={ownerConfig} lang={lang} onNavigate={handleNavigate} />
        ) : activePage !== 'home' && activePage !== 'tool' ? (
          <LegalAndInfoPages
            page={activePage}
            ownerConfig={ownerConfig}
            lang={lang}
            onNavigate={handleNavigate}
          />
        ) : (
          <>
            {/* Live Admin Shop Notice Banner */}
            {activeBannerText && (
              <div className="max-w-[1240px] mx-auto px-4 lg:px-6 pt-5">
                <div className="rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-violet-500/15 dark:from-amber-500/20 dark:via-slate-900 dark:to-indigo-500/20 border-2 border-amber-400/70 dark:border-amber-500/50 px-4 py-3 flex items-center gap-3 shadow-xs">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-amber-100 leading-snug">
                    {activeBannerText}
                  </p>
                </div>
              </div>
            )}

            {/* High-Contrast Localized Hero Section */}
            <section className="max-w-[1240px] mx-auto px-4 lg:px-6 pt-6 pb-4">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 text-white px-6 py-10 md:px-12 md:py-12 text-center shadow-xl border border-indigo-800/50">
                <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-violet-500/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-amber-400/15 blur-3xl" />

                <div className="relative">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-amber-300 mb-4">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{t.heroWelcomeBadge}</span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight max-w-4xl mx-auto leading-tight">
                    {t.heroTitle}
                  </h1>

                  <p className="mt-4 text-sm sm:text-base text-indigo-100/90 leading-relaxed max-w-[760px] mx-auto">
                    {t.heroDesc}
                  </p>

                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleNavigate('cyber-guide')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs sm:text-sm font-black shadow-lg shadow-amber-500/20 transition-transform hover:-translate-y-0.5 cursor-pointer"
                    >
                      <BookOpenCheck className="w-4 h-4" />
                      <span>{t.navCyberGuide}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNavigate('status-hub')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                    >
                      <span>
                        {lang === 'bn' ? 'সরকারি পোর্টাল স্ট্যাটাস চেক হাব' : 'WB Portal Status Check Hub'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenToolById('wb-job-scheme-checklist')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/90 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-black transition-colors cursor-pointer"
                    >
                      <span>
                        {lang === 'bn' ? 'চাকরি ও প্রকল্প চেকলিস্ট' : 'Job & Scheme Checklists'}
                      </span>
                    </button>
                  </div>

                  <div className="mt-6 pt-5 border-t border-white/15 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] sm:text-xs font-semibold text-indigo-200">
                    <span>✓ {TOOLS_CATALOG.length}+ {lang === 'bn' ? 'ফ্রি প্রো টুলস' : 'Free Counter Tools'}</span>
                    <span>✓ {lang === 'bn' ? 'ফ্রি-সাইজ + পাসপোর্ট A4' : 'Passport + Free-Size 4-Edge A4'}</span>
                    <span>✓ {lang === 'bn' ? '২/৪-ইন-১ জেরক্স সেভার' : '2/4-in-1 A4 Xerox Saver'}</span>
                    <span>✓ {lang === 'bn' ? 'ডাইরেক্ট প্রিন্ট ও ডার্ক মোড' : 'Direct Print & Dark Mode'}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Quick Counter Workflows Strip */}
            {!searchQuery && activeCategory === 'all' && (
              <section className="max-w-[1240px] mx-auto px-4 lg:px-6 pt-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    {
                      id: 'multi-slip-xerox-saver',
                      badge: 'PAPER SAVER',
                      titleBn: '২-ইন-১ / ৪-ইন-১ স্লিপ জেরক্স',
                      titleEn: '2-in-1 / 4-in-1 Slip Xerox',
                      descBn: 'রসিদ ও স্লিপ ১ পাতায় বসিয়ে প্রিন্ট ও PDF',
                      descEn: 'Print 2–6 slips cleanly on 1 A4 sheet',
                      grad: 'from-teal-600 to-emerald-700',
                    },
                    {
                      id: 'wb-job-scheme-checklist',
                      badge: 'OFFICIAL LINKS',
                      titleBn: 'চাকরি ও প্রকল্প চেকলিস্ট হাব',
                      titleEn: 'Job & Scheme Checklists',
                      descBn: 'SSC, রেল, পুলিশ, প্যান ও প্রকল্পের আসল লিংক',
                      descEn: 'Verified URLs, specs & printable slip',
                      grad: 'from-indigo-600 to-blue-700',
                    },
                    {
                      id: 'batch-image-fixer',
                      badge: '10-30 FILES',
                      titleBn: 'ব্যাচ ছবি রোটেট ও PDF',
                      titleEn: 'Batch Rotate & Rename',
                      descBn: 'একসাথে উল্টো ছবি ৯০° ঘুরিয়ে রিনেম ও PDF',
                      descEn: 'Bulk rotate photos, serialize & make PDF',
                      grad: 'from-violet-600 to-purple-700',
                    },
                    {
                      id: 'doc-stamp-sign-placer',
                      badge: 'E-SIGN & STAMP',
                      titleBn: 'ডকুমেন্ট হাইলাইট ও সই/স্ট্যাম্প',
                      titleEn: 'Doc Highlight & Sign Placer',
                      descBn: 'রঙিন হাইলাইট ও সাদা কাগজ মুক্ত সই বসান',
                      descEn: 'Highlight lines & place transparent stamp',
                      grad: 'from-amber-600 to-rose-600',
                    },
                  ].map((card) => (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => handleOpenToolById(card.id)}
                      className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.grad} text-white p-4 text-left shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer`}
                    >
                      <div className="text-[10px] font-black tracking-wider uppercase text-white/85">
                        {card.badge}
                      </div>
                      <div className="text-sm font-extrabold mt-0.5 leading-snug">
                        {lang === 'bn' ? card.titleBn : card.titleEn}
                      </div>
                      <div className="text-xs text-white/85 mt-1 leading-relaxed">
                        {lang === 'bn' ? card.descBn : card.descEn}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Recently Used Section (Last 5 Tools in localStorage) */}
            {!searchQuery && activeCategory === 'all' && recentTools.length > 0 && (
              <section className="max-w-[1240px] mx-auto px-4 lg:px-6 pt-5">
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
                      {lang === 'bn' ? 'সম্প্রতি ব্যবহৃত টুলস (দ্রুত ফিরে যান)' : 'Recently Used Tools'}
                    </h2>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 tabular-nums">
                      {recentTools.length}/5
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearRecent}
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'মুছে ফেলুন' : 'Clear'}</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {recentTools.map((tool) => (
                    <div
                      key={tool.id}
                      onClick={() => handleOpenTool(tool)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') handleOpenTool(tool);
                      }}
                      className="group flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 rounded-2xl border-2 border-emerald-200/80 dark:border-emerald-800/60 hover:border-emerald-500 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all text-left cursor-pointer"
                    >
                      <ToolVisualIcon toolId={tool.id} category={tool.category} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-slate-950 dark:text-white truncate">
                          {lang === 'bn' ? tool.bnName : tool.name}
                        </div>
                        <div className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 capitalize">
                          {lang === 'bn' ? 'পুনরায় খুলুন →' : 'Resume work →'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Pinned Favorites Section */}
            {!searchQuery && activeCategory === 'all' && favoriteTools.length > 0 && (
              <section className="max-w-[1240px] mx-auto px-4 lg:px-6 pt-5">
                <div className="flex items-center gap-2.5 mb-3.5">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                  <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
                    {lang === 'bn' ? 'পিন করা পছন্দের টুলস (Favorites)' : 'Pinned Counter Favorites'}
                  </h2>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                  {favoriteTools.map((tool) => (
                    <div
                      key={tool.id}
                      onClick={() => handleOpenTool(tool)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') handleOpenTool(tool);
                      }}
                      className="shrink-0 flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 rounded-2xl border-2 border-amber-300/80 dark:border-amber-700/60 hover:border-amber-500 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all text-left min-w-[225px] cursor-pointer"
                    >
                      <ToolVisualIcon toolId={tool.id} category={tool.category} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-950 dark:text-white whitespace-nowrap">
                          {lang === 'bn' ? tool.bnName : tool.name}
                        </div>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 capitalize">
                          {tool.categoryLabel}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleToggleFavorite(e, tool.id)}
                        className="p-1 rounded-lg hover:bg-amber-50 dark:hover:bg-slate-800 cursor-pointer"
                        title={lang === 'bn' ? 'পছন্দ থেকে সরান' : 'Unpin favorite'}
                      >
                        <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Popular Tools Strip */}
            {!searchQuery && activeCategory === 'all' && popularTools.length > 0 && (
              <section className="max-w-[1240px] mx-auto px-4 lg:px-6 pt-5">
                <div className="flex items-center gap-2.5 mb-3.5">
                  <TrendingUp className="w-5 h-5 text-violet-700 dark:text-violet-400" />
                  <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">{t.popularTools}</h2>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-3 no-scrollbar">
                  {popularTools.map((tool) => (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => handleOpenTool(tool)}
                      className="shrink-0 flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-violet-500 dark:hover:border-violet-500 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all text-left min-w-[225px] cursor-pointer"
                    >
                      <ToolVisualIcon toolId={tool.id} category={tool.category} size="sm" />
                      <div>
                        <div className="text-sm font-bold text-slate-950 dark:text-white whitespace-nowrap">
                          {lang === 'bn' ? tool.bnName : tool.name}
                        </div>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-400 capitalize">
                          {tool.categoryLabel}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Categorized Tools Grid */}
            <section id="tools-section" className="max-w-[1240px] mx-auto px-4 lg:px-6 py-6 space-y-8">
              {filteredSections.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3">
                  <SearchX className="w-10 h-10 text-slate-400 mx-auto" />
                  <div className="text-base font-extrabold text-slate-900 dark:text-white">
                    No tools matched &ldquo;{searchQuery}&rdquo;
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setActiveCategory('all');
                    }}
                    className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold cursor-pointer"
                  >
                    {t.allToolsBtn}
                  </button>
                </div>
              ) : (
                filteredSections.map(({ category, tools }) => (
                  <div
                    key={category.id}
                    className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xs"
                  >
                    <div className="flex items-center gap-3.5 mb-5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-violet-500/30 shrink-0">
                        <CategoryIcon category={category.id} className="w-6 h-6" />
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white">
                        {lang === 'bn' ? category.bnTitle : category.title}
                      </h2>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
                      {tools.map((tool) => {
                        const isFav = favoriteIds.includes(tool.id);
                        const isHiddenByAdmin = disabledSet.has(tool.id);
                        return (
                          <div
                            key={tool.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleOpenTool(tool)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') handleOpenTool(tool);
                            }}
                            className={`relative group bg-slate-50/70 dark:bg-slate-800/75 hover:bg-white dark:hover:bg-slate-800 rounded-2xl border-2 border-slate-200/80 dark:border-slate-700/80 hover:border-violet-500 dark:hover:border-violet-400 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all px-3 py-5 flex flex-col items-center text-center cursor-pointer ${
                              isHiddenByAdmin ? 'opacity-65' : ''
                            }`}
                          >
                            <button
                              type="button"
                              onClick={(e) => handleToggleFavorite(e, tool.id)}
                              title={isFav ? 'Unpin favorite' : 'Pin to favorites'}
                              aria-label={isFav ? 'Unpin favorite' : 'Pin to favorites'}
                              className={`absolute top-2 right-2 p-1 rounded-lg transition-opacity cursor-pointer ${
                                isFav
                                  ? 'opacity-100 text-amber-500'
                                  : 'opacity-0 group-hover:opacity-100 text-slate-400 hover:text-amber-500'
                              }`}
                            >
                              <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400' : ''}`} />
                            </button>

                            {isHiddenByAdmin && (
                              <span className="absolute top-2 left-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-rose-500 text-white text-[9px] font-bold">
                                <EyeOff className="w-2.5 h-2.5" />
                                Hidden
                              </span>
                            )}

                            <div className="mb-3 transition-transform group-hover:scale-110">
                              <ToolVisualIcon toolId={tool.id} category={tool.category} size="lg" />
                            </div>
                            <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-slate-100 leading-snug">
                              {lang === 'bn' ? tool.bnName : tool.name}
                            </h3>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </section>

            {/* Trust Strip + About PC Tool by SMART SUBHA + FAQ */}
            <section className="bg-white dark:bg-slate-900 border-y-2 border-slate-200 dark:border-slate-800 mt-8 py-14">
              <div className="max-w-[1000px] mx-auto px-4 lg:px-6 space-y-14">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                  <div className="space-y-2.5">
                    <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center mx-auto shadow-md shadow-violet-500/25">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-extrabold text-slate-950 dark:text-white">{t.privacyTitle}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{t.privacyDesc}</p>
                  </div>

                  <div className="space-y-2.5">
                    <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center mx-auto shadow-md shadow-sky-500/25">
                      <MonitorSmartphone className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-extrabold text-slate-950 dark:text-white">{t.noSignupTitle}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{t.noSignupDesc}</p>
                  </div>

                  <div className="space-y-2.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center mx-auto shadow-md shadow-emerald-500/25">
                      WB
                    </div>
                    <h3 className="text-base font-extrabold text-slate-950 dark:text-white">{t.indianTitle}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{t.indianDesc}</p>
                  </div>
                </div>

                {/* About Prose Section */}
                <div className="max-w-[740px] mx-auto space-y-4 text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
                  <h2 className="text-xl font-black text-slate-950 dark:text-white text-center">{t.aboutTitle}</h2>
                  <p>{t.aboutP1}</p>
                  <p>{t.aboutP2}</p>
                  <p>
                    {lang === 'bn' ? (
                      <>
                        কোনো সাহায্য বা কাস্টম টুলের প্রয়োজনে যোগাযোগ করুন{' '}
                        <a
                          href={ownerConfig.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-violet-700 dark:text-violet-400 font-extrabold underline"
                        >
                          {ownerConfig.ownerName}
                        </a>
                        -এর সাথে:{' '}
                        <a
                          href={`mailto:${ownerConfig.supportEmail}`}
                          className="text-violet-700 dark:text-violet-400 font-bold hover:underline"
                        >
                          {ownerConfig.supportEmail}
                        </a>{' '}
                        অথবা ফোন করুন{' '}
                        <a
                          href={`tel:${ownerConfig.phone}`}
                          className="text-violet-700 dark:text-violet-400 font-bold hover:underline tabular-nums"
                        >
                          {ownerConfig.phone}
                        </a>{' '}
                        নম্বরে, অথবা আমাদের{' '}
                        <button
                          type="button"
                          onClick={() => handleNavigate('contact')}
                          className="text-violet-700 dark:text-violet-400 font-bold hover:underline cursor-pointer"
                        >
                          যোগাযোগ পাতা
                        </button>{' '}
                        দেখুন।
                      </>
                    ) : (
                      <>
                        Need help or custom tools? Reach out anytime to{' '}
                        <a
                          href={ownerConfig.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-violet-700 dark:text-violet-400 font-extrabold underline"
                        >
                          {ownerConfig.ownerName}
                        </a>{' '}
                        at{' '}
                        <a
                          href={`mailto:${ownerConfig.supportEmail}`}
                          className="text-violet-700 dark:text-violet-400 font-bold hover:underline"
                        >
                          {ownerConfig.supportEmail}
                        </a>{' '}
                        or call{' '}
                        <a
                          href={`tel:${ownerConfig.phone}`}
                          className="text-violet-700 dark:text-violet-400 font-bold hover:underline tabular-nums"
                        >
                          {ownerConfig.phone}
                        </a>
                        , or visit our{' '}
                        <button
                          type="button"
                          onClick={() => handleNavigate('contact')}
                          className="text-violet-700 dark:text-violet-400 font-bold hover:underline cursor-pointer"
                        >
                          Contact page
                        </button>
                        .
                      </>
                    )}
                  </p>
                </div>

                {/* Expanded FAQ Section */}
                <div className="max-w-[760px] mx-auto space-y-3">
                  <h2 className="text-xl font-black text-slate-950 dark:text-white text-center mb-6">
                    {t.faqTitle}
                  </h2>

                  {faqItems.map((faq, idx) => (
                    <details
                      key={idx}
                      className="group bg-slate-50 dark:bg-slate-800/70 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-5 py-4"
                    >
                      <summary className="flex items-center justify-between font-bold text-sm text-slate-950 dark:text-white cursor-pointer list-none">
                        <span>{faq.q}</span>
                        <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform group-open:rotate-180 shrink-0" />
                      </summary>
                      <p className="mt-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{faq.a}</p>
                    </details>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      <Footer
        ownerConfig={ownerConfig}
        lang={lang}
        onSelectCategory={setActiveCategory}
        onNavigate={handleNavigate}
        onOpenAdminInbox={() => setAdminInboxOpen(true)}
      />

      <AdminInboxModal
        open={adminInboxOpen}
        lang={lang}
        onClose={() => setAdminInboxOpen(false)}
        onSettingsUpdated={setSiteSettings}
        onAdminStateChange={setAdminUnlocked}
      />

      <OfflineIndicator lang={lang} />

      <PrintPreviewModal lang={lang} />
    </div>
  );
}

import React, { useState } from 'react';
import {
  Menu,
  X,
  Search,
  LayoutGrid,
  Image as ImageIcon,
  FileText,
  CreditCard,
  FileCheck2,
  HeartHandshake,
  Receipt,
  Phone,
  BookOpenCheck,
  ShieldCheck,
  ExternalLink,
  Globe2,
  Sun,
  Moon,
} from 'lucide-react';
import { CATEGORIES, type ToolCategoryId } from '../data/toolsCatalog';
import type { OwnerContactConfig } from '../data/ownerConfig';
import { UI_TEXT, type AppLang } from '../data/i18n';
import { PWAInstallButton } from './PWAInstallBanner';

export type ActivePage =
  | 'home'
  | 'tool'
  | 'posters'
  | 'cyber-guide'
  | 'status-hub'
  | 'contact'
  | 'about'
  | 'terms'
  | 'privacy'
  | 'suggestions'
  | 'blog';

interface HeaderProps {
  ownerConfig: OwnerContactConfig;
  lang: AppLang;
  onChangeLang: (lang: AppLang) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  activeCategory: ToolCategoryId | 'all';
  onSelectCategory: (cat: ToolCategoryId | 'all') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  onOpenAdminInbox: () => void;
  adminUnlocked?: boolean;
}

const CATEGORY_ICONS: Record<ToolCategoryId | 'all', React.ReactNode> = {
  all: <LayoutGrid className="w-3.5 h-3.5" />,
  image: <ImageIcon className="w-3.5 h-3.5" />,
  pdf: <FileText className="w-3.5 h-3.5" />,
  'id-card': <CreditCard className="w-3.5 h-3.5" />,
  documents: <FileCheck2 className="w-3.5 h-3.5" />,
  'event-card': <HeartHandshake className="w-3.5 h-3.5" />,
  utility: <Receipt className="w-3.5 h-3.5" />,
};

export const Header: React.FC<HeaderProps> = ({
  ownerConfig,
  lang,
  onChangeLang,
  theme,
  onToggleTheme,
  activeCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  activePage,
  onNavigate,
  onOpenAdminInbox,
  adminUnlocked = false,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = UI_TEXT[lang];

  const handleCategoryClick = (cat: ToolCategoryId | 'all') => {
    onSelectCategory(cat);
    onNavigate('home');
    setMobileMenuOpen(false);
    setTimeout(() => {
      const el = document.getElementById('tools-section');
      if (el && cat !== 'all') {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  const navItems: { id: ToolCategoryId | 'all'; label: string }[] = [
    { id: 'all', label: t.allTools },
    ...CATEGORIES.map((c) => ({
      id: c.id,
      label: lang === 'bn' ? c.bnNavLabel : c.navLabel,
    })),
  ];

  const drawerNavigate = (page: ActivePage) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs no-print transition-colors">
        {/* Row 1: Brand + Search + Theme + Lang + Actions + Admin Mode */}
        <div className="max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-6 py-2.5 flex items-center justify-between gap-2 sm:gap-3">
          {/* Brand & Menu Button */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              title="Open menu & guides"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-violet-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 hover:text-violet-800 transition-colors cursor-pointer shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 whitespace-nowrap">
              <button
                type="button"
                onClick={() => {
                  onSelectCategory('all');
                  onSearchChange('');
                  onNavigate('home');
                }}
                className="flex items-center gap-2 text-left cursor-pointer"
              >
                <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-md shadow-violet-500/30 shrink-0">
                  PC
                </span>
                <span className="text-base sm:text-lg font-black tracking-tight text-slate-950 dark:text-white">
                  {ownerConfig.brandName}
                </span>
              </button>
              <a
                href={ownerConfig.websiteUrl}
                target="_blank"
                rel="noreferrer"
                title={ownerConfig.websiteUrl}
                className="hidden sm:inline text-xs font-extrabold text-violet-700 dark:text-violet-400 hover:underline decoration-violet-300 underline-offset-2"
              >
                {ownerConfig.byline}
              </a>
            </div>
          </div>

          {/* Search Box */}
          <div className="hidden md:flex items-center flex-1 max-w-xs lg:max-w-sm gap-2 px-3.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:border-violet-600 transition-all">
            <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value);
                if (activePage !== 'home') onNavigate('home');
              }}
              placeholder={t.searchPlaceholder}
              aria-label="Search tools"
              className="w-full bg-transparent text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none min-w-0"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
                className="text-slate-500 hover:text-slate-900 dark:hover:text-white p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Quick Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Dark / Light Mode Toggle */}
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              title={theme === 'dark' ? (lang === 'bn' ? 'লাইট মোড' : 'Light Mode') : (lang === 'bn' ? 'ডার্ক মোড' : 'Dark Mode')}
              className="p-2 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-amber-300 transition-colors cursor-pointer shrink-0"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <div
              className="inline-flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-full shrink-0"
              role="group"
              aria-label="Language switch"
            >
              <button
                type="button"
                onClick={() => onChangeLang('en')}
                className={`px-2 py-1 rounded-full text-[11px] font-extrabold whitespace-nowrap transition-colors cursor-pointer ${
                  lang === 'en'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => onChangeLang('bn')}
                className={`px-2 py-1 rounded-full text-[11px] font-extrabold whitespace-nowrap transition-colors cursor-pointer ${
                  lang === 'bn'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                বাংলা
              </button>
            </div>

            <PWAInstallButton lang={lang} />

            <button
              type="button"
              onClick={() => onNavigate('status-hub')}
              title={t.statusHub}
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-full text-xs font-extrabold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activePage === 'status-hub'
                  ? 'bg-indigo-700 text-white shadow-sm'
                  : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60'
              }`}
            >
              <Globe2 className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">{t.statusHub}</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('cyber-guide')}
              title={t.navCyberGuide}
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-full text-xs font-extrabold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activePage === 'cyber-guide'
                  ? 'bg-sky-700 text-white shadow-sm'
                  : 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-200 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/60'
              }`}
            >
              <BookOpenCheck className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">{t.cyberGuide}</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('posters')}
              title="Free Customizable Posters"
              className="posters-cta-gradient inline-flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-full text-xs font-extrabold text-white shadow-sm shadow-violet-500/30 hover:opacity-95 transition-transform hover:-translate-y-0.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">{t.posters}</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('contact')}
              title={t.contactUs}
              className="inline-flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-lg bg-slate-950 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">{t.contactUs}</span>
            </button>

            {/* Clearly labeled Admin Mode Button */}
            <button
              type="button"
              onClick={onOpenAdminInbox}
              title={lang === 'bn' ? 'অ্যাডমিন মোড (SMART SUBHA)' : 'Admin Mode (Owner Login)'}
              aria-label="Admin Mode"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-extrabold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                adminUnlocked
                  ? 'bg-amber-500 border-amber-600 text-slate-950 shadow-xs'
                  : 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{lang === 'bn' ? 'অ্যাডমিন' : 'Admin'}</span>
            </button>
          </div>
        </div>

        {/* Row 2: Dedicated Clean Category Bar */}
        <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/90 transition-colors">
          <div className="max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-6 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {navItems.map((item) => {
              const isActive = activePage === 'home' && activeCategory === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleCategoryClick(item.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-700 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-600 hover:text-violet-800 dark:hover:text-violet-300'
                  }`}
                >
                  {CATEGORY_ICONS[item.id]}
                  <span>{item.label}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => onNavigate('status-hub')}
              className={`sm:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer ${
                activePage === 'status-hub'
                  ? 'bg-indigo-700 text-white'
                  : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800'
              }`}
            >
              <Globe2 className="w-3.5 h-3.5" />
              <span>{t.statusHub}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Left Slide-Over Drawer rendered OUTSIDE <header> */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex no-print">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-80 max-w-[88vw] bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col p-5 overflow-y-auto border-r border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="font-black text-lg text-slate-950 dark:text-white">{ownerConfig.brandName}</span>
                <a
                  href={ownerConfig.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-1.5 text-xs font-extrabold text-violet-700 dark:text-violet-400 underline inline-flex items-center gap-0.5"
                >
                  {ownerConfig.byline}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-5">
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    onSearchChange(e.target.value);
                    onNavigate('home');
                  }}
                  placeholder={t.searchPlaceholder}
                  className="w-full bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={onToggleTheme}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 cursor-pointer"
              >
                <span>{lang === 'bn' ? 'থিম পরিবর্তন (Light / Dark)' : 'Appearance Theme'}</span>
                <span className="inline-flex items-center gap-1.5 text-violet-700 dark:text-amber-300">
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  {theme === 'dark' ? 'Dark' : 'Light'}
                </span>
              </button>

              <div className="space-y-1">
                <div className="px-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                  {t.footerTools}
                </div>
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleCategoryClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                      activePage === 'home' && activeCategory === item.id
                        ? 'bg-violet-600 text-white'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-violet-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {CATEGORY_ICONS[item.id]}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-1">
                <div className="px-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                  {t.footerLegal}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAdminInbox();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-extrabold text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 cursor-pointer flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'অ্যাডমিন মোড (SMART SUBHA)' : 'Admin Mode Console'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => drawerNavigate('status-hub')}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-indigo-800 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 cursor-pointer flex items-center gap-2"
                >
                  <Globe2 className="w-4 h-4" />
                  <span>{t.statusHub}</span>
                </button>
                <button
                  type="button"
                  onClick={() => drawerNavigate('cyber-guide')}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-bold text-sky-800 dark:text-sky-200 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 cursor-pointer flex items-center gap-2"
                >
                  <BookOpenCheck className="w-4 h-4" />
                  <span>{t.navCyberGuide}</span>
                </button>
                <button
                  type="button"
                  onClick={() => drawerNavigate('posters')}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {t.posters}
                </button>
                <button
                  type="button"
                  onClick={() => drawerNavigate('about')}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {t.navAbout}
                </button>
                <button
                  type="button"
                  onClick={() => drawerNavigate('contact')}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {t.navContact} ({ownerConfig.phone})
                </button>
                <button
                  type="button"
                  onClick={() => drawerNavigate('suggestions')}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {t.navSuggestions}
                </button>
                <button
                  type="button"
                  onClick={() => drawerNavigate('blog')}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {t.navBlog}
                </button>
                <button
                  type="button"
                  onClick={() => drawerNavigate('terms')}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {t.navTerms}
                </button>
                <button
                  type="button"
                  onClick={() => drawerNavigate('privacy')}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {t.navPrivacy}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

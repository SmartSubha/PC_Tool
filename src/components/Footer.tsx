import React from 'react';
import { Mail, Phone, MapPin, Globe, Inbox } from 'lucide-react';
import { CATEGORIES, type ToolCategoryId } from '../data/toolsCatalog';
import type { OwnerContactConfig } from '../data/ownerConfig';
import { UI_TEXT, type AppLang } from '../data/i18n';
import type { ActivePage } from './Header';

interface FooterProps {
  ownerConfig: OwnerContactConfig;
  lang: AppLang;
  onSelectCategory: (cat: ToolCategoryId | 'all') => void;
  onNavigate: (page: ActivePage) => void;
  onOpenAdminInbox: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  ownerConfig,
  lang,
  onSelectCategory,
  onNavigate,
  onOpenAdminInbox,
}) => {
  const t = UI_TEXT[lang];

  const goCategory = (cat: ToolCategoryId) => {
    onSelectCategory(cat);
    onNavigate('home');
    setTimeout(() => {
      document.getElementById('tools-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  };

  return (
    <footer className="bg-slate-950 text-slate-300 pt-12 pb-8 mt-16 border-t border-slate-800 no-print">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mb-10">
          {/* Tools Column */}
          <div>
            <h4 className="text-sm font-extrabold text-white mb-3.5">{t.footerTools}</h4>
            <ul className="space-y-2 text-[13px]">
              {CATEGORIES.map((cat) => (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => goCategory(cat.id)}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    {lang === 'bn' ? cat.bnTitle : cat.title}
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('posters')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  {t.posters}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('status-hub')}
                  className="text-indigo-300 hover:text-white font-semibold transition-colors cursor-pointer"
                >
                  {t.statusHub}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('cyber-guide')}
                  className="text-sky-300 hover:text-white font-semibold transition-colors cursor-pointer"
                >
                  {t.navCyberGuide}
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Info Column (Fully localized EN / বাংলা) */}
          <div>
            <h4 className="text-sm font-extrabold text-white mb-3.5">{t.footerLegal}</h4>
            <ul className="space-y-2 text-[13px]">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('about')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  {t.navAbout}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('contact')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  {t.navContact}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('terms')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  {t.navTerms}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('privacy')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  {t.navPrivacy}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('suggestions')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  {t.navSuggestions}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('blog')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  {t.navBlog}
                </button>
              </li>
            </ul>
          </div>

          {/* Connect Column */}
          <div>
            <h4 className="text-sm font-extrabold text-white mb-3.5">{t.footerConnect}</h4>
            <ul className="space-y-2.5 text-[13px]">
              <li>
                <a
                  href={ownerConfig.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sky-300 hover:text-white font-semibold transition-colors"
                >
                  <Globe className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>{ownerConfig.websiteLabel}</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${ownerConfig.supportEmail}`}
                  className="inline-flex items-center gap-2 hover:text-white transition-colors break-all"
                >
                  <Mail className="w-4 h-4 text-violet-400 shrink-0" />
                  <span>{ownerConfig.supportEmail}</span>
                </a>
              </li>
              <li>
                <a
                  href={`tel:${ownerConfig.phone}`}
                  className="inline-flex items-center gap-2 hover:text-white transition-colors tabular-nums"
                >
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{ownerConfig.phone}</span>
                </a>
              </li>
              <li className="inline-flex items-center gap-2 text-slate-400">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{ownerConfig.location}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright + Discreet Admin Inbox Icon */}
        <div className="border-t border-white/10 pt-5 text-center space-y-2">
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} {ownerConfig.brandName}{' '}
            <a
              href={ownerConfig.websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="text-violet-300 hover:text-white font-semibold underline"
            >
              {ownerConfig.byline}
            </a>{' '}
            — Operated by{' '}
            <span className="text-white font-bold">{ownerConfig.ownerName}</span> (
            {ownerConfig.location}). All Rights Reserved.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap text-xs text-slate-400">
            <button type="button" onClick={() => onNavigate('terms')} className="hover:text-white cursor-pointer">
              {t.termLink}
            </button>
            <span className="text-slate-600">·</span>
            <button type="button" onClick={() => onNavigate('privacy')} className="hover:text-white cursor-pointer">
              {t.privacyLink}
            </button>
            <span className="text-slate-600">·</span>
            <button type="button" onClick={() => onNavigate('contact')} className="hover:text-white cursor-pointer">
              {t.supportLink}
            </button>
            <span className="text-slate-600">·</span>
            <button
              type="button"
              onClick={onOpenAdminInbox}
              title={lang === 'bn' ? 'অ্যাডমিন মোড খুলুন' : 'Open Admin Mode'}
              className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 font-bold transition-colors cursor-pointer"
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'অ্যাডমিন মোড' : 'Admin Mode'}</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

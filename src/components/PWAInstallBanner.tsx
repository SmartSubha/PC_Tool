import React, { useState } from 'react';
import { Download, WifiOff, Share2, X } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';
import type { AppLang } from '../data/i18n';

interface PWAInstallButtonProps {
  lang: AppLang;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ lang }) => {
  const { canInstall, isInstalled, isIOS, install } = usePWAInstall();
  const [showHelperModal, setShowHelperModal] = useState(false);

  if (isInstalled) return null;

  const handleClick = async () => {
    if (canInstall) {
      await install();
    } else {
      setShowHelperModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        title={lang === 'bn' ? 'অফলাইন অ্যাপ হিসেবে ইনস্টল করুন' : 'Install as Offline Desktop/Mobile App'}
        className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm shadow-emerald-600/25 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden md:inline">{lang === 'bn' ? 'ইনস্টল অ্যাপ' : 'Install App'}</span>
      </button>

      {showHelperModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs no-print">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  {isIOS ? <Share2 className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                </span>
                <div>
                  <h3 className="font-black text-slate-950 dark:text-white text-base">
                    {lang === 'bn' ? 'PC Tool অ্যাপ ইনস্টল করুন' : 'Install PC Tool Offline App'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {lang === 'bn' ? 'ইন্টারনেট ছাড়াই দোকানে ব্যবহার করুন' : 'Run standalone & offline on Desktop or Phone'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHelperModal(false)}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-xs text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed">
                <p className="font-bold text-slate-900 dark:text-white">
                  {lang === 'bn' ? 'iPhone / iPad Safari-তে ইনস্টল নিয়ম:' : 'Install on iPhone / iPad Safari:'}
                </p>
                <p>
                  {lang === 'bn'
                    ? '১. নিচের Share আইকন (↑)-এ ট্যাপ করুন → ২. "Add to Home Screen"-এ ট্যাপ করে Add করুন।'
                    : '1. Tap the Share icon in Safari → 2. Scroll and tap "Add to Home Screen" → 3. Tap Add.'}
                </p>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-xs text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed">
                <p className="font-bold text-slate-900 dark:text-white">
                  {lang === 'bn' ? 'Chrome / Edge ব্রাউজারে ইনস্টল নিয়ম:' : 'Install via Chrome or Microsoft Edge:'}
                </p>
                <p>
                  {lang === 'bn'
                    ? '১. ব্রাউজারের ডানদিকে অ্যাড্রেস বারের "Install App / Create Shortcut" আইকনে ক্লিক করুন (যদি এমবেডেড প্রিভিউতে থাকেন তবে ফুল ট্যাবে খুলুন)। একবার ইনস্টল হলে অফলাইনেও কাজ করবে!'
                    : 'Open this app directly in a full Chrome/Edge tab and click the Install icon in the address bar (or Menu → Save & Share → Install PC Tool) for standalone offline shop use.'}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowHelperModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-950 dark:bg-violet-600 text-white text-xs font-bold hover:bg-slate-800 dark:hover:bg-violet-700 cursor-pointer"
            >
              {lang === 'bn' ? 'বুঝেছি' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC<{ lang: AppLang }> = ({ lang }) => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-950 text-amber-100 border border-amber-500/40 shadow-xl text-xs font-bold no-print"
    >
      <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
      <span>
        {lang === 'bn'
          ? 'অফলাইন মোড চালু — ছবি, PDF, আইডি কার্ড ও ফর্ম টুলগুলো ইন্টারনেট ছাড়াই কাজ করবে'
          : 'Offline Mode — Image, PDF, ID Card & Form tools continue working offline'}
      </span>
    </div>
  );
};

import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  Lightbulb,
  Check,
  Trash2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Download,
  Megaphone,
  Eye,
  EyeOff,
  Save,
} from 'lucide-react';
import type { AppLang } from '../data/i18n';
import { TOOLS_CATALOG } from '../data/toolsCatalog';

export interface SiteAdminSettings {
  shopNotice: string;
  shopNoticeBn: string;
  disabledToolIds: string[];
  updatedAt?: string;
}

interface InboxEntry {
  id: string;
  type: 'contact' | 'suggestion';
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  read: boolean;
}

interface AdminInboxModalProps {
  open: boolean;
  lang: AppLang;
  onClose: () => void;
  onSettingsUpdated: (settings: SiteAdminSettings) => void;
  onAdminStateChange?: (unlocked: boolean) => void;
}

export const AdminInboxModal: React.FC<AdminInboxModalProps> = ({
  open,
  lang,
  onClose,
  onSettingsUpdated,
  onAdminStateChange,
}) => {
  const [passwordInput, setPasswordInput] = useState('');
  const [verifiedPassword, setVerifiedPassword] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [messages, setMessages] = useState<InboxEntry[]>([]);
  const [mainTab, setMainTab] = useState<'inbox' | 'controls'>('inbox');
  const [activeTab, setActiveTab] = useState<'all' | 'contact' | 'suggestion'>('all');

  // Admin Site Control state
  const [shopNotice, setShopNotice] = useState('');
  const [shopNoticeBn, setShopNoticeBn] = useState('');
  const [disabledToolIds, setDisabledToolIds] = useState<string[]>([]);

  if (!open) return null;

  const fetchInboxAndSettings = async (pwd: string) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/admin/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd }),
      });
      if (!res.ok) {
        setErrorMsg(
          lang === 'bn'
            ? 'ভুল পাসওয়ার্ড! অনুগ্রহ করে সঠিক অ্যাডমিন পাসওয়ার্ড দিন।'
            : 'Invalid password. Access denied.'
        );
        setVerifiedPassword(null);
        onAdminStateChange?.(false);
        return;
      }
      const data = await res.json();
      setMessages(Array.isArray(data.messages) ? data.messages : []);
      if (data.settings) {
        setShopNotice(data.settings.shopNotice || '');
        setShopNoticeBn(data.settings.shopNoticeBn || '');
        setDisabledToolIds(Array.isArray(data.settings.disabledToolIds) ? data.settings.disabledToolIds : []);
        onSettingsUpdated(data.settings);
      }
      setVerifiedPassword(pwd);
      setPasswordInput('');
      onAdminStateChange?.(true);
    } catch {
      setErrorMsg('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) return;
    void fetchInboxAndSettings(passwordInput);
  };

  const toggleRead = async (entry: InboxEntry) => {
    if (!verifiedPassword) return;
    await fetch(`/api/admin/inbox/${entry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: verifiedPassword, read: !entry.read }),
    });
    setMessages((prev) => prev.map((m) => (m.id === entry.id ? { ...m, read: !m.read } : m)));
  };

  const deleteEntry = async (id: string) => {
    if (!verifiedPassword) return;
    await fetch(`/api/admin/inbox/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: verifiedPassword }),
    });
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const saveAdminSettings = async () => {
    if (!verifiedPassword) return;
    setSavingSettings(true);
    setSaveFeedback('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: verifiedPassword,
          shopNotice,
          shopNoticeBn,
          disabledToolIds,
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      const data = await res.json();
      if (data.settings) onSettingsUpdated(data.settings);
      setSaveFeedback(lang === 'bn' ? 'সেটিংস সেভ হয়েছে!' : 'Admin settings saved live!');
      setTimeout(() => setSaveFeedback(''), 3000);
    } catch {
      setSaveFeedback(lang === 'bn' ? 'সেভ করতে সমস্যা হয়েছে' : 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const exportCsv = () => {
    const header = ['ID', 'Type', 'Name', 'Email', 'Subject', 'Message', 'CreatedAt', 'Read'];
    const esc = (s: string) => `"${String(s || '').replace(/"/g, '""')}"`;
    const rows = messages.map((m) =>
      [m.id, m.type, m.name, m.email, m.subject, m.message, m.createdAt, String(m.read)].map(esc).join(',')
    );
    const csv = [header.join(','), ...rows].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `pctool-admin-inbox-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const lockVault = () => {
    setVerifiedPassword(null);
    setMessages([]);
    setPasswordInput('');
    setErrorMsg('');
    onAdminStateChange?.(false);
  };

  const filtered = messages.filter((m) => activeTab === 'all' || m.type === activeTab);
  const unreadCount = messages.filter((m) => !m.read).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs no-print">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-extrabold">
              {lang === 'bn' ? 'অ্যাডমিন মোড ও ইনবক্স কন্ট্রোল সেন্টার (SMART SUBHA)' : 'Admin Mode Console (SMART SUBHA)'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {verifiedPassword && (
              <button
                type="button"
                onClick={lockVault}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 cursor-pointer"
              >
                Lock Admin
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        {!verifiedPassword ? (
          <form onSubmit={handleUnlock} className="p-6 sm:p-8 space-y-4">
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center mx-auto mb-2">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                {lang === 'bn' ? 'অ্যাডমিন মোড লগইন (SMART SUBHA)' : 'Protected Owner Admin Mode'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {lang === 'bn'
                  ? 'কাস্টমারদের পাঠানো মেসেজ, টুলের পরামর্শ, দোকানের নোটিশ ব্যানার এবং টুল কন্ট্রোল চালু করতে আপনার গোপন অ্যাডমিন পাসওয়ার্ড দিন।'
                  : 'Enter your secret administrator password to unlock submitted inbox messages, tool suggestions, live notice banner & tool controls.'}
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 font-semibold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter secret admin password"
              autoFocus
              className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-violet-600"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-slate-950 dark:bg-violet-600 hover:bg-slate-800 dark:hover:bg-violet-700 text-white text-sm font-bold cursor-pointer disabled:opacity-60"
            >
              {loading
                ? 'Verifying...'
                : lang === 'bn'
                ? 'অ্যাডমিন মোড আনলক করুন'
                : 'Unlock Admin Mode'}
            </button>
          </form>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Primary Console Tabs */}
            <div className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMainTab('inbox')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer ${
                    mainTab === 'inbox'
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>
                    {lang === 'bn' ? 'ইনবক্স ও পরামর্শ' : 'Inbox & Suggestions'} ({messages.length})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setMainTab('controls')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer ${
                    mainTab === 'controls'
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'দোকান নোটিশ ও টুলস' : 'Shop Notice & Tool Controls'}</span>
                </button>
              </div>

              {mainTab === 'inbox' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={exportCsv}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    Export CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => void fetchInboxAndSettings(verifiedPassword)}
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                    title="Refresh"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {mainTab === 'inbox' ? (
              <>
                <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex gap-1.5">
                    {(
                      [
                        { id: 'all', label: `All (${messages.length})` },
                        { id: 'contact', label: `Messages (${messages.filter((m) => m.type === 'contact').length})` },
                        {
                          id: 'suggestion',
                          label: `Suggestions (${messages.filter((m) => m.type === 'suggestion').length})`,
                        },
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setActiveTab(t.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                          activeTab === t.id
                            ? 'bg-slate-900 dark:bg-violet-600 text-white'
                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400 tabular-nums">
                    Unread: {unreadCount}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50/40 dark:bg-slate-950/40">
                  {filtered.length === 0 ? (
                    <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                      No submissions found yet.
                    </div>
                  ) : (
                    filtered.map((entry) => (
                      <div
                        key={entry.id}
                        className={`p-4 rounded-2xl border transition-colors ${
                          entry.read
                            ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800'
                            : 'bg-white dark:bg-slate-800 border-violet-300 dark:border-violet-600 shadow-xs'
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                entry.type === 'suggestion'
                                  ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300'
                                  : 'bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-300'
                              }`}
                            >
                              {entry.type === 'suggestion' ? (
                                <Lightbulb className="w-3 h-3" />
                              ) : (
                                <Mail className="w-3 h-3" />
                              )}
                              {entry.type === 'suggestion' ? 'Tool Suggestion' : 'Contact Message'}
                            </span>
                            {!entry.read && (
                              <span className="px-2 py-0.5 rounded-md bg-violet-600 text-white text-[10px] font-bold">
                                NEW
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {entry.email && (
                              <a
                                href={`mailto:${entry.email}?subject=Re: ${encodeURIComponent(entry.subject)}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-semibold text-violet-700 dark:text-violet-300 hover:bg-slate-100"
                              >
                                Reply
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => void toggleRead(entry)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                              {entry.read ? 'Mark Unread' : 'Mark Read'}
                            </button>
                            <button
                              type="button"
                              onClick={() => void deleteEntry(entry.id)}
                              className="p-1.5 rounded-lg border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-2 font-bold text-sm text-slate-900 dark:text-white">{entry.subject}</div>
                        <p className="mt-1 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {entry.message}
                        </p>
                        <div className="mt-3 pt-2 border-t border-slate-200/70 dark:border-slate-700 flex flex-wrap justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span>
                            <strong>{entry.name}</strong> {entry.email ? `· ${entry.email}` : ''}
                          </span>
                          <span className="tabular-nums">{new Date(entry.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Live Notice Broadcaster */}
                <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-extrabold text-slate-950 dark:text-white">
                      {lang === 'bn'
                        ? 'হোমপেজ লাইভ নোটিশ / অফার ব্যানার'
                        : 'Homepage Announcement / Counter Notice Banner'}
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setShopNotice('');
                        setShopNoticeBn('');
                      }}
                      className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                    >
                      Clear Notice
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Leave both empty to hide the notice banner on the homepage.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Notice Text (English)
                      </label>
                      <input
                        type="text"
                        value={shopNotice}
                        onChange={(e) => setShopNotice(e.target.value)}
                        placeholder="e.g. Duare Sarkar & SVMCM Scholarship forms open!"
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        নোটিশ টেক্সট (বাংলা)
                      </label>
                      <input
                        type="text"
                        value={shopNoticeBn}
                        onChange={(e) => setShopNoticeBn(e.target.value)}
                        placeholder="যেমন: দুয়ারে সরকার ও SVMCM ফর্ম ফিলাপ চলছে!"
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Tool Visibility Toggle */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-extrabold text-slate-950 dark:text-white">
                      {lang === 'bn'
                        ? 'টুলস চালু / বন্ধ করুন (Show / Hide Tools)'
                        : 'Show / Hide Tools on Public Homepage'}
                    </h4>
                    <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      Hidden: {disabledToolIds.length} / {TOOLS_CATALOG.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                    {TOOLS_CATALOG.map((tool) => {
                      const isHidden = disabledToolIds.includes(tool.id);
                      return (
                        <button
                          key={tool.id}
                          type="button"
                          onClick={() =>
                            setDisabledToolIds((prev) =>
                              isHidden ? prev.filter((id) => id !== tool.id) : [...prev, tool.id]
                            )
                          }
                          className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-left text-xs font-semibold cursor-pointer transition-colors ${
                            isHidden
                              ? 'bg-red-50/70 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <span className="truncate">{lang === 'bn' ? tool.bnName : tool.name}</span>
                          {isHidden ? (
                            <EyeOff className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <Eye className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{saveFeedback}</span>
                  <button
                    type="button"
                    disabled={savingSettings}
                    onClick={saveAdminSettings}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-extrabold cursor-pointer disabled:opacity-60"
                  >
                    <Save className="w-4 h-4" />
                    {savingSettings ? 'Saving...' : 'Save Live Settings'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

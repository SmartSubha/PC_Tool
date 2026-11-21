import React, { useEffect, useRef, useState } from 'react';
import {
  BookText,
  Plus,
  Trash2,
  CheckCircle2,
  MessageCircle,
  Printer,
  Download,
} from 'lucide-react';
import type { AppLang } from '../../data/i18n';
import { printElementHtml } from '../../utils/printHelper';

interface CyberCafeKhataLedgerProps {
  appLang: AppLang;
}

type EntryType = 'income' | 'expense' | 'udhar';

interface LedgerEntry {
  id: string;
  date: string;
  type: EntryType;
  partyName: string;
  mobile: string;
  description: string;
  amount: number;
  settled?: boolean;
}

const STORAGE_KEY = 'pc_tool_cyber_khata_v1';

export const CyberCafeKhataLedger: React.FC<CyberCafeKhataLedgerProps> = ({ appLang }) => {
  const isBn = appLang === 'bn';
  const [entries, setEntries] = useState<LedgerEntry[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [shopName, setShopName] = useState('');
  const [filterType, setFilterType] = useState<'all' | EntryType>('all');

  // Empty-default form
  const [entryType, setEntryType] = useState<EntryType>('income');
  const [partyName, setPartyName] = useState('');
  const [mobile, setMobile] = useState('');
  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');

  const printRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // ignore storage quota errors
    }
  }, [entries]);

  const addEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amountStr);
    if (!Number.isFinite(amt) || amt <= 0) return;

    const item: LedgerEntry = {
      id: crypto.randomUUID(),
      date: new Date().toLocaleDateString('en-IN'),
      type: entryType,
      partyName: partyName.trim() || (entryType === 'expense' ? 'Shop Expense' : 'Walk-in Customer'),
      mobile: mobile.replace(/\D/g, '').slice(-10),
      description: description.trim() || (entryType === 'expense' ? 'Paper / Toner / Bill' : 'Counter Service'),
      amount: amt,
      settled: entryType !== 'udhar',
    };
    setEntries((prev) => [item, ...prev]);
    setPartyName('');
    setMobile('');
    setDescription('');
    setAmountStr('');
  };

  const settleUdhar = (id: string) => {
    setEntries((prev) =>
      prev.map((item) => (item.id === id ? { ...item, type: 'income', settled: true } : item))
    );
  };

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((item) => item.id !== id));
  };

  const totalIncome = entries.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0);
  const totalExpense = entries.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
  const totalUdhar = entries.filter((e) => e.type === 'udhar').reduce((s, e) => s + e.amount, 0);
  const netProfit = totalIncome - totalExpense;

  const visibleEntries = filterType === 'all' ? entries : entries.filter((e) => e.type === filterType);

  const exportCsv = () => {
    if (entries.length === 0) return;
    const rows = [
      ['Date', 'Type', 'Customer/Party', 'Mobile', 'Description', 'Amount (INR)'],
      ...entries.map((e) => [e.date, e.type.toUpperCase(), e.partyName, e.mobile, e.description, String(e.amount)]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cyber-cafe-khata-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-950 text-white rounded-2xl p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
            <BookText className="w-4 h-4" />
            <span>{isBn ? 'দোকানের দৈনিক আয়-ব্যয়, লাভ ও বাকি-হিসাব (WhatsApp বকেয়া রিমাইন্ডারসহ)' : 'Daily Cashbook · Profit Summary · Udhar (Due) Register & WhatsApp Reminders'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-1">
            {isBn ? 'সাইবার ক্যাফে ডেইলি খাতা ও বাকি-হিসাব (Udhar Ledger)' : 'Cyber Cafe Daily Khata & Udhar Ledger'}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={entries.length === 0}
            onClick={exportCsv}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button
            type="button"
            disabled={entries.length === 0}
            onClick={() => printRef.current && printElementHtml(printRef.current, 'Cyber Cafe Daily Khata Report')}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 font-black text-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print Ledger
          </button>
        </div>
      </div>

      {/* Live Financial Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono tabular-nums">
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="text-xs font-sans font-bold text-slate-500">{isBn ? 'মোট নগদ/UPI আয়' : 'Total Received Income'}</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">₹{totalIncome.toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="text-xs font-sans font-bold text-slate-500">{isBn ? 'মোট দোকান খরচ' : 'Total Shop Expenses'}</div>
          <div className="text-2xl font-black text-rose-700 mt-1">₹{totalExpense.toFixed(2)}</div>
        </div>
        <div className="bg-slate-950 text-white rounded-2xl border border-slate-800 p-4">
          <div className="text-xs font-sans font-bold text-slate-400">{isBn ? 'নিট লাভ (Net Profit)' : 'Net Profit (In-Hand)'}</div>
          <div className={`text-2xl font-black mt-1 ${netProfit >= 0 ? 'text-amber-300' : 'text-rose-400'}`}>
            ₹{netProfit.toFixed(2)}
          </div>
        </div>
        <div className="bg-amber-50 rounded-2xl border border-amber-300 p-4">
          <div className="text-xs font-sans font-bold text-amber-900">{isBn ? 'বাকি পাওনা (Udhar Due)' : 'Pending Udhar (Due)'}</div>
          <div className="text-2xl font-black text-amber-800 mt-1">₹{totalUdhar.toFixed(2)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Add Entry Form */}
        <form onSubmit={addEntry} className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 space-y-3.5 h-fit">
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'income', label: isBn ? 'আয় (+)' : 'Income' },
              { id: 'udhar', label: isBn ? 'বাকি (Udhar)' : 'Udhar Due' },
              { id: 'expense', label: isBn ? 'খরচ (-)' : 'Expense' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setEntryType(t.id as EntryType)}
                className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                  entryType === t.id
                    ? t.id === 'income'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : t.id === 'udhar'
                      ? 'bg-amber-500 text-slate-950 border-amber-500'
                      : 'bg-rose-600 text-white border-rose-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <input
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            placeholder={isBn ? 'আপনার দোকানের নাম (রিমাইন্ডারে যাবে)' : 'Your Shop Name (for WhatsApp & Print)'}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
          />

          <input
            value={partyName}
            onChange={(e) => setPartyName(e.target.value)}
            placeholder={entryType === 'expense' ? 'Expense Item (e.g. A4 Rim / Ink)' : 'Customer Name'}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold"
          />

          {entryType !== 'expense' && (
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="Customer Mobile (10 digits for WhatsApp)"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono"
            />
          )}

          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={isBn ? 'কাজের বিবরণ (যেমন: প্যান কার্ড + জেরক্স)' : 'Work / Note (e.g. Online Form + Print)'}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
          />

          <input
            type="number"
            step="0.01"
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            placeholder="Amount in ₹ *"
            className="w-full rounded-xl border-2 border-slate-900 px-3.5 py-2.5 text-base font-mono font-black"
          />

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-slate-950 hover:bg-slate-800 text-amber-300 font-black text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {isBn ? 'খাতায় এন্ট্রি যোগ করুন' : 'Save Entry to Khata'}
          </button>
        </form>

        {/* Right Entries Ledger */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              {(['all', 'income', 'udhar', 'expense'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilterType(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize cursor-pointer ${
                    filterType === f ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-500 font-mono">{visibleEntries.length} records</span>
          </div>

          <div ref={printRef}>
            <div className="hidden print:block mb-4 border-b-2 border-slate-900 pb-2">
              <div className="text-lg font-black">{shopName || 'CYBER CAFE DAILY KHATA LEDGER'}</div>
              <div className="text-xs">Income: ₹{totalIncome.toFixed(2)} · Expense: ₹{totalExpense.toFixed(2)} · Net Profit: ₹{netProfit.toFixed(2)} · Pending Udhar: ₹{totalUdhar.toFixed(2)}</div>
            </div>

            {visibleEntries.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                {isBn ? 'এখনও কোনো হিসাব লেখা হয়নি। বাম দিক থেকে আয়, খরচ বা বাকি যোগ করুন।' : 'No ledger entries yet. Log your first income, expense, or customer Udhar on the left.'}
              </div>
            ) : (
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                {visibleEntries.map((item) => {
                  const waReminder =
                    item.type === 'udhar' && item.mobile.length === 10
                      ? `https://wa.me/91${item.mobile}?text=${encodeURIComponent(
                          `নমস্কার ${item.partyName},\n${shopName || 'আমাদের সাইবার ক্যাফে'}-এ আপনার "${item.description}" বাবদ ₹${item.amount} বকেয়া (Udhar) রয়েছে। অনুগ্রহ করে সুবিধামতো পরিশোধ করে দেবেন। ধন্যবাদ!`
                        )}`
                      : '';

                  return (
                    <div key={item.id} className="p-3.5 flex flex-wrap items-center justify-between gap-3 bg-white hover:bg-slate-50">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-950 text-sm">{item.partyName}</span>
                          <span
                            className={`text-[10px] font-black uppercase ${
                              item.type === 'income'
                                ? 'text-emerald-700'
                                : item.type === 'udhar'
                                ? 'text-amber-700'
                                : 'text-rose-700'
                            }`}
                          >
                            · {item.type}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600">{item.description}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {item.date}{item.mobile ? ` · +91 ${item.mobile}` : ''}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono font-black text-base tabular-nums ${
                            item.type === 'income'
                              ? 'text-emerald-700'
                              : item.type === 'udhar'
                              ? 'text-amber-700'
                              : 'text-rose-700'
                          }`}
                        >
                          {item.type === 'expense' ? '-' : '+'}₹{item.amount.toFixed(2)}
                        </span>

                        {item.type === 'udhar' && (
                          <>
                            <button
                              type="button"
                              onClick={() => settleUdhar(item.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold inline-flex items-center gap-1 print:hidden cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                            </button>
                            {waReminder && (
                              <a
                                href={waReminder}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1.5 rounded-lg bg-green-600 text-white text-[11px] font-bold inline-flex items-center gap-1 print:hidden"
                              >
                                <MessageCircle className="w-3.5 h-3.5" /> Remind
                              </a>
                            )}
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => removeEntry(item.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 print:hidden cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

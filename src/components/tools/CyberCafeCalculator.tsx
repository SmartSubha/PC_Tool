import React, { useMemo, useRef, useState } from 'react';
import {
  Printer,
  Copy,
  Check,
  Trash2,
  Plus,
  Minus,
  RotateCcw,
  Delete,
  Receipt,
  Percent,
  IndianRupee,
  ArrowRight,
  Calculator,
} from 'lucide-react';
import type { AppLang } from '../../data/i18n';
import { printElementHtml } from '../../utils/printHelper';

interface CyberCafeCalculatorProps {
  appLang: AppLang;
}

interface BillJobItem {
  id: string;
  label: string;
  unitLabel: string;
  qty: number;
  rate: number;
}

interface QuickPrintKey {
  id: string;
  shortLabel: string;
  bnLabel: string;
  unitLabel: string;
  defaultRate: number;
  keyBg: string;
}

const QUICK_PRINT_KEYS: QuickPrintKey[] = [
  {
    id: 'bw-print',
    shortLabel: 'B&W Print (A4)',
    bnLabel: 'সাদা-কালো প্রিন্ট',
    unitLabel: 'pg',
    defaultRate: 5,
    keyBg: 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-100',
  },
  {
    id: 'color-print',
    shortLabel: 'Color Print (A4)',
    bnLabel: 'কালার প্রিন্ট',
    unitLabel: 'pg',
    defaultRate: 15,
    keyBg: 'bg-sky-950 hover:bg-sky-900 border-sky-500/60 text-sky-200',
  },
  {
    id: 'xerox-single',
    shortLabel: 'Xerox Single',
    bnLabel: 'জেরক্স (১ পিঠ)',
    unitLabel: 'pg',
    defaultRate: 2,
    keyBg: 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-100',
  },
  {
    id: 'xerox-duplex',
    shortLabel: 'Xerox Both Side',
    bnLabel: 'জেরক্স (২ পিঠ)',
    unitLabel: 'sheet',
    defaultRate: 3,
    keyBg: 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-100',
  },
  {
    id: 'lamination-a4',
    shortLabel: 'A4 Lamination',
    bnLabel: 'A4 ল্যামিনেশন',
    unitLabel: 'pc',
    defaultRate: 30,
    keyBg: 'bg-amber-950 hover:bg-amber-900 border-amber-500/60 text-amber-200',
  },
  {
    id: 'lamination-id',
    shortLabel: 'ID Card Lamination',
    bnLabel: 'আইডি ল্যামিনেশন',
    unitLabel: 'pc',
    defaultRate: 20,
    keyBg: 'bg-amber-950 hover:bg-amber-900 border-amber-500/60 text-amber-200',
  },
  {
    id: 'passport-sheet',
    shortLabel: 'Passport Photos',
    bnLabel: 'পাসপোর্ট ছবি সেট',
    unitLabel: 'set',
    defaultRate: 40,
    keyBg: 'bg-emerald-950 hover:bg-emerald-900 border-emerald-500/60 text-emerald-200',
  },
  {
    id: 'scan-pdf',
    shortLabel: 'Scan / PDF Mail',
    bnLabel: 'স্ক্যান ও PDF',
    unitLabel: 'pg',
    defaultRate: 10,
    keyBg: 'bg-indigo-950 hover:bg-indigo-900 border-indigo-500/60 text-indigo-200',
  },
  {
    id: 'spiral-bind',
    shortLabel: 'Spiral Binding',
    bnLabel: 'স্পাইরাল বাইন্ডিং',
    unitLabel: 'book',
    defaultRate: 40,
    keyBg: 'bg-violet-950 hover:bg-violet-900 border-violet-500/60 text-violet-200',
  },
  {
    id: 'online-form',
    shortLabel: 'Online Form Fillup',
    bnLabel: 'অনলাইন ফর্ম ফিলাপ',
    unitLabel: 'form',
    defaultRate: 50,
    keyBg: 'bg-rose-950 hover:bg-rose-900 border-rose-500/60 text-rose-200',
  },
];

function safeEvaluateExpression(expr: string): number | null {
  const sanitized = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/[^0-9+\-*/.() ]/g, '').trim();
  if (!sanitized) return null;
  try {
    // Pure arithmetic parser via Function on strictly validated numeric/operator tokens
    const fn = new Function(`"use strict"; return (${sanitized});`);
    const result = fn();
    if (typeof result === 'number' && Number.isFinite(result)) {
      return Math.round(result * 100) / 100;
    }
    return null;
  } catch {
    return null;
  }
}

export const CyberCafeCalculator: React.FC<CyberCafeCalculatorProps> = ({ appLang }) => {
  const isBn = appLang === 'bn';
  const printRef = useRef<HTMLDivElement | null>(null);

  // Billing tape items
  const [items, setItems] = useState<BillJobItem[]>([]);

  // Optional header details (strictly empty initially)
  const [shopTitle, setShopTitle] = useState('');
  const [customerName, setCustomerName] = useState('');

  // Custom document job entry (strictly empty initially)
  const [customJobName, setCustomJobName] = useState('');
  const [customQty, setCustomQty] = useState('');
  const [customRate, setCustomRate] = useState('');

  // Tax / GST controls
  const [gstMode, setGstMode] = useState<'none' | 'exclusive' | 'inclusive'>('exclusive');
  const [gstRateStr, setGstRateStr] = useState<string>('0');

  // Discount controls (empty input initially)
  const [discountType, setDiscountType] = useState<'percent' | 'flat'>('percent');
  const [discountValStr, setDiscountValStr] = useState<string>('');
  const [roundOffEnabled, setRoundOffEnabled] = useState<boolean>(false);

  // Cash counter tender input (empty initially)
  const [cashReceivedStr, setCashReceivedStr] = useState<string>('');

  // Tactile Hardware Scratchpad Math Console
  const [mathExpr, setMathExpr] = useState<string>('');
  const [mathResult, setMathResult] = useState<string>('0');
  const [copiedBill, setCopiedBill] = useState<boolean>(false);

  // Add or increment a quick-print document job
  const handleAddQuickKey = (key: QuickPrintKey) => {
    setItems((prev) => {
      const existing = prev.find((it) => it.id === key.id);
      if (existing) {
        return prev.map((it) => (it.id === key.id ? { ...it, qty: it.qty + 1 } : it));
      }
      return [
        ...prev,
        {
          id: key.id,
          label: key.shortLabel,
          unitLabel: key.unitLabel,
          qty: 1,
          rate: key.defaultRate,
        },
      ];
    });
  };

  const handleAddCustomJob = () => {
    const qty = Math.max(1, Number(customQty) || 1);
    const rate = Math.max(0, Number(customRate) || 0);
    if (!customJobName.trim() && rate <= 0) return;
    setItems((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        label: customJobName.trim() || (isBn ? 'প্রিন্ট / ডকুমেন্ট সার্ভিস' : 'Print / Document Service'),
        unitLabel: 'unit',
        qty,
        rate,
      },
    ]);
    setCustomJobName('');
    setCustomQty('');
    setCustomRate('');
  };

  const updateItemQty = (id: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((it) => (it.id === id ? { ...it, qty: Math.max(0, it.qty + delta) } : it))
        .filter((it) => it.qty > 0)
    );
  };

  const updateItemRate = (id: string, nextRate: number) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, rate: Math.max(0, nextRate) } : it))
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Tactile Math Keypad actions
  const handlePadPress = (token: string) => {
    if (token === 'C') {
      setMathExpr('');
      setMathResult('0');
      return;
    }
    if (token === 'DEL') {
      const next = mathExpr.slice(0, -1);
      setMathExpr(next);
      const val = safeEvaluateExpression(next);
      setMathResult(val !== null ? String(val) : '0');
      return;
    }
    if (token === '=') {
      const val = safeEvaluateExpression(mathExpr);
      if (val !== null) {
        setMathResult(String(val));
        setMathExpr(String(val));
      }
      return;
    }
    const next = mathExpr + token;
    setMathExpr(next);
    const val = safeEvaluateExpression(next);
    if (val !== null) setMathResult(String(val));
  };

  const handlePushMathToBill = () => {
    const val = safeEvaluateExpression(mathExpr) ?? Number(mathResult);
    if (!Number.isFinite(val) || val <= 0) return;
    setItems((prev) => [
      ...prev,
      {
        id: `calc-${Date.now()}`,
        label: mathExpr.trim() ? `Calc Charge (${mathExpr.trim()})` : 'Counter Service Charge',
        unitLabel: 'job',
        qty: 1,
        rate: Math.round(val * 100) / 100,
      },
    ]);
    setMathExpr('');
    setMathResult('0');
  };

  // Billing Math Breakdown
  const summary = useMemo(() => {
    const subtotal = items.reduce((acc, it) => acc + it.qty * it.rate, 0);
    const totalUnits = items.reduce((acc, it) => acc + it.qty, 0);

    const rawDiscount = Math.max(0, Number(discountValStr) || 0);
    const discountAmount =
      discountType === 'percent'
        ? Math.min(subtotal, (subtotal * Math.min(100, rawDiscount)) / 100)
        : Math.min(subtotal, rawDiscount);

    const afterDiscount = Math.max(0, subtotal - discountAmount);
    const gstPct = gstMode === 'none' ? 0 : Math.max(0, Math.min(100, Number(gstRateStr) || 0));

    let taxableBase = afterDiscount;
    let totalTax = 0;
    let exactGrandTotal = afterDiscount;

    if (gstMode === 'exclusive' && gstPct > 0) {
      totalTax = (afterDiscount * gstPct) / 100;
      exactGrandTotal = afterDiscount + totalTax;
    } else if (gstMode === 'inclusive' && gstPct > 0) {
      taxableBase = afterDiscount / (1 + gstPct / 100);
      totalTax = afterDiscount - taxableBase;
      exactGrandTotal = afterDiscount;
    }

    const cgst = totalTax / 2;
    const sgst = totalTax / 2;
    const finalTotal = roundOffEnabled ? Math.round(exactGrandTotal) : exactGrandTotal;
    const roundOffDiff = finalTotal - exactGrandTotal;

    const cashReceived = Math.max(0, Number(cashReceivedStr) || 0);
    const changeDue = cashReceived > 0 ? cashReceived - finalTotal : 0;

    return {
      subtotal,
      totalUnits,
      discountAmount,
      afterDiscount,
      gstPct,
      taxableBase,
      totalTax,
      cgst,
      sgst,
      exactGrandTotal,
      finalTotal,
      roundOffDiff,
      cashReceived,
      changeDue,
    };
  }, [items, discountType, discountValStr, gstMode, gstRateStr, roundOffEnabled, cashReceivedStr]);

  const handleCopySummary = async () => {
    const lines = [
      shopTitle.trim() ? `=== ${shopTitle.trim()} ===` : '=== CYBER CAFE PRINT BILL ===',
      customerName.trim() ? `Customer: ${customerName.trim()}` : '',
      ...items.map((it) => `${it.label} (${it.qty} × ₹${it.rate}) = ₹${(it.qty * it.rate).toFixed(2)}`),
      '----------------------------',
      `Subtotal: ₹${summary.subtotal.toFixed(2)}`,
      summary.discountAmount > 0 ? `Discount: -₹${summary.discountAmount.toFixed(2)}` : '',
      summary.totalTax > 0
        ? `GST (${summary.gstPct}% | CGST ₹${summary.cgst.toFixed(2)} + SGST ₹${summary.sgst.toFixed(2)}): ₹${summary.totalTax.toFixed(2)}`
        : '',
      `TOTAL PAYABLE: ₹${summary.finalTotal.toFixed(2)}`,
    ].filter(Boolean);

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedBill(true);
      setTimeout(() => setCopiedBill(false), 1800);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleResetAll = () => {
    setItems([]);
    setCustomerName('');
    setCustomJobName('');
    setCustomQty('');
    setCustomRate('');
    setDiscountValStr('');
    setCashReceivedStr('');
    setMathExpr('');
    setMathResult('0');
  };

  const nowStamp = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="space-y-6">
      {/* Main Split Hardware POS Console + Live Thermal Billing Tape */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT CONSOLE: Unique Hardware Cyber Desk POS Terminal */}
        <div className="xl:col-span-7 bg-slate-950 text-white rounded-2xl border-2 border-slate-700 shadow-xl overflow-hidden">
          {/* Recessed Dual-Line Phosphor LCD Readout */}
          <div className="p-4 sm:p-5 bg-zinc-950 border-b-2 border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <Calculator className="w-4 h-4" />
                <span>
                  {isBn
                    ? 'সাইবার ক্যাফে কাউন্টার ক্যালকুলেটর ও বিলিং কনসোল'
                    : 'Cyber Cafe Counter POS & Document Billing Console'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetAll}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-rose-950 border border-slate-700 hover:border-rose-500 text-[11px] font-bold text-slate-300 hover:text-rose-200 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isBn ? 'নতুন কাস্টমার' : 'New Customer'}</span>
              </button>
            </div>

            {/* Digital LED Counter Screen */}
            <div className="rounded-xl bg-[#071510] border-2 border-emerald-500/40 p-4 shadow-inner">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-emerald-400/80">
                <span>
                  {items.length} {isBn ? 'টি সার্ভিস' : 'jobs'} · {summary.totalUnits}{' '}
                  {isBn ? 'পাতা/কপি' : 'pages/units'}
                </span>
                <span>
                  {gstMode === 'none' || summary.gstPct === 0
                    ? 'TAX OFF'
                    : `GST ${summary.gstPct}% (${gstMode.toUpperCase()})`}
                </span>
              </div>

              <div className="mt-2 flex items-baseline justify-between gap-4">
                <div className="font-mono text-xs text-amber-300/90 truncate">
                  {mathExpr ? `MATH: ${mathExpr} = ${mathResult}` : 'READY · TAP SERVICE KEY'}
                </div>
                <div className="font-mono text-3xl sm:text-4xl font-black text-emerald-300 tabular-nums tracking-tight shrink-0">
                  ₹{summary.finalTotal.toFixed(2)}
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-emerald-500/20 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-emerald-200/75 tabular-nums">
                <span>SUB ₹{summary.subtotal.toFixed(2)}</span>
                <span>DISC -₹{summary.discountAmount.toFixed(2)}</span>
                <span>GST +₹{summary.totalTax.toFixed(2)}</span>
                {summary.cashReceived > 0 && (
                  <span className="text-amber-300 font-bold">
                    {summary.changeDue >= 0
                      ? `RETURN ₹${summary.changeDue.toFixed(2)}`
                      : `DUE ₹${Math.abs(summary.changeDue).toFixed(2)}`}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 1-Tap Tactile Document & Print Service Keypad */}
          <div className="p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-300">
                {isBn
                  ? '১-ক্লিকে প্রিন্ট / জেরক্স / ল্যামিনেশন যোগ করুন (রেট টেবিলে বদলাতে পারবেন)'
                  : '1-Tap Printed Document Keys (Click to add/increment)'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {QUICK_PRINT_KEYS.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => handleAddQuickKey(k)}
                  className={`p-2.5 rounded-xl border-2 text-left transition-transform active:scale-95 cursor-pointer shadow-xs ${k.keyBg}`}
                >
                  <div className="text-[11px] font-black leading-tight">
                    {isBn ? k.bnLabel : k.shortLabel}
                  </div>
                  <div className="mt-1.5 font-mono text-xs font-extrabold text-amber-300 tabular-nums">
                    ₹{k.defaultRate}/{k.unitLabel}
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Document Job Strip (empty default inputs) */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700 space-y-2.5">
              <div className="text-[11px] font-extrabold text-amber-300">
                {isBn ? 'কাস্টম কাজ বা ফর্মের চার্জ যোগ করুন' : 'Add Custom Print / Cyber Job'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <input
                  type="text"
                  value={customJobName}
                  onChange={(e) => setCustomJobName(e.target.value)}
                  placeholder={isBn ? 'কাজের নাম (যেমন: প্যান কার্ড)' : 'Job name (e.g. Colour Glossy A4)'}
                  className="sm:col-span-6 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-amber-400"
                />
                <input
                  type="number"
                  min={1}
                  value={customQty}
                  onChange={(e) => setCustomQty(e.target.value)}
                  placeholder={isBn ? 'সংখ্যা' : 'Qty'}
                  className="sm:col-span-2 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs font-mono font-bold tabular-nums focus:outline-none focus:border-amber-400"
                />
                <input
                  type="number"
                  min={0}
                  step="0.5"
                  value={customRate}
                  onChange={(e) => setCustomRate(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddCustomJob();
                  }}
                  placeholder={isBn ? 'রেট ₹' : 'Rate ₹'}
                  className="sm:col-span-2 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs font-mono font-bold tabular-nums focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={handleAddCustomJob}
                  className="sm:col-span-2 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isBn ? 'যোগ' : 'Add'}</span>
                </button>
              </div>
            </div>

            {/* Tactile Mechanical Numeric Scratchpad + Push to Bill */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-extrabold text-slate-300">
                  {isBn ? 'দ্রুত হিসাবের কিপ্যাড (বিলে পাঠাতে পারবেন)' : 'Counter Math Pad (Push Result Directly to Bill)'}
                </span>
                <span className="font-mono text-xs font-black text-emerald-300 tabular-nums">
                  = ₹{mathResult}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2 font-mono">
                {['7', '8', '9', '÷', 'C', '4', '5', '6', '×', 'DEL', '1', '2', '3', '-', '=', '0', '00', '.', '+'].map(
                  (key) => {
                    const isOp = ['÷', '×', '-', '+'].includes(key);
                    const isClear = key === 'C' || key === 'DEL';
                    const isEq = key === '=';
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handlePadPress(key)}
                        className={`py-2.5 rounded-lg text-sm font-black border transition-transform active:scale-95 cursor-pointer flex items-center justify-center ${
                          isEq
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-400'
                            : isOp
                            ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/50'
                            : isClear
                            ? 'bg-rose-950 hover:bg-rose-900 text-rose-200 border-rose-700'
                            : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-600'
                        }`}
                      >
                        {key === 'DEL' ? <Delete className="w-4 h-4" /> : key}
                      </button>
                    );
                  }
                )}
                <button
                  type="button"
                  onClick={handlePushMathToBill}
                  className="py-2.5 px-2 rounded-lg bg-sky-400 hover:bg-sky-300 text-slate-950 text-[11px] font-sans font-black flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <span>{isBn ? 'বিলে নিন' : 'To Bill'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT CONSOLE: Tax/GST + Discount + Cash Return + Printable Billing Tape */}
        <div className="xl:col-span-5 space-y-5">
          {/* GST & Discount Configuration Card */}
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-950 dark:border-slate-700 rounded-2xl p-4 sm:p-5 space-y-4 shadow-md">
            {/* Optional Shop & Customer Inputs (Empty by Default) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                value={shopTitle}
                onChange={(e) => setShopTitle(e.target.value)}
                placeholder={isBn ? 'দোকানের নাম (ঐচ্ছিক)' : 'Shop / Cyber Cafe Name (Optional)'}
                className="px-3 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white text-xs font-bold focus:outline-none focus:border-slate-950 dark:focus:border-amber-400"
              />
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={isBn ? 'কাস্টমারের নাম (ঐচ্ছিক)' : 'Customer Name (Optional)'}
                className="px-3 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-white text-xs font-bold focus:outline-none focus:border-slate-950 dark:focus:border-amber-400"
              />
            </div>

            {/* GST / Tax Controls */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black text-slate-950 dark:text-amber-300">
                  {isBn ? 'ট্যাক্স / GST সেটিংস (CGST + SGST)' : 'Tax / GST Engine (CGST + SGST Split)'}
                </span>
                <div className="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                  {(['none', 'exclusive', 'inclusive'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setGstMode(m)}
                      className={`px-2 py-1 rounded-md text-[10px] font-black uppercase cursor-pointer transition-colors ${
                        gstMode === m
                          ? 'bg-slate-950 dark:bg-amber-400 text-white dark:text-slate-950'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {m === 'none' ? 'Off' : m === 'exclusive' ? '+GST' : 'Incl.'}
                    </button>
                  ))}
                </div>
              </div>

              {gstMode !== 'none' && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {['0', '5', '12', '18', '28'].map((slab) => (
                    <button
                      key={slab}
                      type="button"
                      onClick={() => setGstRateStr(slab)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-black border-2 cursor-pointer tabular-nums ${
                        gstRateStr === slab
                          ? 'bg-slate-950 dark:bg-amber-400 text-white dark:text-slate-950 border-slate-950 dark:border-amber-400'
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {slab}%
                    </button>
                  ))}
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={gstRateStr}
                    onChange={(e) => setGstRateStr(e.target.value)}
                    placeholder="Custom %"
                    className="w-20 px-2.5 py-1.5 rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-950 dark:text-white text-xs font-mono font-bold tabular-nums"
                  />
                </div>
              )}
            </div>

            {/* Discount Management */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black text-slate-950 dark:text-amber-300">
                  {isBn ? 'ডিসকাউন্ট (ছাড়) ম্যানেজমেন্ট' : 'Discount Management'}
                </span>
                <div className="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setDiscountType('percent')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-black cursor-pointer ${
                      discountType === 'percent'
                        ? 'bg-slate-950 dark:bg-amber-400 text-white dark:text-slate-950'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Percent className="w-3 h-3" />
                    <span>%</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('flat')}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-black cursor-pointer ${
                      discountType === 'flat'
                        ? 'bg-slate-950 dark:bg-amber-400 text-white dark:text-slate-950'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <IndianRupee className="w-3 h-3" />
                    <span>Flat ₹</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={discountValStr}
                  onChange={(e) => setDiscountValStr(e.target.value)}
                  placeholder={discountType === 'percent' ? 'Discount %' : 'Flat ₹ off'}
                  className="flex-1 min-w-[110px] px-3 py-1.5 rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-950 dark:text-white text-xs font-mono font-bold tabular-nums"
                />
                {(discountType === 'percent' ? ['5', '10', '15'] : ['5', '10', '20']).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setDiscountValStr(val)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs font-mono font-bold cursor-pointer tabular-nums"
                  >
                    {discountType === 'percent' ? `${val}%` : `₹${val}`}
                  </button>
                ))}
                <label className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer ml-auto">
                  <input
                    type="checkbox"
                    checked={roundOffEnabled}
                    onChange={(e) => setRoundOffEnabled(e.target.checked)}
                    className="w-3.5 h-3.5 accent-slate-950 dark:accent-amber-400"
                  />
                  <span>Round ₹</span>
                </label>
              </div>
            </div>

            {/* Cash Received & Change Calculator */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-black text-slate-950 dark:text-slate-200">
                <span>{isBn ? 'কাস্টমার দিল (Cash Received ₹)' : 'Cash Received & Change Return'}</span>
                {summary.cashReceived > 0 && (
                  <span
                    className={`font-mono font-black tabular-nums ${
                      summary.changeDue >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {summary.changeDue >= 0
                      ? `${isBn ? 'ফেরত' : 'Change'}: ₹${summary.changeDue.toFixed(2)}`
                      : `${isBn ? 'বাকি' : 'Short'}: ₹${Math.abs(summary.changeDue).toFixed(2)}`}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  value={cashReceivedStr}
                  onChange={(e) => setCashReceivedStr(e.target.value)}
                  placeholder="₹ Received"
                  className="flex-1 min-w-[100px] px-3 py-1.5 rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-950 dark:text-white text-xs font-mono font-bold tabular-nums"
                />
                {['50', '100', '200', '500'].map((note) => (
                  <button
                    key={note}
                    type="button"
                    onClick={() => setCashReceivedStr(note)}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-400 text-emerald-900 dark:text-emerald-200 text-xs font-mono font-black cursor-pointer tabular-nums"
                  >
                    ₹{note}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Printable Thermal-Style Billing Summary Tape */}
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-950 dark:border-slate-700 rounded-2xl overflow-hidden shadow-md">
            <div className="px-4 py-3 bg-slate-950 text-white flex flex-wrap items-center justify-between gap-2 no-print">
              <div className="flex items-center gap-2 text-xs font-black text-amber-300">
                <Receipt className="w-4 h-4" />
                <span>{isBn ? 'প্রিন্ট বিল সামারি স্লিপ' : 'Live Printed Document Bill Summary'}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopySummary}
                  disabled={items.length === 0}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white text-[11px] font-bold cursor-pointer"
                >
                  {copiedBill ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedBill ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    printElementHtml(
                      printRef.current,
                      shopTitle.trim() ? `${shopTitle.trim()} - Bill` : 'Cyber Cafe Print Bill'
                    )
                  }
                  disabled={items.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 text-slate-950 text-xs font-black cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isBn ? 'প্রিন্ট বিল (A4)' : 'Print Bill'}</span>
                </button>
              </div>
            </div>

            <div ref={printRef} className="print-area p-5 bg-white text-slate-950 font-mono text-xs space-y-3">
              <div className="text-center border-b-2 border-dashed border-slate-400 pb-3">
                <div className="text-base font-black tracking-tight uppercase">
                  {shopTitle.trim() || 'CYBER CAFE & PRINT DESK'}
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">{nowStamp}</div>
                {customerName.trim() && (
                  <div className="text-xs font-bold text-slate-800 mt-1">
                    Customer: {customerName.trim()}
                  </div>
                )}
              </div>

              {items.length === 0 ? (
                <div className="py-8 text-center text-slate-500 font-sans text-xs font-semibold">
                  {isBn
                    ? 'বামদিকের সার্ভিস বাটনগুলোতে ক্লিক করে বিল তৈরি শুরু করুন।'
                    : 'Tap any print, xerox, lamination, or photo key on the left to build the customer bill.'}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-1 text-[10px] font-black text-slate-500 border-b border-slate-300 pb-1">
                    <div className="col-span-5">DOCUMENT / JOB</div>
                    <div className="col-span-3 text-center">QTY</div>
                    <div className="col-span-2 text-right">RATE</div>
                    <div className="col-span-2 text-right">AMT</div>
                  </div>

                  {items.map((it) => (
                    <div
                      key={it.id}
                      className="grid grid-cols-12 gap-1 items-center py-1 border-b border-dotted border-slate-200"
                    >
                      <div className="col-span-5 font-sans font-bold text-slate-900 leading-tight pr-1">
                        {it.label}
                      </div>
                      <div className="col-span-3 flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateItemQty(it.id, -1)}
                          className="w-5 h-5 rounded bg-slate-200 hover:bg-slate-300 flex items-center justify-center cursor-pointer no-print"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-black tabular-nums min-w-[20px] text-center">
                          {it.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateItemQty(it.id, 1)}
                          className="w-5 h-5 rounded bg-slate-200 hover:bg-slate-300 flex items-center justify-center cursor-pointer no-print"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="col-span-2 text-right">
                        <input
                          type="number"
                          min={0}
                          value={it.rate}
                          onChange={(e) => updateItemRate(it.id, Number(e.target.value) || 0)}
                          aria-label={`Rate for ${it.label}`}
                          className="w-12 text-right bg-slate-100 border border-slate-300 rounded px-1 py-0.5 text-[11px] font-bold tabular-nums no-print"
                        />
                        <span className="hidden print:inline tabular-nums">₹{it.rate}</span>
                      </div>
                      <div className="col-span-2 flex items-center justify-end gap-1 font-black tabular-nums">
                        <span>{(it.qty * it.rate).toFixed(0)}</span>
                        <button
                          type="button"
                          onClick={() => removeItem(it.id)}
                          className="text-rose-500 hover:text-rose-700 cursor-pointer no-print"
                          aria-label={`Remove ${it.label}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Totals Breakdown */}
              <div className="border-t-2 border-dashed border-slate-400 pt-3 space-y-1 tabular-nums">
                <div className="flex justify-between">
                  <span>Subtotal ({summary.totalUnits} units)</span>
                  <span className="font-bold">₹{summary.subtotal.toFixed(2)}</span>
                </div>
                {summary.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>
                      Discount ({discountType === 'percent' ? `${discountValStr}%` : 'Flat'})
                    </span>
                    <span>-₹{summary.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {summary.totalTax > 0 && (
                  <>
                    <div className="flex justify-between text-slate-600 text-[11px]">
                      <span>Taxable Value</span>
                      <span>₹{summary.taxableBase.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>CGST ({(summary.gstPct / 2).toFixed(1)}%)</span>
                      <span>₹{summary.cgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>SGST ({(summary.gstPct / 2).toFixed(1)}%)</span>
                      <span>₹{summary.sgst.toFixed(2)}</span>
                    </div>
                  </>
                )}
                {roundOffEnabled && Math.abs(summary.roundOffDiff) > 0.001 && (
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>Round Off</span>
                    <span>
                      {summary.roundOffDiff >= 0 ? '+' : ''}
                      {summary.roundOffDiff.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t-2 border-slate-900 pt-2 mt-2 text-base font-black">
                  <span>NET PAYABLE</span>
                  <span>₹{summary.finalTotal.toFixed(2)}</span>
                </div>
                {summary.cashReceived > 0 && (
                  <div className="flex justify-between text-[11px] text-slate-700 pt-1">
                    <span>Cash Paid: ₹{summary.cashReceived.toFixed(2)}</span>
                    <span className="font-black">
                      {summary.changeDue >= 0
                        ? `Return: ₹${summary.changeDue.toFixed(2)}`
                        : `Balance Due: ₹${Math.abs(summary.changeDue).toFixed(2)}`}
                    </span>
                  </div>
                )}
              </div>

              <div className="text-center text-[10px] text-slate-500 pt-2 border-t border-dotted border-slate-300">
                Thank you for visiting! Please check printed copies before leaving.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useRef, useState } from 'react';
import {
  Ticket,
  Plus,
  MessageCircle,
  Volume2,
  Printer,
  Copy,
  Check,
  Trash2,
  CheckCircle2,
  Clock,
  Play,
} from 'lucide-react';
import type { AppLang } from '../../data/i18n';
import { toBengaliDigits } from '../../utils/bengaliPhonetic';
import { printElementHtml } from '../../utils/printHelper';

interface QueueTokenWhatsappProps {
  appLang: AppLang;
}

type TokenStatus = 'waiting' | 'working' | 'ready' | 'delivered';

interface QueueItem {
  id: string;
  tokenNo: number;
  customerName: string;
  mobile: string;
  service: string;
  billAmount: string;
  status: TokenStatus;
  createdAt: string;
}

export const QueueTokenWhatsapp: React.FC<QueueTokenWhatsappProps> = ({ appLang }) => {
  const isBn = appLang === 'bn';
  const [shopName, setShopName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [service, setService] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [nextToken, setNextToken] = useState(1);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [printTokenItem, setPrintTokenItem] = useState<QueueItem | null>(null);
  const tokenSlipRef = useRef<HTMLDivElement | null>(null);

  const addToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() && !service.trim()) return;
    const item: QueueItem = {
      id: crypto.randomUUID(),
      tokenNo: nextToken,
      customerName: customerName.trim() || `Customer #${nextToken}`,
      mobile: mobile.replace(/\D/g, '').slice(-10),
      service: service.trim() || (isBn ? 'ডকুমেন্ট প্রিন্ট / ফর্ম' : 'Document / Form Job'),
      billAmount: billAmount.trim(),
      status: 'waiting',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setQueue((prev) => [item, ...prev]);
    setNextToken((n) => n + 1);
    setCustomerName('');
    setMobile('');
    setService('');
    setBillAmount('');
  };

  const updateStatus = (id: string, status: TokenStatus) => {
    setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, status } : q)));
  };

  const removeItem = (id: string) => {
    setQueue((prev) => prev.filter((q) => q.id !== id));
  };

  const buildReadyMessage = (item: QueueItem) => {
    const shop = shopName.trim() || 'আমাদের সাইবার ক্যাফে';
    const amtText = item.billAmount ? ` (মোট বিল: ₹${item.billAmount})` : '';
    return `নমস্কার ${item.customerName},\nআপনার টোকেন নম্বর #${String(item.tokenNo).padStart(3, '0')} — "${item.service}" কাজটি সম্পন্ন হয়ে গেছে${amtText}।\nঅনুগ্রহ করে ${shop}-এর কাউন্টার থেকে আপনার ডকুমেন্ট সংগ্রহ করে নিন। ধন্যবাদ!`;
  };

  const handleCopyMessage = async (item: QueueItem) => {
    await navigator.clipboard.writeText(buildReadyMessage(item));
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const announceTokenVoice = (item: QueueItem) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const bnToken = toBengaliDigits(item.tokenNo);
    const msg = `টোকেন নম্বর ${bnToken}, ${item.customerName}, আপনার কাজ সম্পন্ন হয়েছে। অনুগ্রহ করে কাউন্টারে আসুন।`;
    const utter = new SpeechSynthesisUtterance(msg);
    utter.lang = 'bn-IN';
    utter.rate = 0.94;
    window.speechSynthesis.speak(utter);
  };

  const handlePrintSlip = (item: QueueItem) => {
    setPrintTokenItem(item);
    setTimeout(() => {
      if (tokenSlipRef.current) {
        printElementHtml(tokenSlipRef.current, `Token #${String(item.tokenNo).padStart(3, '0')}`);
      }
    }, 60);
  };

  const counts = {
    waiting: queue.filter((q) => q.status === 'waiting').length,
    working: queue.filter((q) => q.status === 'working').length,
    ready: queue.filter((q) => q.status === 'ready').length,
    delivered: queue.filter((q) => q.status === 'delivered').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-amber-300">
            {isBn ? 'ভিড় সামলানোর কাউন্টার টোকেন + ১-ক্লিক WhatsApp রেডি অ্যালার্ট' : 'Counter Queue Manager · Token Slips · 1-Click WhatsApp Alerts'}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-1">
            {isBn ? 'অফলাইন কিউ টোকেন ও WhatsApp "ডকুমেন্ট রেডি" বোর্ড' : 'Customer Queue Token & WhatsApp Ready Board'}
          </h2>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
          <span>Waiting: <strong className="text-amber-300">{counts.waiting}</strong></span>
          <span>·</span>
          <span>Working: <strong className="text-sky-300">{counts.working}</strong></span>
          <span>·</span>
          <span>Ready: <strong className="text-emerald-400">{counts.ready}</strong></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Add Customer Token Form */}
        <form onSubmit={addToken} className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 space-y-3.5 h-fit">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              {isBn ? 'নতুন কাস্টমার টোকেন ইস্যু করুন' : 'Issue New Counter Token'}
            </h3>
            <span className="font-mono text-sm font-black text-indigo-700">
              #{String(nextToken).padStart(3, '0')}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isBn ? 'আপনার দোকানের নাম (মেসেজে যাবে)' : 'Your Shop Name (for WhatsApp & Slip)'}
            </label>
            <input
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="Enter your Cyber Cafe / Studio name"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isBn ? 'কাস্টমারের নাম' : 'Customer Name'}
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer name"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isBn ? 'WhatsApp মোবাইল নম্বর (১০ ডিজিট)' : 'WhatsApp Mobile (10 digits)'}
            </label>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="10-digit mobile number"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isBn ? 'কাজের বিবরণ' : 'Job / Document Service'}
            </label>
            <input
              type="text"
              value={service}
              onChange={(e) => setService(e.target.value)}
              placeholder="e.g. PAN Apply + 8 Passport Photo"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isBn ? 'বিল অ্যামাউন্ট (₹ ঐচ্ছিক)' : 'Bill Amount ₹ (Optional)'}
            </label>
            <input
              type="number"
              value={billAmount}
              onChange={(e) => setBillAmount(e.target.value)}
              placeholder="0"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {isBn ? `টোকেন #${String(nextToken).padStart(3, '0')} তৈরি করুন` : `Issue Token #${String(nextToken).padStart(3, '0')}`}
          </button>
        </form>

        {/* Right: Active Queue Board */}
        <div className="lg:col-span-8 space-y-3">
          {queue.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
              <Ticket className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <div className="font-bold text-slate-800">
                {isBn ? 'এখনও কোনো টোকেন ইস্যু হয়নি' : 'No Active Counter Tokens'}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {isBn
                  ? 'বাম দিকের ফর্মে কাস্টমারের নাম ও কাজ লিখে টোকেন তৈরি করুন, কাজ শেষ হলে ১ ক্লিকে WhatsApp বা ভয়েস কল করুন।'
                  : 'Add waiting customers on the left to issue printable tokens and send instant WhatsApp ready alerts.'}
              </p>
            </div>
          ) : (
            queue.map((item) => {
              const waHref = item.mobile.length === 10
                ? `https://wa.me/91${item.mobile}?text=${encodeURIComponent(buildReadyMessage(item))}`
                : '';

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    item.status === 'ready'
                      ? 'border-emerald-400 bg-emerald-50/40'
                      : item.status === 'delivered'
                      ? 'border-slate-200 opacity-65'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-14 h-14 rounded-xl bg-slate-950 text-amber-300 flex flex-col items-center justify-center shrink-0 font-mono">
                      <span className="text-[10px] text-slate-400">TOKEN</span>
                      <span className="text-lg font-black leading-none">
                        {String(item.tokenNo).padStart(3, '0')}
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-slate-950 text-base">{item.customerName}</div>
                      <div className="text-xs text-slate-700 font-medium">{item.service}</div>
                      <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2 font-mono">
                        <span>{item.createdAt}</span>
                        {item.mobile && <span>· +91 {item.mobile}</span>}
                        {item.billAmount && <span className="font-bold text-emerald-700">· ₹{item.billAmount}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {item.status === 'waiting' && (
                      <button
                        type="button"
                        onClick={() => updateStatus(item.id, 'working')}
                        className="px-2.5 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" /> Start
                      </button>
                    )}
                    {item.status !== 'ready' && item.status !== 'delivered' && (
                      <button
                        type="button"
                        onClick={() => updateStatus(item.id, 'ready')}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mark Ready
                      </button>
                    )}
                    {item.status === 'ready' && (
                      <button
                        type="button"
                        onClick={() => updateStatus(item.id, 'delivered')}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Clock className="w-3.5 h-3.5" /> Delivered
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => announceTokenVoice(item)}
                      title="Announce Token in Bengali"
                      className="p-2 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePrintSlip(item)}
                      title="Print Token Slip"
                      className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyMessage(item)}
                      title="Copy Ready Message"
                      className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer"
                    >
                      {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>

                    {waHref && (
                      <a
                        href={waHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold inline-flex items-center gap-1"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        WhatsApp
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Hidden Printable Token Slip */}
      <div className="hidden">
        <div ref={tokenSlipRef} className="p-6 max-w-xs mx-auto border-2 border-dashed border-slate-900 text-center font-sans bg-white text-slate-950">
          <div className="text-xs font-bold uppercase tracking-wider">{shopName.trim() || 'CYBER CAFE COUNTER'}</div>
          <div className="text-xs text-slate-500 mt-0.5">CUSTOMER TOKEN SLIP</div>
          <div className="my-3 py-2 border-y-2 border-slate-900 text-4xl font-black font-mono">
            #{printTokenItem ? String(printTokenItem.tokenNo).padStart(3, '0') : '000'}
          </div>
          <div className="text-sm font-bold">{printTokenItem?.customerName}</div>
          <div className="text-xs text-slate-700 mt-1">{printTokenItem?.service}</div>
          {printTokenItem?.billAmount && (
            <div className="text-sm font-bold mt-2">Estimated Bill: ₹{printTokenItem.billAmount}</div>
          )}
          <div className="text-[11px] text-slate-500 mt-3">Time: {printTokenItem?.createdAt}</div>
        </div>
      </div>
    </div>
  );
};

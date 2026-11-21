import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  Volume2,
  CheckCircle2,
  Printer,
  Download,
  IndianRupee,
  RotateCcw,
  Trash2,
  Maximize2,
  X,
} from 'lucide-react';
import type { AppLang } from '../../data/i18n';
import { numberToIndianWordsBn, toBengaliDigits } from '../../utils/bengaliPhonetic';
import { printElementHtml } from '../../utils/printHelper';

interface UpiVoiceCounterProps {
  appLang: AppLang;
}

interface PaymentLog {
  id: string;
  amount: number;
  note: string;
  time: string;
}

function playPosChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const freqs = [587.33, 880, 1174.66];
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.09);
      gain.gain.setValueAtTime(0.18, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.3);
    });
  } catch {
    // ignore WebAudio block
  }
}

export const UpiVoiceCounter: React.FC<UpiVoiceCounterProps> = ({ appLang }) => {
  const isBn = appLang === 'bn';
  const [upiId, setUpiId] = useState('');
  const [payeeName, setPayeeName] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [voiceLang, setVoiceLang] = useState<'bn-IN' | 'en-IN' | 'hi-IN'>('bn-IN');
  const [qrUrl, setQrUrl] = useState('');
  const [logs, setLogs] = useState<PaymentLog[]>([]);
  const [kioskOpen, setKioskOpen] = useState(false);
  const [lastAnnouncement, setLastAnnouncement] = useState('');
  const printStandeeRef = useRef<HTMLDivElement | null>(null);

  const numericAmount = parseFloat(amount);
  const hasValidAmount = Number.isFinite(numericAmount) && numericAmount > 0;
  const upiUri = (() => {
    const pa = upiId.trim();
    if (!pa) return '';
    const params = new URLSearchParams();
    params.set('pa', pa);
    if (payeeName.trim()) params.set('pn', payeeName.trim());
    if (hasValidAmount) params.set('am', numericAmount.toFixed(2));
    params.set('cu', 'INR');
    if (note.trim()) params.set('tn', note.trim());
    return `upi://pay?${params.toString()}`;
  })();

  useEffect(() => {
    let active = true;
    if (!upiUri) {
      setQrUrl('');
      return;
    }
    QRCode.toDataURL(upiUri, {
      width: 520,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then((url) => {
        if (active) setQrUrl(url);
      })
      .catch(() => {
        if (active) setQrUrl('');
      });
    return () => {
      active = false;
    };
  }, [upiUri]);

  const speakAmount = (val: number) => {
    playPosChime();
    const rounded = Math.round(val * 100) / 100;
    let text = '';
    if (voiceLang === 'bn-IN') {
      const bnWords = numberToIndianWordsBn(rounded) || `${toBengaliDigits(rounded)} টাকা`;
      text = `${bnWords.replace(/ মাত্র$/, '')} সফলভাবে প্রাপ্ত হয়েছে। ধন্যবাদ।`;
    } else if (voiceLang === 'hi-IN') {
      text = `${rounded} रुपये प्राप्त हुए। धन्यवाद।`;
    } else {
      text = `Received Rupees ${rounded} via UPI. Thank you.`;
    }
    setLastAnnouncement(text);

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = voiceLang;
      utter.rate = 0.95;
      utter.pitch = 1.02;
      const voices = window.speechSynthesis.getVoices();
      const match = voices.find((v) => v.lang.toLowerCase().startsWith(voiceLang.slice(0, 2)));
      if (match) utter.voice = match;
      window.speechSynthesis.speak(utter);
    }
  };

  const handleConfirmPayment = () => {
    if (!hasValidAmount) return;
    speakAmount(numericAmount);
    const entry: PaymentLog = {
      id: crypto.randomUUID(),
      amount: numericAmount,
      note: note.trim() || (isBn ? 'কাউন্টার সার্ভিস' : 'Counter Service'),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setLogs((prev) => [entry, ...prev]);
  };

  const totalCollected = logs.reduce((s, item) => s + item.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-950 text-white rounded-2xl p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-emerald-400">
            {isBn ? 'লক-অ্যামাউন্ট UPI QR + বাংলা সাউন্ডবক্স অ্যালার্ট' : 'Amount-Locked Dynamic UPI QR · Bengali Voice Soundbox'}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-1">
            {isBn ? 'ডায়নামিক UPI পেমেন্ট QR ও ভয়েস এনাউন্সার' : 'Dynamic UPI QR & Voice Payment Counter'}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={voiceLang}
            onChange={(e) => setVoiceLang(e.target.value as typeof voiceLang)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-white"
          >
            <option value="bn-IN">বাংলা ভয়েস (Bengali)</option>
            <option value="en-IN">English Voice</option>
            <option value="hi-IN">हिन्दी (Hindi Voice)</option>
          </select>
          {qrUrl && (
            <button
              type="button"
              onClick={() => setKioskOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 cursor-pointer"
            >
              <Maximize2 className="w-4 h-4" />
              {isBn ? 'কাস্টমার স্ক্রিন' : 'Customer Screen'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Controls */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn ? 'আপনার UPI ID (যেমন: shop@okaxis)' : 'Merchant / Shop UPI ID'}
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. yourname@okhdfcbank"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn ? 'দোকান বা প্রাপকের নাম' : 'Shop / Payee Name'}
              </label>
              <input
                type="text"
                value={payeeName}
                onChange={(e) => setPayeeName(e.target.value)}
                placeholder="Enter shop or payee name"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn ? 'নির্দিষ্ট টাকার পরিমাণ (₹ Amount Lock)' : 'Locked Bill Amount (₹)'}
              </label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border-2 border-emerald-400 pl-9 pr-3.5 py-2.5 text-lg font-extrabold font-mono tabular-nums text-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[10, 20, 30, 50, 100, 150, 200, 500].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(String(preset))}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-800 text-xs font-bold font-mono cursor-pointer transition"
                  >
                    ₹{preset}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn ? 'কাজের বিবরণ (Payment Note)' : 'Service / Bill Note'}
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={isBn ? 'যেমন: পাসপোর্ট ছবি / ফর্ম ফিলাপ' : 'e.g. Print + Lamination'}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {hasValidAmount && (
                <p className="mt-2 text-xs text-emerald-700 font-semibold">
                  {numberToIndianWordsBn(numericAmount)}
                </p>
              )}
            </div>
          </div>

          {/* Soundbox Confirm Action */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!hasValidAmount}
              onClick={handleConfirmPayment}
              className="flex-1 min-w-[220px] inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-emerald-600/20 cursor-pointer"
            >
              <Volume2 className="w-5 h-5" />
              {isBn
                ? `পেমেন্ট কনফার্ম ও ভয়েস অ্যালার্ট বাজান${hasValidAmount ? ` (₹${numericAmount})` : ''}`
                : `Confirm Payment & Announce${hasValidAmount ? ` (₹${numericAmount})` : ''}`}
            </button>
            <button
              type="button"
              onClick={() => {
                setAmount('');
                setNote('');
                setLastAnnouncement('');
              }}
              className="px-4 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              {isBn ? 'নতুন বিল' : 'Next Bill'}
            </button>
          </div>

          {lastAnnouncement && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-sm font-semibold text-emerald-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{lastAnnouncement}</span>
            </div>
          )}

          {/* Session Counter Log */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {isBn ? 'আজকের কনফার্মড পেমেন্ট লগ' : 'Session Payment Counter Log'}
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-sm font-extrabold font-mono tabular-nums text-emerald-700">
                  Total: ₹{totalCollected.toFixed(2)}
                </span>
                {logs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setLogs([])}
                    className="text-xs text-rose-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear
                  </button>
                )}
              </div>
            </div>

            {logs.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                {isBn
                  ? 'পেমেন্ট কনফার্ম বাটনে ক্লিক করলে এখানে হিসাব জমা হবে।'
                  : 'Confirmed UPI collections will appear here for quick shift tallying.'}
              </p>
            ) : (
              <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                {logs.map((entry) => (
                  <div key={entry.id} className="px-3.5 py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{entry.note}</div>
                      <div className="text-slate-500 font-mono">{entry.time}</div>
                    </div>
                    <div className="font-extrabold font-mono tabular-nums text-emerald-700 text-sm">
                      +₹{entry.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Live UPI Standee Preview */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div
            ref={printStandeeRef}
            className="bg-white rounded-2xl border-2 border-slate-900 overflow-hidden shadow-lg"
          >
            <div className="bg-slate-950 text-white px-5 py-4 text-center">
              <div className="text-xs font-semibold tracking-wider text-emerald-400">SCAN & PAY WITH ANY UPI APP</div>
              <div className="text-xl font-extrabold mt-0.5">{payeeName.trim() || 'YOUR SHOP / COUNTER'}</div>
            </div>

            <div className="p-6 flex flex-col items-center text-center">
              {hasValidAmount && (
                <div className="mb-3 px-4 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-2xl font-black font-mono tabular-nums text-emerald-800">
                  ₹{numericAmount.toFixed(2)}
                </div>
              )}

              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt="Dynamic UPI QR Code"
                  className="w-60 h-60 object-contain rounded-xl border border-slate-200 p-2 bg-white"
                />
              ) : (
                <div className="w-60 h-60 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center p-4 text-slate-500 text-xs">
                  <IndianRupee className="w-8 h-8 mb-2 text-slate-400" />
                  <span>
                    {isBn
                      ? 'আপনার UPI ID লিখলেই এখানে লক-অ্যামাউন্ট QR কোড তৈরি হবে'
                      : 'Enter your UPI ID on the left to generate a live payment QR'}
                  </span>
                </div>
              )}

              <div className="mt-3 text-xs font-mono font-bold text-slate-800">
                {upiId.trim() || 'your-upi-id@bank'}
              </div>
              {note.trim() && <div className="mt-1 text-xs text-slate-500">{note.trim()}</div>}

              <div className="mt-4 pt-3 border-t border-slate-200 w-full flex items-center justify-center gap-3 text-[11px] font-bold text-slate-600">
                <span>GPay</span>
                <span>·</span>
                <span>PhonePe</span>
                <span>·</span>
                <span>Paytm</span>
                <span>·</span>
                <span>BHIM UPI</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={qrUrl || undefined}
              download={`upi-qr-${hasValidAmount ? numericAmount : 'shop'}.png`}
              className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                qrUrl
                  ? 'bg-slate-900 text-white hover:bg-slate-800'
                  : 'bg-slate-200 text-slate-400 pointer-events-none'
              }`}
            >
              <Download className="w-4 h-4" />
              {isBn ? 'QR ডাউনলোড PNG' : 'Download QR PNG'}
            </a>
            <button
              type="button"
              disabled={!qrUrl}
              onClick={() => printStandeeRef.current && printElementHtml(printStandeeRef.current, 'UPI Counter Standee')}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-bold cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              {isBn ? 'স্ট্যান্ডি প্রিন্ট A4' : 'Print Standee A4'}
            </button>
          </div>
        </div>
      </div>

      {/* Customer Display Fullscreen Modal */}
      {kioskOpen && qrUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center relative shadow-2xl">
            <button
              type="button"
              onClick={() => setKioskOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-xs font-bold text-emerald-700 tracking-wider">SCAN TO PAY</div>
            <h3 className="text-2xl font-black text-slate-950 mt-1">{payeeName.trim() || 'Counter Payment'}</h3>
            {hasValidAmount && (
              <div className="mt-2 text-4xl font-black font-mono tabular-nums text-emerald-600">
                ₹{numericAmount.toFixed(2)}
              </div>
            )}
            <img src={qrUrl} alt="Customer QR" className="w-72 h-72 mx-auto my-4 rounded-2xl border border-slate-200 p-2" />
            <div className="font-mono text-sm font-bold text-slate-700">{upiId}</div>
            {hasValidAmount && (
              <button
                type="button"
                onClick={() => {
                  handleConfirmPayment();
                  setKioskOpen(false);
                }}
                className="mt-5 w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Volume2 className="w-5 h-5" />
                {isBn ? 'পেমেন্ট রিসিভড — ভয়েস বাজান' : 'Mark Paid & Announce'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

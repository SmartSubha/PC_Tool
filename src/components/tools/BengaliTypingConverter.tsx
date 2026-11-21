import React, { useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  Copy,
  Check,
  Printer,
  Download,
  Mic,
  MicOff,
  Sparkles,
  RotateCcw,
  ArrowLeftRight,
  BookOpen,
  FileText,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import type { AppLang } from '../../data/i18n';
import { phoneticToBengali, bengaliToPhoneticEnglish } from '../../utils/bengaliPhonetic';
import { printElementHtml } from '../../utils/printHelper';

interface BengaliTypingConverterProps {
  appLang: AppLang;
}

const SWARABARNA = ['অ', 'আ', 'ই', 'ঈ', 'উ', 'ঊ', 'ঋ', 'এ', 'ঐ', 'ও', 'ঔ'];
const KAR_MATRA = ['া', 'ি', 'ী', 'ু', 'ূ', 'ৃ', 'ে', 'ৈ', 'ো', 'ৌ', '্', 'ঁ', 'ং', 'ঃ', 'ৎ', '।', '৳'];
const BYANJANBARNA = [
  'ক', 'খ', 'গ', 'ঘ', 'ঙ',
  'চ', 'ছ', 'জ', 'ঝ', 'ঞ',
  'ট', 'ঠ', 'ড', 'ঢ', 'ণ',
  'ত', 'থ', 'দ', 'ধ', 'ন',
  'প', 'ফ', 'ব', 'ভ', 'ম',
  'য', 'র', 'ল', 'শ', 'ষ',
  'স', 'হ', 'ড়', 'ঢ়', 'য়',
];
const JUKTAKKHOR = [
  'ক্ষ', 'জ্ঞ', 'ষ্ণ', 'ত্ত', 'ত্র', 'ক্র', 'প্র', 'শ্র', 'স্ত', 'স্ব', 'ন্দ', 'ন্ত', 'ম্ব', 'ঙ্গ', 'ঞ্চ', 'ক্ত', 'প্ত', 'দ্ধ', 'ন্ন', 'ল্ল', '্য', '্র', 'র্',
];
const BN_NUMBERS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

const OFFICIAL_PHRASES = [
  'মাননীয় মহাশয়,',
  'বিনীত নিবেদন এই যে,',
  'বিষয়: ',
  'তারিখ: ',
  'স্ব-ঘোষণাপত্র',
  'পিতার নাম: ',
  'ঠিকানা: গ্রাম - , পোস্ট - , থানা - , জেলা - , পিন - ',
  'অতএব, মহাশয়ের নিকট আমার বিনীত প্রার্থনা এই যে,',
  'ইতি,',
  'আপনার একান্ত অনুগত,',
  'আবেদনকারীর স্বাক্ষর',
];

const PHONETIC_GUIDE = [
  { en: 'a / aa', bn: 'আ / া' },
  { en: 'i / ee', bn: 'ই / ঈ' },
  { en: 'u / oo', bn: 'উ / ঊ' },
  { en: 'e / oi', bn: 'এ / ঐ' },
  { en: 'O / ou', bn: 'ও / ঔ' },
  { en: 'rri', bn: 'ঋ / ৃ' },
  { en: 'k / kh / g / gh', bn: 'ক খ গ ঘ' },
  { en: 'ch / chh / j / jh', bn: 'চ ছ জ ঝ' },
  { en: 'T / Th / D / Dh / N', bn: 'ট ঠ ড ঢ ণ' },
  { en: 't / th / d / dh / n', bn: 'ত থ দ ধ ন' },
  { en: 'p / f / b / v / m', bn: 'প ফ ব ভ ম' },
  { en: 'sh / Sh / s / h', bn: 'শ ষ স হ' },
  { en: 'ksh / ng / Ng', bn: 'ক্ষ / ং / ঙ' },
  { en: 'Z / ,, / ^ / :', bn: '্য / ্ / ঁ / ঃ' },
  { en: '{text}', bn: 'Keep English' },
];

type SpeechRecognitionCtor = new () => {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal?: boolean }> }) => void) | null;
  onerror: ((ev: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export const BengaliTypingConverter: React.FC<BengaliTypingConverterProps> = ({ appLang }) => {
  const isBn = appLang === 'bn';
  const [direction, setDirection] = useState<'en-to-bn' | 'bn-to-en'>('en-to-bn');
  const [sourceText, setSourceText] = useState('');
  const [manualOutputOverride, setManualOutputOverride] = useState<string | null>(null);
  const [convertDigits, setConvertDigits] = useState(true);
  const [kbTab, setKbTab] = useState<'consonants' | 'vowels' | 'juktakkhor' | 'guide'>('consonants');
  const [copied, setCopied] = useState(false);

  // Voice dictation state
  const [isListening, setIsListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState<'bn-IN' | 'en-IN'>('bn-IN');
  const [voiceError, setVoiceError] = useState('');
  const recognitionRef = useRef<InstanceType<SpeechRecognitionCtor> | null>(null);

  // AI Polish state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiNote, setAiNote] = useState('');

  const outputRef = useRef<HTMLTextAreaElement | null>(null);
  const printRef = useRef<HTMLDivElement | null>(null);

  const autoConverted = useMemo(() => {
    if (direction === 'en-to-bn') {
      return phoneticToBengali(sourceText, convertDigits);
    }
    return bengaliToPhoneticEnglish(sourceText);
  }, [sourceText, direction, convertDigits]);

  const finalOutput = manualOutputOverride !== null ? manualOutputOverride : autoConverted;

  const handleSourceChange = (val: string) => {
    setSourceText(val);
    setManualOutputOverride(null);
    setAiNote('');
  };

  const insertIntoOutput = (snippet: string) => {
    const current = finalOutput;
    const el = outputRef.current;
    if (el) {
      const start = el.selectionStart ?? current.length;
      const end = el.selectionEnd ?? current.length;
      const next = current.slice(0, start) + snippet + current.slice(end);
      setManualOutputOverride(next);
      requestAnimationFrame(() => {
        el.focus();
        const pos = start + snippet.length;
        el.setSelectionRange(pos, pos);
      });
    } else {
      setManualOutputOverride(current + snippet);
    }
  };

  const handleCopy = async () => {
    if (!finalOutput.trim()) return;
    await navigator.clipboard.writeText(finalOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDownloadTxt = () => {
    if (!finalOutput.trim()) return;
    const blob = new Blob([finalOutput], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = direction === 'en-to-bn' ? 'bengali-document.txt' : 'english-transliterated.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadDoc = () => {
    if (!finalOutput.trim()) return;
    const escaped = finalOutput
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br/>');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:'Noto Sans Bengali','Nirmala UI',Arial,sans-serif;font-size:13pt;line-height:1.8;padding:24px;color:#0f172a;}</style></head><body>${escaped}</body></html>`;
    const blob = new Blob([html], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'official-bengali-document.doc';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (!printRef.current || !finalOutput.trim()) return;
    printElementHtml(printRef.current, 'Official Bengali Document');
  };

  const toggleVoiceDictation = () => {
    setVoiceError('');
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const win = window as unknown as {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRec) {
      setVoiceError(
        isBn
          ? 'এই ব্রাউজারে ভয়েস টাইপিং সাপোর্ট করছে না। Chrome বা Edge ব্যবহার করুন।'
          : 'Live Speech Recognition is not supported in this browser. Please use Chrome or Edge.'
      );
      return;
    }

    try {
      const rec = new SpeechRec();
      rec.lang = voiceLang;
      rec.continuous = true;
      rec.interimResults = false;
      rec.onresult = (event) => {
        let added = '';
        for (let i = 0; i < event.results.length; i++) {
          const r = event.results[i];
          if (r && r[0]?.transcript) {
            added = r[0].transcript;
          }
        }
        if (added.trim()) {
          if (voiceLang === 'bn-IN') {
            setManualOutputOverride((prev) => {
              const base = prev !== null ? prev : autoConverted;
              return base ? `${base} ${added.trim()}` : added.trim();
            });
          } else {
            setSourceText((prev) => (prev ? `${prev} ${added.trim()}` : added.trim()));
            setManualOutputOverride(null);
          }
        }
      };
      rec.onerror = (e) => {
        setVoiceError(`Voice error: ${e.error || 'microphone permission denied'}`);
        setIsListening(false);
      };
      rec.onend = () => setIsListening(false);
      recognitionRef.current = rec;
      rec.start();
      setIsListening(true);
    } catch {
      setVoiceError('Could not start microphone dictation.');
      setIsListening(false);
    }
  };

  const runAiPolish = async (action: 'polish-bn' | 'en-to-bn' | 'bn-to-en') => {
    const payloadText = action === 'en-to-bn' ? (sourceText.trim() || finalOutput.trim()) : (finalOutput.trim() || sourceText.trim());
    if (!payloadText) {
      setAiError(isBn ? 'আগে কিছু টেক্সট লিখুন।' : 'Please type some text first.');
      return;
    }
    setAiLoading(true);
    setAiError('');
    setAiNote('');
    try {
      const res = await fetch('/api/ai/bengali-polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: payloadText, action }),
      });
      const data = await res.json();
      if (!res.ok || !data?.resultText) {
        throw new Error(data?.error || 'AI polish failed');
      }
      setManualOutputOverride(data.resultText);
      setAiNote(
        action === 'polish-bn'
          ? isBn ? 'AI সরকারি বাংলার বানান ও যুক্তাক্ষর নিখুঁত করে দিয়েছে।' : 'Polished spelling & formal Bengali script.'
          : action === 'en-to-bn'
          ? isBn ? 'অফিসিয়াল বাংলায় অনুবাদ সম্পন্ন হয়েছে।' : 'Translated into formal official Bengali.'
          : isBn ? 'অফিসিয়াল ইংরেজিতে অনুবাদ সম্পন্ন হয়েছে।' : 'Translated into formal official English.'
      );
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : 'AI request failed');
    } finally {
      setAiLoading(false);
    }
  };

  const wordCount = finalOutput.trim() ? finalOutput.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-6">
      {/* Top Studio Header Bar */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold tracking-wide">
            <Keyboard className="w-4 h-4" />
            <span>{isBn ? 'ফোনেটিক টাইপিং + অন-স্ক্রিন কিবোর্ড + বাংলা ভয়েস ডিক্টেশন' : 'Avro-Style Phonetic Engine · On-Screen Keyboard · Voice Dictation'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-1">
            {isBn ? 'বাংলা / ইংরেজি টাইপিং কনভার্টার ও ভয়েস স্টুডিও' : 'Bengali / English Typing Converter & Voice Studio'}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setDirection((d) => (d === 'en-to-bn' ? 'bn-to-en' : 'en-to-bn'));
              setManualOutputOverride(null);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition cursor-pointer"
          >
            <ArrowLeftRight className="w-4 h-4" />
            {direction === 'en-to-bn' ? 'English Phonetic → বাংলা' : 'বাংলা → English Phonetic'}
          </button>

          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={convertDigits}
              onChange={(e) => setConvertDigits(e.target.checked)}
              className="accent-amber-400"
            />
            <span>0–9 → ০–৯</span>
          </label>
        </div>
      </div>

      {/* Dual Editor Panes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Input Box */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-bold text-slate-900">
              {direction === 'en-to-bn'
                ? isBn ? 'ইংরেজি ফোনেটিকে লিখুন (যেমন: ami banglay likhi)' : 'Type Phonetic English (e.g. manoniyo mohashoy)'
                : isBn ? 'বাংলা টেক্সট লিখুন বা পেস্ট করুন' : 'Type or Paste Bengali Script'}
            </label>
            <button
              type="button"
              onClick={() => {
                setSourceText('');
                setManualOutputOverride(null);
                setAiNote('');
                setAiError('');
              }}
              className="text-xs font-semibold text-slate-500 hover:text-rose-600 inline-flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {isBn ? 'মুছুন' : 'Clear'}
            </button>
          </div>
          <textarea
            value={sourceText}
            onChange={(e) => handleSourceChange(e.target.value)}
            rows={8}
            placeholder={
              direction === 'en-to-bn'
                ? 'Type phonetic Banglish here... e.g. manoniyo mohashoy, binito nibedon ei je amar nam ... (Use {English} to keep words in English)'
                : 'এখানে বাংলা লেখা লিখুন বা পেস্ট করুন...'
            }
            className="w-full flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-3 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-y"
          />

          {/* Voice Dictation Strip */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleVoiceDictation}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isListening
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-500/30'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {isListening
                  ? isBn ? 'ভয়েস বন্ধ করুন' : 'Stop Listening'
                  : isBn ? 'মুখে বলে বাংলা লিখুন (Voice)' : 'Voice Dictation (Mic)'}
              </button>

              <select
                value={voiceLang}
                onChange={(e) => setVoiceLang(e.target.value as 'bn-IN' | 'en-IN')}
                className="px-2.5 py-2 rounded-lg border border-slate-300 text-xs font-semibold bg-white text-slate-800"
              >
                <option value="bn-IN">বাংলা (bn-IN)</option>
                <option value="en-IN">English (en-IN)</option>
              </select>
            </div>
            <span className="text-xs text-slate-500">
              {isBn ? 'টিপস: {Word} লিখলে ইংরেজি অপরিবর্তিত থাকবে' : 'Tip: Wrap {Word} to keep raw English'}
            </span>
          </div>
          {voiceError && (
            <p className="mt-2 text-xs text-rose-600 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {voiceError}
            </p>
          )}
        </div>

        {/* Right: Converted Standard Bengali / Output Box */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-2 gap-2">
            <label className="text-sm font-bold text-slate-900">
              {direction === 'en-to-bn'
                ? isBn ? 'স্ট্যান্ডার্ড ইউনিকোড বাংলা আউটপুট (এডিটেবল)' : 'Standard Bengali Unicode Output (Editable)'
                : isBn ? 'ইংরেজি ফোনেটিক আউটপুট' : 'English Phonetic Output'}
            </label>
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              {wordCount} words · {finalOutput.length} chars
            </span>
          </div>

          <textarea
            ref={outputRef}
            value={finalOutput}
            onChange={(e) => setManualOutputOverride(e.target.value)}
            rows={8}
            placeholder={
              direction === 'en-to-bn'
                ? 'এখানে সরাসরি স্ট্যান্ডার্ড বাংলা লেখা তৈরি হবে। আপনি সরাসরি কিবোর্ড বা নিচের অন-স্ক্রিন বাটন দিয়েও এডিট করতে পারবেন...'
                : 'Transliterated English will appear here...'
            }
            className="w-full flex-1 rounded-xl border-2 border-indigo-200 bg-indigo-50/30 px-3.5 py-3 text-lg leading-relaxed text-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-y"
          />

          {/* AI Official Polish & Export Toolbar */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={aiLoading}
              onClick={() => runAiPolish('polish-bn')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-60 cursor-pointer"
            >
              {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {isBn ? 'AI বানান শুদ্ধ করুন' : 'AI Official Bengali Polish'}
            </button>
            <button
              type="button"
              disabled={aiLoading}
              onClick={() => runAiPolish('en-to-bn')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-900 border border-slate-300 text-xs font-bold hover:bg-slate-200 disabled:opacity-60 cursor-pointer"
            >
              {isBn ? 'AI অনুবাদ → বাংলা' : 'AI Translate → বাংলা'}
            </button>
            <button
              type="button"
              disabled={aiLoading}
              onClick={() => runAiPolish('bn-to-en')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-900 border border-slate-300 text-xs font-bold hover:bg-slate-200 disabled:opacity-60 cursor-pointer"
            >
              {isBn ? 'AI অনুবাদ → English' : 'AI Translate → English'}
            </button>

            <div className="ml-auto flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? (isBn ? 'কপি হয়েছে' : 'Copied') : isBn ? 'কপি' : 'Copy'}
              </button>
              <button
                type="button"
                onClick={handleDownloadDoc}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 cursor-pointer"
                title="Download Word (.doc)"
              >
                <FileText className="w-3.5 h-3.5" />
                .DOC
              </button>
              <button
                type="button"
                onClick={handleDownloadTxt}
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                .TXT
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                {isBn ? 'প্রিন্ট A4' : 'Print A4'}
              </button>
            </div>
          </div>

          {aiError && (
            <p className="mt-2 text-xs text-rose-600 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {aiError}
            </p>
          )}
          {aiNote && <p className="mt-2 text-xs font-semibold text-emerald-700">{aiNote}</p>}
        </div>
      </div>

      {/* Official Document Quick Phrases Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="text-xs font-bold text-slate-600 mb-2.5">
          {isBn ? 'অফিসিয়াল বাংলা আবেদনপত্রের কুইক লাইন (১ ক্লিকে বসান)' : 'Official Bengali Document Phrases (Click to Insert)'}
        </div>
        <div className="flex flex-wrap gap-2">
          {OFFICIAL_PHRASES.map((phrase) => (
            <button
              key={phrase}
              type="button"
              onClick={() => insertIntoOutput((finalOutput && !finalOutput.endsWith('\n') ? '\n' : '') + phrase)}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-900 text-xs font-semibold border border-slate-200 transition cursor-pointer"
            >
              {phrase}
            </button>
          ))}
        </div>
      </div>

      {/* On-Screen Interactive Bengali Keyboard & Phonetic Mapping */}
      <div className="bg-slate-950 text-white rounded-2xl border border-slate-800 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold">
              {isBn ? 'অন-স্ক্রিন বাংলা কিবোর্ড ও ফোনেটিক চার্ট' : 'On-Screen Bengali Keyboard & Phonetic Mapping'}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
            {[
              { id: 'consonants', label: isBn ? 'ব্যঞ্জনবর্ণ ও কার' : 'Consonants & Matra' },
              { id: 'vowels', label: isBn ? 'স্বরবর্ণ ও সংখ্যা' : 'Vowels & Digits' },
              { id: 'juktakkhor', label: isBn ? 'যুক্তাক্ষর (Juktakkhor)' : 'Conjuncts (যুক্তাক্ষর)' },
              { id: 'guide', label: isBn ? 'ফোনেটিক ম্যাপ' : 'Phonetic Guide' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setKbTab(tab.id as typeof kbTab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  kbTab === tab.id ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {kbTab === 'consonants' && (
          <div className="space-y-3">
            <div>
              <div className="text-[11px] text-amber-300 font-semibold mb-1.5">
                {isBn ? 'কার / মাত্রা ও চিহ্ন (Kar / Matra)' : 'Matra / Signs (Click to append to Bengali output)'}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {KAR_MATRA.map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => insertIntoOutput(ch)}
                    className="min-w-[42px] h-10 px-2.5 rounded-lg bg-indigo-900/80 hover:bg-amber-400 hover:text-slate-950 border border-indigo-700 text-lg font-bold transition cursor-pointer"
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 font-semibold mb-1.5">
                {isBn ? 'ব্যঞ্জনবর্ণ (Byanjanbarna)' : 'Consonants (Byanjanbarna)'}
              </div>
              <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-12 gap-1.5">
                {BYANJANBARNA.map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => insertIntoOutput(ch)}
                    className="h-11 rounded-lg bg-slate-800 hover:bg-amber-400 hover:text-slate-950 border border-slate-700 text-lg font-bold transition cursor-pointer"
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {kbTab === 'vowels' && (
          <div className="space-y-4">
            <div>
              <div className="text-[11px] text-amber-300 font-semibold mb-1.5">স্বরবর্ণ (Swarabarna)</div>
              <div className="flex flex-wrap gap-2">
                {SWARABARNA.map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => insertIntoOutput(ch)}
                    className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-amber-400 hover:text-slate-950 border border-slate-700 text-xl font-bold transition cursor-pointer"
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-emerald-300 font-semibold mb-1.5">বাংলা সংখ্যা (Bengali Digits)</div>
              <div className="flex flex-wrap gap-2">
                {BN_NUMBERS.map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => insertIntoOutput(ch)}
                    className="w-12 h-12 rounded-xl bg-emerald-950 hover:bg-emerald-400 hover:text-slate-950 border border-emerald-700 text-xl font-bold transition cursor-pointer"
                  >
                    {ch}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => insertIntoOutput(' ')}
                  className="px-6 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold cursor-pointer"
                >
                  Space
                </button>
                <button
                  type="button"
                  onClick={() => insertIntoOutput('\n')}
                  className="px-5 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold cursor-pointer"
                >
                  New Line ↵
                </button>
              </div>
            </div>
          </div>
        )}

        {kbTab === 'juktakkhor' && (
          <div className="flex flex-wrap gap-2">
            {JUKTAKKHOR.map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => insertIntoOutput(ch)}
                className="min-w-[54px] h-12 px-3 rounded-xl bg-slate-800 hover:bg-amber-400 hover:text-slate-950 border border-slate-700 text-lg font-bold transition cursor-pointer"
              >
                {ch}
              </button>
            ))}
          </div>
        )}

        {kbTab === 'guide' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {PHONETIC_GUIDE.map((row) => (
              <div
                key={row.en}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2"
              >
                <span className="font-mono text-xs text-amber-300 font-bold">{row.en}</span>
                <span className="text-base font-bold text-white">{row.bn}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hidden A4 Print Layout */}
      <div className="hidden">
        <div ref={printRef} className="p-8 bg-white text-slate-950 font-sans">
          <div className="whitespace-pre-wrap text-[15px] leading-[1.9]">{finalOutput}</div>
        </div>
      </div>
    </div>
  );
};

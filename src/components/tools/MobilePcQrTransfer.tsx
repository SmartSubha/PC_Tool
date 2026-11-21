import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  Smartphone,
  Upload,
  Download,
  Printer,
  Trash2,
  RefreshCw,
  CheckCircle2,
  FileText,
  Copy,
  Check,
  ShieldCheck,
  Wifi,
  AlertCircle,
  Send,
  Volume2,
  VolumeX,
  ExternalLink,
} from 'lucide-react';
import type { AppLang } from '../../data/i18n';
import { printImageOnA4 } from '../../utils/printHelper';

interface DropFileMeta {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  isImage: boolean;
  previewDataUrl?: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatCountdown(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function resolvePublicBaseUrl(serverPublicBaseUrl: string): string {
  if (serverPublicBaseUrl && serverPublicBaseUrl.startsWith('http')) {
    return serverPublicBaseUrl.replace(/\/$/, '');
  }
  const origin = window.location.origin;
  // In AI Studio preview, ais-dev-* requires Google developer auth whereas ais-pre-* is the shared mobile-accessible URL
  if (origin.includes('://ais-dev-')) {
    return origin.replace('://ais-dev-', '://ais-pre-');
  }
  return origin;
}

async function fileToUploadPayload(
  file: File,
  fastCompressImages: boolean
): Promise<{ name: string; mimeType: string; dataBase64: string }> {
  // Optional fast compression for huge mobile camera photos (> 3.5 MB) to keep 4G uploads snappy
  if (fastCompressImages && file.type.startsWith('image/') && file.size > 3.5 * 1024 * 1024 && file.type !== 'image/gif') {
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = reject;
        el.src = dataUrl;
      });
      const maxDim = 2200;
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', 0.88);
        return {
          name: file.name.replace(/\.[^.]+$/, '.jpg'),
          mimeType: 'image/jpeg',
          dataBase64: compressed.split(',')[1] || '',
        };
      }
    } catch {
      // fall through to raw file
    }
  }

  const dataBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = String(reader.result || '');
      resolve(res.split(',')[1] || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  return {
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    dataBase64,
  };
}

function playReceiveChime() {
  try {
    const AudioContextClass =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    [587.33, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.001, now + i * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.14, now + i * 0.11 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.11 + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.11);
      osc.stop(now + i * 0.11 + 0.24);
    });
    setTimeout(() => ctx.close().catch(() => {}), 700);
  } catch {
    // ignore audio block
  }
}

// Standalone Customer Mobile Upload Screen (rendered automatically when someone scans QR: ?drop=CODE)
export const MobileCustomerDropClient: React.FC<{ sessionCode: string; onExit: () => void }> = ({
  sessionCode: initialCode,
  onExit,
}) => {
  const [activeCode, setActiveCode] = useState(initialCode.trim().toUpperCase());
  const [manualCodeInput, setManualCodeInput] = useState(initialCode.trim().toUpperCase());
  const [sessionValid, setSessionValid] = useState<'checking' | 'connected' | 'invalid'>('checking');
  const [uploading, setUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [fastCompress, setFastCompress] = useState(true);
  const [uploadedItems, setUploadedItems] = useState<{ name: string; size: number }[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const verifyCode = async (codeToCheck: string) => {
    const clean = codeToCheck.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!clean) {
      setSessionValid('invalid');
      return;
    }
    setActiveCode(clean);
    setSessionValid('checking');
    setErrorMsg('');
    try {
      const res = await fetch(`/api/drop/${encodeURIComponent(clean)}/status`);
      const data = await res.json().catch(() => null);
      if (res.ok && data?.ok) {
        setSessionValid('connected');
      } else {
        setSessionValid('invalid');
        setErrorMsg(data?.error || 'Session code expired or not found.');
      }
    } catch {
      setSessionValid('invalid');
      setErrorMsg('Cannot reach the counter server. Check your internet connection.');
    }
  };

  useEffect(() => {
    verifyCode(initialCode);
  }, [initialCode]);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    setErrorMsg('');
    const list = Array.from(fileList);

    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      setUploadProgressText(`Sending ${i + 1} / ${list.length}: ${file.name}`);
      try {
        if (file.size > 24 * 1024 * 1024) {
          setErrorMsg(`${file.name} is larger than 24 MB limit.`);
          continue;
        }
        const payload = await fileToUploadPayload(file, fastCompress);
        const resp = await fetch(`/api/drop/${encodeURIComponent(activeCode)}/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await resp.json().catch(() => null);
        if (!resp.ok) {
          throw new Error(data?.error || `Upload failed (HTTP ${resp.status})`);
        }
        setUploadedItems((prev) => [{ name: payload.name, size: file.size }, ...prev]);
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Upload failed');
      }
    }
    setUploading(false);
    setUploadProgressText('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <Smartphone className="w-7 h-7" />
          </div>

          {sessionValid === 'connected' ? (
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 font-bold">
              <Wifi className="w-3.5 h-3.5" />
              CONNECTED · CODE: {activeCode}
            </div>
          ) : sessionValid === 'checking' ? (
            <div className="text-xs font-mono text-amber-300 font-bold">CONNECTING TO {activeCode}...</div>
          ) : (
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-rose-400 font-bold">
              <AlertCircle className="w-3.5 h-3.5" />
              SESSION NOT FOUND ({activeCode})
            </div>
          )}

          <h1 className="text-2xl font-black mt-1">Send Files to Shop PC</h1>
          <p className="text-xs text-slate-400 mt-1">
            হোয়াটসঅ্যাপ লগইন ছাড়াই সরাসরি আপনার মোবাইলের ছবি, PDF বা ডকুমেন্ট কাউন্টার কম্পিউটারে পাঠান।
          </p>
        </div>

        {sessionValid === 'invalid' ? (
          <div className="space-y-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
            <label className="block text-xs font-bold text-slate-300">
              কম্পিউটার স্ক্রিনে থাকা ৬ অক্ষরের কোডটি লিখুন (Enter 6-Digit Counter Code):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCodeInput}
                onChange={(e) => setManualCodeInput(e.target.value.toUpperCase())}
                placeholder="e.g. A7K9P2"
                className="flex-1 px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-center font-mono text-base font-black tracking-widest uppercase text-amber-300"
              />
              <button
                type="button"
                onClick={() => verifyCode(manualCodeInput)}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black cursor-pointer"
              >
                Connect
              </button>
            </div>
          </div>
        ) : (
          <>
            <label className="block border-2 border-dashed border-emerald-500/70 hover:border-emerald-400 bg-emerald-950/30 rounded-2xl p-8 text-center cursor-pointer transition">
              <Upload className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <div className="font-black text-base text-white">
                {uploading ? uploadProgressText || 'Sending to Counter PC...' : 'Tap to Pick Photos, PDF or Docs'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                ছবি, PDF, Word বা যেকোনো ফাইল (একসাথে একাধিক বাছা যাবে · সর্বোচ্চ ২৪ MB)
              </div>
              <input
                type="file"
                multiple
                disabled={uploading}
                className="hidden"
                onChange={(e) => {
                  handleFiles(e.target.files);
                  e.target.value = '';
                }}
              />
            </label>

            <label className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-800/70 text-xs text-slate-300 cursor-pointer">
              <span>দ্রুত পাঠাতে বড় ক্যামেরা ছবি অটো-অপ্টিমাইজ করুন (Fast 4G Send)</span>
              <input
                type="checkbox"
                checked={fastCompress}
                onChange={(e) => setFastCompress(e.target.checked)}
                className="accent-emerald-500 w-4 h-4"
              />
            </label>
          </>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950 border border-rose-700 text-rose-200 text-xs font-bold">
            {errorMsg}
          </div>
        )}

        {uploadedItems.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-bold text-emerald-400">
              সফলভাবে PC-তে পৌঁছেছে ({uploadedItems.length}):
            </div>
            <div className="max-h-44 overflow-y-auto space-y-1.5">
              {uploadedItems.map((item, i) => (
                <div key={i} className="px-3 py-2 rounded-xl bg-slate-800 text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate font-semibold">{item.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0">{formatSize(item.size)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onExit}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
        >
          Open Full PC Tool App
        </button>
      </div>
    </div>
  );
};

// Main Counter PC Workspace Component (with Receive QR Mode + Manual Send Mode)
export const MobilePcQrTransfer: React.FC<{ appLang: AppLang }> = ({ appLang }) => {
  const isBn = appLang === 'bn';
  const [viewMode, setViewMode] = useState<'pc-receive' | 'phone-send'>('pc-receive');
  const [sessionCode, setSessionCode] = useState('');
  const [remainingSec, setRemainingSec] = useState(1800);
  const [serverPublicBase, setServerPublicBase] = useState('');
  const [usePublicSharedHost, setUsePublicSharedHost] = useState(true);
  const [qrUrl, setQrUrl] = useState('');
  const [files, setFiles] = useState<DropFileMeta[]>([]);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [testingUpload, setTestingUpload] = useState(false);

  // Manual phone send state
  const [manualSendCode, setManualSendCode] = useState('');
  const [connectedSendCode, setConnectedSendCode] = useState('');

  const prevFileCountRef = useRef<number>(0);

  const activeBaseUrl = usePublicSharedHost
    ? resolvePublicBaseUrl(serverPublicBase)
    : window.location.origin;

  const shareUrl = sessionCode ? `${activeBaseUrl}/?drop=${sessionCode}` : '';

  const startNewSession = async () => {
    setStatusMsg('');
    setErrorMsg('');
    setFiles([]);
    prevFileCountRef.current = 0;
    try {
      const res = await fetch('/api/drop/create', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data?.code) {
        throw new Error(data?.error || 'Could not start drop session');
      }
      setSessionCode(data.code);
      setRemainingSec(Number(data.expiresInSeconds) || 1800);
      if (typeof data.publicBaseUrl === 'string') {
        setServerPublicBase(data.publicBaseUrl);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not start drop session.');
    }
  };

  useEffect(() => {
    startNewSession();
  }, []);

  useEffect(() => {
    if (!shareUrl) return;
    QRCode.toDataURL(shareUrl, { width: 440, margin: 2, color: { dark: '#0f172a', light: '#ffffff' } })
      .then(setQrUrl)
      .catch(() => setQrUrl(''));
  }, [shareUrl]);

  // Countdown tick
  useEffect(() => {
    if (!sessionCode) return;
    const t = window.setInterval(() => {
      setRemainingSec((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(t);
  }, [sessionCode]);

  // Poll incoming files every 2 seconds
  useEffect(() => {
    if (!sessionCode || viewMode !== 'pc-receive') return;
    let active = true;
    const poll = async () => {
      try {
        const res = await fetch(`/api/drop/${encodeURIComponent(sessionCode)}/files`);
        if (res.status === 404) {
          // Session expired — auto-create a fresh one cleanly
          if (active) startNewSession();
          return;
        }
        if (!res.ok) return;
        const data = await res.json();
        if (active && Array.isArray(data.files)) {
          if (data.files.length > prevFileCountRef.current && soundEnabled) {
            playReceiveChime();
          }
          prevFileCountRef.current = data.files.length;
          setFiles(data.files);
          if (typeof data.remainingSec === 'number') {
            setRemainingSec(data.remainingSec);
          }
        }
      } catch {
        // ignore transient poll hiccup
      }
    };
    poll();
    const timer = window.setInterval(poll, 2000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [sessionCode, viewMode, soundEnabled]);

  const wipeSession = async () => {
    if (sessionCode) {
      await fetch(`/api/drop/${encodeURIComponent(sessionCode)}`, { method: 'DELETE' }).catch(() => {});
    }
    await startNewSession();
    setStatusMsg(
      isBn
        ? 'আগের সব ফাইল স্থায়ীভাবে মুছে নতুন QR সেশন তৈরি করা হয়েছে।'
        : 'Previous files wiped securely. Fresh QR session ready.'
    );
  };

  const deleteSingleFile = async (fileId: string) => {
    if (!sessionCode) return;
    await fetch(`/api/drop/${encodeURIComponent(sessionCode)}/file/${encodeURIComponent(fileId)}`, {
      method: 'DELETE',
    }).catch(() => {});
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    prevFileCountRef.current = Math.max(0, prevFileCountRef.current - 1);
  };

  const handleLocalDirectUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || !sessionCode) return;
    setTestingUpload(true);
    setErrorMsg('');
    for (const file of Array.from(fileList)) {
      try {
        const payload = await fileToUploadPayload(file, false);
        const resp = await fetch(`/api/drop/${encodeURIComponent(sessionCode)}/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await resp.json().catch(() => null);
        if (!resp.ok) throw new Error(data?.error || 'Upload failed');
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Upload failed');
      }
    }
    setTestingUpload(false);
  };

  const copyShareUrl = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1800);
  };

  if (viewMode === 'phone-send' && connectedSendCode) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => {
            setConnectedSendCode('');
            setViewMode('pc-receive');
          }}
          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
        >
          ← {isBn ? 'PC রিসিভ মোডে ফিরে যান' : 'Back to PC Receiver'}
        </button>
        <MobileCustomerDropClient
          sessionCode={connectedSendCode}
          onExit={() => {
            setConnectedSendCode('');
            setViewMode('pc-receive');
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Strip */}
      <div className="bg-slate-950 text-white rounded-2xl p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
            <Smartphone className="w-4 h-4" />
            <span>
              {isBn
                ? 'হোয়াটসঅ্যাপ বা লগইন ছাড়াই মোবাইল থেকে সরাসরি PC-তে ফাইল ট্রান্সফার'
                : 'Zero-Login Counter QR Drop · Auto-Deletes After 30 Minutes'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-1">
            {isBn ? 'মোবাইল ↔ PC ইনস্ট্যান্ট QR ফাইল ট্রান্সফার' : 'Mobile-to-PC Instant File Transfer (Counter QR Drop)'}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('pc-receive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                viewMode === 'pc-receive' ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:text-white'
              }`}
            >
              {isBn ? 'PC রিসিভ (QR দেখান)' : 'PC Receive (Show QR)'}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('phone-send')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                viewMode === 'phone-send' ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:text-white'
              }`}
            >
              {isBn ? 'মোবাইল সেন্ড (কোড দিন)' : 'Send via 6-Digit Code'}
            </button>
          </div>

          {viewMode === 'pc-receive' && (
            <>
              <button
                type="button"
                onClick={() => setSoundEnabled((s) => !s)}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                title={soundEnabled ? 'Mute notification sound' : 'Unmute notification sound'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              </button>
              <button
                type="button"
                onClick={wipeSession}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                {isBn ? 'সব মুছে নতুন QR' : 'Wipe & New QR'}
              </button>
            </>
          )}
        </div>
      </div>

      {viewMode === 'phone-send' ? (
        <div className="max-w-lg mx-auto bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 text-center">
          <Send className="w-10 h-10 text-indigo-600 dark:text-amber-400 mx-auto" />
          <h3 className="text-lg font-black text-slate-950 dark:text-white">
            {isBn ? 'কম্পিউটারের ৬ অক্ষরের কোড লিখে ফাইল পাঠান' : 'Send Files Using 6-Digit Counter Code'}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {isBn
              ? 'যদি QR স্ক্যান না হয়, তাহলে কাউন্টার কম্পিউটারের স্ক্রিনে দেখানো ৬ অক্ষরের কোডটি এখানে লিখে কানেক্ট করুন।'
              : 'If QR camera scanning is unavailable, enter the 6-character code shown on the Counter PC below.'}
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualSendCode}
              onChange={(e) => setManualSendCode(e.target.value.toUpperCase())}
              placeholder="e.g. K7M9P2"
              maxLength={8}
              className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-mono text-lg font-black tracking-widest uppercase"
            />
            <button
              type="button"
              disabled={manualSendCode.trim().length < 4}
              onClick={() => setConnectedSendCode(manualSendCode.trim().toUpperCase())}
              className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-black cursor-pointer"
            >
              {isBn ? 'কানেক্ট করুন' : 'Connect'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Counter QR Panel */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-900 dark:border-slate-700 p-6 text-center space-y-4">
            <div className="text-xs font-black tracking-wider uppercase text-emerald-700 dark:text-emerald-400">
              {isBn ? 'কাস্টমারকে মোবাইল ক্যামেরা দিয়ে এই QR স্ক্যান করতে বলুন' : 'ASK CUSTOMER TO SCAN THIS QR WITH PHONE CAMERA'}
            </div>

            {qrUrl ? (
              <img
                src={qrUrl}
                alt="Counter File Drop QR"
                className="w-60 h-60 mx-auto rounded-2xl border border-slate-200 p-2 bg-white shadow-sm"
              />
            ) : (
              <div className="w-60 h-60 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs text-slate-400">
                Generating Session QR...
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-slate-950 text-white flex items-center justify-between px-5">
              <div className="text-left">
                <div className="text-[10px] text-slate-400 font-bold">COUNTER CODE</div>
                <div className="text-2xl font-mono font-black tracking-widest text-amber-300">
                  {sessionCode || '------'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-bold">AUTO-EXPIRES</div>
                <div className="text-sm font-mono font-bold text-emerald-400 tabular-nums">
                  {formatCountdown(remainingSec)}
                </div>
              </div>
            </div>

            {/* Public Shared Link Toggle for Preview Environments */}
            {window.location.origin.includes('://ais-dev-') && (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-left text-[11px] flex items-center justify-between gap-2">
                <span className="font-semibold text-emerald-900 dark:text-emerald-200">
                  {isBn ? 'পাবলিক মোবাইল QR লিংক চালু (লগইন ছাড়াই খুলবে)' : 'Public Mobile QR Link (No Sign-in Needed)'}
                </span>
                <input
                  type="checkbox"
                  checked={usePublicSharedHost}
                  onChange={(e) => setUsePublicSharedHost(e.target.checked)}
                  className="accent-emerald-600 w-4 h-4 shrink-0"
                />
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={copyShareUrl}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedLink ? (isBn ? 'লিংক কপি হয়েছে' : 'Link Copied') : isBn ? 'মোবাইল লিংক কপি' : 'Copy Mobile Link'}
              </button>
              <a
                href={shareUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-1"
                title="Test mobile screen in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Test
              </a>
              <button
                type="button"
                onClick={startNewSession}
                className="px-3 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-700 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                title="Generate new session code"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {isBn
                  ? 'সেশন রিস্টার্ট হলেও ফাইল হারাবে না · ৩০ মিনিট পর অটো-ডিলিট'
                  : 'Persisted across refreshes · Auto-deletes after 30 minutes'}
              </span>
            </div>

            {statusMsg && <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{statusMsg}</div>}
            {errorMsg && <div className="text-xs font-bold text-rose-600 dark:text-rose-400">{errorMsg}</div>}
          </div>

          {/* Right Incoming Files Inbox */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-slate-950 dark:text-white">
                  {isBn
                    ? `প্রাপ্ত ফাইলসমূহ (অটো রিফ্রেশ · ${files.length}/২০)`
                    : `Incoming Customer Files (Live Sync · ${files.length}/20)`}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isBn
                    ? 'মোবাইল থেকে পাঠানোর ২ সেকেন্ডের মধ্যেই এখানে চলে আসবে'
                    : 'Files uploaded from mobile appear automatically within 2 seconds'}
                </p>
              </div>

              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                {testingUpload ? 'Uploading...' : isBn ? 'লোকাল ফাইল টেস্ট' : 'Add Test File'}
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    handleLocalDirectUpload(e.target.files);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>

            {files.length === 0 ? (
              <div className="h-80 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex flex-col items-center justify-center p-6 text-center text-slate-500 text-xs gap-2">
                <Upload className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                <div className="font-bold text-slate-700 dark:text-slate-300">
                  {isBn ? 'কাস্টমারের ফাইল পাঠানোর অপেক্ষায়...' : 'Waiting for customer to upload from phone...'}
                </div>
                <p className="max-w-sm">
                  {isBn
                    ? 'বাম দিকের QR স্ক্যান করে মোবাইল থেকে ছবি, PDF বা ডকুমেন্ট পাঠান — অথবা "Test" বাটনে ক্লিক করে নিজেই পরীক্ষা করুন।'
                    : 'Scan the QR code with any phone camera, or click "Test" to try sending a file in a second tab right now.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {files.map((f) => (
                  <div
                    key={f.id}
                    className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50 dark:bg-slate-800/70 flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      {f.isImage && f.previewDataUrl ? (
                        <img
                          src={f.previewDataUrl}
                          alt={f.name}
                          className="w-16 h-16 object-cover rounded-lg border border-slate-200 bg-white shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
                          <FileText className="w-7 h-7" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-950 dark:text-white truncate">{f.name}</div>
                        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                          {formatSize(f.size)} · {f.uploadedAt}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteSingleFile(f.id)}
                        className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                        title="Delete file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`/api/drop/${encodeURIComponent(sessionCode)}/file/${encodeURIComponent(f.id)}`}
                        download={f.name}
                        className="flex-1 py-2 rounded-lg bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center justify-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" /> {isBn ? 'সেভ করুন' : 'Save to PC'}
                      </a>
                      {f.isImage && f.previewDataUrl && (
                        <button
                          type="button"
                          onClick={() => printImageOnA4(f.previewDataUrl!, f.name)}
                          className="px-3 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" /> {isBn ? 'প্রিন্ট' : 'Print'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

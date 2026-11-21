import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  Upload,
  Download,
  Printer,
  RotateCcw,
  Shirt,
  Sparkles,
  FlipHorizontal,
  VideoOff,
  CheckCircle2,
} from 'lucide-react';
import type { AppLang } from '../../data/i18n';
import { printImageOnA4 } from '../../utils/printHelper';

interface WebcamPassportBlazerProps {
  appLang: AppLang;
}

type SuitPreset = 'none' | 'navy-blazer-tie' | 'charcoal-red-tie' | 'formal-white-shirt' | 'women-navy-blazer';

const SUIT_OPTIONS: { id: SuitPreset; label: string; bnLabel: string }[] = [
  { id: 'none', label: 'Original Attire', bnLabel: 'আসল পোশাক' },
  { id: 'navy-blazer-tie', label: 'Navy Blazer & Blue Tie', bnLabel: 'নেভি ব্লেজার ও টাই' },
  { id: 'charcoal-red-tie', label: 'Charcoal Suit & Red Tie', bnLabel: 'চারকোল স্যুট ও লাল টাই' },
  { id: 'formal-white-shirt', label: 'Formal White Shirt', bnLabel: 'ফর্মাল সাদা শার্ট' },
  { id: 'women-navy-blazer', label: 'Women Formal Blazer', bnLabel: 'মহিলা ফর্মাল ব্লেজার' },
];

const BG_COLORS = [
  { name: 'Pure White', hex: '#ffffff' },
  { name: 'Studio Blue', hex: '#d7ecff' },
  { name: 'Passport Blue', hex: '#2563eb' },
  { name: 'Soft Grey', hex: '#e2e8f0' },
  { name: 'Off White', hex: '#f8fafc' },
];

function drawFormalSuitOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  suit: SuitPreset,
  offsetX: number,
  offsetY: number,
  scale: number
) {
  if (suit === 'none') return;
  ctx.save();
  const cx = w * 0.5 + offsetX;
  const baseY = h * 0.72 + offsetY;
  const sw = w * 1.08 * scale;
  const sh = h * 0.48 * scale;

  const isCharcoal = suit === 'charcoal-red-tie';
  const isWhiteShirtOnly = suit === 'formal-white-shirt';
  const isWomen = suit === 'women-navy-blazer';

  const jacketColor = isCharcoal ? '#1f2937' : '#0f2342';
  const lapelColor = isCharcoal ? '#111827' : '#09172d';
  const tieColor = isCharcoal ? '#b91c1c' : '#1d4ed8';

  // Shirt torso / shoulders base
  ctx.beginPath();
  ctx.moveTo(cx - sw * 0.52, baseY + sh);
  ctx.quadraticCurveTo(cx - sw * 0.48, baseY + sh * 0.08, cx - sw * 0.16, baseY - sh * 0.04);
  ctx.lineTo(cx + sw * 0.16, baseY - sh * 0.04);
  ctx.quadraticCurveTo(cx + sw * 0.48, baseY + sh * 0.08, cx + sw * 0.52, baseY + sh);
  ctx.closePath();
  ctx.fillStyle = isWhiteShirtOnly ? '#f8fafc' : jacketColor;
  ctx.fill();

  if (isWhiteShirtOnly) {
    // Crisp formal shirt collar & subtle seam
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = Math.max(2, w * 0.005);
    ctx.stroke();

    // Left & Right Shirt Collar
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(cx - sw * 0.16, baseY - sh * 0.06);
    ctx.lineTo(cx, baseY + sh * 0.16);
    ctx.lineTo(cx - sw * 0.12, baseY + sh * 0.22);
    ctx.lineTo(cx - sw * 0.21, baseY + sh * 0.05);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + sw * 0.16, baseY - sh * 0.06);
    ctx.lineTo(cx, baseY + sh * 0.16);
    ctx.lineTo(cx + sw * 0.12, baseY + sh * 0.22);
    ctx.lineTo(cx + sw * 0.21, baseY + sh * 0.05);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Placket + buttons
    ctx.beginPath();
    ctx.moveTo(cx, baseY + sh * 0.16);
    ctx.lineTo(cx, baseY + sh);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = Math.max(2, w * 0.007);
    ctx.stroke();
    [0.34, 0.58, 0.82].forEach((t) => {
      ctx.beginPath();
      ctx.arc(cx, baseY + sh * t, Math.max(2.5, w * 0.008), 0, Math.PI * 2);
      ctx.fillStyle = '#94a3b8';
      ctx.fill();
    });
  } else {
    // Inner white dress shirt V-neck
    ctx.beginPath();
    ctx.moveTo(cx - sw * 0.15, baseY - sh * 0.04);
    ctx.lineTo(cx + sw * 0.15, baseY - sh * 0.04);
    ctx.lineTo(cx, baseY + sh * (isWomen ? 0.58 : 0.72));
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Tie for men's suits
    if (!isWomen) {
      // Shirt collar wings
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - sw * 0.15, baseY - sh * 0.05);
      ctx.lineTo(cx, baseY + sh * 0.11);
      ctx.lineTo(cx - sw * 0.1, baseY + sh * 0.19);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx + sw * 0.15, baseY - sh * 0.05);
      ctx.lineTo(cx, baseY + sh * 0.11);
      ctx.lineTo(cx + sw * 0.1, baseY + sh * 0.19);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Tie knot & blade
      ctx.fillStyle = tieColor;
      ctx.beginPath();
      ctx.moveTo(cx - sw * 0.036, baseY + sh * 0.09);
      ctx.lineTo(cx + sw * 0.036, baseY + sh * 0.09);
      ctx.lineTo(cx + sw * 0.025, baseY + sh * 0.18);
      ctx.lineTo(cx - sw * 0.025, baseY + sh * 0.18);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(cx - sw * 0.025, baseY + sh * 0.18);
      ctx.lineTo(cx + sw * 0.025, baseY + sh * 0.18);
      ctx.lineTo(cx + sw * 0.05, baseY + sh * 0.72);
      ctx.lineTo(cx, baseY + sh * 0.78);
      ctx.lineTo(cx - sw * 0.05, baseY + sh * 0.72);
      ctx.closePath();
      ctx.fill();
    }

    // Left & Right Blazer Lapels
    ctx.fillStyle = lapelColor;
    ctx.beginPath();
    ctx.moveTo(cx - sw * 0.15, baseY - sh * 0.04);
    ctx.lineTo(cx - sw * 0.25, baseY + sh * 0.18);
    ctx.lineTo(cx - sw * 0.17, baseY + sh * 0.24);
    ctx.lineTo(cx - sw * 0.21, baseY + sh * 0.3);
    ctx.lineTo(cx, baseY + sh * (isWomen ? 0.62 : 0.75));
    ctx.lineTo(cx - sw * 0.04, baseY + sh * 0.75);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx + sw * 0.15, baseY - sh * 0.04);
    ctx.lineTo(cx + sw * 0.25, baseY + sh * 0.18);
    ctx.lineTo(cx + sw * 0.17, baseY + sh * 0.24);
    ctx.lineTo(cx + sw * 0.21, baseY + sh * 0.3);
    ctx.lineTo(cx, baseY + sh * (isWomen ? 0.62 : 0.75));
    ctx.lineTo(cx + sw * 0.04, baseY + sh * 0.75);
    ctx.closePath();
    ctx.fill();

    // Subtle lapel highlight edge
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth = Math.max(1.5, w * 0.003);
    ctx.beginPath();
    ctx.moveTo(cx - sw * 0.15, baseY - sh * 0.04);
    ctx.lineTo(cx, baseY + sh * (isWomen ? 0.62 : 0.75));
    ctx.lineTo(cx + sw * 0.15, baseY - sh * 0.04);
    ctx.stroke();
  }

  ctx.restore();
}

export const WebcamPassportBlazer: React.FC<WebcamPassportBlazerProps> = ({ appLang }) => {
  const isBn = appLang === 'bn';
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [camActive, setCamActive] = useState(false);
  const [camError, setCamError] = useState('');
  const [mirrorCam, setMirrorCam] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);

  const [sourceImgUrl, setSourceImgUrl] = useState<string | null>(null);
  const [removeBg, setRemoveBg] = useState(true);
  const [bgTolerance, setBgTolerance] = useState(44);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [suit, setSuit] = useState<SuitPreset>('navy-blazer-tie');
  const [suitX, setSuitX] = useState(0);
  const [suitY, setSuitY] = useState(0);
  const [suitScale, setSuitScale] = useState(1.0);
  const [brightness, setBrightness] = useState(104);
  const [sheetCopies, setSheetCopies] = useState<8 | 12>(8);
  const [exportUrl, setExportUrl] = useState<string>('');

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCamActive(false);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    setCamError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      setCamActive(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      });
    } catch {
      setCamError(
        isBn
          ? 'ওয়েবক্যাম চালু করা যায়নি (পারমিশন দিন অথবা নিচে থেকে ছবি আপলোড করুন)।'
          : 'Could not access webcam. Allow camera permission or upload an existing photo below.'
      );
    }
  };

  const captureFromWebcam = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    // Crop center 35:45 aspect ratio
    const targetAspect = 35 / 45;
    let cw = vw;
    let ch = vh;
    if (vw / vh > targetAspect) {
      cw = Math.round(vh * targetAspect);
    } else {
      ch = Math.round(vw / targetAspect);
    }
    const sx = Math.round((vw - cw) / 2);
    const sy = Math.round((vh - ch) / 2);

    const c = document.createElement('canvas');
    c.width = 700;
    c.height = 900;
    const ctx = c.getContext('2d')!;
    if (mirrorCam) {
      ctx.translate(c.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, sx, sy, cw, ch, 0, 0, c.width, c.height);
    setSourceImgUrl(c.toDataURL('image/png'));
    stopCamera();
  };

  const triggerCountdownCapture = () => {
    setCountdown(3);
    let n = 3;
    const timer = window.setInterval(() => {
      n -= 1;
      if (n <= 0) {
        window.clearInterval(timer);
        setCountdown(null);
        captureFromWebcam();
      } else {
        setCountdown(n);
      }
    }, 900);
  };

  const handleUpload = (file: File | undefined) => {
    if (!file) return;
    stopCamera();
    const url = URL.createObjectURL(file);
    setSourceImgUrl(url);
  };

  // Render composite passport photo with studio BG removal + formal blazer overlay
  useEffect(() => {
    if (!sourceImgUrl || !previewCanvasRef.current) return;
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled || !previewCanvasRef.current) return;
      const canvas = previewCanvasRef.current;
      const W = 413; // 35mm @ 300 DPI
      const H = 531; // 45mm @ 300 DPI
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      // Draw source cover-cropped onto offscreen canvas
      const off = document.createElement('canvas');
      off.width = W;
      off.height = H;
      const octx = off.getContext('2d')!;
      octx.filter = `brightness(${brightness}%) contrast(104%)`;

      const srcRatio = img.width / img.height;
      const dstRatio = W / H;
      let sx = 0, sy = 0, sw = img.width, sh = img.height;
      if (srcRatio > dstRatio) {
        sw = img.height * dstRatio;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / dstRatio;
        sy = (img.height - sh) / 2;
      }
      octx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);

      if (removeBg) {
        const imgData = octx.getImageData(0, 0, W, H);
        const d = imgData.data;
        // Sample top-left, top-right, mid-left, mid-right corners for background seed
        const samples: [number, number, number][] = [];
        const pts = [
          [6, 6], [W - 7, 6], [6, Math.round(H * 0.25)], [W - 7, Math.round(H * 0.25)],
        ];
        pts.forEach(([px, py]) => {
          const i = (py * W + px) * 4;
          samples.push([d[i], d[i + 1], d[i + 2]]);
        });

        const visited = new Uint8Array(W * H);
        const queue = new Int32Array(W * H);
        let head = 0;
        let tail = 0;

        const isBgPixel = (idx4: number) => {
          const r = d[idx4], g = d[idx4 + 1], b = d[idx4 + 2];
          for (let s = 0; s < samples.length; s++) {
            const dr = r - samples[s][0];
            const dg = g - samples[s][1];
            const db = b - samples[s][2];
            if (Math.sqrt(dr * dr + dg * dg + db * db) <= bgTolerance) return true;
          }
          return false;
        };

        // Seed border pixels (top & upper sides)
        for (let x = 0; x < W; x++) {
          const p = x;
          if (!visited[p] && isBgPixel(p * 4)) {
            visited[p] = 1;
            queue[tail++] = p;
          }
        }
        for (let y = 0; y < Math.round(H * 0.72); y++) {
          const pL = y * W;
          const pR = y * W + (W - 1);
          if (!visited[pL] && isBgPixel(pL * 4)) {
            visited[pL] = 1;
            queue[tail++] = pL;
          }
          if (!visited[pR] && isBgPixel(pR * 4)) {
            visited[pR] = 1;
            queue[tail++] = pR;
          }
        }

        while (head < tail) {
          const p = queue[head++];
          const px = p % W;
          const py = (p - px) / W;
          d[p * 4 + 3] = 0;
          const neighbors = [
            px > 0 ? p - 1 : -1,
            px < W - 1 ? p + 1 : -1,
            py > 0 ? p - W : -1,
            py < H - 1 ? p + W : -1,
          ];
          for (let k = 0; k < 4; k++) {
            const np = neighbors[k];
            if (np >= 0 && !visited[np] && isBgPixel(np * 4)) {
              visited[np] = 1;
              queue[tail++] = np;
            }
          }
        }
        octx.putImageData(imgData, 0, 0);
      }

      // Paint chosen studio background
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, W, H);
      ctx.drawImage(off, 0, 0);

      // Paint Formal Blazer / Suit Overlay
      drawFormalSuitOverlay(ctx, W, H, suit, suitX, suitY, suitScale);

      setExportUrl(canvas.toDataURL('image/jpeg', 0.95));
    };
    img.src = sourceImgUrl;
    return () => {
      cancelled = true;
    };
  }, [sourceImgUrl, removeBg, bgTolerance, bgColor, suit, suitX, suitY, suitScale, brightness]);

  const handlePrintA4Sheet = () => {
    if (!previewCanvasRef.current) return;
    const single = previewCanvasRef.current;
    // Generate 300-DPI A4 sheet (2480 x 3508)
    const sheet = document.createElement('canvas');
    sheet.width = 2480;
    sheet.height = 3508;
    const ctx = sheet.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, sheet.width, sheet.height);

    const cols = 4;
    const tileW = 413;
    const tileH = 531;
    const gapX = 60;
    const gapY = 64;
    const totalW = cols * tileW + (cols - 1) * gapX;
    const startX = Math.round((sheet.width - totalW) / 2);
    const startY = 140;

    for (let i = 0; i < sheetCopies; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (tileW + gapX);
      const y = startY + row * (tileH + gapY);
      ctx.drawImage(single, x, y, tileW, tileH);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, tileW, tileH);
    }

    printImageOnA4(sheet.toDataURL('image/jpeg', 0.94), `Passport ${sheetCopies}-Copy Sheet`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-950 text-white rounded-2xl p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-sky-400 flex items-center gap-1.5">
            <Shirt className="w-4 h-4" />
            <span>{isBn ? 'লাইভ ওয়েবক্যাম ক্যাপচার + ব্যাকগ্রাউন্ড ক্লিনার + ফর্মাল ব্লেজার/স্যুট ফিটার' : 'Live Webcam Capture · Studio Backdrop · Formal Blazer / Suit Fitter'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-1">
            {isBn ? 'লাইভ ওয়েবক্যাম পাসপোর্ট ফটো ও ফর্মাল ব্লেজার স্টুডিও' : 'Webcam Passport Photo & Formal Suit Fitter'}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!camActive ? (
            <button
              type="button"
              onClick={startCamera}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              {isBn ? 'ওয়েবক্যাম চালু করুন' : 'Open Live Webcam'}
            </button>
          ) : (
            <button
              type="button"
              onClick={stopCamera}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer"
            >
              <VideoOff className="w-4 h-4" />
              Stop Camera
            </button>
          )}
          <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs cursor-pointer">
            <Upload className="w-4 h-4" />
            {isBn ? 'ছবি আপলোড করুন' : 'Upload Photo'}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0])} />
          </label>
        </div>
      </div>

      {camError && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold">
          {camError}
        </div>
      )}

      {/* Live Webcam Viewfinder */}
      {camActive && (
        <div className="bg-slate-900 rounded-2xl p-5 flex flex-col items-center gap-4 border border-slate-800">
          <div className="relative w-full max-w-md aspect-[35/45] bg-black rounded-2xl overflow-hidden border-2 border-sky-400">
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full object-cover ${mirrorCam ? '-scale-x-100' : ''}`}
            />
            {/* Head & Shoulder Guide Overlay */}
            <svg viewBox="0 0 350 450" className="absolute inset-0 w-full h-full pointer-events-none">
              <ellipse cx="175" cy="170" rx="88" ry="112" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="8 6" />
              <path d="M 35 450 Q 65 320 175 315 Q 285 320 315 450" fill="none" stroke="#facc15" strokeWidth="2.5" strokeDasharray="8 6" />
            </svg>
            {countdown !== null && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-7xl font-black">
                {countdown}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={captureFromWebcam}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm inline-flex items-center gap-2 cursor-pointer"
            >
              <Camera className="w-4 h-4" /> {isBn ? 'এখনই ছবি তুলুন' : 'Capture Instant'}
            </button>
            <button
              type="button"
              onClick={triggerCountdownCapture}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs cursor-pointer"
            >
              3s Timer Capture
            </button>
            <button
              type="button"
              onClick={() => setMirrorCam((m) => !m)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <FlipHorizontal className="w-4 h-4" /> Mirror
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Studio Controls */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 space-y-5">
          <div>
            <div className="text-xs font-bold text-slate-700 mb-2">
              {isBn ? '১. ফর্মাল ব্লেজার / স্যুট নির্বাচন করুন' : '1. Choose Formal Suit / Blazer Overlay'}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SUIT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSuit(opt.id)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold border text-left transition cursor-pointer ${
                    suit === opt.id
                      ? 'bg-slate-900 text-amber-300 border-slate-900'
                      : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-400'
                  }`}
                >
                  {isBn ? opt.bnLabel : opt.label}
                </button>
              ))}
            </div>
          </div>

          {suit !== 'none' && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">{isBn ? 'ব্লেজার পজিশন ও সাইজ ফিট করুন' : 'Fine-Tune Suit Alignment'}</span>
                <button
                  type="button"
                  onClick={() => { setSuitX(0); setSuitY(0); setSuitScale(1); }}
                  className="text-xs font-bold text-indigo-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <label className="block">
                  <span className="text-slate-600 font-semibold">Up / Down ({suitY}px)</span>
                  <input type="range" min={-90} max={90} value={suitY} onChange={(e) => setSuitY(Number(e.target.value))} className="w-full accent-indigo-600 mt-1" />
                </label>
                <label className="block">
                  <span className="text-slate-600 font-semibold">Left / Right ({suitX}px)</span>
                  <input type="range" min={-70} max={70} value={suitX} onChange={(e) => setSuitX(Number(e.target.value))} className="w-full accent-indigo-600 mt-1" />
                </label>
                <label className="block">
                  <span className="text-slate-600 font-semibold">Width ({Math.round(suitScale * 100)}%)</span>
                  <input type="range" min={0.75} max={1.35} step={0.02} value={suitScale} onChange={(e) => setSuitScale(Number(e.target.value))} className="w-full accent-indigo-600 mt-1" />
                </label>
              </div>
            </div>
          )}

          {/* Studio Backdrop */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={removeBg}
                  onChange={(e) => setRemoveBg(e.target.checked)}
                  className="accent-indigo-600"
                />
                <span>{isBn ? 'অটো ব্যাকগ্রাউন্ড রিমুভ ও স্টুডিও কালার' : 'Auto Remove Background & Studio Backdrop'}</span>
              </label>
              {removeBg && <span className="text-xs font-mono text-slate-500">Tolerance: {bgTolerance}</span>}
            </div>

            {removeBg && (
              <>
                <input
                  type="range"
                  min={15}
                  max={95}
                  value={bgTolerance}
                  onChange={(e) => setBgTolerance(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
                <div className="flex flex-wrap items-center gap-2">
                  {BG_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setBgColor(c.hex)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
                        bgColor === c.hex ? 'border-slate-900 ring-2 ring-indigo-500' : 'border-slate-300'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full border border-slate-400" style={{ backgroundColor: c.hex }} />
                      {c.name}
                    </button>
                  ))}
                </div>
              </>
            )}

            <label className="block text-xs">
              <span className="font-bold text-slate-700">Face Brightness ({brightness}%)</span>
              <input type="range" min={80} max={135} value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="w-full accent-indigo-600 mt-1" />
            </label>
          </div>
        </div>

        {/* Right Live 35x45mm Studio Preview */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-5 flex flex-col items-center justify-between gap-4">
          <div className="w-full flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              35 × 45 mm · 300 DPI Passport Studio Output
            </span>
            {exportUrl && (
              <span className="text-xs font-bold text-emerald-700 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ready
              </span>
            )}
          </div>

          {sourceImgUrl ? (
            <canvas
              ref={previewCanvasRef}
              className="w-60 sm:w-64 aspect-[35/45] rounded-xl border-2 border-slate-300 shadow-lg bg-white"
            />
          ) : (
            <div className="w-60 sm:w-64 aspect-[35/45] rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center p-6 text-center text-slate-500 text-xs gap-2">
              <Sparkles className="w-8 h-8 text-slate-400" />
              <span>
                {isBn
                  ? 'ওয়েবক্যাম দিয়ে ছবি তুলুন অথবা আপলোড করুন — ব্লেজার ও ব্যাকগ্রাউন্ড সাথে সাথে সেট হয়ে যাবে।'
                  : 'Capture via Webcam or Upload a portrait to fit a formal blazer & generate a print sheet.'}
              </span>
            </div>
          )}

          <div className="w-full space-y-2.5">
            <div className="flex items-center justify-center gap-2 text-xs">
              <span className="font-bold text-slate-600">A4 Print Sheet Copies:</span>
              {([8, 12] as const).map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => setSheetCopies(cnt)}
                  className={`px-3 py-1 rounded-lg font-bold cursor-pointer ${
                    sheetCopies === cnt ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {cnt} Copies
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <a
                href={exportUrl || undefined}
                download="passport-blazer-photo.jpg"
                className={`py-3 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-2 ${
                  exportUrl ? 'bg-slate-900 hover:bg-slate-800 text-white' : 'bg-slate-200 text-slate-400 pointer-events-none'
                }`}
              >
                <Download className="w-4 h-4" /> Single Photo JPG
              </a>
              <button
                type="button"
                disabled={!exportUrl}
                onClick={handlePrintA4Sheet}
                className="py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-xs font-black inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print {sheetCopies}-Copy A4
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

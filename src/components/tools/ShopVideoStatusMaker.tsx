import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  Download,
  Plus,
  Trash2,
  Upload,
  Video,
  Sparkles,
  Volume2,
  VolumeX,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import type { AppLang } from '../../data/i18n';

interface ShopVideoStatusMakerProps {
  appLang: AppLang;
}

interface PromoSlide {
  id: string;
  headline: string;
  subtext: string;
  priceTag: string;
  imageUrl: string | null;
}

type VideoThemeId = 'cyber-gold' | 'festive-red' | 'emerald-offer' | 'electric-night' | 'clean-studio';
type AspectId = '9:16' | '1:1' | '16:9';
type TransitionId = 'fade' | 'slide' | 'zoom';

const VIDEO_THEMES: Record<
  VideoThemeId,
  {
    nameEn: string;
    nameBn: string;
    bgTop: string;
    bgBottom: string;
    accent: string;
    accentText: string;
    headline: string;
    subtext: string;
  }
> = {
  'cyber-gold': {
    nameEn: 'Cyber Navy & Gold',
    nameBn: 'সাইবার নেভি ও গোল্ড',
    bgTop: '#0f172a',
    bgBottom: '#1e1b4b',
    accent: '#f59e0b',
    accentText: '#0f172a',
    headline: '#ffffff',
    subtext: '#e2e8f0',
  },
  'festive-red': {
    nameEn: 'Festive Red & Gold',
    nameBn: 'উৎসবের লাল ও সোনালি',
    bgTop: '#7f1d1d',
    bgBottom: '#450a0a',
    accent: '#fbbf24',
    accentText: '#450a0a',
    headline: '#fffbeb',
    subtext: '#fde68a',
  },
  'emerald-offer': {
    nameEn: 'Emerald Cashback',
    nameBn: 'এমারেল্ড অফার',
    bgTop: '#064e3b',
    bgBottom: '#022c22',
    accent: '#34d399',
    accentText: '#022c22',
    headline: '#ffffff',
    subtext: '#d1fae5',
  },
  'electric-night': {
    nameEn: 'Electric Violet',
    nameBn: 'ইলেকট্রিক ভায়োলেট',
    bgTop: '#3b0764',
    bgBottom: '#09090b',
    accent: '#38bdf8',
    accentText: '#09090b',
    headline: '#ffffff',
    subtext: '#e0f2fe',
  },
  'clean-studio': {
    nameEn: 'Clean Studio White',
    nameBn: 'ক্লিন স্টুডিও হোয়াইট',
    bgTop: '#f8fafc',
    bgBottom: '#e2e8f0',
    accent: '#4f46e5',
    accentText: '#ffffff',
    headline: '#0f172a',
    subtext: '#334155',
  },
};

const ASPECT_DIMS: Record<AspectId, { w: number; h: number; label: string }> = {
  '9:16': { w: 540, h: 960, label: '9:16 WhatsApp Status / Reels' },
  '1:1': { w: 720, h: 720, label: '1:1 Facebook / Instagram' },
  '16:9': { w: 960, h: 540, label: '16:9 YouTube / Shop TV' },
};

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let current = words[0];
  for (let i = 1; i < words.length; i++) {
    const test = `${current} ${words[i]}`;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      lines.push(current);
      current = words[i];
      if (lines.length === maxLines - 1) break;
    }
  }
  lines.push(current);
  return lines.slice(0, maxLines);
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export const ShopVideoStatusMaker: React.FC<ShopVideoStatusMakerProps> = ({ appLang }) => {
  const isBn = appLang === 'bn';

  // Shop branding (empty by default)
  const [shopName, setShopName] = useState('');
  const [shopPhone, setShopPhone] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [shopLogoUrl, setShopLogoUrl] = useState<string | null>(null);

  // Video config
  const [themeId, setThemeId] = useState<VideoThemeId>('cyber-gold');
  const [aspectId, setAspectId] = useState<AspectId>('9:16');
  const [transitionId, setTransitionId] = useState<TransitionId>('zoom');
  const [secondsPerSlide, setSecondsPerSlide] = useState<number>(3);
  const [includeMusic, setIncludeMusic] = useState<boolean>(true);

  // Slides (empty by default)
  const [slides, setSlides] = useState<PromoSlide[]>([
    { id: 's1', headline: '', subtext: '', priceTag: '', imageUrl: null },
    { id: 's2', headline: '', subtext: '', priceTag: '', imageUrl: null },
    { id: 's3', headline: '', subtext: '', priceTag: '', imageUrl: null },
  ]);
  const [activeSlideIdx, setActiveSlideIdx] = useState<number>(0);

  // Playback & Export state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [previewEngine, setPreviewEngine] = useState<'canvas' | 'css'>('css');
  const [cssSlideIdx, setCssSlideIdx] = useState<number>(0);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordProgress, setRecordProgress] = useState<number>(0);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);
  const [exportedExt, setExportedExt] = useState<string>('webm');
  const [statusError, setStatusError] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const loadedImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const animTimeRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);

  // Preload slide images & logo into HTMLImageElement cache
  useEffect(() => {
    const urls: string[] = [];
    if (shopLogoUrl) urls.push(shopLogoUrl);
    slides.forEach((s) => {
      if (s.imageUrl) urls.push(s.imageUrl);
    });
    urls.forEach((url) => {
      if (!loadedImagesRef.current.has(url)) {
        const img = new Image();
        img.src = url;
        img.onload = () => {
          loadedImagesRef.current.set(url, img);
        };
      }
    });
  }, [slides, shopLogoUrl]);

  const drawFrameAt = (ctx: CanvasRenderingContext2D, elapsedSec: number) => {
    const { w, h } = ASPECT_DIMS[aspectId];
    const theme = VIDEO_THEMES[themeId];
    const totalDuration = Math.max(1, slides.length * secondsPerSlide);
    const loopSec = elapsedSec % totalDuration;
    const slideIdx = Math.min(slides.length - 1, Math.floor(loopSec / secondsPerSlide));
    const localSec = loopSec - slideIdx * secondsPerSlide;
    const progress = Math.min(1, localSec / secondsPerSlide);
    const slide = slides[slideIdx] || slides[0];

    // 1. Background gradient
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, theme.bgTop);
    grad.addColorStop(1, theme.bgBottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle animated geometric glow rings
    ctx.save();
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = theme.accent;
    const drift = Math.sin(elapsedSec * 1.4) * 28;
    ctx.beginPath();
    ctx.arc(w * 0.85 + drift, h * 0.16, w * 0.36, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(w * 0.14 - drift, h * 0.78, w * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Entrance easing (first 0.45s)
    const enterT = Math.min(1, localSec / 0.45);
    const easeOut = 1 - Math.pow(1 - enterT, 3);
    // Exit fade (last 0.25s)
    const exitT = localSec > secondsPerSlide - 0.25 ? (secondsPerSlide - localSec) / 0.25 : 1;
    const slideAlpha = Math.max(0, Math.min(1, easeOut * exitT));

    // Top progress segments (WhatsApp Story style)
    const segGap = 6;
    const padX = Math.round(w * 0.055);
    const segW = (w - padX * 2 - segGap * (slides.length - 1)) / slides.length;
    for (let i = 0; i < slides.length; i++) {
      const sx = padX + i * (segW + segGap);
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      drawRoundedRect(ctx, sx, 16, segW, 5, 3);
      ctx.fill();
      if (i < slideIdx) {
        ctx.fillStyle = theme.accent;
        drawRoundedRect(ctx, sx, 16, segW, 5, 3);
        ctx.fill();
      } else if (i === slideIdx) {
        ctx.fillStyle = theme.accent;
        drawRoundedRect(ctx, sx, 16, Math.max(4, segW * progress), 5, 3);
        ctx.fill();
      }
    }

    // Top Shop Header Bar
    ctx.save();
    const headerY = 36;
    if (shopLogoUrl && loadedImagesRef.current.has(shopLogoUrl)) {
      const logoImg = loadedImagesRef.current.get(shopLogoUrl)!;
      ctx.save();
      ctx.beginPath();
      ctx.arc(padX + 26, headerY + 26, 26, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(logoImg, padX, headerY, 52, 52);
      ctx.restore();
    }
    const textOffsetX = shopLogoUrl ? padX + 64 : padX;
    ctx.fillStyle = theme.headline;
    ctx.font = `800 ${Math.round(w * 0.044)}px 'Noto Sans Bengali', sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(
      shopName.trim() || (isBn ? 'আপনার দোকানের নাম' : 'YOUR SHOP NAME'),
      textOffsetX,
      headerY + 26
    );
    ctx.fillStyle = theme.accent;
    ctx.font = `700 ${Math.round(w * 0.028)}px 'Noto Sans Bengali', sans-serif`;
    ctx.fillText(
      shopAddress.trim() || (isBn ? 'অনলাইন ও প্রিন্ট সার্ভিস সেন্টার' : 'Digital & Print Service Center'),
      textOffsetX,
      headerY + 48
    );
    ctx.restore();

    // Slide Content Area with Transition
    ctx.save();
    ctx.globalAlpha = slideAlpha;
    if (transitionId === 'slide') {
      const offset = (1 - easeOut) * (w * 0.28);
      ctx.translate(offset, 0);
    } else if (transitionId === 'zoom') {
      const scale = 0.92 + easeOut * 0.08;
      ctx.translate(w / 2, h / 2);
      ctx.scale(scale, scale);
      ctx.translate(-w / 2, -h / 2);
    }

    const isPortrait = aspectId === '9:16';
    const isLandscape = aspectId === '16:9';

    // Media Card Area (if photo uploaded)
    const imgBoxX = padX;
    const imgBoxY = isLandscape ? 114 : 112;
    const imgBoxW = isLandscape ? w * 0.44 : w - padX * 2;
    const imgBoxH = isPortrait ? h * 0.42 : isLandscape ? h - 220 : h * 0.42;

    if (slide.imageUrl && loadedImagesRef.current.has(slide.imageUrl)) {
      const img = loadedImagesRef.current.get(slide.imageUrl)!;
      ctx.save();
      drawRoundedRect(ctx, imgBoxX, imgBoxY, imgBoxW, imgBoxH, 20);
      ctx.clip();

      // Ken Burns gentle zoom
      const kbScale = 1 + progress * 0.09;
      const aspectImg = img.width / img.height;
      const aspectBox = imgBoxW / imgBoxH;
      let drawW = imgBoxW * kbScale;
      let drawH = imgBoxH * kbScale;
      if (aspectImg > aspectBox) {
        drawH = imgBoxH * kbScale;
        drawW = drawH * aspectImg;
      } else {
        drawW = imgBoxW * kbScale;
        drawH = drawW / aspectImg;
      }
      const dx = imgBoxX + (imgBoxW - drawW) / 2;
      const dy = imgBoxY + (imgBoxH - drawH) / 2;
      ctx.drawImage(img, dx, dy, drawW, drawH);
      ctx.restore();

      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 3;
      drawRoundedRect(ctx, imgBoxX, imgBoxY, imgBoxW, imgBoxH, 20);
      ctx.stroke();
    } else {
      // Crisp graphic accent frame when no photo uploaded
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 2;
      drawRoundedRect(ctx, imgBoxX, imgBoxY, imgBoxW, imgBoxH, 20);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = theme.accent;
      ctx.font = `900 ${Math.round(w * 0.13)}px 'Noto Sans Bengali', sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`0${slideIdx + 1}`, imgBoxX + imgBoxW / 2, imgBoxY + imgBoxH / 2 + 18);
      ctx.restore();
    }

    // Text Region
    const textRegionX = isLandscape ? imgBoxX + imgBoxW + 28 : padX;
    const textRegionW = isLandscape ? w - textRegionX - padX : w - padX * 2;
    let cursorY = isLandscape ? imgBoxY + 46 : imgBoxY + imgBoxH + 44;

    // Price / Offer Badge
    if (slide.priceTag.trim()) {
      ctx.font = `900 ${Math.round(w * 0.038)}px 'Noto Sans Bengali', sans-serif`;
      const badgeText = slide.priceTag.trim();
      const bw = Math.min(textRegionW, ctx.measureText(badgeText).width + 36);
      const bh = 42;
      const bx = isLandscape ? textRegionX : (w - bw) / 2;
      ctx.fillStyle = theme.accent;
      drawRoundedRect(ctx, bx, cursorY - 28, bw, bh, 12);
      ctx.fill();
      ctx.fillStyle = theme.accentText;
      ctx.textAlign = 'center';
      ctx.fillText(badgeText, bx + bw / 2, cursorY + 1);
      cursorY += 42;
    }

    // Main Headline
    const headlineText =
      slide.headline.trim() ||
      (isBn ? `স্লাইড ${slideIdx + 1} — আপনার অফার লিখুন` : `Slide ${slideIdx + 1} — Enter Headline`);
    const headFontSize = Math.round(isLandscape ? w * 0.042 : w * 0.064);
    ctx.font = `900 ${headFontSize}px 'Noto Sans Bengali', sans-serif`;
    ctx.fillStyle = theme.headline;
    ctx.textAlign = isLandscape ? 'left' : 'center';
    const headLines = wrapCanvasText(ctx, headlineText, textRegionW, 3);
    headLines.forEach((line) => {
      ctx.fillText(line, isLandscape ? textRegionX : w / 2, cursorY);
      cursorY += headFontSize * 1.24;
    });

    // Subtext
    if (slide.subtext.trim()) {
      cursorY += 6;
      const subFontSize = Math.round(isLandscape ? w * 0.025 : w * 0.037);
      ctx.font = `600 ${subFontSize}px 'Noto Sans Bengali', sans-serif`;
      ctx.fillStyle = theme.subtext;
      const subLines = wrapCanvasText(ctx, slide.subtext.trim(), textRegionW, 3);
      subLines.forEach((line) => {
        ctx.fillText(line, isLandscape ? textRegionX : w / 2, cursorY);
        cursorY += subFontSize * 1.35;
      });
    }

    ctx.restore();

    // Bottom Call-To-Action Strip (Always Visible)
    const footerH = isLandscape ? 64 : 84;
    const footerY = h - footerH - 20;
    ctx.fillStyle = theme.accent;
    drawRoundedRect(ctx, padX, footerY, w - padX * 2, footerH, 16);
    ctx.fill();

    ctx.fillStyle = theme.accentText;
    ctx.textAlign = 'center';
    ctx.font = `900 ${Math.round(w * (isLandscape ? 0.028 : 0.045))}px 'Noto Sans Bengali', sans-serif`;
    const ctaText = shopPhone.trim()
      ? `${isBn ? 'কল / WhatsApp:' : 'Call / WhatsApp:'} ${shopPhone.trim()}`
      : isBn
      ? 'আজই যোগাযোগ করুন — দ্রুত ও নির্ভরযোগ্য সার্ভিস'
      : 'Visit Today — Fast & Trusted Service';
    ctx.fillText(ctaText, w / 2, footerY + footerH / 2 + 8);
  };

  // Animation loop for live preview
  useEffect(() => {
    let rafId = 0;
    const renderLoop = (now: number) => {
      if (!lastFrameRef.current) lastFrameRef.current = now;
      const dt = (now - lastFrameRef.current) / 1000;
      lastFrameRef.current = now;

      if (isPlaying && !isRecording) {
        animTimeRef.current += dt;
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawFrameAt(ctx, animTimeRef.current);
        }
      }
      rafId = requestAnimationFrame(renderLoop);
    };

    rafId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(rafId);
  });

  // CSS Slideshow animation ticker
  useEffect(() => {
    if (!isPlaying || isRecording) return;
    const t = window.setInterval(() => {
      setCssSlideIdx((prev) => (prev + 1) % Math.max(1, slides.length));
    }, Math.max(1200, secondsPerSlide * 1000));
    return () => window.clearInterval(t);
  }, [isPlaying, isRecording, slides.length, secondsPerSlide]);

  const handleBulkImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const picked = Array.from(fileList).slice(0, 6);
    Promise.all(
      picked.map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
            reader.readAsDataURL(file);
          })
      )
    ).then((urls) => {
      const valid = urls.filter(Boolean);
      if (valid.length === 0) return;
      setSlides((prev) =>
        valid.map((imgUrl, idx) => ({
          id: prev[idx]?.id || `bulk_${Date.now()}_${idx}`,
          headline: prev[idx]?.headline || '',
          subtext: prev[idx]?.subtext || '',
          priceTag: prev[idx]?.priceTag || '',
          imageUrl: imgUrl,
        }))
      );
      setActiveSlideIdx(0);
      setCssSlideIdx(0);
    });
    e.target.value = '';
  };

  const handleSlideImageUpload = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const nextUrl = reader.result;
        setSlides((prev) => prev.map((s, i) => (i === idx ? { ...s, imageUrl: nextUrl } : s)));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleShopLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setShopLogoUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleAddSlide = () => {
    if (slides.length >= 6) return;
    const newId = `s${Date.now()}`;
    setSlides((prev) => [...prev, { id: newId, headline: '', subtext: '', priceTag: '', imageUrl: null }]);
    setActiveSlideIdx(slides.length);
  };

  const handleRemoveSlide = (idx: number) => {
    if (slides.length <= 2) return;
    setSlides((prev) => prev.filter((_, i) => i !== idx));
    setActiveSlideIdx((prev) => Math.max(0, Math.min(prev, slides.length - 2)));
  };

  const loadStarterPreset = () => {
    setShopName(isBn ? 'স্মার্ট সাইবার ও ডিজিটাল স্টুডিও' : 'SMART CYBER & DIGITAL STUDIO');
    setShopPhone('8670225411');
    setShopAddress(isBn ? 'স্টেশন রোড, পশ্চিমবঙ্গ' : 'Station Road, West Bengal');
    setSlides([
      {
        id: 'p1',
        headline: isBn ? 'মাত্র ৫ মিনিটে পাসপোর্ট ফটো ও PVC কার্ড!' : 'Instant Passport Photo & PVC Card!',
        subtext: isBn ? 'আধার, প্যান, ভোটার ও রেশন কার্ড প্রিন্ট এবং ল্যামিনেশন' : 'Aadhaar, PAN, Voter & Ration Smartcard Print',
        priceTag: isBn ? 'শুরু মাত্র ₹৩০ থেকে' : 'Starting @ ₹30',
        imageUrl: slides[0]?.imageUrl || null,
      },
      {
        id: 'p2',
        headline: isBn ? 'সমস্ত সরকারি ও চাকরির অনলাইন ফর্ম ফিলাপ' : 'All Govt Exam & WB Scheme Form Fill-up',
        subtext: isBn ? 'SSC, রেল, পুলিশ, লক্ষ্মীর ভাণ্ডার ও স্কলারশিপ আবেদন' : 'SSC, RRB, WBP, Lakshmir Bhandar & SVMCM',
        priceTag: isBn ? '১০০% নির্ভুল সার্ভিস' : '100% Verified Service',
        imageUrl: slides[1]?.imageUrl || null,
      },
      {
        id: 'p3',
        headline: isBn ? 'কালার জেরক্স, প্রোজেক্ট বাইন্ডিং ও ল্যামিনেশন' : 'Color Xerox, Project Print & Lamination',
        subtext: isBn ? 'স্কুল-কলেজ প্রোজেক্ট ফ্রন্ট পেজ ও বুকলেট প্রিন্ট' : 'School Project Front Page & Booklet Binding',
        priceTag: isBn ? 'আজই আসুন!' : 'Visit Today!',
        imageUrl: slides[2]?.imageUrl || null,
      },
    ]);
    animTimeRef.current = 0;
  };

  const handleReset = () => {
    setShopName('');
    setShopPhone('');
    setShopAddress('');
    setShopLogoUrl(null);
    setSlides([
      { id: 's1', headline: '', subtext: '', priceTag: '', imageUrl: null },
      { id: 's2', headline: '', subtext: '', priceTag: '', imageUrl: null },
      { id: 's3', headline: '', subtext: '', priceTag: '', imageUrl: null },
    ]);
    setExportedVideoUrl(null);
    setStatusError('');
  };

  const handleExportVideo = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (typeof MediaRecorder === 'undefined') {
      setStatusError(
        isBn
          ? 'আপনার ব্রাউজারে ভিডিও রেকর্ডিং সাপোর্ট নেই। অনুগ্রহ করে Chrome বা Edge ব্যবহার করুন।'
          : 'MediaRecorder is not supported in this browser. Please use Chrome or Edge.'
      );
      return;
    }

    setStatusError('');
    setExportedVideoUrl(null);
    setIsRecording(true);
    setRecordProgress(0);

    const totalSec = slides.length * secondsPerSlide;
    const fps = 30;
    const totalFrames = Math.ceil(totalSec * fps);

    // Prepare Canvas Stream + Optional Web Audio soft promo beat
    const videoStream = canvas.captureStream(fps);
    let audioCtx: AudioContext | null = null;
    let combinedStream: MediaStream = videoStream;

    if (includeMusic) {
      try {
        const AudioContextClass =
          window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioCtx = new AudioContextClass();
        const dest = audioCtx.createMediaStreamDestination();
        const notes = [261.63, 329.63, 392.0, 523.25, 392.0, 329.63, 293.66, 392.0];
        const beatSec = 0.45;
        const totalBeats = Math.ceil(totalSec / beatSec);
        for (let b = 0; b < totalBeats; b++) {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = notes[b % notes.length];
          const startAt = audioCtx.currentTime + b * beatSec;
          gain.gain.setValueAtTime(0.001, startAt);
          gain.gain.exponentialRampToValueAtTime(0.08, startAt + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, startAt + beatSec * 0.9);
          osc.connect(gain);
          gain.connect(dest);
          osc.start(startAt);
          osc.stop(startAt + beatSec);
        }
        combinedStream = new MediaStream([
          ...videoStream.getVideoTracks(),
          ...dest.stream.getAudioTracks(),
        ]);
      } catch {
        // fallback silent video
      }
    }

    const mimeCandidates = [
      'video/mp4;codecs=avc1,mp4a.40.2',
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ];
    const pickedMime = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) || 'video/webm';
    const ext = pickedMime.includes('mp4') ? 'mp4' : 'webm';
    setExportedExt(ext);

    const chunks: BlobPart[] = [];
    const recorder = new MediaRecorder(combinedStream, {
      mimeType: pickedMime,
      videoBitsPerSecond: 3_000_000,
    });

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    const donePromise = new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        resolve(new Blob(chunks, { type: pickedMime }));
      };
    });

    recorder.start();
    const ctx = canvas.getContext('2d');
    const startTs = performance.now();

    for (let f = 0; f < totalFrames; f++) {
      const targetTimeSec = f / fps;
      if (ctx) {
        drawFrameAt(ctx, targetTimeSec);
      }
      setRecordProgress(Math.round(((f + 1) / totalFrames) * 100));
      const idealElapsedMs = ((f + 1) / fps) * 1000;
      const actualElapsedMs = performance.now() - startTs;
      const waitMs = Math.max(4, idealElapsedMs - actualElapsedMs);
      await new Promise((r) => setTimeout(r, waitMs));
    }

    recorder.stop();
    const blob = await donePromise;
    if (audioCtx) {
      audioCtx.close().catch(() => {});
    }

    const url = URL.createObjectURL(blob);
    setExportedVideoUrl(url);
    setIsRecording(false);
    setRecordProgress(100);
  };

  const dims = ASPECT_DIMS[aspectId];
  const currentSlide = slides[activeSlideIdx] || slides[0];

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {(Object.keys(ASPECT_DIMS) as AspectId[]).map((aKey) => (
              <button
                key={aKey}
                type="button"
                onClick={() => setAspectId(aKey)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  aspectId === aKey
                    ? 'bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {aKey}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIncludeMusic((m) => !m)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer ${
              includeMusic
                ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            {includeMusic ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            {isBn ? (includeMusic ? 'ব্যাকগ্রাউন্ড মিউজিক চালু' : 'মিউজিক বন্ধ') : includeMusic ? 'Audio Chime ON' : 'Silent Video'}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadStarterPreset}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200 text-xs font-bold cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isBn ? 'ডেমো অফার ভরুন' : 'Load Shop Demo'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {isBn ? 'রিসেট' : 'Clear'}
          </button>
          <button
            type="button"
            disabled={isRecording}
            onClick={handleExportVideo}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-xs font-extrabold shadow-sm cursor-pointer"
          >
            <Video className="w-4 h-4" />
            {isRecording
              ? `${isBn ? 'ভিডিও তৈরি হচ্ছে...' : 'Rendering...'} ${recordProgress}%`
              : isBn
              ? `প্রোমো ভিডিও তৈরি করুন (${slides.length * secondsPerSlide}s)`
              : `Export Promo Video (${slides.length * secondsPerSlide}s)`}
          </button>
        </div>
      </div>

      {statusError && (
        <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 px-4 py-3 text-xs font-bold text-rose-700 dark:text-rose-300">
          {statusError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Controls */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-5">
          {/* Shop Branding */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isBn ? '১. দোকানের ব্র্যান্ডিং (প্রতি ফ্রেমে থাকবে)' : '1. Shop Branding (Persistent Header & CTA)'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder={isBn ? 'দোকানের নাম (যেমন: স্মার্ট সাইবার)' : 'Shop Name'}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
              />
              <input
                type="text"
                value={shopPhone}
                onChange={(e) => setShopPhone(e.target.value)}
                placeholder={isBn ? 'মোবাইল / WhatsApp নম্বর' : 'Mobile / WhatsApp Number'}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <input
                type="text"
                value={shopAddress}
                onChange={(e) => setShopAddress(e.target.value)}
                placeholder={isBn ? 'দোকানের ঠিকানা বা ট্যাগলাইন' : 'Shop Address or Tagline'}
                className="flex-1 min-w-[180px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
              />
              <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                {isBn ? 'লোগো' : 'Logo'}
                <input type="file" accept="image/*" onChange={handleShopLogoUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* Theme & Animation */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isBn ? '২. রঙের থিম ও অ্যানিমেশন' : '2. Color Theme & Motion'}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(VIDEO_THEMES) as VideoThemeId[]).map((tk) => {
                const tv = VIDEO_THEMES[tk];
                return (
                  <button
                    key={tk}
                    type="button"
                    onClick={() => setThemeId(tk)}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border-2 text-xs font-bold cursor-pointer ${
                      themeId === tk
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full shrink-0 border"
                      style={{ backgroundColor: tv.bgTop, borderColor: tv.accent }}
                    />
                    <span className="truncate">{isBn ? tv.nameBn : tv.nameEn}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  {isBn ? 'ট্রানজিশন স্টাইল' : 'Transition Effect'}
                </label>
                <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  {(['zoom', 'slide', 'fade'] as TransitionId[]).map((tr) => (
                    <button
                      key={tr}
                      type="button"
                      onClick={() => setTransitionId(tr)}
                      className={`flex-1 py-1 rounded-lg text-xs font-bold capitalize cursor-pointer ${
                        transitionId === tr
                          ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {tr}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  {isBn ? 'প্রতি স্লাইডের সময়' : 'Duration per Slide'}
                </label>
                <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  {[2.5, 3, 4, 5].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setSecondsPerSlide(sec)}
                      className={`flex-1 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                        secondsPerSlide === sec
                          ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Slides Manager */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {isBn ? `৩. স্লাইড এডিটর (${slides.length}/6)` : `3. Slide Editor (${slides.length}/6)`}
              </h3>
              <div className="flex items-center gap-1.5">
                <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  {isBn ? '৩-৫টি ছবি একসাথে দিন' : 'Upload 3–5 Photos'}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleBulkImagesUpload}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  disabled={slides.length >= 6}
                  onClick={handleAddSlide}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 disabled:opacity-40 text-white text-xs font-bold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {isBn ? 'নতুন স্লাইড' : 'Add Slide'}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {slides.map((sl, i) => (
                <div key={sl.id} className="inline-flex items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSlideIdx(i);
                      animTimeRef.current = i * secondsPerSlide + 0.5;
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                      activeSlideIdx === i
                        ? 'bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {isBn ? `স্লাইড ${i + 1}` : `Slide ${i + 1}`}
                  </button>
                  {slides.length > 2 && activeSlideIdx === i && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSlide(i)}
                      className="ml-1 p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                      title="Delete slide"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {currentSlide && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3">
                <input
                  type="text"
                  value={currentSlide.headline}
                  onChange={(e) =>
                    setSlides((prev) =>
                      prev.map((s, i) => (i === activeSlideIdx ? { ...s, headline: e.target.value } : s))
                    )
                  }
                  placeholder={isBn ? 'স্লাইডের মূল অফার বা শিরোনাম লিখুন...' : 'Main Offer / Headline...'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold"
                />
                <input
                  type="text"
                  value={currentSlide.subtext}
                  onChange={(e) =>
                    setSlides((prev) =>
                      prev.map((s, i) => (i === activeSlideIdx ? { ...s, subtext: e.target.value } : s))
                    )
                  }
                  placeholder={isBn ? 'বিস্তারিত বিবরণ (ঐচ্ছিক)' : 'Supporting Details (Optional)'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
                />
                <div className="flex flex-wrap items-center gap-2.5">
                  <input
                    type="text"
                    value={currentSlide.priceTag}
                    onChange={(e) =>
                      setSlides((prev) =>
                        prev.map((s, i) => (i === activeSlideIdx ? { ...s, priceTag: e.target.value } : s))
                      )
                    }
                    placeholder={isBn ? 'দাম / অফার ব্যাজ (যেমন: মাত্র ₹৩০)' : 'Offer / Price Tag (e.g. Only ₹30)'}
                    className="flex-1 min-w-[150px] px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                  />
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    {currentSlide.imageUrl
                      ? isBn
                        ? 'ছবি বদলান'
                        : 'Change Photo'
                      : isBn
                      ? 'ছবি যোগ করুন'
                      : 'Add Photo'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleSlideImageUpload(activeSlideIdx, e)}
                      className="hidden"
                    />
                  </label>
                  {currentSlide.imageUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        setSlides((prev) =>
                          prev.map((s, i) => (i === activeSlideIdx ? { ...s, imageUrl: null } : s))
                        )
                      }
                      className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Live Video Canvas & CSS Animated Preview */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-950 rounded-2xl p-4 border-2 border-slate-800 flex flex-col items-center">
            <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-3 text-xs font-bold text-slate-300">
              <span>{ASPECT_DIMS[aspectId].label}</span>
              <div className="flex items-center gap-1.5">
                <div className="flex gap-1 p-0.5 bg-slate-900 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPreviewEngine('css')}
                    className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer ${
                      previewEngine === 'css' ? 'bg-amber-400 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    CSS Live
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewEngine('canvas')}
                    className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer ${
                      previewEngine === 'canvas' ? 'bg-amber-400 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    Video Render
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPlaying((p) => !p)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {isPlaying ? (isBn ? 'বিরতি' : 'Pause') : isBn ? 'চালান' : 'Play'}
                </button>
              </div>
            </div>

            {previewEngine === 'css' && !isRecording && (() => {
              const tv = VIDEO_THEMES[themeId];
              const activeCssSlide = slides[cssSlideIdx % slides.length] || slides[0];
              const boxAspectClass =
                aspectId === '9:16'
                  ? 'w-[290px] h-[515px]'
                  : aspectId === '1:1'
                  ? 'w-[380px] h-[380px]'
                  : 'w-full max-w-[510px] h-[290px]';
              return (
                <div
                  key={`${cssSlideIdx}-${transitionId}`}
                  className={`${boxAspectClass} rounded-2xl border border-slate-700 shadow-2xl overflow-hidden relative flex flex-col justify-between p-4 transition-all duration-500`}
                  style={{
                    background: `linear-gradient(135deg, ${tv.bgTop}, ${tv.bgBottom})`,
                    animation:
                      transitionId === 'slide'
                        ? 'waSlideIn 0.55s ease-out'
                        : transitionId === 'zoom'
                        ? 'waZoomIn 0.55s ease-out'
                        : 'waFadeIn 0.55s ease-out',
                  }}
                >
                  <style>{`
                    @keyframes waSlideIn { from { opacity: 0; transform: translateX(26px); } to { opacity: 1; transform: translateX(0); } }
                    @keyframes waZoomIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
                    @keyframes waFadeIn { from { opacity: 0; } to { opacity: 1; } }
                    @keyframes waKenBurns { from { transform: scale(1); } to { transform: scale(1.09); } }
                  `}</style>
                  {/* Top progress bars */}
                  <div className="space-y-2.5 z-10">
                    <div className="flex gap-1">
                      {slides.map((s, idx) => (
                        <div key={s.id} className="h-1 flex-1 rounded-full bg-white/25 overflow-hidden">
                          <div
                            className="h-full transition-all duration-300"
                            style={{
                              backgroundColor: tv.accent,
                              width: idx <= cssSlideIdx % slides.length ? '100%' : '0%',
                            }}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      {shopLogoUrl && (
                        <img src={shopLogoUrl} alt="Logo" className="w-8 h-8 rounded-full object-cover border border-white/30" />
                      )}
                      <div className="min-w-0 text-left">
                        <div className="text-xs font-black truncate" style={{ color: tv.headline }}>
                          {shopName.trim() || (isBn ? 'আপনার দোকানের নাম' : 'YOUR SHOP NAME')}
                        </div>
                        <div className="text-[10px] font-bold truncate" style={{ color: tv.accent }}>
                          {shopAddress.trim() || (isBn ? 'ডিজিটাল ও প্রিন্ট সেন্টার' : 'Digital & Print Center')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Center Visual + Text */}
                  <div className="flex-1 flex flex-col items-center justify-center gap-2.5 my-2 overflow-hidden z-10 text-center">
                    {activeCssSlide?.imageUrl ? (
                      <div
                        className="w-full flex-1 min-h-0 rounded-xl overflow-hidden border-2"
                        style={{ borderColor: tv.accent }}
                      >
                        <img
                          src={activeCssSlide.imageUrl}
                          alt="Slide"
                          className="w-full h-full object-cover"
                          style={{ animation: `waKenBurns ${secondsPerSlide}s linear forwards` }}
                        />
                      </div>
                    ) : (
                      <div
                        className="w-full flex-1 min-h-[110px] rounded-xl border border-dashed flex items-center justify-center text-3xl font-black"
                        style={{ borderColor: tv.accent, color: tv.accent }}
                      >
                        0{(cssSlideIdx % slides.length) + 1}
                      </div>
                    )}

                    {activeCssSlide?.priceTag.trim() && (
                      <span
                        className="px-3 py-1 rounded-lg text-xs font-black"
                        style={{ backgroundColor: tv.accent, color: tv.accentText }}
                      >
                        {activeCssSlide.priceTag}
                      </span>
                    )}
                    <div className="text-base font-black leading-tight" style={{ color: tv.headline }}>
                      {activeCssSlide?.headline.trim() || (isBn ? 'আপনার অফার লিখুন' : 'Your Offer Headline')}
                    </div>
                    {activeCssSlide?.subtext.trim() && (
                      <div className="text-[11px] font-semibold leading-snug" style={{ color: tv.subtext }}>
                        {activeCssSlide.subtext}
                      </div>
                    )}
                  </div>

                  {/* Bottom CTA Strip */}
                  <div
                    className="py-2 px-3 rounded-xl text-center text-xs font-black z-10"
                    style={{ backgroundColor: tv.accent, color: tv.accentText }}
                  >
                    {shopPhone.trim()
                      ? `${isBn ? 'কল / WhatsApp:' : 'Call / WhatsApp:'} ${shopPhone.trim()}`
                      : isBn
                      ? 'আজই যোগাযোগ করুন'
                      : 'Visit Today!'}
                  </div>
                </div>
              );
            })()}

            <canvas
              ref={canvasRef}
              width={dims.w}
              height={dims.h}
              className={`rounded-xl shadow-2xl border border-slate-700 max-h-[540px] w-auto max-w-full ${
                previewEngine === 'css' && !isRecording ? 'hidden' : 'block'
              }`}
            />

            {isRecording && (
              <div className="w-full mt-4 space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-amber-300">
                  <span>{isBn ? 'হাই-ডেফিনিশন ভিডিও রেন্ডার হচ্ছে...' : 'Rendering HD Promo Video...'}</span>
                  <span>{recordProgress}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 transition-all duration-150"
                    style={{ width: `${recordProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {exportedVideoUrl && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-400 dark:border-emerald-700 rounded-2xl p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 text-sm font-extrabold text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-5 h-5" />
                  {isBn ? 'ভিডিও স্ট্যাটাস তৈরি হয়ে গেছে!' : 'Promo Video Ready to Share!'}
                </div>
                <a
                  href={exportedVideoUrl}
                  download={`${(shopName.trim() || 'shop_promo_status').replace(/\s+/g, '_')}.${exportedExt}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  {isBn ? `ভিডিও ডাউনলোড (.${exportedExt.toUpperCase()})` : `Download Video (.${exportedExt.toUpperCase()})`}
                </a>
              </div>
              <video
                src={exportedVideoUrl}
                controls
                className="w-full max-h-[320px] rounded-xl bg-black mx-auto"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import { ImagePlus, Sparkles, Loader2, Download, Printer, Upload, RotateCcw } from 'lucide-react';
import type { AppLang } from '../../data/i18n';
import { printImageOnA4 } from '../../utils/printHelper';

interface BengaliBannerThumbnailMakerProps {
  appLang: AppLang;
}

type AspectId = 'whatsapp-status' | 'square-post' | 'youtube-hd';

const ASPECT_CONFIG: Record<AspectId, { label: string; w: number; h: number }> = {
  'whatsapp-status': { label: 'WhatsApp Status (9:16)', w: 720, h: 1280 },
  'square-post': { label: 'Facebook / Offer (1:1)', w: 1080, h: 1080 },
  'youtube-hd': { label: 'YouTube / Cover (16:9)', w: 1280, h: 720 },
};

const BANNER_THEMES = {
  pujaGold: { name: 'Festival Gold & Crimson', bg1: '#58101c', bg2: '#1a060a', accent: '#facc15', text: '#ffffff', badgeBg: '#facc15', badgeText: '#450a0a' },
  cyberElectric: { name: 'Cyber Midnight Electric', bg1: '#0f172a', bg2: '#1e1b4b', accent: '#38bdf8', text: '#ffffff', badgeBg: '#38bdf8', badgeText: '#082f49' },
  emeraldAlert: { name: 'Scholarship / Job Emerald', bg1: '#064e3b', bg2: '#022c22', accent: '#34d399', text: '#ffffff', badgeBg: '#fde047', badgeText: '#022c22' },
  grandOffer: { name: 'Grand Discount Amber', bg1: '#18181b', bg2: '#09090b', accent: '#f59e0b', text: '#ffffff', badgeBg: '#ef4444', badgeText: '#ffffff' },
  royalEducation: { name: 'Education Royal Blue', bg1: '#1e3a8a', bg2: '#0f172a', accent: '#fbbf24', text: '#ffffff', badgeBg: '#fbbf24', badgeText: '#0f172a' },
};

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 3
): number {
  const words = text.trim().split(/\s+/);
  let line = '';
  let drawnLines = 0;
  let curY = y;

  for (let i = 0; i < words.length; i++) {
    const testLine = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, curY);
      drawnLines += 1;
      curY += lineHeight;
      line = words[i];
      if (drawnLines >= maxLines - 1) break;
    } else {
      line = testLine;
    }
  }
  if (line && drawnLines < maxLines) {
    ctx.fillText(line, x, curY);
    curY += lineHeight;
  }
  return curY;
}

export const BengaliBannerThumbnailMaker: React.FC<BengaliBannerThumbnailMakerProps> = ({ appLang }) => {
  const isBn = appLang === 'bn';
  const [aspect, setAspect] = useState<AspectId>('square-post');
  const [themeKey, setThemeKey] = useState<keyof typeof BANNER_THEMES>('cyberElectric');

  // Empty-default inputs
  const [badgeText, setBadgeText] = useState('');
  const [headline, setHeadline] = useState('');
  const [subheadline, setSubheadline] = useState('');
  const [ctaLine, setCtaLine] = useState('');
  const [shopName, setShopName] = useState('');
  const [contactLine, setContactLine] = useState('');
  const [heroImgUrl, setHeroImgUrl] = useState<string | null>(null);

  // AI Ad Copy Helper
  const [aiIdea, setAiIdea] = useState('');
  const [aiLang, setAiLang] = useState<'bn' | 'en'>(isBn ? 'bn' : 'en');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [exportUrl, setExportUrl] = useState('');

  const theme = BANNER_THEMES[themeKey];
  const dims = ASPECT_CONFIG[aspect];

  const handleAiCopy = async () => {
    if (!aiIdea.trim()) return;
    setAiLoading(true);
    setAiError('');
    try {
      const res = await fetch('/api/ai/banner-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: aiIdea, lang: aiLang }),
      });
      const data = await res.json();
      if (!res.ok || !data?.copy) throw new Error(data?.error || 'Could not generate copy');
      setBadgeText(data.copy.badge || '');
      setHeadline(data.copy.headline || '');
      setSubheadline(data.copy.subheadline || '');
      setCtaLine(data.copy.ctaLine || '');
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : 'AI copy error');
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;

    const drawBanner = (heroImg: HTMLImageElement | null) => {
      if (cancelled) return;
      canvas.width = dims.w;
      canvas.height = dims.h;
      const ctx = canvas.getContext('2d')!;

      // Background rich gradient
      const grad = ctx.createLinearGradient(0, 0, dims.w, dims.h);
      grad.addColorStop(0, theme.bg1);
      grad.addColorStop(1, theme.bg2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, dims.w, dims.h);

      // Decorative geometric radial accent glows
      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = theme.accent;
      ctx.beginPath();
      ctx.arc(dims.w * 0.9, dims.h * 0.12, dims.w * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(dims.w * 0.08, dims.h * 0.88, dims.w * 0.28, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Inner frame border
      const pad = Math.round(Math.min(dims.w, dims.h) * 0.045);
      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 5;
      ctx.strokeRect(pad, pad, dims.w - pad * 2, dims.h - pad * 2);

      // Optional uploaded photo / logo
      const isWide = aspect === 'youtube-hd';
      const contentX = pad + 44;
      const contentMaxW = isWide && heroImg ? dims.w * 0.56 : dims.w - (pad + 44) * 2;

      if (heroImg) {
        ctx.save();
        if (isWide) {
          const boxW = Math.round(dims.w * 0.30);
          const boxH = Math.round(dims.h * 0.62);
          const bx = dims.w - pad - 36 - boxW;
          const by = Math.round((dims.h - boxH) / 2);
          ctx.beginPath();
          ctx.roundRect(bx, by, boxW, boxH, 24);
          ctx.clip();
          const sc = Math.max(boxW / heroImg.width, boxH / heroImg.height);
          ctx.drawImage(heroImg, bx + (boxW - heroImg.width * sc) / 2, by + (boxH - heroImg.height * sc) / 2, heroImg.width * sc, heroImg.height * sc);
          ctx.restore();
          ctx.strokeStyle = theme.accent;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.roundRect(bx, by, boxW, boxH, 24);
          ctx.stroke();
        } else {
          const imgSize = Math.round(dims.w * 0.24);
          const bx = dims.w - pad - 36 - imgSize;
          const by = pad + 36;
          ctx.beginPath();
          ctx.roundRect(bx, by, imgSize, imgSize, 20);
          ctx.clip();
          const sc = Math.max(imgSize / heroImg.width, imgSize / heroImg.height);
          ctx.drawImage(heroImg, bx + (imgSize - heroImg.width * sc) / 2, by + (imgSize - heroImg.height * sc) / 2, heroImg.width * sc, heroImg.height * sc);
          ctx.restore();
          ctx.strokeStyle = theme.accent;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.roundRect(bx, by, imgSize, imgSize, 20);
          ctx.stroke();
        }
      }

      // Top Badge Ribbon
      let curY = pad + (aspect === 'whatsapp-status' ? 120 : 88);
      if (badgeText.trim()) {
        ctx.font = '800 28px "Noto Sans Bengali", "Plus Jakarta Sans", sans-serif';
        const tw = ctx.measureText(badgeText.trim()).width;
        ctx.fillStyle = theme.badgeBg;
        ctx.beginPath();
        ctx.roundRect(contentX, curY - 34, Math.min(contentMaxW, tw + 48), 52, 12);
        ctx.fill();
        ctx.fillStyle = theme.badgeText;
        ctx.fillText(badgeText.trim(), contentX + 24, curY + 2);
        curY += 86;
      }

      // Main Headline
      const headSize = aspect === 'whatsapp-status' ? 66 : aspect === 'youtube-hd' ? 60 : 72;
      ctx.font = `900 ${headSize}px "Noto Sans Bengali", "Plus Jakarta Sans", sans-serif`;
      ctx.fillStyle = theme.text;
      curY = wrapCanvasText(
        ctx,
        headline.trim() || (isBn ? 'আপনার ব্যানার শিরোনাম' : 'YOUR OFFER HEADLINE'),
        contentX,
        curY + 20,
        contentMaxW,
        headSize * 1.24,
        3
      );

      // Subheadline
      if (subheadline.trim()) {
        const subSize = aspect === 'whatsapp-status' ? 34 : 32;
        ctx.font = `600 ${subSize}px "Noto Sans Bengali", "Plus Jakarta Sans", sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.88)';
        curY = wrapCanvasText(ctx, subheadline.trim(), contentX, curY + 28, contentMaxW, subSize * 1.38, 3);
      }

      // CTA Highlight Bar
      if (ctaLine.trim()) {
        curY += 32;
        ctx.font = '800 30px "Noto Sans Bengali", "Plus Jakarta Sans", sans-serif';
        const cw = ctx.measureText(ctaLine.trim()).width;
        ctx.fillStyle = theme.accent;
        ctx.beginPath();
        ctx.roundRect(contentX, curY - 32, Math.min(contentMaxW, cw + 52), 60, 14);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.fillText(ctaLine.trim(), contentX + 26, curY + 8);
      }

      // Bottom Shop Strip
      const footerH = 128;
      ctx.fillStyle = 'rgba(0,0,0,0.48)';
      ctx.fillRect(pad + 3, dims.h - pad - footerH, dims.w - (pad + 3) * 2, footerH - 3);
      ctx.fillStyle = theme.accent;
      ctx.fillRect(pad + 3, dims.h - pad - footerH, dims.w - (pad + 3) * 2, 4);

      ctx.font = '800 34px "Noto Sans Bengali", "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(shopName.trim() || 'YOUR SHOP / STUDIO NAME', contentX, dims.h - pad - 68);

      if (contactLine.trim()) {
        ctx.font = '600 24px "Noto Sans Bengali", "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = theme.accent;
        ctx.fillText(contactLine.trim(), contentX, dims.h - pad - 28);
      }

      setExportUrl(canvas.toDataURL('image/png'));
    };

    if (heroImgUrl) {
      const img = new Image();
      img.onload = () => drawBanner(img);
      img.onerror = () => drawBanner(null);
      img.src = heroImgUrl;
    } else {
      drawBanner(null);
    }
    return () => {
      cancelled = true;
    };
  }, [aspect, themeKey, badgeText, headline, subheadline, ctaLine, shopName, contactLine, heroImgUrl, dims.w, dims.h, theme, isBn]);

  return (
    <div className="space-y-6">
      <div className="bg-slate-950 text-white rounded-2xl p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
            <ImagePlus className="w-4 h-4" />
            <span>{isBn ? 'WhatsApp Status · Facebook অফার · YouTube থাম্বনেল (বাংলা ফন্ট + AI কপি)' : 'WhatsApp Status · Facebook Offer · YouTube Thumbnail · AI Bengali/English Copy'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-1">
            {isBn ? 'দোকানের অফার, উৎসব ও YouTube বাংলা ব্যানার মেকার' : 'Bengali & English Shop Offer, Status & Thumbnail Maker'}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
          {(Object.keys(ASPECT_CONFIG) as AspectId[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setAspect(id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                aspect === id ? 'bg-amber-400 text-slate-950' : 'text-slate-300'
              }`}
            >
              {ASPECT_CONFIG[id].label}
            </button>
          ))}
        </div>
      </div>

      {/* AI Copy Suggester */}
      <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <input
          value={aiIdea}
          onChange={(e) => setAiIdea(e.target.value)}
          placeholder={isBn ? 'AI আইডিয়া লিখুন (যেমন: লক্ষ্মীর ভাণ্ডার ও স্কলারশিপ ফর্ম ফিলাপ চলছে / দুর্গাপূজা ২০% ছাড়)' : 'Describe offer or greeting (e.g. WB Scholarship Apply Open / Puja 20% Off)...'}
          className="flex-1 rounded-xl border border-indigo-300 bg-white px-3.5 py-2.5 text-xs"
        />
        <select value={aiLang} onChange={(e) => setAiLang(e.target.value as 'bn' | 'en')} className="px-3 py-2.5 rounded-xl border border-indigo-300 bg-white text-xs font-bold">
          <option value="bn">বাংলা Copy</option>
          <option value="en">English Copy</option>
        </select>
        <button
          type="button"
          disabled={aiLoading}
          onClick={handleAiCopy}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-black inline-flex items-center justify-center gap-1.5 cursor-pointer"
        >
          {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          AI Write Banner
        </button>
      </div>
      {aiError && <p className="text-xs font-bold text-rose-600">{aiError}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Controls */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 space-y-3.5 h-fit">
          <div className="grid grid-cols-2 gap-1.5">
            {(Object.keys(BANNER_THEMES) as Array<keyof typeof BANNER_THEMES>).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setThemeKey(k)}
                className={`px-2.5 py-2 rounded-xl text-xs font-bold border text-left cursor-pointer ${
                  themeKey === k ? 'bg-slate-900 text-amber-300 border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                {BANNER_THEMES[k].name}
              </button>
            ))}
          </div>

          <input value={badgeText} onChange={(e) => setBadgeText(e.target.value)} placeholder="Top Ribbon Tag (e.g. সীমিত সময়ের অফার / ADMISSION OPEN)" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold" />
          <input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Main Bold Headline (Bengali or English)" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold" />
          <textarea rows={2} value={subheadline} onChange={(e) => setSubheadline(e.target.value)} placeholder="Supporting Offer Details / Dates" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs" />
          <input value={ctaLine} onChange={(e) => setCtaLine(e.target.value)} placeholder="Highlight Callout (e.g. আজই যোগাযোগ করুন · 20% OFF)" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold" />
          <input value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="Shop / Channel / Institute Name" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold" />
          <input value={contactLine} onChange={(e) => setContactLine(e.target.value)} placeholder="Phone / WhatsApp / Address" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs" />

          <div className="flex items-center gap-2">
            <label className="flex-1 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> {heroImgUrl ? 'Change Photo / Logo' : 'Add Photo / Logo'}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setHeroImgUrl(URL.createObjectURL(f)); }} />
            </label>
            <button
              type="button"
              onClick={() => { setBadgeText(''); setHeadline(''); setSubheadline(''); setCtaLine(''); setShopName(''); setContactLine(''); setHeroImgUrl(null); }}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Clear
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href={exportUrl || undefined}
              download={`banner-${aspect}.png`}
              className={`py-3 rounded-xl text-xs font-black inline-flex items-center justify-center gap-1.5 ${
                exportUrl ? 'bg-slate-900 hover:bg-slate-800 text-white' : 'bg-slate-200 text-slate-400 pointer-events-none'
              }`}
            >
              <Download className="w-4 h-4" /> Download HD PNG
            </a>
            <button
              type="button"
              disabled={!exportUrl}
              onClick={() => exportUrl && printImageOnA4(exportUrl, 'Shop Offer Banner')}
              className="py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print A4 Flyer
            </button>
          </div>
        </div>

        {/* Right Live HD Canvas Preview */}
        <div className="lg:col-span-7 bg-slate-100 rounded-2xl border border-slate-200 p-4 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-[600px] w-auto h-auto rounded-xl shadow-2xl border border-slate-300"
          />
        </div>
      </div>
    </div>
  );
};

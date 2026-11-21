import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  Printer,
  Download,
  Upload,
  Sparkles,
  RotateCcw,
  Move,
  Phone,
  Mail,
  MapPin,
  Globe,
  Trash2,
  Loader2,
  AlertCircle,
  Check,
  QrCode,
} from 'lucide-react';
import type { AppLang } from '../../data/i18n';
import { printImageOnA4 } from '../../utils/printHelper';

interface VisitingCardMakerProps {
  appLang: AppLang;
}

type CardTemplateId =
  | 'executive-navy'
  | 'obsidian-gold'
  | 'minimal-editorial'
  | 'emerald-corporate'
  | 'crimson-accent'
  | 'split-architect';

type FontStyleId = 'sans' | 'serif' | 'mono';

interface TemplatePreset {
  id: CardTemplateId;
  name: string;
  primaryColor: string;
  accentColor: string;
  surfaceColor: string;
  textColor: string;
  fontStyle: FontStyleId;
}

const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: 'executive-navy',
    name: 'Executive Navy',
    primaryColor: '#0f172a',
    accentColor: '#d97706',
    surfaceColor: '#ffffff',
    textColor: '#0f172a',
    fontStyle: 'sans',
  },
  {
    id: 'obsidian-gold',
    name: 'Obsidian Gold',
    primaryColor: '#090d16',
    accentColor: '#eab308',
    surfaceColor: '#111827',
    textColor: '#f8fafc',
    fontStyle: 'serif',
  },
  {
    id: 'minimal-editorial',
    name: 'Minimal Ivory',
    primaryColor: '#1e293b',
    accentColor: '#0284c7',
    surfaceColor: '#ffffff',
    textColor: '#0f172a',
    fontStyle: 'sans',
  },
  {
    id: 'emerald-corporate',
    name: 'Emerald Corp',
    primaryColor: '#064e3b',
    accentColor: '#10b981',
    surfaceColor: '#ffffff',
    textColor: '#064e3b',
    fontStyle: 'sans',
  },
  {
    id: 'crimson-accent',
    name: 'Crimson Heritage',
    primaryColor: '#7f1d1d',
    accentColor: '#dc2626',
    surfaceColor: '#ffffff',
    textColor: '#1e293b',
    fontStyle: 'serif',
  },
  {
    id: 'split-architect',
    name: 'Split Architect',
    primaryColor: '#1e1b4b',
    accentColor: '#f59e0b',
    surfaceColor: '#ffffff',
    textColor: '#0f172a',
    fontStyle: 'sans',
  },
];

const AI_QUICK_PROMPTS = [
  'Luxury dark obsidian & gold card for a Chartered Accountant firm, logo top right',
  'Clean corporate navy & silver visiting card for a Digital Seva & CSC center',
  'Modern medical clinic visiting card in deep emerald and crisp white',
  'Bold minimalist architecture & real estate card with split left brand panel',
];

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function isDarkHex(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return lum < 0.52;
}

function removeWhiteBgFromLogo(srcDataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext('2d');
      if (!ctx) return resolve(srcDataUrl);
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, c.width, c.height);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] > 235 && d[i + 1] > 235 && d[i + 2] > 235) {
          d[i + 3] = 0;
        }
      }
      ctx.putImageData(imgData, 0, 0);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = () => resolve(srcDataUrl);
    img.src = srcDataUrl;
  });
}

export const VisitingCardMaker: React.FC<VisitingCardMakerProps> = ({ appLang }) => {
  const isBn = appLang === 'bn';

  // Core Visiting Card Details (STRICTLY EMPTY initially)
  const [personName, setPersonName] = useState('');
  const [designation, setDesignation] = useState('');
  const [orgName, setOrgName] = useState('');
  const [tagline, setTagline] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');

  // Template & Styling State
  const [template, setTemplate] = useState<CardTemplateId>('executive-navy');
  const [primaryColor, setPrimaryColor] = useState('#0f172a');
  const [accentColor, setAccentColor] = useState('#d97706');
  const [surfaceColor, setSurfaceColor] = useState('#ffffff');
  const [textColor, setTextColor] = useState('#0f172a');
  const [fontStyle, setFontStyle] = useState<FontStyleId>('sans');
  const [showQrCode, setShowQrCode] = useState<boolean>(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Free-Placement Logo State (Drag anywhere on the card!)
  const [rawLogoUrl, setRawLogoUrl] = useState<string | null>(null);
  const [cleanLogoUrl, setCleanLogoUrl] = useState<string | null>(null);
  const [removeLogoWhiteBg, setRemoveLogoWhiteBg] = useState<boolean>(false);
  const [logoX, setLogoX] = useState<number>(80); // percentage 0..100
  const [logoY, setLogoY] = useState<number>(22); // percentage 0..100
  const [logoSize, setLogoSize] = useState<number>(64); // px on preview
  const [logoShape, setLogoShape] = useState<'free' | 'rounded' | 'circle'>('free');
  const [logoWhitePlate, setLogoWhitePlate] = useState<boolean>(false);

  // AI Customization State (prompt starts empty)
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string>('');
  const [aiNote, setAiNote] = useState<string>('');

  const [exporting, setExporting] = useState<boolean>(false);

  const cardStageRef = useRef<HTMLDivElement | null>(null);
  const draggingLogoRef = useRef<boolean>(false);

  const activeLogoUrl = removeLogoWhiteBg && cleanLogoUrl ? cleanLogoUrl : rawLogoUrl;

  // Generate live vCard QR code when toggled on
  useEffect(() => {
    if (!showQrCode) {
      setQrDataUrl('');
      return;
    }
    const vcardLines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      personName.trim() ? `FN:${personName.trim()}` : 'FN:Contact',
      orgName.trim() ? `ORG:${orgName.trim()}` : '',
      designation.trim() ? `TITLE:${designation.trim()}` : '',
      mobile.trim() ? `TEL;TYPE=CELL:${mobile.trim()}` : '',
      email.trim() ? `EMAIL:${email.trim()}` : '',
      website.trim() ? `URL:${website.trim()}` : '',
      address.trim() ? `ADR:;;${address.trim()};;;;` : '',
      'END:VCARD',
    ]
      .filter(Boolean)
      .join('\n');

    QRCode.toDataURL(vcardLines, {
      width: 240,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''));
  }, [showQrCode, personName, orgName, designation, mobile, email, website, address]);

  const applyTemplatePreset = (preset: TemplatePreset) => {
    setTemplate(preset.id);
    setPrimaryColor(preset.primaryColor);
    setAccentColor(preset.accentColor);
    setSurfaceColor(preset.surfaceColor);
    setTextColor(preset.textColor);
    setFontStyle(preset.fontStyle);
    if (preset.id === 'split-architect') {
      setLogoX(19);
      setLogoY(32);
    } else {
      setLogoX(82);
      setLogoY(22);
    }
  };

  const handleLogoUpload = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        setRawLogoUrl(reader.result);
        const cleaned = await removeWhiteBgFromLogo(reader.result);
        setCleanLogoUrl(cleaned);
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag logo anywhere inside the visiting card preview
  const updateLogoPositionFromPointer = (clientX: number, clientY: number) => {
    const box = cardStageRef.current?.getBoundingClientRect();
    if (!box || box.width <= 0 || box.height <= 0) return;
    const pctX = ((clientX - box.left) / box.width) * 100;
    const pctY = ((clientY - box.top) / box.height) * 100;
    setLogoX(Math.max(5, Math.min(95, Math.round(pctX))));
    setLogoY(Math.max(8, Math.min(92, Math.round(pctY))));
  };

  const handleLogoPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingLogoRef.current = true;
    updateLogoPositionFromPointer(e.clientX, e.clientY);
  };

  const handleLogoPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingLogoRef.current) return;
    updateLogoPositionFromPointer(e.clientX, e.clientY);
  };

  const handleLogoPointerUp = () => {
    draggingLogoRef.current = false;
  };

  // AI Design Customization via Server-Side Gemini API
  const handleAiCustomize = async (promptOverride?: string) => {
    const promptText = (promptOverride ?? aiPrompt).trim();
    if (!promptText) {
      setAiError(
        isBn
          ? 'আপনার ভিজিটিং কার্ড কেমন ডিজাইন চান তা সংক্ষেপে লিখুন।'
          : 'Please describe the style or industry for your visiting card.'
      );
      return;
    }
    if (promptOverride) setAiPrompt(promptOverride);

    setAiLoading(true);
    setAiError('');
    setAiNote('');

    try {
      const resp = await fetch('/api/ai/visiting-card-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          orgName: orgName.trim(),
          personName: personName.trim(),
          designation: designation.trim(),
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data?.style) {
        throw new Error(data?.error || 'AI styling request failed');
      }

      const s = data.style;
      const validTemplates: CardTemplateId[] = [
        'executive-navy',
        'obsidian-gold',
        'minimal-editorial',
        'emerald-corporate',
        'crimson-accent',
        'split-architect',
      ];
      if (validTemplates.includes(s.template)) setTemplate(s.template);
      if (typeof s.primaryColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(s.primaryColor)) {
        setPrimaryColor(s.primaryColor);
      }
      if (typeof s.accentColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(s.accentColor)) {
        setAccentColor(s.accentColor);
      }
      if (typeof s.surfaceColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(s.surfaceColor)) {
        setSurfaceColor(s.surfaceColor);
      }
      if (typeof s.textColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(s.textColor)) {
        setTextColor(s.textColor);
      }
      if (s.fontStyle === 'sans' || s.fontStyle === 'serif' || s.fontStyle === 'mono') {
        setFontStyle(s.fontStyle);
      }
      if (typeof s.tagline === 'string' && s.tagline.trim() && !tagline.trim()) {
        setTagline(s.tagline.trim());
      }
      if (typeof s.logoX === 'number' && Number.isFinite(s.logoX)) {
        setLogoX(Math.max(8, Math.min(90, Math.round(s.logoX))));
      }
      if (typeof s.logoY === 'number' && Number.isFinite(s.logoY)) {
        setLogoY(Math.max(12, Math.min(86, Math.round(s.logoY))));
      }
      if (typeof s.logoSize === 'number' && Number.isFinite(s.logoSize)) {
        setLogoSize(Math.max(42, Math.min(96, Math.round(s.logoSize))));
      }
      if (typeof s.designNote === 'string') {
        setAiNote(s.designNote);
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Failed to customize with AI');
    } finally {
      setAiLoading(false);
    }
  };

  // High-DPI 300-DPI Canvas Renderer (1050 x 600 px = exact 3.5 x 2 inch Indian/Standard Visiting Card)
  const renderCardToCanvas = async (): Promise<HTMLCanvasElement> => {
    const W = 1050;
    const H = 600;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    const fontStack =
      fontStyle === 'serif'
        ? 'Georgia, "Times New Roman", serif'
        : fontStyle === 'mono'
        ? '"JetBrains Mono", ui-monospace, monospace'
        : '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif';

    const darkBg = isDarkHex(surfaceColor);
    const mutedText = darkBg ? 'rgba(241, 245, 249, 0.78)' : 'rgba(51, 65, 85, 0.84)';

    // Base Card Surface
    ctx.fillStyle = surfaceColor;
    ctx.fillRect(0, 0, W, H);

    // Template-Specific Official Architectural Geometry
    if (template === 'executive-navy') {
      ctx.fillStyle = primaryColor;
      ctx.fillRect(0, 0, W, 152);
      ctx.fillStyle = accentColor;
      ctx.fillRect(0, 152, W, 8);
      ctx.fillRect(0, H - 18, W, 18);
    } else if (template === 'obsidian-gold') {
      ctx.fillStyle = primaryColor;
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 5;
      ctx.strokeRect(24, 24, W - 48, H - 48);
      ctx.fillStyle = accentColor;
      ctx.fillRect(58, 224, 150, 5);
    } else if (template === 'minimal-editorial') {
      ctx.fillStyle = primaryColor;
      ctx.fillRect(0, 0, W, 16);
      ctx.fillStyle = accentColor;
      ctx.fillRect(62, 248, 120, 6);
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.14)';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, W - 2, H - 2);
    } else if (template === 'emerald-corporate') {
      ctx.fillStyle = primaryColor;
      ctx.beginPath();
      ctx.moveTo(W - 310, 0);
      ctx.lineTo(W, 0);
      ctx.lineTo(W, H);
      ctx.lineTo(W - 220, H);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = accentColor;
      ctx.fillRect(0, 0, W, 14);
      ctx.fillRect(60, 244, 130, 5);
    } else if (template === 'crimson-accent') {
      ctx.fillStyle = primaryColor;
      ctx.fillRect(0, 0, W, 22);
      ctx.fillStyle = accentColor;
      ctx.fillRect(0, 22, W, 6);
      ctx.fillStyle = primaryColor;
      ctx.fillRect(0, H - 56, W, 56);
    } else if (template === 'split-architect') {
      const splitW = Math.round(W * 0.37);
      ctx.fillStyle = primaryColor;
      ctx.fillRect(0, 0, splitW, H);
      ctx.fillStyle = accentColor;
      ctx.fillRect(splitW, 0, 10, H);
    }

    const isSplit = template === 'split-architect';
    const isExecHeader = template === 'executive-navy';
    const isObsidian = template === 'obsidian-gold';
    const contentX = isSplit ? Math.round(W * 0.37) + 54 : 62;
    const maxTextW = isSplit ? W - contentX - 48 : template === 'emerald-corporate' ? W - 360 : W - 180;

    // Organization Name & Tagline
    const displayOrg = orgName.trim() || 'ORGANIZATION NAME';
    const displayTag = tagline.trim();
    const displayPerson = personName.trim() || 'YOUR FULL NAME';
    const displayRole = designation.trim();

    if (isSplit) {
      // Org name on left dark brand panel bottom area
      ctx.fillStyle = '#ffffff';
      ctx.font = `900 32px ${fontStack}`;
      ctx.textAlign = 'center';
      ctx.fillText(displayOrg.slice(0, 22), Math.round((W * 0.37) / 2), H - 150, W * 0.32);
      if (displayTag) {
        ctx.fillStyle = accentColor;
        ctx.font = `700 18px ${fontStack}`;
        ctx.fillText(displayTag.slice(0, 36), Math.round((W * 0.37) / 2), H - 114, W * 0.32);
      }
      ctx.textAlign = 'left';
    } else if (isExecHeader) {
      ctx.fillStyle = '#ffffff';
      ctx.font = `900 38px ${fontStack}`;
      ctx.fillText(displayOrg, 62, 78, W - 260);
      if (displayTag) {
        ctx.fillStyle = accentColor;
        ctx.font = `700 20px ${fontStack}`;
        ctx.fillText(displayTag, 62, 118, W - 260);
      }
    } else {
      ctx.fillStyle = isObsidian ? accentColor : primaryColor;
      ctx.font = `900 32px ${fontStack}`;
      ctx.fillText(displayOrg, contentX, 94, maxTextW);
      if (displayTag) {
        ctx.fillStyle = mutedText;
        ctx.font = `600 18px ${fontStack}`;
        ctx.fillText(displayTag, contentX, 128, maxTextW);
      }
    }

    // Person Name & Designation
    const nameY = isSplit ? 132 : isExecHeader ? 236 : 204;
    ctx.fillStyle = isObsidian ? '#ffffff' : textColor;
    ctx.font = `900 44px ${fontStack}`;
    ctx.fillText(displayPerson, contentX, nameY, maxTextW);

    if (displayRole) {
      ctx.fillStyle = isObsidian ? accentColor : primaryColor;
      ctx.font = `700 23px ${fontStack}`;
      ctx.fillText(displayRole, contentX, nameY + 38, maxTextW);
    }

    // Contact Details Rows (Mobile, Email, Website, Address)
    const contactStartY = isSplit ? 255 : isExecHeader ? 336 : 316;
    const contactLines: { prefix: string; val: string }[] = [];
    if (mobile.trim()) contactLines.push({ prefix: 'M:', val: mobile.trim() });
    if (email.trim()) contactLines.push({ prefix: 'E:', val: email.trim() });
    if (website.trim()) contactLines.push({ prefix: 'W:', val: website.trim() });
    if (address.trim()) contactLines.push({ prefix: 'A:', val: address.trim() });
    if (contactLines.length === 0) {
      contactLines.push(
        { prefix: 'M:', val: '+91 00000 00000' },
        { prefix: 'E:', val: 'email@organization.com' },
        { prefix: 'A:', val: 'Office Address, City, PIN' }
      );
    }

    let cy = contactStartY;
    ctx.font = `600 22px ${fontStack}`;
    for (const row of contactLines) {
      ctx.fillStyle = accentColor;
      ctx.font = `900 21px ${fontStack}`;
      ctx.fillText(row.prefix, contentX, cy);
      ctx.fillStyle = isObsidian ? '#e2e8f0' : textColor;
      ctx.font = `600 21px ${fontStack}`;

      // Simple word wrap for long address
      const words = row.val.split(/\s+/);
      let line = '';
      const lineMax = maxTextW - 44;
      for (let i = 0; i < words.length; i++) {
        const test = line ? `${line} ${words[i]}` : words[i];
        if (ctx.measureText(test).width > lineMax && line) {
          ctx.fillText(line, contentX + 42, cy, lineMax);
          cy += 30;
          line = words[i];
        } else {
          line = test;
        }
      }
      if (line) {
        ctx.fillText(line, contentX + 42, cy, lineMax);
      }
      cy += 42;
    }

    // Crimson footer website/org strip
    if (template === 'crimson-accent') {
      ctx.fillStyle = '#ffffff';
      ctx.font = `700 18px ${fontStack}`;
      ctx.fillText(
        website.trim() || email.trim() || displayOrg,
        62,
        H - 22,
        W - 124
      );
    }

    // Optional vCard QR Code at bottom-right
    if (showQrCode && qrDataUrl) {
      await new Promise<void>((resolve) => {
        const qImg = new Image();
        qImg.onload = () => {
          const qSize = 126;
          const qx = W - qSize - 38;
          const qy = H - qSize - (template === 'crimson-accent' ? 68 : 34);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(qx - 6, qy - 6, qSize + 12, qSize + 12);
          ctx.drawImage(qImg, qx, qy, qSize, qSize);
          resolve();
        };
        qImg.onerror = () => resolve();
        qImg.src = qrDataUrl;
      });
    }

    // Free-Positioned Logo at exact (logoX%, logoY%)
    if (activeLogoUrl) {
      await new Promise<void>((resolve) => {
        const lImg = new Image();
        lImg.onload = () => {
          const scaleFactor = W / 540; // maps preview px onto 1050px high-res canvas
          const targetBox = logoSize * scaleFactor;
          const ratio = Math.min(targetBox / lImg.naturalWidth, targetBox / lImg.naturalHeight);
          const dw = lImg.naturalWidth * ratio;
          const dh = lImg.naturalHeight * ratio;
          const cx = (logoX / 100) * W;
          const cyPos = (logoY / 100) * H;
          const dx = cx - dw / 2;
          const dy = cyPos - dh / 2;

          ctx.save();
          if (logoWhitePlate) {
            ctx.fillStyle = '#ffffff';
            const pad = 12;
            if (logoShape === 'circle') {
              const r = Math.max(dw, dh) / 2 + pad;
              ctx.beginPath();
              ctx.arc(cx, cyPos, r, 0, Math.PI * 2);
              ctx.fill();
            } else {
              ctx.fillRect(dx - pad, dy - pad, dw + pad * 2, dh + pad * 2);
            }
          }

          if (logoShape === 'circle') {
            const r = Math.min(dw, dh) / 2;
            ctx.beginPath();
            ctx.arc(cx, cyPos, r, 0, Math.PI * 2);
            ctx.clip();
          } else if (logoShape === 'rounded') {
            const rad = 16;
            ctx.beginPath();
            ctx.roundRect(dx, dy, dw, dh, rad);
            ctx.clip();
          }

          ctx.drawImage(lImg, dx, dy, dw, dh);
          ctx.restore();
          resolve();
        };
        lImg.onerror = () => resolve();
        lImg.src = activeLogoUrl;
      });
    }

    return canvas;
  };

  const handleDownloadSinglePng = async () => {
    setExporting(true);
    try {
      const cardCanvas = await renderCardToCanvas();
      const url = cardCanvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(orgName.trim() || personName.trim() || 'visiting-card')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')}-300dpi.png`;
      a.click();
    } finally {
      setExporting(false);
    }
  };

  // Generate exact 10-Card A4 Sheet (2 columns x 5 rows of 89x51 mm visiting cards with cut marks)
  const handlePrint10UpA4 = async () => {
    setExporting(true);
    try {
      const cardCanvas = await renderCardToCanvas();
      // A4 @ 300 DPI = 2480 x 3508 px
      const sheet = document.createElement('canvas');
      sheet.width = 2480;
      sheet.height = 3508;
      const ctx = sheet.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, sheet.width, sheet.height);

      const cardW = 1051; // 89mm @ 300dpi
      const cardH = 602; // 51mm @ 300dpi
      const gapX = 48;
      const gapY = 48;
      const totalGridW = cardW * 2 + gapX;
      const totalGridH = cardH * 5 + gapY * 4;
      const startX = Math.round((sheet.width - totalGridW) / 2);
      const startY = Math.round((sheet.height - totalGridH) / 2);

      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 2; col++) {
          const x = startX + col * (cardW + gapX);
          const y = startY + row * (cardH + gapY);
          ctx.drawImage(cardCanvas, x, y, cardW, cardH);

          // Crisp subtle cut outline
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, cardW, cardH);
        }
      }

      const dataUrl = sheet.toDataURL('image/png');
      printImageOnA4(
        dataUrl,
        `${orgName.trim() || personName.trim() || 'Visiting Card'} - 10 Cards A4 Sheet`,
        'A4'
      );
    } finally {
      setExporting(false);
    }
  };

  const handleResetAll = () => {
    setPersonName('');
    setDesignation('');
    setOrgName('');
    setTagline('');
    setMobile('');
    setEmail('');
    setWebsite('');
    setAddress('');
    setRawLogoUrl(null);
    setCleanLogoUrl(null);
    setAiPrompt('');
    setAiNote('');
    setAiError('');
    applyTemplatePreset(TEMPLATE_PRESETS[0]);
  };

  const cardFontClass =
    fontStyle === 'serif' ? 'font-serif' : fontStyle === 'mono' ? 'font-mono' : 'font-sans';
  const isObsidian = template === 'obsidian-gold';
  const isSplit = template === 'split-architect';
  const isExecHeader = template === 'executive-navy';
  const darkSurface = isDarkHex(surfaceColor);

  return (
    <div className="space-y-6">
      {/* Top Studio Header */}
      <div className="bg-slate-950 text-white border-2 border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div>
          <h2 className="text-base sm:text-xl font-black text-white">
            {isBn
              ? 'প্রফেশনাল ভিজিটিং কার্ড স্টুডিও (AI কাস্টমাইজেশন ও ফ্রি লোগো প্লেসমেন্ট)'
              : 'Official Visiting Card Studio (Templates + Free Logo Drag + AI Designer)'}
          </h2>
          <p className="text-xs text-slate-300 font-medium mt-0.5">
            {isBn
              ? 'নাম, প্রতিষ্ঠান, মোবাইল, ইমেইল, ঠিকানা ও লোগো (ড্র্যাগ করে কার্ডের যেকোনো জায়গায় বসান) দিয়ে ৩০০ DPI কার্ড বা ১০-কার্ড A4 শিট প্রিন্ট করুন।'
              : 'Create executive 3.5×2" visiting cards with draggable free-position logo, vCard QR code, AI style generator, 300-DPI PNG export & 10-card A4 print sheet.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleResetAll}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isBn ? 'রিসেট' : 'Reset'}</span>
          </button>
          <button
            type="button"
            disabled={exporting}
            onClick={handleDownloadSinglePng}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isBn ? 'PNG ডাউনলোড (300 DPI)' : 'Download PNG (300 DPI)'}</span>
          </button>
          <button
            type="button"
            disabled={exporting}
            onClick={handlePrint10UpA4}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-black cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{isBn ? '১০টি কার্ড A4 শিট প্রিন্ট' : 'Print 10-Card A4 Sheet'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT WORKBENCH: Details + Logo Placement + AI Customizer */}
        <div className="xl:col-span-5 space-y-5">
          {/* AI Design Customizer Panel */}
          <div className="bg-slate-950 text-white border-2 border-amber-400/70 rounded-2xl p-4 sm:p-5 space-y-3 shadow-md">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-amber-300">
                <Sparkles className="w-4 h-4" />
                <span>
                  {isBn ? 'AI দিয়ে কার্ড ডিজাইন ও কাস্টমাইজ করুন' : 'Customize Card Style with AI'}
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-400">
                Layout · Colors · Tagline
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAiCustomize();
                }}
                placeholder={
                  isBn
                    ? 'লিখুন যেমন: "ডার্ক গোল্ডেন ল ফার্ম ডিজাইন, লোগো উপরে ডানে"...'
                    : 'e.g. "Royal navy corporate card for CSC center, gold accent"...'
                }
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                disabled={aiLoading}
                onClick={() => handleAiCustomize()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 text-xs font-black cursor-pointer shrink-0 whitespace-nowrap"
              >
                {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{aiLoading ? 'Designing...' : isBn ? 'AI ডিজাইন' : 'Apply AI'}</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {AI_QUICK_PROMPTS.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={aiLoading}
                  onClick={() => handleAiCustomize(q)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-semibold text-slate-300 hover:text-amber-300 transition-colors cursor-pointer text-left"
                >
                  {q.slice(0, 42)}…
                </button>
              ))}
            </div>

            {aiError && (
              <div className="p-2.5 rounded-lg bg-rose-950/90 border border-rose-500 text-rose-200 text-xs font-bold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{aiError}</span>
              </div>
            )}
            {aiNote && (
              <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs font-semibold flex items-start gap-2">
                <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <span>{aiNote}</span>
              </div>
            )}
          </div>

          {/* Core Card Details Form (All Empty Initially) */}
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
            <div className="text-xs font-black text-slate-950 dark:text-amber-300">
              {isBn ? '১. ভিজিটিং কার্ডের তথ্য লিখুন' : '1. Official Visiting Card Details'}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder={isBn ? '১. পূর্ণ নাম (Name)' : '1. Full Name'}
                className="px-3 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-950 dark:text-white text-xs font-bold"
              />
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder={isBn ? 'পদবি (যেমন: Proprietor / Director)' : 'Designation / Title'}
                className="px-3 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-950 dark:text-white text-xs font-semibold"
              />
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder={isBn ? '২. প্রতিষ্ঠানের নাম (Organisation)' : '2. Organization / Company Name'}
                className="px-3 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-950 dark:text-white text-xs font-bold"
              />
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder={isBn ? 'ট্যাগলাইন / সার্ভিস (ঐচ্ছিক)' : 'Tagline / Subtitle (Optional)'}
                className="px-3 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-950 dark:text-white text-xs font-semibold"
              />
              <input
                type="text"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder={isBn ? '৩. মোবাইল নম্বর (Mobile)' : '3. Mobile Number'}
                className="px-3 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-950 dark:text-white text-xs font-mono font-bold"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isBn ? '৩. ইমেইল আইডি (Email)' : '3. Email Address'}
                className="px-3 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-950 dark:text-white text-xs font-semibold"
              />
            </div>

            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder={isBn ? 'ওয়েবসাইট (ঐচ্ছিক)' : 'Website / Portfolio URL (Optional)'}
              className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-950 dark:text-white text-xs font-semibold"
            />
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={isBn ? '৪. অফিস বা দোকানের সম্পূর্ণ ঠিকানা (Address)' : '4. Full Office / Shop Address'}
              className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-950 dark:text-white text-xs font-semibold"
            />

            {/* Logo Upload & Free-Position Controls */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-950 dark:text-amber-300">
                  {isBn ? '৫. লোগো আপলোড ও যেকোনো জায়গায় বসান' : '5. Logo Upload & Free Positioning'}
                </span>
                {activeLogoUrl && (
                  <span className="text-[11px] font-mono font-bold text-sky-600 dark:text-sky-400">
                    X:{logoX}% · Y:{logoY}%
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <label className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border-2 border-dashed border-slate-400 dark:border-slate-600 hover:border-slate-950 dark:hover:border-amber-400 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>{activeLogoUrl ? 'Replace Logo Image' : 'Upload Logo (PNG / JPG / SVG)'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleLogoUpload(e.target.files?.[0])}
                    className="hidden"
                  />
                </label>
                {activeLogoUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setRawLogoUrl(null);
                      setCleanLogoUrl(null);
                    }}
                    className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 cursor-pointer"
                    aria-label="Remove logo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {activeLogoUrl && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                    <Move className="w-3.5 h-3.5" />
                    <span>
                      {isBn
                        ? 'প্রিভিউ কার্ডের উপর লোগো মাউস/আঙুল দিয়ে টেনে যেকোনো জায়গায় বসান!'
                        : 'Drag the logo directly on the card preview to place it anywhere!'}
                    </span>
                  </div>

                  {/* Quick Snap Positions */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: 'Top-Left', x: 14, y: 20 },
                      { label: 'Top-Right', x: 84, y: 20 },
                      { label: 'Center-Left', x: 18, y: 48 },
                      { label: 'Bottom-Right', x: 84, y: 80 },
                    ].map((snap) => (
                      <button
                        key={snap.label}
                        type="button"
                        onClick={() => {
                          setLogoX(snap.x);
                          setLogoY(snap.y);
                        }}
                        className="px-2 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-[11px] font-bold cursor-pointer hover:border-slate-950"
                      >
                        {snap.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <label className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                        X: {logoX}%
                      </span>
                      <input
                        type="range"
                        min={5}
                        max={95}
                        value={logoX}
                        onChange={(e) => setLogoX(Number(e.target.value))}
                        className="w-full accent-slate-950 dark:accent-amber-400"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                        Y: {logoY}%
                      </span>
                      <input
                        type="range"
                        min={8}
                        max={92}
                        value={logoY}
                        onChange={(e) => setLogoY(Number(e.target.value))}
                        className="w-full accent-slate-950 dark:accent-amber-400"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                        Size: {logoSize}px
                      </span>
                      <input
                        type="range"
                        min={32}
                        max={120}
                        value={logoSize}
                        onChange={(e) => setLogoSize(Number(e.target.value))}
                        className="w-full accent-slate-950 dark:accent-amber-400"
                      />
                    </label>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <label className="inline-flex items-center gap-1.5 text-[11px] font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={removeLogoWhiteBg}
                        onChange={(e) => setRemoveLogoWhiteBg(e.target.checked)}
                        className="accent-slate-950 dark:accent-amber-400"
                      />
                      <span>Remove White BG</span>
                    </label>
                    <label className="inline-flex items-center gap-1.5 text-[11px] font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={logoWhitePlate}
                        onChange={(e) => setLogoWhitePlate(e.target.checked)}
                        className="accent-slate-950 dark:accent-amber-400"
                      />
                      <span>White Plate</span>
                    </label>
                    <select
                      value={logoShape}
                      onChange={(e) => setLogoShape(e.target.value as typeof logoShape)}
                      className="ml-auto px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-bold"
                    >
                      <option value="free">Original Shape</option>
                      <option value="rounded">Rounded</option>
                      <option value="circle">Circle</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PREVIEW STAGE + TEMPLATES & MANUAL COLOR TUNING */}
        <div className="xl:col-span-7 space-y-5">
          {/* Interactive Matte Dark Drafting Stage with Live 3.5×2" Card */}
          <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl p-5 sm:p-8 flex flex-col items-center justify-center gap-4 shadow-lg">
            <div className="w-full flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 font-mono">
              <span>STANDARD BUSINESS CARD · 3.5 × 2.0 in (89 × 51 mm)</span>
              <label className="inline-flex items-center gap-1.5 font-sans font-bold text-amber-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showQrCode}
                  onChange={(e) => setShowQrCode(e.target.checked)}
                  className="accent-amber-400"
                />
                <QrCode className="w-3.5 h-3.5" />
                <span>{isBn ? 'vCard QR কোড দেখান' : 'Include Contact QR'}</span>
              </label>
            </div>

            {/* Live Visiting Card Preview (Exact 7:4 / 3.5:2 Aspect Ratio) */}
            <div
              ref={cardStageRef}
              className={`relative w-full max-w-[560px] aspect-[7/4] rounded-xl overflow-hidden shadow-2xl select-none ${cardFontClass}`}
              style={{
                backgroundColor: isObsidian ? primaryColor : surfaceColor,
                color: isObsidian ? '#ffffff' : textColor,
              }}
            >
              {/* Template Decorative Layers */}
              {isExecHeader && (
                <>
                  <div
                    className="absolute top-0 left-0 right-0 h-[25.5%] px-7 flex flex-col justify-center"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <div className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight truncate pr-16">
                      {orgName.trim() || 'ORGANIZATION NAME'}
                    </div>
                    {tagline.trim() && (
                      <div
                        className="text-[11px] font-bold truncate pr-16 mt-0.5"
                        style={{ color: accentColor }}
                      >
                        {tagline.trim()}
                      </div>
                    )}
                  </div>
                  <div
                    className="absolute left-0 right-0 h-1.5"
                    style={{ top: '25.5%', backgroundColor: accentColor }}
                  />
                  <div
                    className="absolute bottom-0 left-0 right-0 h-2.5"
                    style={{ backgroundColor: accentColor }}
                  />
                </>
              )}

              {isObsidian && (
                <div
                  className="absolute inset-3 border-2 pointer-events-none"
                  style={{ borderColor: accentColor }}
                />
              )}

              {template === 'minimal-editorial' && (
                <div
                  className="absolute top-0 left-0 right-0 h-2"
                  style={{ backgroundColor: primaryColor }}
                />
              )}

              {template === 'emerald-corporate' && (
                <>
                  <div
                    className="absolute top-0 left-0 right-0 h-2"
                    style={{ backgroundColor: accentColor }}
                  />
                  <div
                    className="absolute top-0 right-0 bottom-0 w-[28%]"
                    style={{
                      backgroundColor: primaryColor,
                      clipPath: 'polygon(22% 0, 100% 0, 100% 100%, 0 100%)',
                    }}
                  />
                </>
              )}

              {template === 'crimson-accent' && (
                <>
                  <div
                    className="absolute top-0 left-0 right-0 h-3"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <div
                    className="absolute top-3 left-0 right-0 h-1"
                    style={{ backgroundColor: accentColor }}
                  />
                  <div
                    className="absolute bottom-0 left-0 right-0 h-8 px-7 flex items-center text-[10px] font-bold text-white truncate"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {website.trim() || email.trim() || orgName.trim() || 'ORGANIZATION NAME'}
                  </div>
                </>
              )}

              {isSplit && (
                <>
                  <div
                    className="absolute top-0 bottom-0 left-0 w-[37%] flex flex-col justify-end items-center text-center px-4 pb-8"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <div className="text-sm sm:text-base font-black text-white leading-tight break-words">
                      {orgName.trim() || 'ORGANIZATION NAME'}
                    </div>
                    {tagline.trim() && (
                      <div
                        className="text-[10px] font-bold mt-1 leading-snug"
                        style={{ color: accentColor }}
                      >
                        {tagline.trim()}
                      </div>
                    )}
                  </div>
                  <div
                    className="absolute top-0 bottom-0 w-1.5"
                    style={{ left: '37%', backgroundColor: accentColor }}
                  />
                </>
              )}

              {/* Foreground Typography & Contact Block */}
              <div
                className={`relative z-10 h-full flex flex-col justify-between ${
                  isSplit
                    ? 'pl-[42%] pr-6 py-7'
                    : isExecHeader
                    ? 'px-7 pt-[30%] pb-6'
                    : template === 'crimson-accent'
                    ? 'px-7 pt-7 pb-11'
                    : template === 'emerald-corporate'
                    ? 'pl-7 pr-[31%] py-7'
                    : 'px-8 py-7'
                }`}
              >
                {/* Header for non-split & non-exec templates */}
                {!isSplit && !isExecHeader && (
                  <div className="pr-16">
                    <div
                      className="text-sm sm:text-base font-black tracking-tight leading-tight truncate"
                      style={{ color: isObsidian ? accentColor : primaryColor }}
                    >
                      {orgName.trim() || 'ORGANIZATION NAME'}
                    </div>
                    {tagline.trim() && (
                      <div
                        className="text-[10px] font-semibold truncate mt-0.5"
                        style={{ color: darkSurface ? '#cbd5e1' : '#64748b' }}
                      >
                        {tagline.trim()}
                      </div>
                    )}
                  </div>
                )}

                {/* Person Name & Role */}
                <div>
                  <div className="text-lg sm:text-2xl font-black leading-tight tracking-tight truncate">
                    {personName.trim() || 'YOUR FULL NAME'}
                  </div>
                  {designation.trim() && (
                    <div
                      className="text-xs font-bold mt-0.5 truncate"
                      style={{ color: isObsidian ? accentColor : primaryColor }}
                    >
                      {designation.trim()}
                    </div>
                  )}
                  <div
                    className="w-16 h-0.5 mt-2 rounded-full"
                    style={{ backgroundColor: accentColor }}
                  />
                </div>

                {/* Contact Block */}
                <div className="space-y-1 text-[11px] sm:text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} />
                    <span className="tabular-nums truncate">
                      {mobile.trim() || '+91 00000 00000'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} />
                    <span className="truncate">{email.trim() || 'email@organization.com'}</span>
                  </div>
                  {website.trim() && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} />
                      <span className="truncate">{website.trim()}</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <MapPin
                      className="w-3.5 h-3.5 shrink-0 mt-0.5"
                      style={{ color: accentColor }}
                    />
                    <span className="leading-snug line-clamp-2">
                      {address.trim() || 'Office Address, Street, City, PIN'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Optional Contact QR Overlay */}
              {showQrCode && qrDataUrl && (
                <div
                  className={`absolute z-20 right-4 bg-white p-1 rounded shadow-md ${
                    template === 'crimson-accent' ? 'bottom-10' : 'bottom-4'
                  }`}
                >
                  <img src={qrDataUrl} alt="Contact vCard QR" className="w-14 h-14 block" />
                </div>
              )}

              {/* FREE DRAGGABLE LOGO ELEMENT */}
              {activeLogoUrl && (
                <div
                  onPointerDown={handleLogoPointerDown}
                  onPointerMove={handleLogoPointerMove}
                  onPointerUp={handleLogoPointerUp}
                  onPointerCancel={handleLogoPointerUp}
                  title="Drag to move logo anywhere on card"
                  className={`absolute z-30 -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing ring-2 ring-transparent hover:ring-amber-400 transition-shadow ${
                    logoWhitePlate ? 'bg-white p-1.5 shadow-sm' : ''
                  } ${
                    logoShape === 'circle'
                      ? 'rounded-full overflow-hidden'
                      : logoShape === 'rounded'
                      ? 'rounded-lg overflow-hidden'
                      : ''
                  }`}
                  style={{
                    left: `${logoX}%`,
                    top: `${logoY}%`,
                    touchAction: 'none',
                  }}
                >
                  <img
                    src={activeLogoUrl}
                    alt="Organization Logo"
                    draggable={false}
                    style={{
                      maxWidth: `${logoSize}px`,
                      maxHeight: `${logoSize}px`,
                    }}
                    className="object-contain block pointer-events-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Template Picker & Manual Color/Typography Controls */}
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="space-y-2">
              <div className="text-xs font-black text-slate-950 dark:text-amber-300">
                {isBn ? 'অফিশিয়াল টেমপ্লেট বাছাই করুন (৬টি ডিজাইন)' : 'Official Card Templates (6 Layouts)'}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TEMPLATE_PRESETS.map((preset) => {
                  const active = template === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyTemplatePreset(preset)}
                      className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                        active
                          ? 'bg-slate-950 dark:bg-amber-400 text-white dark:text-slate-950 border-slate-950 dark:border-amber-400'
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700 hover:border-slate-950'
                      }`}
                    >
                      <span
                        className="w-6 h-6 rounded-md shrink-0 border border-white/30 flex items-end justify-end p-0.5"
                        style={{ backgroundColor: preset.primaryColor }}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-xs"
                          style={{ backgroundColor: preset.accentColor }}
                        />
                      </span>
                      <span className="text-xs font-extrabold truncate">{preset.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Manual Colors & Typography */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-3 items-end">
              <label className="space-y-1">
                <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Primary
                </span>
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-300 cursor-pointer"
                />
              </label>
              <label className="space-y-1">
                <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Accent
                </span>
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-300 cursor-pointer"
                />
              </label>
              <label className="space-y-1">
                <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Card BG
                </span>
                <input
                  type="color"
                  value={surfaceColor}
                  onChange={(e) => setSurfaceColor(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-300 cursor-pointer"
                />
              </label>
              <label className="space-y-1">
                <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Text
                </span>
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-300 cursor-pointer"
                />
              </label>
              <label className="space-y-1">
                <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Typography
                </span>
                <select
                  value={fontStyle}
                  onChange={(e) => setFontStyle(e.target.value as FontStyleId)}
                  className="w-full h-9 px-2 rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-bold"
                >
                  <option value="sans">Modern Sans</option>
                  <option value="serif">Executive Serif</option>
                  <option value="mono">Technical Mono</option>
                </select>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

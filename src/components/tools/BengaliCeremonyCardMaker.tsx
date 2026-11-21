import React, { useRef, useState } from 'react';
import {
  Printer,
  Upload,
  RotateCcw,
  Sparkles,
  Trash2,
  Copy,
  Check,
  Flame,
  Heart,
  Baby,
  Home,
} from 'lucide-react';
import type { AppLang } from '../../data/i18n';
import { printElementHtml } from '../../utils/printHelper';

interface BengaliCeremonyCardMakerProps {
  appLang: AppLang;
}

type CeremonyType = 'biye' | 'shraddha' | 'annaprashan' | 'grihapravesh';
type CardPalette = 'royal-maroon' | 'classic-cream-gold' | 'solemn-bw' | 'slate-silver' | 'sandal-red';
type PrintMode = 'single-a4' | 'two-up-a4';

const PALETTES: Record<
  CardPalette,
  {
    nameBn: string;
    nameEn: string;
    bg: string;
    border: string;
    innerBorder: string;
    heading: string;
    accent: string;
    body: string;
    softPanel: string;
  }
> = {
  'royal-maroon': {
    nameBn: 'বিয়েবাড়ি মেরুন-সোনালি',
    nameEn: 'Royal Maroon & Gold',
    bg: '#fffaf2',
    border: '#7f1d1d',
    innerBorder: '#b45309',
    heading: '#7f1d1d',
    accent: '#b45309',
    body: '#1f2937',
    softPanel: '#fef3c7',
  },
  'sandal-red': {
    nameBn: 'সিঁদুর লাল ও চন্দন',
    nameEn: 'Vermilion & Sandal',
    bg: '#fffbf5',
    border: '#991b1b',
    innerBorder: '#c2410c',
    heading: '#991b1b',
    accent: '#c2410c',
    body: '#1c1917',
    softPanel: '#ffedd5',
  },
  'classic-cream-gold': {
    nameBn: 'হলুদ-ক্রিম ঐতিহ্য',
    nameEn: 'Heritage Cream Gold',
    bg: '#fefce8',
    border: '#854d0e',
    innerBorder: '#a16207',
    heading: '#713f12',
    accent: '#a16207',
    body: '#1f2937',
    softPanel: '#fef9c3',
  },
  'solemn-bw': {
    nameBn: 'শ্রাদ্ধ্য সাদা-কালো (প্রিন্ট)',
    nameEn: 'Solemn Classic B&W',
    bg: '#ffffff',
    border: '#111827',
    innerBorder: '#4b5563',
    heading: '#111827',
    accent: '#374151',
    body: '#111827',
    softPanel: '#f3f4f6',
  },
  'slate-silver': {
    nameBn: 'শ্রাদ্ধ্য ধূসর-রূপালি',
    nameEn: 'Respectful Slate',
    bg: '#f8fafc',
    border: '#1e293b',
    innerBorder: '#64748b',
    heading: '#0f172a',
    accent: '#334155',
    body: '#1e293b',
    softPanel: '#e2e8f0',
  },
};

export const BengaliCeremonyCardMaker: React.FC<BengaliCeremonyCardMakerProps> = ({ appLang }) => {
  const isBn = appLang === 'bn';
  const [ceremony, setCeremony] = useState<CeremonyType>('biye');
  const [palette, setPalette] = useState<CardPalette>('royal-maroon');
  const [printMode, setPrintMode] = useState<PrintMode>('two-up-a4');
  const [cardLang, setCardLang] = useState<'bn' | 'en'>('bn');
  const [copiedWa, setCopiedWa] = useState(false);

  // Common Header / Host Fields (all empty by default)
  const [topMantra, setTopMantra] = useState('');
  const [cardTitle, setCardTitle] = useState('');
  const [openingNote, setOpeningNote] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  // Biye Bari Fields
  const [groomName, setGroomName] = useState('');
  const [groomParents, setGroomParents] = useState('');
  const [groomAddress, setGroomAddress] = useState('');
  const [brideName, setBrideName] = useState('');
  const [brideParents, setBrideParents] = useState('');
  const [brideAddress, setBrideAddress] = useState('');
  const [gayeHoludDetails, setGayeHoludDetails] = useState('');
  const [biyeDateTime, setBiyeDateTime] = useState('');
  const [boubhatDateTime, setBoubhatDateTime] = useState('');
  const [venueAddress, setVenueAddress] = useState('');

  // Shraddha Bari Fields
  const [deceasedPrefix, setDeceasedPrefix] = useState<'স্বর্গীয়' | 'স্বর্গীয়া'>('স্বর্গীয়');
  const [deceasedName, setDeceasedName] = useState('');
  const [deceasedRelation, setDeceasedRelation] = useState('');
  const [deceasedAge, setDeceasedAge] = useState('');
  const [demiseDateBnEn, setDemiseDateBnEn] = useState('');
  const [shraddhaDateTime, setShraddhaDateTime] = useState('');
  const [bhojonDateTime, setBhojonDateTime] = useState('');

  // Annaprashan / Griha Pravesh Fields
  const [honoreeName, setHonoreeName] = useState('');
  const [honoreeParents, setHonoreeParents] = useState('');
  const [eventScheduleLine1, setEventScheduleLine1] = useState('');
  const [eventScheduleLine2, setEventScheduleLine2] = useState('');

  // Footer / Hosts
  const [hostsLine, setHostsLine] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [footerNote, setFooterNote] = useState('');

  const printRef = useRef<HTMLDivElement | null>(null);
  const p = PALETTES[palette];
  const isCardBn = cardLang === 'bn';

  const switchCeremony = (next: CeremonyType) => {
    setCeremony(next);
    if (next === 'shraddha') {
      setPalette('solemn-bw');
    } else if (next === 'biye') {
      setPalette('royal-maroon');
    } else if (next === 'annaprashan') {
      setPalette('sandal-red');
    } else {
      setPalette('classic-cream-gold');
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setPhotoUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const loadSample = () => {
    if (ceremony === 'biye') {
      setTopMantra('শ্রী শ্রী প্রজাপতয়ে নমঃ');
      setCardTitle('শুভ বিবাহ ও প্রীতিভোজ');
      setOpeningNote(
        'সবিনয় নিবেদন, মহাশয়/মহাশয়া, পরম করুণাময়ের আশীর্বাদে আগামী শুভ লগ্নে আমাদের স্নেহের পুত্র ও কন্যা শুভ পরিণয় সূত্রে আবদ্ধ হইতে চলিয়াছে। এই আনন্দঘন অনুষ্ঠানে আপনার সপরিবার উপস্থিতি একান্ত কাম্য।'
      );
      setGroomName('শ্রীমান সৌরভ ব্যানার্জী');
      setGroomParents('পিতা: শ্রী অশোক ব্যানার্জী · মাতা: শ্রীমতী বন্দনা ব্যানার্জী');
      setGroomAddress('নিবাস: চুঁচুড়া, হুগলি');
      setBrideName('শ্রীমতী ঋতুপর্ণা চ্যাটার্জী');
      setBrideParents('পিতা: শ্রী তপন চ্যাটার্জী · মাতা: শ্রীমতী মিতা চ্যাটার্জী');
      setBrideAddress('নিবাস: বর্ধমান, পূর্ব বর্ধমান');
      setGayeHoludDetails('১২ই অগ্রহায়ণ ১৪৩৩ (২৮শে নভেম্বর ২০২৬), শনিবার সকাল ৯:৩০ মি.');
      setBiyeDateTime('১২ই অগ্রহায়ণ ১৪৩৩ (২৮শে নভেম্বর ২০২৬), শনিবার সন্ধ্যা ৭:৪৫ মি.');
      setBoubhatDateTime('১৪ই অগ্রহায়ণ ১৪৩৩ (৩০শে নভেম্বর ২০২৬), সোমবার সন্ধ্যা ৭:০০ টা হইতে');
      setVenueAddress('শান্তিনিকেতন কমিউনিটি হল, স্টেশন রোড, চুঁচুড়া, হুগলি');
      setHostsLine('বিনীত: ব্যানার্জী পরিবারবর্গ ও আত্মীয়স্বজন');
      setContactPhone('8670225411');
      setFooterNote('পত্রে ত্রুটি মার্জনীয় · উপহারের প্রয়োজন নেই, আপনার আশীর্বাদই আমাদের কাম্য');
    } else if (ceremony === 'shraddha') {
      setTopMantra('ওঁ শান্তিঃ শান্তিঃ শান্তিঃ');
      setCardTitle('পিতৃবিয়োগ ও আদ্যশ্রাদ্ধ অনুষ্ঠান');
      setOpeningNote(
        'শোকস্তব্ধ হৃদয়ে জানানো যাইতেছে যে, আমাদের পরম পূজনীয় পিতা বার্ধক্যজনিত কারণে ইহলোক ত্যাগ করিয়া পরলোক গমন করিয়াছেন। তাঁহার বিদেহী আত্মার চিরশান্তি কামনায় আদ্যশ্রাদ্ধ ও জ্ঞাতিকুটুম্ব ভোজন অনুষ্ঠানে আপনার উপস্থিতি ও আশীর্বাদ একান্তভাবে প্রার্থনীয়।'
      );
      setDeceasedPrefix('স্বর্গীয়');
      setDeceasedName('নরেন্দ্রনাথ সেনগুপ্ত');
      setDeceasedRelation('পিতা: স্বর্গীয় হরেন সেনগুপ্ত · নিবাস: কৃষ্ণনগর, নদীয়া');
      setDeceasedAge('৮২ বছর');
      setDemiseDateBnEn('২৫শে কার্তিক ১৪৩৩ বঙ্গাব্দ (১২ই নভেম্বর ২০২৬), বৃহস্পতিবার');
      setShraddhaDateTime('৫ই অগ্রহায়ণ ১৪৩৩ (২২শে নভেম্বর ২০২৬), রবিবার সকাল ৯:০০ টা');
      setBhojonDateTime('৬ই অগ্রহায়ণ ১৪৩৩ (২৩শে নভেম্বর ২০২৬), সোমবার দুপুর ১২:৩০ মি. হইতে (মৎস্যমুখী ও স্মরণসভা)');
      setVenueAddress('নিজ বাসভবন — সেনগুপ্ত বাড়ি, কলেজ পাড়া, কৃষ্ণনগর, নদীয়া');
      setHostsLine('শোকার্ত: স্ত্রী, পুত্র-পুত্রবধূ, কন্যা-জামাতা, নাতি-নাতনি ও সমগ্র সেনগুপ্ত পরিবার');
      setContactPhone('8670225411');
      setFooterNote('অনিবার্য কারণবশতঃ কাহারও নাম বাদ পড়িলে নিজগুণে ক্ষমা করিবেন');
    } else if (ceremony === 'annaprashan') {
      setTopMantra('ওঁ শ্রী শ্রী গণেশায় নমঃ');
      setCardTitle('শুভ অন্নপ্রাশন ও প্রীতিভোজ');
      setOpeningNote(
        'মহাশয়/মহাশয়া, পরম ঈশ্বরের কৃপায় আমাদের স্নেহের পুত্রসন্তানের শুভ অন্নপ্রাশন অনুষ্ঠান স্থির হইয়াছে। এই মঙ্গলময় দিনে আপনার সপরিবার উপস্থিতি ও আশীর্বাদ আমাদের একান্ত কাম্য।'
      );
      setHonoreeName('শ্রীমান আয়ুষ্মান দাস (সোনাই)');
      setHonoreeParents('পিতা: শ্রী সুমন দাস · মাতা: শ্রীমতী প্রিয়াঙ্কা দাস');
      setEventScheduleLine1('শুভ অন্নপ্রাশন: ১০ই অগ্রহায়ণ ১৪৩৩ (২৬শে নভেম্বর ২০২৬), বৃহস্পতিবার সকাল ১০:৩০ মি.');
      setEventScheduleLine2('প্রীতিভোজ: ঐ দিন সন্ধ্যা ৭:০০ টা হইতে');
      setVenueAddress('উৎসব ভবন, মেইন রোড, মেদিনীপুর');
      setHostsLine('বিনীত: দাদু-ঠাকুমা ও সমগ্র দাস পরিবার');
      setContactPhone('8670225411');
      setFooterNote('পত্রে ত্রুটি মার্জনীয়');
    } else {
      setTopMantra('ওঁ নমঃ শিবায় · শ্রী শ্রী গৃহলক্ষ্মী নমঃ');
      setCardTitle('শুভ গৃহপ্রবেশ ও সত্যনারায়ণ পূজা');
      setOpeningNote(
        'সাদর আমন্ত্রণ — ঈশ্বরের আশীর্বাদে আমাদের নূতন গৃহে পদার্পণ ও শুভ গৃহপ্রবেশ পূজার আয়োজন করা হইয়াছে। আপনার উপস্থিতি আমাদের আনন্দ বহুগুণ বৃদ্ধি করিবে।'
      );
      setHonoreeName('শান্তিকুঞ্জ নিবাস (নবনির্মিত বাসভবন)');
      setHonoreeParents('গৃহস্বামী: শ্রী রাজেশ মণ্ডল ও শ্রীমতী সুমিত্রা মণ্ডল');
      setEventScheduleLine1('পূজা ও হোমযজ্ঞ: ১৫ই অগ্রহায়ণ ১৪৩৩ (১লা ডিসেম্বর ২০২৬), সকাল ৮:৩০ মি.');
      setEventScheduleLine2('প্রসাদ বিতরণ ও মধ্যাহ্নভোজ: দুপুর ১:০০ টা হইতে');
      setVenueAddress('শান্তিকুঞ্জ, বিবেকানন্দ সরণি, দুর্গাপুর - ৭১৩২১৩');
      setHostsLine('নিবেদক: মণ্ডল পরিবারবর্গ');
      setContactPhone('8670225411');
      setFooterNote('সপরিবারে উপস্থিত থাকিয়া অনুষ্ঠানটি সাফল্যমণ্ডিত করিবেন');
    }
  };

  const handleClear = () => {
    setTopMantra('');
    setCardTitle('');
    setOpeningNote('');
    setPhotoUrl(null);
    setGroomName('');
    setGroomParents('');
    setGroomAddress('');
    setBrideName('');
    setBrideParents('');
    setBrideAddress('');
    setGayeHoludDetails('');
    setBiyeDateTime('');
    setBoubhatDateTime('');
    setVenueAddress('');
    setDeceasedName('');
    setDeceasedRelation('');
    setDeceasedAge('');
    setDemiseDateBnEn('');
    setShraddhaDateTime('');
    setBhojonDateTime('');
    setHonoreeName('');
    setHonoreeParents('');
    setEventScheduleLine1('');
    setEventScheduleLine2('');
    setHostsLine('');
    setContactPhone('');
    setFooterNote('');
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const titleLabel =
      ceremony === 'shraddha'
        ? 'Shraddha Invitation Card'
        : ceremony === 'biye'
        ? 'Bengali Wedding Card'
        : ceremony === 'annaprashan'
        ? 'Annaprashan Card'
        : 'Ceremony Invitation Card';
    printElementHtml(printRef.current, titleLabel);
  };

  const handleCopyWhatsAppText = () => {
    const lines: string[] = [];
    lines.push(`*${topMantra.trim() || (ceremony === 'shraddha' ? 'ওঁ শান্তিঃ শান্তিঃ শান্তিঃ' : 'শ্রী শ্রী প্রজাপতয়ে নমঃ')}*`);
    lines.push(`*${cardTitle.trim() || defaultTitle()}*`);
    if (openingNote.trim()) lines.push('', openingNote.trim());
    if (ceremony === 'biye') {
      if (groomName.trim()) lines.push('', `পাত্র: *${groomName.trim()}*`, groomParents.trim());
      if (brideName.trim()) lines.push(`পাত্রী: *${brideName.trim()}*`, brideParents.trim());
      if (biyeDateTime.trim()) lines.push('', `শুভ বিবাহ: ${biyeDateTime.trim()}`);
      if (boubhatDateTime.trim()) lines.push(`প্রীতিভোজ / বৌভাত: ${boubhatDateTime.trim()}`);
    } else if (ceremony === 'shraddha') {
      if (deceasedName.trim()) lines.push('', `${deceasedPrefix} *${deceasedName.trim()}* ${deceasedAge.trim() ? `(বয়স: ${deceasedAge.trim()})` : ''}`);
      if (demiseDateBnEn.trim()) lines.push(`মহাপ্রয়াণ: ${demiseDateBnEn.trim()}`);
      if (shraddhaDateTime.trim()) lines.push(`আদ্যশ্রাদ্ধ: ${shraddhaDateTime.trim()}`);
      if (bhojonDateTime.trim()) lines.push(`মৎস্যমুখী / স্মরণসভা: ${bhojonDateTime.trim()}`);
    } else {
      if (honoreeName.trim()) lines.push('', `*${honoreeName.trim()}*`, honoreeParents.trim());
      if (eventScheduleLine1.trim()) lines.push(eventScheduleLine1.trim());
      if (eventScheduleLine2.trim()) lines.push(eventScheduleLine2.trim());
    }
    if (venueAddress.trim()) lines.push('', `স্থান: ${venueAddress.trim()}`);
    if (hostsLine.trim()) lines.push('', hostsLine.trim());
    if (contactPhone.trim()) lines.push(`যোগাযোগ: ${contactPhone.trim()}`);

    navigator.clipboard.writeText(lines.filter(Boolean).join('\n')).then(() => {
      setCopiedWa(true);
      setTimeout(() => setCopiedWa(false), 2000);
    });
  };

  const defaultMantra = () => {
    if (topMantra.trim()) return topMantra.trim();
    if (ceremony === 'shraddha') return isCardBn ? 'ওঁ শান্তিঃ শান্তিঃ শান্তিঃ' : 'OM SHANTI · IN LOVING MEMORY';
    if (ceremony === 'biye') return isCardBn ? 'শ্রী শ্রী প্রজাপতয়ে নমঃ' : 'SHUBHA BIBAHA';
    if (ceremony === 'annaprashan') return isCardBn ? 'ওঁ শ্রী শ্রী গণেশায় নমঃ' : 'SHUBHA ANNAPRASHAN';
    return isCardBn ? 'শ্রী শ্রী গণেশায় নমঃ' : 'AUSPICIOUS INVITATION';
  };

  const defaultTitle = () => {
    if (cardTitle.trim()) return cardTitle.trim();
    if (ceremony === 'shraddha') return isCardBn ? 'শ্রাদ্ধ্যানুষ্ঠান ও স্মরণসভা' : 'SHRADDHA CEREMONY INVITATION';
    if (ceremony === 'biye') return isCardBn ? 'শুভ বিবাহ আমন্ত্রণ পত্র' : 'WEDDING INVITATION';
    if (ceremony === 'annaprashan') return isCardBn ? 'শুভ অন্নপ্রাশন নিমন্ত্রণ পত্র' : 'ANNAPRASHAN INVITATION';
    return isCardBn ? 'শুভ গৃহপ্রবেশ / উপনয়ন আমন্ত্রণ' : 'CEREMONY INVITATION';
  };

  // Single Card Renderer (reused once for Full A4, or twice for 2-Up Cut-Ready A4!)
  const renderCardSheet = (compact: boolean) => {
    const pad = compact ? '14px 18px' : '24px 30px';
    const titleSize = compact ? '17px' : '23px';
    const bodySize = compact ? '11px' : '13.5px';

    return (
      <div
        style={{
          backgroundColor: p.bg,
          color: p.body,
          border: `3.5px solid ${p.border}`,
          padding: '6px',
          fontFamily: "'Noto Sans Bengali', Georgia, serif",
          boxSizing: 'border-box',
          width: '100%',
        }}
      >
        <div
          style={{
            border: `1.5px solid ${p.innerBorder}`,
            padding: pad,
            position: 'relative',
            textAlign: 'center',
          }}
        >
          {/* Decorative Corner Motifs */}
          {[
            { top: 5, left: 5, rot: 0 },
            { top: 5, right: 5, rot: 90 },
            { bottom: 5, right: 5, rot: 180 },
            { bottom: 5, left: 5, rot: 270 },
          ].map((c, idx) => (
            <svg
              key={idx}
              width={compact ? '22' : '32'}
              height={compact ? '22' : '32'}
              viewBox="0 0 32 32"
              style={{
                position: 'absolute',
                top: c.top,
                bottom: c.bottom,
                left: c.left,
                right: c.right,
                transform: `rotate(${c.rot}deg)`,
              }}
            >
              <path d="M2 2 L24 2 L24 5 L5 5 L5 24 L2 24 Z" fill={p.border} />
              <circle cx="11" cy="11" r="2.2" fill={p.innerBorder} />
            </svg>
          ))}

          {/* Top Emblem: Pradip/Lotus for Shraddha, Mangal Kalash/Ornament for Auspicious */}
          <div style={{ marginBottom: compact ? '4px' : '8px' }}>
            {ceremony === 'shraddha' ? (
              <svg
                width={compact ? '36' : '48'}
                height={compact ? '28' : '36'}
                viewBox="0 0 64 48"
                style={{ margin: '0 auto 2px' }}
              >
                {/* Respectful Lotus / Diya Flame SVG */}
                <path d="M32 6 C36 14 37 19 32 24 C27 19 28 14 32 6 Z" fill={p.heading} />
                <path d="M16 28 Q32 42 48 28 Q32 33 16 28 Z" fill={p.heading} />
                <path d="M22 40 L42 40" stroke={p.innerBorder} strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg
                width={compact ? '38' : '50'}
                height={compact ? '30' : '38'}
                viewBox="0 0 64 48"
                style={{ margin: '0 auto 2px' }}
              >
                {/* Traditional Bengali Mangal Ghat / Swastika-style Floral Motif */}
                <circle cx="32" cy="27" r="12" fill="none" stroke={p.heading} strokeWidth="2.5" />
                <path d="M24 16 Q32 6 40 16" fill="none" stroke={p.accent} strokeWidth="2.5" />
                <circle cx="32" cy="11" r="4" fill={p.accent} />
                <path d="M14 27 Q20 18 24 24 M50 27 Q44 18 40 24" fill="none" stroke={p.heading} strokeWidth="2" />
                <path d="M23 41 L41 41" stroke={p.heading} strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            )}

            <div style={{ fontSize: compact ? '10.5px' : '12.5px', fontWeight: 800, color: p.accent }}>
              {defaultMantra()}
            </div>
            <h2
              style={{
                fontSize: titleSize,
                fontWeight: 900,
                color: p.heading,
                margin: compact ? '3px 0' : '6px 0',
                lineHeight: 1.25,
              }}
            >
              {defaultTitle()}
            </h2>
            <div
              style={{
                width: '120px',
                height: '2px',
                backgroundColor: p.innerBorder,
                margin: '4px auto 8px',
              }}
            />
          </div>

          {/* Optional Portrait Photo (especially cherished in Shraddha & Annaprashan cards) */}
          {photoUrl && (
            <div style={{ margin: compact ? '6px auto' : '10px auto' }}>
              <img
                src={photoUrl}
                alt="Ceremony Portrait"
                style={{
                  width: compact ? '68px' : '104px',
                  height: compact ? '82px' : '124px',
                  objectFit: 'cover',
                  borderRadius: ceremony === 'shraddha' ? '12px' : '9999px',
                  border: `3px double ${p.border}`,
                  padding: '2px',
                  backgroundColor: '#ffffff',
                  margin: '0 auto',
                  display: 'block',
                  filter: ceremony === 'shraddha' && palette === 'solemn-bw' ? 'grayscale(100%)' : 'none',
                }}
              />
            </div>
          )}

          {/* Opening Invitation / Condolence Prose */}
          <p
            style={{
              fontSize: bodySize,
              lineHeight: 1.55,
              margin: compact ? '4px auto 8px' : '8px auto 14px',
              maxWidth: '94%',
              color: p.body,
            }}
          >
            {openingNote.trim() ||
              (ceremony === 'shraddha'
                ? 'শোকস্তব্ধ হৃদয়ে জানানো যাইতেছে যে, আমাদের প্রিয়জন পরলোক গমন করিয়াছেন। তাঁহার আত্মার শান্তি কামনায় আদ্যশ্রাদ্ধ অনুষ্ঠানে আপনার উপস্থিতি একান্তভাবে প্রার্থনীয়।'
                : 'সবিনয় নিবেদন, মহাশয়/মহাশয়া, পরম ঈশ্বরের আশীর্বাদে আমাদের এই মঙ্গল অনুষ্ঠানে আপনার সপরিবার উপস্থিতি একান্ত কাম্য।')}
          </p>

          {/* CEREMONY SPECIFIC DETAILS */}
          {ceremony === 'biye' && (
            <div style={{ margin: compact ? '6px 0' : '12px 0' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto 1fr',
                  gap: '8px',
                  alignItems: 'center',
                  backgroundColor: p.softPanel,
                  border: `1px solid ${p.innerBorder}`,
                  padding: compact ? '8px 10px' : '14px 16px',
                  marginBottom: compact ? '8px' : '12px',
                }}
              >
                <div>
                  <div style={{ fontSize: compact ? '9.5px' : '11px', fontWeight: 700, color: p.accent }}>
                    {isCardBn ? 'কল্যাণীয় (পাত্র)' : 'GROOM'}
                  </div>
                  <div style={{ fontSize: compact ? '13.5px' : '17px', fontWeight: 900, color: p.heading }}>
                    {groomName.trim() || (isCardBn ? 'পাত্রের নাম' : 'Groom Name')}
                  </div>
                  {groomParents.trim() && (
                    <div style={{ fontSize: compact ? '9.5px' : '11px', marginTop: '2px' }}>{groomParents.trim()}</div>
                  )}
                  {groomAddress.trim() && (
                    <div style={{ fontSize: compact ? '9px' : '10.5px', color: '#4b5563' }}>{groomAddress.trim()}</div>
                  )}
                </div>

                <div
                  style={{
                    fontSize: compact ? '14px' : '18px',
                    fontWeight: 900,
                    color: p.heading,
                    padding: '0 4px',
                  }}
                >
                  {isCardBn ? 'এবং' : '&'}
                </div>

                <div>
                  <div style={{ fontSize: compact ? '9.5px' : '11px', fontWeight: 700, color: p.accent }}>
                    {isCardBn ? 'কল্যাণীয়া (পাত্রী)' : 'BRIDE'}
                  </div>
                  <div style={{ fontSize: compact ? '13.5px' : '17px', fontWeight: 900, color: p.heading }}>
                    {brideName.trim() || (isCardBn ? 'পাত্রীর নাম' : 'Bride Name')}
                  </div>
                  {brideParents.trim() && (
                    <div style={{ fontSize: compact ? '9.5px' : '11px', marginTop: '2px' }}>{brideParents.trim()}</div>
                  )}
                  {brideAddress.trim() && (
                    <div style={{ fontSize: compact ? '9px' : '10.5px', color: '#4b5563' }}>{brideAddress.trim()}</div>
                  )}
                </div>
              </div>

              {/* Event Schedule Table */}
              <div
                style={{
                  border: `1px dashed ${p.innerBorder}`,
                  padding: compact ? '7px 10px' : '11px 16px',
                  textAlign: 'left',
                  fontSize: compact ? '10.5px' : '12.5px',
                  lineHeight: 1.55,
                }}
              >
                <div style={{ textAlign: 'center', fontWeight: 900, color: p.heading, marginBottom: '4px' }}>
                  {isCardBn ? '— অনুষ্ঠান সূচি —' : '— CEREMONY SCHEDULE —'}
                </div>
                {gayeHoludDetails.trim() && (
                  <div>
                    <strong>{isCardBn ? 'গায়ে হলুদ:' : 'Gaye Holud:'}</strong> {gayeHoludDetails.trim()}
                  </div>
                )}
                <div>
                  <strong>{isCardBn ? 'শুভ বিবাহ:' : 'Wedding:'}</strong>{' '}
                  {biyeDateTime.trim() || (isCardBn ? 'তারিখ ও শুভ লগ্ন' : 'Date & Auspicious Time')}
                </div>
                {boubhatDateTime.trim() && (
                  <div>
                    <strong>{isCardBn ? 'প্রীতিভোজ / বৌভাত:' : 'Reception / Boubhat:'}</strong>{' '}
                    {boubhatDateTime.trim()}
                  </div>
                )}
                <div>
                  <strong>{isCardBn ? 'স্থান:' : 'Venue:'}</strong>{' '}
                  {venueAddress.trim() || (isCardBn ? 'অনুষ্ঠান স্থলের ঠিকানা' : 'Venue Address')}
                </div>
              </div>
            </div>
          )}

          {ceremony === 'shraddha' && (
            <div style={{ margin: compact ? '6px 0' : '12px 0' }}>
              <div
                style={{
                  backgroundColor: p.softPanel,
                  border: `1.5px solid ${p.border}`,
                  padding: compact ? '8px 12px' : '12px 18px',
                  marginBottom: compact ? '8px' : '12px',
                }}
              >
                <div style={{ fontSize: compact ? '14px' : '19px', fontWeight: 900, color: p.heading }}>
                  {deceasedPrefix} {deceasedName.trim() || (isCardBn ? 'প্রয়াত ব্যক্তির নাম' : 'Late Name')}
                </div>
                {(deceasedRelation.trim() || deceasedAge.trim()) && (
                  <div style={{ fontSize: compact ? '10px' : '12px', marginTop: '3px', fontWeight: 600 }}>
                    {deceasedRelation.trim()}
                    {deceasedRelation.trim() && deceasedAge.trim() ? ' · ' : ''}
                    {deceasedAge.trim() ? `${isCardBn ? 'বয়স:' : 'Age:'} ${deceasedAge.trim()}` : ''}
                  </div>
                )}
                {demiseDateBnEn.trim() && (
                  <div style={{ fontSize: compact ? '10px' : '12px', marginTop: '3px', fontWeight: 700, color: p.accent }}>
                    {isCardBn ? 'মহাপ্রয়াণ:' : 'Departed On:'} {demiseDateBnEn.trim()}
                  </div>
                )}
              </div>

              <div
                style={{
                  border: `1px solid ${p.innerBorder}`,
                  padding: compact ? '7px 10px' : '11px 16px',
                  textAlign: 'left',
                  fontSize: compact ? '10.5px' : '12.5px',
                  lineHeight: 1.55,
                }}
              >
                <div style={{ textAlign: 'center', fontWeight: 900, color: p.heading, marginBottom: '4px' }}>
                  {isCardBn ? '— শ্রাদ্ধ্য ও স্মরণসভার বিবরণ —' : '— SHRADDHA & MEMORIAL DETAILS —'}
                </div>
                <div>
                  <strong>{isCardBn ? 'আদ্যশ্রাদ্ধ:' : 'Adya Shraddha:'}</strong>{' '}
                  {shraddhaDateTime.trim() || (isCardBn ? 'তারিখ ও সময়' : 'Date & Time')}
                </div>
                {bhojonDateTime.trim() && (
                  <div>
                    <strong>{isCardBn ? 'মৎস্যমুখী ও জ্ঞাতিকুটুম্ব ভোজন:' : 'Memorial Feast:'}</strong>{' '}
                    {bhojonDateTime.trim()}
                  </div>
                )}
                <div>
                  <strong>{isCardBn ? 'স্থান:' : 'Venue:'}</strong>{' '}
                  {venueAddress.trim() || (isCardBn ? 'নিজ বাসভবনের ঠিকানা' : 'Residence Address')}
                </div>
              </div>
            </div>
          )}

          {(ceremony === 'annaprashan' || ceremony === 'grihapravesh') && (
            <div style={{ margin: compact ? '6px 0' : '12px 0' }}>
              <div
                style={{
                  backgroundColor: p.softPanel,
                  border: `1.5px solid ${p.innerBorder}`,
                  padding: compact ? '8px 12px' : '12px 18px',
                  marginBottom: compact ? '8px' : '12px',
                }}
              >
                <div style={{ fontSize: compact ? '14.5px' : '19px', fontWeight: 900, color: p.heading }}>
                  {honoreeName.trim() || (ceremony === 'annaprashan' ? 'শিশুর নাম' : 'অনুষ্ঠান / গৃহের নাম')}
                </div>
                {honoreeParents.trim() && (
                  <div style={{ fontSize: compact ? '10px' : '12px', marginTop: '3px', fontWeight: 600 }}>
                    {honoreeParents.trim()}
                  </div>
                )}
              </div>

              <div
                style={{
                  border: `1px dashed ${p.innerBorder}`,
                  padding: compact ? '7px 10px' : '11px 16px',
                  textAlign: 'left',
                  fontSize: compact ? '10.5px' : '12.5px',
                  lineHeight: 1.55,
                }}
              >
                <div>
                  <strong>{isCardBn ? 'অনুষ্ঠান:' : 'Ceremony:'}</strong>{' '}
                  {eventScheduleLine1.trim() || (isCardBn ? 'তারিখ ও সময়' : 'Date & Time')}
                </div>
                {eventScheduleLine2.trim() && (
                  <div>
                    <strong>{isCardBn ? 'প্রীতিভোজ / প্রসাদ:' : 'Feast:'}</strong> {eventScheduleLine2.trim()}
                  </div>
                )}
                <div>
                  <strong>{isCardBn ? 'স্থান:' : 'Venue:'}</strong>{' '}
                  {venueAddress.trim() || (isCardBn ? 'অনুষ্ঠান স্থলের ঠিকানা' : 'Venue Address')}
                </div>
              </div>
            </div>
          )}

          {/* Footer: Hosts, Phone & Truti Marjaniyo */}
          <div
            style={{
              marginTop: compact ? '8px' : '14px',
              paddingTop: compact ? '6px' : '10px',
              borderTop: `1px solid ${p.innerBorder}`,
              fontSize: compact ? '10.5px' : '12.5px',
            }}
          >
            <div style={{ fontWeight: 800, color: p.heading }}>
              {hostsLine.trim() ||
                (ceremony === 'shraddha'
                  ? 'শোকার্ত: পরিবারবর্গ ও আত্মীয়স্বজন'
                  : 'বিনীত: নিবেদক ও পরিবারবর্গ')}
            </div>
            {contactPhone.trim() && (
              <div style={{ fontSize: compact ? '10px' : '11.5px', fontWeight: 700, marginTop: '2px' }}>
                {isCardBn ? 'যোগাযোগ:' : 'Contact:'} {contactPhone.trim()}
              </div>
            )}
            {footerNote.trim() && (
              <div style={{ fontSize: compact ? '9px' : '10.5px', color: '#4b5563', marginTop: '4px', fontStyle: 'italic' }}>
                {footerNote.trim()}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Ceremony Mode Selector & Actions */}
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          {(
            [
              { id: 'biye', labelBn: 'শুভ বিবাহ / বৌভাত', labelEn: 'Biye Bari (Wedding)', icon: Heart },
              { id: 'shraddha', labelBn: 'শ্রাদ্ধ্য বাড়ি / আদ্যশ্রাদ্ধ', labelEn: 'Shraddha Bari', icon: Flame },
              { id: 'annaprashan', labelBn: 'শুভ অন্নপ্রাশন', labelEn: 'Annaprashan', icon: Baby },
              { id: 'grihapravesh', labelBn: 'গৃহপ্রবেশ / উপনয়ন', labelEn: 'Griha Pravesh / Puja', icon: Home },
            ] as const
          ).map((item) => {
            const IconComp = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => switchCeremony(item.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                  ceremony === item.id
                    ? 'bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-950'
                }`}
              >
                <IconComp className="w-3.5 h-3.5" />
                {isBn ? item.labelBn : item.labelEn}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadSample}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200 text-xs font-bold cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isBn ? 'বাংলা নমুনা ভরুন' : 'Load Bengali Sample'}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {isBn ? 'মুছুন' : 'Clear'}
          </button>
          <button
            type="button"
            onClick={handleCopyWhatsAppText}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
          >
            {copiedWa ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedWa ? (isBn ? 'কপি হয়েছে!' : 'Copied!') : 'WhatsApp Text'}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-extrabold shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            {printMode === 'two-up-a4'
              ? isBn
                ? '২টি কার্ড / A4 প্রিন্ট'
                : 'Print 2 Cards / A4'
              : isBn
              ? 'ফুল A4 প্রিন্ট'
              : 'Print Full A4'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Editor Panel */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          {/* Print Layout + Language + Color Palette */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                {isBn ? 'A4 প্রিন্ট লেআউট' : 'A4 Print Sheet Mode'}
              </label>
              <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPrintMode('two-up-a4')}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${
                    printMode === 'two-up-a4'
                      ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-amber-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {isBn ? '২টি কার্ড / A4' : '2 Cards / A4'}
                </button>
                <button
                  type="button"
                  onClick={() => setPrintMode('single-a4')}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${
                    printMode === 'single-a4'
                      ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-amber-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {isBn ? '১টি বড় A4' : '1 Full A4'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                {isBn ? 'কার্ডের ভাষা' : 'Card Labels'}
              </label>
              <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setCardLang('bn')}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${
                    cardLang === 'bn'
                      ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  বাংলা
                </button>
                <button
                  type="button"
                  onClick={() => setCardLang('en')}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${
                    cardLang === 'en'
                      ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  English
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
              {isBn ? 'কার্ডের রঙ ও বর্ডার থিম' : 'Card Color & Border Theme'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {(Object.keys(PALETTES) as CardPalette[]).map((pk) => {
                const pv = PALETTES[pk];
                return (
                  <button
                    key={pk}
                    type="button"
                    onClick={() => setPalette(pk)}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl border-2 text-[11px] font-bold cursor-pointer ${
                      palette === pk
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-sm shrink-0 border"
                      style={{ backgroundColor: pv.border, borderColor: pv.innerBorder }}
                    />
                    <span className="truncate">{isBn ? pv.nameBn : pv.nameEn}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Header & Photo */}
          <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={topMantra}
                onChange={(e) => setTopMantra(e.target.value)}
                placeholder={
                  ceremony === 'shraddha'
                    ? 'উপরের মন্ত্র (যেমন: ওঁ শান্তিঃ)'
                    : 'উপরের মন্ত্র (যেমন: শ্রী শ্রী প্রজাপতয়ে নমঃ)'
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
              />
              <input
                type="text"
                value={cardTitle}
                onChange={(e) => setCardTitle(e.target.value)}
                placeholder={
                  ceremony === 'shraddha'
                    ? 'শিরোনাম (যেমন: মাতৃবিয়োগ / আদ্যশ্রাদ্ধ)'
                    : 'শিরোনাম (যেমন: শুভ বিবাহ ও প্রীতিভোজ)'
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              />
            </div>

            <textarea
              rows={2}
              value={openingNote}
              onChange={(e) => setOpeningNote(e.target.value)}
              placeholder={
                ceremony === 'shraddha'
                  ? 'শোকসংবাদ ও শ্রাদ্ধ্য অনুষ্ঠানের প্রথাগত বাংলা বক্তব্য...'
                  : 'সবিনয় নিবেদন / আমন্ত্রণের মূল বক্তব্য...'
              }
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs resize-none"
            />

            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                {ceremony === 'shraddha'
                  ? isBn
                    ? 'প্রয়াত ব্যক্তির ছবি যোগ করুন'
                    : 'Upload Deceased Photo'
                  : isBn
                  ? 'ছবি যোগ করুন (ঐচ্ছিক)'
                  : 'Add Photo (Optional)'}
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
              {photoUrl && (
                <button
                  type="button"
                  onClick={() => setPhotoUrl(null)}
                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Ceremony Specific Inputs */}
          {ceremony === 'biye' && (
            <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={groomName}
                  onChange={(e) => setGroomName(e.target.value)}
                  placeholder="পাত্রের নাম (কল্যাণীয়)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
                <input
                  type="text"
                  value={brideName}
                  onChange={(e) => setBrideName(e.target.value)}
                  placeholder="পাত্রীর নাম (কল্যাণীয়া)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
              </div>
              <input
                type="text"
                value={groomParents}
                onChange={(e) => setGroomParents(e.target.value)}
                placeholder="পাত্রের পিতা ও মাতার নাম"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
              <input
                type="text"
                value={groomAddress}
                onChange={(e) => setGroomAddress(e.target.value)}
                placeholder="পাত্রের নিবাস / ঠিকানা"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
              <input
                type="text"
                value={brideParents}
                onChange={(e) => setBrideParents(e.target.value)}
                placeholder="পাত্রীর পিতা ও মাতার নাম"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
              <input
                type="text"
                value={brideAddress}
                onChange={(e) => setBrideAddress(e.target.value)}
                placeholder="পাত্রীর নিবাস / ঠিকানা"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
              <input
                type="text"
                value={gayeHoludDetails}
                onChange={(e) => setGayeHoludDetails(e.target.value)}
                placeholder="গায়ে হলুদ তারিখ ও সময় (ঐচ্ছিক)"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
              <input
                type="text"
                value={biyeDateTime}
                onChange={(e) => setBiyeDateTime(e.target.value)}
                placeholder="শুভ বিবাহ তারিখ (বাংলা ও ইংরেজি) ও লগ্ন"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
              />
              <input
                type="text"
                value={boubhatDateTime}
                onChange={(e) => setBoubhatDateTime(e.target.value)}
                placeholder="প্রীতিভোজ / বৌভাত তারিখ ও সময়"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
            </div>
          )}

          {ceremony === 'shraddha' && (
            <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex gap-2">
                <select
                  value={deceasedPrefix}
                  onChange={(e) => setDeceasedPrefix(e.target.value as 'স্বর্গীয়' | 'স্বর্গীয়া')}
                  className="px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                >
                  <option value="স্বর্গীয়">স্বর্গীয়</option>
                  <option value="স্বর্গীয়া">স্বর্গীয়া</option>
                </select>
                <input
                  type="text"
                  value={deceasedName}
                  onChange={(e) => setDeceasedName(e.target.value)}
                  placeholder="পরলোকগত ব্যক্তির নাম"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
                />
                <input
                  type="text"
                  value={deceasedAge}
                  onChange={(e) => setDeceasedAge(e.target.value)}
                  placeholder="বয়স"
                  className="w-20 px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>
              <input
                type="text"
                value={deceasedRelation}
                onChange={(e) => setDeceasedRelation(e.target.value)}
                placeholder="পিতা / স্বামীর নাম ও নিবাস"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
              <input
                type="text"
                value={demiseDateBnEn}
                onChange={(e) => setDemiseDateBnEn(e.target.value)}
                placeholder="মহাপ্রয়াণের তারিখ (বাংলা ও ইংরেজি)"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
              />
              <input
                type="text"
                value={shraddhaDateTime}
                onChange={(e) => setShraddhaDateTime(e.target.value)}
                placeholder="আদ্যশ্রাদ্ধের তারিখ, বার ও সময়"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
              />
              <input
                type="text"
                value={bhojonDateTime}
                onChange={(e) => setBhojonDateTime(e.target.value)}
                placeholder="মৎস্যমুখী / স্মরণসভা / জ্ঞাতিকুটুম্ব ভোজনের তারিখ ও সময়"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
            </div>
          )}

          {(ceremony === 'annaprashan' || ceremony === 'grihapravesh') && (
            <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
              <input
                type="text"
                value={honoreeName}
                onChange={(e) => setHonoreeName(e.target.value)}
                placeholder={ceremony === 'annaprashan' ? 'শিশুর নাম' : 'অনুষ্ঠান / গৃহের নাম'}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              />
              <input
                type="text"
                value={honoreeParents}
                onChange={(e) => setHonoreeParents(e.target.value)}
                placeholder={ceremony === 'annaprashan' ? 'পিতা ও মাতার নাম' : 'গৃহস্বামী / পরিবারের প্রধান'}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
              <input
                type="text"
                value={eventScheduleLine1}
                onChange={(e) => setEventScheduleLine1(e.target.value)}
                placeholder="মূল অনুষ্ঠানের তারিখ ও সময়"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold"
              />
              <input
                type="text"
                value={eventScheduleLine2}
                onChange={(e) => setEventScheduleLine2(e.target.value)}
                placeholder="প্রীতিভোজ / প্রসাদ বিতরণের সময়"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
            </div>
          )}

          {/* Common Venue & Hosts */}
          <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
            <input
              type="text"
              value={venueAddress}
              onChange={(e) => setVenueAddress(e.target.value)}
              placeholder="অনুষ্ঠান স্থল / বাসভবনের সম্পূর্ণ ঠিকানা"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={hostsLine}
                onChange={(e) => setHostsLine(e.target.value)}
                placeholder={ceremony === 'shraddha' ? 'শোকার্ত পরিবারবর্গ' : 'বিনীত / নিবেদক'}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
              />
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="যোগাযোগের মোবাইল নম্বর"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
              />
            </div>
            <input
              type="text"
              value={footerNote}
              onChange={(e) => setFooterNote(e.target.value)}
              placeholder="শেষের নোট (যেমন: পত্রে ত্রুটি মার্জনীয়)"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
            />
          </div>
        </div>

        {/* Right Live A4 Sheet Preview */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="w-full max-w-[680px] bg-slate-200/70 dark:bg-slate-800/70 p-4 rounded-2xl overflow-x-auto">
            <div
              ref={printRef}
              style={{
                width: '100%',
                minHeight: '920px',
                backgroundColor: '#ffffff',
                padding: '18px',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: printMode === 'two-up-a4' ? 'space-between' : 'center',
                gap: printMode === 'two-up-a4' ? '14px' : '0px',
              }}
              className="shadow-xl mx-auto"
            >
              {printMode === 'two-up-a4' ? (
                <>
                  {renderCardSheet(true)}
                  <div
                    style={{
                      borderTop: '1.5px dashed #94a3b8',
                      textAlign: 'center',
                      fontSize: '9.5px',
                      color: '#64748b',
                      paddingTop: '2px',
                      letterSpacing: '0.1em',
                    }}
                  >
                    ✂ CUT HERE · এখান থেকে কাটুন ✂
                  </div>
                  {renderCardSheet(true)}
                </>
              ) : (
                renderCardSheet(false)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

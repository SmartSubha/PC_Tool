import React from 'react';
import {
  Image as ImageIcon,
  FileText,
  CreditCard,
  FileCheck2,
  HeartHandshake,
  Receipt,
  Minimize2,
  UserSquare2,
  Eraser,
  Maximize2,
  ArrowUpRight,
  RefreshCw,
  ShieldCheck,
  FilePlus2,
  FileDown,
  Images,
  Lock,
  ScanText,
  Files,
  Hash,
  Stamp,
  ArrowUpDown,
  FileMinus2,
  IdCard,
  Users,
  ScrollText,
  Sprout,
  QrCode,
  Sparkles,
  ScanLine,
  Landmark,
  GraduationCap,
  MapPinHouse,
  FileBadge2,
  Baby,
  HeartPulse,
  CalendarClock,
  FileSignature,
  Scale,
  Calculator,
  Grid2x2,
  Combine,
  ShieldAlert,
  Globe2,
  Highlighter,
  ClipboardCheck,
} from 'lucide-react';
import type { ToolCategoryId } from '../data/toolsCatalog';

interface CategoryIconProps {
  category: ToolCategoryId;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ category, className = 'w-6 h-6' }) => {
  switch (category) {
    case 'image':
      return <ImageIcon className={className} />;
    case 'pdf':
      return <FileText className={className} />;
    case 'id-card':
      return <CreditCard className={className} />;
    case 'documents':
      return <FileCheck2 className={className} />;
    case 'event-card':
      return <HeartHandshake className={className} />;
    case 'utility':
      return <Receipt className={className} />;
  }
};

interface ToolVisualIconProps {
  toolId: string;
  category: ToolCategoryId;
  size?: 'sm' | 'lg';
}

const TOOL_THEME: Record<string, { bg: string; fg: string; badge?: string }> = {
  // Bright, high-contrast vivid gradient badges
  'image-compress': { bg: 'from-violet-600 to-purple-700 border-violet-700 shadow-violet-500/30', fg: 'text-white' },
  'passport-size-photo': { bg: 'from-sky-500 to-blue-700 border-blue-700 shadow-sky-500/30', fg: 'text-white' },
  'bg-remover': { bg: 'from-fuchsia-500 to-pink-600 border-pink-700 shadow-pink-500/30', fg: 'text-white' },
  'resize-image': { bg: 'from-indigo-500 to-blue-600 border-indigo-700 shadow-indigo-500/30', fg: 'text-white' },
  'increase-image-size': { bg: 'from-emerald-500 to-teal-600 border-emerald-700 shadow-emerald-500/30', fg: 'text-white' },
  'universal-converter': { bg: 'from-amber-500 to-orange-600 border-orange-600 shadow-amber-500/30', fg: 'text-white' },
  'doc-scanner-cleaner': { bg: 'from-slate-800 to-zinc-950 border-slate-900 shadow-slate-700/30', fg: 'text-amber-300', badge: 'SCAN' },
  'photo-signature-combiner': { bg: 'from-cyan-600 to-blue-700 border-blue-800 shadow-cyan-500/30', fg: 'text-white', badge: 'JOIN' },
  'doc-watermark-protector': { bg: 'from-rose-600 to-red-700 border-red-800 shadow-rose-500/30', fg: 'text-white', badge: 'SAFE' },
  'batch-image-fixer': { bg: 'from-blue-600 to-indigo-700 border-indigo-800 shadow-blue-500/30', fg: 'text-white', badge: 'BATCH' },
  'doc-stamp-sign-placer': { bg: 'from-amber-500 to-rose-600 border-rose-700 shadow-amber-500/30', fg: 'text-white', badge: 'SIGN' },

  'multi-slip-xerox-saver': { bg: 'from-teal-600 to-emerald-700 border-emerald-800 shadow-teal-500/30', fg: 'text-white', badge: '2/4-IN-1' },
  'pdf-signature-verify': { bg: 'from-emerald-600 to-green-700 border-emerald-800 shadow-emerald-500/25', fg: 'text-white' },
  'image-to-pdf': { bg: 'from-rose-500 to-red-600 border-red-700 shadow-rose-500/25', fg: 'text-white' },
  'pdf-compress': { bg: 'from-purple-600 to-violet-700 border-purple-800 shadow-purple-500/25', fg: 'text-white' },
  'pdf-to-image': { bg: 'from-blue-500 to-cyan-600 border-blue-700 shadow-blue-500/25', fg: 'text-white' },
  'pdf-lock-unlock': { bg: 'from-amber-500 to-yellow-600 border-amber-700 shadow-amber-500/25', fg: 'text-white' },
  'pdf-ocr': { bg: 'from-teal-500 to-cyan-700 border-teal-700 shadow-teal-500/25', fg: 'text-white' },
  'pdf-merge': { bg: 'from-indigo-600 to-violet-700 border-indigo-800 shadow-indigo-500/25', fg: 'text-white' },
  'pdf-numbering': { bg: 'from-slate-700 to-slate-900 border-slate-950 shadow-slate-500/25', fg: 'text-white' },
  'pdf-watermark': { bg: 'from-pink-500 to-rose-600 border-pink-700 shadow-pink-500/25', fg: 'text-white' },
  'pdf-rearrange': { bg: 'from-violet-500 to-indigo-700 border-violet-800 shadow-violet-500/25', fg: 'text-white' },
  'pdf-remove-pages': { bg: 'from-red-500 to-orange-600 border-red-700 shadow-red-500/25', fg: 'text-white' },

  'aadhar-cropper': { bg: 'from-orange-500 to-amber-600 border-orange-700 shadow-orange-500/30', fg: 'text-white', badge: 'UIDAI' },
  'pan-cropper': { bg: 'from-sky-600 to-blue-700 border-blue-800 shadow-sky-500/30', fg: 'text-white', badge: 'PAN' },
  'voter-cropper': { bg: 'from-indigo-600 to-blue-800 border-indigo-900 shadow-indigo-500/30', fg: 'text-white', badge: 'EPIC' },
  'abha-cropper': { bg: 'from-cyan-500 to-teal-700 border-cyan-800 shadow-cyan-500/30', fg: 'text-white', badge: 'ABHA' },
  'ration-cropper': { bg: 'from-lime-600 to-green-700 border-green-800 shadow-lime-500/30', fg: 'text-white', badge: 'RC' },
  'multi-id-a4-grid': { bg: 'from-violet-600 to-fuchsia-700 border-fuchsia-800 shadow-violet-500/30', fg: 'text-white', badge: 'A4 GRID' },

  'wb-status-hub': { bg: 'from-sky-600 to-indigo-700 border-indigo-900 shadow-sky-500/30', fg: 'text-white', badge: 'WB HUB' },
  'wb-job-scheme-checklist': { bg: 'from-emerald-600 to-cyan-700 border-cyan-900 shadow-emerald-500/30', fg: 'text-white', badge: 'LIST' },
  'wb-lakshmir-bhandar': { bg: 'from-pink-600 to-rose-700 border-rose-800 shadow-rose-500/30', fg: 'text-white', badge: 'WB' },
  'wb-kanyashree-rupashree': { bg: 'from-fuchsia-600 to-purple-700 border-purple-800 shadow-fuchsia-500/30', fg: 'text-white', badge: 'WB' },
  'wb-caste-genealogy': { bg: 'from-amber-600 to-orange-700 border-orange-800 shadow-amber-500/30', fg: 'text-white', badge: 'WB' },
  'wb-land-mutation-warish': { bg: 'from-emerald-600 to-green-700 border-emerald-800 shadow-emerald-500/30', fg: 'text-white', badge: 'BLRO' },
  'late-registration-order': { bg: 'from-sky-600 to-indigo-700 border-indigo-800 shadow-sky-500/25', fg: 'text-white' },
  'pikpera-declaration': { bg: 'from-green-600 to-lime-700 border-green-800 shadow-green-500/25', fg: 'text-white' },
  'self-declaration-letter': { bg: 'from-violet-600 to-indigo-700 border-violet-800 shadow-violet-500/25', fg: 'text-white' },
  'age-declaration-letter': { bg: 'from-blue-600 to-indigo-700 border-blue-800 shadow-blue-500/25', fg: 'text-white' },
  'family-tree': { bg: 'from-emerald-500 to-teal-700 border-teal-800 shadow-emerald-500/25', fg: 'text-white' },
  'alive-declaration-letter': { bg: 'from-teal-500 to-cyan-700 border-teal-800 shadow-teal-500/25', fg: 'text-white' },
  'widow-declaration-letter': { bg: 'from-rose-600 to-pink-700 border-rose-800 shadow-rose-500/25', fg: 'text-white' },
  'deserted-declaration-letter': { bg: 'from-purple-600 to-fuchsia-700 border-purple-800 shadow-purple-500/25', fg: 'text-white' },
  'caste-affidavit-form17': { bg: 'from-amber-600 to-red-700 border-red-800 shadow-amber-500/25', fg: 'text-white' },
  'caste-affidavit-form3': { bg: 'from-indigo-600 to-purple-800 border-indigo-900 shadow-indigo-500/25', fg: 'text-white' },

  'marriage-biodata': { bg: 'from-rose-500 to-pink-600 border-rose-700 shadow-rose-500/30', fg: 'text-white' },
  'marriage-invitation': { bg: 'from-amber-500 to-rose-600 border-amber-700 shadow-amber-500/30', fg: 'text-white' },

  'invoice-maker': { bg: 'from-emerald-600 to-teal-700 border-emerald-800 shadow-emerald-500/30', fg: 'text-white', badge: 'BILL' },
  'qr-code-generator': { bg: 'from-slate-800 to-indigo-900 border-indigo-950 shadow-indigo-500/30', fg: 'text-white', badge: 'QR' },
  'age-land-calculator': { bg: 'from-amber-600 to-orange-700 border-orange-800 shadow-amber-500/30', fg: 'text-white', badge: 'CALC' },
};

export const ToolVisualIcon: React.FC<ToolVisualIconProps> = ({ toolId, category, size = 'lg' }) => {
  const theme = TOOL_THEME[toolId] || {
    bg:
      category === 'documents'
        ? 'from-indigo-600 to-violet-700 border-indigo-800 shadow-indigo-500/25'
        : 'from-violet-600 to-purple-700 border-violet-800 shadow-violet-500/25',
    fg: 'text-white',
  };

  const boxClass = size === 'sm' ? 'w-10 h-10 rounded-xl shadow-sm' : 'w-16 h-16 rounded-2xl shadow-md';
  const iconClass = size === 'sm' ? 'w-5 h-5' : 'w-8 h-8';

  const renderGlyph = () => {
    switch (toolId) {
      case 'image-compress':
        return <Minimize2 className={iconClass} />;
      case 'passport-size-photo':
        return <UserSquare2 className={iconClass} />;
      case 'bg-remover':
        return <Eraser className={iconClass} />;
      case 'resize-image':
        return <Maximize2 className={iconClass} />;
      case 'increase-image-size':
        return <ArrowUpRight className={iconClass} />;
      case 'universal-converter':
        return <RefreshCw className={iconClass} />;
      case 'doc-scanner-cleaner':
        return <ScanLine className={iconClass} />;
      case 'photo-signature-combiner':
        return <Combine className={iconClass} />;
      case 'doc-watermark-protector':
        return <ShieldAlert className={iconClass} />;
      case 'batch-image-fixer':
        return <RefreshCw className={iconClass} />;
      case 'doc-stamp-sign-placer':
        return <Highlighter className={iconClass} />;
      case 'multi-slip-xerox-saver':
        return <Grid2x2 className={iconClass} />;
      case 'multi-id-a4-grid':
        return <Grid2x2 className={iconClass} />;
      case 'wb-status-hub':
        return <Globe2 className={iconClass} />;
      case 'wb-job-scheme-checklist':
        return <ClipboardCheck className={iconClass} />;
      case 'age-land-calculator':
        return <Calculator className={iconClass} />;
      case 'pdf-signature-verify':
        return <ShieldCheck className={iconClass} />;
      case 'image-to-pdf':
        return <FilePlus2 className={iconClass} />;
      case 'pdf-compress':
        return <FileDown className={iconClass} />;
      case 'pdf-to-image':
        return <Images className={iconClass} />;
      case 'pdf-lock-unlock':
        return <Lock className={iconClass} />;
      case 'pdf-ocr':
        return <ScanText className={iconClass} />;
      case 'pdf-merge':
        return <Files className={iconClass} />;
      case 'pdf-numbering':
        return <Hash className={iconClass} />;
      case 'pdf-watermark':
        return <Stamp className={iconClass} />;
      case 'pdf-rearrange':
        return <ArrowUpDown className={iconClass} />;
      case 'pdf-remove-pages':
        return <FileMinus2 className={iconClass} />;
      case 'wb-lakshmir-bhandar':
        return <Landmark className={iconClass} />;
      case 'wb-kanyashree-rupashree':
        return <GraduationCap className={iconClass} />;
      case 'wb-caste-genealogy':
        return <FileBadge2 className={iconClass} />;
      case 'wb-land-mutation-warish':
        return <MapPinHouse className={iconClass} />;
      case 'late-registration-order':
        return <Baby className={iconClass} />;
      case 'pikpera-declaration':
        return <Sprout className={iconClass} />;
      case 'self-declaration-letter':
        return <FileSignature className={iconClass} />;
      case 'age-declaration-letter':
        return <CalendarClock className={iconClass} />;
      case 'family-tree':
        return <Users className={iconClass} />;
      case 'alive-declaration-letter':
        return <HeartPulse className={iconClass} />;
      case 'caste-affidavit-form17':
      case 'caste-affidavit-form3':
        return <Scale className={iconClass} />;
      case 'marriage-biodata':
        return <HeartHandshake className={iconClass} />;
      case 'marriage-invitation':
        return <Sparkles className={iconClass} />;
      case 'invoice-maker':
        return <Receipt className={iconClass} />;
      case 'qr-code-generator':
        return <QrCode className={iconClass} />;
      default:
        if (category === 'id-card') return <IdCard className={iconClass} />;
        if (category === 'documents') return <ScrollText className={iconClass} />;
        return <FileText className={iconClass} />;
    }
  };

  return (
    <div
      className={`${boxClass} bg-gradient-to-br ${theme.bg} border flex flex-col items-center justify-center relative shrink-0 ${theme.fg}`}
    >
      {renderGlyph()}
      {theme.badge && size === 'lg' && (
        <span className="mt-0.5 text-[9px] font-extrabold tracking-wider uppercase leading-none opacity-95">
          {theme.badge}
        </span>
      )}
    </div>
  );
};

import React, { useRef, useState } from 'react';
import {
  Printer,
  FileText,
  Upload,
  RotateCcw,
  Sparkles,
  GraduationCap,
  Trash2,
} from 'lucide-react';
import type { AppLang } from '../../data/i18n';
import { printElementHtml } from '../../utils/printHelper';

interface SchoolProjectCoverMakerProps {
  appLang: AppLang;
}

type BoardPreset = 'wb' | 'cbse' | 'college' | 'lab';
type BorderTheme = 'royal-gold' | 'emerald-modern' | 'heritage-maroon' | 'tech-indigo' | 'classic-bw';

const THEME_CONFIG: Record<
  BorderTheme,
  {
    nameEn: string;
    nameBn: string;
    primary: string;
    secondary: string;
    softBg: string;
    accentText: string;
    outerBorder: string;
    innerBorder: string;
  }
> = {
  'royal-gold': {
    nameEn: 'Royal Gold & Navy',
    nameBn: 'রয়্যাল গোল্ড ও নেভি',
    primary: '#1e3a8a',
    secondary: '#b45309',
    softBg: '#fffbeb',
    accentText: '#1e3a8a',
    outerBorder: '#1e3a8a',
    innerBorder: '#d97706',
  },
  'emerald-modern': {
    nameEn: 'Academic Emerald',
    nameBn: 'একাডেমিক এমারেল্ড',
    primary: '#065f46',
    secondary: '#0f766e',
    softBg: '#ecfdf5',
    accentText: '#065f46',
    outerBorder: '#065f46',
    innerBorder: '#10b981',
  },
  'heritage-maroon': {
    nameEn: 'Heritage Maroon',
    nameBn: 'ঐতিহ্যবাহী মেরুন',
    primary: '#881337',
    secondary: '#b45309',
    softBg: '#fff1f2',
    accentText: '#881337',
    outerBorder: '#881337',
    innerBorder: '#d97706',
  },
  'tech-indigo': {
    nameEn: 'Science & Tech Indigo',
    nameBn: 'সায়েন্স ও টেক ইন্ডিগো',
    primary: '#312e81',
    secondary: '#0284c7',
    softBg: '#eef2ff',
    accentText: '#312e81',
    outerBorder: '#312e81',
    innerBorder: '#0284c7',
  },
  'classic-bw': {
    nameEn: 'Ink-Saver B&W',
    nameBn: 'সাদা-কালো (কালি সেভার)',
    primary: '#111827',
    secondary: '#374151',
    softBg: '#f9fafb',
    accentText: '#111827',
    outerBorder: '#111827',
    innerBorder: '#4b5563',
  },
};

export const SchoolProjectCoverMaker: React.FC<SchoolProjectCoverMakerProps> = ({ appLang }) => {
  const isBn = appLang === 'bn';
  const [docLang, setDocLang] = useState<'en' | 'bn'>(appLang === 'bn' ? 'bn' : 'en');
  const [boardPreset, setBoardPreset] = useState<BoardPreset>('wb');
  const [theme, setTheme] = useState<BorderTheme>('royal-gold');

  // All inputs strictly empty by default
  const [institutionName, setInstitutionName] = useState('');
  const [boardOrUniv, setBoardOrUniv] = useState('');
  const [institutionAddress, setInstitutionAddress] = useState('');
  const [coverHeading, setCoverHeading] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [paperCode, setPaperCode] = useState('');
  const [projectTopic, setProjectTopic] = useState('');
  const [sessionYear, setSessionYear] = useState('');

  const [studentName, setStudentName] = useState('');
  const [classOrSem, setClassOrSem] = useState('');
  const [streamOrSection, setStreamOrSection] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [regNo, setRegNo] = useState('');

  const [teacherName, setTeacherName] = useState('');
  const [teacherDesignation, setTeacherDesignation] = useState('');
  const [submissionDate, setSubmissionDate] = useState('');

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState<number>(92);
  const [showSignatures, setShowSignatures] = useState<boolean>(true);
  const [showHeadSign, setShowHeadSign] = useState<boolean>(false);

  const previewRef = useRef<HTMLDivElement | null>(null);

  const activeTheme = THEME_CONFIG[theme];
  const isDocBn = docLang === 'bn';

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setLogoUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const applySample = () => {
    if (isDocBn) {
      setInstitutionName('বিদ্যাসাগর উচ্চ মাধ্যমিক বিদ্যালয়');
      setBoardOrUniv(
        boardPreset === 'college'
          ? 'কলকাতা বিশ্ববিদ্যালয় অনুমোদিত'
          : 'পশ্চিমবঙ্গ উচ্চ মাধ্যমিক শিক্ষা সংসদ (WBCHSE)'
      );
      setInstitutionAddress('বর্ধমান, পশ্চিমবঙ্গ - ৭১৩১০১');
      setCoverHeading(boardPreset === 'lab' ? 'ব্যবহারিক খাতা (প্র্যাক্টিক্যাল)' : 'প্রকল্প প্রতিবেদন');
      setSubjectName(boardPreset === 'lab' ? 'কম্পিউটার অ্যাপ্লিকেশন (ল্যাব)' : 'ভূগোল ও পরিবেশ');
      setPaperCode(boardPreset === 'college' ? 'GEOG-CC-04' : '');
      setProjectTopic('পশ্চিমবঙ্গের নদীমাতৃক ভূ-প্রকৃতি ও পরিবেশ সংরক্ষণ');
      setSessionYear('২০২৫ - ২০২৬');
      setStudentName('সৌম্যদীপ মুখার্জী');
      setClassOrSem(boardPreset === 'college' ? '৪র্থ সেমিস্টার (B.A. Honours)' : 'দ্বাদশ শ্রেণী (Class XII)');
      setStreamOrSection('কলা বিভাগ · সেকশন - ক');
      setRollNo('১২');
      setRegNo('৪১১২২৫০৯৮৭');
      setTeacherName('শ্রী অনির্বাণ সেনগুপ্ত');
      setTeacherDesignation('সহকারী শিক্ষক (ভূগোল বিভাগ)');
      setSubmissionDate('২০/১১/২০২৬');
    } else {
      setInstitutionName(
        boardPreset === 'college'
          ? 'ST. XAVIER’S DEGREE COLLEGE'
          : boardPreset === 'cbse'
          ? 'DELHI PUBLIC SENIOR SECONDARY SCHOOL'
          : 'NETAJI SUBHAS VIDYAPITH (H.S.)'
      );
      setBoardOrUniv(
        boardPreset === 'college'
          ? 'Affiliated to University of Calcutta'
          : boardPreset === 'cbse'
          ? 'Affiliated to CBSE, New Delhi'
          : 'West Bengal Council of Higher Secondary Education (WBCHSE)'
      );
      setInstitutionAddress('Kolkata, West Bengal - 700016');
      setCoverHeading(boardPreset === 'lab' ? 'PRACTICAL LAB MANUAL' : 'PROJECT REPORT');
      setSubjectName(boardPreset === 'lab' ? 'Computer Science Practical' : 'Environmental Studies');
      setPaperCode(boardPreset === 'college' ? 'ENVS-AECC-02' : '');
      setProjectTopic('Impact of Renewable Solar Energy in Rural West Bengal');
      setSessionYear('2025 – 2026');
      setStudentName('Ananya Chatterjee');
      setClassOrSem(boardPreset === 'college' ? 'B.Sc. 4th Semester' : 'Class XII');
      setStreamOrSection('Science · Section A');
      setRollNo('18');
      setRegNo('WB2025098412');
      setTeacherName('Prof. Debashis Banerjee');
      setTeacherDesignation('Department of Science');
      setSubmissionDate('20/11/2026');
    }
  };

  const handleReset = () => {
    setInstitutionName('');
    setBoardOrUniv('');
    setInstitutionAddress('');
    setCoverHeading('');
    setSubjectName('');
    setPaperCode('');
    setProjectTopic('');
    setSessionYear('');
    setStudentName('');
    setClassOrSem('');
    setStreamOrSection('');
    setRollNo('');
    setRegNo('');
    setTeacherName('');
    setTeacherDesignation('');
    setSubmissionDate('');
    setLogoUrl(null);
  };

  const defaultHeadingText = () => {
    if (coverHeading.trim()) return coverHeading.trim();
    if (isDocBn) {
      if (boardPreset === 'lab') return 'ব্যবহারিক খাতা (প্র্যাক্টিক্যাল ফাইল)';
      if (boardPreset === 'college') return 'সেমিস্টার প্রোজেক্ট রিপোর্ট';
      return 'প্রকল্প প্রতিবেদন (প্রোজেক্ট)';
    }
    if (boardPreset === 'lab') return 'PRACTICAL LAB FILE';
    if (boardPreset === 'college') return 'ACADEMIC PROJECT REPORT';
    return 'SCHOOL PROJECT FILE';
  };

  const handlePrint = () => {
    if (!previewRef.current) return;
    printElementHtml(
      previewRef.current,
      subjectName.trim() ? `${subjectName.trim()} - Project Cover` : 'Project Front Page'
    );
  };

  const handleDownloadWord = () => {
    if (!previewRef.current) return;
    const htmlDoc = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"><title>Project Cover Page</title>
      <style>
        body { font-family: 'Noto Sans Bengali', Georgia, serif; margin: 18px; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 7px 10px; font-size: 14px; }
      </style></head>
      <body>${previewRef.current.outerHTML}</body></html>`;
    const blob = new Blob(['\ufeff', htmlDoc], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(studentName.trim() || 'project-cover').replace(/\s+/g, '_')}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const blank = '___________________________';
  const v = (str: string) => (str.trim() ? str.trim() : blank);

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {(
              [
                { id: 'wb', label: 'WB Board (MP/HS)' },
                { id: 'cbse', label: 'CBSE / ICSE' },
                { id: 'college', label: 'College / Univ' },
                { id: 'lab', label: 'Lab Practical' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setBoardPreset(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  boardPreset === p.id
                    ? 'bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setDocLang('en')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                docLang === 'en'
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setDocLang('bn')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                docLang === 'bn'
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              বাংলা
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={applySample}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200 text-xs font-bold hover:bg-indigo-100 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isBn ? 'নমুনা ডেটা দিন' : 'Load Sample'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {isBn ? 'রিসেট' : 'Clear'}
          </button>
          <button
            type="button"
            onClick={handleDownloadWord}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            {isBn ? 'Word (.doc)' : 'Word (.doc)'}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            {isBn ? 'A4 প্রিন্ট করুন' : 'Print A4 Cover'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form Panel */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-5">
          {/* Border Theme Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              {isBn ? 'বর্ডার ও রঙের ডিজাইন বাছুন' : 'Select Border & Color Theme'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(THEME_CONFIG) as BorderTheme[]).map((tKey) => {
                const tc = THEME_CONFIG[tKey];
                return (
                  <button
                    key={tKey}
                    type="button"
                    onClick={() => setTheme(tKey)}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border-2 text-left text-xs font-bold transition-all cursor-pointer ${
                      theme === tKey
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-slate-950 dark:text-white'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-md shrink-0 border"
                      style={{ backgroundColor: tc.primary, borderColor: tc.secondary }}
                    />
                    <span className="truncate">{isBn ? tc.nameBn : tc.nameEn}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* School / College Details */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isBn ? '১. স্কুল / কলেজের তথ্য ও লোগো' : '1. Institution Details & Logo'}
            </h3>

            <input
              type="text"
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
              placeholder={isBn ? 'বিদ্যালয় / কলেজ / বিশ্ববিদ্যালয়ের নাম' : 'School / College / University Name'}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold focus:outline-none focus:border-indigo-500"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                value={boardOrUniv}
                onChange={(e) => setBoardOrUniv(e.target.value)}
                placeholder={isBn ? 'বোর্ড / বিশ্ববিদ্যালয় (যেমন WBCHSE)' : 'Board / University (e.g. WBCHSE / CBSE)'}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
              />
              <input
                type="text"
                value={institutionAddress}
                onChange={(e) => setInstitutionAddress(e.target.value)}
                placeholder={isBn ? 'ঠিকানা / পিন কোড' : 'Address / City & PIN'}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                {isBn ? 'স্কুল/কলেজ লোগো' : 'Upload Logo'}
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
              {logoUrl && (
                <>
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <span>{isBn ? 'সাইজ:' : 'Size:'}</span>
                    <input
                      type="range"
                      min={56}
                      max={140}
                      value={logoSize}
                      onChange={(e) => setLogoSize(Number(e.target.value))}
                      className="w-24 accent-indigo-600"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setLogoUrl(null)}
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                    title="Remove logo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Subject & Topic */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isBn ? '২. প্রোজেক্ট ও বিষয়ের বিবরণ' : '2. Subject & Project Details'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                value={coverHeading}
                onChange={(e) => setCoverHeading(e.target.value)}
                placeholder={isBn ? 'হেডিং (যেমন: প্রকল্প প্রতিবেদন)' : 'Cover Title (e.g. PROJECT REPORT)'}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
              />
              <input
                type="text"
                value={sessionYear}
                onChange={(e) => setSessionYear(e.target.value)}
                placeholder={isBn ? 'শিক্ষাবর্ষ (যেমন: ২০২৫-২০২৬)' : 'Session (e.g. 2025–2026)'}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder={isBn ? 'বিষয় (Subject)' : 'Subject Name'}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
              />
              <input
                type="text"
                value={paperCode}
                onChange={(e) => setPaperCode(e.target.value)}
                placeholder={isBn ? 'পেপার কোড (ঐচ্ছিক)' : 'Paper / Subject Code (Optional)'}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
              />
            </div>
            <textarea
              rows={2}
              value={projectTopic}
              onChange={(e) => setProjectTopic(e.target.value)}
              placeholder={isBn ? 'প্রোজেক্টের মূল শিরোনাম / টপিক লিখুন...' : 'Project Topic / Experiment Title...'}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium resize-none"
            />
          </div>

          {/* Student & Guide Info */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isBn ? '৩. ছাত্র/ছাত্রী ও শিক্ষকের তথ্য' : '3. Student & Guide Information'}
            </h3>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder={isBn ? 'ছাত্র/ছাত্রীর পুরো নাম' : 'Student Full Name'}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
            />
            <div className="grid grid-cols-2 gap-2.5">
              <input
                type="text"
                value={classOrSem}
                onChange={(e) => setClassOrSem(e.target.value)}
                placeholder={isBn ? 'শ্রেণী / সেমিস্টার' : 'Class / Semester'}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
              />
              <input
                type="text"
                value={streamOrSection}
                onChange={(e) => setStreamOrSection(e.target.value)}
                placeholder={isBn ? 'বিভাগ / সেকশন' : 'Stream / Section'}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
              />
              <input
                type="text"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                placeholder={isBn ? 'রোল নম্বর' : 'Roll Number'}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
              />
              <input
                type="text"
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
                placeholder={isBn ? 'রেজিস্ট্রেশন নম্বর' : 'Registration Number'}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder={isBn ? 'শিক্ষক / গাইডের নাম' : 'Submitted To (Teacher / Guide)'}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
              />
              <input
                type="text"
                value={teacherDesignation}
                onChange={(e) => setTeacherDesignation(e.target.value)}
                placeholder={isBn ? 'পদবি / বিভাগ' : 'Designation / Dept'}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="text"
                value={submissionDate}
                onChange={(e) => setSubmissionDate(e.target.value)}
                placeholder={isBn ? 'জমা দেওয়ার তারিখ' : 'Submission Date'}
                className="w-36 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
              />
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSignatures}
                  onChange={(e) => setShowSignatures(e.target.checked)}
                  className="accent-indigo-600"
                />
                {isBn ? 'স্বাক্ষর লাইন' : 'Signature Lines'}
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showHeadSign}
                  onChange={(e) => setShowHeadSign(e.target.checked)}
                  className="accent-indigo-600"
                />
                {isBn ? 'প্রধান শিক্ষক/সিল' : 'Head/Principal'}
              </label>
            </div>
          </div>
        </div>

        {/* Right Live A4 Preview */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="w-full max-w-[680px] bg-slate-200/70 dark:bg-slate-800/70 p-4 rounded-2xl overflow-x-auto">
            <div
              ref={previewRef}
              style={{
                width: '100%',
                minHeight: '920px',
                backgroundColor: '#ffffff',
                color: '#111827',
                padding: '22px',
                position: 'relative',
                boxSizing: 'border-box',
                fontFamily: "'Noto Sans Bengali', 'Georgia', serif",
              }}
              className="shadow-xl mx-auto"
            >
              {/* Outer Decorative Frame */}
              <div
                style={{
                  border: `4px solid ${activeTheme.outerBorder}`,
                  padding: '8px',
                  minHeight: '876px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Inner Decorative Frame */}
                <div
                  style={{
                    border: `1.5px solid ${activeTheme.innerBorder}`,
                    padding: '28px 30px',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative',
                  }}
                >
                  {/* 4 Corner SVG Ornaments */}
                  {[
                    { top: 6, left: 6, rot: 0 },
                    { top: 6, right: 6, rot: 90 },
                    { bottom: 6, right: 6, rot: 180 },
                    { bottom: 6, left: 6, rot: 270 },
                  ].map((corner, idx) => (
                    <svg
                      key={idx}
                      width="38"
                      height="38"
                      viewBox="0 0 40 40"
                      style={{
                        position: 'absolute',
                        top: corner.top,
                        bottom: corner.bottom,
                        left: corner.left,
                        right: corner.right,
                        transform: `rotate(${corner.rot}deg)`,
                      }}
                    >
                      <path
                        d="M2 2 L34 2 L34 6 L6 6 L6 34 L2 34 Z"
                        fill={activeTheme.outerBorder}
                      />
                      <path
                        d="M10 10 L24 10 L24 12.5 L12.5 12.5 L12.5 24 L10 24 Z"
                        fill={activeTheme.innerBorder}
                      />
                      <circle cx="17" cy="17" r="2.2" fill={activeTheme.innerBorder} />
                    </svg>
                  ))}

                  {/* TOP: Institution Header */}
                  <div style={{ textAlign: 'center', paddingTop: '10px' }}>
                    <h1
                      style={{
                        fontSize: '24px',
                        fontWeight: 900,
                        color: activeTheme.primary,
                        letterSpacing: '0.02em',
                        lineHeight: 1.25,
                        margin: 0,
                      }}
                    >
                      {institutionName.trim() ||
                        (isDocBn ? 'বিদ্যালয় / কলেজের নাম' : 'INSTITUTION / SCHOOL NAME')}
                    </h1>
                    {boardOrUniv.trim() && (
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: activeTheme.secondary,
                          marginTop: '6px',
                        }}
                      >
                        {boardOrUniv.trim()}
                      </div>
                    )}
                    {institutionAddress.trim() && (
                      <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '3px' }}>
                        {institutionAddress.trim()}
                      </div>
                    )}

                    {/* Center Emblem / Logo */}
                    <div
                      style={{
                        margin: '20px auto 14px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt="Institution Logo"
                          style={{
                            width: `${logoSize}px`,
                            height: `${logoSize}px`,
                            objectFit: 'contain',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '76px',
                            height: '76px',
                            borderRadius: '9999px',
                            border: `2px dashed ${activeTheme.innerBorder}`,
                            backgroundColor: activeTheme.softBg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: activeTheme.primary,
                          }}
                        >
                          <GraduationCap className="w-9 h-9" />
                        </div>
                      )}
                    </div>

                    {/* Cover Heading Banner */}
                    <div
                      style={{
                        display: 'inline-block',
                        padding: '8px 28px',
                        borderTop: `2px solid ${activeTheme.primary}`,
                        borderBottom: `2px solid ${activeTheme.primary}`,
                        backgroundColor: activeTheme.softBg,
                        marginTop: '4px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '19px',
                          fontWeight: 900,
                          color: activeTheme.primary,
                          letterSpacing: '0.06em',
                        }}
                      >
                        {defaultHeadingText()}
                      </div>
                    </div>

                    {sessionYear.trim() && (
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: '#374151',
                          marginTop: '8px',
                        }}
                      >
                        {isDocBn ? `শিক্ষাবর্ষ: ${sessionYear.trim()}` : `Academic Session: ${sessionYear.trim()}`}
                      </div>
                    )}
                  </div>

                  {/* MIDDLE: Subject & Topic Box */}
                  <div
                    style={{
                      margin: '20px 0',
                      padding: '18px 20px',
                      border: `1.5px solid ${activeTheme.innerBorder}`,
                      backgroundColor: activeTheme.softBg,
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 800,
                        color: activeTheme.secondary,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {isDocBn ? 'বিষয় (Subject)' : 'SUBJECT'}
                      {paperCode.trim() ? ` · ${paperCode.trim()}` : ''}
                    </div>
                    <div
                      style={{
                        fontSize: '19px',
                        fontWeight: 900,
                        color: activeTheme.primary,
                        marginTop: '4px',
                      }}
                    >
                      {subjectName.trim() || (isDocBn ? 'বিষয়ের নাম' : 'Subject Name')}
                    </div>

                    <div
                      style={{
                        height: '1px',
                        backgroundColor: activeTheme.innerBorder,
                        width: '55%',
                        margin: '12px auto',
                        opacity: 0.5,
                      }}
                    />

                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        color: '#4b5563',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {isDocBn ? 'প্রকল্পের শিরোনাম (Topic)' : 'TOPIC / TITLE'}
                    </div>
                    <div
                      style={{
                        fontSize: '16px',
                        fontWeight: 800,
                        color: '#111827',
                        marginTop: '5px',
                        lineHeight: 1.45,
                      }}
                    >
                      {projectTopic.trim()
                        ? `“${projectTopic.trim()}”`
                        : isDocBn
                        ? 'এখানে প্রোজেক্টের মূল শিরোনাম বসবে'
                        : 'Project Topic Title Appears Here'}
                    </div>
                  </div>

                  {/* STUDENT & TEACHER DETAILS */}
                  <div
                    style={{
                      border: `1px solid ${activeTheme.outerBorder}`,
                      padding: '16px 20px',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: 900,
                        color: activeTheme.primary,
                        borderBottom: `1.5px solid ${activeTheme.innerBorder}`,
                        paddingBottom: '6px',
                        marginBottom: '10px',
                        textAlign: 'center',
                      }}
                    >
                      {isDocBn ? 'ছাত্র / ছাত্রীর পরিচিতি (Submitted By)' : 'SUBMITTED BY (STUDENT DETAILS)'}
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                      <tbody>
                        {[
                          [isDocBn ? 'নাম' : 'Student Name', v(studentName)],
                          [isDocBn ? 'শ্রেণী / সেমিস্টার' : 'Class / Semester', v(classOrSem)],
                          [isDocBn ? 'বিভাগ / সেকশন' : 'Stream / Section', v(streamOrSection)],
                          [isDocBn ? 'রোল নম্বর' : 'Roll Number', v(rollNo)],
                          [isDocBn ? 'রেজিস্ট্রেশন নং' : 'Registration No.', v(regNo)],
                        ].map(([label, val], i) => (
                          <tr key={i}>
                            <td style={{ padding: '4.5px 6px', fontWeight: 700, width: '38%', color: '#374151' }}>
                              {label}
                            </td>
                            <td style={{ padding: '4.5px 4px', fontWeight: 700, width: '4%' }}>:</td>
                            <td style={{ padding: '4.5px 6px', fontWeight: 800, color: '#111827' }}>{val}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {(teacherName.trim() || teacherDesignation.trim() || submissionDate.trim()) && (
                      <div
                        style={{
                          marginTop: '12px',
                          paddingTop: '10px',
                          borderTop: '1px dashed #cbd5e1',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-end',
                          fontSize: '12.5px',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 800, color: activeTheme.secondary }}>
                            {isDocBn ? 'তত্ত্বাবধানে (Submitted To):' : 'Guided / Submitted To:'}
                          </div>
                          <div style={{ fontWeight: 800, color: '#111827', marginTop: '2px' }}>
                            {teacherName.trim() || '__________________'}
                          </div>
                          {teacherDesignation.trim() && (
                            <div style={{ fontSize: '11.5px', color: '#4b5563' }}>{teacherDesignation.trim()}</div>
                          )}
                        </div>
                        {submissionDate.trim() && (
                          <div style={{ textAlign: 'right', fontWeight: 700, color: '#374151' }}>
                            {isDocBn ? 'তারিখ: ' : 'Date: '}
                            {submissionDate.trim()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* BOTTOM SIGNATURES */}
                  {showSignatures && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        paddingTop: '44px',
                        paddingBottom: '6px',
                        gap: '16px',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#1f2937',
                      }}
                    >
                      <div style={{ textAlign: 'center', flex: 1 }}>
                        <div style={{ borderTop: `1.5px solid ${activeTheme.primary}`, paddingTop: '6px' }}>
                          {isDocBn ? 'ছাত্র / ছাত্রীর স্বাক্ষর' : "Student's Signature"}
                        </div>
                      </div>
                      {showHeadSign && (
                        <div style={{ textAlign: 'center', flex: 1 }}>
                          <div style={{ borderTop: `1.5px solid ${activeTheme.primary}`, paddingTop: '6px' }}>
                            {isDocBn ? 'প্রধান শিক্ষক / সিল' : 'Head of Institution'}
                          </div>
                        </div>
                      )}
                      <div style={{ textAlign: 'center', flex: 1 }}>
                        <div style={{ borderTop: `1.5px solid ${activeTheme.primary}`, paddingTop: '6px' }}>
                          {isDocBn ? 'শিক্ষক / পরীক্ষকের স্বাক্ষর' : "Teacher's / Examiner's Sign"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

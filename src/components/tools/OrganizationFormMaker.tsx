import React, { useRef, useState } from 'react';
import {
  Printer,
  Upload,
  RotateCcw,
  Plus,
  Trash2,
  Building2,
  Scissors,
  Camera,
} from 'lucide-react';
import type { AppLang } from '../../data/i18n';
import { printElementHtml } from '../../utils/printHelper';

interface OrganizationFormMakerProps {
  appLang: AppLang;
}

type FormMode = 'admission' | 'renewal' | 'membership';
type FormLangMode = 'en' | 'bn' | 'bilingual';

interface CustomFieldItem {
  id: string;
  label: string;
}

export const OrganizationFormMaker: React.FC<OrganizationFormMakerProps> = ({ appLang }) => {
  const isUiBn = appLang === 'bn';
  const printAreaRef = useRef<HTMLDivElement | null>(null);

  // Configuration switches
  const [formMode, setFormMode] = useState<FormMode>('admission');
  const [formLang, setFormLang] = useState<FormLangMode>(isUiBn ? 'bilingual' : 'en');
  const [photoBoxCount, setPhotoBoxCount] = useState<1 | 2>(1);
  const [includeGuardianSection, setIncludeGuardianSection] = useState<boolean>(true);
  const [includeAddressSection, setIncludeAddressSection] = useState<boolean>(true);
  const [includeCourseSection, setIncludeCourseSection] = useState<boolean>(true);
  const [includeDocsChecklist, setIncludeDocsChecklist] = useState<boolean>(true);

  // Organization Header fields (STRICTLY EMPTY by default)
  const [orgName, setOrgName] = useState('');
  const [orgSubtitle, setOrgSubtitle] = useState('');
  const [orgRegNo, setOrgRegNo] = useState('');
  const [orgAddress, setOrgAddress] = useState('');
  const [orgContact, setOrgContact] = useState('');
  const [sessionYear, setSessionYear] = useState('');
  const [formSerialNo, setFormSerialNo] = useState('');
  const [orgLogoUrl, setOrgLogoUrl] = useState<string | null>(null);

  // Optional digital fill-in fields (STRICTLY EMPTY by default — renders clean write-in blanks when empty)
  const [candidateName, setCandidateName] = useState('');
  const [candidateDob, setCandidateDob] = useState('');
  const [candidateGender, setCandidateGender] = useState('');
  const [candidateMobile, setCandidateMobile] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidateIdNo, setCandidateIdNo] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianRelation, setGuardianRelation] = useState('');
  const [guardianMobile, setGuardianMobile] = useState('');
  const [guardianOccupation, setGuardianOccupation] = useState('');
  const [presentAddress, setPresentAddress] = useState('');
  const [courseOrPlan, setCourseOrPlan] = useState('');
  const [previousMemberId, setPreviousMemberId] = useState('');
  const [lastRenewalDate, setLastRenewalDate] = useState('');
  const [customDeclaration, setCustomDeclaration] = useState('');

  // Custom extra write-in fields
  const [customFields, setCustomFields] = useState<CustomFieldItem[]>([]);
  const [newFieldLabel, setNewFieldLabel] = useState('');

  const handleLogoUpload = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setOrgLogoUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleAddCustomField = () => {
    if (!newFieldLabel.trim()) return;
    setCustomFields((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, label: newFieldLabel.trim() },
    ]);
    setNewFieldLabel('');
  };

  const handleResetAll = () => {
    setOrgName('');
    setOrgSubtitle('');
    setOrgRegNo('');
    setOrgAddress('');
    setOrgContact('');
    setSessionYear('');
    setFormSerialNo('');
    setOrgLogoUrl(null);
    setCandidateName('');
    setCandidateDob('');
    setCandidateGender('');
    setCandidateMobile('');
    setCandidateEmail('');
    setCandidateIdNo('');
    setGuardianName('');
    setGuardianRelation('');
    setGuardianMobile('');
    setGuardianOccupation('');
    setPresentAddress('');
    setCourseOrPlan('');
    setPreviousMemberId('');
    setLastRenewalDate('');
    setCustomDeclaration('');
    setCustomFields([]);
    setNewFieldLabel('');
  };

  const L = (en: string, bn: string) => {
    if (formLang === 'bn') return bn;
    if (formLang === 'bilingual') return `${en} / ${bn}`;
    return en;
  };

  const formBannerTitle = (() => {
    if (formMode === 'admission') return L('ADMISSION FORM', 'ভর্তি আবেদনপত্র');
    if (formMode === 'renewal') return L('RENEWAL APPLICATION FORM', 'নবীকরণ (RENEWAL) আবেদনপত্র');
    return L('MEMBERSHIP REGISTRATION FORM', 'সদস্য নিবন্ধন আবেদনপত্র');
  })();

  const defaultDeclarationText =
    formLang === 'bn'
      ? 'আমি সজ্ঞানে ঘোষণা করিতেছি যে, উপরে প্রদত্ত সমস্ত তথ্য সম্পূর্ণ সত্য ও সঠিক। প্রতিষ্ঠানের সমস্ত নিয়ম-শৃঙ্খলা মানিয়া চলিতে আমি বাধ্য থাকিব। কোনো তথ্য অসত্য প্রমাণিত হইলে আমার ভর্তি/সদস্যপদ বাতিল বলিয়া গণ্য হইবে।'
      : 'I hereby declare that all particulars furnished above are true, complete, and correct to the best of my knowledge. I agree to abide by all rules, discipline, and fee regulations of the organization.';

  return (
    <div className="space-y-6">
      {/* Studio Command Header */}
      <div className="bg-slate-950 text-white border-2 border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white">
              {isUiBn
                ? 'অর্গানাইজেশন ভর্তি ও নবীকরণ ফর্ম মেকার (A4 Official)'
                : 'Organization Admission & Renewal Form Creator (A4 Official)'}
            </h2>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              {isUiBn
                ? 'স্কুল, কোচিং, ক্লাব, কম্পিউটার সেন্টার বা সংস্থার জন্য পাসপোর্ট ছবির বক্স, ছাত্র ও অভিভাবকের স্বাক্ষর এবং নিচে "FOR OFFICE USE ONLY" বক্সসহ প্রফেশনাল ফর্ম।'
                : 'Generate printable official admission, renewal & membership forms with dedicated photo paste box, student & guardian signature slots, and an Office Use Only block.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleResetAll}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isUiBn ? 'সব খালি করুন' : 'Reset All'}</span>
          </button>
          <button
            type="button"
            onClick={() =>
              printElementHtml(
                printAreaRef.current,
                orgName.trim() ? `${orgName.trim()} - ${formMode} Form` : 'Organization Official Form'
              )
            }
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-black cursor-pointer shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>{isUiBn ? 'A4 ফর্ম প্রিন্ট / PDF' : 'Print A4 Form / PDF'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT EDITOR PANEL */}
        <div className="xl:col-span-5 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-2xl p-5 space-y-5 shadow-xs">
          {/* Form Type & Language */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-black text-slate-950 dark:text-amber-300 mb-1.5">
                {isUiBn ? '১. ফর্মের ধরন বাছাই করুন' : '1. Form Type'}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: 'admission', en: 'Admission', bn: 'ভর্তি ফর্ম' },
                    { id: 'renewal', en: 'Renewal', bn: 'নবীকরণ' },
                    { id: 'membership', en: 'Membership', bn: 'সদস্য ফর্ম' },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setFormMode(m.id)}
                    className={`py-2 px-2 rounded-xl text-xs font-black border-2 cursor-pointer transition-colors ${
                      formMode === m.id
                        ? 'bg-slate-950 dark:bg-amber-400 text-white dark:text-slate-950 border-slate-950 dark:border-amber-400'
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {isUiBn ? m.bn : m.en}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1">
                  {isUiBn ? 'ফর্মের ভাষা' : 'Form Language'}
                </label>
                <select
                  value={formLang}
                  onChange={(e) => setFormLang(e.target.value as FormLangMode)}
                  className="w-full px-3 py-2 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-950 dark:text-white text-xs font-bold"
                >
                  <option value="en">English Only</option>
                  <option value="bn">বাংলা (Bengali Only)</option>
                  <option value="bilingual">Bilingual (EN + বাংলা)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1">
                  {isUiBn ? 'ছবির বক্স সংখ্যা' : 'Photo Attach Boxes'}
                </label>
                <select
                  value={photoBoxCount}
                  onChange={(e) => setPhotoBoxCount(Number(e.target.value) as 1 | 2)}
                  className="w-full px-3 py-2 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-950 dark:text-white text-xs font-bold"
                >
                  <option value={1}>1 Box (Student/Applicant)</option>
                  <option value={2}>2 Boxes (Student + Guardian)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Organization Identity Inputs (all empty initially) */}
          <div className="space-y-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="text-xs font-black text-slate-950 dark:text-amber-300">
              {isUiBn ? '২. প্রতিষ্ঠানের তথ্য (Organization Details)' : '2. Organization Header Details'}
            </div>

            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder={isUiBn ? 'প্রতিষ্ঠানের নাম (যেমন: বিবেকানন্দ কম্পিউটার সেন্টার)' : 'Organization / Institute / Club Name'}
              className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-950 dark:text-white text-xs font-bold focus:outline-none focus:border-slate-950 dark:focus:border-amber-400"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={orgSubtitle}
                onChange={(e) => setOrgSubtitle(e.target.value)}
                placeholder={isUiBn ? 'সাব-টাইটেল / অনুমোদন তথ্য' : 'Affiliation / Tagline (Optional)'}
                className="px-3 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-950 dark:text-white text-xs font-semibold"
              />
              <input
                type="text"
                value={orgRegNo}
                onChange={(e) => setOrgRegNo(e.target.value)}
                placeholder={isUiBn ? 'রেজিস্ট্রেশন নম্বর (Regd. No.)' : 'Govt. Regd. No. / Est. Year'}
                className="px-3 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-950 dark:text-white text-xs font-semibold"
              />
            </div>
            <input
              type="text"
              value={orgAddress}
              onChange={(e) => setOrgAddress(e.target.value)}
              placeholder={isUiBn ? 'প্রতিষ্ঠানের সম্পূর্ণ ঠিকানা' : 'Full Organization Address & PIN'}
              className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-950 dark:text-white text-xs font-semibold"
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                value={orgContact}
                onChange={(e) => setOrgContact(e.target.value)}
                placeholder={isUiBn ? 'ফোন / ইমেইল' : 'Phone / Email'}
                className="px-3 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-950 dark:text-white text-xs font-semibold"
              />
              <input
                type="text"
                value={sessionYear}
                onChange={(e) => setSessionYear(e.target.value)}
                placeholder={isUiBn ? 'শিক্ষাবর্ষ / সেশন' : 'Session (e.g. 2026-27)'}
                className="px-3 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-950 dark:text-white text-xs font-semibold"
              />
              <input
                type="text"
                value={formSerialNo}
                onChange={(e) => setFormSerialNo(e.target.value)}
                placeholder={isUiBn ? 'ফর্ম নং (ঐচ্ছিক)' : 'Form Sl. No.'}
                className="px-3 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-950 dark:text-white text-xs font-semibold"
              />
            </div>

            {/* Optional Org Logo Upload */}
            <div className="flex items-center gap-2">
              <label className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border-2 border-dashed border-slate-400 dark:border-slate-600 hover:border-slate-950 dark:hover:border-amber-400 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>
                  {orgLogoUrl
                    ? isUiBn
                      ? 'প্রতিষ্ঠানের লোগো বদলান'
                      : 'Change Organization Logo'
                    : isUiBn
                    ? 'প্রতিষ্ঠানের লোগো আপলোড (ঐচ্ছিক)'
                    : 'Upload Organization Logo (Optional)'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleLogoUpload(e.target.files?.[0])}
                  className="hidden"
                />
              </label>
              {orgLogoUrl && (
                <button
                  type="button"
                  onClick={() => setOrgLogoUrl(null)}
                  className="px-2.5 py-2 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs font-bold cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Section Visibility Checkboxes */}
          <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="text-xs font-black text-slate-950 dark:text-amber-300">
              {isUiBn ? '৩. ফর্মের সেকশন কাস্টমাইজ করুন' : '3. Form Sections & Extra Write-In Rows'}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeGuardianSection}
                  onChange={(e) => setIncludeGuardianSection(e.target.checked)}
                  className="accent-slate-950 dark:accent-amber-400"
                />
                <span>Guardian Details</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAddressSection}
                  onChange={(e) => setIncludeAddressSection(e.target.checked)}
                  className="accent-slate-950 dark:accent-amber-400"
                />
                <span>Address Section</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeCourseSection}
                  onChange={(e) => setIncludeCourseSection(e.target.checked)}
                  className="accent-slate-950 dark:accent-amber-400"
                />
                <span>Course / Renewal Info</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeDocsChecklist}
                  onChange={(e) => setIncludeDocsChecklist(e.target.checked)}
                  className="accent-slate-950 dark:accent-amber-400"
                />
                <span>Docs Attached Box</span>
              </label>
            </div>

            {/* Custom Extra Blank Fields Adder */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={newFieldLabel}
                onChange={(e) => setNewFieldLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddCustomField();
                }}
                placeholder={isUiBn ? 'নতুন খালি ঘর যোগ করুন (যেমন: ব্লাড গ্রুপ / ব্যাচ)' : 'Add extra field (e.g. Blood Group, Batch Time)'}
                className="flex-1 px-3 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-950 dark:text-white text-xs font-semibold"
              />
              <button
                type="button"
                onClick={handleAddCustomField}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-950 dark:bg-amber-400 text-white dark:text-slate-950 text-xs font-black cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isUiBn ? 'যোগ' : 'Add'}</span>
              </button>
            </div>

            {customFields.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {customFields.map((cf) => (
                  <span
                    key={cf.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-bold"
                  >
                    <span>{cf.label}</span>
                    <button
                      type="button"
                      onClick={() => setCustomFields((prev) => prev.filter((x) => x.id !== cf.id))}
                      className="text-rose-500 hover:text-rose-700 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Optional Digital Fill-in (Leave blank to print empty write-in form) */}
          <details className="pt-3 border-t border-slate-200 dark:border-slate-800 group">
            <summary className="text-xs font-black text-slate-950 dark:text-amber-300 cursor-pointer select-none">
              {isUiBn
                ? '৪. আবেদনকারীর তথ্য কম্পিউটারে পূরণ (ঐচ্ছিক — খালি রাখলে ফাঁকা ফর্ম প্রিন্ট হবে)'
                : '4. Optional Digital Fill-In (Leave blank for clean hand-fillable form)'}
            </summary>
            <div className="mt-3 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="Student / Applicant Full Name"
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs"
                />
                <input
                  type="text"
                  value={candidateDob}
                  onChange={(e) => setCandidateDob(e.target.value)}
                  placeholder="Date of Birth (DD/MM/YYYY)"
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs"
                />
                <input
                  type="text"
                  value={candidateGender}
                  onChange={(e) => setCandidateGender(e.target.value)}
                  placeholder="Gender / Blood Group"
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs"
                />
                <input
                  type="text"
                  value={candidateMobile}
                  onChange={(e) => setCandidateMobile(e.target.value)}
                  placeholder="Applicant Mobile No."
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs"
                />
                <input
                  type="text"
                  value={candidateEmail}
                  onChange={(e) => setCandidateEmail(e.target.value)}
                  placeholder="Email ID"
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs"
                />
                <input
                  type="text"
                  value={candidateIdNo}
                  onChange={(e) => setCandidateIdNo(e.target.value)}
                  placeholder="Aadhaar / ID Number"
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs"
                />
                <input
                  type="text"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  placeholder="Father / Mother / Guardian Name"
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs"
                />
                <input
                  type="text"
                  value={guardianRelation}
                  onChange={(e) => setGuardianRelation(e.target.value)}
                  placeholder="Relation with Applicant"
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs"
                />
                <input
                  type="text"
                  value={guardianMobile}
                  onChange={(e) => setGuardianMobile(e.target.value)}
                  placeholder="Guardian Contact No."
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs"
                />
                <input
                  type="text"
                  value={guardianOccupation}
                  onChange={(e) => setGuardianOccupation(e.target.value)}
                  placeholder="Guardian Occupation"
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs"
                />
              </div>
              <input
                type="text"
                value={presentAddress}
                onChange={(e) => setPresentAddress(e.target.value)}
                placeholder="Present / Residential Address"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs"
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={courseOrPlan}
                  onChange={(e) => setCourseOrPlan(e.target.value)}
                  placeholder="Course / Class / Plan"
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs"
                />
                <input
                  type="text"
                  value={previousMemberId}
                  onChange={(e) => setPreviousMemberId(e.target.value)}
                  placeholder="Old ID / Roll (Renewal)"
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs"
                />
                <input
                  type="text"
                  value={lastRenewalDate}
                  onChange={(e) => setLastRenewalDate(e.target.value)}
                  placeholder="Valid Upto / Last Date"
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs"
                />
              </div>
              <textarea
                rows={2}
                value={customDeclaration}
                onChange={(e) => setCustomDeclaration(e.target.value)}
                placeholder="Custom Declaration / Rules text (optional)"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs"
              />
            </div>
          </details>
        </div>

        {/* RIGHT LIVE A4 PRINTABLE OFFICIAL FORM */}
        <div className="xl:col-span-7">
          <div
            ref={printAreaRef}
            className="print-area bg-white text-slate-950 border-2 border-slate-900 rounded-2xl p-6 sm:p-8 shadow-md space-y-5"
          >
            {/* Formal Double-Bordered Organization Letterhead */}
            <div className="border-b-2 border-slate-900 pb-4">
              <div className="flex items-start justify-between gap-4">
                {/* Optional Left Logo */}
                <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                  {orgLogoUrl ? (
                    <img
                      src={orgLogoUrl}
                      alt="Organization Logo"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg border border-dashed border-slate-400 flex items-center justify-center text-[9px] font-bold text-slate-400 text-center leading-tight p-1">
                      ORG LOGO
                    </div>
                  )}
                </div>

                {/* Centered Organization Title */}
                <div className="flex-1 text-center">
                  <div className="text-lg sm:text-xl font-black tracking-tight uppercase text-slate-950">
                    {orgName.trim() || 'ORGANIZATION / INSTITUTION NAME'}
                  </div>
                  {orgSubtitle.trim() && (
                    <div className="text-xs font-bold text-slate-700 mt-0.5">{orgSubtitle.trim()}</div>
                  )}
                  <div className="text-[11px] font-semibold text-slate-700 mt-0.5">
                    {orgAddress.trim() || 'Full Address, Post Office, District, West Bengal — PIN'}
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-[11px] font-bold text-slate-800 mt-1">
                    {orgRegNo.trim() && <span>Regd. No.: {orgRegNo.trim()}</span>}
                    {orgContact.trim() && <span>Contact: {orgContact.trim()}</span>}
                  </div>
                </div>

                {/* Right Form Meta */}
                <div className="w-28 shrink-0 text-right text-[10px] font-bold text-slate-700 space-y-1">
                  <div>
                    Form No:{' '}
                    <span className="inline-block min-w-[46px] border-b border-slate-600 text-center text-slate-950">
                      {formSerialNo.trim() || '\u00A0'}
                    </span>
                  </div>
                  <div>
                    Session:{' '}
                    <span className="inline-block min-w-[46px] border-b border-slate-600 text-center text-slate-950">
                      {sessionYear.trim() || '\u00A0'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Official Title Band */}
              <div className="mt-3 text-center">
                <span className="inline-block px-5 py-1 bg-slate-950 text-white text-xs sm:text-sm font-black tracking-wider uppercase rounded">
                  {formBannerTitle}
                </span>
              </div>
            </div>

            {/* Section 1 + Dedicated Blank Passport Photo Box(es) */}
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div className="flex-1 w-full space-y-2.5 text-xs">
                <div className="text-[11px] font-black uppercase tracking-wide bg-slate-100 border border-slate-300 px-2.5 py-1 text-slate-950">
                  1. {L('Applicant / Student Particulars', 'আবেদনকারী / ছাত্র-ছাত্রীর বিবরণ')}
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-end gap-2">
                    <span className="font-bold whitespace-nowrap">
                      {L('Full Name (Block Letters):', 'সম্পূর্ণ নাম:')}
                    </span>
                    <span className="flex-1 border-b border-slate-700 pb-0.5 font-bold uppercase min-h-[18px]">
                      {candidateName.trim()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-end gap-2">
                      <span className="font-bold whitespace-nowrap">{L('Date of Birth:', 'জন্ম তারিখ:')}</span>
                      <span className="flex-1 border-b border-slate-700 pb-0.5 font-semibold min-h-[18px]">
                        {candidateDob.trim()}
                      </span>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="font-bold whitespace-nowrap">{L('Gender / Blood Grp:', 'লিঙ্গ / ব্লাড গ্রুপ:')}</span>
                      <span className="flex-1 border-b border-slate-700 pb-0.5 font-semibold min-h-[18px]">
                        {candidateGender.trim()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-end gap-2">
                      <span className="font-bold whitespace-nowrap">{L('Mobile No.:', 'মোবাইল নং:')}</span>
                      <span className="flex-1 border-b border-slate-700 pb-0.5 font-mono font-bold min-h-[18px]">
                        {candidateMobile.trim()}
                      </span>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="font-bold whitespace-nowrap">{L('Aadhaar / ID No.:', 'আধার / আইডি নং:')}</span>
                      <span className="flex-1 border-b border-slate-700 pb-0.5 font-mono font-bold min-h-[18px]">
                        {candidateIdNo.trim()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-end gap-2">
                    <span className="font-bold whitespace-nowrap">{L('Email ID:', 'ইমেইল আইডি:')}</span>
                    <span className="flex-1 border-b border-slate-700 pb-0.5 font-semibold min-h-[18px]">
                      {candidateEmail.trim()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Dedicated Empty Passport Photo Paste Box(es) */}
              <div className="flex sm:flex-col gap-2.5 shrink-0 self-center sm:self-start">
                <div className="w-[116px] h-[142px] border-2 border-dashed border-slate-800 rounded-md flex flex-col items-center justify-center text-center p-2 bg-slate-50/40">
                  <Camera className="w-5 h-5 text-slate-400 mb-1" />
                  <div className="text-[9px] font-black uppercase text-slate-700 leading-tight">
                    {L('Affix Recent Passport Photo', 'পাসপোর্ট ছবি আঠা দিয়ে লাগান')}
                  </div>
                  <div className="text-[8px] font-semibold text-slate-500 mt-1">
                    3.5 × 4.5 cm
                  </div>
                  <div className="text-[8px] font-bold text-slate-500 mt-0.5">
                    (Do not staple)
                  </div>
                </div>

                {photoBoxCount === 2 && (
                  <div className="w-[116px] h-[132px] border-2 border-dashed border-slate-600 rounded-md flex flex-col items-center justify-center text-center p-2 bg-slate-50/40">
                    <div className="text-[9px] font-black uppercase text-slate-700 leading-tight">
                      {L('Guardian Passport Photo', 'অভিভাবকের পাসপোর্ট ছবি')}
                    </div>
                    <div className="text-[8px] font-semibold text-slate-500 mt-1">3.5 × 4.5 cm</div>
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: Guardian / Parent Details */}
            {includeGuardianSection && (
              <div className="space-y-2.5 text-xs">
                <div className="text-[11px] font-black uppercase tracking-wide bg-slate-100 border border-slate-300 px-2.5 py-1 text-slate-950">
                  2. {L('Father / Mother / Guardian Details', 'পিতা / মাতা / অভিভাবকের বিবরণ')}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
                  <div className="flex items-end gap-2">
                    <span className="font-bold whitespace-nowrap">{L('Guardian Name:', 'অভিভাবকের নাম:')}</span>
                    <span className="flex-1 border-b border-slate-700 pb-0.5 font-semibold min-h-[18px]">
                      {guardianName.trim()}
                    </span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="font-bold whitespace-nowrap">{L('Relationship:', 'সম্পর্ক:')}</span>
                    <span className="flex-1 border-b border-slate-700 pb-0.5 font-semibold min-h-[18px]">
                      {guardianRelation.trim()}
                    </span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="font-bold whitespace-nowrap">{L('Guardian Mobile:', 'অভিভাবকের ফোন:')}</span>
                    <span className="flex-1 border-b border-slate-700 pb-0.5 font-mono font-bold min-h-[18px]">
                      {guardianMobile.trim()}
                    </span>
                  </div>
                  <div className="flex items-end gap-2">
                    <span className="font-bold whitespace-nowrap">{L('Occupation:', 'পেশা:')}</span>
                    <span className="flex-1 border-b border-slate-700 pb-0.5 font-semibold min-h-[18px]">
                      {guardianOccupation.trim()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Section 3: Address */}
            {includeAddressSection && (
              <div className="space-y-2 text-xs">
                <div className="text-[11px] font-black uppercase tracking-wide bg-slate-100 border border-slate-300 px-2.5 py-1 text-slate-950">
                  3. {L('Residential Address', 'স্থায়ী ও বর্তমান ঠিকানা')}
                </div>
                <div className="flex items-end gap-2 pt-0.5">
                  <span className="font-bold whitespace-nowrap">{L('Full Address:', 'ঠিকানা:')}</span>
                  <span className="flex-1 border-b border-slate-700 pb-0.5 font-semibold min-h-[18px]">
                    {presentAddress.trim()}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 pt-0.5">
                  <div className="flex items-end gap-1.5">
                    <span className="font-bold">P.O.:</span>
                    <span className="flex-1 border-b border-slate-700 min-h-[16px]" />
                  </div>
                  <div className="flex items-end gap-1.5">
                    <span className="font-bold">P.S. / Dist.:</span>
                    <span className="flex-1 border-b border-slate-700 min-h-[16px]" />
                  </div>
                  <div className="flex items-end gap-1.5">
                    <span className="font-bold">PIN:</span>
                    <span className="flex-1 border-b border-slate-700 min-h-[16px]" />
                  </div>
                </div>
              </div>
            )}

            {/* Section 4: Course / Renewal / Custom Fields */}
            {(includeCourseSection || customFields.length > 0) && (
              <div className="space-y-2.5 text-xs">
                <div className="text-[11px] font-black uppercase tracking-wide bg-slate-100 border border-slate-300 px-2.5 py-1 text-slate-950">
                  4.{' '}
                  {formMode === 'renewal'
                    ? L('Renewal & Existing Registration Details', 'নবীকরণ ও পূর্বের রেজিস্ট্রেশন তথ্য')
                    : L('Course / Class / Plan & Additional Details', 'কোর্স / বিভাগ ও অতিরিক্ত বিবরণ')}
                </div>

                {includeCourseSection && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
                    <div className="flex items-end gap-2">
                      <span className="font-bold whitespace-nowrap">
                        {formMode === 'renewal'
                          ? L('Renewing Plan / Class:', 'নবীকরণ বিভাগ / কোর্স:')
                          : L('Applying For (Course/Class):', 'ভর্তির বিভাগ / কোর্স:')}
                      </span>
                      <span className="flex-1 border-b border-slate-700 pb-0.5 font-semibold min-h-[18px]">
                        {courseOrPlan.trim()}
                      </span>
                    </div>

                    {formMode === 'renewal' ? (
                      <>
                        <div className="flex items-end gap-2">
                          <span className="font-bold whitespace-nowrap">
                            {L('Previous Regd./ID No.:', 'পূর্বের আইডি নং:')}
                          </span>
                          <span className="flex-1 border-b border-slate-700 pb-0.5 font-mono font-bold min-h-[18px]">
                            {previousMemberId.trim()}
                          </span>
                        </div>
                        <div className="flex items-end gap-2 sm:col-span-2">
                          <span className="font-bold whitespace-nowrap">
                            {L('Previous Valid Upto / Last Fee Paid:', 'পূর্বের মেয়াদ / শেষ ফি দেওয়ার তারিখ:')}
                          </span>
                          <span className="flex-1 border-b border-slate-700 pb-0.5 font-semibold min-h-[18px]">
                            {lastRenewalDate.trim()}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-end gap-2">
                        <span className="font-bold whitespace-nowrap">
                          {L('Last Qualification / School:', 'শিক্ষাগত যোগ্যতা / স্কুল:')}
                        </span>
                        <span className="flex-1 border-b border-slate-700 pb-0.5 min-h-[18px]" />
                      </div>
                    )}
                  </div>
                )}

                {customFields.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {customFields.map((cf) => (
                      <div key={cf.id} className="flex items-end gap-2">
                        <span className="font-bold whitespace-nowrap">{cf.label}:</span>
                        <span className="flex-1 border-b border-slate-700 min-h-[18px]" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Documents Checklist Box */}
            {includeDocsChecklist && (
              <div className="text-[11px] border border-slate-300 rounded-lg p-2.5 bg-slate-50/50">
                <div className="font-black text-slate-900 mb-1.5">
                  {L('Enclosures Attached (Tick ✓):', 'সংযুক্ত নথিপত্র (টিক দিন ✓):')}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-semibold text-slate-800">
                  <span>[ &nbsp; ] Passport Photo (2)</span>
                  <span>[ &nbsp; ] Aadhaar / ID Copy</span>
                  <span>[ &nbsp; ] Last Marksheet / Proof</span>
                  <span>
                    [ &nbsp; ] {formMode === 'renewal' ? 'Previous ID / Receipt' : 'Birth / Age Proof'}
                  </span>
                </div>
              </div>
            )}

            {/* Declaration + Dedicated Student & Guardian Signature Boxes */}
            <div className="space-y-4 pt-1">
              <div className="text-[11px] leading-relaxed text-slate-800 border-t border-slate-300 pt-2.5">
                <span className="font-black uppercase mr-1">
                  {L('Declaration:', 'স্ব-ঘোষণাপত্র:')}
                </span>
                {customDeclaration.trim() || defaultDeclarationText}
              </div>

              <div className="grid grid-cols-2 gap-6 pt-3">
                {/* Student / Applicant Signature Box */}
                <div className="border border-slate-400 rounded-lg p-3 flex flex-col justify-between min-h-[82px]">
                  <div className="text-[10px] font-bold text-slate-500">
                    {L('Date:', 'তারিখ:')} _______________
                  </div>
                  <div className="border-t border-slate-800 pt-1 text-center text-[11px] font-black text-slate-950">
                    {L('Signature of Student / Applicant', 'ছাত্র-ছাত্রী / আবেদনকারীর স্বাক্ষর')}
                  </div>
                </div>

                {/* Guardian Signature Box */}
                <div className="border border-slate-400 rounded-lg p-3 flex flex-col justify-between min-h-[82px]">
                  <div className="text-[10px] font-bold text-slate-500">
                    {L('Date:', 'তারিখ:')} _______________
                  </div>
                  <div className="border-t border-slate-800 pt-1 text-center text-[11px] font-black text-slate-950">
                    {L('Signature of Parent / Guardian', 'অভিভাবকের পূর্ণ স্বাক্ষর')}
                  </div>
                </div>
              </div>
            </div>

            {/* Perforated Cut Line + FOR OFFICE USE ONLY Section */}
            <div className="pt-2 space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                <Scissors className="w-3.5 h-3.5 shrink-0" />
                <div className="flex-1 border-t-2 border-dashed border-slate-500" />
                <span className="font-bold uppercase tracking-wider">Official Section</span>
                <div className="flex-1 border-t-2 border-dashed border-slate-500" />
              </div>

              <div className="border-2 border-slate-900 rounded-lg overflow-hidden">
                <div className="bg-slate-900 text-white px-3 py-1.5 text-center text-xs font-black tracking-widest uppercase">
                  {L('FOR OFFICE USE ONLY', 'কেবলমাত্র অফিস কর্তৃক পূরণীয়')}
                </div>

                <div className="p-4 space-y-3 text-xs bg-slate-50/40">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex items-end gap-1.5">
                      <span className="font-bold whitespace-nowrap">Regd. / Roll No.:</span>
                      <span className="flex-1 border-b border-slate-700 min-h-[16px]" />
                    </div>
                    <div className="flex items-end gap-1.5">
                      <span className="font-bold whitespace-nowrap">Batch / Section:</span>
                      <span className="flex-1 border-b border-slate-700 min-h-[16px]" />
                    </div>
                    <div className="flex items-end gap-1.5">
                      <span className="font-bold whitespace-nowrap">Admission Date:</span>
                      <span className="flex-1 border-b border-slate-700 min-h-[16px]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex items-end gap-1.5">
                      <span className="font-bold whitespace-nowrap">Fee Paid (₹):</span>
                      <span className="flex-1 border-b border-slate-700 min-h-[16px]" />
                    </div>
                    <div className="flex items-end gap-1.5">
                      <span className="font-bold whitespace-nowrap">Receipt No.:</span>
                      <span className="flex-1 border-b border-slate-700 min-h-[16px]" />
                    </div>
                    <div className="flex items-end gap-1.5">
                      <span className="font-bold whitespace-nowrap">Mode:</span>
                      <span className="text-[11px] font-semibold">Cash / UPI / Bank</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 items-end">
                    <div className="space-y-1.5">
                      <div className="flex items-end gap-1.5">
                        <span className="font-bold whitespace-nowrap">Verified By:</span>
                        <span className="flex-1 border-b border-slate-700 min-h-[16px]" />
                      </div>
                      <div className="flex items-end gap-1.5">
                        <span className="font-bold whitespace-nowrap">Remarks:</span>
                        <span className="flex-1 border-b border-slate-700 min-h-[16px]" />
                      </div>
                    </div>

                    <div className="text-right pt-4">
                      <div className="inline-block min-w-[190px] border-t border-slate-900 pt-1 text-center text-[11px] font-black text-slate-950">
                        {L('Authorized Signatory & Official Seal', 'কর্তৃপক্ষের স্বাক্ষর ও সিলমোহর')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

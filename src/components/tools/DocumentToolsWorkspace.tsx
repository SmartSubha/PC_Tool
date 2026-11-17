import React, { useEffect, useRef, useState } from 'react';
import { Printer, Plus, Trash2, Upload, RotateCcw } from 'lucide-react';
import type { AppLang } from '../../data/i18n';
import { printElementHtml } from '../../utils/printHelper';
import { ChecklistGeneratorWorkspace } from './ChecklistGeneratorWorkspace';

interface DocumentToolsWorkspaceProps {
  toolId: string;
  toolName: string;
  appLang: AppLang;
  onOpenToolById?: (toolId: string) => void;
}

interface TreeMember {
  id: string;
  name: string;
  relation: string;
  generation: 1 | 2 | 3;
}

export const DocumentToolsWorkspace: React.FC<DocumentToolsWorkspaceProps> = ({
  toolId,
  toolName,
  appLang,
  onOpenToolById,
}) => {
  if (toolId === 'wb-job-scheme-checklist') {
    return <ChecklistGeneratorWorkspace appLang={appLang} onOpenToolById={onOpenToolById} />;
  }
  return <StandardDocumentToolsWorkspace toolId={toolId} toolName={toolName} appLang={appLang} />;
};

const StandardDocumentToolsWorkspace: React.FC<DocumentToolsWorkspaceProps> = ({
  toolId,
  toolName,
  appLang,
}) => {
  const isWbBengaliTemplate = toolId.startsWith('wb-');
  const [lang, setLang] = useState<AppLang>(isWbBengaliTemplate ? 'bn' : appLang);
  const printAreaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLang(toolId.startsWith('wb-') ? 'bn' : appLang);
  }, [appLang, toolId]);

  // All inputs start empty (never pre-filled)
  const [fullName, setFullName] = useState('');
  const [fatherOrSpouse, setFatherOrSpouse] = useState('');
  const [age, setAge] = useState('');
  const [dob, setDob] = useState('');
  const [aadhaarLast4, setAadhaarLast4] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [place, setPlace] = useState('');
  const [date, setDate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [extraField, setExtraField] = useState('');
  const [casteName, setCasteName] = useState('');
  const [bankInfo, setBankInfo] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const [treeMembers, setTreeMembers] = useState<TreeMember[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRel, setNewMemberRel] = useState('');
  const [newMemberGen, setNewMemberGen] = useState<1 | 2 | 3>(1);

  const isTreeTool =
    toolId === 'family-tree' ||
    toolId === 'caste-affidavit-form3' ||
    toolId === 'wb-caste-genealogy';

  const handleClearAll = () => {
    setFullName('');
    setFatherOrSpouse('');
    setAge('');
    setDob('');
    setAadhaarLast4('');
    setPhone('');
    setAddress('');
    setPlace('');
    setDate('');
    setPurpose('');
    setExtraField('');
    setCasteName('');
    setBankInfo('');
    setPhotoUrl(null);
    setTreeMembers([]);
  };

  const getDocumentHeading = (): { en: string; bn: string } => {
    switch (toolId) {
      case 'wb-lakshmir-bhandar':
        return {
          en: 'WEST BENGAL LAKSHMIR BHANDAR SELF-DECLARATION',
          bn: 'পশ্চিমবঙ্গ সরকার — লক্ষ্মীর ভাণ্ডার প্রকল্পের স্ব-ঘোষণাপত্র ও আবেদন',
        };
      case 'wb-kanyashree-rupashree':
        return {
          en: 'WEST BENGAL KANYASHREE / RUPASHREE SELF-DECLARATION',
          bn: 'কন্যাশ্রী / রূপশ্রী প্রকল্পের অবিবাহিত ও আয়ের স্ব-ঘোষণাপত্র',
        };
      case 'wb-caste-genealogy':
        return {
          en: 'WB CASTE CERTIFICATE & GENEALOGY APPLICATION',
          bn: 'জাতিগত শংসাপত্র (SC/ST/OBC) আবেদন ও বংশতালিকা ঘোষণাপত্র',
        };
      case 'wb-land-mutation-warish':
        return {
          en: 'BANGLARBHUMI MUTATION & WARISH DECLARATION',
          bn: 'জমির মিউটেশন / ওয়ারিশ শংসাপত্র সংক্রান্ত আবেদন ও স্ব-ঘোষণাপত্র',
        };
      case 'late-registration-order':
        return {
          en: 'APPLICATION FOR LATE BIRTH / DEATH REGISTRATION',
          bn: 'বিলম্বিত জন্ম / মৃত্যু নিবন্ধনের আবেদনপত্র ও স্ব-ঘোষণাপত্র',
        };
      case 'pikpera-declaration':
        return {
          en: 'PMFBY PIKPERA (CROP SOWING) SELF-DECLARATION',
          bn: 'ফসল বীমা যোজনা (PMFBY) স্ব-ঘোষণাপত্র',
        };
      case 'self-declaration-letter':
        return {
          en: 'RESIDENCE SELF-DECLARATION LETTER',
          bn: 'স্থায়ী বাসিন্দার স্ব-ঘোষণাপত্র (Residence Self-Declaration)',
        };
      case 'age-declaration-letter':
        return {
          en: 'AGE SELF-DECLARATION LETTER',
          bn: 'বয়সের স্ব-ঘোষণাপত্র (Age Self-Declaration)',
        };
      case 'family-tree':
        return {
          en: 'FAMILY TREE / GENEALOGY CERTIFICATE',
          bn: 'পারিবারিক বংশতালিকা স্ব-ঘোষণাপত্র',
        };
      case 'alive-declaration-letter':
        return {
          en: 'ALIVE / LIFE SELF-DECLARATION CERTIFICATE',
          bn: 'জীবিত থাকার স্ব-ঘোষণাপত্র (Life Certificate)',
        };
      case 'widow-declaration-letter':
        return {
          en: 'WIDOW SELF-DECLARATION LETTER',
          bn: 'বিধবা স্ব-ঘোষণাপত্র',
        };
      case 'deserted-declaration-letter':
        return {
          en: 'DESERTED WOMAN SELF-DECLARATION LETTER',
          bn: 'পরিত্যক্তা মহিলার স্ব-ঘোষণাপত্র',
        };
      case 'caste-affidavit-form17':
        return {
          en: 'CASTE SCRUTINY AFFIDAVIT (FORM-17)',
          bn: 'জাতিগত শংসাপত্র যাচাইয়ের হলফনামা (Form-17)',
        };
      case 'caste-affidavit-form3':
        return {
          en: 'CASTE AFFIDAVIT (FORM-3) WITH FAMILY TREE',
          bn: 'জাতিগত শংসাপত্রের হলফনামা ও বংশতালিকা (Form-3)',
        };
      default:
        return { en: toolName.toUpperCase(), bn: toolName };
    }
  };

  const heading = getDocumentHeading();
  const val = (s: string, fallback = '________________') => (s.trim() ? s.trim() : fallback);

  const renderBodyParagraphs = () => {
    if (lang === 'bn') {
      return (
        <div className="space-y-4 text-[14px] leading-relaxed text-slate-900">
          {isWbBengaliTemplate && (
            <div className="text-sm leading-relaxed space-y-1">
              <div>বরাবর,</div>
              <div className="font-bold">
                {toolId === 'wb-land-mutation-warish'
                  ? 'মাননীয় বি.এল. অ্যান্ড এল.আর.ও (BL&LRO) / গ্রাম পঞ্চায়েত প্রধান মহাশয়,'
                  : 'মাননীয় সমষ্টি উন্নয়ন আধিকারিক (BDO) / মহকুমা শাসক (SDO) মহাশয়,'}
              </div>
              <div>ঠিকানা: {val(address, '________________________________________')}</div>
              <div className="pt-1 font-bold underline">
                বিষয়: {heading.bn} সংক্রান্ত আবেদন ও স্ব-ঘোষণাপত্র।
              </div>
            </div>
          )}

          <p>
            আমি, <strong>{val(fullName)}</strong>, পিতা / স্বামীর নাম <strong>{val(fatherOrSpouse)}</strong>, বয়স{' '}
            <strong>{val(age, '____')}</strong> বছর, জন্ম তারিখ <strong>{val(dob, '__/__/____')}</strong>, আধার / ভোটার নম্বর{' '}
            <strong>{val(aadhaarLast4)}</strong>, মোবাইল নম্বর <strong>{val(phone, '__________')}</strong>, স্থায়ী ঠিকানা{' '}
            <strong>{val(address, '____________________________')}</strong>, এতদ্বারা সজ্ঞানে স্ব-ঘোষণা করিতেছি যে:
          </p>

          {toolId === 'wb-lakshmir-bhandar' && (
            <div className="space-y-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
              <p>
                ১) আমি পশ্চিমবঙ্গের একজন স্থায়ী বাসিন্দা এবং কোনো সরকারি/আধা-সরকারি চাকরিতে নিযুক্ত নই ও নিয়মিত পেনশন পাই না।
              </p>
              <p>
                ২) আমার স্বাস্থ্যসাথী কার্ড / জাতিগত বিবরণ: <strong>{val(extraField)}</strong> এবং আমার নিজস্ব একক ব্যাংক অ্যাকাউন্ট বিবরণ:{' '}
                <strong>{val(bankInfo)}</strong> (যা আধারের সাথে সংযুক্ত)।
              </p>
            </div>
          )}

          {toolId === 'wb-kanyashree-rupashree' && (
            <p>
              আমি একজন অবিবাহিতা ছাত্রী / কন্যা (বা রূপশ্রী প্রকল্পের আবেদনকারী)। আমার পরিবারিক বার্ষিক আয় ও শিক্ষাপ্রতিষ্ঠানের বিবরণ:{' '}
              <strong>{val(extraField)}</strong> এবং ব্যাংক অ্যাকাউন্ট তথ্য: <strong>{val(bankInfo)}</strong> সম্পূর্ণ সত্য।
            </p>
          )}

          {toolId === 'wb-land-mutation-warish' && (
            <p>
              তপশিলি জমির বিবরণ (মৌজা, জে.এল. নং, খতিয়ান ও দাগ নম্বর / দলিল বা মৃত ব্যক্তির নাম):{' '}
              <strong>{val(extraField)}</strong>। উক্ত জমির মিউটেশন / আইনগত উত্তরাধিকার (ওয়ারিশ) সংক্রান্ত প্রদত্ত সমস্ত তথ্য ও নথি নির্ভুল।
            </p>
          )}

          {toolId === 'pikpera-declaration' && (
            <p>
              আমার দখলীয় / মালিকানাধীন কৃষিজমির বিবরণ: <strong>{val(extraField)}</strong> এবং উক্ত জমিতে আমি
              সরেজমিনে ফসল চাষ করেছি যা ফসল বীমার জন্য প্রযোজ্য।
            </p>
          )}

          {(toolId === 'caste-affidavit-form17' ||
            toolId === 'caste-affidavit-form3' ||
            toolId === 'wb-caste-genealogy') && (
            <p>
              আমি জন্মসূত্রে <strong>{val(casteName)}</strong> সম্প্রদায়ভুক্ত এবং আমার প্রদত্ত বংশতালিকা ও পৈতৃক
              নথিপত্র (রেফারেন্স: <strong>{val(extraField)}</strong>) সম্পূর্ণ সত্য ও সঠিক।
            </p>
          )}

          {toolId === 'widow-declaration-letter' && (
            <p>
              আমার স্বামী স্বর্গীয় <strong>{val(fatherOrSpouse)}</strong> পরলোকগমন করেছেন এবং আমি বর্তমানে বিধবা ও
              পুনর্বিবাহ করিনি।
            </p>
          )}

          {toolId === 'deserted-declaration-letter' && (
            <p>
              আমি একজন পরিত্যক্তা মহিলা এবং বর্তমানে নিজ উদ্যোগে জীবিকা নির্বাহ করছি। সরকারি প্রকল্পের সুবিধার্থে এই
              স্ব-ঘোষণাপত্র দাখিল করছি।
            </p>
          )}

          {toolId === 'alive-declaration-letter' && (
            <p>
              আমি অদ্যবধি জীবিত আছি এবং পেনশন / সরকারি ভাতার ধারাবাহিকতার জন্য সশরীরে এই জীবিত থাকার
              স্ব-ঘোষণাপত্র দাখিল করছি।
            </p>
          )}

          <p>
            এই আবেদন / স্ব-ঘোষণাপত্রটি <strong>{val(purpose, 'সরকারি প্রকল্পের আবেদন ও যাচাই')}</strong> কাজের জন্য দাখিল করা হচ্ছে।
            উপরে প্রদত্ত সমস্ত তথ্য আমার জ্ঞান ও বিশ্বাসমতে সম্পূর্ণ সত্য। কোনো তথ্য অসত্য প্রমাণিত হলে আইনানুগ ব্যবস্থা গ্রহণের জন্য আমি দায়ী থাকব।
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4 text-[14px] leading-relaxed text-slate-900">
        <p>
          I, <strong>{val(fullName)}</strong>, Son / Daughter / Spouse of <strong>{val(fatherOrSpouse)}</strong>, aged{' '}
          <strong>{val(age, '____')}</strong> years (Date of Birth: <strong>{val(dob, '__/__/____')}</strong>), Aadhaar / ID No.{' '}
          <strong>{val(aadhaarLast4)}</strong>, Mobile No. <strong>{val(phone, '__________')}</strong>, permanently residing at{' '}
          <strong>{val(address, '____________________________')}</strong>, do hereby solemnly affirm and declare as under:
        </p>

        {toolId === 'wb-lakshmir-bhandar' && (
          <p>
            That I am a permanent resident of West Bengal, not employed in any regular Government/PSU service, and submitting my
            Swasthyasathi/Category details (<strong>{val(extraField)}</strong>) along with Bank A/C details (
            <strong>{val(bankInfo)}</strong>) for Lakshmir Bhandar Scheme.
          </p>
        )}

        {toolId === 'wb-kanyashree-rupashree' && (
          <p>
            That the educational/marital details (<strong>{val(extraField)}</strong>) and Bank Account details (
            <strong>{val(bankInfo)}</strong>) furnished for Kanyashree / Rupashree scheme are true and genuine.
          </p>
        )}

        {toolId === 'wb-land-mutation-warish' && (
          <p>
            That the scheduled land details (Mouza, JL No, Khatian/Dag, Deed or Deceased details:{' '}
            <strong>{val(extraField)}</strong>) submitted for Banglarbhumi Mutation / Legal Heir (Warish) verification are true.
          </p>
        )}

        {toolId === 'pikpera-declaration' && (
          <p>
            That I am cultivating the agricultural land described as <strong>{val(extraField)}</strong> and the crop sowing
            details declared for PMFBY crop insurance are true and accurate.
          </p>
        )}

        {(toolId === 'caste-affidavit-form17' ||
          toolId === 'caste-affidavit-form3' ||
          toolId === 'wb-caste-genealogy') && (
          <p>
            That I belong to <strong>{val(casteName)}</strong> community by birth and the genealogical records and supporting
            ancestral proofs (<strong>{val(extraField)}</strong>) submitted herewith are genuine.
          </p>
        )}

        {toolId === 'widow-declaration-letter' && (
          <p>
            That my husband Late <strong>{val(fatherOrSpouse)}</strong> has passed away, and I have not remarried as of the
            date of this declaration.
          </p>
        )}

        {toolId === 'deserted-declaration-letter' && (
          <p>
            That I am a deserted woman living independently and submitting this declaration for availing eligible
            government welfare benefits.
          </p>
        )}

        {toolId === 'alive-declaration-letter' && (
          <p>
            That I am alive and personally submitting this Life Self-Declaration for continuation of pension / welfare
            benefits.
          </p>
        )}

        <p>
          This self-declaration is issued for the purpose of <strong>{val(purpose, 'Official Submission')}</strong>. I verify that the
          information stated above is true and correct to the best of my knowledge and belief.
        </p>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 no-print shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Document Details</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearAll}
              title="Clear all inputs"
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer ${
                  lang === 'en'
                    ? 'bg-white dark:bg-slate-900 text-violet-700 dark:text-violet-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLang('bn')}
                className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer ${
                  lang === 'bn'
                    ? 'bg-white dark:bg-slate-900 text-violet-700 dark:text-violet-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                বাংলা
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Applicant Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter applicant full name"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Father / Husband Name
            </label>
            <input
              type="text"
              value={fatherOrSpouse}
              onChange={(e) => setFatherOrSpouse(e.target.value)}
              placeholder="Enter father or spouse name"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Age (Years)</label>
            <input
              type="text"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 28"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm tabular-nums"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Date of Birth</label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Aadhaar / EPIC No.
            </label>
            <input
              type="text"
              value={aadhaarLast4}
              onChange={(e) => setAadhaarLast4(e.target.value)}
              placeholder="XXXX-XXXX-0000"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Mobile Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="10-digit mobile"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm tabular-nums"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Residential Address
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Vill, PO, PS, Block, District, PIN"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
            />
          </div>

          {(toolId === 'pikpera-declaration' ||
            toolId === 'wb-lakshmir-bhandar' ||
            toolId === 'wb-kanyashree-rupashree' ||
            toolId === 'wb-caste-genealogy' ||
            toolId === 'wb-land-mutation-warish') && (
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {toolId === 'wb-lakshmir-bhandar'
                  ? 'Swasthyasathi Card & Category'
                  : toolId === 'wb-kanyashree-rupashree'
                  ? 'School/College & Annual Income'
                  : toolId === 'wb-land-mutation-warish'
                  ? 'Mouza, Khatian, Dag No. / Deed No.'
                  : toolId === 'wb-caste-genealogy'
                  ? 'Relative Caste Certificate Reference'
                  : 'Dag / Survey No. & Crop'}
              </label>
              <input
                type="text"
                value={extraField}
                onChange={(e) => setExtraField(e.target.value)}
                placeholder="Enter scheme / land / certificate details"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
              />
            </div>
          )}

          {(toolId === 'wb-lakshmir-bhandar' || toolId === 'wb-kanyashree-rupashree') && (
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Bank Name, Account No. &amp; IFSC
              </label>
              <input
                type="text"
                value={bankInfo}
                onChange={(e) => setBankInfo(e.target.value)}
                placeholder="Bank Name · A/C No. · IFSC"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
              />
            </div>
          )}

          {(toolId === 'caste-affidavit-form17' ||
            toolId === 'caste-affidavit-form3' ||
            toolId === 'wb-caste-genealogy') && (
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Caste / Category
              </label>
              <input
                type="text"
                value={casteName}
                onChange={(e) => setCasteName(e.target.value)}
                placeholder="e.g. SC / ST / OBC-A / OBC-B"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
              />
            </div>
          )}

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Purpose / Office Submission
            </label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. BDO / Duare Sarkar / Portal Verification"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Place</label>
            <input
              type="text"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="Town / Village"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Application Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Applicant Photo (Optional)
            </label>
            <label className="flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
              <Upload className="w-3.5 h-3.5" />
              <span>{photoUrl ? 'Change Photo' : 'Upload Applicant Photo'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setPhotoUrl(URL.createObjectURL(f));
                }}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {isTreeTool && (
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-3">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Family Tree Members (বংশতালিকা যোগ করুন)
            </div>
            {treeMembers.length > 0 && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {treeMembers.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 py-1.5 rounded-lg"
                  >
                    <span>
                      <strong>G{m.generation}:</strong> {m.name} ({m.relation})
                    </span>
                    <button
                      type="button"
                      onClick={() => setTreeMembers((prev) => prev.filter((x) => x.id !== m.id))}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Member Name"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                className="col-span-2 px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-xs"
              />
              <select
                value={newMemberGen}
                onChange={(e) => setNewMemberGen(Number(e.target.value) as 1 | 2 | 3)}
                className="px-2 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-xs"
              >
                <option value={1}>Gen 1</option>
                <option value={2}>Gen 2</option>
                <option value={3}>Gen 3</option>
              </select>
              <input
                type="text"
                placeholder="Relation (e.g. Father)"
                value={newMemberRel}
                onChange={(e) => setNewMemberRel(e.target.value)}
                className="col-span-2 px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newMemberName.trim()) return;
                  setTreeMembers((prev) => [
                    ...prev,
                    {
                      id: String(Date.now()),
                      name: newMemberName.trim(),
                      relation: newMemberRel.trim() || 'Member',
                      generation: newMemberGen,
                    },
                  ]);
                  setNewMemberName('');
                  setNewMemberRel('');
                }}
                className="inline-flex items-center justify-center gap-1 bg-violet-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => printElementHtml(printAreaRef.current, toolName)}
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          Print / Save as PDF (A4)
        </button>
      </div>

      {/* Live A4 Sheet Preview */}
      <div className="lg:col-span-7">
        <div
          ref={printAreaRef}
          className="print-area bg-white border-2 border-slate-300 shadow-sm rounded-xl p-8 md:p-12 min-h-[760px] flex flex-col justify-between text-slate-900"
        >
          <div>
            <div className="flex items-start justify-between gap-4 border-b-2 border-slate-900 pb-4 mb-6">
              <div className="flex-1">
                <h2 className="text-lg md:text-xl font-extrabold tracking-tight text-slate-900">
                  {lang === 'bn' ? heading.bn : heading.en}
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  {lang === 'bn'
                    ? 'সরকারি / আধা-সরকারি অফিসে জমা দেওয়ার জন্য স্ব-ঘোষণাপত্র'
                    : 'Self-Declaration / Affidavit Format for Official & Portal Submission'}
                </p>
              </div>
              <div className="w-24 h-28 border border-slate-400 flex items-center justify-center text-[10px] text-slate-500 text-center shrink-0 overflow-hidden bg-slate-50">
                {photoUrl ? (
                  <img src={photoUrl} alt="Applicant" className="w-full h-full object-cover" />
                ) : (
                  <span>Affix Passport Photo</span>
                )}
              </div>
            </div>

            {renderBodyParagraphs()}

            {isTreeTool && treeMembers.length > 0 && (
              <div className="mt-6 pt-5 border-t border-slate-300">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 text-center">
                  {lang === 'bn' ? 'পারিবারিক বংশতালিকা (Genealogy Chart)' : 'Genealogical Family Tree'}
                </div>
                <div className="space-y-3">
                  {([1, 2, 3] as const).map((gen) => {
                    const list = treeMembers.filter((m) => m.generation === gen);
                    if (list.length === 0) return null;
                    return (
                      <div key={gen} className="flex flex-wrap justify-center gap-3">
                        {list.map((m) => (
                          <div
                            key={m.id}
                            className="border border-slate-800 px-3 py-1.5 rounded text-center bg-slate-50 min-w-[140px]"
                          >
                            <div className="text-xs font-bold">{m.name}</div>
                            <div className="text-[10px] text-slate-600">{m.relation}</div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="mt-12 pt-6 border-t border-slate-200 flex items-end justify-between text-xs">
            <div className="space-y-1">
              <div>
                <strong>{lang === 'bn' ? 'স্থান' : 'Place'}:</strong> {val(place, '____________')}
              </div>
              <div>
                <strong>{lang === 'bn' ? 'তারিখ' : 'Date'}:</strong> {val(date, '__/__/____')}
              </div>
            </div>
            <div className="text-center">
              <div className="h-10 border-b border-slate-500 w-44 mb-1" />
              <div className="font-bold">{fullName.trim() || ''}</div>
              <div className="text-slate-600">
                {lang === 'bn' ? 'আবেদনকারীর স্বাক্ষর' : 'Signature of Applicant'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

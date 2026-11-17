import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, BookOpen, Lightbulb } from 'lucide-react';
import type { OwnerContactConfig } from '../../data/ownerConfig';
import type { AppLang } from '../../data/i18n';
import type { ActivePage } from '../Header';

interface LegalAndInfoPagesProps {
  page: Exclude<ActivePage, 'home' | 'tool' | 'posters' | 'contact' | 'cyber-guide' | 'status-hub'>;
  ownerConfig: OwnerContactConfig;
  lang: AppLang;
  onNavigate: (page: ActivePage) => void;
}

export const LegalAndInfoPages: React.FC<LegalAndInfoPagesProps> = ({
  page,
  ownerConfig,
  lang,
  onNavigate,
}) => {
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [toolTitle, setToolTitle] = useState('');
  const [suggestionText, setSuggestionText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [suggestionSent, setSuggestionSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const BackHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div className="mb-8">
      <button
        type="button"
        onClick={() => onNavigate('home')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-700 dark:text-violet-400 hover:underline mb-3 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        {lang === 'bn' ? 'হোমে ফিরুন' : 'Back to Home'}
      </button>
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">{title}</h1>
      {subtitle && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );

  if (page === 'suggestions') {
    const handleSuggestionSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!suggestionText.trim()) {
        setErrorMsg(
          lang === 'bn'
            ? 'অনুগ্রহ করে টুলের বিবরণ লিখুন।'
            : 'Please describe the tool you would like us to add.'
        );
        return;
      }
      setErrorMsg('');
      setSubmitting(true);
      try {
        const res = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'suggestion',
            name: senderName.trim() || 'Tool Suggester',
            email: senderEmail.trim(),
            subject: toolTitle.trim() || 'New Tool Request',
            message: suggestionText.trim(),
          }),
        });
        if (!res.ok) throw new Error('Failed');
        setSuggestionSent(true);
      } catch {
        setErrorMsg(lang === 'bn' ? 'পাঠাতে সমস্যা হয়েছে।' : 'Failed to submit. Please try again.');
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="max-w-[760px] mx-auto px-4 lg:px-6 py-8">
        <BackHeader
          title={lang === 'bn' ? 'নতুন টুলের পরামর্শ দিন (Suggest a Tool)' : 'Suggest a Tool'}
          subtitle={
            lang === 'bn'
              ? `পশ্চিমবঙ্গের কোনো নির্দিষ্ট ফর্ম, পরীক্ষার প্রিসেট বা PDF টুলের দরকার? সরাসরি ${ownerConfig.ownerName}-কে জানান।`
              : `Need a specific form, exam preset, or PDF shortcut? Tell ${ownerConfig.ownerName} directly.`
          }
        />
        <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-xs">
          {suggestionSent ? (
            <div className="p-6 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-3 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
              <div className="text-base font-extrabold">
                {lang === 'bn' ? 'ধন্যবাদ! আপনার পরামর্শ গৃহীত হয়েছে।' : 'Thanks! Your suggestion has been saved.'}
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-300">
                {lang === 'bn'
                  ? 'আপনার পরামর্শটি সরাসরি SMART SUBHA-র অ্যাডমিন ইনবক্সে জমা হয়েছে।'
                  : `Your request has been sent straight to ${ownerConfig.ownerName}'s admin inbox.`}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSuggestionSent(false);
                  setSenderName('');
                  setSenderEmail('');
                  setToolTitle('');
                  setSuggestionText('');
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
              >
                {lang === 'bn' ? 'আরও একটি পরামর্শ দিন' : 'Submit Another'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSuggestionSubmit} className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-white">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>
                  {lang === 'bn'
                    ? 'আপনি কোন নতুন টুলটি দেখতে চান তা লিখুন'
                    : 'Describe the tool you want us to build'}
                </span>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 font-semibold">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'bn' ? 'আপনার নাম (ঐচ্ছিক)' : 'Your Name (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder={lang === 'bn' ? 'আপনার নাম' : 'Enter your name'}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'bn' ? 'ইমেইল / মোবাইল (ঐচ্ছিক)' : 'Email / Phone (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="Email or mobile"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'টুলের নাম / বিষয়' : 'Tool Name / Topic'}
                </label>
                <input
                  type="text"
                  value={toolTitle}
                  onChange={(e) => setToolTitle(e.target.value)}
                  placeholder={
                    lang === 'bn'
                      ? 'যেমন: বাংলারভূমি ওয়ারিশ ফর্ম বা ২০ KB সই রিসাইজ'
                      : 'e.g. WB Caste Form or 20KB Signature Tool'
                  }
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'bn' ? 'বিস্তারিত বিবরণ *' : 'Detailed Description *'}
                </label>
                <textarea
                  rows={5}
                  value={suggestionText}
                  onChange={(e) => setSuggestionText(e.target.value)}
                  placeholder={
                    lang === 'bn'
                      ? 'টুলটি কীভাবে কাজ করলে আপনার সুবিধা হবে তা লিখুন...'
                      : 'Explain how the tool should work...'
                  }
                  className="w-full p-3.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 cursor-pointer disabled:opacity-60"
              >
                {submitting
                  ? lang === 'bn'
                    ? 'জমা হচ্ছে...'
                    : 'Submitting...'
                  : lang === 'bn'
                  ? 'পরামর্শ জমা দিন'
                  : 'Submit Suggestion'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  if (page === 'blog') {
    const guides =
      lang === 'bn'
        ? [
            {
              title: 'SSC, UPSC ও রাজ্য চাকরির ফর্মের জন্য ২০ KB – ৫০ KB ছবি ও সই তৈরির নিয়ম',
              date: 'CSC কাউন্টার গাইড',
              body: 'সরকারি পোর্টাল মাত্র ১ KB বেশি হলেও ছবি বাতিল করে দেয়। আমাদের Compress Image টুলে Target Exact KB মোড ব্যবহার করে নিখুঁতভাবে ২০ বা ৫০ KB ছবি তৈরি করুন।',
            },
            {
              title: 'ই-আধার, প্যান, ভোটার ও রেশন কার্ড সঠিক ৮৫.৬ × ৫৪ মিমি স্মার্টকার্ড সাইজে প্রিন্ট করার পদ্ধতি',
              date: 'আইডি কার্ড প্রিন্টিং',
              body: 'প্লাস্টিক পাউচে নিখুঁতভাবে বসানোর জন্য কার্ডের মাপ হওয়া উচিত ৮৫.৬ × ৫৪ মিমি। আমাদের ID Card Cropper সরাসরি ৩০০ DPI A4 শিটে সামনের ও পেছনের অংশ সাজিয়ে দেয়।',
            },
            {
              title: '৪×৬ (4R) এবং A4 ফটো পেপারে নাম ও তারিখসহ পাসপোর্ট ফটো শিট প্রিন্ট',
              date: 'ফটো স্টুডিও গাইড',
              body: 'আপলোড করা ছবির নির্দিষ্ট অংশ ক্রপ করুন, সামান্য বাঁকা থাকলে রোটেট স্লাইডার দিয়ে সোজা করুন এবং ছবির নিচে নাম ও তারিখ বসিয়ে A4 বা ৪×৬ পেপারে প্রিন্ট করুন।',
            },
          ]
        : [
            {
              title: 'How to Compress Photo & Signature to Exact 20KB–50KB for SSC, UPSC & State Exams',
              date: 'CSC Counter Guide',
              body: 'Government portals reject uploads even if they are 1 KB over limit. Use our Compress Image tool in Target Exact KB mode to hit 20 KB or 50 KB cleanly without blurring text.',
            },
            {
              title: 'Printing e-Aadhaar, e-PAN, Voter & Ration Cards at Exact 85.6 × 54 mm Smartcard Size',
              date: 'ID Card Printing',
              body: 'Standard PVC smartcards measure 85.6 × 54 mm. Our ID Card Croppers align front and back side-by-side onto a 300-DPI A4 canvas so lamination pouches fit first try.',
            },
            {
              title: 'Passport Photo Cropping on 4×6 (4R) & A4 Photo Paper with Name & Date Strip',
              date: 'Photo Studio Guide',
              body: 'Select the exact face and shoulder region, adjust tilt/brightness, optionally stamp Candidate Name + Date on the bottom white strip, and print onto 4×6 or A4 photo paper.',
            },
          ];

    return (
      <div className="max-w-[860px] mx-auto px-4 lg:px-6 py-8">
        <BackHeader
          title={lang === 'bn' ? 'ব্লগ ও কাজের গাইড (Blog & Guides)' : 'Guides & Blog'}
          subtitle={
            lang === 'bn'
              ? 'দোকান ও সাইবার ক্যাফের প্রতিদিনের কাজের বাস্তব অভিজ্ঞতা থেকে তৈরি গাইডলাইন।'
              : 'Practical documentation notes from real CSC counter experience.'
          }
        />
        <div className="space-y-4">
          {guides.map((g, i) => (
            <article
              key={i}
              className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-2 shadow-xs"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-violet-700 dark:text-violet-400">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{g.date}</span>
              </div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">{g.title}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{g.body}</p>
            </article>
          ))}
        </div>
      </div>
    );
  }

  const titles: Record<'about' | 'terms' | 'privacy', string> =
    lang === 'bn'
      ? {
          about: `${ownerConfig.brandName} (${ownerConfig.byline}) সম্পর্কে`,
          terms: 'শর্তাবলী (Terms & Conditions)',
          privacy: 'গোপনীয়তা নীতি (Privacy Policy)',
        }
      : {
          about: `About ${ownerConfig.brandName} ${ownerConfig.byline}`,
          terms: 'Terms & Conditions',
          privacy: 'Privacy Policy',
        };

  return (
    <div className="max-w-[820px] mx-auto px-4 lg:px-6 py-8">
      <BackHeader
        title={titles[page]}
        subtitle={
          lang === 'bn'
            ? `পরিচালনায় ${ownerConfig.ownerName} · ${ownerConfig.location}`
            : `Operated by ${ownerConfig.ownerName} · ${ownerConfig.location}`
        }
      />
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 space-y-5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed shadow-xs">
        {page === 'about' && (
          <>
            {lang === 'bn' ? (
              <>
                <p>
                  <strong>{ownerConfig.brandName} {ownerConfig.byline}</strong> তৈরি ও পরিচালনা করছেন{' '}
                  <strong>{ownerConfig.ownerName}</strong> ({ownerConfig.location})। এটি সাইবার ক্যাফে, CSC অপারেটর ও ছাত্রছাত্রীদের প্রতিদিনের জরুরি কাজের জন্য একটি সম্পূর্ণ বিনামূল্যের অনলাইন পোর্টাল।
                </p>
                <p>
                  এখানে থাকা সমস্ত ইমেজ কম্প্রেশন, পাসপোর্ট ফটো ক্রপ, ডকুমেন্ট ক্লিনার, PDF মার্জ/স্প্লিট, আইডি কার্ড ক্রপিং, বাংলার ফর্ম এবং ইনভয়েস সরাসরি আপনার ব্রাউজারে চলে — আপনার কোনো ব্যক্তিগত ফাইল বাইরে পাঠানো হয় না।
                </p>
              </>
            ) : (
              <>
                <p>
                  <strong>{ownerConfig.brandName} {ownerConfig.byline}</strong> is built and operated by{' '}
                  <strong>{ownerConfig.ownerName}</strong> from {ownerConfig.location}. It brings together fast,
                  practical utilities for CSC operators, students preparing exam applications, and everyday users.
                </p>
                <p>
                  Every browser tool — image compression, passport photo cropping, document B&amp;W cleaning, PDF merging, page removal, ID card cropping, and declaration formatting — processes files directly on your own device without uploading private documents.
                </p>
              </>
            )}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
              <div><strong>Business Name:</strong> {ownerConfig.brandName} {ownerConfig.byline}</div>
              <div><strong>Owner / Operator:</strong> {ownerConfig.ownerName}</div>
              <div>
                <strong>Website:</strong>{' '}
                <a href={ownerConfig.websiteUrl} target="_blank" rel="noreferrer" className="text-violet-700 dark:text-violet-400 font-bold underline">
                  {ownerConfig.websiteLabel}
                </a>
              </div>
              <div><strong>Email:</strong> {ownerConfig.supportEmail}</div>
              <div><strong>Phone:</strong> {ownerConfig.phone}</div>
              <div><strong>Location:</strong> {ownerConfig.location}</div>
            </div>
          </>
        )}

        {page === 'terms' && (
          <>
            {lang === 'bn' ? (
              <>
                <p>
                  <strong>{ownerConfig.brandName} {ownerConfig.byline}</strong> ({ownerConfig.location}) ব্যবহার করার মাধ্যমে আপনি সম্মত হচ্ছেন যে এই টুলগুলো কেবল বৈধ ব্যক্তিগত, শিক্ষামূলক বা গ্রাহক অনুমোদিত ডকুমেন্ট কাজের জন্য ব্যবহার করা হবে।
                </p>
                <p>
                  ব্রাউজার-ভিত্তিক সমস্ত টুল সম্পূর্ণ বিনামূল্যে দেওয়া হচ্ছে। যেকোনো সহায়তার জন্য{' '}
                  <a href={`mailto:${ownerConfig.supportEmail}`} className="text-violet-700 font-bold">
                    {ownerConfig.supportEmail}
                  </a>{' '}
                  ঠিকানায় ইমেইল করুন অথবা {ownerConfig.phone} নম্বরে যোগাযোগ করুন।
                </p>
              </>
            ) : (
              <>
                <p>
                  Welcome to <strong>{ownerConfig.brandName} {ownerConfig.byline}</strong>, operated by{' '}
                  {ownerConfig.ownerName} ({ownerConfig.location}). By using our free online image, PDF, ID card, and
                  document utilities, you agree to use the tools lawfully for genuine personal or authorized customer
                  documentation.
                </p>
                <p>
                  Browser-based tools process files locally in JavaScript. For support inquiries, contact{' '}
                  <a href={`mailto:${ownerConfig.supportEmail}`} className="text-violet-700 font-semibold">
                    {ownerConfig.supportEmail}
                  </a>{' '}
                  or call {ownerConfig.phone}.
                </p>
              </>
            )}
          </>
        )}

        {page === 'privacy' && (
          <>
            {lang === 'bn' ? (
              <>
                <p>
                  <strong>{ownerConfig.brandName} {ownerConfig.byline}</strong> আপনার তথ্যের গোপনীয়তাকে সর্বোচ্চ গুরুত্ব দেয়। ছবি, PDF, আধার/প্যান/ভোটার ক্রপিং-এর কোনো ফাইল সার্ভারে আপলোড হয় না — সমস্ত প্রসেসিং আপনার নিজের ডিভাইসের ব্রাউজারে সম্পন্ন হয়।
                </p>
                <p>
                  যোগাযোগ ফর্ম বা টুলের পরামর্শ ফর্মে দেওয়া আপনার নাম ও বার্তা শুধুমাত্র আপনার প্রশ্নের উত্তর ও সাইট উন্নতির কাজে ব্যবহার করা হয়।
                </p>
              </>
            ) : (
              <>
                <p>
                  <strong>{ownerConfig.brandName} {ownerConfig.byline}</strong> respects your privacy. All image
                  compression, resizing, PDF merging, splitting, watermarking, and ID card cropping tools execute inside
                  your own browser — your files never leave your device.
                </p>
                <p>
                  Contact messages and tool suggestions submitted via our forms are used solely to assist you and improve the platform. We never sell or share user data with third parties.
                </p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

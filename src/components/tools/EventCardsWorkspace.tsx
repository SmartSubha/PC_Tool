import React, { useEffect, useRef, useState } from 'react';
import { Printer, Upload, RotateCcw } from 'lucide-react';
import type { AppLang } from '../../data/i18n';
import { printElementHtml } from '../../utils/printHelper';

interface EventCardsWorkspaceProps {
  toolId: string;
  appLang: AppLang;
}

export const EventCardsWorkspace: React.FC<EventCardsWorkspaceProps> = ({ toolId, appLang }) => {
  const [theme, setTheme] = useState<'royal' | 'gold' | 'violet'>('royal');
  const [cardLang, setCardLang] = useState<AppLang>(appLang);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const printAreaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setCardLang(appLang);
  }, [appLang]);

  // All inputs start empty (never pre-filled)
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [height, setHeight] = useState('');
  const [education, setEducation] = useState('');
  const [occupation, setOccupation] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [siblings, setSiblings] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [nativePlace, setNativePlace] = useState('');

  // Invitation fields
  const [groomName, setGroomName] = useState('');
  const [brideName, setBrideName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [muhuratTime, setMuhuratTime] = useState('');
  const [venue, setVenue] = useState('');
  const [hosts, setHosts] = useState('');

  const handleReset = () => {
    setName('');
    setDob('');
    setHeight('');
    setEducation('');
    setOccupation('');
    setFatherName('');
    setMotherName('');
    setSiblings('');
    setContactNumber('');
    setNativePlace('');
    setGroomName('');
    setBrideName('');
    setEventDate('');
    setMuhuratTime('');
    setVenue('');
    setHosts('');
    setPhotoUrl(null);
  };

  const themeColors = {
    royal: {
      border: 'border-rose-800',
      inner: 'border-amber-500',
      accent: 'text-rose-800',
      bg: 'bg-[#fffaf5]',
    },
    gold: {
      border: 'border-amber-700',
      inner: 'border-amber-400',
      accent: 'text-amber-800',
      bg: 'bg-[#fefcf6]',
    },
    violet: {
      border: 'border-violet-800',
      inner: 'border-violet-400',
      accent: 'text-violet-800',
      bg: 'bg-[#faf8ff]',
    },
  }[theme];

  const v = (s: string, fallback = '________________') => (s.trim() ? s.trim() : fallback);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 no-print shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setCardLang('en')}
              className={`px-2 py-1 rounded text-xs font-bold cursor-pointer ${
                cardLang === 'en'
                  ? 'bg-white dark:bg-slate-900 text-violet-700 dark:text-violet-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setCardLang('bn')}
              className={`px-2 py-1 rounded text-xs font-bold cursor-pointer ${
                cardLang === 'bn'
                  ? 'bg-white dark:bg-slate-900 text-violet-700 dark:text-violet-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              বাংলা
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            {(['royal', 'gold', 'violet'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize cursor-pointer ${
                  theme === t
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {t}
              </button>
            ))}
            <button
              type="button"
              onClick={handleReset}
              title="Reset form"
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {toolId === 'marriage-biodata' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Birth Date &amp; Time
              </label>
              <input
                type="text"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                placeholder="DD Month YYYY · Time"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Height</label>
              <input
                type="text"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="e.g. 5 ft 8 in"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Education</label>
              <input
                type="text"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                placeholder="Degree / Qualification"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Occupation / Work
              </label>
              <input
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder="Job title & city"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Father Name &amp; Occupation
              </label>
              <input
                type="text"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                placeholder="Father full name & profession"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Mother Name</label>
              <input
                type="text"
                value={motherName}
                onChange={(e) => setMotherName(e.target.value)}
                placeholder="Mother full name"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Siblings</label>
              <input
                type="text"
                value={siblings}
                onChange={(e) => setSiblings(e.target.value)}
                placeholder="Brothers / Sisters"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="Phone number"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Native Place</label>
              <input
                type="text"
                value={nativePlace}
                onChange={(e) => setNativePlace(e.target.value)}
                placeholder="District / Town"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Photo</label>
              <label className="flex items-center justify-center gap-1.5 px-3 py-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                <Upload className="w-3.5 h-3.5" />
                <span>{photoUrl ? 'Change' : 'Upload'}</span>
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
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Groom Name (পাত্র)
                </label>
                <input
                  type="text"
                  value={groomName}
                  onChange={(e) => setGroomName(e.target.value)}
                  placeholder="Groom name"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bride Name (পাত্রী)
                </label>
                <input
                  type="text"
                  value={brideName}
                  onChange={(e) => setBrideName(e.target.value)}
                  placeholder="Bride name"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Wedding Date (শুভ বিবাহের তারিখ)
              </label>
              <input
                type="text"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                placeholder="Day, DD Month YYYY"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Shubho Lagna / Time
              </label>
              <input
                type="text"
                value={muhuratTime}
                onChange={(e) => setMuhuratTime(e.target.value)}
                placeholder="e.g. 07:15 PM"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Wedding Venue (বিবাহ স্থল)
              </label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Hall name & full address"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Invited By / Host Families
              </label>
              <input
                type="text"
                value={hosts}
                onChange={(e) => setHosts(e.target.value)}
                placeholder="Host family names"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
              />
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => printElementHtml(printAreaRef.current, 'Event Card A4')}
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          Print / Save Card as PDF (A4)
        </button>
      </div>

      <div className="lg:col-span-7">
        <div
          ref={printAreaRef}
          className={`print-area ${themeColors.bg} text-slate-900 border-4 ${themeColors.border} p-3 rounded-2xl shadow-sm`}
        >
          <div className={`border-2 ${themeColors.inner} p-6 md:p-10 rounded-xl`}>
            {toolId === 'marriage-biodata' ? (
              <div className="space-y-6">
                <div className="text-center border-b border-amber-300 pb-4">
                  <div className={`text-xs font-bold tracking-widest uppercase ${themeColors.accent}`}>
                    {cardLang === 'bn' ? '॥ শুভ বিবাহ বায়োডাটা ॥' : '॥ SHUBH VIVAH BIODATA ॥'}
                  </div>
                  <h2 className={`text-2xl font-extrabold mt-1 ${themeColors.accent}`}>
                    {cardLang === 'bn' ? 'বিবাহের পরিচিতি পত্র' : 'MARRIAGE BIODATA'}
                  </h2>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <div className="flex-1 space-y-2.5 text-sm">
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${themeColors.accent}`}>
                      {cardLang === 'bn' ? 'ব্যক্তিগত তথ্য' : 'Personal Details'}
                    </h3>
                    <div className="grid grid-cols-3 gap-1">
                      <span className="font-semibold text-slate-600">{cardLang === 'bn' ? 'নাম' : 'Name'}</span>
                      <span className="col-span-2 font-bold text-slate-900">{v(name)}</span>
                      <span className="font-semibold text-slate-600">{cardLang === 'bn' ? 'জন্ম তারিখ' : 'Birth Date'}</span>
                      <span className="col-span-2">{v(dob)}</span>
                      <span className="font-semibold text-slate-600">{cardLang === 'bn' ? 'উচ্চতা' : 'Height'}</span>
                      <span className="col-span-2">{v(height)}</span>
                      <span className="font-semibold text-slate-600">{cardLang === 'bn' ? 'শিক্ষাগত যোগ্যতা' : 'Education'}</span>
                      <span className="col-span-2">{v(education)}</span>
                      <span className="font-semibold text-slate-600">{cardLang === 'bn' ? 'পেশা' : 'Occupation'}</span>
                      <span className="col-span-2">{v(occupation)}</span>
                    </div>

                    <h3 className={`text-xs font-bold uppercase tracking-wider pt-3 ${themeColors.accent}`}>
                      {cardLang === 'bn' ? 'পারিবারিক তথ্য' : 'Family Background'}
                    </h3>
                    <div className="grid grid-cols-3 gap-1">
                      <span className="font-semibold text-slate-600">{cardLang === 'bn' ? 'পিতা' : 'Father'}</span>
                      <span className="col-span-2">{v(fatherName)}</span>
                      <span className="font-semibold text-slate-600">{cardLang === 'bn' ? 'মাতা' : 'Mother'}</span>
                      <span className="col-span-2">{v(motherName)}</span>
                      <span className="font-semibold text-slate-600">{cardLang === 'bn' ? 'ভাই-বোন' : 'Siblings'}</span>
                      <span className="col-span-2">{v(siblings)}</span>
                      <span className="font-semibold text-slate-600">{cardLang === 'bn' ? 'ঠিকানা' : 'Native'}</span>
                      <span className="col-span-2">{v(nativePlace)}</span>
                      <span className="font-semibold text-slate-600">{cardLang === 'bn' ? 'যোগাযোগ' : 'Contact'}</span>
                      <span className="col-span-2 font-semibold">{v(contactNumber)}</span>
                    </div>
                  </div>

                  {photoUrl && (
                    <div className="w-36 h-44 border-2 border-amber-400 rounded-xl overflow-hidden shrink-0 shadow-xs">
                      <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center space-y-6 py-4">
                <div className={`text-sm font-bold ${themeColors.accent}`}>
                  {cardLang === 'bn' ? '॥ শুভ বিবাহ সাদর আমন্ত্রণ ॥' : '॥ SHUBH VIVAH INVITATION ॥'}
                </div>
                <div className="text-xs uppercase tracking-widest text-slate-600">
                  {cardLang === 'bn' ? 'সবিনয় নিমন্ত্রণ পত্র' : 'Cordial Wedding Invitation'}
                </div>
                <div className="space-y-1">
                  <div className={`text-3xl md:text-4xl font-extrabold ${themeColors.accent}`}>
                    {v(groomName, 'Groom')} &amp; {v(brideName, 'Bride')}
                  </div>
                  <p className="text-sm text-slate-600">
                    {cardLang === 'bn'
                      ? 'শুভ বিবাহ উপলক্ষে আপনার সপরিবার উপস্থিতি ও আশীর্বাদ একান্ত কাম্য।'
                      : 'Request the honor of your presence and blessings at their auspicious wedding ceremony.'}
                  </p>
                </div>

                <div className="max-w-md mx-auto bg-white/80 border border-amber-200 rounded-xl p-4 space-y-1.5 text-sm">
                  <div>
                    <span className="font-semibold text-slate-600">
                      {cardLang === 'bn' ? 'শুভ দিন:' : 'Date:'}
                    </span>{' '}
                    <strong>{v(eventDate)}</strong>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">
                      {cardLang === 'bn' ? 'শুভ লগ্ন:' : 'Time:'}
                    </span>{' '}
                    <strong>{v(muhuratTime)}</strong>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">
                      {cardLang === 'bn' ? 'স্থান:' : 'Venue:'}
                    </span>{' '}
                    <strong>{v(venue)}</strong>
                  </div>
                </div>

                <div className="pt-2 text-sm">
                  <div className="text-xs text-slate-500">
                    {cardLang === 'bn' ? 'নিবেদন ইতি' : 'Warm Regards'}
                  </div>
                  <div className={`font-bold text-base mt-0.5 ${themeColors.accent}`}>{v(hosts)}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

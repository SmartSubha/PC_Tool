import React, { useMemo, useState } from 'react';
import { CalendarClock, MapPinHouse, Sparkles } from 'lucide-react';
import type { AppLang } from '../../data/i18n';

interface AgeLandCalculatorProps {
  appLang: AppLang;
}

type LandUnit =
  | 'shatak'
  | 'katha'
  | 'bigha'
  | 'chatak'
  | 'acre'
  | 'hectare'
  | 'sqft'
  | 'sqm';

// Standard West Bengal land unit equivalents anchored in exact Sq. Ft.
// 1 Acre = 100 Shatak (Decimal) = 43,560 Sq.Ft.
// 1 Shatak (Decimal) = 435.6 Sq.Ft.
// 1 Bigha (WB) = 20 Katha = 14,400 Sq.Ft. (~33.058 Decimal)
// 1 Katha (WB) = 720 Sq.Ft. = 16 Chatak
// 1 Chatak (WB) = 45 Sq.Ft.
// 1 Sq.Meter = 10.7639104167 Sq.Ft.
// 1 Hectare = 10,000 Sq.Meter = 107,639.104167 Sq.Ft.
const UNIT_TO_SQFT: Record<LandUnit, number> = {
  sqft: 1,
  sqm: 10.7639104167,
  chatak: 45,
  shatak: 435.6,
  katha: 720,
  bigha: 14400,
  acre: 43560,
  hectare: 107639.104167,
};

const LAND_UNITS: { id: LandUnit; labelEn: string; labelBn: string }[] = [
  { id: 'shatak', labelEn: 'Decimal / Shatak', labelBn: 'শতক (Decimal / Shatak)' },
  { id: 'katha', labelEn: 'Katha (WB Standard)', labelBn: 'কাঠা (পশ্চিমবঙ্গ)' },
  { id: 'bigha', labelEn: 'Bigha (WB Standard)', labelBn: 'বিঘা (২০ কাঠা)' },
  { id: 'chatak', labelEn: 'Chatak (WB)', labelBn: 'ছটাক (১/১৬ কাঠা)' },
  { id: 'acre', labelEn: 'Acre (১০০ শতক)', labelBn: 'একর (১০০ শতক)' },
  { id: 'hectare', labelEn: 'Hectare', labelBn: 'হেক্টর (Hectare)' },
  { id: 'sqft', labelEn: 'Square Feet (Sq. Ft.)', labelBn: 'বর্গফুট (Sq. Ft.)' },
  { id: 'sqm', labelEn: 'Square Meter (Sq. M.)', labelBn: 'বর্গমিটার (Sq. M.)' },
];

export const AgeLandCalculator: React.FC<AgeLandCalculatorProps> = ({ appLang }) => {
  const [activeTab, setActiveTab] = useState<'age' | 'land'>('age');

  // Age Calculator State (starts completely clean)
  const [dob, setDob] = useState('');
  const [asOfDate, setAsOfDate] = useState('');

  // WB Land Area Converter State (starts completely clean)
  const [landValue, setLandValue] = useState('');
  const [landUnit, setLandUnit] = useState<LandUnit>('shatak');

  const ageBreakdown = useMemo(() => {
    if (!dob || !asOfDate) return null;
    const start = new Date(`${dob}T00:00:00`);
    const end = new Date(`${asOfDate}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
    if (end < start) return { error: 'Cut-off date must be on or after Date of Birth.' };

    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();

    if (days < 0) {
      const prevMonthLastDay = new Date(end.getFullYear(), end.getMonth(), 0).getDate();
      days += prevMonthLastDay;
      months -= 1;
    }
    if (months < 0) {
      months += 12;
      years -= 1;
    }

    const totalDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.floor(totalDays / 7);
    const totalMonths = years * 12 + months;
    const birthWeekday = start.toLocaleDateString(appLang === 'bn' ? 'bn-IN' : 'en-IN', {
      weekday: 'long',
    });

    return {
      years,
      months,
      days,
      totalDays,
      totalWeeks,
      totalMonths,
      birthWeekday,
    };
  }, [dob, asOfDate, appLang]);

  const landResults = useMemo(() => {
    const raw = Number(landValue);
    if (!landValue.trim() || Number.isNaN(raw) || raw < 0) return null;
    const sqFt = raw * UNIT_TO_SQFT[landUnit];
    return LAND_UNITS.map((u) => ({
      ...u,
      value: sqFt / UNIT_TO_SQFT[u.id],
    }));
  }, [landValue, landUnit]);

  const formatLandVal = (n: number) => {
    if (n === 0) return '0';
    if (n >= 1000) return n.toLocaleString('en-IN', { maximumFractionDigits: 2 });
    return Number(n.toFixed(4)).toString();
  };

  return (
    <div className="space-y-6">
      {/* Mode Switcher */}
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-2 grid grid-cols-2 gap-2 max-w-2xl mx-auto shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('age')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-colors cursor-pointer ${
            activeTab === 'age'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <CalendarClock className="w-4 h-4" />
          <span>{appLang === 'bn' ? 'চাকরির বয়স ক্যালকুলেটর (Age)' : 'Exam Age Calculator'}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('land')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-colors cursor-pointer ${
            activeTab === 'land'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <MapPinHouse className="w-4 h-4" />
          <span>{appLang === 'bn' ? 'জমির ক্ষেত্রফল ক্যালকুলেটর (WB)' : 'WB Land Area Converter'}</span>
        </button>
      </div>

      {activeTab === 'age' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-xs">
            <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
              {appLang === 'bn' ? 'তারিখ নির্বাচন করুন' : 'Enter Birth & Cut-off Dates'}
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {appLang === 'bn' ? 'জন্ম তারিখ (Date of Birth)' : 'Date of Birth (DOB)'}
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm font-semibold focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {appLang === 'bn' ? 'যে তারিখে বয়স হিসাব হবে (Cut-off Date)' : 'Calculate Age As On (Cut-off Date)'}
                </label>
                <button
                  type="button"
                  onClick={() => setAsOfDate(new Date().toISOString().slice(0, 10))}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-700 dark:text-violet-400 hover:underline cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  {appLang === 'bn' ? 'আজকের তারিখ' : 'Set Today'}
                </button>
              </div>
              <input
                type="date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm font-semibold focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { label: '01 Jan This Year', val: `${new Date().getFullYear()}-01-01` },
                { label: '01 Jul This Year', val: `${new Date().getFullYear()}-07-01` },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setAsOfDate(p.val)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-violet-950/50 cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
            {!ageBreakdown ? (
              <div className="py-16 text-center text-xs text-slate-400">
                {appLang === 'bn'
                  ? 'জন্ম তারিখ এবং কাট-অফ তারিখ দিলে সঠিক বয়স (বছর, মাস, দিন) দেখা যাবে।'
                  : 'Select both Date of Birth and Cut-off Date to view exact Years, Months, and Days.'}
              </div>
            ) : 'error' in ageBreakdown ? (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-bold">
                {ageBreakdown.error}
              </div>
            ) : (
              <div className="space-y-5">
                <div className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-700 text-white p-6 text-center">
                  <div className="text-xs font-bold uppercase tracking-wider text-violet-200 mb-2">
                    {appLang === 'bn' ? 'সঠিক বয়স (Exact Age)' : 'Exact Calculated Age'}
                  </div>
                  <div className="text-2xl sm:text-4xl font-black tabular-nums">
                    {ageBreakdown.years} {appLang === 'bn' ? 'বছর' : 'Yrs'},{' '}
                    {ageBreakdown.months} {appLang === 'bn' ? 'মাস' : 'Mos'},{' '}
                    {ageBreakdown.days} {appLang === 'bn' ? 'দিন' : 'Days'}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Months</div>
                    <div className="text-lg font-black text-slate-900 dark:text-white tabular-nums mt-0.5">
                      {ageBreakdown.totalMonths.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Weeks</div>
                    <div className="text-lg font-black text-slate-900 dark:text-white tabular-nums mt-0.5">
                      {ageBreakdown.totalWeeks.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Days</div>
                    <div className="text-lg font-black text-slate-900 dark:text-white tabular-nums mt-0.5">
                      {ageBreakdown.totalDays.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Birth Day</div>
                    <div className="text-sm font-black text-violet-700 dark:text-violet-400 mt-1">
                      {ageBreakdown.birthWeekday}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-xs">
            <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
              {appLang === 'bn' ? 'পশ্চিমবঙ্গ জমির মাপ রূপান্তর' : 'West Bengal Land Area Input'}
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {appLang === 'bn' ? 'জমির পরিমাণ লিখুন' : 'Enter Land Area Value'}
              </label>
              <input
                type="number"
                min={0}
                step="any"
                value={landValue}
                onChange={(e) => setLandValue(e.target.value)}
                placeholder={appLang === 'bn' ? 'যেমন 10 বা 1.5' : 'e.g. 10 or 1.5'}
                className="w-full px-3.5 py-2.5 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-base font-bold tabular-nums focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {appLang === 'bn' ? 'বর্তমান একক (Unit)' : 'Select Input Unit'}
              </label>
              <select
                value={landUnit}
                onChange={(e) => setLandUnit(e.target.value as LandUnit)}
                className="w-full px-3 py-2.5 border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm font-bold"
              >
                {LAND_UNITS.map((u) => (
                  <option key={u.id} value={u.id}>
                    {appLang === 'bn' ? u.labelBn : u.labelEn}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/35 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3.5 text-[11px] text-emerald-950 dark:text-emerald-200 leading-relaxed space-y-1">
              <div className="font-extrabold">West Bengal Standard Scale:</div>
              <div>• 1 Acre = 100 Shatak (Decimal) = 43,560 Sq. Ft.</div>
              <div>• 1 Bigha = 20 Katha = 14,400 Sq. Ft. (≈ 33.06 Shatak)</div>
              <div>• 1 Katha = 16 Chatak = 720 Sq. Ft. (≈ 1.653 Shatak)</div>
              <div>• 1 Shatak (Decimal) = 435.6 Sq. Ft. (≈ 40.47 Sq. M.)</div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              {appLang === 'bn' ? 'সকল এককে রূপান্তরিত ফলাফল' : 'Instant Land Area Conversions'}
            </h3>

            {!landResults ? (
              <div className="py-16 text-center text-xs text-slate-400">
                {appLang === 'bn'
                  ? 'বাম দিকে জমির পরিমাণ লিখলে শতক, কাঠা, বিঘা, একর ও বর্গফুটের হিসাব দেখাবে।'
                  : 'Enter a number on the left to convert across Bigha, Katha, Shatak, Acre, Hectare, Sq. Ft., and Sq. M.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {landResults.map((row) => (
                  <div
                    key={row.id}
                    className={`p-3.5 rounded-xl border-2 ${
                      row.id === landUnit
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500'
                        : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      {appLang === 'bn' ? row.labelBn : row.labelEn}
                    </div>
                    <div className="text-lg font-black text-slate-950 dark:text-white tabular-nums mt-0.5">
                      {formatLandVal(row.value)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

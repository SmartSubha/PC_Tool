import React, { useMemo, useRef, useState } from 'react';
import { Compass, Printer, RotateCcw } from 'lucide-react';
import type { AppLang } from '../../data/i18n';
import { printElementHtml } from '../../utils/printHelper';

interface WbLandStampDutyCalcProps {
  appLang: AppLang;
}

function heronArea(a: number, b: number, c: number): number | null {
  if (a <= 0 || b <= 0 || c <= 0) return null;
  const s = (a + b + c) / 2;
  const val = s * (s - a) * (s - b) * (s - c);
  if (val <= 0) return null;
  return Math.sqrt(val);
}

export const WbLandStampDutyCalc: React.FC<WbLandStampDutyCalcProps> = ({ appLang }) => {
  const isBn = appLang === 'bn';
  const [unit, setUnit] = useState<'ft' | 'm' | 'link'>('ft');
  const [north, setNorth] = useState('');
  const [south, setSouth] = useState('');
  const [east, setEast] = useState('');
  const [west, setWest] = useState('');
  const [diagonal, setDiagonal] = useState('');

  // WB Stamp Duty Estimator
  const [areaType, setAreaType] = useState<'panchayat' | 'municipality'>('panchayat');
  const [marketValueStr, setMarketValueStr] = useState('');
  const [plotNote, setPlotNote] = useState('');

  const printRef = useRef<HTMLDivElement | null>(null);

  const unitToFeet = unit === 'ft' ? 1 : unit === 'm' ? 3.28084 : 0.66;

  const landCalc = useMemo(() => {
    const n = parseFloat(north) * unitToFeet;
    const s = parseFloat(south) * unitToFeet;
    const e = parseFloat(east) * unitToFeet;
    const w = parseFloat(west) * unitToFeet;
    const d = parseFloat(diagonal) * unitToFeet;

    if (!Number.isFinite(n) || !Number.isFinite(s) || !Number.isFinite(e) || !Number.isFinite(w) || n <= 0 || s <= 0 || e <= 0 || w <= 0) {
      return null;
    }

    let sqFt = 0;
    let method = '';
    if (Number.isFinite(d) && d > 0) {
      // Exact Heron's formula split along diagonal NW-SE (triangles N-E-D and S-W-D)
      const t1 = heronArea(n, e, d);
      const t2 = heronArea(s, w, d);
      if (t1 !== null && t2 !== null) {
        sqFt = t1 + t2;
        method = 'Exact Heron Triangulation (Diagonal Verified)';
      } else {
        return { error: 'Diagonal length does not form valid triangles with the 4 sides.' };
      }
    } else {
      // Average sides approximation (traditional Amin estimate when diagonal omitted)
      sqFt = ((n + s) / 2) * ((e + w) / 2);
      method = 'Average Side Estimate (Add Diagonal for 100% Exact Heron Area)';
    }

    const shatak = sqFt / 435.6; // 1 Decimal / Shatak = 435.6 sq.ft
    const katha = sqFt / 720; // West Bengal 1 Katha = 720 sq.ft
    const chhatak = (sqFt % 720) / 45;
    const bigha = katha / 20;
    const acre = shatak / 100;

    return { sqFt, shatak, katha, chhatak, bigha, acre, method, n, s, e, w };
  }, [north, south, east, west, diagonal, unitToFeet]);

  const stampCalc = useMemo(() => {
    const mv = parseFloat(marketValueStr);
    if (!Number.isFinite(mv) || mv <= 0) return null;
    // West Bengal standard indicative conveyance stamp duty:
    // Gram Panchayat: 5% (<= ₹1 Cr) or 6% (> ₹1 Cr)
    // Municipality / Corporation: 6% (<= ₹1 Cr) or 7% (> ₹1 Cr)
    // Registration Fee: 1.1%
    const isHigh = mv > 10000000;
    const stampRate = areaType === 'municipality' ? (isHigh ? 7 : 6) : isHigh ? 6 : 5;
    const regRate = 1.1;
    const stampDuty = (mv * stampRate) / 100;
    const regFee = (mv * regRate) / 100;
    return {
      mv,
      stampRate,
      regRate,
      stampDuty,
      regFee,
      totalGovCost: stampDuty + regFee,
    };
  }, [marketValueStr, areaType]);

  return (
    <div className="space-y-6">
      <div className="bg-slate-950 text-white rounded-2xl p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
            <Compass className="w-4 h-4" />
            <span>{isBn ? 'অনিয়মিত ৪-কোণা জমি মাপা (হিরন ফর্মুলা) + পশ্চিমবঙ্গ দলিল স্ট্যাম্প ডিউটি ও রেজিস্ট্রেশন খরচ' : 'Irregular 4-Side Land Plot Heron Surveyor · WB Stamp Duty & Registration'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-1">
            {isBn ? 'পশ্চিমবঙ্গ জমি পর্চা মাপ ও দলিল স্ট্যাম্প ডিউটি ক্যালকুলেটর' : 'WB Land Plot Surveyor & Stamp Duty Estimator'}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setNorth(''); setSouth(''); setEast(''); setWest(''); setDiagonal(''); setMarketValueStr(''); setPlotNote('');
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          <button
            type="button"
            onClick={() => printRef.current && printElementHtml(printRef.current, 'West Bengal Land & Stamp Duty Estimate')}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print Estimate Sheet
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs */}
        <div className="lg:col-span-6 space-y-5">
          {/* Irregular 4-side plot */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-950">
                {isBn ? '১. অনিয়মিত ৪-কোণা জমির মাপ (Plot Survey)' : '1. Irregular 4-Sided Land Plot Dimensions'}
              </h3>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as typeof unit)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white"
              >
                <option value="ft">Feet (ফুট)</option>
                <option value="m">Meter (মিটার)</option>
                <option value="link">Gunter Link (লিঙ্ক)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">North / উত্তর ({unit})</label>
                <input type="number" step="any" value={north} onChange={(e) => setNorth(e.target.value)} placeholder="0" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">South / দক্ষিণ ({unit})</label>
                <input type="number" step="any" value={south} onChange={(e) => setSouth(e.target.value)} placeholder="0" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">East / পূর্ব ({unit})</label>
                <input type="number" step="any" value={east} onChange={(e) => setEast(e.target.value)} placeholder="0" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">West / পশ্চিম ({unit})</label>
                <input type="number" step="any" value={west} onChange={(e) => setWest(e.target.value)} placeholder="0" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono font-bold" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-700 mb-1">
                {isBn ? 'কর্ণের দৈর্ঘ্য / Diagonal (কোনাকুনি মাপ — ১০০% সঠিক হিরন ফর্মুলার জন্য)' : 'Diagonal Corner-to-Corner Length (Optional — for 100% Exact Heron Area)'}
              </label>
              <input
                type="number"
                step="any"
                value={diagonal}
                onChange={(e) => setDiagonal(e.target.value)}
                placeholder={`Optional diagonal in ${unit}`}
                className="w-full rounded-xl border-2 border-emerald-300 px-3 py-2 text-sm font-mono font-bold"
              />
            </div>

            <input
              type="text"
              value={plotNote}
              onChange={(e) => setPlotNote(e.target.value)}
              placeholder={isBn ? 'মৌজা / খতিয়ান / দাগ নম্বর (ঐচ্ছিক, প্রিন্টে দেখাবে)' : 'Mouza / Khatian / Dag Plot No (optional for print sheet)'}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
            />
          </div>

          {/* WB Stamp Duty */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-950">
              {isBn ? '২. পশ্চিমবঙ্গ দলিল স্ট্যাম্প ডিউটি ও রেজিস্ট্রেশন ফি' : '2. West Bengal Deed Stamp Duty & Registration Estimator'}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAreaType('panchayat')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border cursor-pointer ${
                  areaType === 'panchayat' ? 'bg-slate-900 text-amber-300 border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                {isBn ? 'গ্রাম পঞ্চায়েত এলাকা (5% / 6%)' : 'Gram Panchayat (5% / 6%)'}
              </button>
              <button
                type="button"
                onClick={() => setAreaType('municipality')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border cursor-pointer ${
                  areaType === 'municipality' ? 'bg-slate-900 text-amber-300 border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                {isBn ? 'মিউনিসিপ্যালিটি / কর্পোরেশন (6% / 7%)' : 'Municipality / Corp (6% / 7%)'}
              </button>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {isBn ? 'জমি বা বাড়ির সরকারি বাজারমূল্য (Market Value ₹)' : 'Property Market / Consideration Value (₹)'}
              </label>
              <input
                type="number"
                value={marketValueStr}
                onChange={(e) => setMarketValueStr(e.target.value)}
                placeholder="e.g. 1200000"
                className="w-full rounded-xl border-2 border-indigo-300 px-3.5 py-2.5 text-base font-mono font-black"
              />
            </div>
          </div>
        </div>

        {/* Right Live Visual Report & Printable Slip */}
        <div className="lg:col-span-6">
          <div ref={printRef} className="bg-white rounded-2xl border-2 border-slate-900 p-6 space-y-5 text-slate-950">
            <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
              <div>
                <div className="text-xs font-bold text-emerald-700 uppercase">WEST BENGAL LAND SURVEY & REGISTRATION ESTIMATE</div>
                <h3 className="text-lg font-black mt-0.5">জমি মাপ ও দলিল খরচের রিপোর্ট</h3>
                {plotNote && <div className="text-xs text-slate-600 mt-0.5">{plotNote}</div>}
              </div>
              <span className="text-xs font-mono text-slate-500">{new Date().toLocaleDateString('en-IN')}</span>
            </div>

            {/* Visual Plot Sketch */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col items-center">
              <svg viewBox="0 0 320 170" className="w-full max-w-xs h-40">
                <polygon points="55,30 265,38 245,142 42,132" fill="#d1fae5" stroke="#065f46" strokeWidth="2.5" />
                {diagonal && <line x1="55" y1="30" x2="245" y2="142" stroke="#0284c7" strokeWidth="1.8" strokeDasharray="5 4" />}
                <text x="160" y="20" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0f172a">
                  N: {north || '—'} {unit}
                </text>
                <text x="150" y="160" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0f172a">
                  S: {south || '—'} {unit}
                </text>
                <text x="275" y="92" textAnchor="start" fontSize="11" fontWeight="bold" fill="#0f172a">
                  E: {east || '—'}
                </text>
                <text x="34" y="88" textAnchor="end" fontSize="11" fontWeight="bold" fill="#0f172a">
                  W: {west || '—'}
                </text>
                {diagonal && (
                  <text x="152" y="82" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0369a1">
                    Diag: {diagonal} {unit}
                  </text>
                )}
              </svg>
            </div>

            {/* Land Area Output */}
            {landCalc && 'error' in landCalc ? (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
                {landCalc.error}
              </div>
            ) : landCalc ? (
              <div className="space-y-3">
                <div className="text-[11px] font-semibold text-emerald-700">{landCalc.method}</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono tabular-nums">
                  <div className="p-3 rounded-xl bg-slate-900 text-white">
                    <div className="text-[10px] text-slate-400">SHATAK / DECIMAL</div>
                    <div className="text-lg font-black text-amber-300">{landCalc.shatak.toFixed(3)}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="text-[10px] text-emerald-700 font-bold">WB KATHA (720 sq.ft)</div>
                    <div className="text-lg font-black text-emerald-950">{landCalc.katha.toFixed(3)}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-500 font-bold">TOTAL SQ. FT</div>
                    <div className="text-lg font-black">{landCalc.sqFt.toFixed(1)}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <span className="text-slate-500 block">Bigha (বিঘা)</span>
                    <strong>{landCalc.bigha.toFixed(4)}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <span className="text-slate-500 block">Acre (একর)</span>
                    <strong>{landCalc.acre.toFixed(4)}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <span className="text-slate-500 block">Katha + Chhatak</span>
                    <strong>{Math.floor(landCalc.katha)}K {landCalc.chhatak.toFixed(1)}Ch</strong>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-2">
                {isBn ? 'উত্তর, দক্ষিণ, পূর্ব ও পশ্চিম বাহুর মাপ লিখলেই শতক, কাঠা ও বর্গফুট বের হয়ে যাবে।' : 'Enter North, South, East, and West sides to calculate exact West Bengal land area.'}
              </p>
            )}

            {/* Stamp Duty Output */}
            {stampCalc && (
              <div className="pt-4 border-t border-slate-200 space-y-2">
                <div className="text-xs font-black uppercase text-slate-700">
                  Indicative WB Stamp Duty & Registration ({areaType === 'municipality' ? 'Municipality' : 'Panchayat'})
                </div>
                <table className="w-full text-xs font-mono tabular-nums border-collapse">
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="py-2 text-slate-600 font-sans">Property Market Value</td>
                      <td className="py-2 text-right font-bold">₹{stampCalc.mv.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-slate-600 font-sans">Stamp Duty ({stampCalc.stampRate}%)</td>
                      <td className="py-2 text-right font-bold">₹{Math.round(stampCalc.stampDuty).toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-slate-600 font-sans">Registration Fee ({stampCalc.regRate}%)</td>
                      <td className="py-2 text-right font-bold">₹{Math.round(stampCalc.regFee).toLocaleString('en-IN')}</td>
                    </tr>
                    <tr className="bg-amber-50">
                      <td className="py-2.5 px-2 font-sans font-black text-slate-950">Estimated Govt Registration Cost</td>
                      <td className="py-2.5 px-2 text-right font-black text-base text-amber-900">
                        ₹{Math.round(stampCalc.totalGovCost).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-[10px] text-slate-500">
                  Note: Indicative estimate based on standard WB conveyance slabs; verify final e-Assessment at wbregistration.gov.in.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

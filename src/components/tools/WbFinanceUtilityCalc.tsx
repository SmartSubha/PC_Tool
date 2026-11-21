import React, { useMemo, useRef, useState } from 'react';
import { Calculator, Printer, Zap, Landmark, Percent } from 'lucide-react';
import type { AppLang } from '../../data/i18n';
import { printElementHtml } from '../../utils/printHelper';

interface WbFinanceUtilityCalcProps {
  appLang: AppLang;
}

type CalcTab = 'post-office' | 'emi' | 'wbsedcl';
type SchemeId = 'mis' | 'ssy' | 'kvp' | 'rd' | 'fd';

const PO_PRESETS: Record<SchemeId, { name: string; bn: string; defaultRate: number; defaultYears: number; mode: 'lump' | 'monthly' | 'yearly' }> = {
  mis: { name: 'Post Office MIS (Monthly Income)', bn: 'পোস্ট অফিস MIS (মাসিক আয়)', defaultRate: 7.4, defaultYears: 5, mode: 'lump' },
  ssy: { name: 'Sukanya Samriddhi Yojana (SSY)', bn: 'সুকন্যা সমৃদ্ধি যোজনা (SSY)', defaultRate: 8.2, defaultYears: 21, mode: 'yearly' },
  kvp: { name: 'Kisan Vikas Patra (KVP Double)', bn: 'কিষান বিকাশ পত্র (KVP)', defaultRate: 7.5, defaultYears: 9.58, mode: 'lump' },
  rd: { name: 'Post Office RD (5-Year Monthly)', bn: 'পোস্ট অফিস RD (৫ বছর)', defaultRate: 6.7, defaultYears: 5, mode: 'monthly' },
  fd: { name: 'Time Deposit / Bank FD', bn: 'ফিক্সড ডিপোজিট (FD)', defaultRate: 7.5, defaultYears: 5, mode: 'lump' },
};

export const WbFinanceUtilityCalc: React.FC<WbFinanceUtilityCalcProps> = ({ appLang }) => {
  const isBn = appLang === 'bn';
  const [tab, setTab] = useState<CalcTab>('post-office');

  // Post Office state
  const [scheme, setScheme] = useState<SchemeId>('mis');
  const [poAmount, setPoAmount] = useState('');
  const [poRate, setPoRate] = useState('7.4');
  const [poYears, setPoYears] = useState('5');

  // EMI state
  const [loanPrincipal, setLoanPrincipal] = useState('');
  const [loanRate, setLoanRate] = useState('');
  const [loanMonths, setLoanMonths] = useState('');

  // WBSEDCL Domestic Electricity Bill Estimator
  const [unitsStr, setUnitsStr] = useState('');
  const [billCycle, setBillCycle] = useState<'quarterly' | 'monthly'>('quarterly');
  const [customerNote, setCustomerNote] = useState('');

  const printRef = useRef<HTMLDivElement | null>(null);

  const selectScheme = (s: SchemeId) => {
    setScheme(s);
    setPoRate(String(PO_PRESETS[s].defaultRate));
    setPoYears(String(PO_PRESETS[s].defaultYears));
  };

  const poResult = useMemo(() => {
    const P = parseFloat(poAmount);
    const r = parseFloat(poRate) / 100;
    const t = parseFloat(poYears);
    if (!Number.isFinite(P) || P <= 0 || !Number.isFinite(r) || r <= 0 || !Number.isFinite(t) || t <= 0) return null;

    if (scheme === 'mis') {
      const monthlyIncome = (P * r) / 12;
      const totalInterest = monthlyIncome * 12 * t;
      return {
        invested: P,
        interest: totalInterest,
        maturity: P + totalInterest,
        monthlyPayout: monthlyIncome,
        extraNote: `Monthly interest credited to savings account: ₹${Math.round(monthlyIncome).toLocaleString('en-IN')}/month`,
      };
    }
    if (scheme === 'rd') {
      const n = Math.round(t * 12);
      const i = r / 4; // quarterly compounding
      let maturity = 0;
      for (let m = 1; m <= n; m++) {
        const quartersRemaining = (n - m + 1) / 3;
        maturity += P * Math.pow(1 + i, quartersRemaining);
      }
      const invested = P * n;
      return { invested, interest: maturity - invested, maturity, monthlyPayout: 0, extraNote: `${n} monthly installments of ₹${P.toLocaleString('en-IN')}` };
    }
    if (scheme === 'ssy') {
      // Yearly deposits for first 15 years, compounds annually until maturity year (default 21)
      const depositYears = Math.min(15, Math.round(t));
      let bal = 0;
      for (let yr = 1; yr <= Math.round(t); yr++) {
        if (yr <= depositYears) bal += P;
        bal = bal * (1 + r);
      }
      const invested = P * depositYears;
      return {
        invested,
        interest: bal - invested,
        maturity: bal,
        monthlyPayout: 0,
        extraNote: `Deposited for ${depositYears} years · Tax-free maturity at Year ${Math.round(t)}`,
      };
    }
    // KVP / FD quarterly or annual compounding
    const comp = scheme === 'kvp' ? 1 : 4;
    const maturity = P * Math.pow(1 + r / comp, comp * t);
    return {
      invested: P,
      interest: maturity - P,
      maturity,
      monthlyPayout: 0,
      extraNote: scheme === 'kvp' ? 'Money doubles in approx. 115 months (9 yrs 7 months) at 7.5%.' : `Compounded quarterly over ${t} years.`,
    };
  }, [scheme, poAmount, poRate, poYears]);

  const emiResult = useMemo(() => {
    const P = parseFloat(loanPrincipal);
    const annual = parseFloat(loanRate);
    const n = parseInt(loanMonths, 10);
    if (!Number.isFinite(P) || P <= 0 || !Number.isFinite(annual) || annual <= 0 || !Number.isFinite(n) || n <= 0) return null;
    const r = annual / 12 / 100;
    const pow = Math.pow(1 + r, n);
    const emi = (P * r * pow) / (pow - 1);
    const totalPayable = emi * n;
    const totalInterest = totalPayable - P;
    return { emi, totalPayable, totalInterest, principal: P, months: n };
  }, [loanPrincipal, loanRate, loanMonths]);

  const billResult = useMemo(() => {
    const u = parseFloat(unitsStr);
    if (!Number.isFinite(u) || u <= 0) return null;
    // Indicative WBSEDCL Domestic (Rural/Urban average) tiered slabs (Quarterly = 3x monthly slab thresholds)
    const mult = billCycle === 'quarterly' ? 3 : 1;
    const slabs = [
      { label: `0 – ${Math.round(34 * mult)} units`, cap: 34 * mult, rate: 5.3 },
      { label: `${Math.round(34 * mult) + 1} – ${Math.round(60 * mult)} units`, cap: 26 * mult, rate: 5.97 },
      { label: `${Math.round(60 * mult) + 1} – ${Math.round(100 * mult)} units`, cap: 40 * mult, rate: 6.97 },
      { label: `${Math.round(100 * mult) + 1} – ${Math.round(200 * mult)} units`, cap: 100 * mult, rate: 7.31 },
      { label: `Above ${Math.round(200 * mult)} units`, cap: Infinity, rate: 8.99 },
    ];
    let rem = u;
    const breakdown: { label: string; units: number; rate: number; charge: number }[] = [];
    for (const s of slabs) {
      if (rem <= 0) break;
      const used = Math.min(rem, s.cap);
      breakdown.push({ label: s.label, units: used, rate: s.rate, charge: used * s.rate });
      rem -= used;
    }
    const energyCharge = breakdown.reduce((sum, b) => sum + b.charge, 0);
    const fixedCharge = billCycle === 'quarterly' ? 45 : 15;
    const meterRent = billCycle === 'quarterly' ? 30 : 10;
    const mvcaEst = u * 0.25;
    const total = energyCharge + fixedCharge + meterRent + mvcaEst;
    return { units: u, breakdown, energyCharge, fixedCharge, meterRent, mvcaEst, total };
  }, [unitsStr, billCycle]);

  return (
    <div className="space-y-6">
      <div className="bg-slate-950 text-white rounded-2xl p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
            <Calculator className="w-4 h-4" />
            <span>{isBn ? 'পোস্ট অফিস স্কিম (MIS/SSY/KVP/RD/FD) · ব্যাংক EMI · WBSEDCL ইলেকট্রিক বিল এস্টিমেটর' : 'Post Office Schemes (MIS/SSY/KVP/RD) · Loan EMI · WBSEDCL Bill Estimator'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-1">
            {isBn ? 'পোস্ট অফিস, EMI ও WBSEDCL ইলেকট্রিক বিল ক্যালকুলেটর' : 'Post Office, EMI & WBSEDCL Utility Calculator'}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
          {[
            { id: 'post-office', label: isBn ? 'পোস্ট অফিস / FD' : 'Post Office / FD', icon: Landmark },
            { id: 'emi', label: isBn ? 'লোন EMI' : 'Loan EMI', icon: Percent },
            { id: 'wbsedcl', label: isBn ? 'ইলেকট্রিক বিল' : 'WBSEDCL Bill', icon: Zap },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id as CalcTab)}
              className={`px-3 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
                tab === item.id ? 'bg-amber-400 text-slate-950' : 'text-slate-300'
              }`}
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <input
            value={customerNote}
            onChange={(e) => setCustomerNote(e.target.value)}
            placeholder={isBn ? 'কাস্টমারের নাম (প্রিন্ট চার্টে থাকবে, ঐচ্ছিক)' : 'Customer Name (Optional for Printable Chart)'}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
          />

          {tab === 'post-office' && (
            <>
              <div className="grid grid-cols-1 gap-1.5">
                {(Object.keys(PO_PRESETS) as SchemeId[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => selectScheme(k)}
                    className={`px-3 py-2 rounded-xl text-left text-xs font-bold border cursor-pointer flex justify-between ${
                      scheme === k ? 'bg-slate-900 text-amber-300 border-slate-900' : 'bg-slate-50 text-slate-800 border-slate-200'
                    }`}
                  >
                    <span>{isBn ? PO_PRESETS[k].bn : PO_PRESETS[k].name}</span>
                    <span className="font-mono">{PO_PRESETS[k].defaultRate}%</span>
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {PO_PRESETS[scheme].mode === 'monthly'
                    ? 'Monthly Deposit (₹)'
                    : PO_PRESETS[scheme].mode === 'yearly'
                    ? 'Yearly Deposit (₹)'
                    : 'Lump-Sum Deposit Amount (₹)'}
                </label>
                <input type="number" value={poAmount} onChange={(e) => setPoAmount(e.target.value)} placeholder="e.g. 100000" className="w-full rounded-xl border-2 border-indigo-300 px-3 py-2.5 text-base font-mono font-black" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Interest Rate (% p.a.)</label>
                  <input type="number" step="0.1" value={poRate} onChange={(e) => setPoRate(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Duration (Years)</label>
                  <input type="number" step="0.1" value={poYears} onChange={(e) => setPoYears(e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono font-bold" />
                </div>
              </div>
            </>
          )}

          {tab === 'emi' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Loan Amount (₹)</label>
                <input type="number" value={loanPrincipal} onChange={(e) => setLoanPrincipal(e.target.value)} placeholder="e.g. 500000" className="w-full rounded-xl border-2 border-indigo-300 px-3 py-2.5 text-base font-mono font-black" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Interest Rate (% p.a.)</label>
                  <input type="number" step="0.1" value={loanRate} onChange={(e) => setLoanRate(e.target.value)} placeholder="e.g. 9.5" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tenure (Months)</label>
                  <input type="number" value={loanMonths} onChange={(e) => setLoanMonths(e.target.value)} placeholder="e.g. 60" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono font-bold" />
                </div>
              </div>
            </>
          )}

          {tab === 'wbsedcl' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBillCycle('quarterly')}
                  className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                    billCycle === 'quarterly' ? 'bg-slate-900 text-amber-300 border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  Quarterly (3 Months)
                </button>
                <button
                  type="button"
                  onClick={() => setBillCycle('monthly')}
                  className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                    billCycle === 'monthly' ? 'bg-slate-900 text-amber-300 border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  Monthly (1 Month)
                </button>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isBn ? 'মোট কনজিউমড ইউনিট (Total Units kWh)' : 'Consumed Electricity Units (kWh)'}
                </label>
                <input type="number" value={unitsStr} onChange={(e) => setUnitsStr(e.target.value)} placeholder="e.g. 280" className="w-full rounded-xl border-2 border-amber-400 px-3 py-2.5 text-base font-mono font-black" />
              </div>
            </>
          )}

          <button
            type="button"
            onClick={() => printRef.current && printElementHtml(printRef.current, 'Customer Financial Estimate Chart')}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            {isBn ? 'কাস্টমারের জন্য চার্ট প্রিন্ট করুন' : 'Print Customer Estimate Slip'}
          </button>
        </div>

        {/* Right Live Printable Breakdown */}
        <div className="lg:col-span-7">
          <div ref={printRef} className="bg-white rounded-2xl border-2 border-slate-900 p-6 space-y-5 text-slate-950">
            <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
              <div>
                <div className="text-xs font-bold text-indigo-700 uppercase">
                  {tab === 'post-office'
                    ? PO_PRESETS[scheme].name
                    : tab === 'emi'
                    ? 'BANK LOAN EMI ESTIMATE'
                    : `WBSEDCL DOMESTIC BILL ESTIMATE (${billCycle.toUpperCase()})`}
                </div>
                {customerNote && <div className="text-sm font-black mt-0.5">Prepared for: {customerNote}</div>}
              </div>
              <span className="text-xs font-mono text-slate-500">{new Date().toLocaleDateString('en-IN')}</span>
            </div>

            {tab === 'post-office' && (
              poResult ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono tabular-nums">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[11px] font-sans text-slate-500 font-bold">Total Deposited</div>
                      <div className="text-lg font-black mt-1">₹{Math.round(poResult.invested).toLocaleString('en-IN')}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                      <div className="text-[11px] font-sans text-emerald-800 font-bold">Total Interest Earned</div>
                      <div className="text-lg font-black text-emerald-800 mt-1">₹{Math.round(poResult.interest).toLocaleString('en-IN')}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-950 text-white">
                      <div className="text-[11px] font-sans text-slate-400 font-bold">Maturity Value</div>
                      <div className="text-lg font-black text-amber-300 mt-1">₹{Math.round(poResult.maturity).toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-950">
                    {poResult.extraNote}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-10 text-center">Enter deposit amount on the left to calculate maturity & monthly returns.</p>
              )
            )}

            {tab === 'emi' && (
              emiResult ? (
                <div className="space-y-4 font-mono tabular-nums">
                  <div className="p-5 rounded-xl bg-slate-950 text-white text-center">
                    <div className="text-xs font-sans text-slate-400 font-bold">ESTIMATED MONTHLY EMI</div>
                    <div className="text-3xl font-black text-amber-300 mt-1">₹{Math.round(emiResult.emi).toLocaleString('en-IN')} / month</div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-[11px] font-sans text-slate-500">Principal</div>
                      <div className="text-base font-black">₹{Math.round(emiResult.principal).toLocaleString('en-IN')}</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200">
                      <div className="text-[11px] font-sans text-rose-700">Total Interest</div>
                      <div className="text-base font-black text-rose-800">₹{Math.round(emiResult.totalInterest).toLocaleString('en-IN')}</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                      <div className="text-[11px] font-sans text-emerald-700">Total Payable</div>
                      <div className="text-base font-black text-emerald-900">₹{Math.round(emiResult.totalPayable).toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-10 text-center">Enter Loan Principal, Interest Rate %, and Months to compute exact EMI.</p>
              )
            )}

            {tab === 'wbsedcl' && (
              billResult ? (
                <div className="space-y-4">
                  <table className="w-full text-xs border-collapse font-mono tabular-nums">
                    <thead>
                      <tr className="bg-slate-900 text-white">
                        <th className="p-2.5 text-left font-sans">Slab</th>
                        <th className="p-2.5 text-right">Units</th>
                        <th className="p-2.5 text-right">Rate (₹)</th>
                        <th className="p-2.5 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {billResult.breakdown.map((b, i) => (
                        <tr key={i}>
                          <td className="p-2.5 font-sans font-semibold">{b.label}</td>
                          <td className="p-2.5 text-right">{b.units.toFixed(1)}</td>
                          <td className="p-2.5 text-right">{b.rate.toFixed(2)}</td>
                          <td className="p-2.5 text-right font-bold">₹{b.charge.toFixed(2)}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50">
                        <td colSpan={3} className="p-2 font-sans text-slate-600">Fixed Charge + Meter Rent + Indicative MVCA</td>
                        <td className="p-2 text-right font-bold">₹{(billResult.fixedCharge + billResult.meterRent + billResult.mvcaEst).toFixed(2)}</td>
                      </tr>
                      <tr className="bg-amber-50">
                        <td colSpan={3} className="p-3 font-sans font-black text-sm">Estimated Total Payable Bill</td>
                        <td className="p-3 text-right font-black text-base text-amber-900">₹{Math.round(billResult.total).toLocaleString('en-IN')}</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="text-[10px] text-slate-500">
                    Indicative WBSEDCL slab estimate excluding state subsidy/rebates; verify official bill on wbsedcl.in.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-10 text-center">Enter consumed units (kWh) to see slab-by-slab WBSEDCL bill calculation.</p>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

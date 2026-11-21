import React, { useRef, useState } from 'react';
import { Landmark, Printer, RotateCcw } from 'lucide-react';
import type { AppLang } from '../../data/i18n';
import { numberToIndianWordsBn, numberToIndianWordsEn } from '../../utils/bengaliPhonetic';
import { printElementHtml } from '../../utils/printHelper';

interface BankChequeChallanPrinterProps {
  appLang: AppLang;
}

const BANK_PRESETS = [
  { id: 'sbi', name: 'State Bank of India (SBI / CTS-2010)', dx: 0, dy: 0 },
  { id: 'hdfc', name: 'HDFC Bank (CTS-2010)', dx: 1, dy: -1 },
  { id: 'icici', name: 'ICICI Bank (CTS-2010)', dx: 0, dy: 1 },
  { id: 'pnb', name: 'Punjab National Bank (PNB)', dx: -1, dy: 0 },
  { id: 'axis', name: 'Axis / Bandhan Bank', dx: 1, dy: 0 },
];

export const BankChequeChallanPrinter: React.FC<BankChequeChallanPrinterProps> = ({ appLang }) => {
  const isBn = appLang === 'bn';
  const [docType, setDocType] = useState<'cheque' | 'deposit'>('cheque');
  const [bankId, setBankId] = useState('sbi');
  const [textOnlyPrint, setTextOnlyPrint] = useState(true);
  const [wordsLang, setWordsLang] = useState<'en' | 'bn'>('en');
  const [acPayee, setAcPayee] = useState(true);

  // Fine alignment offsets in mm
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  // Empty-default cheque / deposit fields
  const [payeeName, setPayeeName] = useState('');
  const [chequeDate, setChequeDate] = useState(''); // YYYY-MM-DD
  const [amountStr, setAmountStr] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [branchName, setBranchName] = useState('');
  const [depositorPhone, setDepositorPhone] = useState('');

  const printRef = useRef<HTMLDivElement | null>(null);

  const amountVal = parseFloat(amountStr);
  const hasAmount = Number.isFinite(amountVal) && amountVal > 0;
  const amountWords = hasAmount
    ? wordsLang === 'bn'
      ? numberToIndianWordsBn(amountVal)
      : numberToIndianWordsEn(amountVal)
    : '';

  const formattedDigitsDate = (() => {
    if (!chequeDate || !/^\d{4}-\d{2}-\d{2}$/.test(chequeDate)) return [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '];
    const [yyyy, mm, dd] = chequeDate.split('-');
    return `${dd}${mm}${yyyy}`.split('');
  })();

  const formattedFigure = hasAmount
    ? `${amountVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/-`
    : '';

  const handleBankChange = (id: string) => {
    setBankId(id);
    const p = BANK_PRESETS.find((b) => b.id === id);
    if (p) {
      setOffsetX(p.dx);
      setOffsetY(p.dy);
    }
  };

  const handleReset = () => {
    setPayeeName('');
    setChequeDate('');
    setAmountStr('');
    setAccountNo('');
    setBranchName('');
    setDepositorPhone('');
    setOffsetX(0);
    setOffsetY(0);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-950 text-white rounded-2xl p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
            <Landmark className="w-4 h-4" />
            <span>{isBn ? 'CTS-2010 স্ট্যান্ডার্ড ব্যাংক চেক (২০২×৯২ মিমি) + অটো কথায় টাকা + mm অ্যালাইনমেন্ট' : 'CTS-2010 Bank Cheque (202×92mm) · Auto Rupee Words · mm Alignment'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-1">
            {isBn ? 'ব্যাংক চেক ও ডিপোজিট স্লিপ অ্যালাইনমেন্ট প্রিন্টার' : 'Bank Cheque & Deposit Slip Alignment Printer'}
          </h2>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setDocType('cheque')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer ${
              docType === 'cheque' ? 'bg-emerald-400 text-slate-950' : 'text-slate-300'
            }`}
          >
            CTS-2010 Bank Cheque
          </button>
          <button
            type="button"
            onClick={() => setDocType('deposit')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer ${
              docType === 'deposit' ? 'bg-emerald-400 text-slate-950' : 'text-slate-300'
            }`}
          >
            Deposit Slip / Challan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bank Layout Preset</label>
              <select
                value={bankId}
                onChange={(e) => handleBankChange(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold bg-white"
              >
                {BANK_PRESETS.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Words Language</label>
              <select
                value={wordsLang}
                onChange={(e) => setWordsLang(e.target.value as 'en' | 'bn')}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold bg-white"
              >
                <option value="en">English (Rupees Only)</option>
                <option value="bn">বাংলা (টাকা মাত্র)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {docType === 'cheque' ? (isBn ? 'প্রাপকের নাম (Payee Name)' : 'Payee Name') : (isBn ? 'অ্যাকাউন্ট হোল্ডারের নাম' : 'Account Holder Name')}
            </label>
            <input
              type="text"
              value={payeeName}
              onChange={(e) => setPayeeName(e.target.value)}
              placeholder="Enter Payee / Account Holder Name"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={chequeDate}
                onChange={(e) => setChequeDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border-2 border-emerald-400 px-3 py-2 text-sm font-mono font-bold"
              />
            </div>
          </div>

          {amountWords && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900">
              {amountWords}
            </div>
          )}

          {docType === 'deposit' && (
            <div className="grid grid-cols-2 gap-3">
              <input value={accountNo} onChange={(e) => setAccountNo(e.target.value)} placeholder="Account Number" className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono" />
              <input value={branchName} onChange={(e) => setBranchName(e.target.value)} placeholder="Branch Name" className="rounded-xl border border-slate-300 px-3 py-2 text-xs" />
              <input value={depositorPhone} onChange={(e) => setDepositorPhone(e.target.value)} placeholder="Depositor Mobile" className="col-span-2 rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono" />
            </div>
          )}

          {docType === 'cheque' && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="text-xs font-bold text-slate-800">
                {isBn ? 'প্রিন্টার ফিড অ্যালাইনমেন্ট (mm অফসেট)' : 'Printer Feed Alignment Offset (mm)'}
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <label>
                  <span>Left / Right ({offsetX} mm)</span>
                  <input type="range" min={-12} max={12} step={0.5} value={offsetX} onChange={(e) => setOffsetX(Number(e.target.value))} className="w-full accent-emerald-600 mt-1" />
                </label>
                <label>
                  <span>Up / Down ({offsetY} mm)</span>
                  <input type="range" min={-10} max={10} step={0.5} value={offsetY} onChange={(e) => setOffsetY(Number(e.target.value))} className="w-full accent-emerald-600 mt-1" />
                </label>
              </div>
              <div className="flex flex-wrap gap-4 pt-1">
                <label className="inline-flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                  <input type="checkbox" checked={acPayee} onChange={(e) => setAcPayee(e.target.checked)} className="accent-emerald-600" />
                  A/C PAYEE ONLY Crossing
                </label>
                <label className="inline-flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                  <input type="checkbox" checked={textOnlyPrint} onChange={(e) => setTextOnlyPrint(e.target.checked)} className="accent-emerald-600" />
                  Print Text Only (Real Cheque)
                </label>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Clear
            </button>
            <button
              type="button"
              onClick={() => printRef.current && printElementHtml(printRef.current, docType === 'cheque' ? 'Bank Cheque Alignment Print' : 'Bank Deposit Slip')}
              className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              {isBn ? 'প্রিন্ট প্রিভিউ (mm স্কেলসহ)' : 'Open Print Preview'}
            </button>
          </div>
        </div>

        {/* Right Live CTS-2010 Cheque / Deposit Slip */}
        <div className="lg:col-span-7 bg-slate-100 rounded-2xl border border-slate-300 p-4 overflow-x-auto flex items-center justify-center">
          <div ref={printRef} className="w-full">
            {docType === 'cheque' ? (
              <div
                className={`relative mx-auto bg-white select-none ${
                  textOnlyPrint ? 'border border-dashed border-sky-300 print:border-0' : 'border-2 border-slate-800'
                }`}
                style={{
                  width: '202mm',
                  height: '92mm',
                  maxWidth: '100%',
                  background: textOnlyPrint ? '#ffffff' : 'linear-gradient(135deg, #f0f9ff 0%, #ffffff 55%, #ecfdf5 100%)',
                }}
              >
                {/* Visual Guide Labels (hidden when textOnlyPrint during print) */}
                <div className={`absolute inset-0 pointer-events-none ${textOnlyPrint ? 'print:hidden' : ''}`}>
                  <div className="absolute top-2 left-3 text-[9px] font-bold text-slate-400">
                    CTS-2010 CHEQUE TEMPLATE · 202 × 92 mm ({BANK_PRESETS.find((b) => b.id === bankId)?.name})
                  </div>
                  <div className="absolute left-5 top-[27mm] text-[10px] font-semibold text-slate-400">PAY</div>
                  <div className="absolute left-5 top-[39mm] text-[10px] font-semibold text-slate-400">RUPEES</div>
                  <div className="absolute right-[8mm] top-[38mm] w-[42mm] h-[11mm] border border-slate-300 rounded-sm" />
                  <div className="absolute bottom-3 left-0 right-0 text-center text-[9px] font-mono text-slate-300 tracking-widest">
                    ⑈ 000000 ⑈ 700002001 ⑆ 000000 ⑈ 31
                  </div>
                </div>

                {/* Actual Printable Ink Layer shifted by offsetX / offsetY */}
                <div
                  className="absolute inset-0 text-slate-950 font-sans"
                  style={{ transform: `translate(${offsetX}mm, ${offsetY}mm)` }}
                >
                  {/* A/C Payee Diagonal Crossing */}
                  {acPayee && (
                    <div className="absolute top-[5mm] left-[6mm] -rotate-25 border-y-2 border-slate-950 px-2 py-0.5 text-[9px] font-black tracking-widest">
                      A/C PAYEE ONLY
                    </div>
                  )}

                  {/* Spaced Date Boxes DD MM YYYY */}
                  <div className="absolute top-[8mm] right-[9mm] flex gap-[2.3mm] font-mono font-bold text-[13px]">
                    {formattedDigitsDate.map((ch, idx) => (
                      <span
                        key={idx}
                        className="w-[4.6mm] h-[6.5mm] flex items-center justify-center border border-slate-300 print:border-0"
                      >
                        {ch}
                      </span>
                    ))}
                  </div>

                  {/* Payee Name */}
                  <div className="absolute left-[19mm] top-[25mm] right-[18mm] text-[14px] font-bold tracking-wide">
                    {payeeName ? `** ${payeeName.toUpperCase()} **` : ''}
                  </div>

                  {/* Amount in Words */}
                  <div className="absolute left-[24mm] top-[37mm] w-[116mm] text-[12px] font-bold leading-[7.5mm]">
                    {amountWords ? `** ${amountWords} **` : ''}
                  </div>

                  {/* Amount in Figures */}
                  <div className="absolute right-[10mm] top-[40.5mm] w-[39mm] text-right font-mono font-black text-[14px]">
                    {formattedFigure ? `** ${formattedFigure}` : ''}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border-2 border-slate-900 p-6 max-w-2xl mx-auto text-slate-950 font-sans">
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                  <div>
                    <div className="text-lg font-black uppercase">
                      {BANK_PRESETS.find((b) => b.id === bankId)?.name || 'BANK DEPOSIT SLIP'}
                    </div>
                    <div className="text-xs text-slate-600">Branch: {branchName || '______________________'}</div>
                  </div>
                  <div className="text-right text-xs font-mono">
                    <div>CASH / CHEQUE PAY-IN SLIP</div>
                    <div className="font-bold mt-0.5">Date: {chequeDate || '____ / ____ / 20__'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 text-sm">
                  <div>
                    <span className="text-xs text-slate-500 block">Account Number</span>
                    <div className="font-mono font-black text-base border-b border-slate-400 pb-1">
                      {accountNo || '_______________________'}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Account Holder Name</span>
                    <div className="font-bold border-b border-slate-400 pb-1">
                      {payeeName || '_______________________'}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Depositor Mobile</span>
                    <div className="font-mono font-semibold border-b border-slate-400 pb-1">
                      {depositorPhone || '_______________________'}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Total Amount (₹)</span>
                    <div className="font-mono font-black text-lg border-b border-slate-900 pb-1">
                      {formattedFigure ? `₹ ${formattedFigure}` : '₹ _______________'}
                    </div>
                  </div>
                </div>

                <div className="py-2 text-xs">
                  <span className="text-slate-500 font-semibold">Amount in Words: </span>
                  <strong className="text-slate-950">{amountWords || '_____________________________________________________'}</strong>
                </div>

                <div className="grid grid-cols-2 gap-10 pt-10 text-xs text-center">
                  <div className="border-t border-slate-700 pt-1.5 font-semibold">Depositor Signature</div>
                  <div className="border-t border-slate-700 pt-1.5 font-semibold">Cashier / Bank Stamp & Sign</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

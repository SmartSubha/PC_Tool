import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Barcode, Printer, RotateCcw } from 'lucide-react';
import type { AppLang } from '../../data/i18n';
import { printElementHtml } from '../../utils/printHelper';

interface BarcodeLabelSheetMakerProps {
  appLang: AppLang;
}

// Genuine Code-39 encoding patterns (9 elements: wide='w', narrow='n', alternating bar/space)
const CODE39_MAP: Record<string, string> = {
  '0': 'nnnwwnwnn', '1': 'wnnwnnnnw', '2': 'nnwwnnnnw', '3': 'wnwwnnnnn', '4': 'nnnwwnnnw',
  '5': 'wnnwwnnnn', '6': 'nnwwwnnnn', '7': 'nnnwnnwnw', '8': 'wnnwnnwnn', '9': 'nnwwnnwnn',
  A: 'wnnnnwnnw', B: 'nnwnnwnnw', C: 'wnwnnwnnn', D: 'nnnnwwnnw', E: 'wnnnwwnnn',
  F: 'nnwnwwnnn', G: 'nnnnnwwnw', H: 'wnnnnwwnn', I: 'nnwnnwwnn', J: 'nnnnwwwnn',
  K: 'wnnnnnnww', L: 'nnwnnnnww', M: 'wnwnnnnwn', N: 'nnnnwnnww', O: 'wnnnwnnwn',
  P: 'nnwnwnnwn', Q: 'nnnnnnwww', R: 'wnnnnnwwn', S: 'nnwnnnwwn', T: 'nnnnwnwwn',
  U: 'wwnnnnnnw', V: 'nwwnnnnnw', W: 'wwwnnnnnn', X: 'nwnnwnnnw', Y: 'wwnnwnnnn',
  Z: 'nwwnwnnnn', '-': 'nwnnnnwnw', '.': 'wwnnnnwnn', ' ': 'nwwnnnwnn', '*': 'nwnnwnwnn',
};

const Code39Svg: React.FC<{ value: string }> = ({ value }) => {
  const clean = `*${(value || 'SKU001').toUpperCase().replace(/[^0-9A-Z\-. ]/g, '').slice(0, 16)}*`;
  const bars: { x: number; w: number }[] = [];
  let cursor = 4;

  for (const ch of clean) {
    const pattern = CODE39_MAP[ch] || CODE39_MAP['0'];
    for (let i = 0; i < pattern.length; i++) {
      const w = pattern[i] === 'w' ? 3 : 1;
      if (i % 2 === 0) {
        bars.push({ x: cursor, w });
      }
      cursor += w;
    }
    cursor += 1; // inter-character narrow space
  }
  const totalWidth = cursor + 4;

  return (
    <svg viewBox={`0 0 ${totalWidth} 38`} className="w-full h-9 block" preserveAspectRatio="none">
      <rect width={totalWidth} height="38" fill="#ffffff" />
      {bars.map((b, i) => (
        <rect key={i} x={b.x} y={2} width={b.w} height={34} fill="#0f172a" />
      ))}
    </svg>
  );
};

export const BarcodeLabelSheetMaker: React.FC<BarcodeLabelSheetMakerProps> = ({ appLang }) => {
  const isBn = appLang === 'bn';
  const [labelType, setLabelType] = useState<'barcode' | 'qr' | 'address'>('barcode');
  const [gridPreset, setGridPreset] = useState<'12' | '24' | '40'>('24');

  // Empty-default inputs
  const [shopOrBrand, setShopOrBrand] = useState('');
  const [itemTitle, setItemTitle] = useState('');
  const [codeValue, setCodeValue] = useState('');
  const [mrpPrice, setMrpPrice] = useState('');
  const [subLine, setSubLine] = useState('');
  const [qrUrl, setQrUrl] = useState('');

  const sheetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const payload = codeValue.trim() || `${shopOrBrand} ${itemTitle} ${mrpPrice}`.trim() || 'ITEM-001';
    QRCode.toDataURL(payload, { width: 120, margin: 1 })
      .then(setQrUrl)
      .catch(() => setQrUrl(''));
  }, [codeValue, shopOrBrand, itemTitle, mrpPrice]);

  const count = Number(gridPreset);
  const colsClass = gridPreset === '12' ? 'grid-cols-2' : gridPreset === '24' ? 'grid-cols-3' : 'grid-cols-4';

  return (
    <div className="space-y-6">
      <div className="bg-slate-950 text-white rounded-2xl p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
            <Barcode className="w-4 h-4" />
            <span>{isBn ? '১টি A4 স্টিকার শিটে ১২ / ২৪ / ৪০টি বারকোড প্রাইস-ট্যাগ বা কুরিয়ার অ্যাড্রেস লেবেল' : 'Scannable Code-39 Barcodes · QR Price Tags · 12 / 24 / 40-Up A4 Sticker Grids'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-1">
            {isBn ? 'স্মার্ট বারকোড, QR প্রাইস-ট্যাগ ও A4 স্টিকার শিট মেকার' : 'Smart Barcode, QR Price-Tag & A4 Sticker Sheet Maker'}
          </h2>
        </div>

        <button
          type="button"
          onClick={() => sheetRef.current && printElementHtml(sheetRef.current, `A4 ${count}-Label Sticker Sheet`)}
          className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs inline-flex items-center gap-2 cursor-pointer"
        >
          <Printer className="w-4 h-4" /> Print {count}-Sticker A4 Sheet
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 space-y-3.5 h-fit">
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'barcode', label: 'Barcode Tag' },
              { id: 'qr', label: 'QR Sticker' },
              { id: 'address', label: 'Address / Book' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setLabelType(t.id as typeof labelType)}
                className={`py-2 rounded-lg text-xs font-bold border cursor-pointer ${
                  labelType === t.id ? 'bg-slate-900 text-amber-300 border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div>
            <div className="text-xs font-bold text-slate-600 mb-1.5">Labels per A4 Sheet</div>
            <div className="grid grid-cols-3 gap-1.5">
              {(['12', '24', '40'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGridPreset(g)}
                  className={`py-2 rounded-lg text-xs font-mono font-bold border cursor-pointer ${
                    gridPreset === g ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {g} / A4
                </button>
              ))}
            </div>
          </div>

          <input value={shopOrBrand} onChange={(e) => setShopOrBrand(e.target.value)} placeholder="Shop / Brand / Courier Sender Name" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold" />
          <input value={itemTitle} onChange={(e) => setItemTitle(e.target.value)} placeholder={labelType === 'address' ? 'Recipient Name / Book Title' : 'Product / Item Name'} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs" />
          <div className="grid grid-cols-2 gap-2">
            <input value={codeValue} onChange={(e) => setCodeValue(e.target.value)} placeholder="SKU / Barcode (e.g. PRD-101)" className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono uppercase" />
            <input value={mrpPrice} onChange={(e) => setMrpPrice(e.target.value)} placeholder="MRP ₹ (e.g. 250)" className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono font-bold" />
          </div>
          <input value={subLine} onChange={(e) => setSubLine(e.target.value)} placeholder={labelType === 'address' ? 'Address / Pin / Mobile' : 'Mfg / Exp / Weight / Note'} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs" />

          <button
            type="button"
            onClick={() => { setShopOrBrand(''); setItemTitle(''); setCodeValue(''); setMrpPrice(''); setSubLine(''); }}
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Clear Fields
          </button>
        </div>

        {/* Right Live A4 Sticker Grid */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-4 overflow-x-auto">
          <div ref={sheetRef} className="bg-white p-2 text-slate-950 font-sans">
            <div className={`grid ${colsClass} gap-2`}>
              {Array.from({ length: count }).map((_, idx) => (
                <div
                  key={idx}
                  className="border border-dashed border-slate-400 rounded-md p-2 flex flex-col justify-between bg-white min-h-[92px]"
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0">
                      <div className="text-[9px] font-black uppercase tracking-wider text-slate-500 truncate">
                        {shopOrBrand || 'SHOP / STORE'}
                      </div>
                      <div className="text-[11px] font-bold text-slate-950 truncate">
                        {itemTitle || 'Item / Label Name'}
                      </div>
                    </div>
                    {mrpPrice && (
                      <span className="text-[11px] font-mono font-black text-slate-950 shrink-0">
                        ₹{mrpPrice}
                      </span>
                    )}
                  </div>

                  {labelType === 'barcode' && (
                    <div className="my-1">
                      <Code39Svg value={codeValue || 'SKU-001'} />
                      <div className="text-[9px] font-mono text-center font-bold tracking-widest text-slate-700">
                        {(codeValue || 'SKU-001').toUpperCase()}
                      </div>
                    </div>
                  )}

                  {labelType === 'qr' && (
                    <div className="my-1 flex items-center gap-2">
                      {qrUrl && <img src={qrUrl} alt="Tag QR" className="w-11 h-11 object-contain shrink-0" />}
                      <div className="text-[9px] font-mono text-slate-700 break-all leading-tight">
                        {codeValue || 'SCAN-TAG'}
                        {subLine && <div className="font-sans text-slate-500 mt-0.5">{subLine}</div>}
                      </div>
                    </div>
                  )}

                  {labelType === 'address' && (
                    <div className="text-[10px] text-slate-700 leading-snug my-1">
                      {subLine || 'Address / Class / Phone No.'}
                    </div>
                  )}

                  {labelType === 'barcode' && subLine && (
                    <div className="text-[8px] text-slate-500 truncate">{subLine}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

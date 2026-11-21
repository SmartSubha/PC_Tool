import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Printer, Plus, Trash2, Sparkles, Receipt, QrCode as QrIcon } from 'lucide-react';
import type { OwnerContactConfig } from '../../data/ownerConfig';
import type { AppLang } from '../../data/i18n';
import { printElementHtml } from '../../utils/printHelper';
import { AgeLandCalculator } from './AgeLandCalculator';
import { CyberCafeCalculator } from './CyberCafeCalculator';
import { BengaliTypingConverter } from './BengaliTypingConverter';
import { UpiVoiceCounter } from './UpiVoiceCounter';
import { QueueTokenWhatsapp } from './QueueTokenWhatsapp';
import { ShopRateNoticePoster } from './ShopRateNoticePoster';
import { MobilePcQrTransfer } from './MobilePcQrTransfer';
import { CyberCafeKhataLedger } from './CyberCafeKhataLedger';
import { WbLandStampDutyCalc } from './WbLandStampDutyCalc';
import { WbFinanceUtilityCalc } from './WbFinanceUtilityCalc';
import { BarcodeLabelSheetMaker } from './BarcodeLabelSheetMaker';

interface UtilityToolsWorkspaceProps {
  toolId: string;
  ownerConfig: OwnerContactConfig;
  appLang: AppLang;
}

interface InvoiceLineItem {
  id: string;
  serviceName: string;
  notes: string;
  qty: number;
  rate: number;
}

type InvoiceThemeId = 'royal-violet' | 'corporate-navy' | 'emerald-classic' | 'minimal-mono';

const INVOICE_THEMES: Record<
  InvoiceThemeId,
  {
    name: string;
    headerBg: string;
    headerText: string;
    accentText: string;
    borderColor: string;
    badgeBg: string;
    tableHeadBg: string;
  }
> = {
  'royal-violet': {
    name: 'Royal Violet',
    headerBg: 'bg-gradient-to-r from-violet-700 to-indigo-700',
    headerText: 'text-white',
    accentText: 'text-violet-700',
    borderColor: 'border-violet-300',
    badgeBg: 'bg-violet-50 text-violet-800',
    tableHeadBg: 'bg-violet-900 text-white',
  },
  'corporate-navy': {
    name: 'Corporate Navy',
    headerBg: 'bg-gradient-to-r from-slate-900 to-blue-900',
    headerText: 'text-white',
    accentText: 'text-blue-800',
    borderColor: 'border-blue-300',
    badgeBg: 'bg-blue-50 text-blue-900',
    tableHeadBg: 'bg-slate-900 text-white',
  },
  'emerald-classic': {
    name: 'Emerald Classic',
    headerBg: 'bg-gradient-to-r from-emerald-700 to-teal-700',
    headerText: 'text-white',
    accentText: 'text-emerald-800',
    borderColor: 'border-emerald-300',
    badgeBg: 'bg-emerald-50 text-emerald-900',
    tableHeadBg: 'bg-emerald-800 text-white',
  },
  'minimal-mono': {
    name: 'Minimal Monochrome',
    headerBg: 'bg-slate-100 border-b-2 border-slate-900',
    headerText: 'text-slate-950',
    accentText: 'text-slate-900',
    borderColor: 'border-slate-900',
    badgeBg: 'bg-slate-100 text-slate-900',
    tableHeadBg: 'bg-slate-900 text-white',
  },
};

export const UtilityToolsWorkspace: React.FC<UtilityToolsWorkspaceProps> = (props) => {
  if (props.toolId === 'age-land-calculator') {
    return <AgeLandCalculator appLang={props.appLang} />;
  }
  if (props.toolId === 'cyber-cafe-calculator') {
    return <CyberCafeCalculator appLang={props.appLang} />;
  }
  if (props.toolId === 'bengali-typing-converter') {
    return <BengaliTypingConverter appLang={props.appLang} />;
  }
  if (props.toolId === 'upi-voice-counter') {
    return <UpiVoiceCounter appLang={props.appLang} />;
  }
  if (props.toolId === 'queue-token-whatsapp') {
    return <QueueTokenWhatsapp appLang={props.appLang} />;
  }
  if (props.toolId === 'shop-rate-notice-poster') {
    return <ShopRateNoticePoster appLang={props.appLang} />;
  }
  if (props.toolId === 'mobile-pc-qr-transfer') {
    return <MobilePcQrTransfer appLang={props.appLang} />;
  }
  if (props.toolId === 'cyber-cafe-khata-ledger') {
    return <CyberCafeKhataLedger appLang={props.appLang} />;
  }
  if (props.toolId === 'wb-land-stamp-duty-calc') {
    return <WbLandStampDutyCalc appLang={props.appLang} />;
  }
  if (props.toolId === 'wb-finance-utility-calc') {
    return <WbFinanceUtilityCalc appLang={props.appLang} />;
  }
  if (props.toolId === 'barcode-label-sheet-maker') {
    return <BarcodeLabelSheetMaker appLang={props.appLang} />;
  }
  return <StandardUtilityWorkspace {...props} />;
};

const StandardUtilityWorkspace: React.FC<UtilityToolsWorkspaceProps> = ({
  toolId,
  ownerConfig,
  appLang,
}) => {
  // QR Code state (all inputs empty initially)
  const [qrMode, setQrMode] = useState<'url' | 'upi' | 'text'>('url');
  const [qrValue, setQrValue] = useState('');
  const [upiId, setUpiId] = useState('');
  const [upiName, setUpiName] = useState('');
  const [upiAmount, setUpiAmount] = useState('');
  const [qrColor, setQrColor] = useState('#1e293b');
  const [qrPngUrl, setQrPngUrl] = useState<string>('');
  const [qrSvgMarkup, setQrSvgMarkup] = useState<string>('');

  // Invoice & Rate Card state (all inputs empty initially)
  const [docMode, setDocMode] = useState<'invoice' | 'rate-card'>('invoice');
  const [themeId, setThemeId] = useState<InvoiceThemeId>('royal-violet');
  const [shopName, setShopName] = useState('');
  const [shopPhone, setShopPhone] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discountAmt, setDiscountAmt] = useState<string>('');
  const [gstPct, setGstPct] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card'>('Cash');
  const [items, setItems] = useState<InvoiceLineItem[]>([]);
  const [draftName, setDraftName] = useState('');
  const [draftNotes, setDraftNotes] = useState('');
  const [draftQty, setDraftQty] = useState('1');
  const [draftRate, setDraftRate] = useState('');
  const printAreaRef = useRef<HTMLDivElement | null>(null);

  const computedQrPayload = (() => {
    if (qrMode === 'upi') {
      if (!upiId.trim()) return '';
      const params = new URLSearchParams({
        pa: upiId.trim(),
        pn: upiName.trim() || 'Merchant',
        cu: 'INR',
      });
      if (upiAmount.trim()) params.set('am', upiAmount.trim());
      return `upi://pay?${params.toString()}`;
    }
    return qrValue.trim();
  })();

  useEffect(() => {
    if (toolId !== 'qr-code-generator') return;
    if (!computedQrPayload) {
      setQrPngUrl('');
      setQrSvgMarkup('');
      return;
    }
    let active = true;
    QRCode.toDataURL(computedQrPayload, {
      width: 512,
      margin: 2,
      color: { dark: qrColor, light: '#ffffff' },
    })
      .then((url) => {
        if (active) setQrPngUrl(url);
      })
      .catch(() => {});

    QRCode.toString(computedQrPayload, {
      type: 'svg',
      margin: 2,
      color: { dark: qrColor, light: '#ffffff' },
    })
      .then((svg) => {
        if (active) setQrSvgMarkup(svg);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [computedQrPayload, qrColor, toolId]);

  if (toolId === 'invoice-maker') {
    const theme = INVOICE_THEMES[themeId];
    const subtotal = items.reduce((sum, it) => sum + it.qty * it.rate, 0);
    const discount = Math.max(0, Number(discountAmt) || 0);
    const taxable = Math.max(0, subtotal - discount);
    const gstRate = Math.max(0, Number(gstPct) || 0);
    const gstAmount = (taxable * gstRate) / 100;
    const grandTotal = taxable + gstAmount;

    const addLineItem = () => {
      if (!draftName.trim()) return;
      const qty = Math.max(1, Number(draftQty) || 1);
      const rate = Math.max(0, Number(draftRate) || 0);
      setItems((prev) => [
        ...prev,
        {
          id: String(Date.now() + Math.random()),
          serviceName: draftName.trim(),
          notes: draftNotes.trim(),
          qty,
          rate,
        },
      ]);
      setDraftName('');
      setDraftNotes('');
      setDraftQty('1');
      setDraftRate('');
    };

    const fillShopDetails = () => {
      setShopName(`${ownerConfig.brandName} ${ownerConfig.byline}`);
      setShopPhone(ownerConfig.phone);
      setShopAddress(ownerConfig.location);
      if (!invoiceDate) setInvoiceDate(new Date().toISOString().slice(0, 10));
      if (!invoiceNo) setInvoiceNo(`INV-${String(Date.now()).slice(-5)}`);
    };

    const loadRateCardTemplate = () => {
      setDocMode('rate-card');
      fillShopDetails();
      setItems([
        { id: 'r1', serviceName: 'Passport Size Photo (8 Copies)', notes: '4×6 Glossy Sheet', qty: 1, rate: 40 },
        { id: 'r2', serviceName: 'Online Exam / Job Form Fill-up', notes: 'With Printout', qty: 1, rate: 60 },
        { id: 'r3', serviceName: 'ID Card Crop & Lamination', notes: 'Aadhaar / PAN / Voter', qty: 1, rate: 40 },
        { id: 'r4', serviceName: 'Banglarbhumi ROR / Khajna Print', notes: 'Excluding Govt Fee', qty: 1, rate: 30 },
        { id: 'r5', serviceName: 'B&W Print / Xerox (Per Page)', notes: 'A4 Sheet', qty: 1, rate: 5 },
      ]);
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Controls */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 no-print shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="inline-flex items-center gap-1.5 text-sm font-extrabold text-slate-900 dark:text-slate-100">
              <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{appLang === 'bn' ? 'বিল ও রেট চার্ট সেটিংস' : 'Invoice & Rate Chart'}</span>
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={fillShopDetails}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 text-[11px] font-bold hover:bg-violet-100 dark:hover:bg-violet-900/60 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                Fill My Shop
              </button>
              <button
                type="button"
                onClick={loadRateCardTemplate}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 cursor-pointer"
              >
                Sample Rate List
              </button>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setDocMode('invoice')}
              className={`py-2 rounded-lg text-xs font-bold cursor-pointer ${
                docMode === 'invoice'
                  ? 'bg-white dark:bg-slate-900 text-violet-700 dark:text-violet-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Customer Invoice (বিল রসিদ)
            </button>
            <button
              type="button"
              onClick={() => setDocMode('rate-card')}
              className={`py-2 rounded-lg text-xs font-bold cursor-pointer ${
                docMode === 'rate-card'
                  ? 'bg-white dark:bg-slate-900 text-violet-700 dark:text-violet-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Shop Rate Chart (দোকানের রেট)
            </button>
          </div>

          {/* Theme Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Professional Theme
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(INVOICE_THEMES) as InvoiceThemeId[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setThemeId(id)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border text-left transition-all cursor-pointer ${
                    themeId === id
                      ? 'border-violet-600 bg-violet-50 dark:bg-violet-950/60 text-violet-800 dark:text-violet-300 ring-1 ring-violet-300 dark:ring-violet-700'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {INVOICE_THEMES[id].name}
                </button>
              ))}
            </div>
          </div>

          {/* Shop Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Shop / Cyber Cafe Name
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="Enter shop or CSC center name"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Shop Phone</label>
              <input
                type="text"
                value={shopPhone}
                onChange={(e) => setShopPhone(e.target.value)}
                placeholder="Mobile number"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Shop Address</label>
              <input
                type="text"
                value={shopAddress}
                onChange={(e) => setShopAddress(e.target.value)}
                placeholder="Market / District"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
              />
            </div>
          </div>

          {docMode === 'invoice' && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Invoice / Bill No.
                </label>
                <input
                  type="text"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  placeholder="e.g. INV-001"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Bill Date</label>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer full name"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Customer Phone
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Optional phone"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
                />
              </div>
            </div>
          )}

          {/* Add Service / Item */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Add Service / Item (সার্ভিস যোগ করুন)
            </div>
            <input
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="Service name (e.g. Passport Photo / PAN Form)"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
            />
            <div className="grid grid-cols-12 gap-2">
              <input
                type="text"
                value={draftNotes}
                onChange={(e) => setDraftNotes(e.target.value)}
                placeholder="Details / Remarks"
                className="col-span-6 px-2.5 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs"
              />
              {docMode === 'invoice' && (
                <input
                  type="number"
                  min={1}
                  value={draftQty}
                  onChange={(e) => setDraftQty(e.target.value)}
                  placeholder="Qty"
                  className="col-span-2 px-2 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs tabular-nums"
                />
              )}
              <input
                type="number"
                min={0}
                value={draftRate}
                onChange={(e) => setDraftRate(e.target.value)}
                placeholder="₹ Rate"
                className={`${
                  docMode === 'invoice' ? 'col-span-4' : 'col-span-6'
                } px-2.5 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs tabular-nums`}
              />
            </div>
            <button
              type="button"
              onClick={addLineItem}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold cursor-pointer border border-transparent dark:border-slate-700"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Row
            </button>

            {items.length > 0 && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pt-1">
                {items.map((it) => (
                  <div
                    key={it.id}
                    className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-semibold text-slate-800 dark:text-slate-100 truncate">{it.serviceName}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                        {docMode === 'invoice' ? `${it.qty} × ₹${it.rate} = ₹${it.qty * it.rate}` : `₹${it.rate}`}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setItems((prev) => prev.filter((x) => x.id !== it.id))}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {docMode === 'invoice' && (
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Discount (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={discountAmt}
                  onChange={(e) => setDiscountAmt(e.target.value)}
                  placeholder="0"
                  className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-xs tabular-nums"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">GST %</label>
                <input
                  type="number"
                  min={0}
                  max={28}
                  value={gstPct}
                  onChange={(e) => setGstPct(e.target.value)}
                  placeholder="0"
                  className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-xs tabular-nums"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">Mode</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
                  className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg text-xs font-semibold"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                </select>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() =>
              printElementHtml(
                printAreaRef.current,
                docMode === 'invoice' ? 'Customer Invoice' : 'Shop Service Rate Chart'
              )
            }
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print / Save as PDF (A4)
          </button>
        </div>

        {/* Right Live Printable Sheet */}
        <div className="lg:col-span-7">
          <div
            ref={printAreaRef}
            className={`print-area bg-white text-slate-900 border-2 ${theme.borderColor} rounded-2xl overflow-hidden shadow-md flex flex-col justify-between min-h-[720px]`}
          >
            <div>
              {/* Header */}
              <div className={`${theme.headerBg} ${theme.headerText} p-6 md:p-8 flex flex-wrap items-start justify-between gap-4`}>
                <div>
                  <div className="text-2xl font-extrabold tracking-tight">
                    {shopName.trim() || 'YOUR CYBER CAFE / SHOP NAME'}
                  </div>
                  <div className="text-xs opacity-90 mt-1">
                    {shopAddress.trim() || 'Shop Address, District, West Bengal'}
                  </div>
                  {shopPhone.trim() && (
                    <div className="text-xs font-bold mt-1 tabular-nums">Ph: {shopPhone.trim()}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xl font-black uppercase tracking-wider">
                    {docMode === 'invoice' ? 'INVOICE / RECEIPT' : 'SERVICE RATE CARD'}
                  </div>
                  {docMode === 'invoice' && (
                    <div className="text-xs opacity-90 mt-1 space-y-0.5 tabular-nums">
                      <div>Bill No: {invoiceNo.trim() || '________'}</div>
                      <div>Date: {invoiceDate || '__/__/____'}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Details Strip */}
              {docMode === 'invoice' && (
                <div className="px-6 md:px-8 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 font-semibold uppercase">Bill To: </span>
                    <span className="font-bold text-slate-900 text-sm">
                      {customerName.trim() || '____________________'}
                    </span>
                    {customerPhone.trim() && (
                      <span className="ml-2 text-slate-600 tabular-nums">({customerPhone.trim()})</span>
                    )}
                  </div>
                  <span className={`px-2.5 py-1 rounded-md font-bold ${theme.badgeBg}`}>
                    Payment: {paymentMethod}
                  </span>
                </div>
              )}

              {/* Items Table */}
              <div className="p-6 md:p-8">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className={`${theme.tableHeadBg} text-xs uppercase tracking-wider`}>
                      <th className="py-2.5 px-3 rounded-tl-lg">#</th>
                      <th className="py-2.5 px-3">Service / Description</th>
                      {docMode === 'invoice' && <th className="py-2.5 px-3 text-center">Qty</th>}
                      <th className="py-2.5 px-3 text-right rounded-tr-lg">
                        {docMode === 'invoice' ? 'Rate (₹)' : 'Service Charge (₹)'}
                      </th>
                      {docMode === 'invoice' && <th className="py-2.5 px-3 text-right">Amount (₹)</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {items.length === 0 ? (
                      <tr>
                        <td
                          colSpan={docMode === 'invoice' ? 5 : 3}
                          className="py-12 text-center text-xs text-slate-400"
                        >
                          Add services / items on the left panel to populate your printable sheet.
                        </td>
                      </tr>
                    ) : (
                      items.map((it, idx) => (
                        <tr key={it.id} className="hover:bg-slate-50/70">
                          <td className="py-3 px-3 text-xs text-slate-500 tabular-nums">{idx + 1}</td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">{it.serviceName}</div>
                            {it.notes && <div className="text-xs text-slate-500">{it.notes}</div>}
                          </td>
                          {docMode === 'invoice' && (
                            <td className="py-3 px-3 text-center tabular-nums">{it.qty}</td>
                          )}
                          <td className="py-3 px-3 text-right font-semibold tabular-nums">
                            ₹{it.rate.toFixed(2)}
                          </td>
                          {docMode === 'invoice' && (
                            <td className="py-3 px-3 text-right font-bold text-slate-900 tabular-nums">
                              ₹{(it.qty * it.rate).toFixed(2)}
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {docMode === 'invoice' && items.length > 0 && (
                  <div className="mt-6 flex justify-end">
                    <div className="w-64 space-y-1.5 text-sm border-t border-slate-200 pt-3">
                      <div className="flex justify-between text-slate-600">
                        <span>Subtotal</span>
                        <span className="tabular-nums font-semibold">₹{subtotal.toFixed(2)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-emerald-700">
                          <span>Discount</span>
                          <span className="tabular-nums">- ₹{discount.toFixed(2)}</span>
                        </div>
                      )}
                      {gstRate > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>GST ({gstRate}%)</span>
                          <span className="tabular-nums">₹{gstAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className={`flex justify-between text-base font-black pt-2 border-t border-slate-300 ${theme.accentText}`}>
                        <span>Grand Total</span>
                        <span className="tabular-nums">₹{grandTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Signature + Mandatory Watermark */}
            <div className="px-6 md:px-8 pb-5 pt-4 space-y-5">
              <div className="flex items-end justify-between text-xs text-slate-600">
                <div>Thank you for visiting! Please verify documents before leaving.</div>
                <div className="text-center">
                  <div className="h-8 border-b border-slate-400 w-36 mb-1" />
                  <div className="font-bold text-slate-800">Authorised Signatory</div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3 text-center text-[11px] font-bold tracking-wide text-slate-500">
                Generated by PC Tool by SMART SUBHA
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // QR Code Generator Tool
  const svgBlobUrl = qrSvgMarkup
    ? URL.createObjectURL(new Blob([qrSvgMarkup], { type: 'image/svg+xml' }))
    : '';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-6 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xs">
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          {(
            [
              { id: 'url', label: 'Website URL' },
              { id: 'upi', label: 'UPI QR' },
              { id: 'text', label: 'Plain Text' },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setQrMode(m.id)}
              className={`py-2 rounded-lg text-xs font-bold cursor-pointer ${
                qrMode === m.id
                  ? 'bg-white dark:bg-slate-900 text-violet-700 dark:text-violet-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {qrMode === 'upi' ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                UPI ID (VPA)
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="yourname@okaxis"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payee / Shop Name
              </label>
              <input
                type="text"
                value={upiName}
                onChange={(e) => setUpiName(e.target.value)}
                placeholder="Enter receiver or shop name"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Fixed Amount ₹ (Optional)
              </label>
              <input
                type="number"
                value={upiAmount}
                onChange={(e) => setUpiAmount(e.target.value)}
                placeholder="Leave blank for any amount"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm tabular-nums"
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {qrMode === 'url' ? 'Website URL' : 'Plain Text'}
            </label>
            <textarea
              rows={3}
              value={qrValue}
              onChange={(e) => setQrValue(e.target.value)}
              placeholder={qrMode === 'url' ? 'https://smartsubha.ai.studio' : 'Type any message or details...'}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-sm"
            />
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">QR Foreground Color</span>
          <div className="flex items-center gap-2">
            {['#1e293b', '#7c3aed', '#0f766e', '#be123c'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setQrColor(c)}
                style={{ backgroundColor: c }}
                className={`w-6 h-6 rounded-full border-2 cursor-pointer ${
                  qrColor === c ? 'border-slate-900 dark:border-white scale-110' : 'border-white dark:border-slate-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-6 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-xs">
        {qrPngUrl ? (
          <>
            <img
              src={qrPngUrl}
              alt="Generated QR Code"
              className="w-56 h-56 mx-auto border border-slate-200 dark:border-slate-700 rounded-2xl p-2 bg-white"
            />
            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono break-all px-4">
              {computedQrPayload}
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <a
                href={qrPngUrl}
                download="qr-code.png"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700"
              >
                <Download className="w-4 h-4" />
                Download PNG
              </a>
              {svgBlobUrl && (
                <a
                  href={svgBlobUrl}
                  download="qr-code.svg"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Download className="w-4 h-4" />
                  Download SVG
                </a>
              )}
            </div>
          </>
        ) : (
          <div className="py-16 text-slate-400 dark:text-slate-500 space-y-2">
            <QrIcon className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
            <div className="text-xs font-semibold">Enter URL, UPI ID, or Text to generate your QR code</div>
          </div>
        )}
      </div>
    </div>
  );
};

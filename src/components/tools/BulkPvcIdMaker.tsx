import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { IdCard, Upload, Plus, Trash2, Printer, FileSpreadsheet } from 'lucide-react';
import type { AppLang } from '../../data/i18n';
import { printElementHtml } from '../../utils/printHelper';

interface BulkPvcIdMakerProps {
  appLang: AppLang;
}

interface MemberRecord {
  id: string;
  name: string;
  idNo: string;
  roleOrClass: string;
  phone: string;
  bloodGroup: string;
  validTill: string;
  photoUrl?: string;
  qrUrl?: string;
}

const CARD_THEMES = {
  navy: { name: 'Executive Navy', header: '#0f172a', accent: '#f59e0b', badge: '#e0e7ff', badgeText: '#1e1b4b' },
  emerald: { name: 'Academic Emerald', header: '#064e3b', accent: '#10b981', badge: '#d1fae5', badgeText: '#064e3b' },
  crimson: { name: 'Sports / Club Red', header: '#881337', accent: '#fb7185', badge: '#ffe4e6', badgeText: '#881337' },
  indigo: { name: 'Modern Tech Blue', header: '#1e3a8a', accent: '#38bdf8', badge: '#dbeafe', badgeText: '#1e3a8a' },
};

export const BulkPvcIdMaker: React.FC<BulkPvcIdMakerProps> = ({ appLang }) => {
  const isBn = appLang === 'bn';
  const [orgName, setOrgName] = useState('');
  const [orgSub, setOrgSub] = useState('');
  const [orgLogo, setOrgLogo] = useState<string | null>(null);
  const [themeKey, setThemeKey] = useState<keyof typeof CARD_THEMES>('navy');

  // Manual row draft (empty default)
  const [mName, setMName] = useState('');
  const [mIdNo, setMIdNo] = useState('');
  const [mRole, setMRole] = useState('');
  const [mPhone, setMPhone] = useState('');
  const [mBlood, setMBlood] = useState('');
  const [mValid, setMValid] = useState('');

  const [bulkText, setBulkText] = useState('');
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const printSheetRef = useRef<HTMLDivElement | null>(null);

  const theme = CARD_THEMES[themeKey];

  // Auto-generate QR codes for members lacking one
  useEffect(() => {
    let active = true;
    const missing = members.filter((m) => !m.qrUrl);
    if (missing.length === 0) return;

    Promise.all(
      missing.map(async (m) => {
        const payload = `${orgName.trim() || 'ID'} | ${m.idNo || '-'} | ${m.name} | ${m.roleOrClass} | ${m.phone}`;
        const qr = await QRCode.toDataURL(payload, { width: 140, margin: 1 });
        return { id: m.id, qr };
      })
    ).then((pairs) => {
      if (!active) return;
      const map = new Map(pairs.map((p) => [p.id, p.qr]));
      setMembers((prev) => prev.map((m) => (map.has(m.id) ? { ...m, qrUrl: map.get(m.id) } : m)));
    });
    return () => {
      active = false;
    };
  }, [members, orgName]);

  const addSingleMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mName.trim()) return;
    setMembers((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: mName.trim(),
        idNo: mIdNo.trim() || `ID-${String(prev.length + 1).padStart(3, '0')}`,
        roleOrClass: mRole.trim(),
        phone: mPhone.trim(),
        bloodGroup: mBlood.trim(),
        validTill: mValid.trim(),
      },
    ]);
    setMName('');
    setMIdNo('');
    setMRole('');
    setMPhone('');
    setMBlood('');
    setMValid('');
  };

  const parseBulkLines = (raw: string) => {
    const lines = raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const parsed: MemberRecord[] = [];
    lines.forEach((line, idx) => {
      const cols = line.includes('\t') ? line.split('\t') : line.split(',');
      const name = (cols[0] || '').trim();
      if (!name || name.toLowerCase() === 'name') return;
      parsed.push({
        id: crypto.randomUUID(),
        name,
        idNo: (cols[1] || '').trim() || `ID-${String(members.length + idx + 1).padStart(3, '0')}`,
        roleOrClass: (cols[2] || '').trim(),
        phone: (cols[3] || '').trim(),
        bloodGroup: (cols[4] || '').trim(),
        validTill: (cols[5] || '').trim(),
      });
    });
    if (parsed.length > 0) {
      setMembers((prev) => [...prev, ...parsed]);
      setBulkText('');
    }
  };

  const handleCsvUpload = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    parseBulkLines(text);
  };

  const handleMemberPhoto = (id: string, file: File | undefined) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, photoUrl: url } : m)));
  };

  // Chunk members into 8-card A4 pages (2 cols x 4 rows of CR80 85.6x54mm cards)
  const pages: MemberRecord[][] = [];
  for (let i = 0; i < members.length; i += 8) {
    pages.push(members.slice(i, i + 8));
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-950 text-white rounded-2xl p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
            <IdCard className="w-4 h-4" />
            <span>{isBn ? 'CSV / Excel থেকে একসাথে ৫০+ PVC আইডি কার্ড (QR কোডসহ A4 ড্রাগন শিট)' : 'Bulk CSV / Excel Import · Auto QR Code · 8-Card CR80 A4 Print Sheets'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-1">
            {isBn ? 'বাল্ক স্টুডেন্ট / ক্লাব PVC আইডি কার্ড জেনারেটর' : 'Bulk Student / Club PVC ID Card Generator'}
          </h2>
        </div>

        <button
          type="button"
          disabled={members.length === 0}
          onClick={() => printSheetRef.current && printElementHtml(printSheetRef.current, `Bulk PVC ID Cards (${members.length})`)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 font-black text-xs cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          {isBn ? `সব কার্ড A4 প্রিন্ট (${members.length})` : `Print A4 Sheet (${members.length} Cards)`}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Setup & Bulk Import */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <div className="text-xs font-bold text-slate-800">
              {isBn ? '১. প্রতিষ্ঠানের তথ্য ও থিম' : '1. Organization Header & Card Theme'}
            </div>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder={isBn ? 'স্কুল / কোচিং / ক্লাব / অফিসের নাম' : 'School / Coaching / Club Name'}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold"
            />
            <input
              type="text"
              value={orgSub}
              onChange={(e) => setOrgSub(e.target.value)}
              placeholder={isBn ? 'ঠিকানা বা সেশন (যেমন: Session 2026-27)' : 'Subtitle / Address / Session'}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
            />
            <div className="flex flex-wrap items-center gap-2">
              <label className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5" /> {orgLogo ? 'Change Logo' : 'Upload Logo'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setOrgLogo(URL.createObjectURL(f));
                  }}
                />
              </label>
              {(Object.keys(CARD_THEMES) as Array<keyof typeof CARD_THEMES>).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setThemeKey(k)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                    themeKey === k ? 'bg-slate-900 text-amber-300 border-slate-900' : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>

          {/* CSV / Excel Bulk Import */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 inline-flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                {isBn ? '২. Excel/CSV পেস্ট বা আপলোড (একসাথে অনেক কার্ড)' : '2. Bulk Import (CSV File or Paste from Excel)'}
              </span>
              <label className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer">
                Upload .CSV
                <input type="file" accept=".csv,.txt" className="hidden" onChange={(e) => handleCsvUpload(e.target.files?.[0])} />
              </label>
            </div>
            <textarea
              rows={4}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="Format per line: Name, ID No, Class/Role, Phone, Blood, Valid Till&#10;e.g. Rahul Sen, ST-101, Class XII, 9876543210, O+, 2027"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono bg-slate-50"
            />
            <button
              type="button"
              onClick={() => parseBulkLines(bulkText)}
              className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
            >
              {isBn ? 'লিস্ট থেকে সব কার্ড যোগ করুন' : 'Import All Rows to Cards'}
            </button>
          </div>

          {/* Single Member Form */}
          <form onSubmit={addSingleMember} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5">
            <div className="text-xs font-bold text-slate-800">
              {isBn ? 'অথবা ১ জন করে যোগ করুন' : 'Or Add Single Member Card'}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input value={mName} onChange={(e) => setMName(e.target.value)} placeholder="Full Name *" className="rounded-lg border border-slate-300 px-2.5 py-2 text-xs" />
              <input value={mIdNo} onChange={(e) => setMIdNo(e.target.value)} placeholder="ID / Roll No" className="rounded-lg border border-slate-300 px-2.5 py-2 text-xs font-mono" />
              <input value={mRole} onChange={(e) => setMRole(e.target.value)} placeholder="Class / Designation" className="rounded-lg border border-slate-300 px-2.5 py-2 text-xs" />
              <input value={mPhone} onChange={(e) => setMPhone(e.target.value)} placeholder="Mobile No" className="rounded-lg border border-slate-300 px-2.5 py-2 text-xs font-mono" />
              <input value={mBlood} onChange={(e) => setMBlood(e.target.value)} placeholder="Blood Group" className="rounded-lg border border-slate-300 px-2.5 py-2 text-xs" />
              <input value={mValid} onChange={(e) => setMValid(e.target.value)} placeholder="Valid Till" className="rounded-lg border border-slate-300 px-2.5 py-2 text-xs" />
            </div>
            <button type="submit" className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer">
              <Plus className="w-4 h-4" /> Add Card
            </button>
          </form>
        </div>

        {/* Right: Generated Cards Preview & A4 Print Sheet */}
        <div className="lg:col-span-7 space-y-4">
          {members.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-14 text-center text-slate-500 text-xs">
              <IdCard className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              {isBn
                ? 'বাম দিক থেকে CSV/Excel পেস্ট করুন অথবা সদস্য যোগ করুন — এখানে CR80 PVC কার্ড গ্রিড তৈরি হবে।'
                : 'Import CSV/Excel rows or add members on the left to build your 8-up A4 PVC ID card sheet.'}
            </div>
          ) : (
            <div ref={printSheetRef} className="space-y-6">
              {pages.map((pageCards, pageIdx) => (
                <div
                  key={pageIdx}
                  className="bg-white rounded-2xl border border-slate-300 p-5 shadow-sm"
                  style={{ pageBreakAfter: pageIdx < pages.length - 1 ? 'always' : 'auto' }}
                >
                  <div className="text-[11px] text-slate-400 font-mono mb-3 flex justify-between print:hidden">
                    <span>A4 Sheet #{pageIdx + 1} · Standard CR80 (85.6 × 54 mm)</span>
                    <span>{pageCards.length} cards</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {pageCards.map((m) => (
                      <div
                        key={m.id}
                        className="relative rounded-xl border-2 border-dashed border-slate-300 overflow-hidden bg-white flex flex-col"
                        style={{ minHeight: '198px' }}
                      >
                        {/* Top Banner */}
                        <div
                          className="px-3 py-2 text-white flex items-center gap-2"
                          style={{ backgroundColor: theme.header, borderBottom: `3px solid ${theme.accent}` }}
                        >
                          {orgLogo && (
                            <img src={orgLogo} alt="Org Logo" className="w-8 h-8 object-contain rounded bg-white p-0.5 shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-black tracking-wide truncate">
                              {orgName.trim() || 'ORGANIZATION / SCHOOL ID'}
                            </div>
                            {orgSub.trim() && <div className="text-[9px] opacity-85 truncate">{orgSub.trim()}</div>}
                          </div>
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/15 shrink-0">
                            {m.idNo}
                          </span>
                        </div>

                        {/* Body */}
                        <div className="p-3 flex items-center gap-3 flex-1">
                          <label className="w-16 h-20 rounded-lg border border-slate-300 bg-slate-100 flex flex-col items-center justify-center overflow-hidden shrink-0 cursor-pointer relative group">
                            {m.photoUrl ? (
                              <img src={m.photoUrl} alt={m.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[9px] text-slate-400 text-center px-1 font-semibold">Click Photo</span>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleMemberPhoto(m.id, e.target.files?.[0])}
                            />
                          </label>

                          <div className="min-w-0 flex-1 text-[11px] space-y-0.5 text-slate-900">
                            <div className="font-black text-sm truncate">{m.name}</div>
                            {m.roleOrClass && (
                              <div className="font-bold text-slate-700 truncate">{m.roleOrClass}</div>
                            )}
                            {m.phone && <div className="font-mono text-[10px] text-slate-600">Ph: {m.phone}</div>}
                            <div className="flex items-center gap-2 text-[10px] text-slate-600 pt-0.5">
                              {m.bloodGroup && <span>Blood: <strong className="text-rose-700">{m.bloodGroup}</strong></span>}
                              {m.validTill && <span>Valid: <strong>{m.validTill}</strong></span>}
                            </div>
                          </div>

                          {m.qrUrl && (
                            <img src={m.qrUrl} alt="ID QR" className="w-14 h-14 object-contain shrink-0 border border-slate-200 rounded p-0.5" />
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setMembers((prev) => prev.filter((x) => x.id !== m.id))}
                          className="absolute bottom-1.5 right-1.5 p-1 rounded bg-white/90 text-slate-400 hover:text-rose-600 print:hidden cursor-pointer"
                          title="Delete card"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

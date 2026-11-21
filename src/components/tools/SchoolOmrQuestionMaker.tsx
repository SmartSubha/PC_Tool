import React, { useRef, useState } from 'react';
import { ClipboardList, Printer, Plus, Trash2, RotateCcw } from 'lucide-react';
import type { AppLang } from '../../data/i18n';
import { printElementHtml } from '../../utils/printHelper';

interface SchoolOmrQuestionMakerProps {
  appLang: AppLang;
}

interface QuestionItem {
  id: string;
  text: string;
  marks: string;
  options: [string, string, string, string];
  isMcq: boolean;
}

export const SchoolOmrQuestionMaker: React.FC<SchoolOmrQuestionMakerProps> = ({ appLang }) => {
  const isBn = appLang === 'bn';
  const [mode, setMode] = useState<'omr' | 'question-paper'>('omr');

  // Empty-default Institute / Exam Header
  const [instituteName, setInstituteName] = useState('');
  const [examTitle, setExamTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [className, setClassName] = useState('');
  const [fullMarks, setFullMarks] = useState('');
  const [duration, setDuration] = useState('');

  // OMR Config
  const [omrCount, setOmrCount] = useState<20 | 30 | 50 | 60 | 100>(50);
  const [bubbleStyle, setBubbleStyle] = useState<'en' | 'bn'>('en');
  const [includeRollGrid, setIncludeRollGrid] = useState(true);

  // Question Paper Items
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [qText, setQText] = useState('');
  const [qMarks, setQMarks] = useState('1');
  const [qIsMcq, setQIsMcq] = useState(true);
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');

  const printRef = useRef<HTMLDivElement | null>(null);
  const bubbleLetters = bubbleStyle === 'bn' ? ['ক', 'খ', 'গ', 'ঘ'] : ['A', 'B', 'C', 'D'];

  const addQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim()) return;
    setQuestions((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        text: qText.trim(),
        marks: qMarks.trim() || '1',
        isMcq: qIsMcq,
        options: [optA.trim(), optB.trim(), optC.trim(), optD.trim()],
      },
    ]);
    setQText('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
  };

  const omrCols = omrCount <= 30 ? 2 : omrCount <= 60 ? 3 : 4;
  const rowsPerCol = Math.ceil(omrCount / omrCols);

  return (
    <div className="space-y-6">
      <div className="bg-slate-950 text-white rounded-2xl p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
            <ClipboardList className="w-4 h-4" />
            <span>{isBn ? 'টিউশন, কোচিং ও স্কুলের জন্য OMR উত্তরপত্র (২০–১০০ প্রশ্ন) ও দ্বিভাষিক প্রশ্নপত্র মেকার' : '20–100 Bubble OMR Answer Sheets (EN/BN) · Bilingual Exam Question Paper Builder'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-1">
            {isBn ? 'স্কুল / কোচিং OMR শিট ও প্রশ্নপত্র মেকার' : 'School / Coaching OMR Sheet & Question Paper Maker'}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex p-1 bg-slate-900 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setMode('omr')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer ${
                mode === 'omr' ? 'bg-amber-400 text-slate-950' : 'text-slate-300'
              }`}
            >
              OMR Sheet
            </button>
            <button
              type="button"
              onClick={() => setMode('question-paper')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold cursor-pointer ${
                mode === 'question-paper' ? 'bg-amber-400 text-slate-950' : 'text-slate-300'
              }`}
            >
              Question Paper
            </button>
          </div>
          <button
            type="button"
            onClick={() => printRef.current && printElementHtml(printRef.current, mode === 'omr' ? `OMR Sheet (${omrCount} Qs)` : 'Exam Question Paper')}
            className="px-4 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print A4
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Controls */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 space-y-3.5 h-fit">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">Exam Header Details</span>
            <button
              type="button"
              onClick={() => {
                setInstituteName(''); setExamTitle(''); setSubject(''); setClassName(''); setFullMarks(''); setDuration(''); setQuestions([]);
              }}
              className="text-xs text-slate-500 hover:text-rose-600 inline-flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Clear
            </button>
          </div>

          <input value={instituteName} onChange={(e) => setInstituteName(e.target.value)} placeholder="School / Coaching Center Name" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold" />
          <input value={examTitle} onChange={(e) => setExamTitle(e.target.value)} placeholder="Exam Name (e.g. Monthly Mock Test 2026)" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs" />
          <div className="grid grid-cols-2 gap-2">
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject (e.g. Math / GK)" className="rounded-xl border border-slate-300 px-3 py-2 text-xs" />
            <input value={className} onChange={(e) => setClassName(e.target.value)} placeholder="Class / Batch" className="rounded-xl border border-slate-300 px-3 py-2 text-xs" />
            <input value={fullMarks} onChange={(e) => setFullMarks(e.target.value)} placeholder="Full Marks (e.g. 50)" className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono" />
            <input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Time (e.g. 1 Hr)" className="rounded-xl border border-slate-300 px-3 py-2 text-xs" />
          </div>

          {mode === 'omr' ? (
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <div>
                <div className="text-xs font-bold text-slate-700 mb-1.5">Total OMR Questions</div>
                <div className="grid grid-cols-5 gap-1.5">
                  {([20, 30, 50, 60, 100] as const).map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setOmrCount(cnt)}
                      className={`py-2 rounded-lg text-xs font-mono font-bold border cursor-pointer ${
                        omrCount === cnt ? 'bg-slate-900 text-amber-300 border-slate-900' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBubbleStyle('en')}
                  className={`py-2 rounded-lg text-xs font-bold border cursor-pointer ${
                    bubbleStyle === 'en' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  A · B · C · D
                </button>
                <button
                  type="button"
                  onClick={() => setBubbleStyle('bn')}
                  className={`py-2 rounded-lg text-xs font-bold border cursor-pointer ${
                    bubbleStyle === 'bn' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  ক · খ · গ · ঘ
                </button>
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                <input type="checkbox" checked={includeRollGrid} onChange={(e) => setIncludeRollGrid(e.target.checked)} className="accent-indigo-600" />
                <span>Include 6-Digit Roll No. Boxes</span>
              </label>
            </div>
          ) : (
            <form onSubmit={addQuestion} className="pt-3 border-t border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Add Question #{questions.length + 1}</span>
                <label className="inline-flex items-center gap-1.5 text-xs font-bold cursor-pointer">
                  <input type="checkbox" checked={qIsMcq} onChange={(e) => setQIsMcq(e.target.checked)} className="accent-indigo-600" />
                  MCQ Options
                </label>
              </div>
              <textarea rows={2} value={qText} onChange={(e) => setQText(e.target.value)} placeholder="Type question in Bengali or English..." className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs" />
              {qIsMcq && (
                <div className="grid grid-cols-2 gap-1.5">
                  <input value={optA} onChange={(e) => setOptA(e.target.value)} placeholder="Option A / ক" className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs" />
                  <input value={optB} onChange={(e) => setOptB(e.target.value)} placeholder="Option B / খ" className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs" />
                  <input value={optC} onChange={(e) => setOptC(e.target.value)} placeholder="Option C / গ" className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs" />
                  <input value={optD} onChange={(e) => setOptD(e.target.value)} placeholder="Option D / ঘ" className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs" />
                </div>
              )}
              <div className="flex gap-2">
                <input value={qMarks} onChange={(e) => setQMarks(e.target.value)} placeholder="Marks" className="w-20 rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono" />
                <button type="submit" className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center justify-center gap-1 cursor-pointer">
                  <Plus className="w-4 h-4" /> Add Question
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right Live A4 Sheet */}
        <div className="lg:col-span-8">
          <div ref={printRef} className="bg-white border-2 border-slate-900 rounded-xl p-6 text-slate-950 font-sans space-y-5">
            {/* Common Exam Header */}
            <div className="text-center border-b-2 border-slate-900 pb-3">
              <div className="text-xl font-black uppercase tracking-wide">
                {instituteName.trim() || 'INSTITUTE / SCHOOL / COACHING NAME'}
              </div>
              <div className="text-sm font-bold text-slate-800 mt-0.5">
                {examTitle.trim() || (mode === 'omr' ? 'OMR ANSWER SHEET' : 'EXAMINATION QUESTION PAPER')}
              </div>
              <div className="mt-2 flex flex-wrap justify-between text-xs font-bold border-t border-slate-300 pt-2">
                <span>Subject: {subject || '______________'}</span>
                <span>Class / Batch: {className || '________'}</span>
                <span>Full Marks: {fullMarks || '____'}</span>
                <span>Time: {duration || '______'}</span>
              </div>
            </div>

            {mode === 'omr' ? (
              <>
                {/* Student Info & Roll Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs border border-slate-800 p-3 rounded-lg">
                  <div className="sm:col-span-7 space-y-2.5">
                    <div>
                      <strong>Student Name:</strong> _________________________________________
                    </div>
                    <div className="flex gap-4">
                      <span><strong>Date:</strong> ____ / ____ / 20__</span>
                      <span><strong>Set:</strong> [ A ] [ B ] [ C ] [ D ]</span>
                    </div>
                    <div className="text-[10px] text-slate-600">
                      Instruction: Darken ONE circle completely with Black/Blue Ballpoint Pen.
                    </div>
                  </div>
                  {includeRollGrid && (
                    <div className="sm:col-span-5 sm:border-l sm:border-slate-300 sm:pl-3">
                      <div className="font-bold text-[11px] mb-1">ROLL NUMBER</div>
                      <div className="grid grid-cols-6 gap-1">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="h-7 border border-slate-900 rounded-sm bg-white" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* OMR Bubble Columns */}
                <div
                  className="grid gap-4"
                  style={{ gridTemplateColumns: `repeat(${omrCols}, minmax(0, 1fr))` }}
                >
                  {Array.from({ length: omrCols }).map((_, colIdx) => {
                    const start = colIdx * rowsPerCol + 1;
                    const end = Math.min(omrCount, start + rowsPerCol - 1);
                    if (start > omrCount) return null;
                    return (
                      <div key={colIdx} className="border border-slate-800 rounded-lg p-2 space-y-1.5">
                        {Array.from({ length: end - start + 1 }).map((__, rIdx) => {
                          const qNum = start + rIdx;
                          return (
                            <div key={qNum} className="flex items-center justify-between text-[11px] font-mono">
                              <span className="w-6 font-bold text-right pr-1">{String(qNum).padStart(2, '0')}.</span>
                              <div className="flex items-center gap-1.5">
                                {bubbleLetters.map((ltr) => (
                                  <span
                                    key={ltr}
                                    className="w-5 h-5 rounded-full border border-slate-900 flex items-center justify-center text-[9px] font-bold"
                                  >
                                    {ltr}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-6 grid grid-cols-3 gap-6 text-xs text-center font-bold">
                  <div className="border-t border-slate-800 pt-1">Student Signature</div>
                  <div className="border-t border-slate-800 pt-1">Invigilator Signature</div>
                  <div className="border-t border-slate-800 pt-1">Marks Obtained: ____ / {fullMarks || '___'}</div>
                </div>
              </>
            ) : (
              <div className="space-y-4 min-h-[420px]">
                {questions.length === 0 ? (
                  <div className="py-16 text-center text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                    Add MCQ or descriptive questions from the left panel to build your printable exam paper.
                  </div>
                ) : (
                  questions.map((q, idx) => (
                    <div key={q.id} className="pb-3 border-b border-slate-200 relative group">
                      <div className="flex items-start justify-between gap-4 text-sm">
                        <div className="font-bold">
                          {idx + 1}. {q.text}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono text-xs font-bold text-slate-700">[{q.marks}]</span>
                          <button
                            type="button"
                            onClick={() => setQuestions((prev) => prev.filter((x) => x.id !== q.id))}
                            className="text-slate-400 hover:text-rose-600 print:hidden cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {q.isMcq && q.options.some(Boolean) && (
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 pl-5 mt-1.5 text-xs text-slate-800">
                          {q.options.map((opt, oi) =>
                            opt ? (
                              <div key={oi}>
                                ({bubbleLetters[oi]}) {opt}
                              </div>
                            ) : null
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

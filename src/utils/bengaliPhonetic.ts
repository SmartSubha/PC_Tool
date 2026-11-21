// Avro-inspired English Phonetic -> Standard Bengali Unicode converter
// + Reverse Bengali -> English phonetic helper
// + Indian Number-to-Words (English & Bengali) for Bank Cheques & Invoices

const VOWELS: Record<string, { full: string; kar: string }> = {
  rri: { full: 'ঋ', kar: 'ৃ' },
  oi: { full: 'ঐ', kar: 'ৈ' },
  OI: { full: 'ঐ', kar: 'ৈ' },
  ou: { full: 'ঔ', kar: 'ৌ' },
  OU: { full: 'ঔ', kar: 'ৌ' },
  ee: { full: 'ঈ', kar: 'ী' },
  oo: { full: 'ঊ', kar: 'ূ' },
  aa: { full: 'আ', kar: 'া' },
  A: { full: 'আ', kar: 'া' },
  a: { full: 'আ', kar: 'া' },
  I: { full: 'ঈ', kar: 'ী' },
  i: { full: 'ই', kar: 'ি' },
  U: { full: 'ঊ', kar: 'ূ' },
  u: { full: 'উ', kar: 'ু' },
  E: { full: 'এ', kar: 'ে' },
  e: { full: 'এ', kar: 'ে' },
  O: { full: 'ও', kar: 'ো' },
  o: { full: 'অ', kar: '' },
};

const CONSONANTS: Record<string, string> = {
  ksh: 'ক্ষ',
  Ksh: 'ক্ষ',
  chh: 'ছ',
  Chh: 'ছ',
  NG: 'ঙ',
  Ng: 'ঙ',
  NY: 'ঞ',
  ny: 'ঞ',
  ng: 'ং',
  kh: 'খ',
  gh: 'ঘ',
  ch: 'চ',
  jh: 'ঝ',
  Th: 'ঠ',
  Dh: 'ঢ',
  th: 'থ',
  dh: 'ধ',
  ph: 'ফ',
  bh: 'ভ',
  sh: 'শ',
  Sh: 'ষ',
  Rh: 'ঢ়',
  rh: 'ড়',
  k: 'ক',
  g: 'গ',
  c: 'চ',
  j: 'জ',
  T: 'ট',
  D: 'ড',
  N: 'ণ',
  t: 'ত',
  d: 'দ',
  n: 'ন',
  p: 'প',
  f: 'ফ',
  b: 'ব',
  v: 'ভ',
  m: 'ম',
  z: 'য',
  r: 'র',
  l: 'ল',
  S: 'ষ',
  s: 'স',
  h: 'হ',
  R: 'ড়',
  y: 'য়',
  Y: 'য়',
  w: 'ব',
  q: 'ক',
  x: 'ক্স',
};

const SPECIALS: Record<string, string> = {
  ',,': '্',
  '`': '',
  '^': 'ঁ',
  ':': 'ঃ',
  't``': 'ৎ',
  'T`': 'ৎ',
  '.': '।',
  '...': '...',
  '$': '৳',
};

const BN_DIGITS: Record<string, string> = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯',
};

// Common whole-word phonetic overrides for clean official Bengali writing
const WORD_OVERRIDES: Record<string, string> = {
  ami: 'আমি',
  amader: 'আমাদের',
  amar: 'আমার',
  apni: 'আপনি',
  apnar: 'আপনার',
  apnader: 'আপনাদের',
  bangla: 'বাংলা',
  banglay: 'বাংলায়',
  bangladesh: 'বাংলাদেশ',
  poschimbongo: 'পশ্চিমবঙ্গ',
  paschimbanga: 'পশ্চিমবঙ্গ',
  sorkar: 'সরকার',
  sarkar: 'সরকার',
  manoniyo: 'মাননীয়',
  manoniya: 'মাননীয়া',
  mohashoy: 'মহাশয়',
  mahashoy: 'মহাশয়',
  mohashoya: 'মহাশয়া',
  binito: 'বিনীত',
  nibedon: 'নিবেদন',
  ei: 'এই',
  je: 'যে',
  tarikh: 'তারিখ',
  gram: 'গ্রাম',
  post: 'পোস্ট',
  thana: 'থানা',
  jela: 'জেলা',
  pin: 'পিন',
  swakhor: 'স্বাক্ষর',
  swakshar: 'স্বাক্ষর',
  abedon: 'আবেদন',
  abedonkari: 'আবেদনকারী',
  prarthana: 'প্রার্থনা',
  dhonyobad: 'ধন্যবাদ',
  dhanyabad: 'ধন্যবাদ',
  iti: 'ইতি',
  shri: 'শ্রী',
  shrimati: 'শ্রীমতী',
  bharot: 'ভারত',
  bharat: 'ভারত',
  kolkata: 'কলকাতা',
  aadhaar: 'আধার',
  aadhar: 'আধার',
  card: 'কার্ড',
  bank: 'ব্যাংক',
  school: 'স্কুল',
  college: 'কলেজ',
  office: 'অফিস',
  form: 'ফর্ম',
  nam: 'নাম',
  pitar: 'পিতার',
  matar: 'মাতার',
  thikana: 'ঠিকানা',
  mobile: 'মোবাইল',
  nombor: 'নম্বর',
  number: 'নম্বর',
  jonmo: 'জন্ম',
  janmo: 'জন্ম',
  prokolpo: 'প্রকল্প',
  lakshmir: 'লক্ষ্মীর',
  bhandar: 'ভাণ্ডার',
  swasthya: 'স্বাস্থ্য',
  sathi: 'সাথী',
  bishoy: 'বিষয়',
  bisoy: 'বিষয়',
  proyojon: 'প্রয়োজন',
  korte: 'করতে',
  kori: 'করি',
  korchi: 'করছি',
  hobe: 'হবে',
  hoy: 'হয়',
  ache: 'আছে',
  achhe: 'আছে',
  nai: 'নাই',
  nei: 'নেই',
  kintu: 'কিন্তু',
  ebong: 'এবং',
  othoba: 'অথবা',
  athaba: 'অথবা',
  taka: 'টাকা',
  matro: 'মাত্র',
};

const VOWEL_KEYS = Object.keys(VOWELS).sort((a, b) => b.length - a.length);
const CONS_KEYS = Object.keys(CONSONANTS).sort((a, b) => b.length - a.length);

function convertWordPhonetic(word: string, convertDigits: boolean): string {
  if (!word) return '';
  const lower = word.toLowerCase();
  if (WORD_OVERRIDES[lower]) return WORD_OVERRIDES[lower];

  let out = '';
  let i = 0;
  let prevType: 'none' | 'consonant' | 'vowel' | 'other' = 'none';

  while (i < word.length) {
    // Escaped raw text inside {} stays English
    if (word[i] === '{') {
      const closeIdx = word.indexOf('}', i + 1);
      if (closeIdx !== -1) {
        out += word.slice(i + 1, closeIdx);
        i = closeIdx + 1;
        prevType = 'other';
        continue;
      }
    }

    // Digits
    if (convertDigits && BN_DIGITS[word[i]]) {
      out += BN_DIGITS[word[i]];
      i += 1;
      prevType = 'other';
      continue;
    }

    // Explicit specials
    if (word.slice(i, i + 3) === 't``') {
      out += 'ৎ';
      i += 3;
      prevType = 'other';
      continue;
    }
    if (word.slice(i, i + 2) === ',,') {
      out += '্';
      i += 2;
      prevType = 'other';
      continue;
    }
    if (word.slice(i, i + 2) === 'T`') {
      out += 'ৎ';
      i += 2;
      prevType = 'other';
      continue;
    }
    if (word[i] === '`') {
      // Zero-width joiner / break consonant cluster
      i += 1;
      prevType = 'other';
      continue;
    }
    if (word[i] === '^') {
      out += 'ঁ';
      i += 1;
      prevType = 'other';
      continue;
    }
    if (word[i] === ':') {
      out += 'ঃ';
      i += 1;
      prevType = 'other';
      continue;
    }
    if (word[i] === '$') {
      out += '৳';
      i += 1;
      prevType = 'other';
      continue;
    }

    // Z after consonant => Jophola (্য)
    if (word[i] === 'Z' && prevType === 'consonant') {
      out += '্য';
      i += 1;
      prevType = 'consonant';
      continue;
    }

    // Match vowel
    let matchedVowel: string | null = null;
    for (const vk of VOWEL_KEYS) {
      if (word.startsWith(vk, i)) {
        matchedVowel = vk;
        break;
      }
    }
    if (matchedVowel) {
      const v = VOWELS[matchedVowel];
      if (prevType === 'consonant') {
        // 'o' after consonant is inherent vowel; 'o' at end or doubled 'oo' handled above
        if (matchedVowel === 'o') {
          out += '';
        } else {
          out += v.kar;
        }
      } else {
        // Standalone vowel (start of word or after another vowel)
        if (matchedVowel === 'a' && i === 0 && word.length > 1 && !word.startsWith('aa')) {
          out += 'আ';
        } else {
          out += v.full;
        }
      }
      i += matchedVowel.length;
      prevType = 'vowel';
      continue;
    }

    // Match consonant
    let matchedCons: string | null = null;
    for (const ck of CONS_KEYS) {
      if (word.startsWith(ck, i)) {
        matchedCons = ck;
        break;
      }
    }
    if (matchedCons) {
      const c = CONSONANTS[matchedCons];
      // Handle automatic conjuncts (hasanta) between adjacent consonants except 'ng' (ং) and 'y' (য়)
      if (prevType === 'consonant' && matchedCons !== 'ng' && matchedCons !== 'y' && matchedCons !== 'Y') {
        // Check if previous char in out wasn't already hasanta or ং or য়
        const lastChar = out[out.length - 1];
        if (lastChar && lastChar !== '্' && lastChar !== 'ং' && lastChar !== 'য়') {
          // Only join if next char is vowel or another consonant (natural Bengali conjuncts like pr, tr, st, nd, nt, kk, tt, mb, etc.)
          if (matchedCons === 'r' || matchedCons === 'l' || matchedCons === 'b' || matchedCons === 'm' || matchedCons === 'n' || matchedCons === 't' || matchedCons === 'T' || matchedCons === 'd' || matchedCons === 'D' || matchedCons === 'k' || matchedCons === 'g' || matchedCons === 'p' || matchedCons === 's' || matchedCons === 'j' || matchedCons === 'c' || matchedCons === 'ch' || matchedCons === 'th' || matchedCons === 'dh' || matchedCons === 'Th' || matchedCons === 'Dh' || matchedCons === 'bh' || matchedCons === 'ph' || matchedCons === 'kh' || matchedCons === 'gh' || matchedCons === 'N' || matchedCons === 'w' || matchedCons === 'z') {
            out += '্';
          }
        }
      }
      out += c;
      i += matchedCons.length;
      prevType = matchedCons === 'ng' ? 'other' : 'consonant';
      continue;
    }

    // Fallback punctuation / literal character
    if (word[i] === '.' && word.slice(i, i + 3) !== '...') {
      out += '।';
    } else {
      out += word[i];
    }
    i += 1;
    prevType = 'other';
  }

  return out;
}

export function phoneticToBengali(input: string, convertDigits = true): string {
  if (!input) return '';
  // Split preserving whitespace & newlines
  const tokens = input.split(/(\s+)/);
  return tokens
    .map((tok) => {
      if (!tok || /^\s+$/.test(tok)) return tok;
      // Preserve leading/trailing punctuation cleanly (except . at end -> ।)
      const match = tok.match(/^([("'[\-]*)(.*?)([)"'?,!;:\.]*)$/);
      if (!match) return convertWordPhonetic(tok, convertDigits);
      const [, lead, core, trail] = match;
      const convertedCore = convertWordPhonetic(core, convertDigits);
      const convertedTrail = trail.replace(/\./g, '।');
      return `${lead}${convertedCore}${convertedTrail}`;
    })
    .join('');
}

const BN_TO_EN_MAP: Record<string, string> = {
  'অ': 'o', 'আ': 'a', 'ই': 'i', 'ঈ': 'ee', 'উ': 'u', 'ঊ': 'oo', 'ঋ': 'ri',
  'এ': 'e', 'ঐ': 'oi', 'ও': 'o', 'ঔ': 'ou',
  'া': 'a', 'ি': 'i', 'ী': 'ee', 'ু': 'u', 'ূ': 'oo', 'ৃ': 'ri',
  'ে': 'e', 'ৈ': 'oi', 'ো': 'o', 'ৌ': 'ou',
  'ক': 'k', 'খ': 'kh', 'গ': 'g', 'ঘ': 'gh', 'ঙ': 'ng',
  'চ': 'ch', 'ছ': 'chh', 'জ': 'j', 'ঝ': 'jh', 'ঞ': 'n',
  'ট': 't', 'ঠ': 'th', 'ড': 'd', 'ঢ': 'dh', 'ণ': 'n',
  'ত': 't', 'থ': 'th', 'দ': 'd', 'ধ': 'dh', 'ন': 'n',
  'প': 'p', 'ফ': 'ph', 'ব': 'b', 'ভ': 'bh', 'ম': 'm',
  'য': 'j', 'র': 'r', 'ল': 'l', 'শ': 'sh', 'ষ': 'sh', 'স': 's', 'হ': 'h',
  'ড়': 'r', 'ঢ়': 'rh', 'য়': 'y', 'ৎ': 't', 'ং': 'ng', 'ঃ': 'h', 'ঁ': 'n',
  '্': '', '।': '.', '৳': 'Rs.',
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
};

export function bengaliToPhoneticEnglish(input: string): string {
  if (!input) return '';
  let out = '';
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === 'ক' && input[i + 1] === '্' && input[i + 2] === 'ষ') {
      out += 'ksh';
      i += 2;
      continue;
    }
    if (BN_TO_EN_MAP[ch] !== undefined) {
      out += BN_TO_EN_MAP[ch];
    } else {
      out += ch;
    }
  }
  return out;
}

// Convert numeric amount to Indian Rupee words (English)
const EN_ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];
const EN_TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigitEn(n: number): string {
  if (n < 20) return EN_ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return o ? `${EN_TENS[t]} ${EN_ONES[o]}` : EN_TENS[t];
}

export function numberToIndianWordsEn(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return '';
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  const parts: string[] = [];
  let rem = rupees;

  const crore = Math.floor(rem / 10000000);
  rem %= 10000000;
  if (crore > 0) parts.push(`${numberToIndianWordsEn(crore).replace(/ Only$/i, '').replace(/^Rupees /i, '')} Crore`);

  const lakh = Math.floor(rem / 100000);
  rem %= 100000;
  if (lakh > 0) parts.push(`${twoDigitEn(lakh)} Lakh`);

  const thousand = Math.floor(rem / 1000);
  rem %= 1000;
  if (thousand > 0) parts.push(`${twoDigitEn(thousand)} Thousand`);

  const hundred = Math.floor(rem / 100);
  rem %= 100;
  if (hundred > 0) parts.push(`${EN_ONES[hundred]} Hundred`);

  if (rem > 0) parts.push(twoDigitEn(rem));

  let result = parts.join(' ').trim();
  if (paise > 0) {
    result += ` and ${twoDigitEn(paise)} Paise`;
  }
  return result ? `${result} Only` : '';
}

const BN_NUM_WORDS: string[] = [
  'শূন্য', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়',
  'দশ', 'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোলো', 'সতেরো', 'আঠারো', 'উনিশ',
  'বিশ', 'একুশ', 'বাইশ', 'তেইশ', 'চব্বিশ', 'পঁচিশ', 'ছাব্বিশ', 'সাতাশ', 'আটাশ', 'ঊনত্রিশ',
  'ত্রিশ', 'একত্রিশ', 'বত্রিশ', 'তেত্রিশ', 'চৌত্রিশ', 'পঁয়ত্রিশ', 'ছত্রিশ', 'সাঁইত্রিশ', 'আটত্রিশ', 'ঊনচল্লিশ',
  'চল্লিশ', 'একচল্লিশ', 'বিয়াল্লিশ', 'তেতাল্লিশ', 'চুয়াল্লিশ', 'পঁয়তাল্লিশ', 'ছেচল্লিশ', 'সাতচল্লিশ', 'আটচল্লিশ', 'ঊনপঞ্চাশ',
  'পঞ্চাশ', 'একান্ন', 'বাহান্ন', 'তিপ্পান্ন', 'চুয়ান্ন', 'পঞ্চান্ন', 'ছাপ্পান্ন', 'সাতান্ন', 'আটান্ন', 'ঊনষাট',
  'ষাট', 'একষট্টি', 'বাষট্টি', 'তেষট্টি', 'চৌষট্টি', 'পঁয়ষট্টি', 'ছেষট্টি', 'সাতষট্টি', 'আটষট্টি', 'ঊনসত্তর',
  'সত্তর', 'একাত্তর', 'বাহাত্তর', 'তিয়াত্তর', 'চুয়াত্তর', 'পঁচাত্তর', 'ছিয়াত্তর', 'সাতাত্তর', 'আটাত্তর', 'ঊনআশি',
  'আশি', 'একাশি', 'বিরাশি', 'তিরাশি', 'চুরাশি', 'পঁচাশি', 'ছিয়াশি', 'সাতাশি', 'আটাশি', 'ঊননব্বই',
  'নব্বই', 'একানব্বই', 'বিরানব্বই', 'তিরানব্বই', 'চুরানব্বই', 'পঁচানব্বই', 'ছিয়ানব্বই', 'সাতানব্বই', 'আটানব্বই', 'নিরানব্বই',
];

export function numberToIndianWordsBn(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return '';
  let rem = Math.floor(amount);
  const parts: string[] = [];

  const crore = Math.floor(rem / 10000000);
  rem %= 10000000;
  if (crore > 0) parts.push(`${crore < 100 ? BN_NUM_WORDS[crore] : crore} কোটি`);

  const lakh = Math.floor(rem / 100000);
  rem %= 100000;
  if (lakh > 0) parts.push(`${BN_NUM_WORDS[lakh]} লক্ষ`);

  const thousand = Math.floor(rem / 1000);
  rem %= 1000;
  if (thousand > 0) parts.push(`${BN_NUM_WORDS[thousand]} হাজার`);

  const hundred = Math.floor(rem / 100);
  rem %= 100;
  if (hundred > 0) parts.push(`${BN_NUM_WORDS[hundred]} শত`);

  if (rem > 0) parts.push(BN_NUM_WORDS[rem]);

  return parts.length ? `${parts.join(' ')} টাকা মাত্র` : '';
}

export function toBengaliDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => BN_DIGITS[d] || d);
}

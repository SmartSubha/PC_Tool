export interface CyberPortalLink {
  label: string;
  url: string;
}

export interface CyberSevaItem {
  id: string;
  number: string;
  titleBn: string;
  titleEn: string;
  category: 'identity' | 'transport' | 'land' | 'welfare' | 'finance' | 'utility';
  whyBn: string;
  whyEn: string;
  portals: CyberPortalLink[];
  formsBn?: string[];
  docsBn?: string[];
  processBn: string;
  feesBn: string;
}

export const CYBER_QUICK_TIPS = [
  {
    name: 'Job & Scheme Document Checklist',
    descBn: 'SSC, রেল, পুলিশ, প্যান, রেশন ও কাস্ট সার্টিফিকেটের আসল পোর্টাল লিংক, ফটো-সই সাইজ ও কাস্টমার চেকলিস্ট স্লিপ প্রিন্ট।',
    descEn: 'Official portal links, photo/sign specs, step guide & printable customer checklist slips for jobs & WB schemes.',
    toolId: 'wb-job-scheme-checklist',
  },
  {
    name: '2-in-1 / 4-in-1 A4 Xerox Saver',
    descBn: 'একটি A4 পাতায় ২টি, ৪টি বা ৬টি পোর্টাল রসিদ/স্লিপ একসাথে বসিয়ে সরাসরি প্রিন্ট বা PDF করুন — কাগজ ও কালি বাঁচবে।',
    descEn: 'Combine 2, 4, or 6 portal slips & receipts onto 1 A4 page with cut guides and ink-saver B&W mode.',
    toolId: 'multi-slip-xerox-saver',
  },
  {
    name: 'Batch Image Rotator & Renamer',
    descBn: 'মোবাইলে বাঁকা/উল্টো তোলা ১০–৩০টি ছবি একসাথে ৯০° ঘুরিয়ে সিরিয়াল নামে রিনেম বা একটি A4 PDF তৈরি করুন।',
    descEn: 'Rotate up to 30 phone photos at once, serialize filenames cleanly, or bundle into one A4 PDF.',
    toolId: 'batch-image-fixer',
  },
  {
    name: 'Document Highlighter & e-Sign Placer',
    descBn: 'যেকোনো PDF বা ছবিতে রঙিন হাইলাইট, স্বচ্ছ সই (সাদা কাগজ রিমুভ) ও দোকানের স্ট্যাম্প বসিয়ে প্রিন্ট করুন।',
    descEn: 'Highlight important lines, auto-transparentize scanned signatures/stamps, place anywhere & print A4.',
    toolId: 'doc-stamp-sign-placer',
  },
  {
    name: 'Photo & Signature Size Reducer',
    descBn: 'চাকরির ফর্মের ফটো (২০-৫০ KB) ও সই (১০-২০ KB) সাইজ করতে আমাদের Compress Image এবং Resize Image টুল ব্যবহার করুন।',
    descEn: 'Use our built-in Compress Image & Resize Image in Pixels tools for exam photo (20-50 KB) and signature (10-20 KB).',
    toolId: 'image-compress',
  },
  {
    name: 'Mobile Document Scan & B&W Cleaner',
    descBn: 'মোবাইলে তোলা আবছা ছবি বা স্বাক্ষর এক ক্লিকে ঝকঝকে সাদা কাগজ ও গাঢ় কালো লেখায় রূপান্তর করুন।',
    descEn: 'Convert dim mobile photos into crisp high-contrast black-and-white printable scans in one click.',
    toolId: 'doc-scanner-cleaner',
  },
];

export const CYBER_SEVA_ITEMS: CyberSevaItem[] = [
  {
    id: 'voter-id',
    number: '১',
    titleBn: 'ভোটার কার্ড আবেদন ও সংশোধন',
    titleEn: 'Voter ID Application & Correction',
    category: 'identity',
    whyBn: '১৮ বছর বা তার বেশি বয়সী নাগরিকদের ভোটাধিকার এবং একটি নির্ভরযোগ্য পরিচয় ও ঠিকানার প্রমাণপত্র তৈরির জন্য আবেদন করা হয়।',
    whyEn: 'For citizens aged 18+ to obtain voting rights and an official identity & address proof.',
    portals: [{ label: "Voters' Services Portal (voters.eci.gov.in)", url: 'https://voters.eci.gov.in' }],
    formsBn: ['নতুন ভোটার: Form 6', 'সংশোধন বা ঠিকানা বদল: Form 8'],
    docsBn: [
      'বয়সের প্রমাণ (Age Proof): বার্থ সার্টিফিকেট, মাধ্যমিকের অ্যাডমিট কার্ড বা প্যান কার্ড।',
      'ঠিকানার প্রমাণ (Address Proof): পিতা/মাতার ভোটার কার্ড, ইলেকট্রিক বিল বা জমির দলিল।',
      'ছবি: ১ কপি রঙিন পাসপোর্ট সাইজ ছবি।',
    ],
    processBn:
      'পোর্টালে মোবাইল নম্বর দিয়ে অ্যাকাউন্ট খুলুন → Form 6 (নতুন) বা Form 8 (সংশোধন) বেছে নিন → কাস্টমারের সমস্ত তথ্য নির্ভুলভাবে টাইপ করুন → ২ MB-র মধ্যে Age Proof ও Address Proof আপলোড করুন → ছবি আপলোড করে সাবমিট করুন এবং Reference Number যুক্ত রসিদ প্রিন্ট করে দিন।',
    feesBn: 'সরকারি খরচ: ₹০ (বিনামূল্যে) | ক্যাফে সার্ভিস চার্জ: ₹২০ – ₹৩০।',
  },
  {
    id: 'passport',
    number: '২',
    titleBn: 'নতুন পাসপোর্ট আবেদন',
    titleEn: 'Fresh Passport Application',
    category: 'identity',
    whyBn: 'বিদেশ ভ্রমণ, উচ্চশিক্ষা বা চাকরির জন্য আন্তর্জাতিক ট্রাভেল ডকুমেন্ট ও নাগরিকত্বের প্রধান প্রমাণ হিসেবে পাসপোর্ট প্রয়োজন।',
    whyEn: 'Official international travel document issued by the Government of India.',
    portals: [{ label: 'Passport Seva (passportindia.gov.in)', url: 'https://passportindia.gov.in' }],
    docsBn: [
      'জন্ম তারিখের প্রমাণ: বার্থ সার্টিফিকেট বা মাধ্যমিকের অ্যাডমিট কার্ড।',
      'ঠিকানার প্রমাণ: বাবা/মায়ের পাসপোর্ট, ব্যাংকের স্ট্যাম্পযুক্ত পাসবই বা ইলেকট্রিক বিল।',
      'শিক্ষাগত যোগ্যতা (Non-ECR): মাধ্যমিক বা উচ্চতর পাসের সার্টিফিকেট।',
    ],
    processBn:
      'পোর্টালে রেজিস্ট্রেশন ও লগইন করুন → "Apply for Fresh Passport" ক্লিক করুন → ব্যক্তিগত ও পারিবারিক তথ্য দিন → নিকটবর্তী PSK ও অ্যাপয়েন্টমেন্ট স্লট বুক করুন → অনলাইনে ফি পেমেন্ট করে রসিদ প্রিন্ট করুন ও অরিজিনাল ডকুমেন্টসহ PSK-তে পাঠান।',
    feesBn: 'সরকারি ফি (৩৬ পেজ): ₹১,৫০০ | ক্যাফে চার্জ: ₹১০০ – ₹১৫০।',
  },
  {
    id: 'driving-licence',
    number: '৩',
    titleBn: 'ড্রাইভিং লাইসেন্স (RTO)',
    titleEn: 'Driving Licence (Learner & Permanent)',
    category: 'transport',
    whyBn: 'পাবলিক রোডে বৈধভাবে বাইক বা গাড়ি চালানোর আইনি অনুমতির জন্য বাধ্যতামূলক।',
    whyEn: 'Mandatory legal authorization for driving motor vehicles on public roads.',
    portals: [{ label: 'Sarathi Parivahan (sarathi.parivahan.gov.in)', url: 'https://sarathi.parivahan.gov.in' }],
    formsBn: ['ধাপ ১: লার্নার লাইসেন্স (LL - ৬ মাস মেয়াদ)', 'ধাপ ২: পার্মানেন্ট DL (লার্নারের ১ মাস পর)'],
    docsBn: ['বয়সের প্রমাণ (বার্থ/অ্যাডমিট কার্ড)', 'ঠিকানার প্রমাণ (ভোটার কার্ড)', 'পাসপোর্ট ছবি ও স্বাক্ষর স্ক্যান'],
    processBn:
      'রাজ্য সিলেক্ট করে প্রথমে "Apply for Learner Licence" আবেদন করুন → ডকুমেন্ট আপলোড ও অনলাইন ফি পে করে LL টেস্ট দিন → LL পাওয়ার ৩০ দিন পর "Apply for New Driving Licence" এ গিয়ে স্লট বুক করে RTO-তে ড্রাইভিং টেস্ট দিন।',
    feesBn: 'লার্নার ফি: ~₹২৪০–₹৩০০ | পার্মানেন্ট DL ফি: ~₹৭০০–₹১,০০০ (স্মার্ট কার্ডসহ)।',
  },
  {
    id: 'vehicle-tax-challan',
    number: '৪',
    titleBn: 'গাড়ির ট্যাক্স ও ট্রাফিক ই-চালান পেমেন্ট',
    titleEn: 'Vehicle Road Tax & e-Challan Payment',
    category: 'transport',
    whyBn: 'গাড়ির রোড ট্যাক্স আপ-টু-ডেট রাখা এবং ট্রাফিক ফাইন বা ই-চালান আইনি জটিলতা এড়িয়ে দ্রুত মেটানোর জন্য।',
    whyEn: 'Clear pending road taxes and traffic e-challans online to avoid penalties.',
    portals: [
      { label: 'Vahan Portal (Tax)', url: 'https://vahan.parivahan.gov.in' },
      { label: 'e-Challan Portal', url: 'https://echallan.parivahan.gov.in' },
    ],
    docsBn: ['গাড়ির রেজিস্ট্রেশন নম্বর', 'চেসিস ও ইঞ্জিন নম্বরের শেষ ৫ ডিজিট (RC বই থেকে)'],
    processBn:
      'বাহন পোর্টালে "Pay Your Tax"-এ গিয়ে চেসিস নম্বর দিয়ে বকেয়া ট্যাক্স UPI/নেটব্যাংকিং-এ পে করুন। চালানের জন্য echallan পোর্টালে গাড়ি/চালান নম্বর ও OTP দিয়ে পেন্ডিং ফাইন পে করে ক্লিয়ারেন্স রসিদ প্রিন্ট দিন।',
    feesBn: 'সিস্টেমে দেখানো ট্যাক্স/ফাইন অ্যামাউন্ট + ক্যাফে চার্জ ₹২০ – ₹৩০।',
  },
  {
    id: 'job-applications',
    number: '৫',
    titleBn: 'সরকারি ও চাকরির পরীক্ষার ফর্ম ফিলাপ',
    titleEn: 'Government & Competitive Exam Applications',
    category: 'welfare',
    whyBn: 'রেল, SSC, WBPSC, ব্যাংক ও রাজ্য সরকারি চাকরির পরীক্ষায় অংশগ্রহণের জন্য নির্ভুল অনলাইন আবেদন।',
    whyEn: 'Accurate online submission for SSC, WBPSC, RRB, Banking & State exams.',
    portals: [
      { label: 'WBPSC Portal', url: 'https://wbpsc.gov.in' },
      { label: 'SSC Portal', url: 'https://ssc.gov.in' },
      { label: 'RRB Portal', url: 'https://rrbcdg.gov.in' },
    ],
    docsBn: ['ভোটার বা প্যান কার্ড', 'মাধ্যমিক থেকে সব মার্কশিট ও সার্টিফিকেট', '২০–৫০ KB ছবি ও ১০–২০ KB সই'],
    processBn:
      'সংশ্লিষ্ট বোর্ডে OTR (One Time Registration) করুন → প্রোফাইলে লগইন করে "Apply Now" ক্লিক করুন → শিক্ষাগত যোগ্যতা দিন → PC Tool দিয়ে সঠিক পিক্সেল ও KB-তে ছবি/সই রিসাইজ করে আপলোড করুন ও ফাইনাল প্রিন্ট দিন।',
    feesBn: 'বোর্ডের পরীক্ষা ফি (₹১০০–₹৫০০+) + ক্যাফে চার্জ ₹৫০ – ₹১০০।',
  },
  {
    id: 'travel-booking',
    number: '৬',
    titleBn: 'ট্রেন, ফ্লাইট ও বাস টিকিট বুকিং',
    titleEn: 'Train, Flight & Bus Ticket Booking',
    category: 'transport',
    whyBn: 'দূরপাল্লার যাত্রায় স্টেশনের লাইন এড়িয়ে দ্রুত কনফার্ম সিট বুকিং করার জন্য।',
    whyEn: 'Quick advance reservation for trains, flights, and interstate buses.',
    portals: [
      { label: 'IRCTC Official (Train)', url: 'https://www.irctc.co.in' },
      { label: 'MakeMyTrip (Flight & Bus)', url: 'https://www.makemytrip.com' },
    ],
    docsBn: ['যাত্রীর নাম, বয়স, লিঙ্গ ও মোবাইল নম্বর', 'বৈধ আইডি কার্ড নম্বর (ভ্রমণের জন্য)'],
    processBn:
      'লগইন করে গন্তব্য ও তারিখ নির্বাচন করুন → ট্রেন/ক্লাস (SL/3A/2A) বেছে নিন → যাত্রীর বিবরণ ও মোবাইল নম্বর দিন → UPI/কার্ডে পেমেন্ট করে PDF টিকিট প্রিন্ট দিন।',
    feesBn: 'মূল টিকিট ভাড়া + ক্যাফে সার্ভিস চার্জ ₹৩০–₹৫০ (Sleeper) ও ₹১০০ (AC)।',
  },
  {
    id: 'mobile-dth-recharge',
    number: '৭',
    titleBn: 'মোবাইল ও DTH রিচার্জ (রিটেইলার মাধ্যম)',
    titleEn: 'Mobile & DTH Retail Recharge',
    category: 'utility',
    whyBn: 'সাধারণ কনজিউমার অ্যাপের অতিরিক্ত ফি এড়িয়ে রিটেইলার অ্যাপে ৩–৪% সরাসরি কমিশন আয়ের জন্য।',
    whyEn: 'Earn 3-4% direct retail commission without platform convenience surcharges.',
    portals: [],
    docsBn: ['Jio POS Plus / SmartConnect (Vi) / Airtel Mitra App', 'PayNearby / Spice Money পোর্টাল'],
    processBn:
      'রিটেইলার অ্যাপে লগইন করে কাস্টমারের নম্বর দিন → অপারেটর ও প্ল্যান সিলেক্ট করুন → রিটেইলার mPIN দিয়ে রিচার্জ সম্পন্ন করলে ওয়ালেটে সাথে সাথে কমিশন জমা হবে।',
    feesBn: 'নির্ধারিত রিচার্জ প্ল্যান মূল্য (কোনো অতিরিক্ত ফি নয়)।',
  },
  {
    id: 'gas-booking',
    number: '৮',
    titleBn: 'এলপিজি গ্যাস সিলিন্ডার বুকিং',
    titleEn: 'LPG Gas Cylinder Refill Booking',
    category: 'utility',
    whyBn: 'ডিস্ট্রিবিউটর অফিসের লাইনে না দাঁড়িয়ে বাড়িতে হোম ডেলিভারির জন্য গ্যাস রিফিল বুক করতে।',
    whyEn: 'Instant online LPG cylinder refill booking for Indane, Bharat Gas & HP.',
    portals: [
      { label: 'Bharat Gas Portal', url: 'https://my.ebharatgas.com' },
      { label: 'Indane Gas Portal', url: 'https://cx.indane.in' },
    ],
    docsBn: ['কনজিউমার আইডি / LPG আইডি', 'রেজিস্টার্ড মোবাইল নম্বর'],
    processBn:
      'সংস্থার পোর্টাল বা পেমেন্ট অ্যাপে গ্যাস এজেন্সি বেছে কনজিউমার আইডি/মোবাইল নম্বর দিন → নাম ও বর্তমান দাম যাচাই করে বুকিং কনফার্ম করুন ও বুকিং নম্বরসহ রসিদ দিন।',
    feesBn: 'সিলিন্ডারের সরকারি বাজার মূল্য + ক্যাফে চার্জ ₹১০ – ₹২০।',
  },
  {
    id: 'passport-photo-print',
    number: '৯',
    titleBn: 'পাসপোর্ট সাইজ ছবি তৈরি ও প্রিন্ট',
    titleEn: 'Passport Size Photo Creation & Printing',
    category: 'utility',
    whyBn: 'স্কুল-কলেজ ভর্তি, ব্যাংক অ্যাকাউন্ট ও সরকারি ফর্মের জন্য সাথে সাথে পাসপোর্ট ফটো শিট প্রিন্ট করতে।',
    whyEn: 'Instant studio-grade passport photo sheet printing on 4×6 or A4 glossy paper.',
    portals: [],
    formsBn: ['সাইজ: 35 × 45 mm (৩.৫ × ৪.৫ সেমি), 300 DPI', '৪×৬ (4R) বা A4 গ্লসি ফটো পেপার'],
    processBn:
      'আমাদের "Passport Size Photo Maker" টুলে ছবি আপলোড করে মুখ ও কাঁধের অংশ ক্রপ করুন, প্রয়োজনে সামান্য রোটেট ও উজ্জ্বলতা ঠিক করুন, ছবির নিচে নাম ও তারিখ যোগ করে ৪×৬ বা A4 শিটে ৮/১২/২৪/৩৬ কপি প্রিন্ট দিন।',
    feesBn: 'ম্যাটেরিয়াল খরচ ~₹৫ | কাস্টমার চার্জ (৮ কপি ৪×৬ শিট): ₹৩০ – ₹৪০।',
  },
  {
    id: 'biodata-resume',
    number: '১০',
    titleBn: 'চাকরি বা বিয়ের বায়োডাটা ও সিভি তৈরি',
    titleEn: 'Resume / CV & Marriage Biodata Design',
    category: 'utility',
    whyBn: 'ইন্টারভিউয়ের জন্য প্রফেশনাল রিজুমে এবং বিয়ের জন্য সুসজ্জিত বায়োডাটা তৈরি করতে।',
    whyEn: 'Clean formatted CV/Resume for interviews or decorative biodata for marriage.',
    portals: [{ label: 'Canva (Free Resume Builder)', url: 'https://www.canva.com' }],
    processBn:
      'বিবাহের বায়োডাটার জন্য আমাদের "Marriage Bio-data Maker" টুল ব্যবহার করুন এবং চাকরির CV-র জন্য পরিষ্কার টেবিলসহ শিক্ষাগত যোগ্যতা, স্কিল ও ডিক্লেয়ারেশন যুক্ত করে PDF/বন্ড পেপারে প্রিন্ট দিন।',
    feesBn: 'টাইপিং ও ১ কপি প্রিন্টসহ চার্জ: ₹৪০ – ₹৫০।',
  },
  {
    id: 'caste-certificate',
    number: '১১',
    titleBn: 'কাস্ট বা জাতিগত শংসাপত্র (SC/ST/OBC)',
    titleEn: 'Caste Certificate Application (West Bengal)',
    category: 'welfare',
    whyBn: 'সরকারি চাকরি, উচ্চশিক্ষা সংরক্ষণ ও স্কলারশিপ সুবিধা পাওয়ার জন্য অপরিহার্য শংসাপত্র।',
    whyEn: 'Essential certificate for education/job reservations and welfare scholarships.',
    portals: [{ label: 'Caste Certificate Portal WB', url: 'https://castcertificatewb.gov.in' }],
    docsBn: [
      'আবেদনকারীর বার্থ সার্টিফিকেট বা স্কুল অ্যাডমিট কার্ড।',
      'রক্তের সম্পর্কের (Blood Relation) কারো পুরনো কাস্ট সার্টিফিকেট ও বংশতালিকা।',
      'ভোটার কার্ড ও জমির খাজনা রসিদ।',
    ],
    processBn:
      'পোর্টালে "Apply for SC/ST/OBC" ক্লিক করে ফর্ম ফিলাপ করুন → ২ জন স্থানীয় সাক্ষীর নাম দিন → সাবমিট করে Acknowledgement ও ফর্ম প্রিন্ট করুন → আমাদের "WB Caste & Genealogy" টুল দিয়ে বংশতালিকা বানিয়ে ছবি ও সেলফ-অ্যাটেস্টেড জেরক্স সহ BDO/SDO অফিসে জমা দিতে বলুন।',
    feesBn: 'সরকারি খরচ: ₹০ | ক্যাফে সার্ভিস চার্জ: ₹৪০ – ₹৫০।',
  },
  {
    id: 'birth-certificate',
    number: '১২',
    titleBn: 'জন্ম শংসাপত্র (Birth Certificate)',
    titleEn: 'Birth Certificate Registration (WB)',
    category: 'welfare',
    whyBn: 'নাগরিকের জন্ম ও বয়সের প্রথম আইনি প্রমাণপত্র — স্কুল ভর্তি, পাসপোর্ট ও সব নথির ভিত্তি।',
    whyEn: 'Primary legal proof of birth and age for school admission and official records.',
    portals: [{ label: 'Janma-Mrityu Tathya Portal WB', url: 'https://janmamrityutathya.wb.gov.in' }],
    docsBn: [
      'হসপিটাল / নার্সিং হোমের Discharge Certificate বা Birth Slip।',
      'বাবা-মায়ের ভোটার কার্ড বা প্যান কার্ড।',
      '১ বছরের বেশি দেরি হলে কোর্টের হলফনামা ও লেট রেজিস্ট্রেশন ফাইল।',
    ],
    processBn:
      'পোর্টালে Citizen Services → Birth → "Apply for New Registration"-এ গিয়ে ডিসচার্জ স্লিপ অনুযায়ী তথ্য দিন → ডকুমেন্ট স্ক্যান করে আপলোড ও সাবমিট করুন → পঞ্চায়েত/পুরসভা অনুমোদনের পর ডিজিটাল সার্টিফিকেট ডাউনলোড করে প্রিন্ট দিন।',
    feesBn: '২১ দিনের মধ্যে ₹০ | দেরি হলে সামান্য সরকারি লেট ফি (₹১০–₹৫০) + ক্যাফে চার্জ ₹৪০–₹৫০।',
  },
  {
    id: 'pan-card',
    number: '১৩',
    titleBn: 'নতুন প্যান কার্ড আবেদন (Form 49A)',
    titleEn: 'New PAN Card Application (Form 49A)',
    category: 'finance',
    whyBn: 'ব্যাংক অ্যাকাউন্ট, আর্থিক লেনদেন, আয়কর দাখিল ও স্থায়ী ফটো আইডির জন্য জরুরি।',
    whyEn: 'Mandatory for banking, tax filing, financial transactions, and photo ID proof.',
    portals: [{ label: 'NSDL Online PAN Application', url: 'https://www.tin-nsdl.com' }],
    formsBn: ['Form 49A (Physical / Digital Documentation Mode)'],
    docsBn: ['আইডি: ভোটার কার্ড', 'ঠিকানা: ইলেকট্রিক বিল/ব্যাংক পাসবই', 'জন্মতারিখ: মাধ্যমিক অ্যাডমিট বা বার্থ সার্টিফিকেট'],
    processBn:
      'Form 49A ফিলাপ করে ₹১০৭ ফি পে করুন → ফিজিক্যাল মোডে হলে জেনারেট হওয়া ফর্ম প্রিন্ট করে ২টি ছবি লাগিয়ে ও সই করিয়ে অ্যাটেস্টেড নথিসহ NSDL অফিসে স্পিড পোস্ট করুন।',
    feesBn: 'সরকারি ফি: ₹১০৭ | ক্যাফে চার্জসহ মোট: ₹১৫০ – ₹২০০।',
  },
  {
    id: 'pan-voter-link',
    number: '১৪',
    titleBn: 'প্যান ও ভোটার কার্ড ভেরিফিকেশন/লিঙ্ক',
    titleEn: 'PAN-Voter Alternative ID Update',
    category: 'identity',
    whyBn: 'নির্বাচন কমিশনের ডেটাবেসে নাগরিকের প্রোফাইলে বিকল্প পরিচয়পত্র হিসেবে প্যান নম্বর আপডেট রাখতে।',
    whyEn: 'Update alternative ID metadata inside the official voter portal profile.',
    portals: [{ label: 'Voters Portal (voters.eci.gov.in)', url: 'https://voters.eci.gov.in' }],
    processBn:
      'ভোটার পোর্টালে লগইন করে প্রোফাইল / সার্ভিস সেকশনে যান → Alternative ID অপশনে PAN Card নির্বাচন করে ১০ ডিজিটের প্যান নম্বর সাবমিট করুন।',
    feesBn: 'সরকারি ফি: ₹০ | ক্যাফে চার্জ: ₹২০ – ₹৩০।',
  },
  {
    id: 'scholarships',
    number: '১৫',
    titleBn: 'স্কলারশিপ আবেদন (SVMCM ও NSP)',
    titleEn: 'Student Scholarships (SVMCM & NSP)',
    category: 'welfare',
    whyBn: 'মাধ্যমিক, উচ্চমাধ্যমিক ও কলেজ ছাত্রছাত্রীদের পড়াশোনার জন্য সরকারি বাৎসরিক বৃত্তি পেতে।',
    whyEn: 'Financial grants for meritorious and needy students across WB & India.',
    portals: [
      { label: 'Swami Vivekananda (SVMCM)', url: 'https://svmcm.wbhed.gov.in' },
      { label: 'National Scholarship (NSP)', url: 'https://scholarships.gov.in' },
    ],
    docsBn: [
      'শেষ পরীক্ষার মার্কশিট (মাধ্যমিক/উচ্চমাধ্যমিক/সেমিস্টার)',
      'ফ্যামিলি ইনকাম সার্টিফিকেট (BDO/কাউন্সিলর/প্রধান)',
      'ব্যাংক পাসবইয়ের প্রথম পাতা ও বর্তমান ভর্তির রসিদ',
    ],
    processBn:
      'নতুন রেজিস্ট্রেশন করে রোল নম্বর যাচাই করুন → ফর্ম ফিলাপ করে সমস্ত নথি নির্ধারিত KB-তে PDF আকারে আপলোড করুন → রিচেক করে ফাইনাল সাবমিট ও প্রিন্ট করে স্কুল/কলেজে জমা দিতে বলুন।',
    feesBn: 'সরকারি ফি: ₹০ | ক্যাফে সার্ভিস চার্জ: ₹৫০ – ₹১০০।',
  },
  {
    id: 'trade-license',
    number: '১৬',
    titleBn: 'ট্রেড লাইসেন্স আবেদন (শিল্পসাথী)',
    titleEn: 'Trade License Application (Shilpa Sathi WB)',
    category: 'finance',
    whyBn: 'পঞ্চায়েত বা পুরসভা এলাকায় বৈধভাবে দোকান বা ব্যবসা পরিচালনার সরকারি অনুমতির জন্য।',
    whyEn: 'Official municipal/panchayat business permit in West Bengal.',
    portals: [{ label: 'Shilpa Sathi Portal WB', url: 'https://shilpasathi.wb.gov.in' }],
    docsBn: ['জমির দলিল বা আপ-টু-ডেট খাজনা রসিদ', 'ভাড়া দোকান হলে Rent Agreement', 'মালিকের ভোটার কার্ড'],
    processBn:
      'শিল্পসাথী পোর্টালে লগইন করে Trade License (GP/Municipality) নির্বাচন করুন → দোকানের নাম, ব্যবসার ধরন ও ঠিকানা দিন → দলিল/খাজনা আপলোড করে অনলাইন ফি পে করলে তাৎক্ষণিক ডিজিটাল ট্রেড লাইসেন্স ডাউনলোড করা যাবে।',
    feesBn: 'পঞ্চায়েত এলাকায় ৩ বছরের সরকারি ফি ~₹১৫০–₹৫০০ + ক্যাফে চার্জ ₹৫০–₹১০০।',
  },
  {
    id: 'land-records-mutation',
    number: '১৭',
    titleBn: 'জমির রেকর্ড (পরচা) ও মিউটেশন (বাংলারভূমি)',
    titleEn: 'Land Records (ROR) & Mutation (Banglarbhumi)',
    category: 'land',
    whyBn: 'জমির বর্তমান মালিকানা যাচাই (খতিয়ান/দাগ তথ্য) এবং জমি কেনার পর নামজারি (Mutation) করার জন্য।',
    whyEn: 'Check live land ownership (Khatian/Plot) and apply for post-purchase Mutation.',
    portals: [{ label: 'Banglarbhumi Portal', url: 'https://banglarbhumi.gov.in' }],
    processBn:
      'রেকর্ড দেখতে Citizen Services → "Know Your Property"-তে জেলা, ব্লক, মৌজা ও দাগ/খতিয়ান নম্বর দিয়ে তথ্য প্রিন্ট দিন। মিউটেশনের জন্য লগইন করে Mutation Application-এ দলিল PDF আপলোড ও ফি পে করে কেস নম্বর প্রিন্ট দিন।',
    feesBn: 'তথ্য দেখা: ক্যাফে চার্জ ₹২০ | মিউটেশন: জমির ভ্যালু অনুযায়ী সরকারি ফি + ক্যাফে চার্জ ₹১০০–₹২০০।',
  },
  {
    id: 'ration-surrender-category',
    number: '১৮',
    titleBn: 'রেশন কার্ড ক্যাটাগরি বদল বা সারেন্ডার',
    titleEn: 'Ration Card Surrender & Category Change',
    category: 'welfare',
    whyBn: 'মৃত সদস্যের কার্ড বাতিল (Form 7) বা নন-সাবসিডাইজড / ক্যাটাগরি পরিবর্তনের (Form 10) জন্য।',
    whyEn: 'Delete deceased member cards or modify subsidy category online.',
    portals: [{ label: 'Food & Supplies Dept WB', url: 'https://food.wb.gov.in' }],
    formsBn: ['সারেন্ডার বা ডিলিট: Form 7', 'ক্যাটাগরি বদল / নন-সাবসিডাইজড: Form 10'],
    processBn:
      'ফুড পোর্টালে নির্দিষ্ট ফর্ম নির্বাচন করে পরিবারের সচল রেশন কার্ড নম্বরে OTP ভেরিফাই করুন → ডেথ সার্টিফিকেট বা প্রমাণ আপলোড করে সাবমিট করুন ও রসিদ প্রিন্ট দিন।',
    feesBn: 'সরকারি ফি: ₹০ | ক্যাফে চার্জ: ₹২০ – ₹৩০।',
  },
  {
    id: 'epfo-services',
    number: '১৯',
    titleBn: 'PF ব্যালেন্স ও টাকা তোলা (EPFO)',
    titleEn: 'EPFO Provident Fund Balance & Claim',
    category: 'finance',
    whyBn: 'চাকরিজীবী ব্যক্তিদের জমানো PF ব্যালেন্স দেখা এবং চিকিৎসা/বাড়ি/বিয়ের জন্য ক্লেম করার কাজে।',
    whyEn: 'Check passbook balance and submit Form 31/19/10C withdrawal claims.',
    portals: [{ label: 'EPFO Member Portal', url: 'https://unifiedportal-mem.epfindia.gov.in/memberinterface/' }],
    processBn:
      'UAN ও পাসওয়ার্ড দিয়ে লগইন করে "View Passbook" দেখুন। টাকা তুলতে Online Services → Claim (Form 31/19/10C)-এ ব্যাংক অ্যাকাউন্ট যাচাই ও পাসবই/ক্যানসেল চেক আপলোড করে OTP দিয়ে সাবমিট করুন।',
    feesBn: 'সরকারি ফি: ₹০ | ক্যাফে চার্জ: ₹১০০ – ₹১৫০।',
  },
  {
    id: 'jeevan-pramaan',
    number: '২০',
    titleBn: 'ডিজিটাল লাইফ সার্টিফিকেট (জীবন প্রমাণ)',
    titleEn: 'Jeevan Pramaan Digital Life Certificate',
    category: 'welfare',
    whyBn: 'অবসরপ্রাপ্ত পেনশনভোগীদের প্রতি বছর নভেম্বর মাসে পেনশন চালু রাখার জন্য জীবিত থাকার ডিজিটাল প্রমাণ জমা দিতে।',
    whyEn: 'Annual biometric/face life certificate verification for pensioners.',
    portals: [{ label: 'Jeevan Pramaan Portal', url: 'https://jeevanpramaan.gov.in' }],
    processBn:
      'জীবন প্রমাণ অ্যাপে পেনশনারের PPO নম্বর ও ব্যাংক অ্যাকাউন্ট দিন → AadhaarFaceRD বা বায়োমেট্রিক দিয়ে লাইভ ভেরিফিকেশন করলে প্রমাণ আইডি জেনারেট হবে যা প্রিন্ট করে দিন।',
    feesBn: 'ক্যাফে চার্জ: ₹৩০ – ₹৫০।',
  },
  {
    id: 'electricity-connection',
    number: '২১',
    titleBn: 'নতুন ইলেকট্রিক মিটার কানেকশন ও নাম বদল',
    titleEn: 'New Electricity Meter & Name Change',
    category: 'utility',
    whyBn: 'নতুন বাড়ি/দোকানে বৈদ্যুতিক মিটার নেওয়া বা কেনাবেচার পর বিলের নাম পরিবর্তনের জন্য।',
    whyEn: 'Apply for domestic/commercial meter connections under WBSEDCL or CESC.',
    portals: [
      { label: 'WBSEDCL Portal (Rural)', url: 'https://www.wbsedcl.in' },
      { label: 'CESC Portal (Kolkata)', url: 'https://www.cesc.co.in' },
    ],
    docsBn: ['জমির পরচা/দলিল/ট্যাক্স রসিদ', 'আবেদনকারীর ভোটার কার্ড', '১ কপি পাসপোর্ট ছবি'],
    processBn:
      'WBSEDCL পোর্টালে "New Connection"-এ মোবাইল OTP দিয়ে রেজিস্ট্রেশন করুন → লোড ও ঠিকানা দিয়ে দলিল/ভোটার কার্ড আপলোড করুন → জেনারেট হওয়া Quotation Letter পেমেন্ট করলে টেকনিশিয়ান এসে মিটার বসিয়ে দেবে।',
    feesBn: 'কোটেশন বিলের সরকারি খরচ + ক্যাফে চার্জ ₹৫০ – ₹১০০।',
  },
  {
    id: 'ration-transfer-form14',
    number: '২২',
    titleBn: 'বিবাহের পর রেশন কার্ড স্থানান্তর (Form 14)',
    titleEn: 'Ration Card Family Transfer (Form 14)',
    category: 'welfare',
    whyBn: 'নতুন বিবাহের পর বাপার বাড়ির রেশন ডেটাবেস থেকে নাম শ্বশুরবাড়ির রেশন কার্ডের সাথে লিঙ্ক করতে।',
    whyEn: 'Transfer ration membership into spouse family card post-marriage.',
    portals: [{ label: 'Food & Supplies Web Portal', url: 'https://food.wb.gov.in' }],
    formsBn: ['বিবাহ/স্থানান্তর: Form 14'],
    processBn:
      'পোর্টালে মেম্বার লগইন করে Form 14 সিলেক্ট করুন → ম্যারেজ সার্টিফিকেট বা পঞ্চায়েত প্রধানের সার্টিফিকেট আপলোড করে নতুন পরিবারের প্রধানের রেশন কার্ড নম্বর দিয়ে সাবমিট করুন।',
    feesBn: 'সরকারি ফি: ₹০ | ক্যাফে চার্জ: ₹৩০।',
  },
  {
    id: 'land-khajna',
    number: '২৩',
    titleBn: 'জমির খাজনা (Land Revenue) পেমেন্ট',
    titleEn: 'Annual Land Khajna / Revenue Payment',
    category: 'land',
    whyBn: 'জমির মালিকানা নিষ্কণ্টক রাখতে ও সরকারি খাতায় বকেয়া কর না রাখতে প্রতি বছর ভূমি রাজস্ব দিতে হয়।',
    whyEn: 'Pay yearly land revenue via GRIPS to receive official Khajna Receipt.',
    portals: [{ label: 'Banglarbhumi Land Systems', url: 'https://banglarbhumi.gov.in' }],
    processBn:
      'বাংলারভূমি পোর্টালে লগইন করে "Land Revenue Application (খাজনা)"-য় খতিয়ান ও দাগ নম্বর দিন → সিস্টেমে দেখানো বকেয়া টাকা GRIPS পেমেন্ট গেটওয়ে দিয়ে পে করে Khajna Receipt কালার প্রিন্ট দিন।',
    feesBn: 'সরকারি খাজনা অ্যামাউন্ট + ক্যাফে চার্জ ₹৩০ – ₹৫০।',
  },
  {
    id: 'ecourts-grips',
    number: '২৪',
    titleBn: 'ই-কোর্ট ফি ও চালান পেমেন্ট (GRIPS)',
    titleEn: 'e-Courts Fee & GRIPS Challan Payment',
    category: 'finance',
    whyBn: 'আদালতের জরিমানা, জুডিশিয়াল/নন-জুডিশিয়াল স্ট্যাম্প বা কোর্ট ফি সরাসরি সরকারি ট্রেজারিতে জমা দেওয়ার জন্য।',
    whyEn: 'Direct treasury payment for court fees and official GRN challans.',
    portals: [{ label: 'GRIPS Portal West Bengal', url: 'https://grips.wbhed.gov.in' }],
    processBn:
      'GRIPS পোর্টালে গিয়ে e-Challan / Court Fee সিলেক্ট করুন → ডিপার্টমেন্ট (Law Dept / Judiciary) ও কেস নম্বর/তথ্য দিয়ে পেমেন্ট সম্পন্ন করুন ও GRN নম্বরযুক্ত অফিসিয়াল চালান প্রিন্ট করে দিন।',
    feesBn: 'নির্ধারিত কোর্ট ফি/জরিমানা + ক্যাফে চার্জ ₹৩০ – ₹৫০।',
  },
  {
    id: 'krishak-bandhu-bsb',
    number: '২৫',
    titleBn: 'কৃষক বন্ধু প্রকল্প ও বাংলা শস্য বীমা (Krishak Bandhu & BSB)',
    titleEn: 'Krishak Bandhu Payment Status & Bangla Shasya Bima',
    category: 'welfare',
    whyBn: 'চাষিদের বছরে ₹৪,০০০–₹১০,০০০ সরকারি সহায়তা (খরিফ ও রবি মৌসুম) এবং প্রাকৃতিক দুর্যোগে ফসলের ক্ষতিপূরণের জন্য।',
    whyEn: 'Apply or check Aadhaar-linked DBT farmer grant and free state crop insurance.',
    portals: [
      { label: 'Krishak Bandhu Official Portal', url: 'https://krishakbandhu.net' },
      { label: 'Bangla Shasya Bima (BSB)', url: 'https://banglashasyabima.net' },
    ],
    docsBn: [
      'আবেদনকারীর আধার কার্ড ও ভোটার কার্ড',
      'জমির সাম্প্রতিক পরচা / রেকর্ড (খতিয়ান ও দাগ নম্বরসহ)',
      'সচল সিঙ্গেল ব্যাংক অ্যাকাউন্টের পাসবই (আধার লিঙ্ক যুক্ত)',
      'পাসপোর্ট ছবি ও চালু মোবাইল নম্বর',
    ],
    processBn:
      'krishakbandhu.net-এ ভোটার বা আধার নম্বর দিয়ে স্ট্যাটাস দেখুন (Account Valid / Transaction Success কি না)। নতুন আবেদন বা বাংলা শস্য বীমার জন্য অফলাইন ফর্ম ও পরচা-ব্যাংক কপি নিয়ে দুয়ারে সরকার ক্যাম্প বা ADA (কৃষি) অফিসে জমা দিতে হয়।',
    feesBn: 'সরকারি ফি: ₹০ | ক্যাফে চার্জ (স্ট্যাটাস/ফর্ম প্রিন্ট): ₹২০ – ₹৪০।',
  },
  {
    id: 'eration-download-ekyc',
    number: '২৬',
    titleBn: 'ডিজিটাল ই-রেশন কার্ড ডাউনলোড ও আধার/মোবাইল লিঙ্ক',
    titleEn: 'Download Digital e-Ration Card & Aadhaar/Mobile Link',
    category: 'welfare',
    whyBn: 'হারিয়ে যাওয়া রেশন কার্ড নতুন করে PDF ডাউনলোড করতে বা রেশন দোকান থেকে মাল তোলার আগে কার্ডের সাথে আধার ও মোবাইল e-KYC করতে।',
    whyEn: 'Instant PDF download of e-Ration card and OTP mobile linking.',
    portals: [{ label: 'WB Food e-Ration Services', url: 'https://food.wb.gov.in' }],
    processBn:
      'food.wb.gov.in → Special Services / e-Ration Card → "Download e-Ration Card"-এ রেশন কার্ড নম্বর ও ক্যাপচা দিয়ে OTP ভেরিফাই করে রঙিন PDF ডাউনলোড ও আইডি কার্ড প্রিন্ট দিন। মোবাইল লিঙ্ক করতে Link Aadhaar/Mobile অপশন ব্যবহার করুন।',
    feesBn: 'সরকারি ফি: ₹০ | ক্যাফে চার্জ (ডাউনলোড + PVC/লেমিনেশন): ₹৩০ – ₹৬০।',
  },
  {
    id: 'aadhaar-doc-pan-link',
    number: '২৭',
    titleBn: 'আধার ডকুমেন্ট আপডেট (POB/POA) ও প্যান-আধার লিঙ্ক',
    titleEn: 'Aadhaar Free Document Update & PAN-Aadhaar Linking',
    category: 'identity',
    whyBn: '১০ বছরের পুরনো আধার সচল রাখতে POI/POA আপলোড এবং ইনঅ্যাক্টিভ হওয়া আটকাতে প্যান কার্ডের সাথে আধার লিঙ্ক করা বাধ্যতামূলক।',
    whyEn: 'Upload POI/POA proof on myAadhaar and link PAN with Aadhaar on Income Tax portal.',
    portals: [
      { label: 'myAadhaar UIDAI Portal', url: 'https://myaadhaar.uidai.gov.in' },
      { label: 'Income Tax e-Filing (PAN Link)', url: 'https://www.incometax.gov.in' },
    ],
    docsBn: ['ভোটার কার্ড / প্যান কার্ড / রেশন কার্ড / মাধ্যমিক সার্টিফিকেট (স্ক্যান PDF < 2 MB)'],
    processBn:
      'আধার আপডেটের জন্য myaadhaar.uidai.gov.in-এ OTP লগইন করে "Document Update"-এ ভোটার/প্যান ও ঠিকানার প্রমাণ আপলোড করে SRN প্রিন্ট দিন। প্যান-আধার লিঙ্ক করতে incometax.gov.in → Link Aadhaar-এ ₹১,০০০ চালান পেমেন্ট করে ৪–৫ দিন পর লিঙ্ক রিকোয়েস্ট সাবমিট করুন।',
    feesBn: 'আধার আপডেট: ₹০–₹৫০ | প্যান-আধার লিঙ্ক সরকারি ফি: ₹১,০০০ + ক্যাফে চার্জ ₹১০০।',
  },
  {
    id: 'swasthya-sathi-formb',
    number: '২৮',
    titleBn: 'স্বাস্থ্যসাথী কার্ড স্ট্যাটাস, হসপিটাল লিস্ট ও ফর্ম-B মেম্বার অ্যাড',
    titleEn: 'Swasthya Sathi URN Check & Family Member Addition',
    category: 'welfare',
    whyBn: 'পশ্চিমবঙ্গের ₹৫ লক্ষ টাকার বিনামূল্যে চিকিৎসা কার্ড সচল আছে কি না দেখা, পরিবারের নতুন সদস্য যোগ করা বা কার্ডের নাম সংশোধন।',
    whyEn: 'Verify active Swasthya Sathi card status or guide applicants on Form B / Form A.',
    portals: [{ label: 'Swasthya Sathi Official Site', url: 'https://swasthyasathi.gov.in' }],
    formsBn: [
      'নতুন কার্ড আবেদন: Form-B',
      'নতুন সদস্য/শিশু যোগ: Form-A',
      'সদস্য বাদ বা সংশোধন: Form-C / D',
    ],
    processBn:
      'swasthyasathi.gov.in → Find Your Name-এ জেলা, ব্লক/মিউনিসিপ্যালিটি ও আধার বা খাদ্যসাথী নম্বর দিয়ে পরিবারের নাম ও কার্ড অ্যাক্টিভ কি না চেক করুন। নতুন নাম তুলতে নির্দিষ্ট ফর্ম প্রিন্ট ও ডকুমেন্টসহ দুয়ারে সরকার ক্যাম্পে জমা দিন।',
    feesBn: 'সরকারি ফি: ₹০ | ক্যাফে চার্জ: ₹২০ – ₹৪০।',
  },
  {
    id: 'aikyashree-oasis-scholarship',
    number: '২৯',
    titleBn: 'ঐক্যশ্রী (সংখ্যালঘু) ও ওয়েসিস (SC/ST/OBC) স্কলারশিপ',
    titleEn: 'Aikyashree Minority & Oasis SC/ST/OBC Scholarship',
    category: 'welfare',
    whyBn: 'সংখ্যালঘু (মুসলিম/খ্রিস্টান/বৌদ্ধ/জৈন/শিখ) ও তফসিলি জাতি/উপজাতি/OBC ছাত্রছাত্রীদের বার্ষিক সরকারি বৃত্তির আবেদন।',
    whyEn: 'Online Fresh/Renewal scholarship forms under WBMDFC Aikyashree & WB Oasis.',
    portals: [
      { label: 'WBMDFC Aikyashree', url: 'https://wbmdfcscholarship.in' },
      { label: 'WB Oasis Scholarship', url: 'https://oasis.gov.in' },
    ],
    docsBn: [
      'আধার কার্ড ও বাংলা শিক্ষা আইডি (যদি স্কুল ছাত্র হয়)',
      'শেষ পরীক্ষার মার্কশিট, ভর্তির রসিদ ও নিজস্ব ব্যাংক পাসবই',
      'কাস্ট সার্টিফিকেট (শুধু Oasis-এর জন্য) এবং ইনকাম সার্টিফিকেট',
    ],
    processBn:
      'ছাত্রের ধর্ম/জাতি অনুযায়ী wbmdfcscholarship.in বা oasis.gov.in-এ Fresh/Renewal লগইন করুন → শিক্ষাগত তথ্য ও ব্যাংকের IFSC/Account যাচাই করে লক করুন → জেনারেট হওয়া ফর্ম প্রিন্ট করে স্কুল/কলেজে জমা দিতে বলুন।',
    feesBn: 'সরকারি ফি: ₹০ | ক্যাফে চার্জ: ₹৫০ – ₹৮০।',
  },
  {
    id: 'employment-bank-yuvashree',
    number: '৩০',
    titleBn: 'যুবশ্রী ও এমপ্লয়মেন্ট ব্যাংক রেজিস্ট্রেশন (বেকার ভাতা)',
    titleEn: 'WB Employment Bank Registration & Yuvashree Annexure-III',
    category: 'welfare',
    whyBn: 'মাধ্যমিক বা উচ্চশিক্ষিত বেকার যুবক-যুবতীদের সরকারি চাকরির এমপ্লয়মেন্ট এক্সচেঞ্জ কার্ড ও যুবশ্রী ভাতার তালিকাভুক্তি।',
    whyEn: 'Register Jobseeker ID and submit Yuvashree 6-month Annexure-III update.',
    portals: [{ label: 'Employment Bank WB', url: 'https://employmentbankwb.gov.in' }],
    docsBn: ['মাধ্যমিক অ্যাডমিট ও মার্কশিট', 'উচ্চশিক্ষা/কম্পিউটার সার্টিফিকেট', 'আধার/ভোটার কার্ড ও ছবি (<500KB)'],
    processBn:
      'employmentbankwb.gov.in → Jobseeker → "New Enrollment" এ শর্তাবলী অ্যাক্সেপ্ট করে ফর্ম পূরণ করুন → পাওয়া Temporary Enrollment Slip ও ডকুমেন্ট নিয়ে ৬০ দিনের মধ্যে কাছের Employment Exchange অফিসে ভেরিফাই করালে পার্মানেন্ট কার্ড চালু হবে।',
    feesBn: 'সরকারি ফি: ₹০ | ক্যাফে চার্জ: ₹৬০ – ₹১০০।',
  },
  {
    id: 'wb-edistrict-certificates',
    number: '৩১',
    titleBn: 'ই-ডিস্ট্রিক্ট ২.০ — ইনকাম, স্থায়ী বাসিন্দা (Domicile) ও দূরত্ব সার্টিফিকেট',
    titleEn: 'WB e-District 2.0 Income, Local Residence & Warish Certs',
    category: 'welfare',
    whyBn: 'স্কলারশিপ, সরকারি চাকরি (পুলিশ/আর্মি) বা ব্যাংক লোনের জন্য BDO / SDO / DM ডিজিটাল ইনকাম ও ডমিসাইল সার্টিফিকেট বানাতে।',
    whyEn: 'Apply online on edistrict.wb.gov.in for digitally signed Income & Residence certificates.',
    portals: [{ label: 'WB e-District 2.0 Portal', url: 'https://edistrict.wb.gov.in' }],
    docsBn: [
      'আবেদনকারীর আধার / ভোটার / মাধ্যমিক অ্যাডমিট ও ছবি (< 100 KB)',
      'গ্রাম প্রধান / মিউনিসিপ্যালিটি কাউন্সিলর / BDO সুপারিশকৃত ইনকাম ও রেসিডেন্স সার্টিফিকেট (PDF <= 200 KB)',
      'সেলফ-ডিক্লারেশন ফর্ম (PC Tool Document Tools থেকে প্রিন্ট করতে পারবেন)',
    ],
    processBn:
      'edistrict.wb.gov.in-এ মোবাইল নম্বর দিয়ে সাইন-ইন করে নির্দিষ্ট সার্ভিস (Income / Local Residence / Distance Certificate) বাছুন → তথ্য পূরণ করে প্রধান/কাউন্সিলর প্রদত্ত চিঠি আপলোড ও ই-সাইন করলে প্রসেসিং শেষে সরাসরি পোর্টাল থেকেই ডিজিটাল সার্টিফিকেট ডাউনলোড হয়।',
    feesBn: 'সরকারি ফি: ₹০ | ক্যাফে চার্জ: ₹৭০ – ₹১০০।',
  },
  {
    id: 'udyam-msme-fssai',
    number: '৩২',
    titleBn: 'দোকান ও ব্যবসার উদগম (MSME Udyam) ও ফুড লাইসেন্স (FSSAI)',
    titleEn: 'Free Udyam MSME Registration & FSSAI Food License (FoSCoS)',
    category: 'finance',
    whyBn: 'ছোট দোকান, সাইবার ক্যাফে, ব্যবসার ব্যাংক লোন (Mudra) পেতে MSME সার্টিফিকেট এবং খাবার/মুদি দোকানের জন্য FSSAI ফুড লাইসেন্স।',
    whyEn: 'Instant free MSME Udyam registration and ₹100/yr FSSAI Basic registration.',
    portals: [
      { label: 'Udyam Registration (MSME Free)', url: 'https://udyamregistration.gov.in' },
      { label: 'FSSAI FoSCoS Portal', url: 'https://foscos.fssai.gov.in' },
    ],
    docsBn: ['আধার (মোবাইল OTP লিঙ্ক), প্যান কার্ড, দোকানের ঠিকানা ও ব্যাংক অ্যাকাউন্ট নম্বর'],
    processBn:
      '১) Udyam পোর্টালে আধার ও প্যান ভেরিফাই করে ব্যবসার ধরন (NIC Code) দিলে সম্পূর্ণ বিনামূল্যে তাৎক্ষণিক MSME সার্টিফিকেট ডাউনলোড হয়। ২) খাবার ব্যবসার জন্য FoSCoS পোর্টালে ছবি, আধার ও দোকানের প্রমাণপত্র আপলোড ও প্রতি বছর ₹১০০ সরকারি ফি দিয়ে FSSAI লাইসেন্সের আবেদন করতে হয়।',
    feesBn: 'MSME Udyam সরকারি ফি: ₹০ (ক্যাফে ₹১০০) | FSSAI: ₹১০০/বছর + ক্যাফে ₹১৫০–₹২৫০।',
  },
];

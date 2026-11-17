export interface WbChecklistPreset {
  id: string;
  category: 'job' | 'welfare' | 'identity' | 'education';
  titleBn: string;
  titleEn: string;
  portalName: string;
  portalUrl: string;
  secondaryPortal?: { label: string; url: string };
  photoSpecBn: string;
  photoSpecEn: string;
  signSpecBn: string;
  signSpecEn: string;
  quickToolIds: string[];
  requiredDocsBn: string[];
  requiredDocsEn: string[];
  stepsBn: string;
  stepsEn: string;
  approxFeeBn: string;
}

export const WB_CHECKLIST_PRESETS: WbChecklistPreset[] = [
  {
    id: 'ssc-otr',
    category: 'job',
    titleBn: 'SSC (CGL / CHSL / GD / MTS) চাকরির ফর্ম ও OTR',
    titleEn: 'SSC Exams (CGL / CHSL / GD / MTS) Form & OTR',
    portalName: 'SSC New Official Portal (ssc.gov.in)',
    portalUrl: 'https://ssc.gov.in',
    photoSpecBn: 'লাইভ ওয়েবক্যাম ফটো (MySSC অ্যাপ) অথবা 20–50 KB (3.5×4.5 cm, সাদা ব্যাকগ্রাউন্ড)',
    photoSpecEn: 'Live Webcam Photo or 20–50 KB JPEG (3.5×4.5 cm, plain light background)',
    signSpecBn: 'সাদা কাগজে কালো বা নীল কালির সই — 10–20 KB (4.0×2.0 cm, আবছা যেন না হয়)',
    signSpecEn: 'Horizontal clear signature on white paper — 10–20 KB (4.0×2.0 cm)',
    quickToolIds: ['passport-size-photo', 'image-compress', 'resize-image'],
    requiredDocsBn: [
      'মাধ্যমিক (10th) অ্যাডমিট ও মার্কশিট (নাম ও জন্মতারিখ মিলিয়ে নিতে)',
      'আধার কার্ড / ভোটার কার্ড / প্যান কার্ড (যেকোনো একটি বৈধ পরিচয়পত্র)',
      'সচল মোবাইল নম্বর ও নিজস্ব ইমেইল আইডি (OTP ভেরিফিকেশনের জন্য)',
      'সর্বোচ্চ শিক্ষাগত যোগ্যতার মার্কশিট ও পাসিং বছর (HS / Graduation)',
      'কাস্ট সার্টিফিকেট (SC/ST/OBC-NCL/EWS — প্রযোজ্য হলে)',
      'সাদা কাগজে কালো কালির পরিষ্কার স্বাক্ষর',
    ],
    requiredDocsEn: [
      '10th / Madhyamik Admit Card & Marksheet (exact Name & DOB verification)',
      'Valid Photo ID (Aadhaar / Voter EPIC / PAN Card)',
      'Active Mobile Number & Personal Email ID (for OTR OTP)',
      'Highest Qualification details (12th / Diploma / Graduation marks & year)',
      'Category Certificate (SC/ST/OBC-NCL/EWS/PwBD if applicable)',
      'Clear Signature on clean white paper',
    ],
    stepsBn:
      '১) প্রথমে ssc.gov.in-এ "Register Now" করে One Time Registration (OTR) সম্পন্ন করুন (আগে করা থাকলে লগইন করুন)। ২) পরীক্ষার নোটিফিকেশনে Apply ক্লিক করে সেন্টার ও যোগ্যতা দিন। ৩) পরিষ্কার 10–20 KB সই আপলোড ও লাইভ ফটো ক্যাপচার করে ₹100 ফি (মহিলা/SC/ST ফ্রি) পে করুন ও ফর্ম প্রিন্ট দিন।',
    stepsEn:
      '1) Complete One-Time Registration (OTR) at ssc.gov.in. 2) Click Apply under active exam notification and choose 3 exam cities. 3) Capture live photo, upload 10–20 KB crisp signature, pay ₹100 (Free for Women/SC/ST), and print confirmation PDF.',
    approxFeeBn: 'সরকারি ফি: ₹১০০ (মহিলা/SC/ST: ফ্রি) | ক্যাফে চার্জ: ₹১০০ – ₹১৫০',
  },
  {
    id: 'rrb-railway',
    category: 'job',
    titleBn: 'রেলওয়ে RRB (NTPC / Group D / ALP / Technician)',
    titleEn: 'Railway RRB Recruitment (NTPC / Group D / ALP)',
    portalName: 'RRB Official Apply Portal (rrbapply.gov.in)',
    portalUrl: 'https://www.rrbapply.gov.in',
    photoSpecBn: '320×240 px (35×45 mm), 30–70 KB JPG (সাদা ব্যাকগ্রাউন্ড, চশমা ছাড়া স্পষ্ট মুখ)',
    photoSpecEn: '320×240 px minimum, 30–70 KB JPG (plain white background, without glasses)',
    signSpecBn: '140×60 px (50×20 mm), 30–70 KB JPG (রানিং হ্যান্ড রাইটিং — সব ক্যাপিটাল অক্ষর নয়)',
    signSpecEn: '140×60 px (50×20 mm), 30–70 KB JPG (running hand signature, NOT all capitals)',
    quickToolIds: ['passport-size-photo', 'resize-image', 'image-compress'],
    requiredDocsBn: [
      'রঙিন পাসপোর্ট সাইজ ছবি (সাদা ব্যাকগ্রাউন্ড, 30–70 KB)',
      'সাদা কাগজে রানিং হ্যান্ড স্বাক্ষর (30–70 KB, সব বড় হাতের অক্ষর হলে রিজেক্ট হবে)',
      'মাধ্যমিক / 10th পাসের মার্কশিট ও রোল নম্বর',
      'ITI / ডিপ্লোমা / গ্র্যাজুয়েশন সার্টিফিকেট (পোস্ট অনুযায়ী)',
      'নিজস্ব ব্যাংক অ্যাকাউন্ট নম্বর ও IFSC (CBT-1 পরীক্ষার পর ফি রিফান্ডের জন্য)',
      'SC/ST/OBC/EWS বা EBC ইনকাম সার্টিফিকেট (ফি ছাড়ের জন্য)',
    ],
    requiredDocsEn: [
      'Recent color passport photo on plain white background (30–70 KB)',
      'Signature in running handwriting (30–70 KB — all caps NOT accepted)',
      '10th Board Marksheet, Roll No. & Passing Year',
      'ITI / Diploma / Degree Marksheet as per post',
      'Applicant Bank Account & IFSC (mandatory for post-exam fee refund)',
      'Caste / EBC / Income Certificate (for fee concession if opted)',
    ],
    stepsBn:
      '১) rrbapply.gov.in-এ মোবাইল ও ইমেইল OTP দিয়ে Create Account করুন ও Aadhaar Verify করুন। ২) নির্দিষ্ট RRB জোন (যেমন RRB Kolkata/Malda) বেছে নিয়ে পোস্ট প্রেফারেন্স সাজান। ৩) ফটো ও সই 30–70 KB করে আপলোড করুন, ফি পেমেন্ট (UR ₹500 / SC-ST-Female ₹250) করে প্রিন্ট নিন।',
    stepsEn:
      '1) Create account on rrbapply.gov.in using mobile/email OTP and verify Aadhaar. 2) Select RRB zone (Kolkata/Malda/Siliguri) and set post preferences. 3) Upload 30–70 KB photo & signature, enter refund bank details, pay exam fee, and print slip.',
    approxFeeBn: 'সরকারি ফি: ₹৫০০ (রিফান্ডযোগ্য ₹৪০০) / SC-ST-মহিলা ₹২৫০ | ক্যাফে চার্জ: ₹১০০ – ₹১৫০',
  },
  {
    id: 'wbp-kp',
    category: 'job',
    titleBn: 'পশ্চিমবঙ্গ পুলিশ / কলকাতা পুলিশ (WBP / KP Constable & SI)',
    titleEn: 'WB Police / Kolkata Police (Constable & SI)',
    portalName: 'WB Police Recruitment Board (prb.wb.gov.in)',
    portalUrl: 'https://prb.wb.gov.in',
    secondaryPortal: { label: 'WB Police Main Site', url: 'https://wbpolice.gov.in' },
    photoSpecBn: '138×177 px, 10–50 KB JPG (সাদা ব্যাকগ্রাউন্ড, মুখের ৭৫% অংশ স্পষ্ট)',
    photoSpecEn: '138×177 px (3.5×4.5 cm), 10–50 KB JPG (pure white background)',
    signSpecBn: '350×150 px বা 6×2 cm, 10–30 KB JPG (কালো কালির স্পষ্ট সই)',
    signSpecEn: '350×150 px (approx 6×2 cm), 10–30 KB JPG in black ink',
    quickToolIds: ['passport-size-photo', 'resize-image', 'image-compress'],
    requiredDocsBn: [
      'মাধ্যমিক (Madhyamik) অ্যাডমিট ও মার্কশিট (বাংলা/নেপালি ভাষা প্রমাণের জন্য)',
      'সাদা ব্যাকগ্রাউন্ড পাসপোর্ট ছবি (10–50 KB) এবং কালো কালির সই (10–30 KB)',
      'পশ্চিমবঙ্গের স্থায়ী ঠিকানার প্রমাণ (আধার/ভোটার কার্ড)',
      'জাতিগত শংসাপত্র (SC/ST/OBC-A/OBC-B — পশ্চিমবঙ্গ থেকে প্রাপ্ত)',
      'উচ্চমাধ্যমিক বা স্নাতক মার্কশিট (SI বা সাব-ইন্সপেক্টর পদের জন্য)',
      'সিভিক ভলান্টিয়ার / NVF / স্পোর্টস সার্টিফিকেট (যদি প্রযোজ্য হয়)',
    ],
    requiredDocsEn: [
      'Madhyamik (10th) Admit Card & Marksheet (proof of age & Bengali/Nepali language)',
      'White-BG Photo (10–50 KB) & Black-Ink Signature (10–30 KB)',
      'Permanent West Bengal Address ID (Aadhaar / Voter)',
      'WB-issued SC / ST / OBC-A / OBC-B Certificate (if applicable)',
      'HS / Graduation Marksheet (for SI / higher posts)',
      'Civic Volunteer / Ex-Serviceman / Meritorious Sports certificate if applicable',
    ],
    stepsBn:
      '১) prb.wb.gov.in-এ গিয়ে নতুন অ্যাকাউন্ট তৈরি করে OTP ভেরিফাই করুন। ২) ব্যক্তিগত তথ্য, স্থায়ী/বর্তমান ঠিকানা ও মাধ্যমিক পাসের বিবরণ পূরণ করুন। ৩) 10–50 KB ছবি এবং 10–30 KB সই আপলোড করে Sahaj Mitr / UPI গেটওয়ে দিয়ে ফি পে করুন ও Serial No. যুক্ত ফর্ম প্রিন্ট দিন।',
    stepsEn:
      '1) Sign up on prb.wb.gov.in with mobile & email OTP. 2) Fill personal, permanent address, and Madhyamik board details carefully. 3) Upload 10–50 KB photo & 10–30 KB sign, pay fee via UPI/Netbanking, and print application slip.',
    approxFeeBn: 'সরকারি ফি: ₹১৭০ (SC/ST ₹২০ প্রসেসিং) | ক্যাফে চার্জ: ₹১০০',
  },
  {
    id: 'wbpsc',
    category: 'job',
    titleBn: 'WBPSC (WBCS / Clerkship / Miscellaneous / Food SI)',
    titleEn: 'WBPSC Exams (WBCS / Clerkship / Misc / Food SI)',
    portalName: 'WBPSC Official Portal (psc.wb.gov.in)',
    portalUrl: 'https://psc.wb.gov.in',
    photoSpecBn: '138×177 px, 20–100 KB JPG (সাদা ব্যাকগ্রাউন্ড)',
    photoSpecEn: '138×177 px, 20–100 KB JPG (plain white background)',
    signSpecBn: '140×60 থেকে 300×120 px, 10–50 KB JPG',
    signSpecEn: '6×2 cm rectangular box, 10–50 KB JPG',
    quickToolIds: ['passport-size-photo', 'image-compress', 'age-land-calculator'],
    requiredDocsBn: [
      'মাধ্যমিক, উচ্চমাধ্যমিক ও গ্র্যাজুয়েশন মার্কশিট ও সার্টিফিকেট',
      'পাসপোর্ট ছবি (20–100 KB) ও কালো কালির সই (10–50 KB)',
      'আধার কার্ড / ভোটার কার্ড / পাসপোর্ট (Photo ID নম্বর)',
      'কাস্ট সার্টিফিকেট (SC/ST/OBC issuing date & authority সহ)',
      'বয়স যাচাই (Age Calculator দিয়ে পদের কাট-অফ ডেট মিলিয়ে নিন)',
    ],
    requiredDocsEn: [
      '10th, 12th, and Graduation Marksheets & Certificates',
      'Passport Photo (20–100 KB) & Signature (10–50 KB)',
      'Photo ID Proof (Aadhaar / Voter / PAN / Passport)',
      'Caste Certificate with issue date & issuing authority (SDO/DM)',
      'Check exact Cut-off Age before submission',
    ],
    stepsBn:
      '১) psc.wb.gov.in-এ One Time Registration করে এনরোলমেন্ট আইডি নিন। ২) Dashboard থেকে নির্দিষ্ট পরীক্ষার Apply ক্লিক করুন ও একাডেমিক ডিটেইলস দিন। ৩) 20–100 KB ছবি ও সই আপলোড করে ফি (₹১১০–₹২১০ + গেটওয়ে চার্জ) পেমেন্ট করে চূড়ান্ত PDF ডাউনলোড করুন।',
    stepsEn:
      '1) Complete One-Time Registration at psc.wb.gov.in to generate Enrollment ID. 2) Select active exam, verify academic records, upload photo/sign, pay fee, and download submitted PDF.',
    approxFeeBn: 'সরকারি ফি: ₹১১০ – ₹২১০ (SC/ST ফ্রি) | ক্যাফে চার্জ: ₹১০০ – ₹১২০',
  },
  {
    id: 'pan-nsdl',
    category: 'identity',
    titleBn: 'নতুন প্যান কার্ড / সংশোধন (NSDL Protean & UTIITSL)',
    titleEn: 'New PAN Card / Correction (Form 49A / CSF)',
    portalName: 'NSDL Protean PAN Portal',
    portalUrl: 'https://www.onlineservices.nsdl.com/paam/endUserRegisterContact.html',
    secondaryPortal: { label: 'UTIITSL PAN Portal', url: 'https://www.pan.utiitsl.com' },
    photoSpecBn: '213×213 px @ 200 DPI (3.5×2.5 cm), সর্বোচ্চ 50 KB JPG',
    photoSpecEn: '213×213 px @ 200 DPI, Max 50 KB JPG',
    signSpecBn: '400×200 px (4.5×2.0 cm), সর্বোচ্চ 50 KB JPG (সাদা কাগজে)',
    signSpecEn: '400×200 px (wide box), Max 50 KB JPG',
    quickToolIds: ['resize-image', 'image-compress', 'image-to-pdf'],
    requiredDocsBn: [
      'আবেদনকারীর আধার কার্ড (নাম ও জন্মতারিখ ফর্মের সাথে হুবহু এক থাকতে হবে)',
      '২ কপি সদ্য তোলা রঙিন পাসপোর্ট ছবি (ডিজিটালের জন্য 213×213 px)',
      'সাদা কাগজে পরিষ্কার স্বাক্ষর (400×200 px < 50 KB)',
      'সংশোধনের ক্ষেত্রে পুরনো প্যান কার্ডের কপি ও নামের প্রমাণের ডকুমেন্ট (PDF <= 300 KB)',
      'মাইনর প্যান (১৮ বছরের নিচে) হলে পিতা বা মাতার আধার ও সই',
    ],
    requiredDocsEn: [
      'Aadhaar Card (Name & DOB must match exactly for e-KYC/e-Sign)',
      '2 Color Passport Photos (or 213×213 px < 50 KB for e-Sign scan upload)',
      'Signature on white paper (400×200 px < 50 KB)',
      'Copy of existing PAN + supporting proof PDF (< 300 KB) for corrections',
      'Parent/Representative Aadhaar & sign for Minor PAN (<18 yrs)',
    ],
    stepsBn:
      '১) e-KYC (OTP/Biometric) হলে আধারের ছবি ও ঠিকানা সরাসরি চলে আসে এবং ১–৩ দিনে ই-প্যান মেইলে আসে (ডকুমেন্ট স্ক্যান লাগলে "Submit Scanned Images via e-Sign" বেছে 213×213 ছবি ও 400×200 সই আপলোড করুন)। ২) ₹১০৭ ফি পেমেন্ট করে Aadhaar OTP দিয়ে e-Sign সম্পন্ন করুন ও রসিদ প্রিন্ট দিন।',
    stepsEn:
      '1) Choose Form 49A (New) or CSF (Correction). For instant e-PAN select Aadhaar e-KYC, or choose "Submit Scanned Images via e-Sign" to upload custom 213×213 photo & 400×200 signature. 2) Pay ₹107, sign via Aadhaar OTP, and print receipt.',
    approxFeeBn: 'সরকারি ফি: ₹১০৭ (e-Sign) | ক্যাফে চার্জ: ₹১৫০ – ₹২০০',
  },
  {
    id: 'wb-ration-card',
    category: 'welfare',
    titleBn: 'ডিজিটাল রেশন কার্ড (নতুন / সংশোধন / ট্রান্সফার / ডাউনলোড)',
    titleEn: 'WB Digital Ration Card (Form 3, 4, 5, 6, 8, 14)',
    portalName: 'Food & Supplies Dept WB (food.wb.gov.in)',
    portalUrl: 'https://food.wb.gov.in',
    photoSpecBn: 'ফটো প্রয়োজন হয় না; সমস্ত ডকুমেন্ট PDF/JPG হিসেবে < 500 KB বা 1 MB',
    photoSpecEn: 'No photo upload needed; scanned proof PDF/JPG under 500 KB – 1 MB',
    signSpecBn: 'প্রযোজ্য ক্ষেত্রে ফর্ম ও প্রমাণপত্র স্বাক্ষরিত PDF',
    signSpecEn: 'Signed supporting document PDF if offline verification needed',
    quickToolIds: ['pdf-compress', 'image-to-pdf', 'doc-scanner-cleaner'],
    requiredDocsBn: [
      'পরিবারের প্রধানের ডিজিটাল রেশন কার্ড (মোবাইল নম্বর লিঙ্ক করা থাকতে হবে OTP-র জন্য)',
      'সদস্যের আধার কার্ড (নতুন বা সংশোধনের জন্য)',
      'শিশু (৫ বছরের কম) হলে জন্ম সার্টিফিকেট (Birth Certificate PDF)',
      'বিবাহের পর ট্রান্সফার (Form 14) হলে ম্যারেজ সার্টিফিকেট বা পঞ্চায়েত/কাউন্সিলর সার্টিফিকেট',
      'মৃত ব্যক্তির নাম বাদ (Form 7) দিতে হলে ডেথ সার্টিফিকেট',
    ],
    requiredDocsEn: [
      'Head of Family Ration Card (Aadhaar/Mobile linked for OTP login)',
      'Applicant Aadhaar Card',
      'Birth Certificate for new minor addition (Form 4)',
      'Marriage Certificate or local body proof for spouse transfer (Form 14)',
      'Death Certificate for deletion (Form 7)',
    ],
    stepsBn:
      '১) food.wb.gov.in → Citizen Home → Ration Card সংক্রান্ত নির্দিষ্ট ফর্ম (Form 4 নতুন সদস্য, Form 5 নাম/ঠিকানা সংশোধন, Form 6 ডিলার বদল, Form 14 বিবাহ ট্রান্সফার) খুলুন। ২) পরিবারের সচল কার্ড নম্বরে OTP দিয়ে লগইন করে তথ্য ও ডকুমেন্ট PDF আপলোড করুন।',
    stepsEn:
      '1) Visit food.wb.gov.in → Citizen Home and pick the matching form (Form 4 New Member, Form 5 Correction, Form 6 Dealer Change, Form 14 Marriage Transfer). 2) Verify mobile OTP, fill details, upload proof PDFs, and print receipt.',
    approxFeeBn: 'সরকারি ফি: ₹০ (ফ্রি) | ক্যাফে চার্জ: ₹৩০ – ₹৫০',
  },
  {
    id: 'wb-caste-cert',
    category: 'welfare',
    titleBn: 'জাতিগত শংসাপত্র (SC / ST / OBC Certificate — West Bengal)',
    titleEn: 'West Bengal Caste Certificate (SC / ST / OBC)',
    portalName: 'Backward Classes Welfare Dept WB',
    portalUrl: 'https://castcertificatewb.gov.in',
    photoSpecBn: 'পাসপোর্ট ছবি (প্রিন্টেড অ্যাপ্লিকেশন ও অফিসে জমা দেওয়ার জন্য ২ কপি)',
    photoSpecEn: 'Passport size color photo (2 copies for physical dossier)',
    signSpecBn: 'আবেদনপত্রে ও বংশতালিকা হলফনামায় (Form 3/17) সই',
    signSpecEn: 'Applicant signature on printed form + Genealogy Declaration',
    quickToolIds: ['wb-caste-genealogy', 'caste-affidavit-form3', 'doc-scanner-cleaner'],
    requiredDocsBn: [
      'আবেদনকারীর আধার কার্ড, ভোটার কার্ড / মাধ্যমিক অ্যাডমিট বা জন্ম সার্টিফিকেট',
      'রক্তের সম্পর্কের (পিতা/কাকা/জ্যাঠা/পিসতুতো ভাই) কাস্ট সার্টিফিকেট + ১ কপি জেরক্স',
      'পারিবারিক বংশতালিকা ও স্ব-ঘোষণাপত্র (Form-3 / Form-17)',
      'জমির পরচা / দলিল বা ১৯৫০ সালের পূর্বের বসবাসের প্রমাণপত্র (প্রযোজ্য হলে)',
      'প্রধান / মিউনিসিপ্যালিটি কাউন্সিলর / BDO দ্বারা প্রদত্ত স্থায়ী বাসিন্দা ও জাতিগত প্রত্যয়নপত্র',
      'OBC হলে পিতার আয়ের প্রমাণপত্র (Income Certificate)',
    ],
    requiredDocsEn: [
      'Aadhaar, Birth Certificate / 10th Admit, Voter ID (or parent Voter ID if minor)',
      'Blood relative (Father/Uncle/Paternal Cousin) existing Caste Certificate',
      'Genealogy Family Tree Chart & Self-Declaration (Form-3 / Form-17)',
      'Land Record (Porcha/Deed) or pre-1950 residence proof if no blood relative cert exists',
      'Local Panchayat / Councillor Residential & Caste Recommendation',
      'Father Income Certificate (required for OBC Creamy Layer check)',
    ],
    stepsBn:
      '১) castcertificatewb.gov.in-এ "Apply for SC/ST/OBC" ফর্ম অনলাইনে পূরণ করে Application + Acknowledgement প্রিন্ট দিন। ২) সাথে PC Tool থেকে বংশতালিকাসহ বাংলা/ইংরেজি ফর্ম প্রিন্ট দিন। ৩) সমস্ত জেরক্সসহ BDO / SDO অফিসে শুনানির তারিখে জমা দিলে অনুমোদনের পর ডিজিটাল সার্টিফিকেট ডাউনলোড হবে।',
    stepsEn:
      '1) Fill online application at castcertificatewb.gov.in and print Application + Acknowledgement. 2) Attach PC Tool Genealogy Tree & Form-3/17 printout plus local verification. 3) Submit physical bundle at BDO/SDO on hearing date to get digital certificate.',
    approxFeeBn: 'সরকারি ফি: ₹০ | ক্যাফে চার্জ (অনলাইন + ফ্যামিলি ট্রি প্রিন্ট): ₹১০০ – ₹১৫০',
  },
  {
    id: 'svmcm',
    category: 'education',
    titleBn: 'স্বামী বিবেকানন্দ স্কলারশিপ (SVMCM / Bikash Bhavan)',
    titleEn: 'SVMCM Scholarship (West Bengal Higher Education)',
    portalName: 'SVMCM Portal (svmcm.wbhed.gov.in)',
    portalUrl: 'https://svmcm.wbhed.gov.in',
    photoSpecBn: 'পাসপোর্ট ছবি — 20–50 KB JPG/JPEG',
    photoSpecEn: 'Passport Photo — 20–50 KB JPG/JPEG',
    signSpecBn: 'স্বাক্ষর — 10–20 KB JPG/JPEG',
    signSpecEn: 'Signature — 10–20 KB JPG/JPEG',
    quickToolIds: ['image-compress', 'pdf-compress', 'pdf-merge'],
    requiredDocsBn: [
      'শেষ পরীক্ষার মার্কশিট (দুই দিক স্ক্যান করা একসাথে PDF <= 400 KB, ৬০%+ নম্বর)',
      'মাধ্যমিকের অ্যাডমিট কার্ড / মার্কশিট (PDF <= 400 KB)',
      'আয় শংসাপত্র — BDO / SDO / Municipality Gazetted Officer কর্তৃক (বার্ষিক আয় ২.৫ লক্ষের কম)',
      'বর্তমান স্কুল/কলেজে ভর্তির রসিদ (Admission Receipt PDF <= 400 KB)',
      'ব্যাংকের পাসবইয়ের প্রথম পাতা (আধার লিঙ্ক ও IFSC স্পষ্ট PDF <= 400 KB)',
      'আধার / ভোটার / রেশন কার্ড স্ক্যান ও চালু মোবাইল নম্বর + ইমেইল',
    ],
    requiredDocsEn: [
      'Last Qualifying Exam Marksheet (Both sides merged in 1 PDF <= 400 KB, 60%+ marks)',
      'Madhyamik Admit / Marksheet (PDF <= 400 KB)',
      'Annual Family Income Certificate (< ₹2.5 Lakh) from BDO/SDO/Municipality Officer',
      'Current Institute Admission Receipt (PDF <= 400 KB)',
      'Bank Passbook First Page with IFSC & Account No. (PDF <= 400 KB)',
      'Aadhaar / Domicile ID Scan & Active Mobile/Email',
    ],
    stepsBn:
      '১) svmcm.wbhed.gov.in-এ রেজিস্ট্রেশন করে Applicant ID ও পাসওয়ার্ড তৈরি করুন। ২) লগইন করে ফটো-সই (20–50KB / 10–20KB) ও মার্কশিটের দুই দিক এক PDF-এ মার্জ ও কমপ্রেস (<=400KB) করে আপলোড করুন। ৩) কনফার্মেশন প্রিন্ট দিয়ে কাস্টমারকে স্কুল/কলেজে ভেরিফিকেশনের জন্য জমা দিতে বলুন।',
    stepsEn:
      '1) Register at svmcm.wbhed.gov.in to generate Applicant ID. 2) Upload 20–50KB photo, 10–20KB sign, and merge+compress marksheet & passbook PDFs under 400 KB. 3) Submit & print slip for Head of Institution (HOI) verification.',
    approxFeeBn: 'সরকারি ফি: ₹০ | ক্যাফে চার্জ: ₹৮০ – ₹১২০',
  },
  {
    id: 'lakshmir-bhandar',
    category: 'welfare',
    titleBn: 'লক্ষ্মীর ভাণ্ডার ও স্বাস্থ্যসাথী (Duare Sarkar / WB Welfare)',
    titleEn: 'Lakshmir Bhandar & Swasthya Sathi Form Check',
    portalName: 'Lakshmir Bhandar Official Portal',
    portalUrl: 'https://socialsecurity.wb.gov.in',
    secondaryPortal: { label: 'Swasthya Sathi Portal', url: 'https://swasthyasathi.gov.in' },
    photoSpecBn: '২ কপি রঙিন পাসপোর্ট সাইজ ছবি (ফর্মে আঠা দিয়ে লাগানোর জন্য)',
    photoSpecEn: '2 Passport Color Photos pasted onto physical Duare Sarkar Form',
    signSpecBn: 'ফর্মে ও স্ব-ঘোষণাপত্রে আবেদনকারীর সই বা টিপসই',
    signSpecEn: 'Applicant Signature / Thumb impression on form & Self-Declaration',
    quickToolIds: ['wb-lakshmir-bhandar', 'passport-size-photo', 'wb-status-hub'],
    requiredDocsBn: [
      'স্বাস্থ্যসাথী কার্ডের উভয় দিকের পরিষ্কার জেরক্স (আবেদনকারীর নাম যুক্ত)',
      'আধার কার্ডের জেরক্স (মোবাইল নম্বর লিঙ্ক থাকলে ভালো)',
      'আবেদনকারীর নিজস্ব সিঙ্গেল ব্যাংক অ্যাকাউন্ট পাসবইয়ের জেরক্স (Joint Account চলবে না)',
      'SC / ST হলে জাতিগত শংসাপত্রের জেরক্স (মাসিক ₹১,২০০; সাধারণ ₹১,০০০)',
      '২ কপি পাসপোর্ট সাইজ ছবি ও বাংলা স্ব-ঘোষণাপত্র',
    ],
    requiredDocsEn: [
      'Swasthya Sathi Card photocopy (applicant name must appear on card)',
      'Aadhaar Card photocopy (25–60 years age eligibility)',
      'Single-holder Bank Account Passbook photocopy with Aadhaar seeded (DBT)',
      'SC/ST Certificate copy (₹1,200/mo for SC/ST, ₹1,000/mo for others)',
      '2 Passport Photos & Signed Self-Declaration',
    ],
    stepsBn:
      '১) আবেদনকারীর বয়স ২৫ থেকে ৬০ বছরের মধ্যে এবং নিজের সিঙ্গেল ব্যাংক অ্যাকাউন্ট আধারের সাথে DBT/NPCI লিঙ্ক আছে কি না যাচাই করুন। ২) PC Tool-এর "লক্ষ্মীর ভাণ্ডার বাংলা ফর্ম"-এ তথ্য ভরে প্রিন্ট দিন ও সমস্ত জেরক্স পিন করে দুয়ারে সরকার ক্যাম্প বা BDO অফিসে জমা দিতে বলুন।',
    stepsEn:
      '1) Verify age (25–60 yrs) and single-holder Aadhaar-seeded bank account. 2) Print PC Tool WB Lakshmir Bhandar Self-Declaration, attach copies + 2 photos, and submit at Duare Sarkar camp / BDO office.',
    approxFeeBn: 'সরকারি ফি: ₹০ | ক্যাফে চার্জ (ফর্ম + প্রিন্ট + জেরক্স): ₹৪০ – ₹৬০',
  },
  {
    id: 'voter-new-correction',
    category: 'identity',
    titleBn: 'ভোটার কার্ড (নতুন Form 6 / সংশোধন Form 8 / ডাউনলোড)',
    titleEn: 'Voter ID (New Form 6 / Correction Form 8 / e-EPIC)',
    portalName: 'ECI Voters Service Portal (voters.eci.gov.in)',
    portalUrl: 'https://voters.eci.gov.in',
    photoSpecBn: '200×200 থেকে 500×500 px রঙিন ছবি (< 2 MB, সাদা ব্যাকগ্রাউন্ড)',
    photoSpecEn: '200×200+ px Color Passport Photo (< 2 MB, white background)',
    signSpecBn: 'প্রয়োজন নেই (ফর্ম অনলাইন সাবমিট হয়)',
    signSpecEn: 'Not mandatory for online Voters portal submission',
    quickToolIds: ['passport-size-photo', 'voter-cropper', 'image-compress'],
    requiredDocsBn: [
      'বয়সের প্রমাণ (জন্ম সার্টিফিকেট / মাধ্যমিক অ্যাডমিট / আধার / প্যান — ১টি)',
      'ঠিকানার প্রমাণ (আধার / ডিজিটাল রেশন কার্ড / ইলেকট্রিক বিল / গ্যাস বিল / ব্যাংক পাসবই)',
      '১ কপি রঙিন পাসপোর্ট ছবি (Form 6 এবং ছবির পরিবর্তনের জন্য)',
      'পরিবারের কোনো সদস্যের (মা/বাবা/স্বামী) ভোটার কার্ড নম্বর (রক্তের সম্পর্ক ম্যাপ করতে)',
      'সংশোধনের (Form 8) ক্ষেত্রে পুরনো ভোটার (EPIC) নম্বর ও সঠিক তথ্যের প্রমাণপত্র',
    ],
    requiredDocsEn: [
      'Age Proof (Birth Cert / 10th Admit / Aadhaar / PAN / Passport)',
      'Address Proof (Aadhaar / Ration Card / Electricity Bill / Bank Passbook)',
      'Recent Color Passport Photo (white background)',
      'Relative (Father/Mother/Husband) existing EPIC No. for electoral mapping',
      'Existing EPIC No. & proof for Form 8 Correction / Transfer',
    ],
    stepsBn:
      '১) voters.eci.gov.in-এ মোবাইল নম্বর দিয়ে সাইন-আপ ও লগইন করুন। ২) নতুন ভোটারের জন্য Form 6 এবং সংশোধন/ট্রান্সফার/আধার লিঙ্কের জন্য Form 8 খুলুন। ৩) ডকুমেন্ট ও ছবি (<2MB) আপলোড করে সাবমিট করুন এবং Reference ID প্রিন্ট দিন।',
    stepsEn:
      '1) Sign up / log in on voters.eci.gov.in with mobile OTP. 2) Select Form 6 (New Voter) or Form 8 (Correction / Shifting / Aadhaar Link). 3) Upload photo & proof docs, submit, and print Reference ID.',
    approxFeeBn: 'সরকারি ফি: ₹০ | ক্যাফে চার্জ: ₹৪০ – ₹৮০',
  },
  {
    id: 'passport-india',
    category: 'identity',
    titleBn: 'নতুন পাসপোর্ট / রিনিউয়াল (Passport Seva India)',
    titleEn: 'Indian Passport (Fresh / Re-issue Application)',
    portalName: 'Passport Seva Official (passportindia.gov.in)',
    portalUrl: 'https://www.passportindia.gov.in',
    photoSpecBn: 'অনলাইন ফর্মে ছবি আপলোড লাগে না; PSK-তে লাইভ ফটো তোলা হয় (তবুও ২ কপি ছবি সাথে রাখবেন)',
    photoSpecEn: 'Live photo clicked at PSK center (keep 2 white-BG 2×2 in photos handy)',
    signSpecBn: 'PSK বায়োমেট্রিকে ডিজিটাল সই নেওয়া হয়',
    signSpecEn: 'Digital signature captured live at PSK',
    quickToolIds: ['passport-size-photo', 'wb-status-hub', 'doc-scanner-cleaner'],
    requiredDocsBn: [
      'জন্মতারিখের প্রমাণ (মাধ্যমিক অ্যাডমিট / জন্ম সার্টিফিকেট / আধার)',
      'ঠিকানার প্রমাণ (আধার + ভোটার কার্ড / ব্যাংক পাসবই / ইলেকট্রিক বিল)',
      'প্যান কার্ড (সাপোর্টিং আইডি হিসেবে সাথে রাখা ভালো)',
      'Non-ECR স্ট্যাম্পের জন্য মাধ্যমিক বা তার বেশি পরীক্ষার পাসের সার্টিফিকেট ও মার্কশিট',
      'বিবাহিত হলে স্পাউসের নাম বসাতে ম্যারেজ সার্টিফিকেট বা পাসপোর্ট (প্রযোজ্য হলে)',
      'পুলিশ ভেরিফিকেশনের জন্য ২ জন প্রতিবেশীর নাম ও মোবাইল নম্বর জানা থাকা দরকার',
    ],
    requiredDocsEn: [
      'DOB Proof (10th Admit / Birth Certificate / Aadhaar)',
      'Address Proof (Aadhaar + Voter EPIC / Passbook / Electricity Bill)',
      'PAN Card as secondary identity document',
      '10th or higher pass Marksheet/Certificate for Non-ECR category',
      'Marriage Certificate if spouse name addition is desired',
      'Names & phone numbers of 2 references for Police Verification',
    ],
    stepsBn:
      '১) passportindia.gov.in-এ রেজিস্ট্রেশন করে RPO (Kolkata) বাছুন এবং Fresh/Re-issue ফর্ম পূরণ করুন। ২) ₹১,৫০০ (Normal 36 pages) অনলাইনে পেমেন্ট করে কাছাকাছি PSK / POPSK সেন্টারের অ্যাপয়েন্টমেন্ট ডেট বুক করুন ও Receipt প্রিন্ট দিন।',
    stepsEn:
      '1) Register at passportindia.gov.in, pick RPO Kolkata, and fill Fresh/Re-issue Passport form. 2) Pay ₹1,500 online, book nearest PSK/POPSK appointment slot, and print Appointment Receipt.',
    approxFeeBn: 'সরকারি ফি: ₹১,৫০০ (Normal) / ₹৩,৫০০ (Tatkaal) | ক্যাফে চার্জ: ₹১৫০ – ₹২৫০',
  },
];

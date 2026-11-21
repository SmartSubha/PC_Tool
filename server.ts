import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

dotenv.config();

function getGeminiClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function parseAiJson<T = unknown>(rawText: string): T {
  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  return JSON.parse(cleaned) as T;
}

async function generateFastAiContent(params: {
  contents: unknown;
  systemInstruction: string;
  responseMimeType?: string;
  responseSchema?: unknown;
  useVision?: boolean;
}): Promise<string> {
  const client = getGeminiClient();
  const baseConfig: Record<string, unknown> = {
    systemInstruction: params.systemInstruction,
  };
  if (params.responseMimeType) baseConfig.responseMimeType = params.responseMimeType;
  if (params.responseSchema) baseConfig.responseSchema = params.responseSchema;

  // Primary: gemini-4-hydrogen with ThinkingLevel.LOW for fast 1-4s responses
  // Fallback: gemini-3.1-flash-lite if primary is slow or temporarily overloaded
  const attempts: Array<{ model: string; thinkingLevel?: ThinkingLevel }> = params.useVision
    ? [
        { model: 'gemini-4-hydrogen', thinkingLevel: ThinkingLevel.LOW },
        { model: 'gemini-3.1-flash-lite' },
      ]
    : [
        { model: 'gemini-3.1-flash-lite' },
        { model: 'gemini-4-hydrogen', thinkingLevel: ThinkingLevel.LOW },
      ];

  let lastErr: unknown = null;
  for (const attempt of attempts) {
    try {
      const cfg: Record<string, unknown> = { ...baseConfig };
      if (attempt.thinkingLevel) {
        cfg.thinkingConfig = { thinkingLevel: attempt.thinkingLevel };
      }
      const response = await client.models.generateContent({
        model: attempt.model,
        contents: params.contents as never,
        config: cfg as never,
      });
      const text = (response.text ?? '').trim();
      if (text) return text;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('AI returned an empty response. Please retry.');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(__dirname, '.data');
const DROPS_DIR = path.resolve(DATA_DIR, 'drops');
const INBOX_FILE = path.resolve(DATA_DIR, 'inbox.json');
const SETTINGS_FILE = path.resolve(DATA_DIR, 'settings.json');

// Secret admin password verified strictly on the server (never sent to client bundle).
// Default hash is SHA-256 of the owner's secret password, or override via ADMIN_INBOX_SECRET env var.
const DEFAULT_SECRET_HASH = '55583a65a65d463068f2c1ef361fe97e9bd6a950f92d34b136e54d2aae2c92cb';

export interface InboxMessage {
  id: string;
  type: 'contact' | 'suggestion';
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface SiteAdminSettings {
  shopNotice: string;
  shopNoticeBn: string;
  disabledToolIds: string[];
  updatedAt: string;
}

const DEFAULT_SETTINGS: SiteAdminSettings = {
  shopNotice: '',
  shopNoticeBn: '',
  disabledToolIds: [],
  updatedAt: '',
};

function ensureDataFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(INBOX_FILE)) {
    fs.writeFileSync(INBOX_FILE, JSON.stringify([], null, 2), 'utf8');
  }
  if (!fs.existsSync(SETTINGS_FILE)) {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2), 'utf8');
  }
}

function readMessages(): InboxMessage[] {
  try {
    ensureDataFile();
    const raw = fs.readFileSync(INBOX_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeMessages(items: InboxMessage[]): void {
  ensureDataFile();
  fs.writeFileSync(INBOX_FILE, JSON.stringify(items, null, 2), 'utf8');
}

function readSettings(): SiteAdminSettings {
  try {
    ensureDataFile();
    const raw = fs.readFileSync(SETTINGS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      shopNotice: typeof parsed?.shopNotice === 'string' ? parsed.shopNotice : '',
      shopNoticeBn: typeof parsed?.shopNoticeBn === 'string' ? parsed.shopNoticeBn : '',
      disabledToolIds: Array.isArray(parsed?.disabledToolIds)
        ? parsed.disabledToolIds.filter((x: unknown): x is string => typeof x === 'string')
        : [],
      updatedAt: typeof parsed?.updatedAt === 'string' ? parsed.updatedAt : '',
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function writeSettings(next: SiteAdminSettings): void {
  ensureDataFile();
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(next, null, 2), 'utf8');
}

function verifyAdminPassword(candidate: unknown): boolean {
  if (typeof candidate !== 'string' || !candidate) return false;
  const trimmed = candidate.trim();
  if (process.env.ADMIN_INBOX_SECRET) {
    const a = Buffer.from(trimmed);
    const b = Buffer.from(process.env.ADMIN_INBOX_SECRET.trim());
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }
  const digest = crypto.createHash('sha256').update(trimmed).digest('hex');
  const a = Buffer.from(digest);
  const b = Buffer.from(DEFAULT_SECRET_HASH);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  // Public site display settings (notices / tool visibility)
  app.get('/api/settings', (_req, res) => {
    return res.json(readSettings());
  });

  // Public endpoint for Contact Us & Suggest a Tool submissions
  app.post('/api/messages', (req, res) => {
    const { type, name, email, subject, message } = req.body || {};
    if (
      (type !== 'contact' && type !== 'suggestion') ||
      typeof message !== 'string' ||
      !message.trim()
    ) {
      return res.status(400).json({ error: 'Invalid submission payload' });
    }

    const entry: InboxMessage = {
      id: crypto.randomUUID(),
      type,
      name: typeof name === 'string' && name.trim() ? name.trim().slice(0, 120) : 'Anonymous Visitor',
      email: typeof email === 'string' ? email.trim().slice(0, 160) : '',
      subject:
        typeof subject === 'string' && subject.trim()
          ? subject.trim().slice(0, 160)
          : type === 'suggestion'
          ? 'Tool Suggestion'
          : 'General Inquiry',
      message: message.trim().slice(0, 4000),
      createdAt: new Date().toISOString(),
      read: false,
    };

    const items = readMessages();
    items.unshift(entry);
    writeMessages(items);

    return res.status(201).json({ ok: true, id: entry.id });
  });

  // Protected Admin Mode endpoints (password verified strictly on server)
  app.post('/api/admin/inbox', (req, res) => {
    const { password } = req.body || {};
    if (!verifyAdminPassword(password)) {
      return res.status(401).json({ error: 'Invalid secret password' });
    }
    const items = readMessages();
    const settings = readSettings();
    return res.json({ messages: items, settings });
  });

  app.post('/api/admin/settings', (req, res) => {
    const { password, shopNotice, shopNoticeBn, disabledToolIds } = req.body || {};
    if (!verifyAdminPassword(password)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const next: SiteAdminSettings = {
      shopNotice: typeof shopNotice === 'string' ? shopNotice.trim().slice(0, 300) : '',
      shopNoticeBn: typeof shopNoticeBn === 'string' ? shopNoticeBn.trim().slice(0, 300) : '',
      disabledToolIds: Array.isArray(disabledToolIds)
        ? disabledToolIds.filter((x: unknown): x is string => typeof x === 'string')
        : [],
      updatedAt: new Date().toISOString(),
    };
    writeSettings(next);
    return res.json({ ok: true, settings: next });
  });

  app.patch('/api/admin/inbox/:id', (req, res) => {
    const { password, read } = req.body || {};
    if (!verifyAdminPassword(password)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const items = readMessages();
    const idx = items.findIndex((m) => m.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    items[idx].read = Boolean(read);
    writeMessages(items);
    return res.json({ ok: true });
  });

  app.delete('/api/admin/inbox/:id', (req, res) => {
    const { password } = req.body || {};
    if (!verifyAdminPassword(password)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const items = readMessages().filter((m) => m.id !== req.params.id);
    writeMessages(items);
    return res.json({ ok: true });
  });

  // Server-side AI Visiting Card Designer endpoint using @google/genai
  app.post('/api/ai/visiting-card-style', async (req, res) => {
    const { prompt, orgName, personName, designation } = req.body || {};
    if (typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Please describe the visiting card style you want.' });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'AI API key is not configured on the server. Please check Settings > Secrets.',
      });
    }

    try {
      const userPrompt = [
        `Design an executive, official, print-ready visiting card configuration.`,
        `User Request: ${prompt.trim().slice(0, 500)}`,
        orgName ? `Organization: ${String(orgName).slice(0, 120)}` : '',
        personName ? `Person: ${String(personName).slice(0, 100)}` : '',
        designation ? `Role/Designation: ${String(designation).slice(0, 100)}` : '',
        `Choose a balanced high-contrast palette (WCAG AA legible text on surfaceColor), appropriate official template layout, crisp tagline (<= 55 chars), fontStyle, and optimal logo coordinates (logoX between 6 and 86, logoY between 10 and 78, logoSize between 42 and 92).`,
      ]
        .filter(Boolean)
        .join('\n');

      const rawText = await generateFastAiContent({
        contents: userPrompt,
        systemInstruction:
          'You are a senior corporate identity and print graphic designer specializing in executive Indian & international business visiting cards. Always output valid 6-digit hex colors with strong contrast between surfaceColor and textColor.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            template: {
              type: Type.STRING,
              enum: [
                'executive-navy',
                'obsidian-gold',
                'minimal-editorial',
                'emerald-corporate',
                'crimson-accent',
                'split-architect',
              ],
            },
            primaryColor: { type: Type.STRING, description: '6-digit hex color e.g. #0f172a' },
            accentColor: { type: Type.STRING, description: '6-digit hex accent color e.g. #d97706' },
            surfaceColor: { type: Type.STRING, description: '6-digit hex card background color' },
            textColor: { type: Type.STRING, description: '6-digit hex main text color contrasting with surfaceColor' },
            fontStyle: { type: Type.STRING, enum: ['sans', 'serif', 'mono'] },
            tagline: { type: Type.STRING, description: 'Short professional business tagline, max 55 characters' },
            logoX: { type: Type.NUMBER, description: 'Logo horizontal percentage position 6 to 86' },
            logoY: { type: Type.NUMBER, description: 'Logo vertical percentage position 10 to 78' },
            logoSize: { type: Type.NUMBER, description: 'Logo display size in pixels 42 to 92' },
            designNote: { type: Type.STRING, description: 'Short 1-sentence rationale of the chosen design' },
          },
          required: [
            'template',
            'primaryColor',
            'accentColor',
            'surfaceColor',
            'textColor',
            'fontStyle',
            'tagline',
            'logoX',
            'logoY',
            'logoSize',
            'designNote',
          ],
        },
      });

      const parsed = parseAiJson(rawText);
      return res.json({ ok: true, style: parsed });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'AI design generation failed';
      const status =
        typeof (err as { status?: number })?.status === 'number'
          ? (err as { status: number }).status
          : 500;
      return res.status(status >= 400 && status < 600 ? status : 500).json({ error: message });
    }
  });

  // Server-side AI Bengali Official Polish & Translation endpoint
  app.post('/api/ai/bengali-polish', async (req, res) => {
    const { text, action } = req.body || {};
    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Please enter some text first.' });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'AI API key is not configured on the server. Please check Settings > Secrets.',
      });
    }
    try {
      const modeInstruction =
        action === 'en-to-bn'
          ? 'Translate the following English or Banglish text into formal, official West Bengal Bengali Unicode script suitable for government applications. Output ONLY the final Bengali text without extra commentary.'
          : action === 'bn-to-en'
          ? 'Translate the following Bengali text into clear, formal official English suitable for government documents. Output ONLY the final English text without extra commentary.'
          : 'Correct spelling, conjuncts (যুক্তাক্ষর), punctuation (দাঁড়ি), and polish the following Bengali or Banglish text into crisp, formal official Bengali Unicode script. Output ONLY the corrected Bengali text without extra commentary.';

      const resultText = await generateFastAiContent({
        contents: `${modeInstruction}\n\nText:\n${text.slice(0, 6000)}`,
        systemInstruction:
          'You are an expert Bengali linguistic editor and West Bengal official document writer. Return only the clean polished/translated text.',
      });
      return res.json({ ok: true, resultText });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Bengali AI polish failed';
      const status = typeof (err as { status?: number })?.status === 'number' ? (err as { status: number }).status : 500;
      return res.status(status >= 400 && status < 600 ? status : 500).json({ error: message });
    }
  });

  // Server-side AI Document Auto-Verifier & Name/DOB Mismatch Checker
  app.post('/api/ai/doc-mismatch-check', async (req, res) => {
    const { documents } = req.body || {};
    if (!Array.isArray(documents) || documents.length < 2 || documents.length > 5) {
      return res.status(400).json({ error: 'Please upload between 2 and 5 documents to cross-check.' });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'AI API key is not configured on the server. Please check Settings > Secrets.',
      });
    }
    try {
      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
      documents.forEach((doc: { label?: string; mimeType?: string; data?: string }, idx: number) => {
        const label = typeof doc?.label === 'string' && doc.label.trim() ? doc.label.trim() : `Document ${idx + 1}`;
        parts.push({ text: `--- Document #${idx + 1}: ${label} ---` });
        if (typeof doc?.data === 'string' && typeof doc?.mimeType === 'string') {
          parts.push({
            inlineData: {
              mimeType: doc.mimeType,
              data: doc.data,
            },
          });
        }
      });

      parts.push({
        text: `Carefully inspect ALL uploaded Indian/West Bengal identity or academic documents above.
1. Extract exact visible text for each document: Full Name, Father/Husband/Mother Name, Date of Birth (normalize & also preserve exact printed form), Gender, Address, and ID/Roll Number (mask middle digits of Aadhaar if present as XXXX-XXXX-1234 for safety, or read last 4). If a field is not printed on a document, write "Not Printed".
2. Cross-compare every key field across the documents (Full Name spelling/middle name/order, Father/Guardian Name spelling, Date of Birth day/month/year, Gender, Address).
3. Flag even subtle spelling differences (e.g., "Subha" vs "Suva", "Chatterjee" vs "Chattopadhyay", "01/05/1998" vs "05/01/1998", missing middle name) because Indian government portals reject forms over single-letter mismatches.
4. Provide clear verification advice in both English and Bengali.`,
      });

      const rawText = await generateFastAiContent({
        useVision: true,
        contents: { parts },
        systemInstruction:
          'You are a meticulous Indian Cyber Cafe & CSC document verification officer. Never hallucinate fields not visible in the image; write "Not Printed" when absent. Be strict about spelling and date mismatches.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskLevel: { type: Type.STRING, enum: ['clean', 'minor-warning', 'high-mismatch'] },
            overallVerdictEn: { type: Type.STRING },
            overallVerdictBn: { type: Type.STRING },
            extractedDocs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  docLabel: { type: Type.STRING },
                  detectedType: { type: Type.STRING },
                  fullName: { type: Type.STRING },
                  guardianName: { type: Type.STRING },
                  dob: { type: Type.STRING },
                  gender: { type: Type.STRING },
                  address: { type: Type.STRING },
                  idNumber: { type: Type.STRING },
                },
                required: ['docLabel', 'detectedType', 'fullName', 'guardianName', 'dob', 'gender', 'address', 'idNumber'],
              },
            },
            comparisons: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  field: { type: Type.STRING },
                  status: { type: Type.STRING, enum: ['match', 'mismatch', 'warning', 'not-comparable'] },
                  summaryEn: { type: Type.STRING },
                  summaryBn: { type: Type.STRING },
                },
                required: ['field', 'status', 'summaryEn', 'summaryBn'],
              },
            },
            actionStepsBn: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['riskLevel', 'overallVerdictEn', 'overallVerdictBn', 'extractedDocs', 'comparisons', 'actionStepsBn'],
        },
      });

      return res.json({ ok: true, report: parseAiJson(rawText) });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Document verification failed';
      const status = typeof (err as { status?: number })?.status === 'number' ? (err as { status: number }).status : 500;
      return res.status(status >= 400 && status < 600 ? status : 500).json({ error: message });
    }
  });

  // Server-side AI Handwritten Note & Old Deed OCR + Translator
  app.post('/api/ai/ocr-translate', async (req, res) => {
    const { mimeType, data, mode, docHint } = req.body || {};
    if (typeof data !== 'string' || !data || typeof mimeType !== 'string') {
      return res.status(400).json({ error: 'Please upload a clear image of the document or note.' });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'AI API key is not configured on the server. Please check Settings > Secrets.',
      });
    }
    try {
      const taskPrompt =
        mode === 'ocr-to-bn'
          ? 'Transcribe all handwritten or printed text accurately from this image, and provide a clean, natural formal Bengali Unicode translation.'
          : mode === 'ocr-to-en'
          ? 'Transcribe all handwritten or printed text (including Bengali or Hindi) accurately from this image, and provide a clear formal English translation.'
          : 'Transcribe all handwritten or printed text accurately from this image in its original script (Bengali/English/Hindi), preserving line breaks, headings, dates, and numbers faithfully.';

      const rawText = await generateFastAiContent({
        useVision: true,
        contents: {
          parts: [
            { inlineData: { mimeType, data } },
            {
              text: `${taskPrompt}\nDocument Context Hint: ${String(docHint || 'General Handwritten Note / Deed / Document').slice(0, 140)}`,
            },
          ],
        },
        systemInstruction:
          'You are an expert OCR specialist for Bengali and English handwritten documents, West Bengal land deeds (খতিয়ান/দলিল), applications, and prescriptions. Never invent unreadable words; mark genuinely illegible parts as [অস্পষ্ট / illegible].',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedLanguage: { type: Type.STRING },
            extractedText: { type: Type.STRING, description: 'Exact transcribed text in original script' },
            translatedText: { type: Type.STRING, description: 'Translated text if translation mode requested, otherwise empty string' },
            keyDetails: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Key dates, names, amounts, or plot numbers found in the document',
            },
          },
          required: ['detectedLanguage', 'extractedText', 'translatedText', 'keyDetails'],
        },
      });

      return res.json({ ok: true, result: parseAiJson(rawText) });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'OCR processing failed';
      const status = typeof (err as { status?: number })?.status === 'number' ? (err as { status: number }).status : 500;
      return res.status(status >= 400 && status < 600 ? status : 500).json({ error: message });
    }
  });

  // Server-side AI Official Bengali/English Application & Affidavit Drafter
  app.post('/api/ai/draft-application', async (req, res) => {
    const { topic, language, tone, applicantName, guardianName, address, phone, recipient, details } = req.body || {};
    if (typeof topic !== 'string' || !topic.trim()) {
      return res.status(400).json({ error: 'Please specify the application subject or topic.' });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'AI API key is not configured on the server. Please check Settings > Secrets.',
      });
    }
    try {
      const prompt = [
        `Draft an official, print-ready Indian / West Bengal ${tone === 'affidavit' ? 'Legal Self-Declaration / Affidavit' : 'Formal Government / Bank / Office Application'}.`,
        `Language: ${language === 'bn' ? 'Formal Bengali Unicode (সাধু/প্রমিত দাপ্তরিক বাংলা)' : 'Formal Official English'}.`,
        `Topic / Purpose: ${topic.trim().slice(0, 300)}`,
        recipient ? `Recipient / Authority: ${String(recipient).slice(0, 200)}` : 'Recipient: Use standard blank placeholder line like "___________________________"',
        applicantName ? `Applicant Name: ${String(applicantName).slice(0, 120)}` : 'Applicant Name: Use blank line "______________________"',
        guardianName ? `Father/Husband/Guardian: ${String(guardianName).slice(0, 120)}` : '',
        address ? `Address: ${String(address).slice(0, 250)}` : '',
        phone ? `Mobile: ${String(phone).slice(0, 40)}` : '',
        details ? `Specific Details / Reason: ${String(details).slice(0, 1000)}` : '',
        `Make it respectful, legally accurate, concise enough to fit cleanly on 1 A4 page, with a realistic enclosures checklist.`,
      ]
        .filter(Boolean)
        .join('\n');

      const rawText = await generateFastAiContent({
        contents: prompt,
        systemInstruction:
          'You are a senior West Bengal legal & government documentation drafter. Write authentic, respectful, properly structured official letters and affidavits in standard Bengali or English.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            heading: { type: Type.STRING, description: 'Document top heading (e.g., স্ব-ঘোষণাপত্র or APPLICATION)' },
            recipientLines: { type: Type.ARRAY, items: { type: Type.STRING } },
            subject: { type: Type.STRING },
            salutation: { type: Type.STRING },
            bodyParagraphs: { type: Type.ARRAY, items: { type: Type.STRING } },
            closingText: { type: Type.STRING },
            signatureTitle: { type: Type.STRING },
            enclosures: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['heading', 'recipientLines', 'subject', 'salutation', 'bodyParagraphs', 'closingText', 'signatureTitle', 'enclosures'],
        },
      });

      return res.json({ ok: true, draft: parseAiJson(rawText) });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Draft generation failed';
      const status = typeof (err as { status?: number })?.status === 'number' ? (err as { status: number }).status : 500;
      return res.status(status >= 400 && status < 600 ? status : 500).json({ error: message });
    }
  });

  // Server-side AI ATS Resume / CV Enhancer (Bengali or rough notes -> Professional English CV)
  app.post('/api/ai/resume-enhance', async (req, res) => {
    const { rawNotes, targetRole, fullName } = req.body || {};
    if (typeof rawNotes !== 'string' || !rawNotes.trim()) {
      return res.status(400).json({ error: 'Please write your education, skills, or experience notes (in Bengali or English).' });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'AI API key is not configured on the server. Please check Settings > Secrets.',
      });
    }
    try {
      const prompt = [
        `Convert the following rough candidate notes (which may be in Bengali, Banglish, or simple English) into a sharp, ATS-friendly professional English resume profile.`,
        fullName ? `Candidate Name: ${String(fullName).slice(0, 120)}` : '',
        targetRole ? `Target Role: ${String(targetRole).slice(0, 120)}` : '',
        `Raw Notes:\n${rawNotes.slice(0, 4000)}`,
        `Do not invent fake degrees or fake companies. Polish real details into concise, recruiter-ready English.`,
      ]
        .filter(Boolean)
        .join('\n');

      const rawText = await generateFastAiContent({
        contents: prompt,
        systemInstruction:
          'You are an expert Indian career coach and ATS resume writer. Output structured JSON strictly reflecting the user notes in clean professional English.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING, description: 'Short professional job title / headline' },
            summary: { type: Type.STRING, description: '2-3 sentence crisp ATS career summary' },
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            educationBullets: { type: Type.ARRAY, items: { type: Type.STRING } },
            experienceBullets: { type: Type.ARRAY, items: { type: Type.STRING } },
            languages: { type: Type.STRING },
          },
          required: ['headline', 'summary', 'skills', 'educationBullets', 'experienceBullets', 'languages'],
        },
      });
      return res.json({ ok: true, resume: parseAiJson(rawText) });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Resume enhancement failed';
      const status = typeof (err as { status?: number })?.status === 'number' ? (err as { status: number }).status : 500;
      return res.status(status >= 400 && status < 600 ? status : 500).json({ error: message });
    }
  });

  // Server-side AI Bengali/English Shop Offer & Banner Copy Suggester
  app.post('/api/ai/banner-copy', async (req, res) => {
    const { idea, lang } = req.body || {};
    if (typeof idea !== 'string' || !idea.trim()) {
      return res.status(400).json({ error: 'Please describe your shop offer, festival greeting, or announcement.' });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'AI API key is not configured on the server. Please check Settings > Secrets.',
      });
    }
    try {
      const rawText = await generateFastAiContent({
        contents: `Write punchy, high-converting poster/banner copy in ${lang === 'bn' ? 'vivid Bengali Unicode' : 'crisp English'} for: ${idea.trim().slice(0, 400)}`,
        systemInstruction:
          'You are a creative Indian retail & digital studio ad copywriter. Keep headlines short, bold, and poster-friendly.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            badge: { type: Type.STRING, description: 'Very short top tag max 25 chars' },
            headline: { type: Type.STRING, description: 'Main bold banner headline max 50 chars' },
            subheadline: { type: Type.STRING, description: 'Supporting offer line max 95 chars' },
            ctaLine: { type: Type.STRING, description: 'Short call to action max 45 chars' },
          },
          required: ['badge', 'headline', 'subheadline', 'ctaLine'],
        },
      });
      return res.json({ ok: true, copy: parseAiJson(rawText) });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Banner copy generation failed';
      const status = typeof (err as { status?: number })?.status === 'number' ? (err as { status: number }).status : 500;
      return res.status(status >= 400 && status < 600 ? status : 500).json({ error: message });
    }
  });

  // Zero-Login Mobile-to-PC Temporary QR Drop Sessions (Persisted to .data/drops, Auto-expires in 30 minutes)
  interface DropFileRecord {
    id: string;
    name: string;
    mimeType: string;
    size: number;
    dataBase64: string;
    uploadedAt: string;
  }
  interface DropSession {
    code: string;
    createdAt: number;
    files: DropFileRecord[];
  }
  const DROP_TTL_MS = 30 * 60 * 1000;

  const ensureDropsDir = () => {
    if (!fs.existsSync(DROPS_DIR)) {
      fs.mkdirSync(DROPS_DIR, { recursive: true });
    }
  };

  const sanitizeCode = (raw: unknown): string =>
    String(raw || '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 10);

  const dropSessionPath = (code: string) => path.resolve(DROPS_DIR, `${code}.json`);

  const readDropSession = (code: string): DropSession | null => {
    try {
      ensureDropsDir();
      const file = dropSessionPath(code);
      if (!fs.existsSync(file)) return null;
      const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as DropSession;
      if (!parsed || Date.now() - parsed.createdAt > DROP_TTL_MS) {
        fs.unlinkSync(file);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  };

  const writeDropSession = (sess: DropSession) => {
    ensureDropsDir();
    fs.writeFileSync(dropSessionPath(sess.code), JSON.stringify(sess), 'utf8');
  };

  const deleteDropSession = (code: string) => {
    try {
      const file = dropSessionPath(code);
      if (fs.existsSync(file)) fs.unlinkSync(file);
    } catch {
      // ignore
    }
  };

  const pruneDropSessions = () => {
    try {
      ensureDropsDir();
      const now = Date.now();
      for (const fname of fs.readdirSync(DROPS_DIR)) {
        if (!fname.endsWith('.json')) continue;
        const full = path.join(DROPS_DIR, fname);
        try {
          const stat = fs.statSync(full);
          if (now - stat.mtimeMs > DROP_TTL_MS) {
            fs.unlinkSync(full);
          }
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    }
  };

  app.post('/api/drop/create', (_req, res) => {
    pruneDropSessions();
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[crypto.randomInt(0, chars.length)];
    }
    const sess: DropSession = { code, createdAt: Date.now(), files: [] };
    writeDropSession(sess);
    return res.json({
      ok: true,
      code,
      expiresInSeconds: DROP_TTL_MS / 1000,
      publicBaseUrl: process.env.SHARED_APP_URL || '',
    });
  });

  app.get('/api/drop/:code/status', (req, res) => {
    pruneDropSessions();
    const code = sanitizeCode(req.params.code);
    const sess = code ? readDropSession(code) : null;
    if (!sess) {
      return res.status(404).json({ ok: false, error: 'Session expired or invalid code. Check the 6-digit code on the Counter PC.' });
    }
    const remainingSec = Math.max(0, Math.floor((sess.createdAt + DROP_TTL_MS - Date.now()) / 1000));
    return res.json({
      ok: true,
      code: sess.code,
      fileCount: sess.files.length,
      remainingSec,
    });
  });

  app.get('/api/drop/:code/files', (req, res) => {
    pruneDropSessions();
    const code = sanitizeCode(req.params.code);
    const sess = code ? readDropSession(code) : null;
    if (!sess) {
      return res.status(404).json({ error: 'Session expired or not found. Generate a new QR on the PC.' });
    }
    const remainingSec = Math.max(0, Math.floor((sess.createdAt + DROP_TTL_MS - Date.now()) / 1000));
    return res.json({
      ok: true,
      code: sess.code,
      remainingSec,
      files: sess.files.map((f) => ({
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        size: f.size,
        uploadedAt: f.uploadedAt,
        isImage: f.mimeType.startsWith('image/'),
        previewDataUrl: f.mimeType.startsWith('image/') ? `data:${f.mimeType};base64,${f.dataBase64}` : undefined,
      })),
    });
  });

  app.post('/api/drop/:code/upload', (req, res) => {
    pruneDropSessions();
    const code = sanitizeCode(req.params.code);
    const sess = code ? readDropSession(code) : null;
    if (!sess) {
      return res.status(404).json({ error: 'This counter drop session has expired or closed. Ask the shop for a new code.' });
    }
    if (sess.files.length >= 20) {
      return res.status(400).json({ error: 'Maximum 20 files per session reached. Clear or create a new session on PC.' });
    }
    const { name, mimeType, dataBase64 } = req.body || {};
    if (typeof name !== 'string' || typeof dataBase64 !== 'string' || !dataBase64) {
      return res.status(400).json({ error: 'Invalid file upload payload.' });
    }
    const approxBytes = Math.floor((dataBase64.length * 3) / 4);
    if (approxBytes > 25 * 1024 * 1024) {
      return res.status(413).json({ error: 'Single file limit is 25 MB.' });
    }
    const rec: DropFileRecord = {
      id: crypto.randomUUID(),
      name: name.slice(0, 140),
      mimeType: typeof mimeType === 'string' && mimeType ? mimeType.slice(0, 80) : 'application/octet-stream',
      size: approxBytes,
      dataBase64,
      uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    sess.files.unshift(rec);
    writeDropSession(sess);
    return res.status(201).json({ ok: true, id: rec.id, fileCount: sess.files.length });
  });

  app.get('/api/drop/:code/file/:fileId', (req, res) => {
    pruneDropSessions();
    const code = sanitizeCode(req.params.code);
    const sess = code ? readDropSession(code) : null;
    if (!sess) return res.status(404).send('Session expired');
    const file = sess.files.find((f) => f.id === req.params.fileId);
    if (!file) return res.status(404).send('File not found');
    const buf = Buffer.from(file.dataBase64, 'base64');
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.name.replace(/"/g, '')}"`);
    return res.send(buf);
  });

  app.delete('/api/drop/:code/file/:fileId', (req, res) => {
    const code = sanitizeCode(req.params.code);
    const sess = code ? readDropSession(code) : null;
    if (!sess) return res.status(404).json({ error: 'Session not found' });
    sess.files = sess.files.filter((f) => f.id !== req.params.fileId);
    writeDropSession(sess);
    return res.json({ ok: true, fileCount: sess.files.length });
  });

  app.delete('/api/drop/:code', (req, res) => {
    const code = sanitizeCode(req.params.code);
    if (code) deleteDropSession(code);
    return res.json({ ok: true });
  });

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

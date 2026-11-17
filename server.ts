import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(__dirname, '.data');
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
  app.use(express.json({ limit: '1mb' }));

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

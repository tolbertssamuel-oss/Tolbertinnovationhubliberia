const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'replace-this-secret';
const DATABASE_DIR = path.join(__dirname, 'data');
const DATABASE_PATH = path.join(DATABASE_DIR, 'app.db');

if (!fs.existsSync(DATABASE_DIR)) {
  fs.mkdirSync(DATABASE_DIR, { recursive: true });
}

const db = new sqlite3.Database(DATABASE_PATH);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL DEFAULT 'Student',
      status TEXT NOT NULL DEFAULT 'Active',
      created_at TEXT NOT NULL
    )
  `);
});

app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 8,
    },
  })
);

const rateLimitState = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 5 * 60 * 1000;

const getRateBucket = (key) => {
  const now = Date.now();
  const bucket = rateLimitState.get(key) || [];
  const filtered = bucket.filter((time) => now - time < WINDOW_MS);
  rateLimitState.set(key, filtered);
  return filtered;
};

const isAuthenticated = (req) => Boolean(req.session && req.session.user);

const guardTutorial = (req, res, next) => {
  if (isAuthenticated(req)) {
    return next();
  }

  if (req.path.endsWith('.html')) {
    return res.redirect(`/login.html?redirect=${encodeURIComponent('ielts-toefl.html')}`);
  }

  return res.status(401).json({ error: 'Unauthorized' });
};

app.get('/api/me', (req, res) => {
  if (!isAuthenticated(req)) {
    return res.status(200).json({ authenticated: false });
  }

  return res.status(200).json({ authenticated: true, user: req.session.user });
});

app.post('/api/register', async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const trimmedName = String(name).trim();

  db.get('SELECT id FROM users WHERE email = ?', [normalizedEmail], async (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error.' });
    }

    if (row) {
      return res.status(409).json({ error: 'Email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const createdAt = new Date().toISOString();

    db.run(
      'INSERT INTO users (name, email, password_hash, phone, role, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [trimmedName, normalizedEmail, passwordHash, phone || null, 'Student', 'Active', createdAt],
      function (insertErr) {
        if (insertErr) {
          return res.status(500).json({ error: 'Unable to create account.' });
        }

        return res.status(201).json({ success: true, userId: this.lastID });
      }
    );
  });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  const bucket = getRateBucket(req.ip);
  if (bucket.length >= MAX_ATTEMPTS) {
    return res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
  }

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  db.get(
    'SELECT id, name, email, password_hash, role, status FROM users WHERE email = ?',
    [normalizedEmail],
    async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error.' });
      }

      if (!user) {
        bucket.push(Date.now());
        rateLimitState.set(req.ip, bucket);
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      if (user.status !== 'Active') {
        return res.status(403).json({ error: 'Account is blocked.' });
      }

      const matches = await bcrypt.compare(password, user.password_hash);
      if (!matches) {
        bucket.push(Date.now());
        rateLimitState.set(req.ip, bucket);
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      };

      return res.status(200).json({ success: true });
    }
  );
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.status(200).json({ success: true });
  });
});

app.post('/api/forgot-password', (req, res) => {
  return res.status(200).json({ success: true });
});

app.use('/api/tutorial', guardTutorial, (req, res) => {
  res.status(200).json({ message: 'Protected tutorial content.' });
});

app.get('/ielts-toefl.html', guardTutorial);

app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

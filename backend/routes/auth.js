const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// Ro'yxatdan o'tish
router.post('/register', async (req, res) => {
  const { name, email, password, level = 'beginner' } = req.body;
  try {
    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows[0]) return res.status(400).json({ message: 'Email allaqachon mavjud' });

    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      'INSERT INTO users (name, email, password, level) VALUES ($1, $2, $3, $4) RETURNING id, name, email, level, xp',
      [name, email, hash, level]
    );
    const user = result.rows[0];
    res.status(201).json({ token: generateToken(user.id), user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Kirish
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user || !user.password) return res.status(400).json({ message: "Email yoki parol noto'g'ri" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Email yoki parol noto'g'ri" });

    const { password: _, ...safeUser } = user;
    res.json({ token: generateToken(user.id), user: safeUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Google orqali kirish
router.post('/google', async (req, res) => {
  const { google_id, email, name, avatar_url } = req.body;
  try {
    let result = await pool.query('SELECT * FROM users WHERE google_id = $1 OR email = $2', [google_id, email]);
    let user = result.rows[0];

    if (!user) {
      result = await pool.query(
        'INSERT INTO users (name, email, google_id, avatar_url) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, email, google_id, avatar_url]
      );
      user = result.rows[0];
    } else if (!user.google_id) {
      await pool.query('UPDATE users SET google_id = $1 WHERE id = $2', [google_id, user.id]);
    }

    const { password: _, ...safeUser } = user;
    res.json({ token: generateToken(user.id), user: safeUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Meni olish
router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// Push token saqlash
router.put('/push-token', authMiddleware, async (req, res) => {
  const { push_token } = req.body;
  await pool.query('UPDATE users SET push_token = $1 WHERE id = $2', [push_token, req.user.id]);
  res.json({ message: 'Token saqlandi' });
});

module.exports = router;

const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Asosiy lenta
router.get('/', authMiddleware, async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  try {
    const result = await pool.query(
      `SELECT p.*, u.name, u.avatar_url,
        EXISTS(SELECT 1 FROM likes l WHERE l.photo_id = p.id AND l.user_id = $1) as is_liked
       FROM photos p
       JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );
    res.json({ photos: result.rows, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Obuna bo'lingan odamlarning lentasi
router.get('/following', authMiddleware, async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  try {
    const result = await pool.query(
      `SELECT p.*, u.name, u.avatar_url,
        EXISTS(SELECT 1 FROM likes l WHERE l.photo_id = p.id AND l.user_id = $1) as is_liked
       FROM photos p
       JOIN users u ON p.user_id = u.id
       JOIN follows f ON f.following_id = p.user_id
       WHERE f.follower_id = $1
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );
    res.json({ photos: result.rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Qidiruv
router.get('/search', authMiddleware, async (req, res) => {
  const { q } = req.query;
  try {
    const result = await pool.query(
      `SELECT p.*, u.name, u.avatar_url FROM photos p
       JOIN users u ON p.user_id = u.id
       WHERE p.caption ILIKE $1 OR u.name ILIKE $1
       ORDER BY p.created_at DESC LIMIT 30`,
      [`%${q}%`]
    );
    res.json({ photos: result.rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

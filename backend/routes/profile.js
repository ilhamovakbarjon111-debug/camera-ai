const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const { uploadFile, getFileUrl } = require('../config/appwrite');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// ===== STATIC ROUTES (/:id dan OLDIN) =====

// XP
router.post('/xp', authMiddleware, async (req, res) => {
  const { amount = 10 } = req.body;
  try {
    const r = await pool.query('UPDATE users SET xp = xp + $1 WHERE id = $2 RETURNING xp', [amount, req.user.id]);
    res.json({ xp: r.rows[0].xp });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Challenges
router.get('/challenges', authMiddleware, async (req, res) => {
  try {
    const r = await pool.query('SELECT challenge_id FROM user_challenges WHERE user_id = $1', [req.user.id]);
    res.json({ challenges: r.rows.map(x => x.challenge_id) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/challenges', authMiddleware, async (req, res) => {
  const { challenge_id } = req.body;
  try {
    await pool.query('INSERT INTO user_challenges (user_id, challenge_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.user.id, challenge_id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/challenges', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM user_challenges WHERE user_id = $1', [req.user.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Settings
router.get('/settings', authMiddleware, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM user_settings WHERE user_id = $1', [req.user.id]);
    if (!r.rows[0]) {
      await pool.query('INSERT INTO user_settings (user_id) VALUES ($1)', [req.user.id]);
      return res.json({ settings: { notifications: true, ai_tips: true, private_account: false } });
    }
    res.json({ settings: r.rows[0] });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/settings', authMiddleware, async (req, res) => {
  const { notifications, ai_tips, private_account } = req.body;
  try {
    await pool.query(
      `INSERT INTO user_settings (user_id, notifications, ai_tips, private_account) VALUES ($1,$2,$3,$4)
       ON CONFLICT (user_id) DO UPDATE SET notifications=$2, ai_tips=$3, private_account=$4`,
      [req.user.id, notifications, ai_tips, private_account]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Profil tahrirlash
router.put('/edit', authMiddleware, async (req, res) => {
  const { username, full_name, bio } = req.body;
  try {
    const r = await pool.query(
      'UPDATE users SET username=$1, full_name=$2, bio=$3, name=$1 WHERE id=$4 RETURNING id,name,username,full_name,bio,avatar_url,xp',
      [username, full_name, bio, req.user.id]
    );
    res.json({ user: r.rows[0] });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Parol
router.put('/password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const r = await pool.query('SELECT * FROM users WHERE id=$1', [req.user.id]);
    const user = r.rows[0];
    if (!user.password) return res.status(400).json({ message: 'Google akkaunt parol ishlatmaydi' });
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(400).json({ message: "Joriy parol noto'g'ri" });
    const hash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password=$1 WHERE id=$2', [hash, req.user.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Avatar
router.post('/upload-avatar', authMiddleware, async (req, res) => {
  const { imageBase64, mimeType = 'image/jpeg' } = req.body;
  try {
    const buffer = Buffer.from(imageBase64, 'base64');
    const fileName = `avatar_${req.user.id}_${Date.now()}.jpg`;
    const uploaded = await uploadFile(buffer, fileName, mimeType);
    const avatarUrl = getFileUrl(uploaded.$id);
    await pool.query('UPDATE users SET avatar_url=$1 WHERE id=$2', [avatarUrl, req.user.id]);
    res.json({ avatar_url: avatarUrl });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/avatar', authMiddleware, async (req, res) => {
  const { imageBase64, mimeType = 'image/jpeg' } = req.body;
  try {
    const buffer = Buffer.from(imageBase64, 'base64');
    const uploaded = await uploadFile(buffer, `avatar_${req.user.id}.jpg`, mimeType);
    const avatarUrl = getFileUrl(uploaded.$id);
    await pool.query('UPDATE users SET avatar_url=$1 WHERE id=$2', [avatarUrl, req.user.id]);
    res.json({ avatar_url: avatarUrl });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Me (multipart)
router.put('/me', authMiddleware, upload.single('avatar'), async (req, res) => {
  const { name, bio, level } = req.body;
  try {
    let avatarUrl = req.user.avatar_url;
    if (req.file) {
      const uploaded = await uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype);
      avatarUrl = getFileUrl(uploaded.$id);
    }
    const r = await pool.query(
      'UPDATE users SET name=$1, bio=$2, level=$3, avatar_url=$4, updated_at=NOW() WHERE id=$5 RETURNING id,name,bio,level,avatar_url,xp',
      [name || req.user.name, bio, level || req.user.level, avatarUrl, req.user.id]
    );
    res.json({ user: r.rows[0] });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Hisob o'chirish
router.delete('/account', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id=$1', [req.user.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Photo
router.delete('/photo/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM photos WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/photo/:id', authMiddleware, async (req, res) => {
  const { caption } = req.body;
  try {
    await pool.query('UPDATE photos SET caption=$1 WHERE id=$2 AND user_id=$3', [caption, req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ===== DYNAMIC ROUTES (/:id eng oxirda) =====

// Profilni olish
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const user = await pool.query(
      `SELECT id, name, email, avatar_url, bio, level, xp, username, full_name,
        (SELECT COUNT(*) FROM photos WHERE user_id=$1) as photos_count,
        (SELECT COUNT(*) FROM follows WHERE following_id=$1) as followers_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id=$1) as following_count,
        EXISTS(SELECT 1 FROM follows WHERE follower_id=$2 AND following_id=$1) as is_following
       FROM users WHERE id=$1`,
      [req.params.id, req.user.id]
    );
    if (!user.rows[0]) return res.status(404).json({ message: 'Foydalanuvchi topilmadi' });
    const photos = await pool.query('SELECT * FROM photos WHERE user_id=$1 ORDER BY created_at DESC', [req.params.id]);
    res.json({ user: user.rows[0], photos: photos.rows, isFollowing: user.rows[0].is_following });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Follow
router.post('/:id/follow', authMiddleware, async (req, res) => {
  try {
    const existing = await pool.query('SELECT id FROM follows WHERE follower_id=$1 AND following_id=$2', [req.user.id, req.params.id]);
    if (existing.rows[0]) {
      await pool.query('DELETE FROM follows WHERE follower_id=$1 AND following_id=$2', [req.user.id, req.params.id]);
    } else {
      await pool.query('INSERT INTO follows (follower_id, following_id) VALUES ($1,$2)', [req.user.id, req.params.id]);
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Followers/Following
router.get('/:id/followers', authMiddleware, async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT u.id, u.name, u.username, u.avatar_url FROM follows f JOIN users u ON u.id=f.follower_id WHERE f.following_id=$1',
      [req.params.id]
    );
    res.json({ users: r.rows });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id/following', authMiddleware, async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT u.id, u.name, u.username, u.avatar_url FROM follows f JOIN users u ON u.id=f.following_id WHERE f.follower_id=$1',
      [req.params.id]
    );
    res.json({ users: r.rows });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;

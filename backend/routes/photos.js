const express = require('express');
const multer = require('multer');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const { uploadFile, getFileUrl, deleteFile } = require('../config/appwrite');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Faqat rasm fayllari qabul qilinadi'));
    }
  }
});

// Rasm yuklash
router.post('/upload', authMiddleware, (req, res, next) => {
  upload.single('photo')(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
}, async (req, res) => {
  try {
    const { caption, tags } = req.body;
    const file = req.file;

    console.log('File keldi:', file?.originalname);
    console.log('Body:', req.body);

    if (!file) return res.status(400).json({ message: 'Rasm topilmadi' });

    const uploaded = await uploadFile(file.buffer, file.originalname, file.mimetype);
    const imageUrl = getFileUrl(uploaded.$id);

    const result = await pool.query(
      'INSERT INTO photos (user_id, appwrite_file_id, image_url, caption, tags) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.id, uploaded.$id, imageUrl, caption, tags ? tags.split(',') : []]
    );

    res.status(201).json({ photo: result.rows[0] });
  } catch (err) {
    console.error('Upload xato:', err);
    res.status(500).json({ message: err.message });
  }
});

// Rasmni o'chirish
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM photos WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    const photo = result.rows[0];
    if (!photo) return res.status(404).json({ message: 'Rasm topilmadi' });

    await deleteFile(photo.appwrite_file_id);
    await pool.query('DELETE FROM photos WHERE id = $1', [req.params.id]);
    res.json({ message: "Rasm o'chirildi" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Yoqtirish
router.post('/:id/like', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    const exists = await pool.query('SELECT id FROM likes WHERE user_id = $1 AND photo_id = $2', [userId, id]);
    if (exists.rows[0]) {
      await pool.query('DELETE FROM likes WHERE user_id = $1 AND photo_id = $2', [userId, id]);
      await pool.query('UPDATE photos SET likes_count = likes_count - 1 WHERE id = $1', [id]);
      return res.json({ liked: false });
    }
    await pool.query('INSERT INTO likes (user_id, photo_id) VALUES ($1, $2)', [userId, id]);
    await pool.query('UPDATE photos SET likes_count = likes_count + 1 WHERE id = $1', [id]);
    res.json({ liked: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Izoh qo'shish
router.post('/:id/comment', authMiddleware, async (req, res) => {
  const { text } = req.body;
  const { id } = req.params;
  try {
    const result = await pool.query(
      'INSERT INTO comments (user_id, photo_id, text) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, id, text]
    );
    await pool.query('UPDATE photos SET comments_count = comments_count + 1 WHERE id = $1', [id]);
    res.status(201).json({ comment: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Izohlarni olish
router.get('/:id/comments', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.name, u.avatar_url FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.photo_id = $1 ORDER BY c.created_at ASC`,
      [req.params.id]
    );
    res.json({ comments: result.rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

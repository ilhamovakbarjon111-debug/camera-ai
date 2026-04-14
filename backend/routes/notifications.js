const express = require('express');
const { Expo } = require('expo-server-sdk');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const expo = new Expo();

const sendPush = async (tokens, title, body, data = {}) => {
  const messages = tokens
    .filter(token => Expo.isExpoPushToken(token))
    .map(token => ({ to: token, sound: 'default', title, body, data }));

  if (!messages.length) return;
  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    try { await expo.sendPushNotificationsAsync(chunk); } catch (e) { console.error(e); }
  }
};

// Yangi yoqtirish bildirishnomasini yuborish
router.post('/like', authMiddleware, async (req, res) => {
  const { photo_owner_id, liker_name } = req.body;
  try {
    const result = await pool.query('SELECT push_token FROM users WHERE id = $1', [photo_owner_id]);
    const token = result.rows[0]?.push_token;
    if (token) await sendPush([token], 'Yangi yoqtirish!', `${liker_name} rasmingizni yoqtirdi`);
    res.json({ sent: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Yangi izoh bildirishnomasini yuborish
router.post('/comment', authMiddleware, async (req, res) => {
  const { photo_owner_id, commenter_name } = req.body;
  try {
    const result = await pool.query('SELECT push_token FROM users WHERE id = $1', [photo_owner_id]);
    const token = result.rows[0]?.push_token;
    if (token) await sendPush([token], 'Yangi izoh!', `${commenter_name} rasmingizga izoh qoldirdi`);
    res.json({ sent: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

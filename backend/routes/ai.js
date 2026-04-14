const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Rasmni AI bilan tahlil qilish
router.post('/analyze/:photoId', authMiddleware, async (req, res) => {
  try {
    const photo = await pool.query('SELECT * FROM photos WHERE id = $1', [req.params.photoId]);
    if (!photo.rows[0]) return res.status(404).json({ message: 'Rasm topilmadi' });

    const existing = await pool.query('SELECT * FROM ai_analyses WHERE photo_id = $1', [req.params.photoId]);
    if (existing.rows[0]) return res.json({ analysis: existing.rows[0] });

    const imageUrl = photo.rows[0].image_url;
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'url', url: imageUrl } },
          {
            type: 'text',
            text: `Siz professional fotograf va fotosuratchilik murabbiyisiz. Bu rasmni baholang va FAQAT JSON qaytaring:
{"composition_score":1-10,"lighting_score":1-10,"overall_score":1-10,"composition_feedback":"o'zbek tilida","lighting_feedback":"o'zbek tilida","color_feedback":"o'zbek tilida","suggestions":["tavsiya 1","tavsiya 2","tavsiya 3"]}`
          }
        ]
      }]
    });

    const raw = response.content[0].text.replace(/```json|```/g, '').trim();
    const data = JSON.parse(raw);

    const result = await pool.query(
      `INSERT INTO ai_analyses (photo_id, user_id, composition_score, lighting_score, overall_score,
       composition_feedback, lighting_feedback, color_feedback, suggestions)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.params.photoId, req.user.id, data.composition_score, data.lighting_score, data.overall_score,
       data.composition_feedback, data.lighting_feedback, data.color_feedback, data.suggestions]
    );

    await pool.query('UPDATE photos SET ai_analyzed = true WHERE id = $1', [req.params.photoId]);
    await pool.query('UPDATE users SET xp = xp + 10 WHERE id = $1', [req.user.id]);

    res.json({ analysis: result.rows[0] });
  } catch (err) {
    console.error('Analyze xato:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Tahlil natijasini olish
router.get('/analysis/:photoId', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ai_analyses WHERE photo_id = $1', [req.params.photoId]);
    if (!result.rows[0]) return res.status(404).json({ message: 'Tahlil topilmadi' });
    res.json({ analysis: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Vazifa rasmini tekshirish
router.post('/verify-challenge', authMiddleware, async (req, res) => {
  const { imageBase64, mimeType = 'image/jpeg', challengeTitle, challengeDesc } = req.body;
  try {
    const sizeInBytes = Buffer.byteLength(imageBase64 || '', 'base64');
    if (!imageBase64 || sizeInBytes > 4 * 1024 * 1024) {
      return res.json({ approved: false, reason: 'Rasm hajmi katta, qaytadan urinib ko\'ring' });
    }

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } },
          { type: 'text', text: `Bu rasm "${challengeTitle}" vazifasiga mosmi? Talab: "${challengeDesc}". FAQAT JSON: {"approved":true/false,"reason":"o'zbek tilida qisqa sabab"}` }
        ]
      }]
    });

    const raw = response.content[0].text.replace(/```json|```/g, '').trim();
    const data = JSON.parse(raw);
    res.json(data);
  } catch (err) {
    console.error('Verify xato:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Kamera maslahat (AI rejim)
router.post('/camera-tip', authMiddleware, async (req, res) => {
  const { imageBase64, mimeType = 'image/jpeg', aiMode = false } = req.body;

  try {
    const sizeInBytes = Buffer.byteLength(imageBase64 || '', 'base64');
    if (!imageBase64 || sizeInBytes > 4 * 1024 * 1024) {
      return res.json({
        direction: '✓', score: 0.5,
        tip: 'Kamerani barqaror ushlab turing',
        settings: { zoom: 0, exposure: 0, iso: 0.15 },
        autoCapture: false, autoCaptureDelay: 1,
      });
    }

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 120,
      system: `Camera AI. Reply ONLY valid JSON:
{"direction":"← or → or ↑ or ↓ or ✓","score":0.0-1.0,"tip":"Uzbek max 10 words","settings":{"zoom":0.0-1.0,"exposure":-1.0-1.0,"iso":0.0-1.0},"autoCapture":true/false,"autoCaptureDelay":1-3}
Rules: ✓=perfect shot. score>=0.8 means autoCapture=true.`,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } },
          { type: 'text', text: 'Analyze camera view. JSON only.' }
        ]
      }]
    });

    const clean = response.content[0].text.replace(/```json|```/g, '').trim();
    const data = JSON.parse(clean);
    res.json(data);
  } catch (err) {
    console.error('Camera tip xato:', err.message);
    res.json({
      direction: '✓', score: 0.5,
      tip: 'Kamerani barqaror ushlab turing',
      settings: { zoom: 0, exposure: 0, iso: 0.15 },
      autoCapture: false, autoCaptureDelay: 1,
    });
  }
});

module.exports = router;

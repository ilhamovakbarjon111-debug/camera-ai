const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token topilmadi' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query('SELECT id, name, email, avatar_url, level, xp FROM users WHERE id = $1', [decoded.id]);
    if (!result.rows[0]) return res.status(401).json({ message: 'Foydalanuvchi topilmadi' });
    req.user = result.rows[0];
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token yaroqsiz' });
  }
};

module.exports = authMiddleware;

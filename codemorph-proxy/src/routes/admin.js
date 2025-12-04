// src/routes/admin.js
import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || null;

function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
    return res.status(403).json({ message: 'admin_only' });
  }
  next();
}

router.post('/topup', requireAdmin, async (req, res) => {
  const { userId, amount } = req.body;

  if (!userId || !amount) {
    return res.status(400).json({ message: 'missing params' });
  }

  try {
    const [result] = await pool.query(
      `UPDATE users
       SET credits = credits + ?
       WHERE id = ?`,
      [amount, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'user_not_found' });
    }

    res.json({ ok: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'server_error' });
  }
});


export default router;

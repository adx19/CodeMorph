import express from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../db.js';
import { signJwt } from '../auth.js';
import crypto from 'crypto';



const router = express.Router();
router.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'missing username/email/password' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const userId = crypto.randomUUID();
  const authId = crypto.randomUUID();

  try {
    // 1️⃣ insert into users
    await pool.query(
      'INSERT INTO users (id, username, email) VALUES (?, ?, ?)',
      [userId, username, email]
    );

    // 2️⃣ insert into auth providers
    await pool.query(
      `INSERT INTO user_auth_providers
       (id, user_id, provider, provider_user_id, password_hash)
       VALUES (?, ?, 'local', ?, ?)`,
      [authId, userId, email, passwordHash]
    );

    const token = signJwt({ id: userId, email });
    res.json({ token });

  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'user_exists_or_error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const [rows] = await pool.query(
    `SELECT
       u.id,
       u.username,
       u.email,
       u.credits,
       p.password_hash
     FROM users u
     JOIN user_auth_providers p ON p.user_id = u.id
     WHERE u.email = ?
       AND p.provider = 'local'`,
    [email]
  );

  if (!rows.length) {
    return res.status(401).json({ message: 'invalid_credentials' });
  }

  const user = rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);

  if (!ok) {
    return res.status(401).json({ message: 'invalid_credentials' });
  }

  const token = signJwt({ id: user.id, email: user.email });
  res.json({ token });
});

export default router;

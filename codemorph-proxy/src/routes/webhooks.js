// src/routes/webhooks.js
import express from 'express';
import crypto from 'crypto';
import { pool } from '../db.js';

const router = express.Router();
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

router.post(
  '/razorpay',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['x-razorpay-signature'];
    const body = req.body;

    const expected = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expected !== signature) {
      return res.status(400).send('invalid signature');
    }

    const payload = JSON.parse(body.toString());

    if (payload.event === 'payment.captured') {
      const payment = payload.payload.payment.entity;
      const amount = payment.amount;
      const notes = payment.notes || {};
      const userId = notes.userId;

      if (userId) {
        const creditsToAdd = Math.floor(amount / 100);

        await pool.query(
          `INSERT INTO purchased_credits
           (id, user_id, paid_credits, plan_type, start_date, end_date)
           VALUES (?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 MONTH))`,
          [
            crypto.randomUUID(),
            userId,
            creditsToAdd,
            'razorpay_monthly'
          ]
        );

        await pool.query(
          `UPDATE users
           SET is_paid = 1
           WHERE id = ?`,
          [userId]
        );
      }

      return res.json({ ok: true });
    }

    res.json({ ok: true });
  }
);

export default router;

import express from "express";
import { pool } from "../db.js";
import { generateResponse } from "../utils/gemini.js";
import { apiKeyMiddleware } from "../auth.js";

const router = express.Router();

const FREE_LANGUAGES = [
  "python",
  "java",
  "javascript",
  "cpp",
  "c",
  "typescript",
];
router.post("/", apiKeyMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { prompt, fromLang, toLang } = req.body;

  if (!prompt) {
    return res.status(400).json({ message: "missing_prompt" });
  }

  if (!fromLang || !toLang) {
    return res.status(400).json({ message: "missing_language_info" });
  }
  const [userRows] = await pool.query(
    "SELECT is_paid FROM users WHERE id = ?",
    [userId]
  );

  const isPaid = userRows[0]?.is_paid === 1;

  if (isPaid) {
    const allowed = FREE_LANGUAGES;

    if (!allowed.includes(fromLang) || !allowed.includes(toLang)) {
      return res.status(403).json({ message: "upgrade_required" });
    }
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 1️⃣ Try paid credits first
    const [paidRows] = await conn.query(
      `SELECT id, paid_credits
       FROM purchased_credits
       WHERE user_id = ?
         AND paid_credits > 0
         AND end_date > NOW()
       ORDER BY end_date ASC
       LIMIT 1
       FOR UPDATE`,
      [userId]
    );

    if (paidRows.length > 0) {
      // ✅ Drain paid credits
      await conn.query(
        `UPDATE purchased_credits
         SET paid_credits = paid_credits - 1
         WHERE id = ?`,
        [paidRows[0].id]
      );
    } else {
      // ✅ Drain free/shared credits
      const [userRows] = await conn.query(
        `SELECT credits
         FROM users
         WHERE id = ?
         FOR UPDATE`,
        [userId]
      );

      if (!userRows.length || userRows[0].credits <= 0) {
        throw new Error("NO_CREDITS");
      }

      await conn.query(
        `UPDATE users
         SET credits = credits - 1
         WHERE id = ?`,
        [userId]
      );
    }

    // ✅ Commit BEFORE calling Gemini
    await conn.commit();

    // ✅ Call Gemini AFTER credits are deducted
    const reply = await generateResponse(prompt);

    res.json({ reply });
  } catch (err) {
    await conn.rollback();

    if (err.message === "NO_CREDITS") {
      return res.status(402).json({ message: "insufficient_credits" });
    }

    console.error(err);
    res.status(500).json({ message: "convert_failed" });
  } finally {
    conn.release();
  }
});

export default router;

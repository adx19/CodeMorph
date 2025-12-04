// src/app.js
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import authRoutes from './routes/auth.js';
import convertRoutes from './routes/convert.js';
import adminRoutes from './routes/admin.js';
import webhooks from './routes/webhooks.js';

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '200kb' })); // limit request size
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/auth', authRoutes);
app.use('/convert', convertRoutes);
app.use('/admin', adminRoutes);
app.use('/webhooks', webhooks);

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`CodeMorph proxy running on ${PORT}`));

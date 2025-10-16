#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
require('dotenv').config({
  path: fs.existsSync(path.join(__dirname, '.env'))
    ? path.join(__dirname, '.env')
    : undefined
});

const app = express();
const PORT = process.env.RELAY_PORT || 4900;
const API_KEY = process.env.RELAY_API_KEY || null;

const requiredEnv = ['RELAY_SMTP_HOST', 'RELAY_SMTP_PORT', 'RELAY_SMTP_USER', 'RELAY_SMTP_PASS'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length) {
  console.error('❌ Variáveis obrigatórias ausentes para o relay SMTP:', missingEnv.join(', '));
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: process.env.RELAY_SMTP_HOST,
  port: parseInt(process.env.RELAY_SMTP_PORT, 10) || 587,
  secure: process.env.RELAY_SMTP_SECURE === 'true',
  auth: {
    user: process.env.RELAY_SMTP_USER,
    pass: process.env.RELAY_SMTP_PASS
  },
  connectionTimeout: 60000,
  greetingTimeout: 30000,
  socketTimeout: 60000,
  tls: {
    rejectUnauthorized: process.env.RELAY_SMTP_REJECT_UNAUTHORIZED !== 'false'
  }
});

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false
}));

app.get('/health', async (_req, res) => {
  try {
    await transporter.verify();
    res.json({ success: true, status: 'ok' });
  } catch (error) {
    res.status(503).json({ success: false, error: error.message });
  }
});

app.post('/send-email', async (req, res) => {
  try {
    if (API_KEY) {
      const providedKey = req.headers['x-api-key'] || req.body.apiKey;
      if (!providedKey || providedKey !== API_KEY) {
        return res.status(401).json({ success: false, error: 'API key inválida' });
      }
    }

    const { to, subject, html, text, from, template, data } = req.body || {};

    if (!to || !subject || (!html && !text)) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios ausentes. Forneça "to", "subject" e "html" ou "text".'
      });
    }

    const mailOptions = {
      from: from || process.env.RELAY_DEFAULT_FROM || process.env.RELAY_SMTP_USER,
      to,
      subject,
      html: html || undefined,
      text: text || undefined
    };

    const result = await transporter.sendMail(mailOptions);

    console.log('📧 Email enviado via relay:', {
      to,
      subject,
      template: template || null,
      data: data ? Object.keys(data) : []
    });

    res.json({ success: true, messageId: result.messageId });
  } catch (error) {
    console.error('❌ Erro no relay de email:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Email relay rodando em http://localhost:${PORT}`);
  console.log('📮 Endpoint: POST /send-email');
  console.log('🛡️ API Key ativa:', API_KEY ? 'sim' : 'não');
});

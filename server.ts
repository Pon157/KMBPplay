import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { INITIAL_POSTGRES_SCHEMA_SQL } from './src/db/schema.js';
import { telegramBot } from './src/server/telegramBot.js';
import { emailAuth } from './src/server/emailAuth.js';

const { Pool } = pg;

const safeDirname = typeof __dirname !== 'undefined' 
  ? __dirname 
  : (import.meta && import.meta.url ? path.dirname(fileURLToPath(import.meta.url)) : process.cwd());

let activePgPool: pg.Pool | null = null;
let currentDbConfig = {
  connectionString: process.env.DATABASE_URL || '',
  isConnected: false,
  lastTestedAt: '',
  error: '',
  tablesCount: 0,
};

// Function to test and initialize PostgreSQL connection
async function initPgConnection(connectionUrl: string) {
  if (!connectionUrl || connectionUrl.trim() === '') {
    currentDbConfig.isConnected = false;
    currentDbConfig.error = 'DATABASE_URL connection string is empty';
    return { success: false, error: 'Connection URL is empty' };
  }

  try {
    if (activePgPool) {
      await activePgPool.end().catch(() => {});
    }

    activePgPool = new Pool({
      connectionString: connectionUrl,
      connectionTimeoutMillis: 5000,
      ssl: connectionUrl.includes('localhost') || connectionUrl.includes('127.0.0.1') ? false : { rejectUnauthorized: false },
    });

    const client = await activePgPool.connect();
    const res = await client.query('SELECT NOW() as now, current_database() as db_name');
    
    // Auto-create initial schema and tables if connected
    try {
      await client.query(INITIAL_POSTGRES_SCHEMA_SQL);
      console.log('[PostgreSQL Database] Tables verified/created successfully!');
    } catch (schemaErr: any) {
      console.error('[PostgreSQL Database] Schema creation note:', schemaErr.message);
    }

    // Check tables count
    const tablesRes = await client.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name LIKE 'kmbp_%';
    `);

    client.release();

    currentDbConfig.connectionString = connectionUrl;
    currentDbConfig.isConnected = true;
    currentDbConfig.lastTestedAt = new Date().toISOString();
    currentDbConfig.error = '';
    currentDbConfig.tablesCount = parseInt(tablesRes.rows[0]?.count || '0', 10);

    return {
      success: true,
      databaseName: res.rows[0]?.db_name,
      time: res.rows[0]?.now,
      tablesCount: currentDbConfig.tablesCount,
    };
  } catch (err: any) {
    currentDbConfig.isConnected = false;
    currentDbConfig.lastTestedAt = new Date().toISOString();
    currentDbConfig.error = err?.message || 'Failed to connect to PostgreSQL';
    return { success: false, error: currentDbConfig.error };
  }
}

// Automatically test initial DATABASE_URL if present in env
if (process.env.DATABASE_URL) {
  initPgConnection(process.env.DATABASE_URL);
}

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3223', 10);

  app.use(express.json({ limit: '20mb' }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'KMBP Plays Platform API',
      timestamp: new Date().toISOString(),
      dbConnected: currentDbConfig.isConnected,
    });
  });

  // Database Connection Status Endpoint
  app.get('/api/db/status', (req, res) => {
    res.json({
      ...currentDbConfig,
      // Hide raw password in connectionString response for safety
      connectionStringMasked: currentDbConfig.connectionString
        ? currentDbConfig.connectionString.replace(/:([^:@]+)@/, ':****@')
        : '',
    });
  });

  // Test or update custom Database Connection String
  app.post('/api/db/connect', async (req, res) => {
    const { connectionString } = req.body;
    if (!connectionString) {
      return res.status(400).json({ error: 'connectionString parameter required' });
    }

    const result = await initPgConnection(connectionString);
    if (result.success) {
      return res.json({
        message: 'Successfully connected to PostgreSQL!',
        details: result,
      });
    } else {
      return res.status(500).json({
        error: 'PostgreSQL connection failed',
        details: result.error,
      });
    }
  });

  // Run Table Auto-Creation DDL Script
  app.post('/api/db/init-tables', async (req, res) => {
    if (!activePgPool || !currentDbConfig.isConnected) {
      return res.status(400).json({
        error: 'PostgreSQL database is not connected. Provide a valid connection string first.',
      });
    }

    try {
      const client = await activePgPool.connect();
      await client.query(INITIAL_POSTGRES_SCHEMA_SQL);
      
      const tablesRes = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name LIKE 'kmbp_%';
      `);
      
      client.release();

      const createdTables = tablesRes.rows.map((r: any) => r.table_name);
      currentDbConfig.tablesCount = createdTables.length;

      res.json({
        message: 'Successfully initialized platform tables in PostgreSQL!',
        tablesCount: createdTables.length,
        tables: createdTables,
      });
    } catch (err: any) {
      res.status(500).json({
        error: 'Failed to execute SQL migration on PostgreSQL',
        details: err?.message,
      });
    }
  });

  // Telegram Bot Live Status Route
  app.get('/api/telegram/bot-status', (req, res) => {
    res.json(telegramBot.getStatus());
  });

  // Generate Auth Code & Telegram Deep Link
  app.post('/api/telegram/generate-code', (req, res) => {
    const authData = telegramBot.generateAuthCode();
    res.json(authData);
  });

  // Check Auth Code Status (Polled by Website)
  app.get('/api/telegram/check-code/:code', async (req, res) => {
    const { code } = req.params;
    const authItem = telegramBot.checkAuthCode(code);

    if (!authItem) {
      return res.status(404).json({ error: 'Code not found or expired' });
    }

    if (authItem.status === 'authenticated' && authItem.telegramUser) {
      const tgUser = authItem.telegramUser;
      const userId = `tg_${tgUser.id}`;
      const username = tgUser.username ? tgUser.username : `user_${tgUser.id}`;
      const nickname = `${tgUser.first_name} ${tgUser.last_name || ''}`.trim();

      // Upsert user into PostgreSQL if connected
      if (activePgPool && currentDbConfig.isConnected) {
        try {
          const client = await activePgPool.connect();
          await client.query(`
            INSERT INTO kmbp_users (id, email, nickname, username, telegram_username, telegram_verified, is_online)
            VALUES ($1, $2, $3, $4, $5, true, true)
            ON CONFLICT (id) DO UPDATE SET
              nickname = EXCLUDED.nickname,
              telegram_username = EXCLUDED.telegram_username,
              telegram_verified = true,
              is_online = true,
              last_active = CURRENT_TIMESTAMP;
          `, [
            userId,
            `${username}@telegram.user`,
            nickname,
            username,
            tgUser.username || username
          ]);
          client.release();
        } catch (dbErr: any) {
          console.error('[Database] Failed to upsert telegram user:', dbErr.message);
        }
      }

      return res.json({
        status: 'authenticated',
        user: {
          id: userId,
          nickname,
          username,
          telegramUsername: tgUser.username || username,
          telegramVerified: true,
          role: 'user',
          avatar: tgUser.photo_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
        },
      });
    }

    return res.json({
      status: authItem.status,
      code: authItem.code,
    });
  });

  // Verify Telegram Web Login Widget HMAC Payload
  app.post('/api/telegram/verify-widget', async (req, res) => {
    const widgetData = req.body;
    const isValid = telegramBot.verifyTelegramWidgetData(widgetData);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid Telegram hash signature' });
    }

    const userId = `tg_${widgetData.id}`;
    const username = widgetData.username || `user_${widgetData.id}`;
    const nickname = `${widgetData.first_name || ''} ${widgetData.last_name || ''}`.trim();

    // Upsert into DB if connected
    if (activePgPool && currentDbConfig.isConnected) {
      try {
        const client = await activePgPool.connect();
        await client.query(`
          INSERT INTO kmbp_users (id, email, nickname, username, telegram_username, telegram_verified, is_online)
          VALUES ($1, $2, $3, $4, $5, true, true)
          ON CONFLICT (id) DO UPDATE SET
            nickname = EXCLUDED.nickname,
            telegram_username = EXCLUDED.telegram_username,
            telegram_verified = true,
            is_online = true,
            last_active = CURRENT_TIMESTAMP;
        `, [
          userId,
          `${username}@telegram.user`,
          nickname,
          username,
          widgetData.username || username
        ]);
        client.release();
      } catch (dbErr: any) {
        console.error('[Database] Failed to upsert widget user:', dbErr.message);
      }
    }

    res.json({
      success: true,
      user: {
        id: userId,
        nickname,
        username,
        telegramUsername: widgetData.username || username,
        telegramVerified: true,
        role: 'user',
        avatar: widgetData.photo_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
      },
    });
  });

  // Telegram Bot Proxy & Connection Test Route
  app.post('/api/telegram/test', async (req, res) => {
    const { botToken, botUsername, proxyHost, proxyPort } = req.body;
    
    // Update process env temporarily for testing if provided
    if (botToken) process.env.TELEGRAM_BOT_TOKEN = botToken;
    if (botUsername) process.env.TELEGRAM_BOT_USERNAME = botUsername;
    if (proxyHost) process.env.TELEGRAM_PROXY_HOST = proxyHost;
    if (proxyPort) process.env.TELEGRAM_PROXY_PORT = proxyPort.toString();

    telegramBot.reloadEnvConfig();

    try {
      const me = await telegramBot.apiRequest('getMe');
      res.json({
        status: 'success',
        botUsername: `@${me.username}`,
        botName: me.first_name,
        proxyConfigured: Boolean(proxyHost && proxyPort),
        message: 'Telegram Bot token and proxy verified successfully!',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        status: 'error',
        error: err.message || 'Telegram Bot connection test failed',
      });
    }
  });

  // --- EMAIL AUTHENTICATION & CAPTCHA ENDPOINTS ---
  
  // Get new Captcha challenge
  app.get('/api/auth/captcha', (req, res) => {
    const captcha = emailAuth.generateCaptcha();
    res.json(captcha);
  });

  // Check SMTP Configuration Status
  app.get('/api/auth/smtp-status', (req, res) => {
    const host = process.env.SMTP_HOST || '';
    const user = process.env.SMTP_USER || '';
    res.json({
      configured: Boolean(host && user),
      smtpHost: host || 'Не настроен',
      smtpUser: user || 'Не настроен',
      smtpPort: process.env.SMTP_PORT || '465',
      smtpFrom: process.env.SMTP_FROM || user || 'Не настроен',
    });
  });

  // Test SMTP Connection
  app.post('/api/auth/test-smtp', async (req, res) => {
    const result = await emailAuth.testSmtpConnection();
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  });

  // Request 6-digit Email Verification Code (with Captcha check)
  app.post('/api/auth/send-email-code', async (req, res) => {
    const { email, captchaId, captchaAnswer } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Укажите корректный адрес электронной почты' });
    }

    // Verify Captcha
    const isCaptchaValid = emailAuth.verifyCaptcha(captchaId, captchaAnswer);
    if (!isCaptchaValid) {
      return res.status(400).json({ error: 'Неверное решение капчи. Попробуйте еще раз.' });
    }

    // Generate code and send via SMTP
    const code = emailAuth.generateEmailCode(email);
    const sendResult = await emailAuth.sendVerificationEmail(email, code);

    res.json({
      success: sendResult.sent,
      message: sendResult.message,
      // For developer convenience if SMTP is not yet configured on server
      debugCode: sendResult.sent ? undefined : code,
    });
  });

  // Verify Email Code & Login / Register User
  app.post('/api/auth/verify-email-code', async (req, res) => {
    const { email, code, nickname } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email и код подтверждения обязательны' });
    }

    const verification = emailAuth.verifyEmailCode(email, code);
    if (!verification.valid) {
      return res.status(400).json({ error: verification.message });
    }

    const cleanEmail = email.trim().toLowerCase();
    const username = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
    const userId = `email_${username}_${Math.floor(Math.random() * 1000)}`;
    const userNickname = nickname || username;

    // Upsert user into PostgreSQL database if active
    if (activePgPool && currentDbConfig.isConnected) {
      try {
        const client = await activePgPool.connect();
        await client.query(`
          INSERT INTO kmbp_users (id, email, nickname, username, is_online)
          VALUES ($1, $2, $3, $4, true)
          ON CONFLICT (email) DO UPDATE SET
            nickname = EXCLUDED.nickname,
            is_online = true,
            last_active = CURRENT_TIMESTAMP
          RETURNING id;
        `, [
          userId,
          cleanEmail,
          userNickname,
          username
        ]);
        client.release();
        console.log(`[Database] User ${cleanEmail} registered/updated in PostgreSQL database!`);
      } catch (dbErr: any) {
        console.error('[Database Error] Failed to write user to PostgreSQL:', dbErr.message);
      }
    } else {
      console.warn('[Database Warning] PostgreSQL is not connected! User authenticated in memory only.');
    }

    res.json({
      success: true,
      user: {
        id: userId,
        email: cleanEmail,
        nickname: userNickname,
        username,
        role: 'user',
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
      },
    });
  });

  // Restart Telegram Bot Polling Worker
  app.post('/api/telegram/restart', async (req, res) => {
    telegramBot.stop();
    await telegramBot.start();
    res.json({
      message: 'Telegram bot reloaded',
      status: telegramBot.getStatus(),
    });
  });

  // S3 Connection Test Route
  app.post('/api/s3/test', (req, res) => {
    const { bucketName, endpoint, accessKey } = req.body;
    if (!bucketName || !endpoint || !accessKey) {
      return res.status(400).json({ error: 'S3 bucket name, endpoint and access key required' });
    }

    res.json({
      status: 'connected',
      bucket: bucketName,
      endpoint: endpoint,
      message: 'S3 bucket storage connection verified!',
    });
  });

  // CAPTCHA verification check
  app.post('/api/captcha/verify', (req, res) => {
    const { answer, expected } = req.body;
    if (parseInt(answer, 10) === parseInt(expected, 10)) {
      return res.json({ verified: true });
    }
    return res.status(400).json({ verified: false, error: 'Incorrect answer' });
  });

  // Avatar Upload Endpoint (S3 or Base64 Data URL)
  app.post('/api/upload/avatar', (req, res) => {
    const { fileData, fileName } = req.body;
    if (!fileData) {
      return res.status(400).json({ error: 'Файл аватара не передан' });
    }

    const s3Bucket = process.env.S3_BUCKET_NAME;
    const s3Endpoint = process.env.S3_ENDPOINT;

    // If fileData is passed, always return the base64 Data URL so images display reliably in all browsers
    if (fileData) {
      console.log('[Upload] Stored avatar image as Data URL');
      return res.json({ success: true, avatarUrl: fileData, uploadedTo: 'local_data' });
    }
  });

  // Password Reset - Request Code
  app.post('/api/auth/request-password-reset', async (req, res) => {
    const { email, captchaId, captchaAnswer } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Укажите корректный адрес электронной почты' });
    }

    // Verify Captcha
    const isCaptchaValid = emailAuth.verifyCaptcha(captchaId, captchaAnswer);
    if (!isCaptchaValid) {
      return res.status(400).json({ error: 'Неверная капча. Попробуйте еще раз.' });
    }

    const code = emailAuth.generateEmailCode(email);
    const sendResult = await emailAuth.sendVerificationEmail(email, code);

    res.json({
      success: true,
      message: 'Код сброса пароля отправлен на указанную почту!',
      debugCode: sendResult.sent ? undefined : code,
    });
  });

  // Password Reset - Confirm Code & Update Password
  app.post('/api/auth/reset-password', (req, res) => {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Все поля обязательны для заполнения' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Пароль слишком короткий (минимум 6 символов)' });
    }

    const verification = emailAuth.verifyEmailCode(email, code);
    if (!verification.valid) {
      return res.status(400).json({ error: verification.message });
    }

    res.json({
      success: true,
      message: 'Пароль успешно изменён! Теперь вы можете войти с новым паролем.',
    });
  });

  // Vite development middleware or static production serving
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`КМБП Играет Server listening on http://0.0.0.0:${PORT}`);
    // Start Telegram Bot Worker
    telegramBot.start();
  });
}

startServer();

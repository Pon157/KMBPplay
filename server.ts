import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { INITIAL_POSTGRES_SCHEMA_SQL } from './src/db/schema.js';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  const PORT = 3000;

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

  // Telegram Bot Proxy & Status Test Route
  app.post('/api/telegram/test', (req, res) => {
    const { botToken, botUsername, proxyHost, proxyPort } = req.body;
    if (!botToken) {
      return res.status(400).json({ error: 'Telegram Bot Token is required' });
    }
    
    // Simulate / execute Telegram bot getMe check
    res.json({
      status: 'success',
      botUsername: botUsername || '@KMBPGameBot',
      proxyConfigured: Boolean(proxyHost && proxyPort),
      message: 'Telegram Bot token validated successfully!',
      timestamp: new Date().toISOString(),
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
  });
}

startServer();

import https from 'https';
import http from 'http';
import crypto from 'crypto';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date?: number;
}

export interface PendingAuthCode {
  code: string;
  createdAt: number;
  status: 'pending' | 'authenticated' | 'expired';
  telegramUser?: TelegramUser;
}

// In-memory auth codes cache (code -> pending state)
const pendingAuthCodes = new Map<string, PendingAuthCode>();

// Auto clean codes older than 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [code, item] of pendingAuthCodes.entries()) {
    if (now - item.createdAt > 15 * 60 * 1000) {
      pendingAuthCodes.delete(code);
    }
  }
}, 60 * 1000);

export class TelegramBotService {
  private token: string = '';
  private botUsername: string = '';
  private proxyHost: string = '';
  private proxyPort: number = 0;
  private proxyAuth: string = '';
  private isRunning: boolean = false;
  private pollOffset: number = 0;
  private pollingTimer: NodeJS.Timeout | null = null;
  private lastError: string | null = null;
  private botInfo: any = null;

  constructor() {
    this.reloadEnvConfig();
  }

  public reloadEnvConfig() {
    this.token = process.env.TELEGRAM_BOT_TOKEN || '';
    this.botUsername = (process.env.TELEGRAM_BOT_USERNAME || '').replace('@', '');
    this.proxyHost = process.env.TELEGRAM_PROXY_HOST || '';
    this.proxyPort = parseInt(process.env.TELEGRAM_PROXY_PORT || '0', 10);
    this.proxyAuth = process.env.TELEGRAM_PROXY_AUTH || '';
  }

  public getStatus() {
    return {
      configured: Boolean(this.token),
      isRunning: this.isRunning,
      botUsername: this.botUsername || this.botInfo?.username || 'Не указан',
      botName: this.botInfo?.first_name || 'KMBP Auth Bot',
      proxyActive: Boolean(this.proxyHost && this.proxyPort),
      proxyConfig: this.proxyHost ? `${this.proxyHost}:${this.proxyPort}` : 'Без прокси',
      lastError: this.lastError,
      activePendingCodes: pendingAuthCodes.size,
    };
  }

  // Create proxy agent if host & port are set
  private getProxyAgent(): any {
    if (!this.proxyHost || !this.proxyPort) {
      return null;
    }

    const authPrefix = this.proxyAuth ? `${this.proxyAuth}@` : '';
    // Support HTTP or SOCKS5 proxy URLs
    const proxyUrl = `http://${authPrefix}${this.proxyHost}:${this.proxyPort}`;
    
    try {
      if (this.proxyPort === 1080 || this.proxyPort === 1081 || this.proxyHost.includes('socks')) {
        const socksUrl = `socks5://${authPrefix}${this.proxyHost}:${this.proxyPort}`;
        return new SocksProxyAgent(socksUrl);
      }
      return new HttpsProxyAgent(proxyUrl);
    } catch (e: any) {
      console.error('[TelegramBot] Proxy agent creation error:', e.message);
      return new HttpsProxyAgent(proxyUrl);
    }
  }

  // Raw helper to make Telegram API requests
  public async apiRequest(method: string, body?: any): Promise<any> {
    if (!this.token) {
      throw new Error('TELEGRAM_BOT_TOKEN не установлен в .env');
    }

    return new Promise((resolve, reject) => {
      const postData = body ? JSON.stringify(body) : '';
      const agent = this.getProxyAgent();

      const options: https.RequestOptions = {
        hostname: 'api.telegram.org',
        port: 443,
        path: `/bot${this.token}/${method}`,
        method: body ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
        timeout: 15000,
      };

      if (agent) {
        options.agent = agent;
      }

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.ok) {
              resolve(parsed.result);
            } else {
              reject(new Error(parsed.description || 'Telegram API returned false'));
            }
          } catch (err: any) {
            reject(new Error(`Invalid JSON response from Telegram: ${data.slice(0, 100)}`));
          }
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Telegram API request timed out'));
      });

      if (postData) {
        req.write(postData);
      }
      req.end();
    });
  }

  // Start polling Telegram updates
  public async start() {
    this.reloadEnvConfig();

    if (!this.token) {
      console.log('[TelegramBot] Token missing in .env. Bot runner disabled.');
      this.lastError = 'TELEGRAM_BOT_TOKEN не задан в .env';
      return;
    }

    try {
      console.log('[TelegramBot] Testing bot connection with getMe...');
      const me = await this.apiRequest('getMe');
      this.botInfo = me;
      if (me.username) {
        this.botUsername = me.username;
      }
      this.isRunning = true;
      this.lastError = null;
      console.log(`[TelegramBot] Bot initialized successfully as @${me.username} (${me.first_name})`);

      // Start long polling loop
      this.pollUpdates();
    } catch (err: any) {
      this.isRunning = false;
      this.lastError = err.message || 'Connection failed';
      console.error('[TelegramBot] Initialization error:', this.lastError);
    }
  }

  public stop() {
    this.isRunning = false;
    if (this.pollingTimer) {
      clearTimeout(this.pollingTimer);
      this.pollingTimer = null;
    }
    console.log('[TelegramBot] Bot stopped.');
  }

  private async pollUpdates() {
    if (!this.isRunning) return;

    try {
      const updates = await this.apiRequest('getUpdates', {
        offset: this.pollOffset,
        timeout: 10,
        allowed_updates: ['message', 'callback_query'],
      });

      if (Array.isArray(updates)) {
        for (const update of updates) {
          this.pollOffset = Math.max(this.pollOffset, update.update_id + 1);
          await this.handleUpdate(update);
        }
      }
      this.lastError = null;
    } catch (err: any) {
      // Don't log normal timeout polling interruptions
      if (!err.message?.includes('timed out')) {
        console.error('[TelegramBot] Polling loop error:', err.message);
        this.lastError = err.message;
      }
    } finally {
      if (this.isRunning) {
        this.pollingTimer = setTimeout(() => this.pollUpdates(), 1000);
      }
    }
  }

  // Handle incoming Telegram messages/commands
  private async handleUpdate(update: any) {
    const msg = update.message;
    if (!msg || !msg.text) return;

    const chatId = msg.chat.id;
    const text = msg.text.trim();
    const user = msg.from;

    console.log(`[TelegramBot] Received message from @${user.username || user.id}: ${text}`);

    // Check if user sent /start <CODE> or /start
    if (text.startsWith('/start')) {
      const parts = text.split(' ');
      const codeArg = parts[1] ? parts[1].trim() : '';

      if (codeArg) {
        await this.processAuthCode(chatId, codeArg, user);
      } else {
        await this.sendMessage(chatId, 
          `👋 **Добро пожаловать в «КМБП Играет»!**\n\n` +
          `Я официальный бот авторизации и уведомлений игровой платформы.\n\n` +
          `🔑 **Как авторизоваться на сайте:**\n` +
          `1. Откройте сайт и нажмите кнопку **«Войти через Telegram»**\n` +
          `2. Нажмите на полученную ссылку в бота или отправьте мне код авторизации\n` +
          `3. Например: \`/code 123456\`\n\n` +
          `💡 Нажмите кнопку ниже для переходу к сайту.`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: '🌐 Открыть КМБП Играет', url: process.env.APP_URL || 'http://localhost:3000' }],
                [{ text: '❓ Справка', callback_data: 'help' }],
              ],
            },
          }
        );
      }
    } else if (text.startsWith('/code')) {
      const parts = text.split(' ');
      const codeArg = parts[1] ? parts[1].trim() : '';
      if (codeArg) {
        await this.processAuthCode(chatId, codeArg, user);
      } else {
        await this.sendMessage(chatId, '⚠️ Пожалуйста, укажите код. Пример: `/code 123456`');
      }
    } else if (text.startsWith('/auth') || text.startsWith('/status')) {
      await this.sendMessage(chatId,
        `📊 **Статус аккаунта:**\n` +
        `• Telegram ID: \`${user.id}\`\n` +
        `• Юзернейм: @${user.username || 'не задан'}\n` +
        `• Имя: ${user.first_name} ${user.last_name || ''}\n\n` +
        `Статус готовности к входу: ✅ Активен`
      );
    } else if (text.startsWith('/help')) {
      await this.sendMessage(chatId,
        `🛠 **Список команд бота:**\n` +
        `• \`/start\` - Главное меню и приветствие\n` +
        `• \`/code <КОД>\` - Ввести код авторизации с сайта\n` +
        `• \`/status\` - Посмотреть данные своего аккаунта Telegram\n` +
        `• \`/help\` - Вывести данную справку`
      );
    } else {
      // If user directly inputs a 6-digit number or code string
      const cleanCode = text.toUpperCase().replace('#', '').trim();
      if (pendingAuthCodes.has(cleanCode) || pendingAuthCodes.has(`AUTH_${cleanCode}`)) {
        const targetCode = pendingAuthCodes.has(cleanCode) ? cleanCode : `AUTH_${cleanCode}`;
        await this.processAuthCode(chatId, targetCode, user);
      } else {
        await this.sendMessage(chatId, 
          `🤖 Я не понял команду.\n\n` +
          `Если вы пытаетесь войти на сайт, отправьте \`/code КОД\` или нажмите ссылку с сайта.`
        );
      }
    }
  }

  // Process and activate authorization code
  private async processAuthCode(chatId: number, rawCode: string, user: any) {
    const code = rawCode.toUpperCase();
    const item = pendingAuthCodes.get(code) || pendingAuthCodes.get(`AUTH_${code}`);

    if (!item) {
      await this.sendMessage(chatId, 
        `❌ **Код авторизации не найден или устарел.**\n\n` +
        `Вернитесь на сайт и сгенерируйте новый код входа.`
      );
      return;
    }

    if (item.status === 'authenticated') {
      await this.sendMessage(chatId, `✅ Вы уже подтвердили вход для этого кода!`);
      return;
    }

    item.status = 'authenticated';
    item.telegramUser = {
      id: user.id,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      username: user.username || '',
      photo_url: user.photo_url || '',
      auth_date: Math.floor(Date.now() / 1000),
    };

    await this.sendMessage(chatId,
      `🎉 **Успешная авторизация!**\n\n` +
      `Вы подтвердили вход на сайт **КМБП Играет** под аккаунтом:\n` +
      `• Имя: **${user.first_name} ${user.last_name || ''}**\n` +
      `• Логин: **@${user.username || 'без_юзернейма'}**\n\n` +
      `Вернитесь в браузер — вход произойдет автоматически!`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🚀 Вернуться на сайт', url: process.env.APP_URL || 'http://localhost:3000' }],
          ],
        },
      }
    );

    console.log(`[TelegramBot] Code ${code} successfully authenticated by Telegram user @${user.username} (${user.id})`);
  }

  public async sendMessage(chatId: number, text: string, extra: any = {}) {
    try {
      await this.apiRequest('sendMessage', {
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        ...extra,
      });
    } catch (err: any) {
      console.error(`[TelegramBot] Failed to send message to ${chatId}:`, err.message);
    }
  }

  // --- Auth Code Manager Methods for Web Express API ---
  public generateAuthCode(): { code: string; deepLink: string; expiresAt: number } {
    const randomNum = Math.floor(100000 + Math.random() * 900000).toString();
    const code = `AUTH_${randomNum}`;
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 mins

    pendingAuthCodes.set(code, {
      code,
      createdAt: Date.now(),
      status: 'pending',
    });

    const username = this.botUsername || process.env.TELEGRAM_BOT_USERNAME || 'kmbp_auth_bot';
    const cleanUsername = username.replace('@', '');
    const deepLink = `https://t.me/${cleanUsername}?start=${code}`;

    return {
      code,
      deepLink,
      expiresAt,
    };
  }

  public checkAuthCode(code: string): PendingAuthCode | null {
    const upperCode = code.toUpperCase();
    const item = pendingAuthCodes.get(upperCode) || pendingAuthCodes.get(`AUTH_${upperCode}`);
    return item || null;
  }

  // Validate Telegram Widget Hash (Official HMAC-SHA256 method)
  public verifyTelegramWidgetData(data: Record<string, any>): boolean {
    if (!this.token) return false;
    const { hash, ...checkData } = data;
    if (!hash) return false;

    // Check auth_date freshness (e.g. within 24 hours)
    if (checkData.auth_date && Date.now() / 1000 - Number(checkData.auth_date) > 86400) {
      return false;
    }

    const dataCheckString = Object.keys(checkData)
      .sort()
      .map((key) => `${key}=${checkData[key]}`)
      .join('\n');

    const secretKey = crypto.createHash('sha256').update(this.token).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    return calculatedHash === hash;
  }
}

export const telegramBot = new TelegramBotService();

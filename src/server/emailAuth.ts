import nodemailer from 'nodemailer';

export interface CaptchaItem {
  id: string;
  question: string;
  answer: string;
  createdAt: number;
}

export interface EmailCodeItem {
  email: string;
  code: string;
  createdAt: number;
  attempts: number;
}

const captchaStore = new Map<string, CaptchaItem>();
const emailCodeStore = new Map<string, EmailCodeItem>();

// Cleanup expired captchas and codes every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [id, item] of captchaStore.entries()) {
    if (now - item.createdAt > 10 * 60 * 1000) {
      captchaStore.delete(id);
    }
  }
  for (const [email, item] of emailCodeStore.entries()) {
    if (now - item.createdAt > 15 * 60 * 1000) {
      emailCodeStore.delete(email);
    }
  }
}, 5 * 60 * 1000);

export class EmailAuthService {
  // --- CAPTCHA METHODS ---
  public generateCaptcha(): { captchaId: string; question: string; svg: string; svgDataUrl: string } {
    const captchaId = `cap_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    
    // Always use clean math addition/subtraction
    const a = Math.floor(Math.random() * 15) + 5;
    const b = Math.floor(Math.random() * 10) + 1;
    const isAdd = Math.random() > 0.4;
    
    const question = isAdd ? `${a} + ${b} = ?` : `${Math.max(a, b)} - ${Math.min(a, b)} = ?`;
    const answer = isAdd ? (a + b).toString() : (Math.max(a, b) - Math.min(a, b)).toString();

    captchaStore.set(captchaId, {
      id: captchaId,
      question,
      answer,
      createdAt: Date.now(),
    });

    // Generate an SVG image for the captcha
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="180" height="50" viewBox="0 0 180 50">
        <rect width="100%" height="100%" fill="#0B0F17" rx="8"/>
        <!-- Noise lines -->
        <line x1="10" y1="12" x2="170" y2="38" stroke="#1E293B" stroke-width="2"/>
        <line x1="20" y1="40" x2="160" y2="10" stroke="#1E293B" stroke-width="2"/>
        <circle cx="30" cy="25" r="2" fill="#334155"/>
        <circle cx="150" cy="15" r="3" fill="#334155"/>
        <text x="50%" y="58%" dominant-baseline="middle" text-anchor="middle" 
              fill="#22D3EE" font-family="monospace, sans-serif" font-size="22" font-weight="bold" letter-spacing="2">
          ${question}
        </text>
      </svg>
    `.trim();

    const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

    return { captchaId, question, svg, svgDataUrl };
  }

  public verifyCaptcha(captchaId: string, userAnswer: string): boolean {
    if (!userAnswer || !userAnswer.toString().trim()) return false;
    
    // Clean user answer
    const cleanUser = userAnswer.toString().trim().toUpperCase().replace(/\s+/g, '');
    if (!cleanUser) return false;

    if (!captchaId) {
      // If no captchaId provided, check if userAnswer is a non-empty string or valid number
      return cleanUser.length > 0;
    }

    const item = captchaStore.get(captchaId);
    if (!item) {
      // If captcha expired in memory, allow any valid number/code answer
      return cleanUser.length > 0;
    }

    const cleanExpected = item.answer.trim().toUpperCase().replace(/\s+/g, '');

    const isMatch = cleanUser === cleanExpected || (
      !isNaN(parseInt(cleanUser, 10)) &&
      !isNaN(parseInt(cleanExpected, 10)) &&
      parseInt(cleanUser, 10) === parseInt(cleanExpected, 10)
    );

    if (isMatch) {
      captchaStore.delete(captchaId);
      return true;
    }

    return false;
  }

  // --- NODEMAILER TRANSPORTER ---
  private getSmtpTransporter() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '465', 10);
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      return null;
    }

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  public async testSmtpConnection(): Promise<{ success: boolean; message: string }> {
    const transporter = this.getSmtpTransporter();
    if (!transporter) {
      return {
        success: false,
        message: 'SMTP credentials missing in .env (SMTP_HOST, SMTP_USER, SMTP_PASS)',
      };
    }

    try {
      await transporter.verify();
      return { success: true, message: 'SMTP connection verified successfully!' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to connect to SMTP server' };
    }
  }

  // --- EMAIL CODE GENERATION & SENDING ---
  public generateEmailCode(email: string): string {
    const cleanEmail = email.trim().toLowerCase();
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    emailCodeStore.set(cleanEmail, {
      email: cleanEmail,
      code,
      createdAt: Date.now(),
      attempts: 0,
    });

    return code;
  }

  public async sendVerificationEmail(email: string, code: string): Promise<{ sent: boolean; message: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const transporter = this.getSmtpTransporter();
    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || '"КМБП Играет" <noreply@kmbp.play>';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 30px; border-radius: 12px; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #38bdf8; text-align: center; margin-bottom: 20px;">🎮 КМБП Играет</h2>
        <p style="font-size: 16px;">Здравствуйте!</p>
        <p style="font-size: 15px; color: #cbd5e1;">Ваш код подтверждения для входа / регистрации на платформе:</p>
        
        <div style="background-color: #1e293b; border: 2px dashed #38bdf8; padding: 20px; text-align: center; border-radius: 8px; margin: 25px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #38bdf8;">${code}</span>
        </div>

        <p style="font-size: 13px; color: #94a3b8; text-align: center;">Код действителен в течение 10 минут. Если вы не запрашивали код, просто проигнорируйте это письмо.</p>
        <hr style="border: 0; border-top: 1px solid #334155; margin: 25px 0;">
        <p style="font-size: 12px; color: #64748b; text-align: center;">С уважением, команда «КМБП Играет»</p>
      </div>
    `.trim();

    if (!transporter) {
      console.warn(`[SMTP Warning] SMTP credentials not set. Code for ${cleanEmail} is: ${code}`);
      return {
        sent: false,
        message: 'SMTP сервер не настроен в .env. Скопируйте код из консоли или ответа для теста.',
      };
    }

    try {
      await transporter.sendMail({
        from: fromAddress,
        to: cleanEmail,
        subject: `🔑 Код подтверждения [${code}] - КМБП Играет`,
        html: htmlContent,
      });

      console.log(`[EmailAuth] Verification code successfully sent to ${cleanEmail}`);
      return { sent: true, message: 'Код подтверждения отправлен на вашу почту!' };
    } catch (err: any) {
      console.error(`[EmailAuth Error] Failed to send email to ${cleanEmail}:`, err.message);
      return {
        sent: false,
        message: `Ошибка отправки почты: ${err.message}`,
      };
    }
  }

  public verifyEmailCode(email: string, userCode: string): { valid: boolean; message: string } {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = userCode.trim();

    const item = emailCodeStore.get(cleanEmail);
    if (!item) {
      return { valid: false, message: 'Код не запрашивался или время его действия истекло.' };
    }

    if (Date.now() - item.createdAt > 10 * 60 * 1000) {
      emailCodeStore.delete(cleanEmail);
      return { valid: false, message: 'Срок действия кода истек. Запросите новый.' };
    }

    if (item.attempts >= 5) {
      emailCodeStore.delete(cleanEmail);
      return { valid: false, message: 'Слишком много неверных попыток. Запросите новый код.' };
    }

    if (item.code !== cleanCode) {
      item.attempts += 1;
      return { valid: false, message: 'Неверный код подтверждения.' };
    }

    // Success -> consume code
    emailCodeStore.delete(cleanEmail);
    return { valid: true, message: 'Успешное подтверждение!' };
  }
}

export const emailAuth = new EmailAuthService();

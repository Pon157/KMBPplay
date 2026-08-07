import React, { useState, useEffect } from 'react';
import {
  Gamepad2,
  Lock,
  Mail,
  UserCheck,
  Send,
  Upload,
  Bot,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1563089145-599997674d42?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
];

export const AuthView: React.FC = () => {
  const {
    user,
    onboardingStep,
    login,
    register,
    resetPassword,
    sendEmailCode,
    loginWithEmailCode,
    completeNicknameStep,
    completeTelegramStep,
    completeAvatarStep,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
  const [authMethod, setAuthMethod] = useState<'password' | 'email_code'>('password');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nicknameInput, setNicknameInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [telegramInput, setTelegramInput] = useState('');
  const [avatarUrlInput, setAvatarUrlInput] = useState(PRESET_AVATARS[0]);

  // Email Code + Captcha states
  const [captchaData, setCaptchaData] = useState<{ id: string; svg: string; question: string } | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [debugCode, setDebugCode] = useState<string | undefined>(undefined);

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch captcha when switching to email_code method
  const fetchCaptcha = async () => {
    try {
      const res = await fetch('/api/auth/captcha');
      if (res.ok) {
        const data = await res.json();
        setCaptchaData(data);
        setCaptchaAnswer('');
      }
    } catch (e) {
      console.error('Failed to load captcha:', e);
    }
  };

  useEffect(() => {
    if (authMethod === 'email_code' && !captchaData) {
      fetchCaptcha();
    }
  }, [authMethod]);

  // Handle Email Code request
  const handleSendEmailCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email || !email.includes('@')) {
      setError('Укажите корректный адрес электронной почты');
      return;
    }
    if (!captchaAnswer || !captchaData) {
      setError('Решите математическую капчу');
      return;
    }

    setLoading(true);
    const result = await sendEmailCode(email, captchaData.id, captchaAnswer);
    setLoading(false);

    if (result.success) {
      setCodeSent(true);
      setMessage(result.message);
      if (result.debugCode) {
        setDebugCode(result.debugCode);
      }
    } else {
      setError(result.message);
      fetchCaptcha(); // reload new captcha on error
    }
  };

  // Handle Verify Email Code
  const handleVerifyEmailCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!emailCode || emailCode.length < 6) {
      setError('Введите 6-значный код из письма');
      return;
    }

    setLoading(true);
    const result = await loginWithEmailCode(email, emailCode);
    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Неверный код подтверждения');
    }
  };

  // Submit main auth form (Password method)
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (mode === 'login') {
      const res = await login(email, password);
      if (!res.success) {
        setError(res.error || 'Ошибка входа');
      }
    } else if (mode === 'register') {
      const res = await register(email, password);
      if (!res.success) {
        setError(res.error || 'Ошибка регистрации');
      }
    } else if (mode === 'reset') {
      const res = await resetPassword(email);
      setMessage(res.message || 'Письмо отправлено');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-3xl bg-[#131924]/90 border border-slate-800 p-6 sm:p-8 shadow-2xl text-slate-100 backdrop-blur-xl light:bg-white light:border-slate-200 light:text-slate-900 transition-all">
        
        {/* Header Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 p-0.5 shadow-xl shadow-cyan-500/20 mb-3">
            <div className="w-full h-full bg-[#0B0F17] light:bg-white rounded-[14px] flex items-center justify-center">
              <Gamepad2 className="w-8 h-8 text-cyan-400 light:text-indigo-600 animate-pulse" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wide bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent light:from-indigo-700 light:to-teal-600">
            КМБП ИГРАЕТ
          </h1>
          <p className="text-xs text-slate-400 light:text-slate-500 mt-1">
            Платформа онлайн игр для комьюнити ботов поддержки
          </p>
        </div>

        {/* STEP 0: LOGIN / REGISTER / RESET FORM */}
        {onboardingStep === 'auth' && (
          <div className="space-y-6 animate-fade-in">
            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-900/80 border border-slate-800 light:bg-slate-100 light:border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  mode === 'login'
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 light:text-slate-600'
                }`}
              >
                Вход
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  mode === 'register'
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 light:text-slate-600'
                }`}
              >
                Регистрация
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('reset');
                  setError('');
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  mode === 'reset'
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 light:text-slate-600'
                }`}
              >
                Сброс
              </button>
            </div>

            {/* Method Switcher: Password vs Email Code + Captcha */}
            <div className="flex items-center justify-center gap-2 pb-1 border-b border-slate-800/80 text-xs">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('password');
                  setError('');
                  setMessage('');
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  authMethod === 'password'
                    ? 'bg-slate-800 text-cyan-400 font-bold border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🔑 Вход по паролю
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('email_code');
                  setError('');
                  setMessage('');
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  authMethod === 'email_code'
                    ? 'bg-slate-800 text-cyan-400 font-bold border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ✉️ Код на Email + Капча
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                <Check className="w-4 h-4 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            {/* OPTION A: PASSWORD AUTH */}
            {authMethod === 'password' && (
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 light:text-slate-700 mb-1.5">
                    Электронная Почта (Email)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="bot_user@kmbp.play"
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 light:bg-slate-50 light:border-slate-300 light:text-slate-900"
                    />
                  </div>
                </div>

                {mode !== 'reset' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 light:text-slate-700 mb-1.5">
                      Пароль
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 light:bg-slate-50 light:border-slate-300 light:text-slate-900"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 text-white shadow-lg shadow-cyan-500/25 hover:opacity-95 transition-opacity flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span>Загрузка...</span>
                  ) : (
                    <>
                      <span>
                        {mode === 'login' && 'Войти в КМБП'}
                        {mode === 'register' && 'Зарегистрироваться'}
                        {mode === 'reset' && 'Восстановить Пароль'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* OPTION B: REAL EMAIL CODE + CAPTCHA AUTH */}
            {authMethod === 'email_code' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 light:text-slate-700 mb-1.5">
                    Электронная Почта (Email)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your_email@domain.com"
                      required
                      disabled={codeSent}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500 light:bg-slate-50 light:border-slate-300 light:text-slate-900 disabled:opacity-60"
                    />
                  </div>
                </div>

                {!codeSent ? (
                  <form onSubmit={handleSendEmailCode} className="space-y-4">
                    {/* Captcha Box */}
                    <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 light:bg-slate-50 light:border-slate-300">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-300 light:text-slate-700 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-cyan-400" />
                          Проверка от роботов (Капча)
                        </span>
                        <button
                          type="button"
                          onClick={fetchCaptcha}
                          className="text-[11px] text-cyan-400 hover:underline"
                        >
                          Обновить
                        </button>
                      </div>

                      {captchaData ? (
                        <div className="flex items-center gap-3">
                          <div
                            className="bg-slate-950 p-2 rounded-xl border border-slate-700/80 shrink-0"
                            dangerouslySetInnerHTML={{ __html: captchaData.svg }}
                          />
                          <input
                            type="number"
                            value={captchaAnswer}
                            onChange={(e) => setCaptchaAnswer(e.target.value)}
                            placeholder="Ответ = ?"
                            required
                            className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-cyan-300 font-bold text-center text-base focus:outline-none focus:border-cyan-500"
                          />
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 animate-pulse py-2">Загрузка капчи...</div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !email || !captchaAnswer}
                      className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 text-white shadow-lg shadow-cyan-500/25 hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>{loading ? 'Отправка...' : 'Отправить 6-значный код на Email'}</span>
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyEmailCode} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-cyan-400 mb-1.5 flex items-center justify-between">
                        <span>Введите 6-значный код из письма</span>
                        {debugCode && (
                          <span className="text-[10px] bg-cyan-950/80 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800 font-mono">
                            Тест-код: {debugCode}
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-cyan-400" />
                        <input
                          type="text"
                          maxLength={6}
                          value={emailCode}
                          onChange={(e) => setEmailCode(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="123456"
                          required
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border-2 border-cyan-500/80 text-cyan-300 font-mono font-bold tracking-widest text-center text-lg focus:outline-none focus:border-cyan-400 light:bg-white light:text-slate-900"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || emailCode.length < 6}
                      className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 text-white shadow-lg shadow-emerald-500/25 hover:opacity-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>{loading ? 'Проверка...' : 'Подтвердить код и войти'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCodeSent(false);
                        setEmailCode('');
                        fetchCaptcha();
                      }}
                      className="w-full py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      ← Изменить Email или отправить код заново
                    </button>
                  </form>
                )}
              </div>
            )}

            <div className="text-center text-[11px] text-slate-500">
              Демо-вход администратора: <code className="text-cyan-400">admin@kmbp.play</code> / любая комбинация
            </div>
          </div>
        )}

        {/* STEP 1: NICKNAME & USERNAME SELECTION */}
        {onboardingStep === 'nickname' && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <UserCheck className="w-5 h-5" />
              <span>Шаг 1 из 3: Заполнение Личности</span>
            </div>
            <p className="text-xs text-slate-400 light:text-slate-500">
              Укажите ваше имя (Никнейм) и уникальный юзернейм на платформе КМБП.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 light:text-slate-700 mb-1">
                  Никнейм на платформе
                </label>
                <input
                  type="text"
                  value={nicknameInput}
                  onChange={(e) => setNicknameInput(e.target.value)}
                  placeholder="БотПоддержки_01"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 light:bg-slate-50 light:border-slate-300 light:text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 light:text-slate-700 mb-1">
                  Уникальный Юзернейм (@handle)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-500 font-mono text-sm">@</span>
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="bot_support_01"
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 light:bg-slate-50 light:border-slate-300 light:text-slate-900"
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={!nicknameInput || !usernameInput}
                onClick={() => completeNicknameStep(nicknameInput, usernameInput)}
                className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span>Далее: Авторизация Telegram</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: TELEGRAM BOT AUTHORIZATION & PROXY */}
        {onboardingStep === 'telegram' && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <Bot className="w-5 h-5" />
              <span>Шаг 2 из 3: Авторизация через Telegram Бота</span>
            </div>
            <p className="text-xs text-slate-400 light:text-slate-500">
              Привяжите ваш Telegram аккаунт с использованием бота <b>@KMBPGameBot</b> и зашифрованного прокси.
            </p>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 light:bg-slate-50 light:border-slate-200">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Telegram Бот:</span>
                <span className="font-mono text-cyan-400 font-bold">@KMBPGameBot</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Статус Прокси (SOCKS5):</span>
                <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Активен (185.220.101.4:1080)
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 light:text-slate-700 mb-1">
                Ваш Telegram Юзернейм
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-500 font-mono text-sm">@</span>
                <input
                  type="text"
                  value={telegramInput}
                  onChange={(e) => setTelegramInput(e.target.value.replace('@', ''))}
                  placeholder="telegram_user"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 light:bg-slate-50 light:border-slate-300 light:text-slate-900"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={!telegramInput}
              onClick={() => completeTelegramStep(telegramInput)}
              className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/25 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Подтвердить через @KMBPGameBot</span>
            </button>
          </div>
        )}

        {/* STEP 3: AVATAR SELECTION */}
        {onboardingStep === 'avatar' && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <Sparkles className="w-5 h-5" />
              <span>Шаг 3 из 3: Установка Аватарки</span>
            </div>
            <p className="text-xs text-slate-400 light:text-slate-500">
              Выберите понравившуюся аватарку или укажите ссылку на изображение S3.
            </p>

            {/* Selected Avatar Preview */}
            <div className="flex flex-col items-center justify-center py-2">
              <img
                src={avatarUrlInput}
                alt="Selected Avatar"
                className="w-24 h-24 rounded-2xl object-cover border-2 border-cyan-400 shadow-xl shadow-cyan-500/20 mb-2"
              />
              <span className="text-xs text-cyan-400 font-semibold">Выбранный аватар</span>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-6 gap-2">
              {PRESET_AVATARS.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setAvatarUrlInput(url)}
                  className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                    avatarUrlInput === url
                      ? 'border-cyan-400 scale-105 shadow-md shadow-cyan-500/30'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt={`Preset ${i}`} className="w-full h-12 object-cover" />
                </button>
              ))}
            </div>

            {/* Custom S3 image URL */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 light:text-slate-700 mb-1">
                Или укажите прямую ссылку (S3 / URL)
              </label>
              <input
                type="text"
                value={avatarUrlInput}
                onChange={(e) => setAvatarUrlInput(e.target.value)}
                placeholder="https://s3.yandexcloud.net/..."
                className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 light:bg-slate-50 light:border-slate-300 light:text-slate-900"
              />
            </div>

            <button
              type="button"
              onClick={() => completeAvatarStep(avatarUrlInput)}
              className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 text-white shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
            >
              <span>Завершить и войти в главное меню</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

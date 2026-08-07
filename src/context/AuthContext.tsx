import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, LoginSecurityLog } from '../types';

export type OnboardingStep = 'auth' | 'nickname' | 'telegram' | 'avatar' | 'complete';

export const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1563089145-599997674d42?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
];

interface AuthContextType {
  user: User | null;
  onboardingStep: OnboardingStep;
  setOnboardingStep: (step: OnboardingStep) => void;
  securityLogs: LoginSecurityLog[];
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; message?: string }>;
  sendEmailCode: (email: string, captchaId: string, captchaAnswer: string) => Promise<{ success: boolean; message: string; debugCode?: string }>;
  loginWithEmailCode: (email: string, code: string, nickname?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithTelegramUser: (userData: Partial<User>) => void;
  completeNicknameStep: (nickname: string, username: string) => void;
  completeTelegramStep: (telegramUsername: string) => void;
  completeAvatarStep: (avatarUrl: string) => void;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  addSecurityLog: (action: LoginSecurityLog['action'], details: string, status?: LoginSecurityLog['status']) => void;
  triggerCaptcha: boolean;
  setTriggerCaptcha: (val: boolean) => void;
}

const DEFAULT_USERS: User[] = [
  {
    id: 'user-admin-1',
    email: 'admin@kmbp.play',
    nickname: 'КМБП_Главный_Админ',
    username: 'kmbp_owner',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    bio: 'Главный администратор игровой платформы комьюнити ботов поддержки КМБП. По вопросам обращаться в ЛС.',
    role: 'admin',
    createdAt: new Date().toISOString(),
    isOnline: true,
    lastActive: new Date().toISOString(),
    telegramUsername: 'kmbp_support_bot',
    telegramVerified: true,
    ipAddress: '185.220.101.4',
    isBanned: false,
    friends: ['user-2', 'user-3'],
  },
  {
    id: 'user-2',
    email: 'support_bot1@kmbp.play',
    nickname: 'БотПоддержки_Альфа',
    username: 'bot_alpha',
    avatar: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=150&auto=format&fit=crop&q=80',
    bio: 'Бот автоматической технической поддержки. Играю в шахматы и викторину.',
    role: 'user',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    isOnline: true,
    lastActive: new Date().toISOString(),
    telegramUsername: 'bot_alpha_tg',
    telegramVerified: true,
    ipAddress: '194.28.172.10',
    isBanned: false,
    friends: ['user-admin-1'],
  },
  {
    id: 'user-3',
    email: 'gamer_bot@kmbp.play',
    nickname: 'Кибер_Бот_КМБП',
    username: 'cyber_bot_km',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bio: 'Специалист по турнирам и шашкам.',
    role: 'user',
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    isOnline: false,
    lastActive: new Date(Date.now() - 3600000 * 2).toISOString(),
    telegramUsername: 'cyber_bot_tg',
    telegramVerified: false,
    ipAddress: '91.200.12.55',
    isBanned: false,
    friends: ['user-admin-1'],
  }
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('kmbp_auth_user');
    return saved ? JSON.parse(saved) : DEFAULT_USERS[0]; // Default logged in as Admin for full experience preview
  });

  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>(() => {
    const saved = localStorage.getItem('kmbp_auth_user');
    if (!saved) return 'auth';
    const parsedUser: User = JSON.parse(saved);
    if (!parsedUser.nickname) return 'nickname';
    if (!parsedUser.telegramVerified) return 'telegram';
    if (!parsedUser.avatar) return 'avatar';
    return 'complete';
  });

  const [securityLogs, setSecurityLogs] = useState<LoginSecurityLog[]>(() => {
    const saved = localStorage.getItem('kmbp_security_logs');
    return saved ? JSON.parse(saved) : [
      {
        id: 'log-1',
        userId: 'user-admin-1',
        timestamp: new Date().toISOString(),
        ipAddress: '185.220.101.4',
        device: 'Chrome / Linux Cloud Run',
        action: 'login',
        status: 'success',
        details: 'Успешная авторизация в платформе КМБП',
      },
      {
        id: 'log-2',
        userId: 'user-admin-1',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        ipAddress: '185.220.101.4',
        device: 'Telegram Bot Auth',
        action: 'telegram_linked',
        status: 'success',
        details: 'Привязка Telegram аккаунта @kmbp_support_bot через прокси',
      }
    ];
  });

  const [triggerCaptcha, setTriggerCaptcha] = useState<boolean>(false);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);

  useEffect(() => {
    if (user) {
      localStorage.setItem('kmbp_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('kmbp_auth_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('kmbp_security_logs', JSON.stringify(securityLogs));
  }, [securityLogs]);

  const addSecurityLog = (
    action: LoginSecurityLog['action'],
    details: string,
    status: LoginSecurityLog['status'] = 'success'
  ) => {
    if (!user) return;
    const newLog: LoginSecurityLog = {
      id: `log-${Date.now()}`,
      userId: user.id,
      timestamp: new Date().toISOString(),
      ipAddress: user.ipAddress || '185.220.101.4',
      device: navigator.userAgent.includes('Mobile') ? 'Mobile Web Browser' : 'Desktop Browser',
      action,
      status,
      details,
    };
    setSecurityLogs((prev) => [newLog, ...prev.slice(0, 49)]);
  };

  const login = async (email: string, pass: string) => {
    if (failedAttempts >= 2) {
      setTriggerCaptcha(true);
    }

    if (!email || !pass) {
      return { success: false, error: 'Заполните адрес электронной почты и пароль' };
    }

    // Check existing or default demo users
    const found = DEFAULT_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      if (found.isBanned) {
        return { success: false, error: `Ваш аккаунт заблокирован! Причина: ${found.banReason || 'Нарушение правил'}` };
      }
      setUser(found);
      setFailedAttempts(0);
      setOnboardingStep('complete');
      
      const newLog: LoginSecurityLog = {
        id: `log-${Date.now()}`,
        userId: found.id,
        timestamp: new Date().toISOString(),
        ipAddress: '185.220.101.4',
        device: 'Chrome / Desktop',
        action: 'login',
        status: 'success',
        details: `Успешный вход пользователя ${found.nickname}`,
      };
      setSecurityLogs((prev) => [newLog, ...prev]);

      return { success: true };
    }

    // Create or simulate custom login
    setFailedAttempts((prev) => prev + 1);
    return { success: false, error: 'Неверный адрес электронной почты или пароль' };
  };

  const register = async (email: string, pass: string) => {
    if (!email || !pass) {
      return { success: false, error: 'Укажите почту и пароль' };
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      email,
      nickname: '',
      username: '',
      avatar: '',
      bio: '',
      role: 'user',
      createdAt: new Date().toISOString(),
      isOnline: true,
      lastActive: new Date().toISOString(),
      telegramVerified: false,
      ipAddress: '185.220.101.4',
      isBanned: false,
      friends: [],
    };

    setUser(newUser);
    setOnboardingStep('nickname');
    return { success: true };
  };

  const resetPassword = async (email: string) => {
    if (!email) {
      return { success: false, message: 'Укажите адрес электронной почты' };
    }
    return {
      success: true,
      message: `Ссылка для восстановления пароля отправлена на почту ${email}`,
    };
  };

  const sendEmailCode = async (email: string, captchaId: string, captchaAnswer: string) => {
    try {
      const response = await fetch('/api/auth/send-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, captchaId, captchaAnswer }),
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, message: data.error || 'Ошибка отправки кода' };
      }
      return { success: true, message: data.message, debugCode: data.debugCode };
    } catch (err: any) {
      return { success: false, message: err.message || 'Ошибка сети при отправке письма' };
    }
  };

  const loginWithEmailCode = async (email: string, code: string, nickname?: string) => {
    try {
      const response = await fetch('/api/auth/verify-email-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, nickname }),
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Ошибка проверки кода' };
      }

      if (data.user) {
        const fullUser: User = {
          id: data.user.id,
          email: data.user.email,
          nickname: data.user.nickname,
          username: data.user.username,
          avatar: data.user.avatar,
          bio: 'Игрок платформы КМБП',
          role: data.user.role || 'user',
          createdAt: new Date().toISOString(),
          isOnline: true,
          lastActive: new Date().toISOString(),
          telegramVerified: Boolean(data.user.telegramVerified),
          telegramUsername: data.user.telegramUsername,
          ipAddress: '185.220.101.4',
          isBanned: false,
          friends: [],
        };

        setUser(fullUser);
        setOnboardingStep('complete');

        const newLog: LoginSecurityLog = {
          id: `log-${Date.now()}`,
          userId: fullUser.id,
          timestamp: new Date().toISOString(),
          ipAddress: '185.220.101.4',
          device: 'Browser Email Auth',
          action: 'login',
          status: 'success',
          details: `Авторизация по Email коду: ${fullUser.email}`,
        };
        setSecurityLogs((prev) => [newLog, ...prev]);

        return { success: true };
      }

      return { success: false, error: 'Пользователь не найден' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Ошибка сервера при авторизации' };
    }
  };

  const loginWithTelegramUser = (userData: Partial<User>) => {
    const fullUser: User = {
      id: userData.id || `tg_${Date.now()}`,
      email: userData.email || `${userData.username || 'tg_user'}@telegram.org`,
      nickname: userData.nickname || userData.username || 'Telegram Пользователь',
      username: userData.username || `tg_${Date.now()}`,
      avatar: userData.avatar || PRESET_AVATARS[0],
      bio: 'Пользователь вошел через Telegram бот КМБП',
      role: 'user',
      createdAt: new Date().toISOString(),
      isOnline: true,
      lastActive: new Date().toISOString(),
      telegramUsername: userData.telegramUsername || userData.username,
      telegramVerified: true,
      ipAddress: '185.220.101.4',
      isBanned: false,
      friends: userData.friends || [],
    };

    setUser(fullUser);
    setOnboardingStep('complete');

    const newLog: LoginSecurityLog = {
      id: `log-${Date.now()}`,
      userId: fullUser.id,
      timestamp: new Date().toISOString(),
      ipAddress: '185.220.101.4',
      device: 'Telegram DeepLink Auth',
      action: 'telegram_linked',
      status: 'success',
      details: `Успешный вход через Telegram Диплинк: @${fullUser.telegramUsername}`,
    };
    setSecurityLogs((prev) => [newLog, ...prev]);
  };

  const completeNicknameStep = (nickname: string, username: string) => {
    if (!user) return;
    const updated = {
      ...user,
      nickname,
      username: username.startsWith('@') ? username.slice(1) : username,
    };
    setUser(updated);
    addSecurityLog('login', `Установлен никнейм: ${nickname} (@${updated.username})`);
    setOnboardingStep('telegram');
  };

  const completeTelegramStep = (telegramUsername: string) => {
    if (!user) return;
    const updated = {
      ...user,
      telegramUsername,
      telegramVerified: true,
    };
    setUser(updated);
    addSecurityLog('telegram_linked', `Авторизация через Telegram бот @KMBPGameBot прошла успешно (@${telegramUsername})`);
    setOnboardingStep('avatar');
  };

  const completeAvatarStep = (avatarUrl: string) => {
    if (!user) return;
    const updated = {
      ...user,
      avatar: avatarUrl,
    };
    setUser(updated);
    addSecurityLog('avatar_change', 'Установлена новая аватарка профиля');
    setOnboardingStep('complete');
  };

  const logout = () => {
    if (user) {
      addSecurityLog('logout', 'Выход из аккаунта КМБП');
    }
    setUser(null);
    setOnboardingStep('auth');
    localStorage.removeItem('kmbp_auth_user');
  };

  const updateProfile = (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        onboardingStep,
        setOnboardingStep,
        securityLogs,
        login,
        register,
        resetPassword,
        sendEmailCode,
        loginWithEmailCode,
        loginWithTelegramUser,
        completeNicknameStep,
        completeTelegramStep,
        completeAvatarStep,
        logout,
        updateProfile,
        addSecurityLog,
        triggerCaptcha,
        setTriggerCaptcha,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

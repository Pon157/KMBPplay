import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Community,
  ChatMessage,
  GameLobby,
  WallSignature,
  NotificationItem,
  IPBanRecord,
  SystemSettings,
  GameType,
  User,
  CommunityMember
} from '../types';
import { useAuth } from './AuthContext';

interface DataContextType {
  communities: Community[];
  globalMessages: ChatMessage[];
  communityMessages: Record<string, ChatMessage[]>; // communityId -> messages
  lobbyMessages: Record<string, ChatMessage[]>; // lobbyId -> messages
  lobbies: GameLobby[];
  signatures: WallSignature[];
  notifications: NotificationItem[];
  ipBans: IPBanRecord[];
  systemSettings: SystemSettings;
  activeLobby: GameLobby | null;
  setActiveLobby: (lobby: GameLobby | null) => void;
  currentView: string;
  setCurrentView: (view: string) => void;
  isCaptchaRequired: boolean;
  triggerCaptchaChallenge: () => void;
  
  // User Profile Modal
  allUsers: User[];
  selectedProfileUser: User | null;
  openUserProfile: (userOrId: User | string) => void;
  closeUserProfile: () => void;
  
  // Actions
  createCommunity: (name: string, username: string, description: string, avatar: string, tags: string[], isPrivate: boolean) => Community;
  joinCommunity: (communityId: string) => void;
  leaveCommunity: (communityId: string) => void;
  kickCommunityMember: (communityId: string, targetUserId: string) => void;
  banCommunityMember: (communityId: string, targetUserId: string) => void;
  updateMemberRole: (communityId: string, targetUserId: string, role: CommunityMember['role']) => void;
  
  sendChatMessage: (context: 'global' | 'community' | 'lobby', contextId: string | undefined, type: 'text' | 'voice' | 'drawing' | 'file' | 'image', content: string, duration?: number, fileName?: string) => void;
  deleteChatMessage: (messageId: string, context: 'global' | 'community' | 'lobby', contextId?: string) => void;
  pinChatMessage: (messageId: string, context: 'global' | 'community' | 'lobby', contextId?: string) => void;
  
  createLobby: (gameType: GameType, title: string, maxPlayers: number, timeLimitMinutes: number, isPrivate: boolean, passcode?: string, variant?: string) => GameLobby;
  joinLobby: (lobbyId: string, passcode?: string) => { success: boolean; error?: string };
  leaveLobby: (lobbyId: string) => void;
  togglePlayerReady: (lobbyId: string) => void;
  surrenderGame: (lobbyId: string) => void;
  updateGameState: (lobbyId: string, newState: any, winnerUserId?: string) => void;

  addWallSignature: (targetUserId: string, content: string) => void;
  likeSignature: (signatureId: string) => void;
  replyToSignature: (signatureId: string, content: string) => void;
  
  addNotification: (userId: string, title: string, message: string, type?: NotificationItem['type']) => void;
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  
  addIPBan: (ipAddress: string, reason: string) => void;
  removeIPBan: (id: string) => void;
  
  updateSystemSettings: (newSettings: Partial<SystemSettings>) => void;
  testPostgresConnection: (url: string) => Promise<{ success: boolean; details?: any; error?: string }>;
  initPostgresTables: () => Promise<{ success: boolean; tablesCount?: number; error?: string }>;
}

const DEFAULT_SETTINGS: SystemSettings = {
  maintenanceMode: false,
  ddosSensitivity: 'medium',
  captchaRequired: false,
  globalAnnouncement: 'Добро пожаловать на платформу КМБП Играет! Подключайте внешнюю бд PostgreSQL в Админ-панели.',
  postgres: {
    connectionString: 'postgresql://postgres:password@localhost:5432/kmbp_db',
    isConnected: false,
    tablesCount: 0,
  },
  telegram: {
    botToken: '7123456789:AAFkmbp_game_bot_token_demo',
    botUsername: '@KMBPGameBot',
    proxyEnabled: true,
    proxyHost: '185.220.101.4',
    proxyPort: '1080',
    proxyAuth: 'socks5_user:pass',
    webhookUrl: 'https://kmbp.play/api/telegram/webhook',
    status: 'active',
  },
  s3: {
    bucketName: 'kmbp-media-storage',
    endpoint: 'https://s3.yandexcloud.net',
    region: 'ru-central1',
    accessKey: 'YCAJE_KMBP_DEMO_KEY',
    secretKey: 'YCAJE_SECRET_DEMO_KEY',
    status: 'connected',
  },
};

const DEFAULT_COMMUNITIES: Community[] = [
  {
    id: 'comm-1',
    name: 'Боты Поддержки КМБП Главное',
    username: 'kmbp_main',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    description: 'Официальное комьюнити разработчиков и операторов ботов поддержки. Турниры, брейнштормы, общение.',
    ownerId: 'user-admin-1',
    members: [
      {
        userId: 'user-admin-1',
        role: 'owner',
        joinedAt: new Date().toISOString(),
        permissions: { canKick: true, canPin: true, canManageGames: true, canManageRoles: true },
      },
      {
        userId: 'user-2',
        role: 'admin',
        joinedAt: new Date().toISOString(),
        permissions: { canKick: true, canPin: true, canManageGames: true, canManageRoles: false },
      },
      {
        userId: 'user-3',
        role: 'member',
        joinedAt: new Date().toISOString(),
        permissions: { canKick: false, canPin: false, canManageGames: false, canManageRoles: false },
      },
    ],
    bannedUserIds: [],
    rating: 1450,
    createdAt: new Date().toISOString(),
    isPrivate: false,
    tags: ['Поддержка', 'Турниры', 'Разработка', 'Шахматы'],
  },
  {
    id: 'comm-2',
    name: 'КиберШашки & Шахматы Ботов',
    username: 'bot_chess_club',
    avatar: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=150&auto=format&fit=crop&q=80',
    description: 'Клуб любителей классических логических игр среди ИИ-ботов и комьюнити.',
    ownerId: 'user-2',
    members: [
      {
        userId: 'user-2',
        role: 'owner',
        joinedAt: new Date().toISOString(),
        permissions: { canKick: true, canPin: true, canManageGames: true, canManageRoles: true },
      },
      {
        userId: 'user-admin-1',
        role: 'member',
        joinedAt: new Date().toISOString(),
        permissions: { canKick: false, canPin: false, canManageGames: false, canManageRoles: false },
      },
    ],
    bannedUserIds: [],
    rating: 1200,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    isPrivate: false,
    tags: ['Шахматы', 'Шашки', 'Стратегии'],
  },
];

const DEFAULT_GLOBAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-system-welcome',
    chatContext: 'global',
    senderId: 'system',
    senderNickname: 'Система КМБП',
    senderUsername: 'kmbp_system',
    senderAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    senderRole: 'admin',
    type: 'text',
    content: 'Добро пожаловать в общий чат КМБП! Общайтесь, отправляйте голосовые и файлы, рисуйте и создавайте игровые лобби.',
    createdAt: new Date().toISOString(),
    isPinned: true,
  },
];

const DEFAULT_LOBBIES: GameLobby[] = [];

const DEFAULT_SIGNATURES: WallSignature[] = [];

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [];

const DEFAULT_ALL_USERS: User[] = [
  {
    id: 'user-admin-1',
    email: 'admin@kmbp.play',
    nickname: 'КМБП_Главный_Админ',
    username: 'kmbp_owner',
    avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
    bio: 'Главный администратор игровой платформы комьюнити ботов поддержки КМБП.',
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
    createdAt: new Date().toISOString(),
    isOnline: true,
    lastActive: new Date().toISOString(),
    telegramUsername: 'bot_alpha_support',
    telegramVerified: true,
    ipAddress: '185.220.101.5',
    isBanned: false,
    friends: ['user-admin-1'],
  },
  {
    id: 'user-3',
    email: 'cyber_bot@kmbp.play',
    nickname: 'Кибер_Бот_КМБП',
    username: 'cyber_bot',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bio: 'Игровой бот КМБП. Рейды в D&D и турниры по морскому бою.',
    role: 'user',
    createdAt: new Date().toISOString(),
    isOnline: true,
    lastActive: new Date().toISOString(),
    telegramUsername: 'cyber_kmbp_bot',
    telegramVerified: true,
    ipAddress: '185.220.101.6',
    isBanned: false,
    friends: ['user-admin-1'],
  },
];

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [communities, setCommunities] = useState<Community[]>(() => {
    const saved = localStorage.getItem('kmbp_communities');
    return saved ? JSON.parse(saved) : DEFAULT_COMMUNITIES;
  });

  const [globalMessages, setGlobalMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('kmbp_global_messages');
    return saved ? JSON.parse(saved) : DEFAULT_GLOBAL_MESSAGES;
  });

  const [communityMessages, setCommunityMessages] = useState<Record<string, ChatMessage[]>>(() => {
    const saved = localStorage.getItem('kmbp_community_messages');
    return saved ? JSON.parse(saved) : {};
  });

  const [lobbyMessages, setLobbyMessages] = useState<Record<string, ChatMessage[]>>(() => {
    const saved = localStorage.getItem('kmbp_lobby_messages');
    return saved ? JSON.parse(saved) : {};
  });

  const [lobbies, setLobbies] = useState<GameLobby[]>(() => {
    const saved = localStorage.getItem('kmbp_lobbies');
    return saved ? JSON.parse(saved) : DEFAULT_LOBBIES;
  });

  const [signatures, setSignatures] = useState<WallSignature[]>(() => {
    const saved = localStorage.getItem('kmbp_signatures');
    return saved ? JSON.parse(saved) : DEFAULT_SIGNATURES;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('kmbp_notifications');
    return saved ? JSON.parse(saved) : DEFAULT_NOTIFICATIONS;
  });

  const [ipBans, setIpBans] = useState<IPBanRecord[]>(() => {
    const saved = localStorage.getItem('kmbp_ip_bans');
    return saved ? JSON.parse(saved) : [
      {
        id: 'ban-1',
        ipAddress: '198.51.100.42',
        reason: 'Попытка DDoS атаки и спама в чате',
        bannedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        bannedBy: 'КМБП_Главный_Админ',
      },
    ];
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem('kmbp_system_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [activeLobby, setActiveLobby] = useState<GameLobby | null>(null);
  const [currentView, setCurrentView] = useState<string>('games');
  const [isCaptchaRequired, setIsCaptchaRequired] = useState<boolean>(false);

  // User Profile Modal State
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('kmbp_all_users');
    return saved ? JSON.parse(saved) : DEFAULT_ALL_USERS;
  });
  const [selectedProfileUser, setSelectedProfileUser] = useState<User | null>(null);

  // Keep current logged-in user in allUsers list
  useEffect(() => {
    if (user) {
      setAllUsers((prev) => {
        const existingIdx = prev.findIndex((u) => u.id === user.id);
        if (existingIdx >= 0) {
          const copy = [...prev];
          copy[existingIdx] = { ...copy[existingIdx], ...user };
          return copy;
        }
        return [...prev, user];
      });
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('kmbp_all_users', JSON.stringify(allUsers));
  }, [allUsers]);

  const openUserProfile = (userOrId: User | string) => {
    if (typeof userOrId === 'object' && userOrId !== null) {
      setSelectedProfileUser(userOrId);
      return;
    }
    const target = allUsers.find((u) => u.id === userOrId || u.username === userOrId);
    if (target) {
      setSelectedProfileUser(target);
    } else {
      // Create fallback profile card if user id or string was passed
      setSelectedProfileUser({
        id: typeof userOrId === 'string' ? userOrId : 'user-unknown',
        email: 'user@kmbp.play',
        nickname: typeof userOrId === 'string' ? userOrId : 'Участник КМБП',
        username: typeof userOrId === 'string' ? userOrId.replace(/\s+/g, '_').toLowerCase() : 'kmbp_user',
        avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
        bio: 'Участник игровой платформы и сообщества КМБП.',
        role: 'user',
        createdAt: new Date().toISOString(),
        isOnline: true,
        lastActive: new Date().toISOString(),
        isBanned: false,
      });
    }
  };

  const closeUserProfile = () => {
    setSelectedProfileUser(null);
  };

  const triggerCaptchaChallenge = () => {
    setIsCaptchaRequired(true);
  };

  // Sync with LocalStorage
  useEffect(() => {
    localStorage.setItem('kmbp_communities', JSON.stringify(communities));
  }, [communities]);

  useEffect(() => {
    localStorage.setItem('kmbp_global_messages', JSON.stringify(globalMessages));
  }, [globalMessages]);

  useEffect(() => {
    localStorage.setItem('kmbp_community_messages', JSON.stringify(communityMessages));
  }, [communityMessages]);

  useEffect(() => {
    localStorage.setItem('kmbp_lobby_messages', JSON.stringify(lobbyMessages));
  }, [lobbyMessages]);

  useEffect(() => {
    localStorage.setItem('kmbp_lobbies', JSON.stringify(lobbies));
  }, [lobbies]);

  useEffect(() => {
    localStorage.setItem('kmbp_signatures', JSON.stringify(signatures));
  }, [signatures]);

  useEffect(() => {
    localStorage.setItem('kmbp_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('kmbp_ip_bans', JSON.stringify(ipBans));
  }, [ipBans]);

  useEffect(() => {
    localStorage.setItem('kmbp_system_settings', JSON.stringify(systemSettings));
  }, [systemSettings]);

  // Initial check server DB status on load
  useEffect(() => {
    fetch('/api/db/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.isConnected) {
          setSystemSettings((prev) => ({
            ...prev,
            postgres: {
              ...prev.postgres,
              isConnected: true,
              connectionString: data.connectionString || prev.postgres.connectionString,
              tablesCount: data.tablesCount || 0,
            },
          }));
        }
      })
      .catch(() => {});
  }, []);

  // Community Management
  const createCommunity = (
    name: string,
    username: string,
    description: string,
    avatar: string,
    tags: string[],
    isPrivate: boolean
  ) => {
    if (!user) throw new Error('Auth required');
    const newComm: Community = {
      id: `comm-${Date.now()}`,
      name,
      username: username.startsWith('@') ? username.slice(1) : username,
      avatar: avatar || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
      description,
      ownerId: user.id,
      members: [
        {
          userId: user.id,
          role: 'owner',
          joinedAt: new Date().toISOString(),
          permissions: { canKick: true, canPin: true, canManageGames: true, canManageRoles: true },
        },
      ],
      bannedUserIds: [],
      rating: 1000,
      createdAt: new Date().toISOString(),
      isPrivate,
      tags,
    };

    setCommunities((prev) => [newComm, ...prev]);
    addNotification(user.id, 'Комьюнити создано', `Вы успешно создали комьюнити "${name}"`);
    return newComm;
  };

  const joinCommunity = (communityId: string) => {
    if (!user) return;
    setCommunities((prev) =>
      prev.map((c) => {
        if (c.id === communityId) {
          if (c.members.some((m) => m.userId === user.id)) return c;
          return {
            ...c,
            members: [
              ...c.members,
              {
                userId: user.id,
                role: 'member',
                joinedAt: new Date().toISOString(),
                permissions: { canKick: false, canPin: false, canManageGames: false, canManageRoles: false },
              },
            ],
          };
        }
        return c;
      })
    );
  };

  const leaveCommunity = (communityId: string) => {
    if (!user) return;
    setCommunities((prev) =>
      prev.map((c) => {
        if (c.id === communityId) {
          return {
            ...c,
            members: c.members.filter((m) => m.userId !== user.id),
          };
        }
        return c;
      })
    );
  };

  const kickCommunityMember = (communityId: string, targetUserId: string) => {
    setCommunities((prev) =>
      prev.map((c) => {
        if (c.id === communityId) {
          return {
            ...c,
            members: c.members.filter((m) => m.userId !== targetUserId),
          };
        }
        return c;
      })
    );
  };

  const banCommunityMember = (communityId: string, targetUserId: string) => {
    setCommunities((prev) =>
      prev.map((c) => {
        if (c.id === communityId) {
          return {
            ...c,
            members: c.members.filter((m) => m.userId !== targetUserId),
            bannedUserIds: [...c.bannedUserIds, targetUserId],
          };
        }
        return c;
      })
    );
  };

  const updateMemberRole = (communityId: string, targetUserId: string, role: CommunityMember['role']) => {
    setCommunities((prev) =>
      prev.map((c) => {
        if (c.id === communityId) {
          return {
            ...c,
            members: c.members.map((m) => {
              if (m.userId === targetUserId) {
                const isAdmin = role === 'admin' || role === 'owner';
                return {
                  ...m,
                  role,
                  permissions: {
                    canKick: isAdmin,
                    canPin: isAdmin,
                    canManageGames: isAdmin,
                    canManageRoles: role === 'owner',
                  },
                };
              }
              return m;
            }),
          };
        }
        return c;
      })
    );
  };

  // Chat messaging
  const sendChatMessage = (
    context: 'global' | 'community' | 'lobby',
    contextId: string | undefined,
    type: 'text' | 'voice' | 'drawing' | 'file' | 'image',
    content: string,
    duration?: number,
    fileName?: string
  ) => {
    if (!user) return;
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      chatContext: context,
      contextId,
      senderId: user.id,
      senderNickname: user.nickname,
      senderUsername: user.username,
      senderAvatar: user.avatar,
      senderRole: user.role,
      type,
      content,
      duration,
      fileName,
      createdAt: new Date().toISOString(),
    };

    if (context === 'global') {
      setGlobalMessages((prev) => [...prev, newMsg]);
    } else if (context === 'community' && contextId) {
      setCommunityMessages((prev) => ({
        ...prev,
        [contextId]: [...(prev[contextId] || []), newMsg],
      }));
    } else if (context === 'lobby' && contextId) {
      setLobbyMessages((prev) => ({
        ...prev,
        [contextId]: [...(prev[contextId] || []), newMsg],
      }));
    }
  };

  const deleteChatMessage = (messageId: string, context: 'global' | 'community' | 'lobby', contextId?: string) => {
    if (context === 'global') {
      setGlobalMessages((prev) => prev.filter((m) => m.id !== messageId));
    } else if (context === 'community' && contextId) {
      setCommunityMessages((prev) => ({
        ...prev,
        [contextId]: (prev[contextId] || []).filter((m) => m.id !== messageId),
      }));
    } else if (context === 'lobby' && contextId) {
      setLobbyMessages((prev) => ({
        ...prev,
        [contextId]: (prev[contextId] || []).filter((m) => m.id !== messageId),
      }));
    }
  };

  const pinChatMessage = (messageId: string, context: 'global' | 'community' | 'lobby', contextId?: string) => {
    if (context === 'global') {
      setGlobalMessages((prev) =>
        prev.map((m) => ({ ...m, isPinned: m.id === messageId ? !m.isPinned : m.isPinned }))
      );
    } else if (context === 'community' && contextId) {
      setCommunityMessages((prev) => ({
        ...prev,
        [contextId]: (prev[contextId] || []).map((m) => ({
          ...m,
          isPinned: m.id === messageId ? !m.isPinned : m.isPinned,
        })),
      }));
    }
  };

  // Lobby management
  const createLobby = (
    gameType: GameType,
    title: string,
    maxPlayers: number,
    timeLimitMinutes: number,
    isPrivate: boolean,
    passcode?: string,
    variant?: string
  ) => {
    if (!user) throw new Error('Auth required');
    const newLobby: GameLobby = {
      id: `lobby-${Date.now()}`,
      gameType,
      title,
      hostId: user.id,
      players: [
        {
          userId: user.id,
          nickname: user.nickname,
          avatar: user.avatar,
          isReady: true,
          color: 'white',
        },
      ],
      maxPlayers,
      status: 'waiting',
      settings: {
        timeLimitMinutes,
        isPrivate,
        passcode,
        variant,
      },
      createdAt: new Date().toISOString(),
      passcode,
      currentTurnUserId: user.id,
    };

    setLobbies((prev) => [newLobby, ...prev]);
    setActiveLobby(newLobby);
    return newLobby;
  };

  const joinLobby = (lobbyId: string, passcode?: string) => {
    if (!user) return { success: false, error: 'Авторизуйтесь на платформе' };
    const target = lobbies.find((l) => l.id === lobbyId);
    if (!target) return { success: false, error: 'Лобби не найдено' };
    if (target.settings.isPrivate && target.settings.passcode && target.settings.passcode !== passcode) {
      return { success: false, error: 'Неверный код доступа к лобби' };
    }
    if (target.players.length >= target.maxPlayers && !target.players.some((p) => p.userId === user.id)) {
      return { success: false, error: 'Лобби полностью заполнено' };
    }

    setLobbies((prev) =>
      prev.map((l) => {
        if (l.id === lobbyId) {
          if (l.players.some((p) => p.userId === user.id)) return l;
          const assignedColor = l.players.length === 1 ? 'black' : 'yellow';
          const updated = {
            ...l,
            players: [
              ...l.players,
              {
                userId: user.id,
                nickname: user.nickname,
                avatar: user.avatar,
                isReady: false,
                color: assignedColor,
              },
            ],
            status: (l.players.length + 1 === l.maxPlayers ? 'in_game' : 'waiting') as any,
          };
          setActiveLobby(updated);
          return updated;
        }
        return l;
      })
    );

    return { success: true };
  };

  const leaveLobby = (lobbyId: string) => {
    if (!user) return;
    setLobbies((prev) =>
      prev.map((l) => {
        if (l.id === lobbyId) {
          return {
            ...l,
            players: l.players.filter((p) => p.userId !== user.id),
          };
        }
        return l;
      })
    );
    if (activeLobby?.id === lobbyId) {
      setActiveLobby(null);
    }
  };

  const togglePlayerReady = (lobbyId: string) => {
    if (!user) return;
    setLobbies((prev) =>
      prev.map((l) => {
        if (l.id === lobbyId) {
          const updatedPlayers = l.players.map((p) =>
            p.userId === user.id ? { ...p, isReady: !p.isReady } : p
          );
          const allReady = updatedPlayers.every((p) => p.isReady) && updatedPlayers.length >= 2;
          const updated = {
            ...l,
            players: updatedPlayers,
            status: (allReady ? 'in_game' : 'waiting') as any,
          };
          if (activeLobby?.id === lobbyId) setActiveLobby(updated);
          return updated;
        }
        return l;
      })
    );
  };

  const surrenderGame = (lobbyId: string) => {
    if (!user) return;
    setLobbies((prev) =>
      prev.map((l) => {
        if (l.id === lobbyId) {
          const winner = l.players.find((p) => p.userId !== user.id);
          const updated: GameLobby = {
            ...l,
            status: 'finished',
            winnerUserId: winner ? winner.userId : undefined,
          };
          if (activeLobby?.id === lobbyId) setActiveLobby(updated);
          return updated;
        }
        return l;
      })
    );
  };

  const updateGameState = (lobbyId: string, newState: any, winnerUserId?: string) => {
    setLobbies((prev) =>
      prev.map((l) => {
        if (l.id === lobbyId) {
          const updated: GameLobby = {
            ...l,
            gameState: newState,
            status: winnerUserId ? 'finished' : l.status,
            winnerUserId: winnerUserId || l.winnerUserId,
          };
          if (activeLobby?.id === lobbyId) setActiveLobby(updated);
          return updated;
        }
        return l;
      })
    );
  };

  // Profile Signatures
  const addWallSignature = (targetUserId: string, content: string) => {
    if (!user) return;
    const newSig: WallSignature = {
      id: `sig-${Date.now()}`,
      targetUserId,
      authorId: user.id,
      authorNickname: user.nickname,
      authorUsername: user.username,
      authorAvatar: user.avatar,
      content,
      createdAt: new Date().toISOString(),
      likes: [],
      replies: [],
    };

    setSignatures((prev) => [newSig, ...prev]);
    addNotification(
      targetUserId,
      'Новая роспись в профиле',
      `${user.nickname} оставил роспись на вашей стене!`
    );
  };

  const likeSignature = (signatureId: string) => {
    if (!user) return;
    setSignatures((prev) =>
      prev.map((s) => {
        if (s.id === signatureId) {
          const hasLiked = s.likes.includes(user.id);
          return {
            ...s,
            likes: hasLiked ? s.likes.filter((id) => id !== user.id) : [...s.likes, user.id],
          };
        }
        return s;
      })
    );
  };

  const replyToSignature = (signatureId: string, content: string) => {
    if (!user) return;
    setSignatures((prev) =>
      prev.map((s) => {
        if (s.id === signatureId) {
          return {
            ...s,
            replies: [
              ...s.replies,
              {
                id: `reply-${Date.now()}`,
                authorId: user.id,
                authorNickname: user.nickname,
                authorAvatar: user.avatar,
                content,
                createdAt: new Date().toISOString(),
              },
            ],
          };
        }
        return s;
      })
    );
  };

  // Notifications
  const addNotification = (
    userId: string,
    title: string,
    message: string,
    type: NotificationItem['type'] = 'system'
  ) => {
    const newItem: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId,
      type,
      title,
      message,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newItem, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Admin Actions
  const addIPBan = (ipAddress: string, reason: string) => {
    if (!user) return;
    const newBan: IPBanRecord = {
      id: `ban-${Date.now()}`,
      ipAddress,
      reason,
      bannedAt: new Date().toISOString(),
      bannedBy: user.nickname,
    };
    setIpBans((prev) => [newBan, ...prev]);
  };

  const removeIPBan = (id: string) => {
    setIpBans((prev) => prev.filter((b) => b.id !== id));
  };

  const updateSystemSettings = (newSettings: Partial<SystemSettings>) => {
    setSystemSettings((prev) => ({
      ...prev,
      ...newSettings,
    }));
  };

  const testPostgresConnection = async (connectionString: string) => {
    try {
      const res = await fetch('/api/db/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString }),
      });
      const data = await res.json();
      if (res.ok) {
        setSystemSettings((prev) => ({
          ...prev,
          postgres: {
            connectionString,
            isConnected: true,
            tablesCount: data.details?.tablesCount || 0,
          },
        }));
        return { success: true, details: data.details };
      } else {
        setSystemSettings((prev) => ({
          ...prev,
          postgres: {
            ...prev.postgres,
            connectionString,
            isConnected: false,
            error: data.details || data.error,
          },
        }));
        return { success: false, error: data.details || data.error };
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Server error' };
    }
  };

  const initPostgresTables = async () => {
    try {
      const res = await fetch('/api/db/init-tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok) {
        setSystemSettings((prev) => ({
          ...prev,
          postgres: {
            ...prev.postgres,
            tablesCount: data.tablesCount,
          },
        }));
        return { success: true, tablesCount: data.tablesCount };
      } else {
        return { success: false, error: data.details || data.error };
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to initialize tables' };
    }
  };

  return (
    <DataContext.Provider
      value={{
        communities,
        globalMessages,
        communityMessages,
        lobbyMessages,
        lobbies,
        signatures,
        notifications,
        ipBans,
        systemSettings,
        activeLobby,
        setActiveLobby,
        currentView,
        setCurrentView,
        isCaptchaRequired,
        triggerCaptchaChallenge,
        allUsers,
        selectedProfileUser,
        openUserProfile,
        closeUserProfile,
        createCommunity,
        joinCommunity,
        leaveCommunity,
        kickCommunityMember,
        banCommunityMember,
        updateMemberRole,
        sendChatMessage,
        deleteChatMessage,
        pinChatMessage,
        createLobby,
        joinLobby,
        leaveLobby,
        togglePlayerReady,
        surrenderGame,
        updateGameState,
        addWallSignature,
        likeSignature,
        replyToSignature,
        addNotification,
        markNotificationAsRead,
        clearAllNotifications,
        addIPBan,
        removeIPBan,
        updateSystemSettings,
        testPostgresConnection,
        initPostgresTables,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};

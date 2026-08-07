export type ThemeMode = 'dark' | 'light';

export type UserRole = 'user' | 'moderator' | 'admin' | 'owner';

export interface User {
  id: string;
  email: string;
  nickname: string;
  username: string; // @handle
  avatar: string;
  bio: string;
  role: UserRole;
  createdAt: string;
  isOnline: boolean;
  lastActive: string;
  telegramUsername?: string;
  telegramVerified: boolean;
  ipAddress: string;
  isBanned: boolean;
  banReason?: string;
  friends: string[]; // user IDs
}

export interface LoginSecurityLog {
  id: string;
  userId: string;
  timestamp: string;
  ipAddress: string;
  device: string;
  action: 'login' | 'logout' | 'password_change' | 'avatar_change' | 'telegram_linked' | 'failed_login';
  status: 'success' | 'warning' | 'blocked';
  details: string;
}

export interface WallSignature {
  id: string;
  targetUserId: string; // profile owner
  authorId: string;
  authorNickname: string;
  authorUsername: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
  likes: string[]; // user IDs who liked
  replies: {
    id: string;
    authorId: string;
    authorNickname: string;
    authorAvatar: string;
    content: string;
    createdAt: string;
  }[];
}

export type CommunityRole = 'owner' | 'admin' | 'moderator' | 'member';

export interface CommunityMember {
  userId: string;
  role: CommunityRole;
  joinedAt: string;
  permissions: {
    canKick: boolean;
    canPin: boolean;
    canManageGames: boolean;
    canManageRoles: boolean;
  };
}

export interface Community {
  id: string;
  name: string;
  username: string; // @handle
  avatar: string;
  description: string;
  ownerId: string;
  members: CommunityMember[];
  bannedUserIds: string[];
  rating: number;
  createdAt: string;
  isPrivate: boolean;
  tags: string[];
}

export interface CommunityTournament {
  id: string;
  communityId: string;
  title: string;
  gameType: GameType;
  startDate: string;
  participants: string[]; // user IDs
  prizePool: string;
  status: 'upcoming' | 'active' | 'finished';
  winnerId?: string;
}

export type MessageType = 'text' | 'voice' | 'drawing';

export interface ChatMessage {
  id: string;
  chatContext: 'global' | 'community' | 'lobby';
  contextId?: string; // communityId or lobbyId
  senderId: string;
  senderNickname: string;
  senderUsername: string;
  senderAvatar: string;
  senderRole?: UserRole;
  type: MessageType;
  content: string; // text or audio base64/url or image dataUrl for drawings
  duration?: number; // for voice in seconds
  createdAt: string;
  isPinned?: boolean;
}

export type GameType = 
  | 'chess'
  | 'checkers'
  | 'battleship'
  | 'connect4'
  | 'gomoku'
  | 'dungeon_rpg'
  | 'trivia';

export interface GameSettings {
  timeLimitMinutes: number;
  isPrivate: boolean;
  passcode?: string;
  variant?: string; // e.g. 3x3 or 15x15 for Gomoku, Blitz/Classic for Chess
  fogOfWar?: boolean;
  boardTheme?: string;
}

export interface GameLobby {
  id: string;
  gameType: GameType;
  title: string;
  hostId: string;
  communityId?: string; // if created inside a community
  players: {
    userId: string;
    nickname: string;
    avatar: string;
    isReady: boolean;
    color?: string; // 'white' | 'black' | 'red' | 'yellow' etc.
  }[];
  maxPlayers: number;
  status: 'waiting' | 'in_game' | 'finished';
  settings: GameSettings;
  createdAt: string;
  passcode?: string;
  gameState?: any; // serialized game board/turn state
  currentTurnUserId?: string;
  winnerUserId?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: 'system' | 'community' | 'game' | 'signature' | 'security' | 'friend';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  link?: string;
}

export interface IPBanRecord {
  id: string;
  ipAddress: string;
  reason: string;
  bannedAt: string;
  bannedBy: string;
}

export interface PostgresConfig {
  connectionString: string;
  isConnected: boolean;
  lastTestedAt?: string;
  error?: string;
  tablesCount?: number;
}

export interface TelegramBotConfig {
  botToken: string;
  botUsername: string;
  proxyEnabled: boolean;
  proxyHost: string;
  proxyPort: string;
  proxyAuth: string;
  webhookUrl: string;
  status: 'active' | 'configured' | 'offline';
}

export interface S3Config {
  bucketName: string;
  endpoint: string;
  region: string;
  accessKey: string;
  secretKey: string;
  status: 'connected' | 'unconfigured' | 'error';
}

export interface SystemSettings {
  maintenanceMode: boolean;
  ddosSensitivity: 'low' | 'medium' | 'high';
  captchaRequired: boolean;
  globalAnnouncement?: string;
  postgres: PostgresConfig;
  telegram: TelegramBotConfig;
  s3: S3Config;
}

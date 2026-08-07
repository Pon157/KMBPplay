// PostgreSQL SQL DDL schema statements for "КМБП Играет" platform.
// Can be executed directly in external PostgreSQL database or auto-initialized via server.ts

export const INITIAL_POSTGRES_SCHEMA_SQL = `
-- Create extension for UUID generation if supported
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS kmbp_users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    avatar TEXT,
    bio TEXT,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_online BOOLEAN DEFAULT false,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    telegram_username VARCHAR(100),
    telegram_verified BOOLEAN DEFAULT false,
    ip_address VARCHAR(45),
    is_banned BOOLEAN DEFAULT false,
    ban_reason TEXT
);

-- 2. Login Security Logs
CREATE TABLE IF NOT EXISTS kmbp_login_logs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES kmbp_users(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45) NOT NULL,
    device TEXT,
    action VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    details TEXT
);

-- 3. Profile Wall Signatures
CREATE TABLE IF NOT EXISTS kmbp_wall_signatures (
    id VARCHAR(64) PRIMARY KEY,
    target_user_id VARCHAR(64) REFERENCES kmbp_users(id) ON DELETE CASCADE,
    author_id VARCHAR(64) REFERENCES kmbp_users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    likes_count INT DEFAULT 0
);

-- 4. Communities Table
CREATE TABLE IF NOT EXISTS kmbp_communities (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    avatar TEXT,
    description TEXT,
    owner_id VARCHAR(64) REFERENCES kmbp_users(id) ON DELETE CASCADE,
    rating INT DEFAULT 1000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_private BOOLEAN DEFAULT false,
    tags TEXT[]
);

-- 5. Community Members
CREATE TABLE IF NOT EXISTS kmbp_community_members (
    id SERIAL PRIMARY KEY,
    community_id VARCHAR(64) REFERENCES kmbp_communities(id) ON DELETE CASCADE,
    user_id VARCHAR(64) REFERENCES kmbp_users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    can_kick BOOLEAN DEFAULT false,
    can_pin BOOLEAN DEFAULT false,
    can_manage_games BOOLEAN DEFAULT false,
    can_manage_roles BOOLEAN DEFAULT false,
    UNIQUE(community_id, user_id)
);

-- 6. Chat Messages (Global, Community, Lobby)
CREATE TABLE IF NOT EXISTS kmbp_chat_messages (
    id VARCHAR(64) PRIMARY KEY,
    chat_context VARCHAR(20) NOT NULL, -- 'global', 'community', 'lobby'
    context_id VARCHAR(64),
    sender_id VARCHAR(64) REFERENCES kmbp_users(id) ON DELETE SET NULL,
    message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'voice', 'drawing'
    content TEXT NOT NULL,
    duration INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_pinned BOOLEAN DEFAULT false
);

-- 7. Game Lobbies & History
CREATE TABLE IF NOT EXISTS kmbp_game_lobbies (
    id VARCHAR(64) PRIMARY KEY,
    game_type VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    host_id VARCHAR(64) REFERENCES kmbp_users(id) ON DELETE CASCADE,
    community_id VARCHAR(64) REFERENCES kmbp_communities(id) ON DELETE SET NULL,
    max_players INT DEFAULT 2,
    status VARCHAR(20) DEFAULT 'waiting',
    settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    winner_user_id VARCHAR(64)
);

-- 8. IP Ban List
CREATE TABLE IF NOT EXISTS kmbp_ip_bans (
    id VARCHAR(64) PRIMARY KEY,
    ip_address VARCHAR(45) UNIQUE NOT NULL,
    reason TEXT,
    banned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    banned_by VARCHAR(64)
);

-- 9. System Config Settings
CREATE TABLE IF NOT EXISTS kmbp_system_config (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;

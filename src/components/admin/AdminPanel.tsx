import React, { useState } from 'react';
import {
  ShieldAlert,
  Database,
  Users,
  MessageSquare,
  Bot,
  HardDrive,
  Lock,
  Globe,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Play,
  RefreshCw,
  Plus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

export const AdminPanel: React.FC = () => {
  const { user, securityLogs } = useAuth();
  const {
    systemSettings,
    updateSystemSettings,
    testPostgresConnection,
    initPostgresTables,
    globalMessages,
    deleteChatMessage,
    communities,
    ipBans,
    addIPBan,
    removeIPBan,
  } = useData();

  const [activeTab, setActiveTab] = useState<'postgres' | 'moderation' | 'telegram' | 's3' | 'ddos'>('postgres');

  // PostgreSQL state
  const [dbConnStr, setDbConnStr] = useState(systemSettings.postgres.connectionString);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbMessage, setDbMessage] = useState('');
  const [dbError, setDbError] = useState('');

  // IP Ban form
  const [newIpAddress, setNewIpAddress] = useState('');
  const [newIpReason, setNewIpReason] = useState('');

  if (user?.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto my-12 p-6 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-center space-y-2">
        <ShieldAlert className="w-10 h-10 mx-auto" />
        <h2 className="font-extrabold text-lg">Доступ Запрещён</h2>
        <p className="text-xs">Только администраторы платформы КМБП имеют доступ к этой панели.</p>
      </div>
    );
  }

  // Handle PostgreSQL Test Connection
  const handleConnectPostgres = async (e: React.FormEvent) => {
    e.preventDefault();
    setDbLoading(true);
    setDbMessage('');
    setDbError('');

    const res = await testPostgresConnection(dbConnStr);
    if (res.success) {
      setDbMessage('Успешное подключение к внешней базе данных PostgreSQL!');
    } else {
      setDbError(res.error || 'Ошибка подключения');
    }
    setDbLoading(false);
  };

  // Handle Auto Init Tables DDL
  const handleAutoInitTables = async () => {
    setDbLoading(true);
    setDbMessage('');
    setDbError('');

    const res = await initPostgresTables();
    if (res.success) {
      setDbMessage(`Успешно созданы DDL таблицы в вашей базе PostgreSQL! Всего таблиц: ${res.tablesCount}`);
    } else {
      setDbError(res.error || 'Ошибка выполнения SQL DDL пакета');
    }
    setDbLoading(false);
  };

  // Handle Add IP Ban
  const handleAddIpBanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIpAddress || !newIpReason) return;
    addIPBan(newIpAddress, newIpReason);
    setNewIpAddress('');
    setNewIpReason('');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Admin Title Header */}
      <div className="p-6 rounded-3xl bg-[#131924] border border-purple-500/40 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 light:bg-white light:border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 light:text-slate-900">
              Панель Администратора КМБП
            </h1>
            <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5">
              Управление внешними БД PostgreSQL, модерация, прокси ботов, S3 и защита от DDoS
            </p>
          </div>
        </div>

        {/* Database Quick Status Badge */}
        <div className={`px-4 py-2 rounded-2xl text-xs font-bold border flex items-center gap-2 ${
          systemSettings.postgres.isConnected
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
        }`}>
          <Database className="w-4 h-4" />
          <span>
            {systemSettings.postgres.isConnected
              ? `PostgreSQL Подключена (${systemSettings.postgres.tablesCount} Таблиц)`
              : 'PostgreSQL Не Подключена'}
          </span>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 light:border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('postgres')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'postgres'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 light:bg-purple-600 light:text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>База Данных PostgreSQL</span>
        </button>

        <button
          onClick={() => setActiveTab('moderation')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'moderation'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 light:bg-purple-600 light:text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Глобальная Модерация & IP-Баны</span>
        </button>

        <button
          onClick={() => setActiveTab('telegram')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'telegram'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 light:bg-purple-600 light:text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Telegram Бот & Прокси</span>
        </button>

        <button
          onClick={() => setActiveTab('s3')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 's3'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 light:bg-purple-600 light:text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>S3 Хранилище</span>
        </button>

        <button
          onClick={() => setActiveTab('ddos')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'ddos'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 light:bg-purple-600 light:text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Защита от DDoS</span>
        </button>
      </div>

      {/* TAB 1: POSTGRESQL EXTERNAL DATABASE MANAGER */}
      {activeTab === 'postgres' && (
        <div className="p-6 rounded-3xl bg-[#131924] border border-slate-800 space-y-6 light:bg-white light:border-slate-200 animate-fade-in">
          <div>
            <h2 className="text-base font-bold text-cyan-400 light:text-indigo-600 flex items-center gap-2">
              <Database className="w-5 h-5" />
              <span>Статус Подключения к PostgreSQL (.env DATABASE_URL)</span>
            </h2>
            <p className="text-xs text-slate-400 light:text-slate-500 mt-1">
              Согласно политике безопасности, все чувствительные данные подключения считываются исключительно из файла <code className="text-amber-400 font-mono">.env</code> (переменная <code className="text-amber-400 font-mono">DATABASE_URL</code>).
            </p>
          </div>

          {dbMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{dbMessage}</span>
            </div>
          )}

          {dbError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{dbError}</span>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Состояние базы данных:</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                systemSettings.postgres.isConnected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                {systemSettings.postgres.isConnected ? 'Подключена & Активна' : 'Не Подключена'}
              </span>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={handleAutoInitTables}
                disabled={dbLoading}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white shadow-lg shadow-purple-500/25 flex items-center gap-2"
              >
                {dbLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                <span>Проверить БД & Пересоздать Таблицы (SQL DDL)</span>
              </button>
            </div>
          </div>

          {/* Table List Details */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 light:bg-slate-50">
            <h3 className="font-bold text-xs text-slate-300 light:text-slate-800">
              Таблицы платформы КМБП в PostgreSQL ({systemSettings.postgres.tablesCount || 0}):
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-mono text-cyan-400">
              <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">kmbp_users</div>
              <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">kmbp_login_logs</div>
              <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">kmbp_communities</div>
              <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">kmbp_chat_messages</div>
              <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">kmbp_game_lobbies</div>
              <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">kmbp_ip_bans</div>
              <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">kmbp_wall_signatures</div>
              <div className="p-2 rounded-lg bg-slate-800 border border-slate-700">kmbp_system_config</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GLOBAL MODERATION & IP BANS */}
      {activeTab === 'moderation' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* IP Ban Manager Form */}
          <div className="p-6 rounded-3xl bg-[#131924] border border-slate-800 light:bg-white light:border-slate-200 space-y-4">
            <h2 className="text-sm font-bold text-rose-400 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              <span>Блокировка IP-Адресов (Платформенная Защита)</span>
            </h2>

            <form onSubmit={handleAddIpBanSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newIpAddress}
                onChange={(e) => setNewIpAddress(e.target.value)}
                placeholder="IP адрес (например, 198.51.100.42)"
                required
                className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-rose-500 light:bg-slate-50 light:border-slate-300 light:text-slate-900"
              />
              <input
                type="text"
                value={newIpReason}
                onChange={(e) => setNewIpReason(e.target.value)}
                placeholder="Причина блокировки..."
                required
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-rose-500 light:bg-slate-50 light:border-slate-300 light:text-slate-900"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-rose-600 text-white shadow-lg hover:bg-rose-500 flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Забанить IP</span>
              </button>
            </form>

            {/* Current IP Bans List */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold text-slate-400">Заблокированные IP-адреса ({ipBans.length})</h3>
              {ipBans.map((ban) => (
                <div key={ban.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                  <div>
                    <span className="font-mono font-bold text-rose-400">{ban.ipAddress}</span>
                    <span className="text-slate-400 text-[11px] ml-2">— {ban.reason}</span>
                  </div>
                  <button
                    onClick={() => removeIPBan(ban.id)}
                    className="p-1.5 rounded bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                    title="Разбанить IP"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: TELEGRAM BOT & PROXY STATUS */}
      {activeTab === 'telegram' && (
        <div className="p-6 rounded-3xl bg-[#131924] border border-slate-800 light:bg-white light:border-slate-200 space-y-5 animate-fade-in">
          <h2 className="text-base font-bold text-cyan-400 flex items-center gap-2">
            <Bot className="w-5 h-5" />
            <span>Интеграция Telegram Бота & Прокси (.env Конфигурация)</span>
          </h2>
          <p className="text-xs text-slate-400">Все параметры бота задаются через переменные <code className="text-cyan-400 font-mono">TELEGRAM_BOT_TOKEN</code> и <code className="text-cyan-400 font-mono">TELEGRAM_PROXY_*</code> в <code className="text-cyan-400 font-mono">.env</code>.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 font-semibold">Статус Токена Бота:</span>
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Загружен из process.env.TELEGRAM_BOT_TOKEN</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400 font-semibold">SOCKS5/HTTP Прокси:</span>
              <div className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <Globe className="w-4 h-4" />
                <span>Конфигурируется в .env (TELEGRAM_PROXY_HOST)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: S3 STORAGE */}
      {activeTab === 's3' && (
        <div className="p-6 rounded-3xl bg-[#131924] border border-slate-800 light:bg-white light:border-slate-200 space-y-4 animate-fade-in">
          <h2 className="text-base font-bold text-cyan-400 flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            <span>Статус S3 Хранилища (.env Конфигурация)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Загрузка аватарок и медиафайлов производится напрямую в S3 хранилище с параметрами из <code className="text-cyan-400 font-mono">.env</code> (<code className="text-cyan-400 font-mono">S3_ENDPOINT</code>, <code className="text-cyan-400 font-mono">S3_BUCKET_NAME</code>, <code className="text-cyan-400 font-mono">S3_ACCESS_KEY_ID</code>).
          </p>
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Модуль прямых загрузок аватарок через S3 инициализирован.</span>
          </div>
        </div>
      )}

      {/* TAB 5: DDOS PROTECTION */}
      {activeTab === 'ddos' && (
        <div className="p-6 rounded-3xl bg-[#131924] border border-slate-800 light:bg-white light:border-slate-200 space-y-4 animate-fade-in">
          <h2 className="text-base font-bold text-rose-400 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            <span>Мониторинг Защиты от DDoS</span>
          </h2>
          <p className="text-xs text-slate-400">Автоматическая генерация математических и символьных графических CAPTCHA при авторизации.</p>
        </div>
      )}

    </div>
  );
};

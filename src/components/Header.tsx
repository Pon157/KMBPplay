import React, { useState } from 'react';
import {
  Gamepad2,
  Sun,
  Moon,
  Database,
  Search,
  Keyboard,
  ShieldCheck,
  User as UserIcon,
  Bell,
  LogOut,
  Shield,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSearch: () => void;
  onOpenHotkeys: () => void;
  onOpenLegal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenSearch,
  onOpenHotkeys,
  onOpenLegal,
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { systemSettings, notifications } = useData();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const unreadNotifs = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors border-slate-800/80 bg-[#0B0F17]/90 text-slate-100 light:bg-white/90 light:border-slate-200 light:text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Logo & Platform Name */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('games')}>
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-indigo-600 to-purple-600 p-0.5 shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-[#0B0F17] light:bg-white rounded-[10px] flex items-center justify-center">
              <Gamepad2 className="w-6 h-6 text-cyan-400 light:text-indigo-600 animate-pulse" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0B0F17] light:border-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent light:from-indigo-700 light:to-teal-600">
                КМБП ИГРАЕТ
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 light:bg-indigo-50 light:text-indigo-700 light:border-indigo-200">
                v2.4 PostgreSQL
              </span>
            </div>
            <p className="text-[10px] text-slate-400 light:text-slate-500 hidden sm:block">
              Игровая платформа ботов поддержки
            </p>
          </div>
        </div>

        {/* Status Indicators & Search Trigger */}
        <div className="hidden md:flex items-center gap-3">
          {/* External Postgres Status Badge */}
          <div
            onClick={() => user?.role === 'admin' && setActiveTab('admin')}
            title={
              systemSettings.postgres.isConnected
                ? 'Внешняя БД PostgreSQL подключена!'
                : 'Нажмите для настройки подключения к PostgreSQL'
            }
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-all border ${
              systemSettings.postgres.isConnected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 light:bg-emerald-50 light:text-emerald-700 light:border-emerald-200'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20 light:bg-amber-50 light:text-amber-700 light:border-amber-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>
              {systemSettings.postgres.isConnected
                ? `Postgres (Таблиц: ${systemSettings.postgres.tablesCount || 0})`
                : 'Postgres не подкл.'}
            </span>
          </div>

          {/* Quick Search Shortcut Trigger */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/60 light:bg-slate-100 light:text-slate-600 light:border-slate-200 light:hover:bg-slate-200 transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-cyan-400 light:text-indigo-600" />
            <span>Поиск...</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-900 border border-slate-700 text-slate-400 light:bg-white light:border-slate-300">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Right Tools & User Profile Dropdown */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications Button */}
          <button
            onClick={() => setActiveTab('notifications')}
            className="relative p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800 text-slate-300 light:bg-slate-100 light:hover:bg-slate-200 light:text-slate-700 transition-colors"
            title="Уведомления"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifs > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-4 px-1 text-[10px] font-bold text-white bg-rose-500 rounded-full animate-bounce">
                {unreadNotifs}
              </span>
            )}
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800 text-slate-300 light:bg-slate-100 light:hover:bg-slate-200 light:text-slate-700 transition-colors"
            title={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          {/* Hotkeys Guide Button */}
          <button
            onClick={onOpenHotkeys}
            className="hidden sm:flex p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800 text-slate-300 light:bg-slate-100 light:hover:bg-slate-200 light:text-slate-700 transition-colors"
            title="Горячие клавиши (?)"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          {/* Legal Docs */}
          <button
            onClick={onOpenLegal}
            className="hidden lg:flex p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800 text-slate-300 light:bg-slate-100 light:hover:bg-slate-200 light:text-slate-700 transition-colors"
            title="Юридические документы"
          >
            <FileText className="w-4 h-4" />
          </button>

          {/* User Profile Avatar Dropdown */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 light:bg-slate-100 light:border-slate-200 transition-all"
              >
                <img
                  src={
                    user.avatar ||
                    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80'
                  }
                  alt={user.nickname}
                  className="w-8 h-8 rounded-lg object-cover border border-cyan-500/40"
                />
                <div className="hidden sm:block text-left pr-1">
                  <div className="text-xs font-semibold truncate max-w-[120px]">
                    {user.nickname}
                  </div>
                  <div className="text-[10px] text-cyan-400 light:text-indigo-600 truncate max-w-[120px]">
                    @{user.username}
                  </div>
                </div>
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#131924] border border-slate-800 shadow-2xl p-2 text-slate-200 z-50 light:bg-white light:border-slate-200 light:text-slate-800">
                  <div className="px-3 py-2 border-b border-slate-800 light:border-slate-100 mb-1">
                    <div className="font-bold text-sm truncate">{user.nickname}</div>
                    <div className="text-xs text-slate-400 light:text-slate-500 truncate">
                      {user.email}
                    </div>
                    {user.role === 'admin' && (
                      <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        Администратор
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setActiveTab('profile');
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-slate-800 light:hover:bg-slate-100 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-cyan-400" />
                    <span>Мой Профиль</span>
                  </button>

                  {user.role === 'admin' && (
                    <button
                      onClick={() => {
                        setActiveTab('admin');
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-slate-800 light:hover:bg-slate-100 text-purple-400 light:text-purple-600 transition-colors"
                    >
                      <Shield className="w-4 h-4" />
                      <span>Админ-панель</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      onOpenLegal();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-slate-800 light:hover:bg-slate-100 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>Юридические документы</span>
                  </button>

                  <div className="border-t border-slate-800 light:border-slate-100 my-1" />

                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs hover:bg-rose-500/20 text-rose-400 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Выйти из аккаунта</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => setActiveTab('auth')}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/25 hover:opacity-90 transition-opacity"
            >
              Войти
            </button>
          )}
        </div>

      </div>
    </header>
  );
};

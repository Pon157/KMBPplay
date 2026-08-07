import React from 'react';
import {
  Gamepad2,
  MessageSquare,
  Users,
  Search,
  Bell,
  User as UserIcon,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();
  const { notifications } = useData();

  const unreadNotifs = notifications.filter((n) => !n.read).length;

  const navItems = [
    {
      id: 'games',
      label: 'Игры & Лобби',
      icon: Gamepad2,
      badge: null,
    },
    {
      id: 'global_chat',
      label: 'Общий Чат',
      icon: MessageSquare,
      badge: null,
    },
    {
      id: 'communities',
      label: 'Комьюнити',
      icon: Users,
      badge: null,
    },
    {
      id: 'search',
      label: 'Поиск',
      icon: Search,
      badge: null,
    },
    {
      id: 'notifications',
      label: 'Уведомления',
      icon: Bell,
      badge: unreadNotifs > 0 ? unreadNotifs : null,
    },
    {
      id: 'profile',
      label: 'Профиль',
      icon: UserIcon,
      badge: null,
    },
  ];

  if (user?.role === 'admin') {
    navItems.push({
      id: 'admin',
      label: 'Админка',
      icon: ShieldAlert,
      badge: null,
    });
  }

  return (
    <nav className="w-full bg-[#131924]/80 border-b border-slate-800 backdrop-blur-sm light:bg-slate-100/90 light:border-slate-200 sticky top-16 z-30">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex items-center justify-start sm:justify-center overflow-x-auto no-scrollbar gap-1 sm:gap-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/20 text-cyan-400 border border-cyan-500/40 shadow-lg shadow-cyan-500/10 light:bg-indigo-600 light:text-white light:border-transparent'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 light:text-slate-600 light:hover:bg-slate-200/80 light:hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400 light:text-white' : ''}`} />
                <span>{item.label}</span>

                {item.badge && (
                  <span className="flex items-center justify-center min-w-[18px] h-4.5 px-1.5 text-[10px] font-bold text-white bg-rose-500 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

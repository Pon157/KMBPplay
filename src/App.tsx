import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';

import { Header } from './components/Header';
import { Navbar } from './components/Navbar';
import { AuthView } from './components/auth/AuthView';
import { GlobalChat } from './components/chat/GlobalChat';
import { GamesView } from './components/games/GamesView';
import { CommunityView } from './components/community/CommunityView';
import { SearchView } from './components/search/SearchView';
import { ProfileView } from './components/profile/ProfileView';
import { AdminPanel } from './components/admin/AdminPanel';

import { ShortcutsModal } from './components/ShortcutsModal';
import { LegalModal } from './components/LegalModal';
import { CaptchaModal } from './components/CaptchaModal';
import { Bell, CheckCircle } from 'lucide-react';

const NotificationsView: React.FC = () => {
  const { notifications, markNotificationAsRead, clearAllNotifications } = useData();

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fade-in">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 light:border-slate-200">
        <div className="flex items-center gap-2 text-cyan-400 light:text-indigo-600 font-bold text-lg">
          <Bell className="w-5 h-5" />
          <span>Центр Уведомлений КМБП</span>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={clearAllNotifications}
            className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 light:bg-slate-200 light:text-slate-800 transition-colors"
          >
            Очистить все
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-slate-900/50 border border-slate-800 text-slate-400 light:bg-white light:border-slate-200">
          У вас пока нет новых уведомлений.
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markNotificationAsRead(n.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                n.read
                  ? 'bg-slate-900/40 border-slate-800/80 text-slate-400 light:bg-slate-50 light:border-slate-200'
                  : 'bg-slate-900 border-cyan-500/40 text-slate-100 shadow-md shadow-cyan-500/5 light:bg-white light:border-indigo-300'
              }`}
            >
              <div>
                <div className="font-bold text-sm text-cyan-400 light:text-indigo-600">{n.title}</div>
                <p className="text-xs text-slate-300 light:text-slate-700 mt-1">{n.message}</p>
                <div className="text-[10px] text-slate-500 mt-2">
                  {new Date(n.timestamp).toLocaleString('ru-RU')}
                </div>
              </div>
              {!n.read && (
                <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const MainLayout: React.FC = () => {
  const { user, onboardingStep, isAuthLoading } = useAuth();
  const { currentView, setCurrentView, isCaptchaRequired } = useData();

  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isLegalOpen, setIsLegalOpen] = useState(false);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center text-cyan-400 text-sm font-bold animate-pulse">
        Загрузка платформы КМБП Играет...
      </div>
    );
  }

  // If unauthenticated or in middle of registration onboarding
  if (!user || onboardingStep !== 'complete') {
    return <AuthView />;
  }

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black transition-colors light:bg-slate-100 light:text-slate-900">
      
      {/* Top Header */}
      <Header
        activeTab={currentView}
        setActiveTab={setCurrentView}
        onOpenSearch={() => setCurrentView('search')}
        onOpenHotkeys={() => setIsShortcutsOpen(true)}
        onOpenLegal={() => setIsLegalOpen(true)}
      />

      {/* Navigation Sub-Header */}
      <Navbar activeTab={currentView} setActiveTab={setCurrentView} />

      {/* Main Container View Area */}
      <main className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto min-h-[calc(100vh-160px)]">
        {(currentView === 'chat' || currentView === 'global_chat') && <GlobalChat />}
        {currentView === 'games' && <GamesView />}
        {currentView === 'communities' && <CommunityView />}
        {currentView === 'search' && <SearchView />}
        {currentView === 'notifications' && <NotificationsView />}
        {currentView === 'profile' && <ProfileView />}
        {currentView === 'admin' && <AdminPanel />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500 light:border-slate-200">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            © 2026 Игровая платформа КМБП. Защита от DDoS атак и безопасный онлайн.
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button onClick={() => setIsLegalOpen(true)} className="hover:text-cyan-400">
              Политика конфиденциальности
            </button>
            <button onClick={() => setIsShortcutsOpen(true)} className="hover:text-cyan-400">
              Горячие клавиши
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {isShortcutsOpen && <ShortcutsModal onClose={() => setIsShortcutsOpen(false)} />}
      {isLegalOpen && <LegalModal onClose={() => setIsLegalOpen(false)} />}
      {isCaptchaRequired && (
        <CaptchaModal
          onSuccess={() => {
            // captcha passed
          }}
        />
      )}

    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <MainLayout />
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

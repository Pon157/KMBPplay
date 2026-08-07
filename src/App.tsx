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

const MainLayout: React.FC = () => {
  const { user, isAuthLoading } = useAuth();
  const { currentView, setCurrentView, isCaptchaRequired, triggerCaptchaChallenge } = useData();

  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isLegalOpen, setIsLegalOpen] = useState(false);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center text-cyan-400 text-sm font-bold animate-pulse">
        Загрузка платформы КМБП Играет...
      </div>
    );
  }

  // If unauthenticated or in middle of 4-step registration onboarding
  if (!user || user.onboardingStep !== 'completed') {
    return <AuthView />;
  }

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black transition-colors light:bg-slate-100 light:text-slate-900">
      
      {/* Top Header */}
      <Header
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenLegal={() => setIsLegalOpen(true)}
      />

      {/* Navigation Sub-Header */}
      <Navbar />

      {/* Main Container View Area */}
      <main className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto min-h-[calc(100vh-160px)]">
        {currentView === 'chat' && <GlobalChat />}
        {currentView === 'games' && <GamesView />}
        {currentView === 'communities' && <CommunityView />}
        {currentView === 'search' && <SearchView />}
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

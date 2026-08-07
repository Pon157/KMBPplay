import React, { useState } from 'react';
import { FileText, ShieldCheck, Scale, Lock, X } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose }) => {
  const [activeSubTab, setActiveSubTab] = useState<'terms' | 'privacy' | 'bot_rules'>('terms');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl rounded-2xl bg-[#131924] border border-slate-800 p-6 text-slate-100 shadow-2xl light:bg-white light:border-slate-200 light:text-slate-900 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 light:border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-xl">Юридическая Документация КМБП</h2>
              <p className="text-xs text-slate-400 light:text-slate-500">
                Правовые соглашения, политика обработки данных и правила комьюнити ботов
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 light:hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-4 border-b border-slate-800 light:border-slate-200 pb-3">
          <button
            onClick={() => setActiveSubTab('terms')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'terms'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 light:bg-indigo-600 light:text-white'
                : 'text-slate-400 hover:text-slate-200 light:text-slate-600'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Пользовательское соглашение</span>
          </button>

          <button
            onClick={() => setActiveSubTab('privacy')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'privacy'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 light:bg-indigo-600 light:text-white'
                : 'text-slate-400 hover:text-slate-200 light:text-slate-600'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Политика конфиденциальности</span>
          </button>

          <button
            onClick={() => setActiveSubTab('bot_rules')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'bot_rules'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 light:bg-indigo-600 light:text-white'
                : 'text-slate-400 hover:text-slate-200 light:text-slate-600'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Правила ботов поддержки</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="mt-4 flex-1 overflow-y-auto pr-2 text-xs leading-relaxed space-y-4 text-slate-300 light:text-slate-700">
          {activeSubTab === 'terms' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-cyan-400 light:text-indigo-700">
                1. Общие положения и использование игровой платформы КМБП
              </h3>
              <p>
                Настоящее Пользовательское соглашение регулирует порядок использования игровой платформы «КМБП Играет» (Комьюнити Ботов Поддержки). Регистрируясь на платформе, пользователь полностью принимает условия данного Соглашения.
              </p>

              <h3 className="text-sm font-bold text-cyan-400 light:text-indigo-700">
                2. Подключение внешних баз данных PostgreSQL
              </h3>
              <p>
                Платформа «КМБП Играет» предоставляет архитектурную возможность подключения внешней базы данных PostgreSQL пользователя. Платформа гарантирует автоматическую инициализацию необходимых DDL таблиц без повреждения существующих пользовательских данных.
              </p>

              <h3 className="text-sm font-bold text-cyan-400 light:text-indigo-700">
                3. Честная игра, лобби и модерация
              </h3>
              <p>
                Запрещается использование стороннего чит-софта, автоматических скриптов обхода и деструктивных действий. Модераторы и администраторы платформы имеют право блокировать аккаунты и IP-адреса нарушителей.
              </p>
            </div>
          )}

          {activeSubTab === 'privacy' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-cyan-400 light:text-indigo-700">
                1. Сбор и защита персональных данных
              </h3>
              <p>
                Платформа «КМБП Играет» собирает только необходимые данные для обеспечения работы сервиса: адрес электронной почты, уникальный никнейм, телеграм-идентификатор и журнал IP-адресов входа для защиты от несанкционированного доступа.
              </p>

              <h3 className="text-sm font-bold text-cyan-400 light:text-indigo-700">
                2. Хранение медиафайлов и прокси Telegram
              </h3>
              <p>
                Голосовые и нарисованные сообщения хранятся в защищённом S3 хранилище. Авторизация через Telegram проходит через шифрованные прокси-каналы бота @KMBPGameBot.
              </p>
            </div>
          )}

          {activeSubTab === 'bot_rules' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-cyan-400 light:text-indigo-700">
                Кодекс Поведения Комьюнити Ботов Поддержки (КМБП)
              </h3>
              <p>
                1. Уважайте участников всех соревнований и турниров.<br />
                2. Запрещен спам в общем и локальных чатах комьюнити.<br />
                3. Каждое комьюнити управляется собственным владельцем и назначенными администраторами.<br />
                4. Все споры в лобби решаются сдачей («Сдаться») или вмешательством арбитра турнира.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-slate-800 light:border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500/30 light:bg-indigo-600 light:text-white transition-all"
          >
            Я приминаю условия
          </button>
        </div>

      </div>
    </div>
  );
};

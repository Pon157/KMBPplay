import React, { useState } from 'react';
import {
  Gamepad2,
  Plus,
  Users,
  Lock,
  Clock,
  Swords,
  Crown,
  Play,
  X,
  Search,
  Bot
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { GameType, GameLobby } from '../../types';

import { ChessGame } from './ChessGame';
import { CheckersGame } from './CheckersGame';
import { BattleshipGame } from './BattleshipGame';
import { DungeonRpgGame } from './DungeonRpgGame';

const GAME_CATALOG = [
  {
    type: 'chess' as GameType,
    title: 'Классические Шахматы КМБП',
    description: 'Интеллектуальная игра с контролем времени, записью ходов и кнопкой сдачи.',
    duration: '10–30 мин',
    players: '2 игрока',
    badge: 'Популярное',
    banner: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=400&auto=format&fit=crop&q=80',
  },
  {
    type: 'checkers' as GameType,
    title: 'Русские Шашки & Дамки',
    description: 'Динамичная логическая битва с превращением в дамки и обязательными взятиями.',
    duration: '5–15 мин',
    players: '2 игрока',
    badge: 'Быстрая игра',
    banner: 'https://images.unsplash.com/photo-1611195974226-a6a9be9dd763?w=400&auto=format&fit=crop&q=80',
  },
  {
    type: 'battleship' as GameType,
    title: 'Морской Бой Серверов',
    description: 'Расставляйте флот на сетке 10x10 и уничтожайте корабли соперника.',
    duration: '10–20 мин',
    players: '2 игрока',
    badge: 'Тактика',
    banner: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80',
  },
  {
    type: 'dungeon_rpg' as GameType,
    title: 'КМБП: Хроники Подземелий',
    description: 'Многочасовая тактическая RPG кампания с прокачкой, спеллами и рейдами на боссов.',
    duration: '1–3 часа',
    players: '1–4 игрока',
    badge: 'Хардкор RPG',
    banner: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&auto=format&fit=crop&q=80',
  },
];

export const GamesView: React.FC = () => {
  const { user } = useAuth();
  const { lobbies, createLobby, joinLobby, leaveLobby, activeLobby, setActiveLobby } = useData();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedGameType, setSelectedGameType] = useState<GameType>('chess');
  const [lobbyTitle, setLobbyTitle] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [timeLimit, setTimeLimit] = useState(15);
  const [isPrivate, setIsPrivate] = useState(false);
  const [passcode, setPasscode] = useState('');
  
  const [passcodeModalLobby, setPasscodeModalLobby] = useState<GameLobby | null>(null);
  const [enteredPasscode, setEnteredPasscode] = useState('');
  const [joinError, setJoinError] = useState('');

  if (!user) return null;

  const handleCreateLobbySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lobbyTitle) return;
    const newL = createLobby(
      selectedGameType,
      lobbyTitle,
      maxPlayers,
      timeLimit,
      isPrivate,
      passcode
    );
    setIsCreateModalOpen(false);
  };

  const handleJoinAttempt = (l: GameLobby) => {
    if (l.settings.isPrivate && l.passcode) {
      setPasscodeModalLobby(l);
      setEnteredPasscode('');
      setJoinError('');
    } else {
      const res = joinLobby(l.id);
      if (!res.success) {
        alert(res.error);
      } else {
        setActiveLobby(l);
      }
    }
  };

  const handleConfirmPrivatePasscode = () => {
    if (!passcodeModalLobby) return;
    const res = joinLobby(passcodeModalLobby.id, enteredPasscode);
    if (res.success) {
      setActiveLobby(passcodeModalLobby);
      setPasscodeModalLobby(null);
    } else {
      setJoinError(res.error || 'Неверный пароль');
    }
  };

  // Render Active Game
  if (activeLobby) {
    return (
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800 light:border-slate-200">
          <button
            onClick={() => {
              leaveLobby(activeLobby.id);
              setActiveLobby(null);
            }}
            className="text-xs font-bold text-cyan-400 hover:underline"
          >
            ← Покинуть Лобби и вернуться к выбору игр
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Статус лобби:</span>
            <span className="font-bold text-emerald-400 capitalize">{activeLobby.status}</span>
          </div>
        </div>

        {activeLobby.gameType === 'chess' && <ChessGame lobby={activeLobby} />}
        {activeLobby.gameType === 'checkers' && <CheckersGame lobby={activeLobby} />}
        {activeLobby.gameType === 'battleship' && <BattleshipGame lobby={activeLobby} />}
        {activeLobby.gameType === 'dungeon_rpg' && <DungeonRpgGame lobby={activeLobby} />}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      
      {/* Catalog Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 light:border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 light:text-slate-900 flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-cyan-400 light:text-indigo-600" />
            <span>Игровая Библиотека & Лобби</span>
          </h1>
          <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5">
            Создавайте публичные или приватные лобби для соревнований с ботами поддержки и игроками
          </p>
        </div>

        <button
          onClick={() => {
            setIsCreateModalOpen(true);
            setLobbyTitle(`Лобби ${user.nickname}`);
          }}
          className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 text-white shadow-xl shadow-cyan-500/25 hover:opacity-95 flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Создать Новое Лобби</span>
        </button>
      </div>

      {/* Games Catalog Grid */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 light:text-indigo-600 mb-4">
          Каталог Доступных Игр
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {GAME_CATALOG.map((g) => (
            <div
              key={g.type}
              className="group relative rounded-3xl bg-[#131924] border border-slate-800 overflow-hidden shadow-xl hover:border-cyan-500/50 transition-all flex flex-col justify-between light:bg-white light:border-slate-200"
            >
              <div>
                <div className="relative h-36 overflow-hidden">
                  <img
                    src={g.banner}
                    alt={g.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#131924] via-transparent to-transparent" />
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 text-[10px] font-bold rounded-md bg-cyan-500/80 text-white backdrop-blur-sm">
                    {g.badge}
                  </span>
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="font-bold text-sm text-slate-100 light:text-slate-900">{g.title}</h3>
                  <p className="text-xs text-slate-400 light:text-slate-600 line-clamp-2 leading-relaxed">
                    {g.description}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-cyan-400" /> {g.duration}</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3 text-purple-400" /> {g.players}</span>
                </div>

                <button
                  onClick={() => {
                    setSelectedGameType(g.type);
                    setLobbyTitle(`Партия в ${g.title}`);
                    setIsCreateModalOpen(true);
                  }}
                  className="w-full py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 light:bg-slate-100 light:border-slate-300 light:text-indigo-600 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Создать Лобби</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Game Lobbies Browser */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 light:text-indigo-600 flex items-center gap-2">
          <Swords className="w-4 h-4" />
          <span>Активные Игровые Лобби ({lobbies.length})</span>
        </h2>

        {lobbies.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            Сейчас нет активных лобби. Будьте первым, кто создаст игру!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lobbies.map((l) => (
              <div
                key={l.id}
                className="p-5 rounded-2xl bg-[#131924] border border-slate-800 space-y-4 shadow-lg light:bg-white light:border-slate-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {l.gameType}
                    </span>
                    {l.settings.isPrivate && (
                      <span className="flex items-center gap-1 text-[10px] text-amber-400 font-bold">
                        <Lock className="w-3 h-3" /> Приватное
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500">{new Date(l.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-slate-100 light:text-slate-900">{l.title}</h3>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Игроков: <span className="font-bold text-cyan-400">{l.players.length} / {l.maxPlayers}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleJoinAttempt(l)}
                  className="w-full py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Присоединиться к Игре</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE LOBBY MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <form onSubmit={handleCreateLobbySubmit} className="relative w-full max-w-md rounded-3xl bg-[#131924] border border-slate-800 p-6 text-slate-100 shadow-2xl space-y-4 light:bg-white light:border-slate-200 light:text-slate-900">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 light:border-slate-200">
              <h3 className="font-bold text-base text-cyan-400">Создание Игрового Лобби</h3>
              <button type="button" onClick={() => setIsCreateModalOpen(false)} className="p-1 rounded hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Название Лобби</label>
              <input
                type="text"
                value={lobbyTitle}
                onChange={(e) => setLobbyTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 light:bg-slate-50 light:border-slate-300 light:text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Дисциплина</label>
                <select
                  value={selectedGameType}
                  onChange={(e) => setSelectedGameType(e.target.value as GameType)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none light:bg-slate-50 light:border-slate-300 light:text-slate-900"
                >
                  <option value="chess">Шахматы</option>
                  <option value="checkers">Шашки</option>
                  <option value="battleship">Морской Бой</option>
                  <option value="dungeon_rpg">Подземелье RPG</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Лимит времени (мин)</label>
                <input
                  type="number"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(parseInt(e.target.value, 10))}
                  min="3"
                  max="180"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none light:bg-slate-50 light:border-slate-300 light:text-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="privToggle"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <label htmlFor="privToggle" className="text-xs font-semibold">Приватное Лобби (Пароль)</label>
            </div>

            {isPrivate && (
              <div>
                <label className="block text-xs font-semibold mb-1">Код Пароля</label>
                <input
                  type="text"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="1234"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/25"
            >
              Запустить Лобби
            </button>
          </form>
        </div>
      )}

      {/* PASSCODE ENTRY MODAL FOR PRIVATE LOBBY */}
      {passcodeModalLobby && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#131924] border border-amber-500/40 p-6 text-slate-100 shadow-2xl space-y-4 light:bg-white light:border-slate-200 light:text-slate-900">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-sm text-amber-400 flex items-center gap-2">
                <Lock className="w-4 h-4" /> Введите пароль к лобби
              </h3>
              <button onClick={() => setPasscodeModalLobby(null)} className="p-1 rounded hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            {joinError && <div className="text-xs text-rose-400">{joinError}</div>}

            <input
              type="password"
              value={enteredPasscode}
              onChange={(e) => setEnteredPasscode(e.target.value)}
              placeholder="Пароль доступа..."
              autoFocus
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none"
            />

            <button
              onClick={handleConfirmPrivatePasscode}
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-amber-500 text-slate-950 hover:bg-amber-400"
            >
              Подтвердить & Войти
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

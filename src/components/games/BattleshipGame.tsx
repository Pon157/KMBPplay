import React, { useState } from 'react';
import { Flag, Shield, Crosshair, MessageSquare, Send } from 'lucide-react';
import { GameLobby } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

interface BattleshipGameProps {
  lobby: GameLobby;
}

type CellStatus = 'empty' | 'ship' | 'hit' | 'miss';

export const BattleshipGame: React.FC<BattleshipGameProps> = ({ lobby }) => {
  const { user } = useAuth();
  const { surrenderGame, sendChatMessage, lobbyMessages } = useData();

  // 10x10 grids for my board and enemy board
  const [myBoard, setMyBoard] = useState<CellStatus[][]>(() => {
    const grid = Array(10).fill(null).map(() => Array(10).fill('empty' as CellStatus));
    // Pre-place a few ships
    grid[1][1] = 'ship'; grid[1][2] = 'ship'; grid[1][3] = 'ship';
    grid[3][5] = 'ship'; grid[4][5] = 'ship';
    grid[7][2] = 'ship'; grid[7][3] = 'ship'; grid[7][4] = 'ship'; grid[7][5] = 'ship';
    return grid;
  });

  const [enemyBoard, setEnemyBoard] = useState<CellStatus[][]>(() =>
    Array(10).fill(null).map(() => Array(10).fill('empty' as CellStatus))
  );

  const [chatInput, setChatInput] = useState('');

  if (!user) return null;

  const handleShootEnemy = (r: number, c: number) => {
    if (lobby.status === 'finished') return;
    if (enemyBoard[r][c] !== 'empty') return;

    const newEnemy = enemyBoard.map((row) => [...row]);
    // Simulate hit vs miss
    const isHit = (r + c) % 3 === 0;
    newEnemy[r][c] = isHit ? 'hit' : 'miss';
    setEnemyBoard(newEnemy);
  };

  const handleSurrender = () => {
    if (confirm('Сдаться в Морском Бою?')) {
      surrenderGame(lobby.id);
    }
  };

  const currentMsgs = lobbyMessages[lobby.id] || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Grids Column */}
      <div className="lg:col-span-2 p-6 rounded-3xl bg-[#131924] border border-slate-800 space-y-6 shadow-2xl light:bg-white light:border-slate-200">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 light:border-slate-200">
          <div>
            <h2 className="font-extrabold text-sm">{lobby.title}</h2>
            <p className="text-xs text-slate-400">Морской Бой КМБП — Стреляйте по сетке соперника!</p>
          </div>

          <button
            onClick={handleSurrender}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 flex items-center gap-1.5"
          >
            <Flag className="w-4 h-4" />
            <span>Сдаться</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* My Ships Grid */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-cyan-400 flex items-center gap-1">
              <Shield className="w-4 h-4" /> Ваш Флот (10x10)
            </h3>
            <div className="grid grid-cols-10 gap-0.5 border-2 border-slate-700 bg-slate-900 p-1 rounded-xl">
              {myBoard.map((row, r) =>
                row.map((cell, c) => (
                  <div
                    key={`my-${r}-${c}`}
                    className={`w-6 h-6 sm:w-8 sm:h-8 rounded-sm flex items-center justify-center text-[10px] font-bold ${
                      cell === 'ship'
                        ? 'bg-cyan-500 text-white'
                        : cell === 'hit'
                        ? 'bg-rose-600 text-white'
                        : cell === 'miss'
                        ? 'bg-slate-700 text-slate-400'
                        : 'bg-slate-800'
                    }`}
                  >
                    {cell === 'ship' ? '⚓' : cell === 'hit' ? '💥' : cell === 'miss' ? '•' : ''}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Enemy Grid */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-rose-400 flex items-center gap-1">
              <Crosshair className="w-4 h-4" /> Поле Соперника (Выстрелы)
            </h3>
            <div className="grid grid-cols-10 gap-0.5 border-2 border-rose-900/60 bg-slate-900 p-1 rounded-xl">
              {enemyBoard.map((row, r) =>
                row.map((cell, c) => (
                  <button
                    key={`enemy-${r}-${c}`}
                    onClick={() => handleShootEnemy(r, c)}
                    className={`w-6 h-6 sm:w-8 sm:h-8 rounded-sm flex items-center justify-center text-[10px] font-bold transition-all ${
                      cell === 'hit'
                        ? 'bg-rose-600 text-white animate-ping'
                        : cell === 'miss'
                        ? 'bg-slate-700 text-slate-400'
                        : 'bg-slate-800 hover:bg-rose-500/40'
                    }`}
                  >
                    {cell === 'hit' ? '💥' : cell === 'miss' ? '•' : ''}
                  </button>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Mini Chat */}
      <div className="p-4 rounded-2xl bg-[#131924] border border-slate-800 light:bg-white light:border-slate-200 flex flex-col h-80">
        <h3 className="font-bold text-xs text-cyan-400 light:text-indigo-600 mb-2 flex items-center gap-1">
          <MessageSquare className="w-3.5 h-3.5" /> Чат Игроков
        </h3>
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
          {currentMsgs.map((m) => (
            <div key={m.id} className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px]">
              <span className="font-bold text-cyan-400">{m.senderNickname}: </span>
              <span className="text-slate-200">{m.content}</span>
            </div>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!chatInput.trim()) return;
            sendChatMessage('lobby', lobby.id, 'text', chatInput);
            setChatInput('');
          }}
          className="mt-2 flex gap-2"
        >
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Сообщение..."
            className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
          />
          <button type="submit" className="px-3 py-1.5 rounded-lg bg-cyan-500 text-white font-bold text-xs">
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

    </div>
  );
};

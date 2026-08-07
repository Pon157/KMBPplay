import React, { useState } from 'react';
import { Flag, MessageSquare, Send, Award } from 'lucide-react';
import { GameLobby } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

interface CheckersGameProps {
  lobby: GameLobby;
}

type CheckersPiece = { color: 'r' | 'b'; isKing: boolean } | null;

const INITIAL_CHECKERS: CheckersPiece[][] = [
  [null, { color: 'b', isKing: false }, null, { color: 'b', isKing: false }, null, { color: 'b', isKing: false }, null, { color: 'b', isKing: false }],
  [{ color: 'b', isKing: false }, null, { color: 'b', isKing: false }, null, { color: 'b', isKing: false }, null, { color: 'b', isKing: false }, null],
  [null, { color: 'b', isKing: false }, null, { color: 'b', isKing: false }, null, { color: 'b', isKing: false }, null, { color: 'b', isKing: false }],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [{ color: 'r', isKing: false }, null, { color: 'r', isKing: false }, null, { color: 'r', isKing: false }, null, { color: 'r', isKing: false }, null],
  [null, { color: 'r', isKing: false }, null, { color: 'r', isKing: false }, null, { color: 'r', isKing: false }, null, { color: 'r', isKing: false }],
  [{ color: 'r', isKing: false }, null, { color: 'r', isKing: false }, null, { color: 'r', isKing: false }, null, { color: 'r', isKing: false }, null],
];

export const CheckersGame: React.FC<CheckersGameProps> = ({ lobby }) => {
  const { user } = useAuth();
  const { surrenderGame, updateGameState, sendChatMessage, lobbyMessages } = useData();

  const [board, setBoard] = useState<CheckersPiece[][]>(lobby.gameState || INITIAL_CHECKERS);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [turn, setTurn] = useState<'r' | 'b'>('r');
  const [chatInput, setChatInput] = useState('');

  if (!user) return null;

  const handleClick = (r: number, c: number) => {
    if (lobby.status === 'finished') return;

    if (selected) {
      const [fromR, fromC] = selected;
      if (fromR === r && fromC === c) {
        setSelected(null);
        return;
      }

      const piece = board[fromR][fromC];
      if (piece) {
        const newBoard = board.map((row) => [...row]);
        
        // King Promotion check
        const isKingNow = piece.isKing || (piece.color === 'r' && r === 0) || (piece.color === 'b' && r === 7);
        newBoard[r][c] = { ...piece, isKing: isKingNow };
        newBoard[fromR][fromC] = null;

        // Jump capture check
        if (Math.abs(r - fromR) === 2 && Math.abs(c - fromC) === 2) {
          const midR = (fromR + r) / 2;
          const midC = (fromC + c) / 2;
          newBoard[midR][midC] = null;
        }

        setBoard(newBoard);
        setTurn(turn === 'r' ? 'b' : 'r');
        setSelected(null);
        updateGameState(lobby.id, newBoard);
      }
    } else {
      const piece = board[r][c];
      if (piece && piece.color === turn) {
        setSelected([r, c]);
      }
    }
  };

  const handleSurrender = () => {
    if (confirm('Сдаться в матче по Шашкам?')) {
      surrenderGame(lobby.id);
    }
  };

  const currentMsgs = lobbyMessages[lobby.id] || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 p-6 rounded-3xl bg-[#131924] border border-slate-800 flex flex-col items-center shadow-2xl light:bg-white light:border-slate-200">
        
        <div className="w-full flex items-center justify-between pb-4 mb-4 border-b border-slate-800 light:border-slate-200">
          <div>
            <h2 className="font-extrabold text-sm">{lobby.title}</h2>
            <div className="text-xs text-slate-400">
              Ход: <span className="font-bold text-rose-400">{turn === 'r' ? 'Красные (КМБП)' : 'Чёрные (Боты)'}</span>
            </div>
          </div>

          <button
            onClick={handleSurrender}
            disabled={lobby.status === 'finished'}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 flex items-center gap-1.5"
          >
            <Flag className="w-4 h-4" />
            <span>Сдаться</span>
          </button>
        </div>

        {/* Board */}
        <div className="grid grid-cols-8 gap-0 border-4 border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          {board.map((row, r) =>
            row.map((cell, c) => {
              const isDark = (r + c) % 2 === 1;
              const isSel = selected?.[0] === r && selected?.[1] === c;

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleClick(r, c)}
                  className={`w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center transition-all ${
                    isSel
                      ? 'bg-cyan-500/60 ring-4 ring-cyan-400 z-10'
                      : isDark
                      ? 'bg-[#1E293B] hover:bg-slate-700'
                      : 'bg-[#94A3B8] hover:bg-slate-300'
                  }`}
                >
                  {cell && (
                    <div
                      className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full border-2 flex items-center justify-center font-bold text-xs shadow-lg ${
                        cell.color === 'r'
                          ? 'bg-rose-600 border-rose-300 text-white'
                          : 'bg-slate-950 border-slate-700 text-cyan-400'
                      }`}
                    >
                      {cell.isKing ? '♔' : ''}
                    </div>
                  )}
                </button>
              );
            })
          )}
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

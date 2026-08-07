import React, { useState } from 'react';
import { Flag, RotateCcw, MessageSquare, Send, Clock, Award } from 'lucide-react';
import { GameLobby } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

interface ChessGameProps {
  lobby: GameLobby;
}

// Simple interactive 8x8 Chess engine representation
type Piece = { type: 'p' | 'r' | 'n' | 'b' | 'q' | 'k'; color: 'w' | 'b' } | null;

const INITIAL_BOARD: Piece[][] = [
  [{ type: 'r', color: 'b' }, { type: 'n', color: 'b' }, { type: 'b', color: 'b' }, { type: 'q', color: 'b' }, { type: 'k', color: 'b' }, { type: 'b', color: 'b' }, { type: 'n', color: 'b' }, { type: 'r', color: 'b' }],
  [{ type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }, { type: 'p', color: 'b' }],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null],
  [{ type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }, { type: 'p', color: 'w' }],
  [{ type: 'r', color: 'w' }, { type: 'n', color: 'w' }, { type: 'b', color: 'w' }, { type: 'q', color: 'w' }, { type: 'k', color: 'w' }, { type: 'b', color: 'w' }, { type: 'n', color: 'w' }, { type: 'r', color: 'w' }],
];

const PIECE_SYMBOLS: Record<string, string> = {
  w_k: '♔', w_q: '♕', w_r: '♖', w_b: '♗', w_n: '♘', w_p: '♙',
  b_k: '♚', b_q: '♛', b_r: '♜', b_b: '♝', b_n: '♞', b_p: '♟',
};

export const ChessGame: React.FC<ChessGameProps> = ({ lobby }) => {
  const { user } = useAuth();
  const { surrenderGame, updateGameState, sendChatMessage, lobbyMessages } = useData();

  const [board, setBoard] = useState<Piece[][]>(lobby.gameState || INITIAL_BOARD);
  const [selectedSquare, setSelectedSquare] = useState<[number, number] | null>(null);
  const [currentTurn, setCurrentTurn] = useState<'w' | 'b'>('w');
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [chatInput, setChatInput] = useState('');

  if (!user) return null;

  const handleSquareClick = (r: number, c: number) => {
    if (lobby.status === 'finished') return;

    if (selectedSquare) {
      const [fromR, fromC] = selectedSquare;
      if (fromR === r && fromC === c) {
        setSelectedSquare(null);
        return;
      }

      // Execute move
      const piece = board[fromR][fromC];
      if (piece) {
        const newBoard = board.map((row) => [...row]);
        newBoard[r][c] = piece;
        newBoard[fromR][fromC] = null;

        setBoard(newBoard);
        const colLetters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const moveText = `${piece.color.toUpperCase()}${piece.type.toUpperCase()} ${colLetters[fromC]}${8 - fromR} ➔ ${colLetters[c]}${8 - r}`;
        setMoveHistory((prev) => [moveText, ...prev]);

        setCurrentTurn(currentTurn === 'w' ? 'b' : 'w');
        setSelectedSquare(null);

        updateGameState(lobby.id, newBoard);
      }
    } else {
      const piece = board[r][c];
      if (piece && piece.color === currentTurn) {
        setSelectedSquare([r, c]);
      }
    }
  };

  const handleSurrender = () => {
    if (confirm('Вы уверены, что хотите сдаться в этом матче?')) {
      surrenderGame(lobby.id);
    }
  };

  const handleSendInGameChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage('lobby', lobby.id, 'text', chatInput);
    setChatInput('');
  };

  const currentLobbyMsgs = lobbyMessages[lobby.id] || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Chessboard Column */}
      <div className="lg:col-span-2 p-6 rounded-3xl bg-[#131924] border border-slate-800 flex flex-col items-center shadow-2xl light:bg-white light:border-slate-200">
        
        {/* Match Header Bar */}
        <div className="w-full flex items-center justify-between pb-4 mb-4 border-b border-slate-800 light:border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm">{lobby.title}</h2>
              <div className="text-xs text-slate-400">
                Ход: <span className="font-bold text-cyan-400">{currentTurn === 'w' ? 'Белые (♔)' : 'Чёрные (♚)'}</span>
              </div>
            </div>
          </div>

          {/* Surrender Button */}
          <button
            onClick={handleSurrender}
            disabled={lobby.status === 'finished'}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 flex items-center gap-1.5 transition-all"
          >
            <Flag className="w-4 h-4" />
            <span>Сдаться</span>
          </button>
        </div>

        {/* Finished Banner */}
        {lobby.status === 'finished' && (
          <div className="w-full mb-4 p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-center text-amber-300 font-bold text-xs flex items-center justify-center gap-2">
            <Award className="w-5 h-5" />
            <span>Матч завершен! Победитель определён.</span>
          </div>
        )}

        {/* 8x8 Chess Board */}
        <div className="grid grid-cols-8 gap-0 border-4 border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          {board.map((row, r) =>
            row.map((cell, c) => {
              const isDark = (r + c) % 2 === 1;
              const isSelected = selectedSquare?.[0] === r && selectedSquare?.[1] === c;

              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleSquareClick(r, c)}
                  className={`w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center text-2xl sm:text-3xl font-extrabold transition-all ${
                    isSelected
                      ? 'bg-cyan-500/60 ring-4 ring-cyan-400 z-10'
                      : isDark
                      ? 'bg-[#1E293B] text-slate-100 hover:bg-slate-700'
                      : 'bg-[#94A3B8] text-slate-900 hover:bg-slate-300'
                  }`}
                >
                  {cell && (
                    <span className={cell.color === 'w' ? 'text-cyan-200 drop-shadow-md' : 'text-slate-950 drop-shadow-md'}>
                      {PIECE_SYMBOLS[`${cell.color}_${cell.type}`]}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

      </div>

      {/* Right Column: In-Game Mini-Chat & Move History */}
      <div className="space-y-6">
        
        {/* Moves History */}
        <div className="p-4 rounded-2xl bg-[#131924] border border-slate-800 light:bg-white light:border-slate-200">
          <h3 className="font-bold text-xs text-cyan-400 light:text-indigo-600 mb-2">История Ходов</h3>
          <div className="h-32 overflow-y-auto space-y-1 text-[11px] font-mono text-slate-300 light:text-slate-700 pr-1">
            {moveHistory.length === 0 ? (
              <div className="text-slate-500">Ходов ещё не было</div>
            ) : (
              moveHistory.map((m, i) => <div key={i}>{m}</div>)
            )}
          </div>
        </div>

        {/* In-Game Mini-Chat */}
        <div className="p-4 rounded-2xl bg-[#131924] border border-slate-800 light:bg-white light:border-slate-200 flex flex-col h-64">
          <h3 className="font-bold text-xs text-cyan-400 light:text-indigo-600 mb-2 flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" /> Чат Игроков
          </h3>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
            {currentLobbyMsgs.map((m) => (
              <div key={m.id} className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px]">
                <span className="font-bold text-cyan-400">{m.senderNickname}: </span>
                <span className="text-slate-200">{m.content}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendInGameChat} className="mt-2 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Чат с оппонентом..."
              className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            />
            <button type="submit" className="px-3 py-1.5 rounded-lg bg-cyan-500 text-white font-bold text-xs">
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};

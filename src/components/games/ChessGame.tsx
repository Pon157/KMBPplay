import React, { useState } from 'react';
import { Flag, RotateCcw, MessageSquare, Send, Clock, Award, Users, AlertCircle } from 'lucide-react';
import { GameLobby } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

interface ChessGameProps {
  lobby: GameLobby;
}

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

// Check if straight or diagonal path is clear of obstacles
const isPathClear = (fromR: number, fromC: number, toR: number, toC: number, board: Piece[][]): boolean => {
  const stepR = toR === fromR ? 0 : (toR > fromR ? 1 : -1);
  const stepC = toC === fromC ? 0 : (toC > fromC ? 1 : -1);

  let currR = fromR + stepR;
  let currC = fromC + stepC;

  while (currR !== toR || currC !== toC) {
    if (board[currR][currC] !== null) return false;
    currR += stepR;
    currC += stepC;
  }
  return true;
};

// Strict Chess Move Validation Rules
const isValidChessMove = (
  piece: NonNullable<Piece>,
  fromR: number,
  fromC: number,
  toR: number,
  toC: number,
  board: Piece[][]
): boolean => {
  const dr = toR - fromR;
  const dc = toC - fromC;
  const absDr = Math.abs(dr);
  const absDc = Math.abs(dc);

  // Cannot capture friendly piece
  const destPiece = board[toR][toC];
  if (destPiece && destPiece.color === piece.color) {
    return false;
  }

  switch (piece.type) {
    case 'p': { // Pawn
      const dir = piece.color === 'w' ? -1 : 1; // White moves UP (-1), Black moves DOWN (+1)
      const initialRank = piece.color === 'w' ? 6 : 1;

      // 1 square forward
      if (dc === 0 && dr === dir && destPiece === null) return true;
      // 2 squares forward from starting rank
      if (dc === 0 && fromR === initialRank && dr === 2 * dir && destPiece === null && board[fromR + dir][fromC] === null) return true;
      // Diagonal capture
      if (absDc === 1 && dr === dir && destPiece !== null && destPiece.color !== piece.color) return true;
      return false;
    }

    case 'r': { // Rook (Horizontal or Vertical ONLY)
      if (absDr > 0 && absDc > 0) return false;
      return isPathClear(fromR, fromC, toR, toC, board);
    }

    case 'n': { // Knight (L-shape ONLY)
      return (absDr === 2 && absDc === 1) || (absDr === 1 && absDc === 2);
    }

    case 'b': { // Bishop (Diagonal ONLY)
      if (absDr !== absDc || absDr === 0) return false;
      return isPathClear(fromR, fromC, toR, toC, board);
    }

    case 'q': { // Queen (Straight OR Diagonal)
      const isDiagonal = absDr === absDc && absDr > 0;
      const isStraight = (absDr === 0 && absDc > 0) || (absDc === 0 && absDr > 0);
      if (!isDiagonal && !isStraight) return false;
      return isPathClear(fromR, fromC, toR, toC, board);
    }

    case 'k': { // King (1 square in any direction)
      return Math.max(absDr, absDc) === 1;
    }

    default:
      return false;
  }
};

export const ChessGame: React.FC<ChessGameProps> = ({ lobby }) => {
  const { user } = useAuth();
  const { surrenderGame, updateGameState, sendChatMessage, lobbyMessages } = useData();

  const [board, setBoard] = useState<Piece[][]>(lobby.gameState || INITIAL_BOARD);
  const [selectedSquare, setSelectedSquare] = useState<[number, number] | null>(null);
  const [currentTurn, setCurrentTurn] = useState<'w' | 'b'>('w');
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [statusNote, setStatusNote] = useState('');

  if (!user) return null;

  const isHost = user.id === lobby.hostUserId;
  const isGuest = user.id === lobby.guestUserId;
  const isWaitingForOpponent = !lobby.guestUserId && lobby.status === 'waiting';

  // Determine allowed player color in multiplayer lobby
  const myColor: 'w' | 'b' | 'both' = isHost && isGuest ? 'both' : (isHost ? 'w' : (isGuest ? 'b' : 'both'));

  const handleSquareClick = (r: number, c: number) => {
    if (lobby.status === 'finished') return;

    if (isWaitingForOpponent) {
      setStatusNote('Ожидаем подключения второго игрока в лобби!');
      return;
    }

    if (myColor !== 'both' && myColor !== currentTurn) {
      setStatusNote(`Сейчас ход ваших соперников (${currentTurn === 'w' ? 'Белые' : 'Чёрные'})!`);
      return;
    }

    if (selectedSquare) {
      const [fromR, fromC] = selectedSquare;
      if (fromR === r && fromC === c) {
        setSelectedSquare(null);
        return;
      }

      const piece = board[fromR][fromC];
      if (piece) {
        // Enforce Chess Rules
        if (!isValidChessMove(piece, fromR, fromC, r, c, board)) {
          setStatusNote(`Недопустимый ход для фигуры ${piece.type.toUpperCase()}!`);
          return;
        }

        const newBoard = board.map((row) => [...row]);
        newBoard[r][c] = piece;
        newBoard[fromR][fromC] = null;

        setBoard(newBoard);
        const colLetters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const moveText = `${piece.color.toUpperCase()}${piece.type.toUpperCase()} ${colLetters[fromC]}${8 - fromR} ➔ ${colLetters[c]}${8 - r}`;
        setMoveHistory((prev) => [moveText, ...prev]);

        setCurrentTurn(currentTurn === 'w' ? 'b' : 'w');
        setSelectedSquare(null);
        setStatusNote('');

        updateGameState(lobby.id, newBoard);
      }
    } else {
      const piece = board[r][c];
      if (piece && piece.color === currentTurn) {
        setSelectedSquare([r, c]);
        setStatusNote('');
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

        {/* Match Status Banners */}
        {isWaitingForOpponent && (
          <div className="w-full mb-4 p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-center text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 animate-pulse">
            <Users className="w-4 h-4" />
            <span>Ожидание второго игрока. Лобби создано, пригласите другого игрока!</span>
          </div>
        )}

        {statusNote && (
          <div className="w-full mb-4 p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-center text-amber-300 font-semibold text-xs flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{statusNote}</span>
          </div>
        )}

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

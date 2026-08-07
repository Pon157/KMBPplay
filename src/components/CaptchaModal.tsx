import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, CheckCircle2 } from 'lucide-react';

interface CaptchaModalProps {
  isOpen: boolean;
  onSuccess: () => void;
}

export const CaptchaModal: React.FC<CaptchaModalProps> = ({ isOpen, onSuccess }) => {
  const [num1, setNum1] = useState(7);
  const [num2, setNum2] = useState(5);
  const [userAnswer, setUserAnswer] = useState('');
  const [error, setError] = useState(false);
  const [verified, setVerified] = useState(false);

  const generatePuzzle = () => {
    setNum1(Math.floor(Math.random() * 12) + 3);
    setNum2(Math.floor(Math.random() * 10) + 2);
    setUserAnswer('');
    setError(false);
  };

  useEffect(() => {
    if (isOpen) {
      generatePuzzle();
      setVerified(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(userAnswer, 10) === num1 + num2) {
      setVerified(true);
      setTimeout(() => {
        onSuccess();
      }, 700);
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-[#131924] border border-rose-500/40 p-6 text-slate-100 shadow-2xl light:bg-white light:border-rose-300 light:text-slate-900">
        
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800 light:border-slate-200">
          <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-rose-400 light:text-rose-600">
              Система Защиты КМБП (Anti-DDoS)
            </h3>
            <p className="text-xs text-slate-400 light:text-slate-500">
              Подтвердите, что вы не бот-атакующий
            </p>
          </div>
        </div>

        {verified ? (
          <div className="py-8 flex flex-col items-center justify-center text-emerald-400 space-y-2">
            <CheckCircle2 className="w-12 h-12 animate-bounce" />
            <div className="font-bold text-base">Проверка успешно пройдена!</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center light:bg-slate-50 light:border-slate-200">
              <span className="text-xs text-slate-400 block mb-1">Решите математический пример:</span>
              <div className="text-2xl font-mono font-extrabold text-cyan-400 light:text-indigo-600 tracking-wider">
                {num1} + {num2} = ?
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Ваш ответ"
                autoFocus
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 light:bg-white light:border-slate-300 light:text-slate-900"
              />
              <button
                type="button"
                onClick={generatePuzzle}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 light:bg-slate-200"
                title="Обновить капчу"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="text-xs text-rose-400 font-medium text-center">
                Неверный ответ! Попробуйте ещё раз.
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/25 hover:opacity-90 transition-opacity"
            >
              Подтвердить Личность
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

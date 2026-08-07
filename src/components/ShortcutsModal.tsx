import React from 'react';
import { Keyboard, X } from 'lucide-react';
import { PLATFORM_SHORTCUTS } from '../utils/keyboard';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#131924] border border-slate-800 p-6 text-slate-100 shadow-2xl light:bg-white light:border-slate-200 light:text-slate-900">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 light:border-slate-200">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Горячие Клавиши</h3>
              <p className="text-xs text-slate-400 light:text-slate-500">
                Быстрая навигация по платформе КМБП
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 light:hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {PLATFORM_SHORTCUTS.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 light:bg-slate-50 light:border-slate-200"
            >
              <div>
                <div className="font-semibold text-xs text-slate-200 light:text-slate-800">
                  {item.label}
                </div>
                <div className="text-[11px] text-slate-400 light:text-slate-500">
                  {item.description}
                </div>
              </div>
              <kbd className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-slate-800 border border-slate-700 text-cyan-400 light:bg-white light:border-slate-300 light:text-indigo-600 shadow-sm">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 light:border-slate-200 text-center text-xs text-slate-400 light:text-slate-500">
          Нажмите <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">Esc</kbd> чтобы закрыть это окно
        </div>

      </div>
    </div>
  );
};

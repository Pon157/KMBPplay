import { useEffect } from 'react';

export interface ShortcutItem {
  key: string;
  label: string;
  description: string;
}

export const PLATFORM_SHORTCUTS: ShortcutItem[] = [
  { key: 'Ctrl + K', label: 'Поиск', description: 'Открыть панель быстрого поиска пользователей и комьюнити' },
  { key: 'Shift + G', label: 'Общий Чат', description: 'Быстрый переход в глобальный чат КМБП' },
  { key: 'Shift + L', label: 'Игры & Лобби', description: 'Перейти в библиотеку онлайн игр' },
  { key: 'Shift + C', label: 'Комьюнити', description: 'Перейти в раздел управления комьюнити' },
  { key: 'Shift + P', label: 'Профиль', description: 'Перейти на страницу личного профиля' },
  { key: 'Shift + A', label: 'Админка', description: 'Открыть панель администратора платформы' },
  { key: 'Shift + T', label: 'Тема', description: 'Переключить светлую/тёмную тему' },
  { key: 'Esc', label: 'Закрыть', description: 'Закрыть модальные окна и активные меню' },
  { key: 'Shift + ?', label: 'Горячие клавиши', description: 'Показать список всех горячих клавиш' },
];

export function useGlobalHotkeys(callbacks: {
  onSearch?: () => void;
  onGlobalChat?: () => void;
  onGames?: () => void;
  onCommunities?: () => void;
  onProfile?: () => void;
  onAdmin?: () => void;
  onToggleTheme?: () => void;
  onHelp?: () => void;
  onEscape?: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        if (e.key === 'Escape' && callbacks.onEscape) {
          callbacks.onEscape();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        callbacks.onSearch?.();
      } else if (e.shiftKey && e.key.toUpperCase() === 'G') {
        e.preventDefault();
        callbacks.onGlobalChat?.();
      } else if (e.shiftKey && e.key.toUpperCase() === 'L') {
        e.preventDefault();
        callbacks.onGames?.();
      } else if (e.shiftKey && e.key.toUpperCase() === 'C') {
        e.preventDefault();
        callbacks.onCommunities?.();
      } else if (e.shiftKey && e.key.toUpperCase() === 'P') {
        e.preventDefault();
        callbacks.onProfile?.();
      } else if (e.shiftKey && e.key.toUpperCase() === 'A') {
        e.preventDefault();
        callbacks.onAdmin?.();
      } else if (e.shiftKey && e.key.toUpperCase() === 'T') {
        e.preventDefault();
        callbacks.onToggleTheme?.();
      } else if (e.key === '?') {
        e.preventDefault();
        callbacks.onHelp?.();
      } else if (e.key === 'Escape') {
        callbacks.onEscape?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [callbacks]);
}

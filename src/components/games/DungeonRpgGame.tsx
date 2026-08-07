import React, { useState } from 'react';
import { Flag, Shield, Sword, Heart, Zap, Award, Sparkles, MessageSquare, Send } from 'lucide-react';
import { GameLobby } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

interface DungeonRpgGameProps {
  lobby: GameLobby;
}

interface Hero {
  id: string;
  name: string;
  classType: string;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  atk: number;
  def: number;
  level: number;
}

interface Enemy {
  name: string;
  hp: number;
  maxHp: number;
  atk: number;
  avatar: string;
}

export const DungeonRpgGame: React.FC<DungeonRpgGameProps> = ({ lobby }) => {
  const { user } = useAuth();
  const { surrenderGame, sendChatMessage, lobbyMessages } = useData();

  const [hero, setHero] = useState<Hero>({
    id: 'hero-1',
    name: 'Бот_Страж_КМБП',
    classType: 'Кибер-Воин Поддержки',
    hp: 120,
    maxHp: 120,
    mp: 60,
    maxMp: 60,
    atk: 24,
    def: 12,
    level: 3,
  });

  const [enemy, setEnemy] = useState<Enemy>({
    name: 'Дракон Спама & DDoS',
    hp: 250,
    maxHp: 250,
    atk: 18,
    avatar: '🐉',
  });

  const [battleLog, setBattleLog] = useState<string[]>([
    'Вы вошли в Глубокое Подземелье Серверов КМБП!',
    'Босс "Дракон Спама & DDoS" преграждает путь!',
  ]);

  const [chatInput, setChatInput] = useState('');

  if (!user) return null;

  const handleAttack = () => {
    if (enemy.hp <= 0 || hero.hp <= 0) return;

    // Hero attack
    const dmg = Math.floor(hero.atk * (1 + Math.random() * 0.4));
    const newEnemyHp = Math.max(0, enemy.hp - dmg);
    
    // Enemy counter-attack
    const enemyDmg = Math.max(2, Math.floor(enemy.atk - hero.def * 0.3));
    const newHeroHp = Math.max(0, hero.hp - enemyDmg);

    setEnemy((prev) => ({ ...prev, hp: newEnemyHp }));
    setHero((prev) => ({ ...prev, hp: newHeroHp }));

    setBattleLog((prev) => [
      `Вы нанесли ${dmg} урона по ${enemy.name}!`,
      `${enemy.name} ответил ударом на ${enemyDmg} урона!`,
      ...prev,
    ]);
  };

  const handleHeal = () => {
    if (hero.mp < 15) {
      setBattleLog((prev) => ['Недостаточно маны для заклинания!', ...prev]);
      return;
    }

    const healAmount = 45;
    setHero((prev) => ({
      ...prev,
      hp: Math.min(prev.maxHp, prev.hp + healAmount),
      mp: prev.mp - 15,
    }));

    setBattleLog((prev) => [
      `Вы применили заклинание "Восстановление Бот-Сети" (+${healAmount} HP)!`,
      ...prev,
    ]);
  };

  const handleSurrender = () => {
    if (confirm('Сдаться и отступить из Подземелья?')) {
      surrenderGame(lobby.id);
    }
  };

  const currentMsgs = lobbyMessages[lobby.id] || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* RPG Stage Column */}
      <div className="lg:col-span-2 p-6 rounded-3xl bg-[#131924] border border-slate-800 space-y-6 shadow-2xl light:bg-white light:border-slate-200">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 light:border-slate-200">
          <div>
            <h2 className="font-extrabold text-base text-cyan-400 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <span>КМБП: Хроники Подземелий (Тактическая Стратегия)</span>
            </h2>
            <p className="text-xs text-slate-400">Многочасовая кооперативная RPG кампания против серверных боссов</p>
          </div>

          <button
            onClick={handleSurrender}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 flex items-center gap-1.5"
          >
            <Flag className="w-4 h-4" />
            <span>Сдаться & Отступить</span>
          </button>
        </div>

        {/* Battle Screen Canvas Area */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Hero Card */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-cyan-400">{hero.name}</h3>
                <span className="text-[10px] text-slate-400">{hero.classType} • Ур. {hero.level}</span>
              </div>
              <Shield className="w-6 h-6 text-cyan-400" />
            </div>

            {/* Health Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-rose-400 font-bold flex items-center gap-1"><Heart className="w-3 h-3" /> HP</span>
                <span className="font-mono">{hero.hp} / {hero.maxHp}</span>
              </div>
              <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-rose-500 transition-all"
                  style={{ width: `${(hero.hp / hero.maxHp) * 100}%` }}
                />
              </div>
            </div>

            {/* Mana Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-cyan-400 font-bold flex items-center gap-1"><Zap className="w-3 h-3" /> MP</span>
                <span className="font-mono">{hero.mp} / {hero.maxMp}</span>
              </div>
              <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-cyan-400 transition-all"
                  style={{ width: `${(hero.mp / hero.maxMp) * 100}%` }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={handleAttack}
                disabled={enemy.hp <= 0 || hero.hp <= 0}
                className="py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md hover:opacity-90"
              >
                <Sword className="w-4 h-4" />
                <span>Атака</span>
              </button>

              <button
                onClick={handleHeal}
                disabled={enemy.hp <= 0 || hero.hp <= 0}
                className="py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md hover:opacity-90"
              >
                <Sparkles className="w-4 h-4" />
                <span>Лечение</span>
              </button>
            </div>
          </div>

          {/* Enemy Boss Card */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-rose-500/30 space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-rose-400">{enemy.name}</h3>
                <span className="text-[10px] text-slate-400">Босс Рейда Подземелья</span>
              </div>
              <span className="text-3xl">{enemy.avatar}</span>
            </div>

            {/* Enemy Health Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-rose-400 font-bold">Здоровье Босса</span>
                <span className="font-mono">{enemy.hp} / {enemy.maxHp}</span>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-rose-600 transition-all"
                  style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
                />
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300">
              {enemy.hp <= 0 ? '🎉 Босс повержен! Рейд успешно пройден!' : 'Босс наносит массивный урон по всей группе.'}
            </div>
          </div>

        </div>

        {/* Battle Log */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <h4 className="text-xs font-bold text-cyan-400">Лог Сражения</h4>
          <div className="h-28 overflow-y-auto space-y-1 text-[11px] font-mono text-slate-300 pr-1">
            {battleLog.map((log, i) => (
              <div key={i}>• {log}</div>
            ))}
          </div>
        </div>

      </div>

      {/* Mini Chat */}
      <div className="p-4 rounded-2xl bg-[#131924] border border-slate-800 light:bg-white light:border-slate-200 flex flex-col h-80">
        <h3 className="font-bold text-xs text-cyan-400 light:text-indigo-600 mb-2 flex items-center gap-1">
          <MessageSquare className="w-3.5 h-3.5" /> Чат Рейда
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
            placeholder="Сообщение рейду..."
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

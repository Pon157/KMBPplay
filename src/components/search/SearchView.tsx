import React, { useState } from 'react';
import { Search, User, Users, ArrowRight, UserPlus, Star } from 'lucide-react';
import { useData } from '../../context/DataContext';

export const SearchView: React.FC = () => {
  const { communities } = useData();
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'users' | 'communities'>('all');

  const filteredCommunities = communities.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.username.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Search Bar Header */}
      <div className="p-6 rounded-3xl bg-[#131924] border border-slate-800 light:bg-white light:border-slate-200 space-y-4">
        <h1 className="text-xl font-extrabold text-slate-100 light:text-slate-900 flex items-center gap-2">
          <Search className="w-5 h-5 text-cyan-400 light:text-indigo-600" />
          <span>Глобальный Поиск КМБП</span>
        </h1>

        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Введите никнейм пользователя или название комьюнити..."
            autoFocus
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 light:bg-slate-50 light:border-slate-300 light:text-slate-900 shadow-inner"
          />
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === 'all'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 light:bg-indigo-600 light:text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Всё
          </button>
          <button
            onClick={() => setFilterType('communities')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterType === 'communities'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 light:bg-indigo-600 light:text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Комьюнити ({filteredCommunities.length})
          </button>
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Результаты Поиска
        </h2>

        {filteredCommunities.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            По запросу "{query}" ничего не найдено.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCommunities.map((comm) => (
              <div
                key={comm.id}
                className="p-4 rounded-2xl bg-[#131924] border border-slate-800 flex items-center justify-between gap-4 light:bg-white light:border-slate-200"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={comm.avatar}
                    alt={comm.name}
                    className="w-12 h-12 rounded-xl object-cover border border-cyan-500/30"
                  />
                  <div>
                    <h3 className="font-bold text-sm text-slate-100 light:text-slate-900">{comm.name}</h3>
                    <div className="text-[11px] text-cyan-400 font-mono">@{comm.username}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-amber-400 font-bold flex items-center gap-0.5">
                    <Star className="w-3.5 h-3.5 fill-current" /> {comm.rating}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

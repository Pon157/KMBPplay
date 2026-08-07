import React, { useState } from 'react';
import {
  Users,
  Plus,
  Crown,
  Shield,
  UserX,
  UserMinus,
  MessageSquare,
  Trophy,
  Gamepad2,
  Lock,
  Tag,
  Star,
  Mic,
  Palette,
  Send,
  Pin
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Community } from '../../types';

export const CommunityView: React.FC = () => {
  const { user } = useAuth();
  const {
    communities,
    createCommunity,
    joinCommunity,
    leaveCommunity,
    kickCommunityMember,
    banCommunityMember,
    updateMemberRole,
    sendChatMessage,
    communityMessages,
    deleteChatMessage,
  } = useData();

  const [activeTab, setActiveTab] = useState<'my_owned' | 'my_joined' | 'all' | 'create'>('my_owned');
  const [selectedComm, setSelectedComm] = useState<Community | null>(null);

  // New Community Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [description, setDescription] = useState('');
  const [avatar, setAvatar] = useState('');
  const [tags, setTags] = useState('Поддержка, Турниры');
  const [isPrivate, setIsPrivate] = useState(false);

  // Mini-chat state inside community
  const [chatInput, setChatInput] = useState('');

  if (!user) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username) return;
    const tagArray = tags.split(',').map((t) => t.trim()).filter(Boolean);
    const newC = createCommunity(name, username, description, avatar, tagArray, isPrivate);
    setSelectedComm(newC);
    setActiveTab('my_owned');
  };

  const ownedCommunities = communities.filter((c) => c.ownerId === user.id);
  const joinedCommunities = communities.filter(
    (c) => c.members.some((m) => m.userId === user.id) && c.ownerId !== user.id
  );

  const handleSendCommunityMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComm || !chatInput.trim()) return;
    sendChatMessage('community', selectedComm.id, 'text', chatInput);
    setChatInput('');
  };

  const currentMessages = selectedComm ? communityMessages[selectedComm.id] || [] : [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Top Header & Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 light:border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 light:text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-400 light:text-indigo-600" />
            <span>Комьюнити КМБП</span>
          </h1>
          <p className="text-xs text-slate-400 light:text-slate-500 mt-0.5">
            Объединяйтесь в клубы ботов поддержки, устраивайте турниры и развивайте собственный рейтинг
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800 light:bg-slate-100 light:border-slate-200">
          <button
            onClick={() => {
              setActiveTab('my_owned');
              setSelectedComm(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'my_owned'
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 light:text-slate-600'
            }`}
          >
            Владею я ({ownedCommunities.length})
          </button>

          <button
            onClick={() => {
              setActiveTab('my_joined');
              setSelectedComm(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'my_joined'
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 light:text-slate-600'
            }`}
          >
            Я подписан ({joinedCommunities.length})
          </button>

          <button
            onClick={() => {
              setActiveTab('all');
              setSelectedComm(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 light:text-slate-600'
            }`}
          >
            Все комьюнити
          </button>

          <button
            onClick={() => {
              setActiveTab('create');
              setSelectedComm(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              activeTab === 'create'
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md'
                : 'text-cyan-400 hover:text-cyan-300 light:text-indigo-600'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Создать</span>
          </button>
        </div>
      </div>

      {/* VIEW COMMUNITY WORKSPACE */}
      {selectedComm ? (
        <div className="space-y-6 animate-fade-in">
          
          {/* Back button */}
          <button
            onClick={() => setSelectedComm(null)}
            className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1"
          >
            ← Назад к списку комьюнити
          </button>

          {/* Community Banner */}
          <div className="p-6 rounded-3xl bg-[#131924] border border-slate-800 light:bg-white light:border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <img
                src={selectedComm.avatar}
                alt={selectedComm.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-cyan-500/40 shadow-lg"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold">{selectedComm.name}</h2>
                  <span className="text-xs font-mono text-cyan-400 light:text-indigo-600 font-bold">
                    @{selectedComm.username}
                  </span>
                </div>
                <p className="text-xs text-slate-300 light:text-slate-600 mt-1 max-w-xl">
                  {selectedComm.description}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <Star className="w-3.5 h-3.5 fill-current" /> Рейтинг: {selectedComm.rating}
                  </span>
                  <span>Участников: {selectedComm.members.length}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div>
              {selectedComm.ownerId !== user.id && (
                selectedComm.members.some((m) => m.userId === user.id) ? (
                  <button
                    onClick={() => leaveCommunity(selectedComm.id)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30"
                  >
                    Отписаться
                  </button>
                ) : (
                  <button
                    onClick={() => joinCommunity(selectedComm.id)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/25"
                  >
                    Вступить в Комьюнити
                  </button>
                )
              )}
            </div>
          </div>

          {/* Grid Layout: Mini-Chat & Members Management */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Mini-chat & Tournaments */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Community Mini-Chat */}
              <div className="p-5 rounded-2xl bg-[#131924] border border-slate-800 light:bg-white light:border-slate-200 flex flex-col h-[400px]">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 light:border-slate-200 mb-3">
                  <h3 className="font-bold text-xs text-cyan-400 light:text-indigo-600 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4" />
                    <span>Мини-чат комьюнити</span>
                  </h3>
                  <span className="text-[10px] text-slate-500">Участников в чате: {selectedComm.members.length}</span>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 text-xs">
                  {currentMessages.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      Чат пока пуст. Напишите первое сообщение!
                    </div>
                  ) : (
                    currentMessages.map((msg) => (
                      <div key={msg.id} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 light:bg-slate-50 light:border-slate-200 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-cyan-400">{msg.senderNickname}</span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-200 light:text-slate-800">{msg.content}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Send Input */}
                <form onSubmit={handleSendCommunityMessage} className="mt-3 flex gap-2 pt-2 border-t border-slate-800 light:border-slate-200">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Написать в чат комьюнити..."
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 light:bg-slate-50 light:border-slate-300 light:text-slate-900"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-white hover:bg-cyan-600"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>

            </div>

            {/* Right Col: Member Management & Rights */}
            <div className="p-5 rounded-2xl bg-[#131924] border border-slate-800 light:bg-white light:border-slate-200 space-y-4">
              <h3 className="font-bold text-xs text-cyan-400 light:text-indigo-600 flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span>Участники ({selectedComm.members.length})</span>
              </h3>

              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {selectedComm.members.map((m) => (
                  <div
                    key={m.userId}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs light:bg-slate-50 light:border-slate-200"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-[10px]">
                        ID
                      </div>
                      <div>
                        <div className="font-bold text-slate-200 light:text-slate-800">
                          {m.userId === user.id ? `${user.nickname} (Вы)` : `Участник ${m.userId.slice(-4)}`}
                        </div>
                        <div className="text-[10px] text-slate-400 capitalize">{m.role}</div>
                      </div>
                    </div>

                    {/* Owner / Admin Management Controls */}
                    {selectedComm.ownerId === user.id && m.userId !== user.id && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => kickCommunityMember(selectedComm.id, m.userId)}
                          className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                          title="Кикнуть из комьюнити"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => banCommunityMember(selectedComm.id, m.userId)}
                          className="p-1 rounded bg-rose-600/20 hover:bg-rose-600/30 text-rose-300"
                          title="Забанить"
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      ) : (
        <>
          {/* TAB: CREATE NEW COMMUNITY */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateSubmit} className="max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl bg-[#131924] border border-slate-800 light:bg-white light:border-slate-200 space-y-5 animate-fade-in">
              <h2 className="text-lg font-bold text-cyan-400 light:text-indigo-600 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                <span>Создание Нового Комьюнити Бот-Поддержки</span>
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 light:text-slate-700 mb-1">
                    Название комьюнити
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Клуб Шахматистов Бот-Поддержки №1"
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 light:bg-slate-50 light:border-slate-300 light:text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 light:text-slate-700 mb-1">
                    Юзернейм комьюнити (@handle)
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="bot_chess_club"
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 light:bg-slate-50 light:border-slate-300 light:text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 light:text-slate-700 mb-1">
                    Ссылка на Аватар
                  </label>
                  <input
                    type="text"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 light:bg-slate-50 light:border-slate-300 light:text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 light:text-slate-700 mb-1">
                    Описание
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Описание целей комьюнити, правилах турниров..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 light:bg-slate-50 light:border-slate-300 light:text-slate-900 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/25"
                >
                  Опубликовать и Создать Комьюнити
                </button>
              </div>
            </form>
          )}

          {/* LIST COMMUNITIES */}
          {activeTab !== 'create' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(activeTab === 'my_owned' ? ownedCommunities : activeTab === 'my_joined' ? joinedCommunities : communities).map((comm) => (
                <div
                  key={comm.id}
                  onClick={() => setSelectedComm(comm)}
                  className="p-5 rounded-2xl bg-[#131924] border border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer shadow-lg space-y-3 light:bg-white light:border-slate-200"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={comm.avatar}
                      alt={comm.name}
                      className="w-12 h-12 rounded-xl object-cover border border-cyan-500/30"
                    />
                    <div>
                      <h3 className="font-bold text-sm text-slate-100 light:text-slate-900 line-clamp-1">{comm.name}</h3>
                      <div className="text-[11px] text-cyan-400 font-mono">@{comm.username}</div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 light:text-slate-600 line-clamp-2">
                    {comm.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800 light:border-slate-200 text-slate-400">
                    <span className="flex items-center gap-1 text-amber-400 font-bold">
                      <Star className="w-3.5 h-3.5 fill-current" /> {comm.rating}
                    </span>
                    <span>{comm.members.length} участников</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

    </div>
  );
};

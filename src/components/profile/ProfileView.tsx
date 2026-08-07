import React, { useState } from 'react';
import {
  User as UserIcon,
  Edit3,
  Check,
  Heart,
  MessageCircle,
  Shield,
  Activity,
  Calendar,
  Send,
  Users,
  KeyRound,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

export const ProfileView: React.FC = () => {
  const { user, updateProfile, securityLogs } = useAuth();
  const { signatures, addWallSignature, likeSignature, replyToSignature } = useData();

  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');

  const [activeTab, setActiveTab] = useState<'wall' | 'security' | 'friends'>('wall');
  const [newSigContent, setNewSigContent] = useState('');
  const [replyInput, setReplyInput] = useState<Record<string, string>>({});

  if (!user) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      nickname,
      bio,
      avatar,
    });
    setIsEditing(false);
  };

  const handlePostSignature = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSigContent.trim()) return;
    addWallSignature(user.id, newSigContent);
    setNewSigContent('');
  };

  const handleReplySubmit = (sigId: string) => {
    const text = replyInput[sigId];
    if (!text || !text.trim()) return;
    replyToSignature(sigId, text);
    setReplyInput((prev) => ({ ...prev, [sigId]: '' }));
  };

  const userSignatures = signatures.filter((s) => s.targetUserId === user.id);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Profile Header Card */}
      <div className="relative rounded-3xl bg-[#131924] border border-slate-800 p-6 sm:p-8 text-slate-100 shadow-2xl overflow-hidden light:bg-white light:border-slate-200 light:text-slate-900">
        
        {/* Background Ambient Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar */}
          <div className="relative group shrink-0">
            <img
              src={user.avatar || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80'}
              alt={user.nickname}
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border-2 border-cyan-500/50 shadow-xl shadow-cyan-500/20"
            />
            {user.isOnline && (
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#131924] light:border-white shadow-sm" title="В сети" />
            )}
          </div>

          {/* User Bio & Details */}
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <h1 className="text-2xl font-extrabold">{user.nickname}</h1>
                  {user.role === 'admin' && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Администратор
                    </span>
                  )}
                </div>
                <div className="text-sm font-mono text-cyan-400 light:text-indigo-600 font-semibold mt-0.5">
                  @{user.username}
                </div>
              </div>

              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 light:bg-slate-100 light:border-slate-300 light:text-slate-800 flex items-center justify-center gap-1.5 transition-all"
              >
                <Edit3 className="w-4 h-4" />
                <span>{isEditing ? 'Отмена' : 'Редактировать'}</span>
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 light:text-slate-600 max-w-2xl leading-relaxed">
              {user.bio || 'Пользователь пока не добавил информацию о себе.'}
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 text-xs text-slate-400 light:text-slate-500">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>На платформе с {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Telegram: @{user.telegramUsername || 'не привязан'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form Drawer */}
        {isEditing && (
          <form onSubmit={handleSaveProfile} className="mt-6 pt-6 border-t border-slate-800 light:border-slate-200 space-y-4 animate-fade-in">
            <h3 className="font-bold text-sm text-cyan-400 light:text-indigo-600">
              Настройки Профиля
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 light:text-slate-700 mb-1">
                  Никнейм
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 light:bg-slate-50 light:border-slate-300 light:text-slate-900"
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
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 light:bg-slate-50 light:border-slate-300 light:text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 light:text-slate-700 mb-1">
                Информация О Себе
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 light:bg-slate-50 light:border-slate-300 light:text-slate-900 resize-none"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/25 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Сохранить Изменения</span>
            </button>
          </form>
        )}

      </div>

      {/* Sub-tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 light:border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('wall')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'wall'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 light:bg-indigo-600 light:text-white'
              : 'text-slate-400 hover:text-slate-200 light:text-slate-600'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Стена Росписи ({userSignatures.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'security'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 light:bg-indigo-600 light:text-white'
              : 'text-slate-400 hover:text-slate-200 light:text-slate-600'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>История Активностей & Входов ({securityLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('friends')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'friends'
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 light:bg-indigo-600 light:text-white'
              : 'text-slate-400 hover:text-slate-200 light:text-slate-600'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Друзья ({user.friends.length})</span>
        </button>
      </div>

      {/* TAB 1: WALL SIGNATURES ("Расписываться в профилях каждого") */}
      {activeTab === 'wall' && (
        <div className="space-y-4">
          {/* Post New Signature Form */}
          <form onSubmit={handlePostSignature} className="p-4 rounded-2xl bg-[#131924] border border-slate-800 light:bg-white light:border-slate-200 flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-300 light:text-slate-700">Оставить роспись на стене</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSigContent}
                onChange={(e) => setNewSigContent(e.target.value)}
                placeholder="Оставьте памятную автограф-роспись или пожелание..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 light:bg-slate-50 light:border-slate-300 light:text-slate-900"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>Расписаться</span>
              </button>
            </div>
          </form>

          {/* Wall Signatures Feed */}
          {userSignatures.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-500">
              На стене пока нет росписей. Будьте первым, кто распишется!
            </div>
          ) : (
            <div className="space-y-3">
              {userSignatures.map((sig) => (
                <div
                  key={sig.id}
                  className="p-4 rounded-2xl bg-[#131924] border border-slate-800 space-y-3 light:bg-white light:border-slate-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={sig.authorAvatar}
                        alt={sig.authorNickname}
                        className="w-8 h-8 rounded-lg object-cover border border-cyan-500/30"
                      />
                      <div>
                        <div className="font-bold text-xs">{sig.authorNickname}</div>
                        <div className="text-[10px] text-slate-400">@{sig.authorUsername}</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {new Date(sig.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 light:text-slate-800 pl-1">
                    {sig.content}
                  </p>

                  <div className="flex items-center gap-4 pt-1 text-xs">
                    <button
                      onClick={() => likeSignature(sig.id)}
                      className={`flex items-center gap-1 text-xs font-semibold ${
                        sig.likes.includes(user.id) ? 'text-rose-400' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Heart className="w-3.5 h-3.5 fill-current" />
                      <span>{sig.likes.length}</span>
                    </button>
                  </div>

                  {/* Replies List */}
                  {sig.replies.length > 0 && (
                    <div className="pl-4 border-l-2 border-slate-800 light:border-slate-200 space-y-2 mt-2">
                      {sig.replies.map((reply) => (
                        <div key={reply.id} className="text-xs space-y-0.5">
                          <span className="font-bold text-cyan-400 light:text-indigo-600">{reply.authorNickname}: </span>
                          <span className="text-slate-300 light:text-slate-700">{reply.content}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Input */}
                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      value={replyInput[sig.id] || ''}
                      onChange={(e) => setReplyInput({ ...replyInput, [sig.id]: e.target.value })}
                      placeholder="Ответить на роспись..."
                      className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 light:bg-slate-50 light:border-slate-200 light:text-slate-900"
                    />
                    <button
                      onClick={() => handleReplySubmit(sig.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-cyan-400 font-bold light:bg-slate-100"
                    >
                      Ответить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LOGINS & SECURITY ACTIVITY LOG ("Уведомления о входах в аккаунт и действиях") */}
      {activeTab === 'security' && (
        <div className="rounded-2xl bg-[#131924] border border-slate-800 p-5 light:bg-white light:border-slate-200 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 light:border-slate-200">
            <div>
              <h3 className="font-bold text-sm text-cyan-400 light:text-indigo-600">
                Журнал Безопасности Аккаунта
              </h3>
              <p className="text-xs text-slate-400 light:text-slate-500">
                Все входы, привязки Telegram и изменения настроек с указанием IP-адреса
              </p>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {securityLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs light:bg-slate-50 light:border-slate-200"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-200 light:text-slate-900">{log.details}</div>
                    <div className="text-[10px] text-slate-400">
                      Устройство: {log.device} • IP: <code className="text-cyan-400 font-mono">{log.ipAddress}</code>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                  <span className="inline-block mt-0.5 px-2 py-0.5 text-[9px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {log.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: FRIENDS LIST */}
      {activeTab === 'friends' && (
        <div className="p-5 rounded-2xl bg-[#131924] border border-slate-800 light:bg-white light:border-slate-200">
          <h3 className="font-bold text-sm text-cyan-400 light:text-indigo-600 mb-3">
            Список Друзей на Платформе
          </h3>
          <div className="text-xs text-slate-400">
            Вы можете приглашать друзей из списка в создаваемые игровые лобби.
          </div>
        </div>
      )}

    </div>
  );
};

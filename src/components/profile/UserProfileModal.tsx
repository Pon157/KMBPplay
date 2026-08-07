import React, { useState } from 'react';
import {
  X,
  UserCheck,
  UserPlus,
  MessageSquare,
  Send,
  Heart,
  Calendar,
  Shield,
  Award,
  FileText,
  Clock
} from 'lucide-react';
import { User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

interface UserProfileModalProps {
  user: User | null;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ user: targetUser, onClose }) => {
  const { user: currentUser, updateProfile } = useAuth();
  const { signatures, addWallSignature, likeSignature, replyToSignature, setCurrentView } = useData();

  const [sigText, setSigText] = useState('');
  const [replyInput, setReplyInput] = useState<Record<string, string>>({});

  if (!targetUser) return null;

  const isSelf = currentUser?.id === targetUser.id;
  const isFriend = currentUser?.friends?.includes(targetUser.id);

  const toggleFriend = () => {
    if (!currentUser) return;
    const currentFriends = currentUser.friends || [];
    let updated: string[];
    if (isFriend) {
      updated = currentFriends.filter((id) => id !== targetUser.id);
    } else {
      updated = [...currentFriends, targetUser.id];
    }
    updateProfile({ friends: updated });
  };

  const handleMentionInChat = () => {
    setCurrentView('global_chat');
    onClose();
  };

  const handleGoToMyProfile = () => {
    setCurrentView('profile');
    onClose();
  };

  const handlePostSignature = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sigText.trim()) return;
    addWallSignature(targetUser.id, sigText.trim());
    setSigText('');
  };

  const handleReplySubmit = (sigId: string) => {
    const text = replyInput[sigId];
    if (!text || !text.trim()) return;
    replyToSignature(sigId, text.trim());
    setReplyInput((prev) => ({ ...prev, [sigId]: '' }));
  };

  const userSigs = signatures.filter((s) => s.targetUserId === targetUser.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#131924] border border-slate-800 p-6 sm:p-8 text-slate-100 shadow-2xl light:bg-white light:border-slate-200 light:text-slate-900">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 light:bg-slate-200 light:text-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Profile Card Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-slate-800 light:border-slate-200">
          <div className="relative shrink-0">
            <img
              src={targetUser.avatar || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80'}
              alt={targetUser.nickname}
              className="w-24 h-24 rounded-2xl object-cover border-2 border-cyan-500/50 shadow-lg shadow-cyan-500/20"
            />
            {targetUser.isOnline && (
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#131924] light:border-white" title="В сети" />
            )}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-2xl font-extrabold">{targetUser.nickname}</h2>
              {targetUser.role === 'admin' && (
                <span className="px-2.5 py-0.5 text-[10px] font-bold rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Администратор
                </span>
              )}
            </div>
            
            <div className="text-xs font-mono text-cyan-400 light:text-indigo-600 font-bold">
              @{targetUser.username}
            </div>

            <p className="text-xs text-slate-300 light:text-slate-600 leading-relaxed max-w-md">
              {targetUser.bio || 'Информация о пользователе отсутствует.'}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-1 text-[11px] text-slate-400">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>Регистрация: {new Date(targetUser.createdAt).toLocaleDateString()}</span>
              </div>
              {targetUser.telegramUsername && (
                <div className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>TG: @{targetUser.telegramUsername}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-3">
              {isSelf ? (
                <button
                  onClick={handleGoToMyProfile}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all flex items-center gap-1.5"
                >
                  <FileText className="w-4 h-4" />
                  <span>Перейти в мой профиль</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={toggleFriend}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isFriend
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-rose-500/20 hover:text-rose-300'
                        : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-md shadow-cyan-500/20'
                    }`}
                  >
                    {isFriend ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    <span>{isFriend ? 'В друзьяx' : 'Добавить в друзья'}</span>
                  </button>

                  <button
                    onClick={handleMentionInChat}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 light:bg-slate-100 light:border-slate-300 light:text-slate-800 transition-all flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-4 h-4 text-cyan-400" />
                    <span>Написать в чат</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Wall Signatures Section */}
        <div className="mt-6 space-y-4">
          <h3 className="font-bold text-sm text-cyan-400 light:text-indigo-600 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>Стена росписей ({userSigs.length})</span>
          </h3>

          {/* Post Signature Form */}
          {currentUser && (
            <form onSubmit={handlePostSignature} className="flex gap-2">
              <input
                type="text"
                value={sigText}
                onChange={(e) => setSigText(e.target.value)}
                placeholder={isSelf ? "Оставить запись на своей стене..." : `Оставить роспись на стене ${targetUser.nickname}...`}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 light:bg-slate-50 light:border-slate-300 light:text-slate-900"
              />
              <button
                type="submit"
                disabled={!sigText.trim()}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-indigo-600 text-white hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Отправить</span>
              </button>
            </form>
          )}

          {/* Signatures List */}
          {userSigs.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500">
              На стене пользователя пока нет росписей. Будьте первым!
            </div>
          ) : (
            <div className="space-y-3">
              {userSigs.map((sig) => (
                <div key={sig.id} className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 light:bg-slate-50 light:border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src={sig.authorAvatar} alt={sig.authorNickname} className="w-6 h-6 rounded-lg object-cover" />
                      <span className="font-bold text-xs text-slate-200 light:text-slate-800">{sig.authorNickname}</span>
                      <span className="text-[10px] text-cyan-400 font-mono">@{sig.authorUsername}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{new Date(sig.createdAt).toLocaleDateString()}</span>
                  </div>

                  <p className="text-xs text-slate-300 light:text-slate-700 pl-8">{sig.content}</p>

                  <div className="flex items-center justify-between pl-8 text-[11px] text-slate-400">
                    <button
                      onClick={() => likeSignature(sig.id)}
                      className="flex items-center gap-1 hover:text-rose-400 transition-colors"
                    >
                      <Heart className={`w-3.5 h-3.5 ${sig.likes.includes(currentUser?.id || '') ? 'fill-rose-500 text-rose-500' : ''}`} />
                      <span>{sig.likes.length}</span>
                    </button>
                  </div>

                  {/* Replies */}
                  {sig.replies && sig.replies.length > 0 && (
                    <div className="pl-8 space-y-1.5 pt-1 border-t border-slate-800/60 light:border-slate-200">
                      {sig.replies.map((rep) => (
                        <div key={rep.id} className="text-xs flex items-start gap-2">
                          <img src={rep.authorAvatar} alt={rep.authorNickname} className="w-5 h-5 rounded object-cover mt-0.5" />
                          <div>
                            <span className="font-bold text-[11px] text-cyan-400">{rep.authorNickname}: </span>
                            <span className="text-slate-300 light:text-slate-700">{rep.content}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Inline Reply Form */}
                  {currentUser && (
                    <div className="pl-8 pt-1 flex gap-2">
                      <input
                        type="text"
                        value={replyInput[sig.id] || ''}
                        onChange={(e) => setReplyInput({ ...replyInput, [sig.id]: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleReplySubmit(sig.id)}
                        placeholder="Ответить на роспись..."
                        className="flex-1 px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-200 focus:outline-none focus:border-cyan-500 light:bg-white light:border-slate-300 light:text-slate-900"
                      />
                      <button
                        onClick={() => handleReplySubmit(sig.id)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 text-[10px] font-bold text-slate-300 hover:bg-slate-700"
                      >
                        Ответить
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

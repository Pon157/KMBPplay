import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Mic,
  Palette,
  Send,
  Pin,
  Trash2,
  Square,
  Play,
  Pause,
  X,
  RotateCcw,
  ShieldAlert,
  Volume2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

export const GlobalChat: React.FC = () => {
  const { user } = useAuth();
  const { globalMessages, sendChatMessage, deleteChatMessage, pinChatMessage } = useData();

  const [textInput, setTextInput] = useState('');

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<any>(null);

  // Drawing Canvas State
  const [isDrawingModalOpen, setIsDrawingModalOpen] = useState(false);
  const [brushColor, setBrushColor] = useState('#00E5FF');
  const [brushSize, setBrushSize] = useState(4);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Audio Playback State
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [globalMessages]);

  if (!user) return null;

  // Send Text Message
  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    sendChatMessage('global', undefined, 'text', textInput);
    setTextInput('');
  };

  // Start Audio Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          sendChatMessage('global', undefined, 'voice', base64Audio, recordingSeconds);
          setRecordingSeconds(0);
        };
        // stop audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      recordTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Микрофон недоступен или разрешение было отклонено.');
    }
  };

  // Stop Audio Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordTimerRef.current);
    }
  };

  // Canvas Drawing Handlers
  const startCanvasDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const drawOnCanvas = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopCanvasDraw = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0B0F17';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const sendCanvasDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    sendChatMessage('global', undefined, 'drawing', dataUrl);
    setIsDrawingModalOpen(false);
  };

  useEffect(() => {
    if (isDrawingModalOpen) {
      setTimeout(() => {
        clearCanvas();
      }, 100);
    }
  }, [isDrawingModalOpen]);

  const playVoice = (msgId: string, audioData: string) => {
    const audio = new Audio(audioData);
    setPlayingAudioId(msgId);
    audio.play();
    audio.onended = () => setPlayingAudioId(null);
  };

  const pinnedMessages = globalMessages.filter((m) => m.isPinned);

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      
      {/* Pinned Messages Header Banner */}
      {pinnedMessages.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-cyan-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Pin className="w-4 h-4 text-amber-400 animate-bounce" />
            <span className="font-bold text-amber-300">Закрепленное сообщение:</span>
            <span className="text-slate-200 truncate max-w-xl">{pinnedMessages[0].content}</span>
          </div>
          <span className="text-[10px] text-slate-400">от {pinnedMessages[0].senderNickname}</span>
        </div>
      )}

      {/* Main Chat Box */}
      <div className="rounded-3xl bg-[#131924] border border-slate-800 p-4 sm:p-6 shadow-2xl flex flex-col h-[650px] light:bg-white light:border-slate-200">
        
        {/* Chat Title */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 light:border-slate-200 mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-cyan-400 light:text-indigo-600" />
            <h2 className="font-extrabold text-base text-slate-100 light:text-slate-900">
              Глобальный Чат КМБП
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>S3 Медиа-хранилище активно</span>
          </div>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {globalMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 p-3 rounded-2xl transition-colors ${
                msg.senderId === user.id
                  ? 'bg-cyan-500/10 border border-cyan-500/30 ml-8 light:bg-indigo-50 light:border-indigo-200'
                  : 'bg-slate-900/80 border border-slate-800 mr-8 light:bg-slate-50 light:border-slate-200'
              }`}
            >
              <img
                src={msg.senderAvatar}
                alt={msg.senderNickname}
                className="w-9 h-9 rounded-xl object-cover border border-cyan-500/30 shrink-0 mt-0.5"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-100 light:text-slate-900">
                      {msg.senderNickname}
                    </span>
                    <span className="text-[10px] text-cyan-400 font-mono">@{msg.senderUsername}</span>
                    {msg.senderRole === 'admin' && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-purple-500/20 text-purple-300">
                        Админ
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    {/* Admin Moderation Actions */}
                    {user.role === 'admin' && (
                      <div className="flex items-center gap-1 opacity-60 hover:opacity-100">
                        <button
                          onClick={() => pinChatMessage(msg.id, 'global')}
                          className="p-1 hover:text-amber-400 text-slate-400"
                          title="Закрепить сообщение"
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteChatMessage(msg.id, 'global')}
                          className="p-1 hover:text-rose-400 text-slate-400"
                          title="Удалить сообщение"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Message Content according to type */}
                {msg.type === 'text' && (
                  <p className="text-xs text-slate-200 light:text-slate-800 mt-1 leading-relaxed break-words">
                    {msg.content}
                  </p>
                )}

                {/* Voice Message */}
                {msg.type === 'voice' && (
                  <div className="mt-2 flex items-center gap-3 p-2 rounded-xl bg-slate-800/80 border border-slate-700 max-w-xs light:bg-white light:border-slate-200">
                    <button
                      onClick={() => playVoice(msg.id, msg.content)}
                      className="p-2 rounded-lg bg-cyan-500 text-white hover:bg-cyan-600"
                    >
                      {playingAudioId === msg.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <div className="flex-1">
                      <div className="text-[10px] text-cyan-400 font-bold flex items-center gap-1">
                        <Volume2 className="w-3 h-3" /> Голосовое сообщение
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-cyan-400 w-1/2 animate-pulse" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Drawing / Doodle */}
                {msg.type === 'drawing' && (
                  <div className="mt-2 inline-block rounded-xl overflow-hidden border-2 border-cyan-500/40 bg-black/80 max-w-sm">
                    <img src={msg.content} alt="Canvas Doodle" className="max-h-48 object-contain" />
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Controls Bar */}
        <div className="pt-3 border-t border-slate-800 light:border-slate-200 flex flex-col gap-2">
          
          {/* Recording Timer Banner */}
          {isRecording && (
            <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-between text-xs text-rose-300 animate-pulse">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 animate-bounce" />
                <span>Идёт запись голосового: {recordingSeconds} сек...</span>
              </div>
              <button
                type="button"
                onClick={stopRecording}
                className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold text-xs"
              >
                Отправить
              </button>
            </div>
          )}

          <form onSubmit={handleSendText} className="flex items-center gap-2">
            
            {/* Draw Doodle Modal Launcher */}
            <button
              type="button"
              onClick={() => setIsDrawingModalOpen(true)}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 light:bg-slate-100 light:border-slate-300"
              title="Нарисовать и отправить приколюху"
            >
              <Palette className="w-4 h-4" />
            </button>

            {/* Microphone Voice Recorder Trigger */}
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-2.5 rounded-xl border transition-all ${
                isRecording
                  ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-cyan-400 border-slate-700 light:bg-slate-100'
              }`}
              title="Записать голосовое сообщение"
            >
              <Mic className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Напишите сообщение в общий чат..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 light:bg-slate-50 light:border-slate-300 light:text-slate-900"
            />

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/25"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>

      </div>

      {/* DRAWING CANVAS MODAL ("Нарисовать приколюху") */}
      {isDrawingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#131924] border border-cyan-500/40 p-6 text-slate-100 shadow-2xl space-y-4 light:bg-white light:border-slate-200 light:text-slate-900">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 light:border-slate-200">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-base">Рисовашка КМБП</h3>
              </div>
              <button
                onClick={() => setIsDrawingModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawing Color & Size Tools */}
            <div className="flex items-center justify-between gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800 light:bg-slate-50">
              <div className="flex items-center gap-1.5">
                {['#00E5FF', '#9D4EDD', '#FF9E00', '#10B981', '#EF4444', '#FFFFFF'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setBrushColor(color)}
                    style={{ backgroundColor: color }}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      brushColor === color ? 'border-white scale-110 shadow-md' : 'border-transparent'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400">Толщина:</span>
                <input
                  type="range"
                  min="2"
                  max="20"
                  value={brushSize}
                  onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
                  className="w-20"
                />
              </div>

              <button
                type="button"
                onClick={clearCanvas}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-rose-400"
                title="Очистить холст"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* HTML5 Canvas Element */}
            <div className="rounded-2xl overflow-hidden border border-slate-800 bg-[#0B0F17] flex justify-center">
              <canvas
                ref={canvasRef}
                width={450}
                height={280}
                onMouseDown={startCanvasDraw}
                onMouseMove={drawOnCanvas}
                onMouseUp={stopCanvasDraw}
                onMouseLeave={stopCanvasDraw}
                className="cursor-crosshair touch-none"
              />
            </div>

            <button
              onClick={sendCanvasDrawing}
              className="w-full py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/25"
            >
              Отправить Рисунок в Чат
            </button>

          </div>
        </div>
      )}

    </div>
  );
};

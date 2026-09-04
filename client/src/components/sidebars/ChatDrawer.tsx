import React, { useState, useRef, useEffect } from 'react';
import { Send, Pin, PinOff, Download } from 'lucide-react';
import { useWebRTC } from '../../context/WebRTCContext';

export const ChatDrawer: React.FC = () => {
  const {
    roomId,
    messages,
    sendMessage,
    togglePinMessage,
    userName,
    isHost,
  } = useWebRTC();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput('');
  };

  const handleExportChat = () => {
    if (messages.length === 0) return;
    const header = [
      `========================================`,
      ` Luminary Meeting Chat Transcript`,
      ` Room: ${roomId || 'Meeting'}`,
      ` Exported: ${new Date().toLocaleString()}`,
      ` Total Messages: ${messages.length}`,
      `========================================\n`,
    ].join('\n');

    const body = messages
      .map((m) => `[${m.time || new Date(m.timestamp).toLocaleTimeString()}] ${m.senderName}: ${m.text}`)
      .join('\n');

    const blob = new Blob([header + body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `luminary-chat-${roomId || 'meeting'}-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const pinnedMessages = messages.filter((m) => m.isPinned);

  const QUICK_EMOJIS = ['👍', '❤️', '👏', '🔥', '🎉', '🚀'];

  return (
    <div className="w-full h-full flex flex-col p-4" style={{ color: 'var(--text-main)' }}>
      {/* Notice & Export Banner */}
      <div
        className="p-2.5 rounded-xl border text-xs mb-3 flex items-center justify-between"
        style={{
          backgroundColor: 'var(--bg-input)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-muted)',
        }}
      >
        <span className="text-[11px] truncate pr-2">Visible to all attendees.</span>
        <button
          onClick={handleExportChat}
          disabled={messages.length === 0}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/10 dark:hover:bg-white/5 shrink-0"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
          title="Export chat history as .txt"
          aria-label="Export chat transcript"
        >
          <Download className="w-3 h-3" />
          <span>Export</span>
        </button>
      </div>

      {/* Pinned Messages Banner */}
      {pinnedMessages.length > 0 && (
        <div
          className="p-3 rounded-xl border mb-3 flex flex-col gap-1 border-[var(--accent-color)]"
          style={{ backgroundColor: 'var(--bg-card)' }}
        >
          <div className="flex items-center justify-between text-[11px] font-bold" style={{ color: 'var(--accent-color)' }}>
            <span className="flex items-center gap-1">
              <Pin className="w-3 h-3" /> Pinned Message
            </span>
          </div>
          {pinnedMessages.map((pm) => (
            <div key={pm.id} className="text-xs font-medium" style={{ color: 'var(--text-main)' }}>
              <strong>{pm.senderName}:</strong> {pm.text}
            </div>
          ))}
        </div>
      )}

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-xs" style={{ color: 'var(--text-muted)' }}>
            No messages yet. Say hello!
          </div>
        ) : (
          messages.map((m) => {
            const isSelf = m.senderName === userName;
            return (
              <div key={m.id} className="flex flex-col gap-1 group">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold" style={{ color: isSelf ? 'var(--accent-color)' : 'var(--text-main)' }}>
                    {m.senderName} {isSelf && '(You)'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span style={{ color: 'var(--text-faint)' }}>{m.time}</span>
                    {isHost && (
                      <button
                        onClick={() => togglePinMessage(m.id, !m.isPinned)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        title={m.isPinned ? 'Unpin message' : 'Pin message'}
                      >
                        {m.isPinned ? (
                          <PinOff className="w-3 h-3 text-[var(--accent-color)]" />
                        ) : (
                          <Pin className="w-3 h-3 text-[var(--text-muted)] hover:text-[var(--text-main)]" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div
                  className="p-3 rounded-2xl border text-xs leading-relaxed max-w-[90%]"
                  style={{
                    backgroundColor: isSelf ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-main)',
                  }}
                >
                  {m.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Emojis Bar */}
      <div className="flex items-center gap-1.5 py-2">
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => setInput((prev) => prev + emoji)}
            className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-sm cursor-pointer transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Message Input Form */}
      <form onSubmit={handleSend} className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Send a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 h-11 px-4 rounded-full border text-xs outline-none transition-all focus:ring-1 focus:ring-[var(--accent-color)]"
          style={{
            backgroundColor: 'var(--bg-input)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-main)',
          }}
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 flex-shrink-0"
          style={{
            backgroundColor: 'var(--accent-color)',
            color: 'var(--badge-text)',
            boxShadow: 'var(--accent-glow)',
          }}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

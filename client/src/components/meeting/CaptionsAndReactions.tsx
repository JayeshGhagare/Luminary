import React, { useState, useEffect } from 'react';
import { useWebRTC } from '../../context/WebRTCContext';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { History, X, Download, AlertCircle } from 'lucide-react';
import type { CaptionItem } from '../../types';

export const CaptionsAndReactions: React.FC = () => {
  const {
    reactions,
    captions,
    isCaptionsEnabled,
    broadcastCaption,
    isAudioMuted,
  } = useWebRTC();

  const [showHistory, setShowHistory] = useState(false);
  const [captionHistory, setCaptionHistory] = useState<CaptionItem[]>([]);
  const [dismissNotice, setDismissNotice] = useState(false);

  // Web Speech API hook
  const {
    startListening,
    stopListening,
    isSupported,
  } = useSpeechRecognition((text, isFinal) => {
    if (text.trim() && !isAudioMuted) {
      broadcastCaption(text, isFinal);
    }
  });

  useEffect(() => {
    if (isCaptionsEnabled && !isAudioMuted && isSupported) {
      startListening();
    } else {
      stopListening();
    }
  }, [isCaptionsEnabled, isAudioMuted, isSupported, startListening, stopListening]);

  // Keep chronological scrollback history of captions
  useEffect(() => {
    if (captions.length > 0) {
      setCaptionHistory((prev) => {
        const next = [...prev];
        for (const c of captions) {
          if (!next.some((item) => item.timestamp === c.timestamp && item.text === c.text)) {
            next.push(c);
          }
        }
        return next.slice(-40); // Keep last 40 utterances
      });
    }
  }, [captions]);

  const handleDownloadTranscript = () => {
    if (captionHistory.length === 0) return;
    const content = captionHistory
      .map((c) => `[${new Date(c.timestamp).toLocaleTimeString()}] ${c.speakerName}: ${c.text}`)
      .join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `luminary-captions-transcript-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Floating Emoji Reactions Overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
        {reactions.map((r) => (
          <div
            key={r.id}
            className="absolute bottom-24 reaction-bubble flex flex-col items-center"
            style={{
              left: `${r.leftOffset ?? 50}%`,
            }}
          >
            <span className="text-4xl drop-shadow-md select-none">{r.emoji}</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/60 text-white mt-1 backdrop-blur-sm">
              {r.senderName}
            </span>
          </div>
        ))}
      </div>

      {/* Browser Compatibility Notice (Safari / Firefox) */}
      {isCaptionsEnabled && !isSupported && !dismissNotice && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 max-w-lg w-11/12 p-3 rounded-2xl bg-amber-500/95 text-black border border-amber-600/30 shadow-xl flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <span className="font-bold block mb-0.5">Microphone Transcription Unsupported</span>
            <span className="leading-relaxed text-[11px]">
              Your current browser does not support local speech-to-text generation (Web Speech API is supported in Chrome, Edge, and Safari 14.1+; not in Firefox). Captions spoken by other attendees will still display normally.
            </span>
          </div>
          <button
            onClick={() => setDismissNotice(true)}
            className="p-1 rounded-lg hover:bg-black/10 cursor-pointer"
            aria-label="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Live Captions Display Bar */}
      {isCaptionsEnabled && captions.length > 0 && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-2xl pointer-events-none flex flex-col items-center gap-2">
          {captions.map((cap) => (
            <div
              key={cap.timestamp}
              className="px-4 py-2 rounded-2xl bg-black/80 backdrop-blur-md text-white border border-white/15 shadow-xl text-center flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150"
            >
              <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: 'var(--accent-color)' }}>
                {cap.speakerName}
              </span>
              <span className="text-sm font-medium tracking-wide">
                {cap.text}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Captions Scrollback History Button & Modal */}
      {isCaptionsEnabled && (
        <>
          <button
            onClick={() => setShowHistory(true)}
            className="absolute top-4 left-4 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md text-xs font-medium border border-white/10 shadow-lg cursor-pointer transition-all"
            title="View captions scrollback history"
            aria-label="Open captions history"
          >
            <History className="w-3.5 h-3.5" />
            <span>Captions ({captionHistory.length})</span>
          </button>

          {showHistory && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div
                className="max-w-md w-full rounded-2xl p-5 border shadow-2xl flex flex-col gap-3 max-h-[80vh] card-theme"
                style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
              >
                <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
                    <h3 className="text-sm font-bold">Captions History</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleDownloadTranscript}
                      disabled={captionHistory.length === 0}
                      className="p-1.5 rounded-lg border hover:bg-black/10 dark:hover:bg-white/5 cursor-pointer disabled:opacity-40"
                      title="Download captions transcript"
                      aria-label="Download transcript"
                      style={{ borderColor: 'var(--border-color)' }}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setShowHistory(false)}
                      className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/5 cursor-pointer"
                      aria-label="Close dialog"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[200px] max-h-[360px]">
                  {captionHistory.length === 0 ? (
                    <div className="h-40 flex items-center justify-center text-xs" style={{ color: 'var(--text-muted)' }}>
                      No captions recorded yet. Spoken words will appear here.
                    </div>
                  ) : (
                    captionHistory.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl border text-xs leading-relaxed"
                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-[11px]" style={{ color: 'var(--accent-color)' }}>
                            {item.speakerName}
                          </span>
                          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                        <p style={{ color: 'var(--text-main)' }}>{item.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};

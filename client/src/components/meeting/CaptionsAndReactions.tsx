import React, { useEffect } from 'react';
import { useWebRTC } from '../../context/WebRTCContext';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

export const CaptionsAndReactions: React.FC = () => {
  const {
    reactions,
    captions,
    isCaptionsEnabled,
    broadcastCaption,
    isAudioMuted,
  } = useWebRTC();

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
    </>
  );
};

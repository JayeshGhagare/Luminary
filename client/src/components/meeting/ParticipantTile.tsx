import React, { useRef, useEffect } from 'react';
import { MicOff, Hand, Pin, PinOff, MonitorUp } from 'lucide-react';
import type { Participant } from '../../types';
import { useAudioVisualizer } from '../../hooks/useAudioVisualizer';

interface ParticipantTileProps {
  participant?: Participant;
  isSelf?: boolean;
  localStream?: MediaStream | null;
  isAudioMuted?: boolean;
  isVideoMuted?: boolean;
  userName?: string;
  isHandRaised?: boolean;
  isPinned?: boolean;
  onTogglePin?: () => void;
  isScreenShareTile?: boolean;
  screenStream?: MediaStream | null;
}

export const ParticipantTile: React.FC<ParticipantTileProps> = ({
  participant,
  isSelf = false,
  localStream,
  isAudioMuted = false,
  isVideoMuted = false,
  userName = 'You',
  isHandRaised = false,
  isPinned = false,
  onTogglePin,
  isScreenShareTile = false,
  screenStream,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Derive properties depending on whether tile is self or remote
  const displayName = isSelf ? `${userName} (You)` : participant?.name || 'Guest';
  const mutedAudio = isSelf ? isAudioMuted : participant?.isAudioMuted ?? false;
  const mutedVideo = isSelf ? isVideoMuted : participant?.isVideoMuted ?? false;
  const handRaised = isSelf ? isHandRaised : participant?.isHandRaised ?? false;

  // Check if this tile represents a screen share (self or remote)
  const isPresentation = isScreenShareTile || (!isSelf && !!participant?.isScreenSharing);

  // Active stream selection
  const activeStream = isScreenShareTile
    ? screenStream
    : isSelf
    ? localStream
    : participant?.stream;

  // Visualizer for self speaking detection
  const { isSpeaking: selfSpeaking } = useAudioVisualizer(localStream || null, isAudioMuted);

  // Remote speaking level detection
  const remoteSpeaking = (participant?.volumeLevel ?? 0) > 16;
  const isSpeaking = isSelf ? selfSpeaking : remoteSpeaking;

  // Determine if video track should be actively shown
  const isVideoVisible = !!activeStream && (!mutedVideo || isPresentation);

  // Attach and play stream whenever stream, mute status, or tile type changes
  useEffect(() => {
    if (videoRef.current && activeStream) {
      if (videoRef.current.srcObject !== activeStream) {
        videoRef.current.srcObject = activeStream;
      }
      videoRef.current.play().catch((err) => {
        console.warn('Video auto-play handled:', err.message);
      });
    }
  }, [activeStream, mutedVideo, isPresentation]);

  return (
    <div
      className={`relative w-full h-full rounded-2xl md:rounded-3xl overflow-hidden border transition-all duration-200 group flex items-center justify-center ${
        isSpeaking ? 'speaking-glow' : ''
      }`}
      style={{
        backgroundColor: '#121318',
        borderColor: isSpeaking ? 'var(--accent-color)' : 'var(--border-subtle)',
      }}
    >
      {/* Video Element: Always kept mounted to prevent track re-negotiation and stream loss */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isSelf} // Always mute self to avoid audio feedback
        className={`w-full h-full transition-opacity duration-200 ${
          isPresentation ? 'object-contain bg-black' : 'object-cover'
        } ${isSelf && !isPresentation ? 'scale-x-[-1]' : ''} ${
          isVideoVisible ? 'opacity-100 block' : 'opacity-0 hidden'
        }`}
      />

      {/* Avatar Fallback: Shown when camera is off */}
      {!isVideoVisible && (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3 select-none">
          <div
            className="w-16 h-16 md:w-24 md:h-24 rounded-full flex items-center justify-center text-xl md:text-3xl font-bold text-white shadow-xl transition-transform"
            style={{ backgroundColor: isSelf ? 'var(--accent-color)' : '#2d3039' }}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs font-medium opacity-60" style={{ color: 'var(--text-muted)' }}>
            Camera is off
          </span>
        </div>
      )}

      {/* Top Left: Hand Raised Badge */}
      {handRaised && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-black font-bold text-xs shadow-lg animate-bounce">
          <Hand className="w-3.5 h-3.5" />
          <span>Hand Raised</span>
        </div>
      )}

      {/* Top Left: Presentation Mode Badge */}
      {isPresentation && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-color)] text-[var(--badge-text)] font-semibold text-xs shadow-md">
          <MonitorUp className="w-3.5 h-3.5" />
          <span>{isSelf ? 'You are presenting' : `${displayName} is presenting`}</span>
        </div>
      )}

      {/* Top Right: Pin & Fullscreen Hover Controls */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {onTogglePin && (
          <button
            onClick={onTogglePin}
            className="p-2 rounded-full bg-black/70 hover:bg-black/90 text-white transition-all cursor-pointer backdrop-blur-md"
            title={isPinned ? 'Unpin' : 'Pin to screen'}
          >
            {isPinned ? <PinOff className="w-4 h-4 text-[var(--accent-color)]" /> : <Pin className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Bottom Bar: Name Tag & Mic Status */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/65 backdrop-blur-md text-white text-xs font-medium border border-white/10 max-w-[80%] truncate">
          <span className="truncate">
            {isPresentation ? `${displayName}'s Screen` : displayName}
          </span>
          {mutedAudio && !isPresentation && (
            <div className="w-4 h-4 rounded-full bg-red-500/80 flex items-center justify-center flex-shrink-0">
              <MicOff className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </div>

        {/* Audio active indicator wave for speaking */}
        {isSpeaking && !mutedAudio && (
          <div className="flex items-center gap-0.5 px-2 py-1.5 rounded-full bg-black/65 backdrop-blur-md border border-[var(--accent-color)]">
            <span className="w-1 bg-[var(--accent-color)] h-3 rounded-full animate-pulse" />
            <span className="w-1 bg-[var(--accent-color)] h-2 rounded-full" />
            <span className="w-1 bg-[var(--accent-color)] h-4 rounded-full animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
};

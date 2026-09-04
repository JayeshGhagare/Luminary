import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, Volume2, Sparkles, MonitorUp, ArrowLeft } from 'lucide-react';
import { useWebRTC } from '../../context/WebRTCContext';
import { useAudioVisualizer } from '../../hooks/useAudioVisualizer';
import { soundEffects } from '../../utils/audioEffects';

interface GreenRoomProps {
  roomId: string;
  onJoin: () => void;
  onPresent: () => void;
  onBack: () => void;
}

export const GreenRoom: React.FC<GreenRoomProps> = ({
  roomId,
  onJoin,
  onPresent,
  onBack,
}) => {
  const {
    userName,
    setUserName,
    localStream,
    isAudioMuted,
    isVideoMuted,
    toggleAudio,
    toggleVideo,
    initializeMedia,
  } = useWebRTC();

  const videoRef = useRef<HTMLVideoElement>(null);
  const { volume, isSpeaking } = useAudioVisualizer(localStream, isAudioMuted);
  const [isPlayingTestTone, setIsPlayingTestTone] = useState(false);
  const [backgroundBlur, setBackgroundBlur] = useState(false);

  useEffect(() => {
    // Acquire media preview
    initializeMedia();
  }, [initializeMedia]);

  useEffect(() => {
    if (videoRef.current && localStream) {
      if (videoRef.current.srcObject !== localStream) {
        videoRef.current.srcObject = localStream;
      }
      videoRef.current.play().catch(() => {});
    }
  }, [localStream, isVideoMuted]);

  const handleTestSpeaker = () => {
    setIsPlayingTestTone(true);
    soundEffects.playTestTone();
    setTimeout(() => setIsPlayingTestTone(false), 1200);
  };

  return (
    <div className="w-full flex-1 max-w-6xl mx-auto px-4 py-6 md:py-12 flex flex-col items-center justify-center">
      {/* Top back button */}
      <div className="w-full mb-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors cursor-pointer"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-muted)',
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <div className="text-xs font-mono font-semibold" style={{ color: 'var(--text-muted)' }}>
          Meeting: <span className="font-bold" style={{ color: 'var(--accent-color)' }}>{roomId}</span>
        </div>
      </div>

      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left / Center: Camera & Audio Preview Box */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <div
            className={`w-full aspect-video rounded-3xl overflow-hidden relative border shadow-2xl transition-all duration-300 ${
              isSpeaking ? 'speaking-glow' : ''
            }`}
            style={{
              backgroundColor: '#000000',
              borderColor: isSpeaking ? 'var(--accent-color)' : 'var(--border-color)',
            }}
          >
            {/* Live Video Feed - Kept mounted to prevent stream detachment on toggle */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover scale-x-[-1] transition-all duration-300 ${
                backgroundBlur ? 'blur-md' : ''
              } ${localStream && !isVideoMuted ? 'block' : 'hidden'}`}
            />

            {(!localStream || isVideoMuted) && (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 select-none">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg"
                  style={{ backgroundColor: 'var(--accent-color)' }}
                >
                  {userName ? userName.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                  Camera is off
                </span>
              </div>
            )}

            {/* Bottom Overlay: Mic Visualizer Wave */}
            <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
              <div className="flex items-center gap-1 h-3">
                <div
                  className="w-1 rounded-full transition-all duration-75"
                  style={{
                    height: isAudioMuted ? '4px' : `${Math.max(4, (volume / 100) * 16)}px`,
                    backgroundColor: isAudioMuted ? '#666' : 'var(--accent-color)',
                  }}
                />
                <div
                  className="w-1 rounded-full transition-all duration-75"
                  style={{
                    height: isAudioMuted ? '4px' : `${Math.max(4, (volume / 100) * 20)}px`,
                    backgroundColor: isAudioMuted ? '#666' : 'var(--accent-color)',
                  }}
                />
                <div
                  className="w-1 rounded-full transition-all duration-75"
                  style={{
                    height: isAudioMuted ? '4px' : `${Math.max(4, (volume / 100) * 14)}px`,
                    backgroundColor: isAudioMuted ? '#666' : 'var(--accent-color)',
                  }}
                />
              </div>
              <span className="text-[11px] font-semibold text-white">
                {isAudioMuted ? 'Mic Off' : isSpeaking ? 'Speaking' : 'Mic On'}
              </span>
            </div>

            {/* Bottom-right Overlay: Name Tag */}
            <div className="absolute bottom-4 right-4 z-10 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-medium border border-white/10">
              {userName || 'You'}
            </div>

            {/* In-Preview Media Control Buttons */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
              {/* Mic Toggle */}
              <button
                onClick={toggleAudio}
                className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all transform active:scale-95 cursor-pointer shadow-lg ${
                  isAudioMuted
                    ? 'btn-danger'
                    : 'bg-black/70 hover:bg-black/90 text-white border-white/20'
                }`}
                title={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
              >
                {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Video Toggle */}
              <button
                onClick={toggleVideo}
                className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all transform active:scale-95 cursor-pointer shadow-lg ${
                  isVideoMuted
                    ? 'btn-danger'
                    : 'bg-black/70 hover:bg-black/90 text-white border-white/20'
                }`}
                title={isVideoMuted ? 'Turn on camera' : 'Turn off camera'}
              >
                {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>

              {/* Background Blur Toggle */}
              <button
                onClick={() => setBackgroundBlur(!backgroundBlur)}
                className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all transform active:scale-95 cursor-pointer shadow-lg ${
                  backgroundBlur
                    ? 'border-[var(--accent-color)] text-[var(--accent-color)] bg-black/80'
                    : 'bg-black/70 hover:bg-black/90 text-white border-white/20'
                }`}
                title="Toggle Background Blur"
              >
                <Sparkles className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Audio/Video Device Test helper */}
          <div className="w-full flex items-center justify-between mt-4 px-2">
            <button
              onClick={handleTestSpeaker}
              disabled={isPlayingTestTone}
              className="flex items-center gap-2 text-xs font-semibold py-1.5 px-3 rounded-full border transition-all cursor-pointer hover:shadow-sm"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-main)',
              }}
            >
              <Volume2 className="w-3.5 h-3.5" style={{ color: 'var(--accent-color)' }} />
              <span>{isPlayingTestTone ? 'Testing Speaker...' : 'Test Speaker Audio'}</span>
            </button>

            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Check your audio and video before entering
            </span>
          </div>
        </div>

        {/* Right Side: Join Ready Panel */}
        <div className="lg:col-span-4 flex flex-col items-start w-full">
          <div
            className="w-full p-6 md:p-8 rounded-3xl border card-theme shadow-xl"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
            }}
          >
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-main)' }}>
              Ready to join?
            </h2>
            <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>
              No one else is in the call yet, or attendees are waiting for you to begin.
            </p>

            {/* Display Name Input */}
            <div className="w-full mb-6">
              <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                Your Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                className="w-full h-11 px-4 rounded-xl border text-sm font-medium outline-none transition-all focus:ring-2"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-main)',
                }}
              />
            </div>

            {/* Action Buttons: Join Now & Present */}
            <div className="w-full flex flex-col gap-3">
              <button
                onClick={onJoin}
                className="w-full h-12 rounded-full font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all transform active:scale-95 cursor-pointer"
                style={{
                  backgroundColor: 'var(--accent-color)',
                  color: 'var(--badge-text)',
                  boxShadow: 'var(--accent-glow)',
                }}
              >
                Join now
              </button>

              <button
                onClick={onPresent}
                className="w-full h-12 rounded-full font-semibold text-sm flex items-center justify-center gap-2 border transition-all cursor-pointer hover:bg-black/10 dark:hover:bg-white/5"
                style={{
                  borderColor: 'var(--border-color)',
                  color: 'var(--accent-color)',
                  backgroundColor: 'transparent',
                }}
              >
                <MonitorUp className="w-4 h-4" />
                Present
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

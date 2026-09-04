import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { WebRTCProvider, useWebRTC } from './context/WebRTCContext';
import { UserX, AlertTriangle, WifiOff } from 'lucide-react';
import { Header } from './components/landing/Header';
import { LandingHero } from './components/landing/LandingHero';
import { GreenRoom } from './components/lobby/GreenRoom';
import { MeetingRoom } from './components/meeting/MeetingRoom';

const MeetAppContent: React.FC = () => {
  const {
    isInCall,
    joinMeeting,
    userName,
    setUserName,
    toggleScreenShare,
    isReconnecting,
    kickedReason,
    clearKickedReason,
    joinErrorMessage,
    clearJoinErrorMessage,
  } = useWebRTC();

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isInLobby, setIsInLobby] = useState(false);

  // Check URL query param on mount: e.g. /?room=abc-defg-hij
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setSelectedRoomId(roomParam);
      setIsInLobby(true);
    }
  }, []);

  // Generate 10-char meeting code
  const generateMeetingCode = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const rand = (n: number) =>
      Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `${rand(3)}-${rand(4)}-${rand(3)}`;
  };

  const handleStartInstant = () => {
    const code = generateMeetingCode();
    setSelectedRoomId(code);
    setIsInLobby(true);
    window.history.pushState({}, '', `/?room=${code}`);
  };

  const handleJoinFromHero = (code: string) => {
    setSelectedRoomId(code);
    setIsInLobby(true);
    window.history.pushState({}, '', `/?room=${code}`);
  };

  const handleJoinCall = async () => {
    if (!selectedRoomId) return;
    await joinMeeting(selectedRoomId, userName);
    setIsInLobby(false);
  };

  const handlePresentCall = async () => {
    if (!selectedRoomId) return;
    await joinMeeting(selectedRoomId, userName);
    setIsInLobby(false);
    setTimeout(() => {
      toggleScreenShare();
    }, 500);
  };

  const handleBackToLanding = () => {
    setIsInLobby(false);
    setSelectedRoomId(null);
    window.history.pushState({}, '', window.location.pathname);
  };

  return (
    <>
      {/* Reconnecting Alert Banner */}
      {isReconnecting && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-black px-4 py-2 flex items-center justify-center gap-2 text-xs font-bold shadow-lg">
          <WifiOff className="w-4 h-4 animate-pulse" />
          <span>Reconnecting to server... Please check your internet connection</span>
        </div>
      )}

      {/* Kicked from Room Dialog Modal */}
      {kickedReason && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div
            className="max-w-sm w-full rounded-2xl p-6 border shadow-2xl flex flex-col gap-4 text-center card-theme"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
          >
            <div className="w-14 h-14 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mx-auto">
              <UserX className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold" style={{ color: 'var(--text-main)' }}>
                Removed from Meeting
              </h3>
              <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {kickedReason}
              </p>
            </div>
            <button
              onClick={clearKickedReason}
              className="w-full py-2.5 rounded-xl text-xs font-bold btn-primary cursor-pointer transition-transform active:scale-98"
            >
              Back to Home
            </button>
          </div>
        </div>
      )}

      {/* Join Error Dialog Modal */}
      {joinErrorMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div
            className="max-w-sm w-full rounded-2xl p-6 border shadow-2xl flex flex-col gap-4 text-center card-theme"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
          >
            <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold" style={{ color: 'var(--text-main)' }}>
                Unable to Join
              </h3>
              <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {joinErrorMessage}
              </p>
            </div>
            <button
              onClick={clearJoinErrorMessage}
              className="w-full py-2.5 rounded-xl text-xs font-bold btn-primary cursor-pointer transition-transform active:scale-98"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Primary views */}
      {isInCall ? (
        <MeetingRoom />
      ) : isInLobby && selectedRoomId ? (
        <div
          className="w-screen min-h-screen flex flex-col transition-colors duration-300"
          style={{ backgroundColor: 'var(--bg-app)' }}
        >
          <Header userName={userName} setUserName={setUserName} />
          <GreenRoom
            roomId={selectedRoomId}
            onJoin={handleJoinCall}
            onPresent={handlePresentCall}
            onBack={handleBackToLanding}
          />
        </div>
      ) : (
        <div
          className="w-screen min-h-screen flex flex-col transition-colors duration-300"
          style={{ backgroundColor: 'var(--bg-app)' }}
        >
          <Header userName={userName} setUserName={setUserName} />
          <LandingHero
            onStartInstantMeeting={handleStartInstant}
            onJoinMeeting={handleJoinFromHero}
          />
        </div>
      )}
    </>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <WebRTCProvider>
        <MeetAppContent />
      </WebRTCProvider>
    </ThemeProvider>
  );
}

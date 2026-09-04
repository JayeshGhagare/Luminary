import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { WebRTCProvider, useWebRTC } from './context/WebRTCContext';
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

  // State 1: Active In-Meeting Room
  if (isInCall) {
    return <MeetingRoom />;
  }

  // State 2: Green Room / Pre-Join Lobby
  if (isInLobby && selectedRoomId) {
    return (
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
    );
  }

  // State 3: Landing Page
  return (
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

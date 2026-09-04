import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Subtitles,
  Smile,
  MonitorUp,
  MonitorX,
  Hand,
  FileText,
  MoreVertical,
  PhoneOff,
  Info,
  Users,
  MessageSquare,
  Shield,
  Palette,
  Maximize,
  Grid,
} from 'lucide-react';
import { useWebRTC } from '../../context/WebRTCContext';
import { useTheme } from '../../context/ThemeContext';
import { ThemeSelector } from '../common/ThemeSelector';

export const BottomBar: React.FC = () => {
  const {
    roomId,
    isAudioMuted,
    isVideoMuted,
    isScreenSharing,
    isHandRaised,
    isCaptionsEnabled,
    activeSidebar,
    setActiveSidebar,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    toggleHandRaise,
    toggleCaptions,
    sendReaction,
    leaveMeeting,
    participants,
    messages,
    tasks,
    isHost,
    setLayoutMode,
  } = useWebRTC();

  const { currentThemeConfig } = useTheme();

  const [timeStr, setTimeStr] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);

  // Time ticker
  useEffect(() => {
    const updateTime = () => {
      setTimeStr(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard Shortcuts: Spacebar Push-to-Talk, Ctrl+D, Ctrl+E
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      // Spacebar Push-to-Talk (if muted, temporarily unmute on keydown)
      if (e.code === 'Space' && !e.repeat && isAudioMuted) {
        toggleAudio();
      }

      // Ctrl + D (or Cmd + D): Toggle Audio
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        toggleAudio();
      }

      // Ctrl + E (or Cmd + E): Toggle Video
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        toggleVideo();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      // Release Spacebar -> mute back
      if (e.code === 'Space' && !isAudioMuted) {
        toggleAudio();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isAudioMuted, toggleAudio, toggleVideo]);

  const toggleSidebarTab = (tab: typeof activeSidebar) => {
    setActiveSidebar(activeSidebar === tab ? 'none' : tab);
  };

  const REACTION_EMOJIS = ['💖', '👍', '🎉', '👏', '😂', '😮', '😢', '🤔', '👎'];

  const pendingTasksCount = tasks.filter((t) => !t.completed).length;

  return (
    <>
      <footer
        className="w-full h-20 px-3 md:px-6 flex items-center justify-between border-t z-30 transition-colors duration-300 relative select-none"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        {/* Left Section: Time & Meeting Code */}
        <div className="hidden md:flex items-center gap-3 w-1/4">
          <span className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>
            {timeStr}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
            |
          </span>
          <span className="text-xs font-mono font-medium tracking-wide" style={{ color: 'var(--text-muted)' }}>
            {roomId}
          </span>
        </div>

        {/* Center Section: Core Controls Cluster */}
        <div className="flex-1 md:flex-initial flex items-center justify-center gap-2 md:gap-3">
          {/* Microphone Toggle */}
          <button
            onClick={toggleAudio}
            className={`w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all transform active:scale-95 cursor-pointer shadow-md ${
              isAudioMuted ? 'btn-danger' : 'btn-control'
            }`}
            title={isAudioMuted ? 'Turn on microphone (Ctrl + D)' : 'Turn off microphone (Ctrl + D)'}
          >
            {isAudioMuted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Camera Toggle */}
          <button
            onClick={toggleVideo}
            className={`w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all transform active:scale-95 cursor-pointer shadow-md ${
              isVideoMuted ? 'btn-danger' : 'btn-control'
            }`}
            title={isVideoMuted ? 'Turn on camera (Ctrl + E)' : 'Turn off camera (Ctrl + E)'}
          >
            {isVideoMuted ? <VideoOff className="w-5 h-5 text-white" /> : <Video className="w-5 h-5" />}
          </button>

          {/* Live Captions Toggle */}
          <button
            onClick={toggleCaptions}
            className={`hidden sm:flex w-11 h-11 md:w-12 md:h-12 rounded-full items-center justify-center transition-all transform active:scale-95 cursor-pointer shadow-md ${
              isCaptionsEnabled ? 'active' : 'btn-control'
            }`}
            title="Turn on live captions"
          >
            <Subtitles className="w-5 h-5" />
          </button>

          {/* Floating Reactions Button */}
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center btn-control shadow-md cursor-pointer transition-all transform active:scale-95"
              title="Send a reaction"
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Floating Emoji Popup Bar */}
            {showEmojiPicker && (
              <div
                className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-2 rounded-full border shadow-2xl z-50 card-theme animate-in fade-in zoom-in duration-150"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-color)',
                }}
              >
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      sendReaction(emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-lg hover:scale-125 transition-transform cursor-pointer hover:bg-black/10 dark:hover:bg-white/10"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Screen Share with Audio Toggle */}
          <button
            onClick={toggleScreenShare}
            className={`w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all transform active:scale-95 cursor-pointer shadow-md ${
              isScreenSharing ? 'active' : 'btn-control'
            }`}
            title={isScreenSharing ? 'Stop presenting' : 'Present now (Share screen or tab with audio)'}
          >
            {isScreenSharing ? <MonitorX className="w-5 h-5 text-white" /> : <MonitorUp className="w-5 h-5" />}
          </button>

          {/* Raise Hand Toggle */}
          <button
            onClick={toggleHandRaise}
            className={`w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all transform active:scale-95 cursor-pointer shadow-md ${
              isHandRaised ? 'bg-amber-500 text-black border-amber-500 shadow-amber-500/40' : 'btn-control'
            }`}
            title={isHandRaised ? 'Lower hand' : 'Raise hand'}
          >
            <Hand className="w-5 h-5" />
          </button>

          {/* Custom Feature: Notes & To-Do List Button */}
          <button
            onClick={() => toggleSidebarTab('notes')}
            className={`relative w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all transform active:scale-95 cursor-pointer shadow-md ${
              activeSidebar === 'notes' ? 'active' : 'btn-control'
            }`}
            title="Meeting Notes & To-Do List"
          >
            <FileText className="w-5 h-5" />
            {pendingTasksCount > 0 && (
              <span
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                style={{ backgroundColor: 'var(--accent-color)' }}
              >
                {pendingTasksCount}
              </span>
            )}
          </button>

          {/* More Options (3 dots) Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center btn-control shadow-md cursor-pointer transition-all transform active:scale-95"
              title="More options"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* More Options Dropdown */}
            {showMoreMenu && (
              <div
                className="absolute bottom-16 right-0 w-60 rounded-2xl border p-2 z-50 shadow-2xl card-theme animate-in fade-in duration-150"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-color)',
                }}
              >
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    setShowThemeModal(true);
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer hover:bg-black/10 dark:hover:bg-white/10"
                  style={{ color: 'var(--text-main)' }}
                >
                  <Palette className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
                  <div>
                    <div>Change Theme</div>
                    <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      Current: {currentThemeConfig.name}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setLayoutMode('auto');
                    setShowMoreMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer hover:bg-black/10 dark:hover:bg-white/10"
                  style={{ color: 'var(--text-main)' }}
                >
                  <Grid className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
                  <div>Change layout to Auto/Grid</div>
                </button>

                <button
                  onClick={() => {
                    if (!document.fullscreenElement) {
                      document.documentElement.requestFullscreen().catch(() => {});
                    } else {
                      document.exitFullscreen().catch(() => {});
                    }
                    setShowMoreMenu(false);
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer hover:bg-black/10 dark:hover:bg-white/10"
                  style={{ color: 'var(--text-main)' }}
                >
                  <Maximize className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
                  <div>Toggle Full screen</div>
                </button>
              </div>
            )}
          </div>

          {/* End Call Button */}
          <button
            onClick={leaveMeeting}
            className="w-14 h-11 md:w-16 md:h-12 rounded-full flex items-center justify-center btn-danger shadow-lg transition-all transform active:scale-95 cursor-pointer ml-1"
            title="Leave call"
          >
            <PhoneOff className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Right Section: Drawer Toggles Cluster */}
        <div className="hidden md:flex items-center justify-end gap-1.5 w-1/4">
          {/* Info Drawer */}
          <button
            onClick={() => toggleSidebarTab('info')}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              activeSidebar === 'info' ? 'text-[var(--accent-color)] bg-black/10 dark:bg-white/10' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
            title="Meeting details"
          >
            <Info className="w-5 h-5" />
          </button>

          {/* People Drawer */}
          <button
            onClick={() => toggleSidebarTab('people')}
            className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              activeSidebar === 'people' ? 'text-[var(--accent-color)] bg-black/10 dark:bg-white/10' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
            title="People"
          >
            <Users className="w-5 h-5" />
            <span className="text-[11px] font-semibold ml-1">
              {participants.length + 1}
            </span>
          </button>

          {/* In-Call Messages / Chat Drawer */}
          <button
            onClick={() => toggleSidebarTab('chat')}
            className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              activeSidebar === 'chat' ? 'text-[var(--accent-color)] bg-black/10 dark:bg-white/10' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
            title="In-call messages"
          >
            <MessageSquare className="w-5 h-5" />
            {messages.length > 0 && (
              <span
                className="absolute top-1 right-1 w-2 h-2 rounded-full"
                style={{ backgroundColor: 'var(--accent-color)' }}
              />
            )}
          </button>

          {/* Host Controls */}
          {isHost && (
            <button
              onClick={() => toggleSidebarTab('people')}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                activeSidebar === 'host' ? 'text-[var(--accent-color)] bg-black/10 dark:bg-white/10' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
              title="Host controls"
            >
              <Shield className="w-5 h-5" />
            </button>
          )}
        </div>
      </footer>

      {/* Theme Switcher Modal from 3 dots menu */}
      {showThemeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div
            className="w-full max-w-lg rounded-2xl border p-6 max-h-[90vh] overflow-y-auto card-theme shadow-2xl relative"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-color)',
            }}
          >
            <button
              onClick={() => setShowThemeModal(false)}
              className="absolute top-4 right-4 text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-muted)',
              }}
            >
              Close
            </button>
            <ThemeSelector onClose={() => setShowThemeModal(false)} />
          </div>
        </div>
      )}
    </>
  );
};

import React from 'react';
import { X, MicOff, ShieldAlert } from 'lucide-react';
import { VideoGrid } from './VideoGrid';
import { BottomBar } from './BottomBar';
import { CaptionsAndReactions } from './CaptionsAndReactions';
import { PeopleDrawer } from '../sidebars/PeopleDrawer';
import { ChatDrawer } from '../sidebars/ChatDrawer';
import { NotesDrawer } from '../notes/NotesDrawer';
import { InfoDrawer } from '../sidebars/InfoDrawer';
import { useWebRTC } from '../../context/WebRTCContext';
import { useTheme } from '../../context/ThemeContext';

export const MeetingRoom: React.FC = () => {
  const { activeSidebar, setActiveSidebar, roomId, actionNotice, isTalkingWhileMuted } = useWebRTC();
  const { currentThemeConfig } = useTheme();

  return (
    <div
      className="w-screen h-screen flex flex-col overflow-hidden select-none transition-colors duration-300"
      style={{
        backgroundColor: 'var(--bg-app)',
      }}
    >
      {/* Top Meeting Status Bar */}
      <header
        className="w-full h-12 px-4 flex items-center justify-between z-20 border-b"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold tracking-wider" style={{ color: 'var(--text-main)' }}>
            {roomId}
          </span>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline-block"
            style={{
              backgroundColor: `${currentThemeConfig.previewAccent}22`,
              color: currentThemeConfig.previewAccent,
              border: `1px solid ${currentThemeConfig.previewAccent}44`,
            }}
          >
            {currentThemeConfig.name}
          </span>
        </div>

        {/* Presenting Indicator / Notice */}
        <div className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
          Luminary
        </div>
      </header>

      {/* Unauthorized / Host Action Notice Toast */}
      {actionNotice && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-red-600/95 text-white shadow-2xl text-xs font-semibold backdrop-blur-md animate-in fade-in slide-in-from-top duration-200 border border-red-400/30">
          <ShieldAlert className="w-4 h-4 text-white" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Center Stage: Video Grid + Sliding Sidebars */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Video Area */}
        <main className="flex-1 h-full relative overflow-hidden flex items-center justify-center">
          <VideoGrid />
          <CaptionsAndReactions />
        </main>

        {/* Right Drawer / Sidebar */}
        {activeSidebar !== 'none' && (
          <aside
            className="w-full sm:w-80 md:w-96 h-full flex flex-col border-l z-30 shadow-2xl transition-all duration-200 card-theme fixed sm:relative right-0 top-0 bottom-0"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-color)',
            }}
          >
            {/* Drawer Header */}
            <div
              className="h-14 px-4 flex items-center justify-between border-b"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <h3 className="text-sm font-bold capitalize" style={{ color: 'var(--text-main)' }}>
                {activeSidebar === 'notes'
                  ? 'Meeting Notes & To-Do'
                  : activeSidebar === 'chat'
                  ? 'In-Call Messages'
                  : activeSidebar === 'people'
                  ? 'Participants'
                  : 'Meeting Details'}
              </h3>

              <button
                onClick={() => setActiveSidebar('none')}
                className="p-1.5 rounded-full border hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto">
              {activeSidebar === 'people' && <PeopleDrawer />}
              {activeSidebar === 'chat' && <ChatDrawer />}
              {activeSidebar === 'notes' && <NotesDrawer />}
              {activeSidebar === 'info' && <InfoDrawer />}
            </div>
          </aside>
        )}
      </div>

      {/* Talking While Muted Floating Notification Pill */}
      {isTalkingWhileMuted && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-red-600/95 text-white shadow-2xl backdrop-blur-md animate-bounce border border-red-400/30 select-none">
          <MicOff className="w-4 h-4 text-white animate-pulse" />
          <span className="text-xs font-semibold">
            You are muted. Press <kbd className="px-1.5 py-0.5 rounded bg-black/40 text-[10px] font-mono">Space</kbd> or click mic to speak
          </span>
        </div>
      )}

      {/* Bottom Controls Bar */}
      <BottomBar />
    </div>
  );
};

import React, { useState } from 'react';
import { Video, Link as LinkIcon, Keyboard, Copy, Check, Sparkles, FileText, MonitorUp, ShieldCheck } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface LandingHeroProps {
  onStartInstantMeeting: () => void;
  onJoinMeeting: (code: string) => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onStartInstantMeeting,
  onJoinMeeting,
}) => {
  const { currentThemeConfig } = useTheme();
  const [meetingCode, setMeetingCode] = useState('');
  const [showNewMeetingMenu, setShowNewMeetingMenu] = useState(false);
  const [generatedLinkModal, setGeneratedLinkModal] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Generate random 10-character formatted meeting code: xxx-yyyy-zzz
  const generateMeetingCode = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const rand = (n: number) =>
      Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `${rand(3)}-${rand(4)}-${rand(3)}`;
  };

  const handleCreateLater = () => {
    const code = generateMeetingCode();
    const link = `${window.location.origin}/?room=${code}`;
    setGeneratedLinkModal(link);
    setShowNewMeetingMenu(false);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingCode.trim()) return;
    // Extract code if user pasted a full URL
    let code = meetingCode.trim();
    if (code.includes('room=')) {
      code = code.split('room=')[1].split('&')[0];
    } else if (code.includes('/')) {
      code = code.split('/').pop() || code;
    }
    onJoinMeeting(code);
  };

  return (
    <main className="w-full flex-1 max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-16 flex flex-col lg:flex-row items-center justify-between gap-12">
      {/* Left Column: Headline & Action Buttons */}
      <div className="flex-1 flex flex-col items-start max-w-2xl">
        {/* Flagship Theme Badge */}
        <div
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold mb-6 border"
          style={{
            backgroundColor: `${currentThemeConfig.previewAccent}18`,
            borderColor: `${currentThemeConfig.previewAccent}44`,
            color: currentThemeConfig.previewAccent,
          }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{currentThemeConfig.name} • {currentThemeConfig.tagline}</span>
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] mb-6" style={{ color: 'var(--text-main)' }}>
          Premium video meetings.{' '}
          <span style={{ color: 'var(--accent-color)' }}>Now free forever.</span>
        </h1>

        <p className="text-base md:text-lg mb-8 leading-relaxed font-normal" style={{ color: 'var(--text-muted)' }}>
          Experience crystal-clear WebRTC video, tab audio screen sharing, real-time speech captions, and our custom{' '}
          <strong className="font-semibold" style={{ color: 'var(--text-main)' }}>
            Notes & Action To-Do Drawer
          </strong>
          —all styled with high-contrast OLED and cinematic themes.
        </p>

        {/* Action Controls: New Meeting Dropdown & Join Code */}
        <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative mb-6">
          {/* New Meeting Button */}
          <div className="relative">
            <button
              onClick={() => setShowNewMeetingMenu(!showNewMeetingMenu)}
              className="w-full sm:w-auto h-12 px-6 rounded-full font-semibold text-sm flex items-center justify-center gap-2.5 shadow-lg transition-all transform active:scale-95 cursor-pointer"
              style={{
                backgroundColor: 'var(--accent-color)',
                color: 'var(--badge-text)',
                boxShadow: 'var(--accent-glow)',
              }}
            >
              <Video className="w-4 h-4" />
              <span>New meeting</span>
            </button>

            {/* Dropdown Menu */}
            {showNewMeetingMenu && (
              <div
                className="absolute top-14 left-0 w-64 rounded-2xl border p-2 z-30 shadow-2xl card-theme"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-color)',
                }}
              >
                <button
                  onClick={handleCreateLater}
                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold rounded-xl text-left transition-colors cursor-pointer hover:bg-black/10 dark:hover:bg-white/5"
                  style={{ color: 'var(--text-main)' }}
                >
                  <LinkIcon className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
                  <div>
                    <div>Create a meeting for later</div>
                    <div className="text-[10px] font-normal" style={{ color: 'var(--text-muted)' }}>
                      Get a link you can share with peers
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setShowNewMeetingMenu(false);
                    onStartInstantMeeting();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold rounded-xl text-left transition-colors cursor-pointer hover:bg-black/10 dark:hover:bg-white/5"
                  style={{ color: 'var(--text-main)' }}
                >
                  <Video className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
                  <div>
                    <div>Start an instant meeting</div>
                    <div className="text-[10px] font-normal" style={{ color: 'var(--text-muted)' }}>
                      Enter room immediately
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Join Form */}
          <form onSubmit={handleJoin} className="flex-1 flex items-center gap-2">
            <div
              className="flex-1 h-12 px-4 rounded-full border flex items-center gap-2.5 transition-all focus-within:ring-2"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-color)',
              }}
            >
              <Keyboard className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Enter a code or link"
                value={meetingCode}
                onChange={(e) => setMeetingCode(e.target.value)}
                className="w-full bg-transparent text-sm outline-none"
                style={{ color: 'var(--text-main)' }}
              />
            </div>
            <button
              type="submit"
              disabled={!meetingCode.trim()}
              className={`h-12 px-6 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                meetingCode.trim()
                  ? 'opacity-100 hover:opacity-90'
                  : 'opacity-40 cursor-not-allowed'
              }`}
              style={{
                color: 'var(--accent-color)',
                backgroundColor: 'transparent',
              }}
            >
              Join
            </button>
          </form>
        </div>

        {/* Feature Highlights Badges */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium pt-4 border-t w-full" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
          <span className="flex items-center gap-1.5">
            <FileText className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
            Notes & Action To-Do
          </span>
          <span className="flex items-center gap-1.5">
            <MonitorUp className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
            Screen Share with Tab Audio
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
            ₹0 Free WebRTC STUN
          </span>
        </div>
      </div>

      {/* Right Column: High-Impact Visual Preview Card */}
      <div className="w-full lg:w-5/12 flex flex-col items-center">
        <div
          className="w-full rounded-3xl p-6 border relative overflow-hidden transition-all duration-300 card-theme shadow-2xl"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
          }}
        >
          {/* Top Banner mock */}
          <div className="flex items-center justify-between pb-4 border-b mb-5" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <span className="text-xs font-bold tracking-wider uppercase" style={{ color: 'var(--accent-color)' }}>
              {currentThemeConfig.badge}
            </span>
          </div>

          {/* Interactive Preview Graphics */}
          <div className="aspect-video w-full rounded-2xl relative overflow-hidden flex flex-col justify-between p-4 border"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-color)',
              boxShadow: 'inset 0 0 40px rgba(0, 0, 0, 0.6)',
            }}
          >
            {/* Ambient theme glow */}
            <div
              className="absolute -top-10 -right-10 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none"
              style={{ backgroundColor: 'var(--accent-color)' }}
            />

            <div className="flex items-center justify-between z-10">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' }}>
                {currentThemeConfig.name}
              </span>
              <div className="flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(234, 67, 53, 0.2)', color: '#ea4335' }}>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                LIVE PREVIEW
              </div>
            </div>

            {/* Mock video tile layout */}
            <div className="grid grid-cols-2 gap-2 my-auto z-10">
              <div
                className="aspect-video rounded-xl p-2.5 flex flex-col justify-between border speaking-glow"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--accent-color)' }}
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: 'var(--accent-color)', color: 'var(--badge-text)' }}>
                  A
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-semibold truncate" style={{ color: 'var(--text-main)' }}>Alex (Speaker)</span>
                  <div className="flex gap-0.5 items-end h-3">
                    <span className="w-0.5 bg-[var(--accent-color)] h-3 rounded-full animate-pulse" />
                    <span className="w-0.5 bg-[var(--accent-color)] h-1.5 rounded-full" />
                    <span className="w-0.5 bg-[var(--accent-color)] h-2 rounded-full animate-pulse" />
                  </div>
                </div>
              </div>

              <div
                className="aspect-video rounded-xl p-2.5 flex flex-col justify-between border"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold bg-neutral-700 text-white">
                  M
                </div>
                <div className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                  Maya
                </div>
              </div>
            </div>

            {/* Mock Notes drawer teaser */}
            <div
              className="z-10 p-2 rounded-xl flex items-center justify-between text-xs border"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" style={{ color: 'var(--accent-color)' }} />
                <span className="text-[11px] font-semibold" style={{ color: 'var(--text-main)' }}>
                  Notes & Action Items Synced
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: `${currentThemeConfig.previewAccent}25`, color: currentThemeConfig.previewAccent }}>
                2 Tasks Pending
              </span>
            </div>
          </div>

          <div className="mt-5 text-center">
            <h4 className="font-bold text-sm" style={{ color: 'var(--text-main)' }}>
              {currentThemeConfig.name}
            </h4>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {currentThemeConfig.description}
            </p>
          </div>
        </div>
      </div>

      {/* Generated Meeting Link Modal */}
      {generatedLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div
            className="w-full max-w-md rounded-2xl border p-6 card-theme shadow-2xl relative"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-color)',
            }}
          >
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-main)' }}>
              Here's your meeting link
            </h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              Copy this link and send it to people you want to meet with. Be sure to save it so you can use it later.
            </p>

            <div
              className="flex items-center justify-between p-3 rounded-xl border mb-5"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-color)',
              }}
            >
              <span className="text-xs font-mono truncate mr-2" style={{ color: 'var(--text-main)' }}>
                {generatedLinkModal}
              </span>
              <button
                onClick={() => handleCopy(generatedLinkModal)}
                className="p-2 rounded-lg transition-colors cursor-pointer hover:bg-black/10 dark:hover:bg-white/10"
                style={{ color: 'var(--accent-color)' }}
                title="Copy link"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setGeneratedLinkModal(null)}
                className="px-4 py-2 text-xs font-semibold rounded-full border cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-main)',
                }}
              >
                Close
              </button>
              <button
                onClick={() => {
                  const code = generatedLinkModal.split('room=')[1];
                  setGeneratedLinkModal(null);
                  onJoinMeeting(code);
                }}
                className="px-5 py-2 text-xs font-bold rounded-full transition-all cursor-pointer"
                style={{
                  backgroundColor: 'var(--accent-color)',
                  color: 'var(--badge-text)',
                  boxShadow: 'var(--accent-glow)',
                }}
              >
                Join Now
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

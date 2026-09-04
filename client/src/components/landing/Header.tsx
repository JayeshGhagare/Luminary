import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Palette, Video } from 'lucide-react';
import { ThemeSelector } from '../common/ThemeSelector';

interface HeaderProps {
  userName: string;
  setUserName: (name: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ userName, setUserName }) => {
  const { currentThemeConfig } = useTheme();
  const [timeString, setTimeString] = useState('');
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      const date = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
      setTimeString(`${time} • ${date}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header
        className="w-full h-16 px-4 md:px-8 flex items-center justify-between border-b transition-colors duration-300"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        {/* Logo & Product Name */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md transition-transform hover:scale-105"
            style={{
              backgroundColor: 'var(--accent-color)',
              color: 'var(--badge-text)',
              boxShadow: 'var(--accent-glow)',
            }}
          >
            <Video className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg md:text-xl tracking-tight" style={{ color: 'var(--text-main)' }}>
                Lumi<span style={{ color: 'var(--accent-color)' }}>nary</span>
              </span>
              <span
                className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                style={{
                  backgroundColor: `${currentThemeConfig.previewAccent}22`,
                  color: currentThemeConfig.previewAccent,
                  border: `1px solid ${currentThemeConfig.previewAccent}44`,
                }}
              >
                {currentThemeConfig.badge}
              </span>
            </div>
            <span className="text-[10px] hidden md:block" style={{ color: 'var(--text-muted)' }}>
              {currentThemeConfig.name} Edition
            </span>
          </div>
        </div>

        {/* Right Nav: Time, Theme Picker, User Profile */}
        <div className="flex items-center gap-2 md:gap-4">
          <span className="hidden sm:block text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            {timeString}
          </span>

          {/* Theme Switcher Button */}
          <button
            onClick={() => setShowThemeModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer hover:shadow-md"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-main)',
            }}
            title="Change Theme"
          >
            <Palette className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
            <span className="hidden md:inline">{currentThemeConfig.name}</span>
          </button>

          {/* User Name Badge / Editor */}
          {isEditingName ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={() => {
                  if (tempName.trim()) setUserName(tempName.trim());
                  setIsEditingName(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (tempName.trim()) setUserName(tempName.trim());
                    setIsEditingName(false);
                  }
                }}
                autoFocus
                className="px-2 py-1 text-xs rounded border outline-none"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--accent-color)',
                  color: 'var(--text-main)',
                }}
              />
            </div>
          ) : (
            <button
              onClick={() => {
                setTempName(userName);
                setIsEditingName(true);
              }}
              className="flex items-center gap-2 p-1.5 md:px-3 md:py-1.5 rounded-full border text-xs font-medium cursor-pointer transition-colors"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-main)',
              }}
              title="Click to change your display name"
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  backgroundColor: 'var(--accent-color)',
                  color: 'var(--badge-text)',
                }}
              >
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="hidden md:inline">{userName}</span>
            </button>
          )}
        </div>
      </header>

      {/* Theme Picker Modal */}
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

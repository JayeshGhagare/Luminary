import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Check, Sparkles } from 'lucide-react';

interface ThemeSelectorProps {
  onClose?: () => void;
  inline?: boolean;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ onClose, inline = false }) => {
  const { theme, setTheme, availableThemes } = useTheme();

  return (
    <div className={inline ? 'w-full' : 'p-4'}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
            <Sparkles className="w-5 h-5" style={{ color: 'var(--accent-color)' }} />
            Appearance & Themes
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Select your preferred aesthetic experience.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {availableThemes.map((t) => {
          const isSelected = theme === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setTheme(t.id);
                if (onClose) onClose();
              }}
              className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 relative overflow-hidden group cursor-pointer ${
                isSelected
                  ? 'border-[var(--accent-color)] shadow-lg'
                  : 'border-[var(--border-color)] hover:border-[var(--border-accent)]'
              }`}
              style={{
                backgroundColor: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                boxShadow: isSelected ? 'var(--accent-glow)' : undefined,
              }}
            >
              {/* Card Header & Badges */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shadow-inner"
                    style={{
                      backgroundColor: t.previewBg,
                      border: `2px solid ${t.previewAccent}`,
                      color: t.previewAccent,
                    }}
                  >
                    ●
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm" style={{ color: 'var(--text-main)' }}>
                        {t.name}
                      </span>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                        style={{
                          backgroundColor: `${t.previewAccent}22`,
                          color: t.previewAccent,
                          border: `1px solid ${t.previewAccent}44`,
                        }}
                      >
                        {t.badge}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {t.tagline}
                    </p>
                  </div>
                </div>

                {isSelected && (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: 'var(--accent-color)' }}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              {/* Theme description */}
              <p className="text-xs mt-2.5 leading-relaxed" style={{ color: 'var(--text-faint)' }}>
                {t.description}
              </p>

              {/* Color swatch bar */}
              <div className="flex items-center gap-1.5 mt-3">
                <div
                  className="h-2 flex-1 rounded-full border border-black/20"
                  style={{ backgroundColor: t.previewBg }}
                  title="Background"
                />
                <div
                  className="h-2 w-12 rounded-full border border-black/20"
                  style={{ backgroundColor: t.previewAccent }}
                  title="Accent"
                />
                <div
                  className="h-2 w-8 rounded-full border border-black/20"
                  style={{ backgroundColor: t.previewText }}
                  title="Typography"
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

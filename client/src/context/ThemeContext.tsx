import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ThemeConfig, ThemeMode } from '../types';

export const AVAILABLE_THEMES: ThemeConfig[] = [
  {
    id: 'crimson',
    name: 'Crimson Velvet (Dark)',
    tagline: 'Soft Velvet Crimson & Obsidian',
    badge: '🎬 FLAGSHIP',
    previewBg: '#0e0f13',
    previewAccent: '#ea5b6f',
    previewText: '#fbfcfd',
    description: 'Soft velvet crimson rose with soothing obsidian depth and gentle ambient glow.',
  },
  {
    id: 'crimson-light',
    name: 'Crimson Rose (Light)',
    tagline: 'Soft Rosewood & Warm Pearl',
    badge: '🌸 CRIMSON LIGHT',
    previewBg: '#fbfbfc',
    previewAccent: '#dc354e',
    previewText: '#181920',
    description: 'Silky smooth crimson light theme with gentle rosewood accents on warm alabaster pearl.',
  },
  {
    id: 'cinematic',
    name: 'Cinematic Dark',
    tagline: 'Soft 35mm Gold & Amber',
    badge: '🎞️ 35MM CINEMA',
    previewBg: '#100f0e',
    previewAccent: '#f09a47',
    previewText: '#fbf9f6',
    description: 'Warm auteur film aesthetic with gentle amber stage glow and soft charcoal undertones.',
  },
  {
    id: 'midnight',
    name: 'Midnight Ocean',
    tagline: 'Soft Neon Cyan & Navy',
    badge: '🌊 CYBERPUNK',
    previewBg: '#0b1122',
    previewAccent: '#1ee0c5',
    previewText: '#e8f9fb',
    description: 'Bioluminescent soft cyan and aquamarine glassmorphism on deep midnight navy.',
  },
  {
    id: 'dark',
    name: 'Classic Dark',
    tagline: 'Google Meet Classic Dark',
    badge: '🌙 CLASSIC',
    previewBg: '#1f2024',
    previewAccent: '#8cb4f8',
    previewText: '#f0f2f5',
    description: 'Refined authentic Google Meet dark interface with soft Google Blue accents.',
  },
  {
    id: 'light',
    name: 'Clean Light',
    tagline: 'Google Meet Clean Light',
    badge: '☀️ LIGHT',
    previewBg: '#fafbfe',
    previewAccent: '#1e78f0',
    previewText: '#1f2024',
    description: 'Clean and bright daytime material aesthetic with crisp typography and gentle borders.',
  },
];

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  currentThemeConfig: ThemeConfig;
  availableThemes: ThemeConfig[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('meet_theme_preference') as ThemeMode;
    if (saved && AVAILABLE_THEMES.some((t) => t.id === saved)) {
      return saved;
    }
    return 'crimson'; // Default is Crimson Premiere flagship theme
  });

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('meet_theme_preference', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const currentThemeConfig =
    AVAILABLE_THEMES.find((t) => t.id === theme) || AVAILABLE_THEMES[0];

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        currentThemeConfig,
        availableThemes: AVAILABLE_THEMES,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

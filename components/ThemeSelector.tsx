'use client';

import { useState, useEffect } from 'react';
import {
  getThemePreference,
  saveThemePreference,
  applyTheme,
  THEME_LABELS,
  type ThemeName,
  type ThemePreference,
} from '@/lib/theme';

export function ThemeSelector() {
  const [preference, setPreference] = useState<ThemePreference | null>(null);
  const [mounted, setMounted] = useState(false);

  // Hydration-safe: Only render after mounting
  useEffect(() => {
    setPreference(getThemePreference());
    setMounted(true);
  }, []);

  const handleThemeChange = (themeName: ThemeName) => {
    if (!preference) return;

    const newPreference: ThemePreference = {
      ...preference,
      themeName,
    };

    setPreference(newPreference);
    saveThemePreference(newPreference);
    applyTheme(newPreference);
  };

  const handleModeToggle = () => {
    if (!preference) return;

    const newPreference: ThemePreference = {
      ...preference,
      mode: preference.mode === 'dark' ? 'light' : 'dark',
    };

    setPreference(newPreference);
    saveThemePreference(newPreference);
    applyTheme(newPreference);
  };

  // Show placeholder until mounted to prevent hydration mismatch
  if (!mounted || !preference) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-24 h-9 bg-muted rounded animate-pulse" />
        <div className="w-9 h-9 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Theme Dropdown */}
      <select
        value={preference.themeName}
        onChange={(e) => handleThemeChange(e.target.value as ThemeName)}
        className="doom-input h-9 px-3 text-sm font-semibold uppercase tracking-wider cursor-pointer transition-all hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
        aria-label="Select theme"
      >
        {Object.entries(THEME_LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>

      {/* Mode Toggle Button */}
      <button
        onClick={handleModeToggle}
        className="doom-input h-9 w-9 flex items-center justify-center cursor-pointer transition-all hover:border-primary hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
        aria-label={`Switch to ${preference.mode === 'dark' ? 'light' : 'dark'} mode`}
      >
        {preference.mode === 'dark' ? (
          // Sun icon (for switching to light mode)
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5"
          >
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        ) : (
          // Moon icon (for switching to dark mode)
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>
    </div>
  );
}

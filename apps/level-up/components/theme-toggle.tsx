'use client';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Locale } from '@/lib/types';
import { setWorkspaceTheme, subscribeWorkspaceTheme } from '../../../shared/theme.mjs';
export function ThemeToggle({ locale }: { locale: Locale }) {
  const [dark, setDark] = useState(false);
  useEffect(() => subscribeWorkspaceTheme(theme => setDark(theme === 'dark')), []);
  function toggle() {
    const next = !dark;
    setWorkspaceTheme(next ? 'dark' : 'light');
  }
  return (
    <button
      type="button"
      className="icon-button"
      onClick={toggle}
      aria-label={locale === 'az' ? 'Rəng mövzusunu dəyiş' : 'Toggle color theme'}
      aria-pressed={dark}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

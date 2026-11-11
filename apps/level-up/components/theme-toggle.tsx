'use client';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Locale } from '@/lib/types';
export function ThemeToggle({ locale }: { locale: Locale }) {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    let selected = window.matchMedia('(prefers-color-scheme: dark)').matches;
    try {
      const saved = localStorage.getItem('level-up.theme');
      if (saved) selected = saved === 'dark';
    } catch {}
    document.documentElement.classList.toggle('dark', selected);
    Promise.resolve().then(() => setDark(selected));
  }, []);
  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('level-up.theme', next ? 'dark' : 'light');
    } catch {}
  }
  return (
    <button
      type="button"
      className="icon-button"
      onClick={toggle}
      aria-label={locale === 'az' ? 'Rəng mövzusunu dəyiş' : 'Toggle color theme'}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

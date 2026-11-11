'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createLocalStorageAdapter, emptyProgress, recordActivity } from '@/lib/storage';
import type { UserProgress } from '@/lib/types';

type ProgressContext = {
  progress: UserProgress;
  ready: boolean;
  error: string | null;
  update: (updater: (p: UserProgress) => UserProgress) => void;
  replace: (p: UserProgress) => Promise<void>;
};
const Context = createContext<ProgressContext | null>(null);
export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<UserProgress>(emptyProgress);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef(progress);
  const loadFailed = useRef(false);
  const adapter = useRef(createLocalStorageAdapter(() => window.localStorage));
  useEffect(() => {
    let active = true;
    adapter.current
      .load()
      .then((value) => {
        if (active) {
          ref.current = value;
          setProgress(value);
          loadFailed.current = false;
        }
      })
      .catch(() => {
        if (active) {
          loadFailed.current = true;
          setError('storage');
        }
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);
  const update = useCallback((updater: (p: UserProgress) => UserProgress) => {
    const next = recordActivity(updater(ref.current));
    ref.current = next;
    setProgress(next);
    // Preserve unreadable or future-version data until the user explicitly replaces it.
    if (loadFailed.current) return;
    void adapter.current
      .save(next)
      .then(() => setError(null))
      .catch(() => setError('storage'));
  }, []);
  const replace = useCallback(async (next: UserProgress) => {
    await adapter.current.save(next);
    loadFailed.current = false;
    ref.current = next;
    setProgress(next);
    setError(null);
  }, []);
  return (
    <Context.Provider value={{ progress, ready, error, update, replace }}>
      {children}
    </Context.Provider>
  );
}
export function useProgress() {
  const value = useContext(Context);
  if (!value) throw new Error('ProgressProvider missing');
  return value;
}

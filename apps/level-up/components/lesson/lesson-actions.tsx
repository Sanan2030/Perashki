'use client';
import { Bookmark, BookmarkCheck, CheckCircle2, Save, StickyNote } from 'lucide-react';
import { useState } from 'react';
import { useProgress } from '@/components/providers';
import type { Lesson, Locale } from '@/lib/types';
export function LessonActions({ lesson, locale }: { lesson: Lesson; locale: Locale }) {
  const { progress, ready, update } = useProgress();
  const [draft, setDraft] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const az = locale === 'az';
  const complete = !!progress.completedLessons[lesson.id];
  const bookmarked = progress.bookmarks.includes(lesson.id);
  return (
    <section className="card lesson-actions">
      <div className="lesson-action-buttons">
        <button
          type="button"
          className={`button ${complete ? 'button-secondary' : 'button-primary'}`}
          disabled={!ready || lesson.status === 'planned'}
          onClick={() =>
            update((p) => {
              const completed = { ...p.completedLessons };
              if (complete) delete completed[lesson.id];
              else completed[lesson.id] = new Date().toISOString();
              return { ...p, completedLessons: completed };
            })
          }
        >
          <CheckCircle2 size={17} />
          {complete
            ? az
              ? 'Tamamlandı — geri al'
              : 'Completed — undo'
            : az
              ? 'Dərsi tamamladım'
              : 'Mark as completed'}
        </button>
        <button
          type="button"
          className="button button-secondary"
          disabled={!ready}
          aria-pressed={bookmarked}
          onClick={() =>
            update((p) => ({
              ...p,
              bookmarks: bookmarked
                ? p.bookmarks.filter((id) => id !== lesson.id)
                : [...p.bookmarks, lesson.id],
            }))
          }
        >
          {bookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}{' '}
          {az ? 'Əlfəcin' : 'Bookmark'}
        </button>
      </div>
      <details className="personal-notes">
        <summary>
          <StickyNote size={16} />
          {az ? 'Şəxsi qeydlərim' : 'My personal notes'}
        </summary>
        <label htmlFor="lesson-note" className="field-label">
          {az ? 'Nə öyrəndin? Nəyi sınamaq istəyirsən?' : 'What did you learn? What will you try?'}
        </label>
        <textarea
          id="lesson-note"
          className="input"
          value={draft ?? progress.notes[lesson.id] ?? ''}
          maxLength={50000}
          rows={5}
          disabled={!ready}
          onChange={(e) => {
            setDraft(e.target.value);
            setSaved(false);
          }}
        />
        <div className="note-save">
          <button
            type="button"
            className="button button-secondary"
            disabled={!ready}
            onClick={() => {
              update((p) => ({
                ...p,
                notes: { ...p.notes, [lesson.id]: draft ?? progress.notes[lesson.id] ?? '' },
              }));
              setSaved(true);
            }}
          >
            <Save size={15} />
            {az ? 'Qeydi saxla' : 'Save note'}
          </button>
          {saved && (
            <span role="status" className="success">
              {az ? 'Yadda saxlanıldı' : 'Saved'}
            </span>
          )}
        </div>
      </details>
    </section>
  );
}

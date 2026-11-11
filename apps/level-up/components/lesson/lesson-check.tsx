'use client';
import { useState } from 'react';
import { gradeAnswer, lessonOptionOrder } from '@/lib/quiz';
import { SourceLinks } from '@/components/source-links';
import type { Locale, QuizQuestion } from '@/lib/types';
export function LessonCheck({ questions, locale }: { questions: QuizQuestion[]; locale: Locale }) {
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [checked, setChecked] = useState<string[]>([]);
  const az = locale === 'az';
  return (
    <div className="lesson-check stack">
      {questions.map((q, index) => (
        <div className="knowledge-question" key={q.id}>
          <fieldset disabled={checked.includes(q.id)}>
            <legend>
              {index + 1}. {q.text[locale]}
            </legend>
            {lessonOptionOrder(q).map((o) => (
              <label key={o.id} className="knowledge-option">
                <input
                  type={q.type === 'multiple' ? 'checkbox' : 'radio'}
                  name={`lesson-check-${q.id}`}
                  value={o.id}
                  checked={answers[q.id]?.includes(o.id) ?? false}
                  onChange={(e) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [q.id]:
                        q.type === 'multiple'
                          ? e.target.checked
                            ? [...(prev[q.id] ?? []), o.id]
                            : (prev[q.id] ?? []).filter((id) => id !== o.id)
                          : [o.id],
                    }))
                  }
                />
                <span>{o.text[locale]}</span>
              </label>
            ))}
          </fieldset>
          {checked.includes(q.id) ? (
            <div className="knowledge-feedback" role="status">
              <strong>
                {gradeAnswer(q, answers[q.id] ?? [])
                  ? az
                    ? 'Düzgündür.'
                    : 'Correct.'
                  : az
                    ? 'İzahı nəzərdən keçir.'
                    : 'Review the explanation.'}
              </strong>
              <p>{q.explanation[locale]}</p>
              <SourceLinks ids={q.sourceIds} locale={locale} />
            </div>
          ) : (
            <button
              className="button button-primary"
              type="button"
              disabled={!answers[q.id]?.length}
              onClick={() => setChecked((prev) => [...prev, q.id])}
            >
              {az ? 'Cavabı yoxla' : 'Check answer'}
            </button>
          )}
        </div>
      ))}
      <p className="small muted">
        {az
          ? 'Bu qısa yoxlama dərs üçündür. Məşq bölməsində nəticə və təkrar tarixçəsi saxlanılır.'
          : 'This quick check supports the lesson. Use Practice to save results and review history.'}
      </p>
    </div>
  );
}

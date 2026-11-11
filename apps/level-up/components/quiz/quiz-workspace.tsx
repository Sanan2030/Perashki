'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { SourceLinks } from '@/components/source-links';
import { ExternalAssessments } from '@/components/quiz/external-assessments';
import { PracticeSets } from '@/components/quiz/practice-sets';
import { practiceSets, selectPracticeSetQuestions, type PracticeSet } from '@/lib/practice-sets';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  Clock3,
  Flag,
  History,
  Lightbulb,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  Trophy,
} from 'lucide-react';
import { useProgress } from '@/components/providers';
import { tracks } from '@/lib/tracks';
import { localize } from '@/lib/i18n';
import { lessons, isIndependentLesson } from '@/lib/catalog';
import type { ExamConfig, Locale, QuizAttempt, QuizQuestion, TrackId } from '@/lib/types';
import {
  createQuizSession,
  gradeAnswer,
  mockEligibility,
  pauseSession,
  quizSessionSchema,
  remainingTime,
  resumeSession,
  scoreQuiz,
  selectMockQuestions,
  shuffle,
  weakAreas,
  type QuizMode,
  type QuizSession,
} from '@/lib/quiz';
import { dueReviews, updateReviewCards } from '@/lib/spaced-repetition';

type Props = { locale: Locale; questions: QuizQuestion[]; exams: ExamConfig[] };
const AttemptChart = dynamic(
  () => import('./attempt-chart').then((module) => module.AttemptChart),
  { ssr: false },
);

const text = {
  az: {
    title: 'Məşq',
    original:
      'Öz sual bankımız və mənbə adı ilə ayrılmış əlavə testlər. Bunlar rəsmi imtahan sualları deyil.',
    track: 'Öyrənmə istiqaməti',
    mode: 'Məşq rejimi',
    count: 'Sual sayı',
    practiceTimer: 'Qısa məşq üçün taymer əlavə et',
    timerHelp: 'Bu, vaxtlı öyrənmə məşqidir; tam rəsmi imtahan simulyasiyası deyil.',
    domain: 'Mövzu / bilik sahəsi',
    anyDomain: 'Bütün mövzular',
    practice: 'Sərbəst məşq',
    practiceDescription: 'Hər cavabdan sonra izahı gör.',
    domainMode: 'Mövzu üzrə məşq',
    domainDescription: 'Bir bilik sahəsini daha dərindən öyrən.',
    mock: 'Vaxtlı sınaq',
    mockDescription: 'Yoxlanmış formata uyğun tam sınaq.',
    review: 'Səhvləri təkrarla',
    reviewDescription: 'Səhvlərindən öyrən və yaddaşını möhkəmləndir.',
    start: 'Məşqə başla',
    available: 'mövcud sual',
    dueOnly: 'Yalnız bu gün təkrarlanmalı suallar',
    due: 'sualın təkrar vaxtı çatıb',
    noReview: 'Təkrarlanmalı sual yoxdur. Əvvəl sərbəst məşq et.',
    noQuestions: 'Bu seçim üçün sual yoxdur. Başqa mövzu seç.',
    mockMissing: 'Bu istiqamət üçün rəsmi imtahan konfiqurasiyası yoxdur.',
    mockUnverified:
      'Rəsmi format hələ mənbədən yoxlanmayıb. TODO: VERIFY. Sərbəst məşq əlçatandır.',
    mockWritten:
      'Yazılı və qarışıq format üçün avtomatik rəsmi sınaq yoxdur. Yazılı məşqləri rubrika ilə özün qiymətləndir.',
    mockRules:
      'Tam sınaq üçün format, sual sayı, müddət və bilik sahələrinin bölgüsü yoxlanmalıdır.',
    mockBank: 'Tam sınaq üçün kifayət qədər təkrarsız sual yoxdur. Qısa sərbəst məşq əlçatandır.',
    mockDomains: 'Tam sınaq üçün hər bilik sahəsində kifayət qədər sual yoxdur.',
    config: 'İmtahan haqqında mənbələr və qeydlər',
    verified: 'Rəsmi mənbə ilə yoxlanıb',
    unverified: 'Yoxlama tələb olunur',
    questionCount: 'Rəsmi sual sayı',
    duration: 'Müddət',
    pass: 'Keçid həddi',
    unknown: 'TODO: VERIFY / açıqlanmayıb',
    minutes: 'dəqiqə',
    question: 'Sual',
    of: '/',
    flag: 'Sonra baxmaq üçün işarələ',
    flagged: 'İşarələnib',
    pause: 'Fasilə',
    resume: 'Davam et',
    paused: 'Məşq fasilədədir',
    pausedDescription: 'Hazır olduqda davam et. Qalan vaxt saxlanılıb.',
    trainingPause: 'Fasilə məşq üçün əlçatandır; rəsmi imtahan qaydaları fərqli ola bilər.',
    single: 'Bir cavab seç.',
    multiple: 'Bütün düzgün cavabları seç.',
    ordering: 'Addımları düzgün ardıcıllıqla düz.',
    matching: 'Hər ifadə üçün uyğun cavabı seç.',
    written: 'Öz sözlərinlə cavab yaz. Cavab avtomatik qiymətləndirilmir.',
    answer: 'Cavabın',
    choose: 'Cavab seç',
    check: 'Cavabı yoxla',
    rubric: 'Rubrikanı aç',
    correct: 'Düzgündür!',
    incorrect: 'Bu cavabı yenidən öyrənməyə dəyər.',
    reflection: 'Cavabını aşağıdakı meyarlarla müqayisə et.',
    explanation: 'İzah',
    correctAnswer: 'Düzgün cavab',
    learn: 'Əlaqəli dərsə keç',
    previous: 'Əvvəlki',
    next: 'Növbəti',
    finish: 'Məşqi bitir',
    submit: 'Nəticəni göstər',
    navigator: 'Suallara keçid',
    answered: 'cavablandırılıb',
    unanswered: 'cavabsız sual da nəticəyə daxil ediləcək.',
    discard: 'Məşqi ləğv et',
    saved: 'Məşq bu brauzerdə saxlanılır. Sonra qayıda bilərsən.',
    resultTitle: 'Məşq nəticəsi',
    writtenSaved: 'Yazılı məşq saxlanıldı',
    score: 'Düzgün cavab',
    writtenNote:
      'Yazılı cavablar avtomatik nəticəyə daxil edilmir. Rubrika ilə özünü qiymətləndir.',
    officialNote: 'Bu nəticə rəsmi imtahandan keçəcəyinə və ya uyğunluğuna zəmanət vermir.',
    breakdown: 'Bilik sahələri üzrə nəticə',
    weak: 'Növbəti fokusun',
    noWeak: 'Əla iş! Bu məşqdə 70%-dən aşağı bilik sahəsi yoxdur.',
    reviewAnswers: 'Cavabları və izahları nəzərdən keçir',
    yourAnswer: 'Sənin cavabın',
    notAnswered: 'Cavab verilməyib',
    again: 'Yeni məşq',
    history: 'Məşq tarixçəsi',
    noHistory: 'İlk məşqini bitirdikdə nəticələrin burada görünəcək.',
    detail: 'Nəticəyə bax',
    reflectionLabel: 'Yazılı məşq',
    invalid:
      'Saxlanmış məşq bu versiya ilə uyğun deyil. İrəliləyişini saxlayaraq məşqi yenidən başlada bilərsən.',
    moveUp: 'Yuxarı',
    moveDown: 'Aşağı',
    loading: 'Məşq məlumatları yüklənir…',
  },
  en: {
    title: 'Practice',
    original:
      'Our own question bank and separately attributed provider tests. These are not official exam questions.',
    track: 'Learning track',
    mode: 'Practice mode',
    count: 'Questions',
    practiceTimer: 'Add a timer to this practice session',
    timerHelp: 'This is timed learning practice, not a full official-format exam simulation.',
    domain: 'Topic / knowledge domain',
    anyDomain: 'All domains',
    practice: 'Practice',
    practiceDescription: 'Learn from an explanation after every answer.',
    domainMode: 'Domain drill',
    domainDescription: 'Practice questions from one knowledge area.',
    mock: 'Timed mock',
    mockDescription: 'A full session using a verified exam format.',
    review: 'Review mistakes',
    reviewDescription: 'Retry questions you answered incorrectly.',
    start: 'Start practicing',
    available: 'questions available',
    dueOnly: 'Only questions due for spaced review today',
    due: 'questions due for review',
    noReview: 'No mistakes to review yet. Start a practice session first.',
    noQuestions: 'No questions match this selection. Try a different domain.',
    mockMissing: 'There is no official exam configuration for this career track.',
    mockUnverified:
      'The official format has not been verified from its source. Practice remains available.',
    mockWritten:
      'Written and mixed formats do not have an automatically graded official-format mock. Use written practice with a self-review rubric.',
    mockRules:
      'The format, question count, duration, and domain allocation need verification before a full mock is available.',
    mockBank:
      'The bank does not yet contain enough unique questions for a full mock. Short practice sessions are available.',
    mockDomains: 'More questions are needed in each required domain before a full mock can run.',
    config: 'Exam sources and configuration notes',
    verified: 'Verified against official sources',
    unverified: 'Verification needed',
    questionCount: 'Official question count',
    duration: 'Duration',
    pass: 'Pass threshold',
    unknown: 'Not verified / not published',
    minutes: 'minutes',
    question: 'Question',
    of: 'of',
    flag: 'Flag for review',
    flagged: 'Flagged for review',
    pause: 'Pause',
    resume: 'Resume session',
    paused: 'Session paused',
    pausedDescription: 'Your remaining time is saved. Resume when you are ready.',
    trainingPause: 'Pausing is available for learning; official exam rules may differ.',
    single: 'Choose one answer.',
    multiple: 'Select every correct answer.',
    ordering: 'Put the steps in the right order.',
    matching: 'Choose the matching answer for each prompt.',
    written: 'Respond in your own words. Written work is not automatically scored.',
    answer: 'Your response',
    choose: 'Choose an answer',
    check: 'Check answer',
    rubric: 'Show self-review rubric',
    correct: 'Correct.',
    incorrect: 'Incorrect.',
    reflection: 'Compare your response with these review criteria.',
    explanation: 'Explanation',
    correctAnswer: 'Correct answer',
    learn: 'Explore the related lesson',
    previous: 'Previous',
    next: 'Next question',
    finish: 'Finish session',
    submit: 'See my results',
    navigator: 'Question navigation',
    answered: 'answered',
    unanswered: 'unanswered questions will also count toward your result.',
    discard: 'Discard session',
    saved: 'Your session is saved in this browser. You can return later.',
    resultTitle: 'Practice results',
    writtenSaved: 'Written reflection saved',
    score: 'Correct answers',
    writtenNote:
      'Written responses are excluded from automatic scoring. Use the rubric to assess your reasoning.',
    officialNote:
      'Practice scores do not establish official exam eligibility or predict an exam result.',
    breakdown: 'Your domain breakdown',
    weak: 'Domains below 70%',
    noWeak: 'No domain fell below 70% in this session.',
    reviewAnswers: 'Review answers and explanations',
    yourAnswer: 'Your answer',
    notAnswered: 'Not answered',
    again: 'Practice again',
    history: 'Your practice history',
    noHistory: 'Finish your first session and your results will appear here.',
    detail: 'View result',
    reflectionLabel: 'Written reflection',
    invalid:
      'Your saved session is incompatible with the current content. You can restart it without losing your learning progress.',
    moveUp: 'Move up',
    moveDown: 'Move down',
    loading: 'Loading your practice data…',
  },
} as const;

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}

function removeSession(sessions: Record<string, unknown>) {
  const next = { ...sessions };
  delete next.quiz;
  return next;
}

export function QuizWorkspace({ locale, questions, exams }: Props) {
  const t = text[locale];
  const { progress, ready, update } = useProgress();
  const params = useSearchParams();
  const requestedTrack = params.get('track');
  const [selectedTrack, setSelectedTrack] = useState<TrackId | null>(
    tracks.find((t) => t.id === requestedTrack)?.id ??
      lessons.find((lesson) => lesson.id === params.get('lesson'))?.trackId ??
      null,
  );
  const [mode, setMode] = useState<QuizMode>(
    params.get('mode') === 'review' ? 'review' : 'practice',
  );
  const [domain, setDomain] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [questionType, setQuestionType] = useState('all');
  const [unseenOnly, setUnseenOnly] = useState(false);
  const [count, setCount] = useState(10);
  const [practiceTimer, setPracticeTimer] = useState(false);
  const [practiceDuration, setPracticeDuration] = useState(10);
  const [onlyDue, setOnlyDue] = useState(false);
  const [resultId, setResultId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const trackId = selectedTrack ?? progress.activeTrack;
  const requestedLesson = params.get('lesson');
  const lessonFilter = lessons.some((l) => l.id === requestedLesson && l.trackId === trackId)
    ? requestedLesson
    : null;
  const independentIds = useMemo(
    () => new Set(lessons.filter(isIndependentLesson).map((lesson) => lesson.id)),
    [],
  );
  const independentPractice = !!lessonFilter && independentIds.has(lessonFilter);
  const bank = useMemo(
    () =>
      questions.filter(
        (q) =>
          q.trackId === trackId &&
          !q.providerId &&
          (lessonFilter ? q.lessonId === lessonFilter : !independentIds.has(q.lessonId)),
      ),
    [questions, trackId, lessonFilter, independentIds],
  );
  const questionMap = useMemo(() => new Map(questions.map((q) => [q.id, q])), [questions]);
  const exam = exams.find((item) => item.id === trackId);
  const domains = [...new Set(bank.map((q) => q.domain))];
  const parsed = quizSessionSchema.safeParse(progress.sessions.quiz);
  const restored = parsed.success ? parsed.data : null;
  const compatible =
    restored &&
    restored.questionIds.every((id) => {
      const question = questionMap.get(id);
      const order = restored.optionOrder[id] ?? [];
      return (
        question?.trackId === restored.trackId &&
        order.length === question.options.length &&
        order.every((optionId) => question.options.some((option) => option.id === optionId))
      );
    }) &&
    new Set(restored.questionIds).size === restored.questionIds.length &&
    restored.index < restored.questionIds.length;
  const session = compatible ? restored : null;
  const current = session ? questionMap.get(session.questionIds[session.index])! : null;
  const sessionExam = session ? exams.find((item) => item.id === session.trackId) : exam;
  const result = progress.attempts.find((attempt) => attempt.id === resultId);
  const due = dueReviews(progress.reviews, new Date(now));
  const reviewIds = new Set((onlyDue ? due : progress.reviews).map((card) => card.questionId));
  const attemptedIds = new Set(progress.attempts.flatMap((attempt) => attempt.questionIds));
  const filtered = bank.filter(
    (q) =>
      (mode !== 'domain' || domain === 'all' || q.domain === domain) &&
      (mode !== 'review' || reviewIds.has(q.id)) &&
      (difficulty === 'all' || q.difficulty === Number(difficulty)) &&
      (questionType === 'all' || q.type === questionType) &&
      (!unseenOnly || !attemptedIds.has(q.id)),
  );
  const eligibility = mockEligibility(exam, bank);
  const remaining = session ? remainingTime(session, now) : null;

  const finishSession = useCallback(
    (active: QuizSession) => {
      const items = active.questionIds
        .map((id) => questionMap.get(id))
        .filter((q): q is QuizQuestion => !!q);
      const scored = scoreQuiz(items, active.answers);
      const finished = new Date();
      const attempt: QuizAttempt = {
        id: active.id,
        trackId: active.trackId,
        mode: active.mode,
        practiceSetId: active.practiceSetId,
        startedAt: active.startedAt,
        completedAt: finished.toISOString(),
        questionIds: active.questionIds,
        answers: active.answers,
        score: scored.score,
        total: scored.total,
        domainScores: scored.domainScores,
      };
      update((previous) => {
        if (previous.attempts.some((item) => item.id === active.id)) return previous;
        return {
          ...previous,
          attempts: [...previous.attempts, attempt],
          reviews: updateReviewCards(
            previous.reviews,
            items
              .filter((q) => q.type !== 'written')
              .map((q) => ({
                questionId: q.id,
                correct: gradeAnswer(q, active.answers[q.id] ?? []) === true,
              })),
            finished,
          ),
          sessions: removeSession(previous.sessions),
        };
      });
      setResultId(attempt.id);
    },
    [questionMap, update],
  );

  const sessionRef = useRef<QuizSession | null>(null);
  const finishRef = useRef<(active: QuizSession) => void>(() => undefined);
  useEffect(() => {
    sessionRef.current = session;
    finishRef.current = finishSession;
  }, [session, finishSession]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const timestamp = Date.now();
      setNow(timestamp);
      const active = sessionRef.current;
      if (active && !active.paused && remainingTime(active, timestamp) === 0)
        finishRef.current(active);
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  function saveSession(next: QuizSession) {
    update((previous) => ({ ...previous, sessions: { ...previous.sessions, quiz: next } }));
  }

  function start() {
    if (mode === 'mock' && (!exam || !eligibility.eligible)) return;
    const selected =
      mode === 'mock' && exam ? selectMockQuestions(exam, bank) : shuffle(filtered).slice(0, count);
    if (!selected.length) return;
    const next = createQuizSession(
      selected,
      mode,
      mode === 'mock' ? exam!.durationMinutes : practiceTimer ? practiceDuration : null,
      mode === 'domain' ? domain : null,
    );
    setResultId(null);
    setNow(next.resumedAt!);
    saveSession(next);
  }

  function startSet(set: PracticeSet, feedbackMode: 'immediate' | 'after-submit') {
    const selected = selectPracticeSetQuestions(set, questions, feedbackMode === 'after-submit');
    const next = {
      ...createQuizSession(
        selected,
        'practice',
        feedbackMode === 'after-submit' ? set.durationMinutes : null,
      ),
      practiceSetId: set.id,
      feedbackMode,
    };
    setResultId(null);
    setNow(next.resumedAt!);
    saveSession(next);
  }

  function setAnswer(answer: string[]) {
    if (!session || !current || session.checked.includes(current.id)) return;
    if (remainingTime(session) === 0) {
      finishSession(session);
      return;
    }
    saveSession({ ...session, answers: { ...session.answers, [current.id]: answer } });
  }

  function checkAnswer() {
    if (session?.feedbackMode === 'after-submit') return;
    if (!session || !current) return;
    if (remainingTime(session) === 0) {
      finishSession(session);
      return;
    }
    const answer =
      session.answers[current.id] ??
      (current.type === 'ordering' ? (session.optionOrder[current.id] ?? []) : []);
    saveSession({
      ...session,
      answers: { ...session.answers, [current.id]: answer },
      checked: [...new Set([...session.checked, current.id])],
    });
  }

  const blockerText = {
    'missing-config': t.mockMissing,
    unverified: t.mockUnverified,
    'unsupported-format': t.mockWritten,
    'missing-rules': t.mockRules,
    'insufficient-bank': t.mockBank,
    'domain-coverage': t.mockDomains,
  };

  if (!ready)
    return (
      <div className="card" role="status">
        {t.loading}
      </div>
    );

  return (
    <div className="quiz-workspace" style={{ display: 'grid', gap: '1.5rem' }}>
      <header>
        <h1 className="page-title">{t.title}</h1>
      </header>
      <p
        className="muted"
        style={{ display: 'flex', gap: '.5rem', alignItems: 'flex-start', fontSize: '.875rem' }}
      >
        <ShieldCheck size={18} aria-hidden="true" style={{ flexShrink: 0 }} />
        {t.original}
      </p>

      {progress.sessions.quiz && !session ? (
        <div className="card" role="alert">
          <p>{t.invalid}</p>
          <button
            className="button button-secondary"
            onClick={() => update((p) => ({ ...p, sessions: removeSession(p.sessions) }))}
          >
            {t.discard}
          </button>
        </div>
      ) : null}

      {result && !session ? (
        <ResultPanel
          result={result}
          questions={questions}
          exams={exams}
          locale={locale}
          onAgain={() => {
            setSelectedTrack(result.trackId);
            setMode('practice');
            setDomain('all');
            setResultId(null);
          }}
        />
      ) : session && current ? (
        <div className="quiz-session-layout">
          <section className="card quiz-session-toolbar" aria-label={t.mode}>
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <span className="badge">
                {session.questionIds.some((id) =>
                  independentIds.has(questionMap.get(id)?.lessonId ?? ''),
                )
                  ? 'Independent lesson practice'
                  : tracks.find((track) => track.id === session.trackId)?.name[locale]}{' '}
                · {t.question} {session.index + 1} {t.of} {session.questionIds.length}
                {session.practiceSetId && (
                  <span style={{ display: 'block' }}>
                    {practiceSets.find((set) => set.id === session.practiceSetId)?.title[locale]}
                  </span>
                )}
              </span>
              <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
                {remaining !== null ? (
                  <span
                    aria-label={t.duration}
                    role="timer"
                    style={{
                      display: 'flex',
                      gap: '.4rem',
                      fontVariantNumeric: 'tabular-nums',
                      fontWeight: 700,
                    }}
                  >
                    <Clock3 size={18} aria-hidden="true" />
                    {formatTime(remaining)}
                  </span>
                ) : null}
                <button
                  className="button button-secondary"
                  onClick={() =>
                    saveSession(session.paused ? resumeSession(session) : pauseSession(session))
                  }
                >
                  {session.paused ? (
                    <Play size={16} aria-hidden="true" />
                  ) : (
                    <Pause size={16} aria-hidden="true" />
                  )}
                  {session.paused ? t.resume : t.pause}
                </button>
              </div>
            </div>
            {session.mode === 'mock' ? (
              <p className="muted" style={{ fontSize: '.8rem', marginTop: '.75rem' }}>
                {t.trainingPause}
              </p>
            ) : null}
          </section>

          {session.paused ? (
            <section className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
              <Pause size={32} aria-hidden="true" style={{ margin: '0 auto 1rem' }} />
              <h2>{t.paused}</h2>
              <p className="muted">{t.pausedDescription}</p>
              <button
                className="button button-primary"
                onClick={() => saveSession(resumeSession(session))}
              >
                <Play size={16} aria-hidden="true" />
                {t.resume}
              </button>
            </section>
          ) : (
            <section
              className="card quiz-session-question"
              style={{ display: 'grid', gap: '1.25rem' }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '.75rem',
                }}
              >
                <span className="eyebrow">
                  {sessionExam?.domains.find((d) => d.id === current.domain)?.title[locale] ??
                    current.domain}
                </span>
                <button
                  className="button button-secondary"
                  aria-pressed={session.flags.includes(current.id)}
                  onClick={() =>
                    saveSession({
                      ...session,
                      flags: session.flags.includes(current.id)
                        ? session.flags.filter((id) => id !== current.id)
                        : [...session.flags, current.id],
                    })
                  }
                >
                  <Flag
                    size={15}
                    fill={session.flags.includes(current.id) ? 'currentColor' : 'none'}
                    aria-hidden="true"
                  />
                  {session.flags.includes(current.id) ? t.flagged : t.flag}
                </button>
              </div>
              <QuestionInput
                question={current}
                locale={locale}
                answer={session.answers[current.id] ?? []}
                optionOrder={session.optionOrder[current.id] ?? current.options.map((o) => o.id)}
                checked={session.checked.includes(current.id)}
                onAnswer={setAnswer}
              />
              {session.mode !== 'mock' && session.feedbackMode !== 'after-submit' ? (
                <div>
                  {!session.checked.includes(current.id) ? (
                    <button
                      className="button button-primary"
                      disabled={
                        current.type !== 'ordering' &&
                        !(
                          session.answers[current.id]?.length &&
                          session.answers[current.id].every((a) => a.trim())
                        )
                      }
                      onClick={checkAnswer}
                    >
                      <Check size={16} aria-hidden="true" />
                      {current.type === 'written' ? t.rubric : t.check}
                    </button>
                  ) : (
                    <AnswerFeedback
                      question={current}
                      answer={session.answers[current.id] ?? []}
                      locale={locale}
                    />
                  )}
                </div>
              ) : null}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '.75rem',
                  borderTop: '1px solid var(--line, #e7e3de)',
                  paddingTop: '1.25rem',
                }}
              >
                <button
                  className="button button-secondary"
                  disabled={session.index === 0}
                  onClick={() => saveSession({ ...session, index: session.index - 1 })}
                >
                  <ArrowLeft size={16} aria-hidden="true" />
                  {t.previous}
                </button>
                {session.index < session.questionIds.length - 1 ? (
                  <button
                    className="button button-primary"
                    onClick={() => saveSession({ ...session, index: session.index + 1 })}
                  >
                    {t.next}
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                ) : (
                  <button className="button button-primary" onClick={() => finishSession(session)}>
                    <Trophy size={16} aria-hidden="true" />
                    {t.submit}
                  </button>
                )}
              </div>
            </section>
          )}

          <section className="card quiz-session-navigation" aria-label={t.navigator}>
            <h2>{t.navigator}</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
              {session.questionIds.map((id, index) => (
                <button
                  key={id}
                  disabled={session.paused}
                  className={`button ${index === session.index ? 'button-primary' : 'button-secondary'}`}
                  aria-current={index === session.index ? 'step' : undefined}
                  aria-label={`${t.question} ${index + 1}${session.flags.includes(id) ? `, ${t.flagged}` : ''}${session.answers[id]?.some((a) => a.trim()) ? `, ${t.answered}` : ''}`}
                  onClick={() => saveSession({ ...session, index })}
                  style={{ minWidth: '2.75rem', padding: '.5rem', position: 'relative' }}
                >
                  {index + 1}
                  {session.flags.includes(id) ? (
                    <Flag size={10} aria-hidden="true" />
                  ) : session.answers[id]?.some((a) => a.trim()) ? (
                    <Check size={12} aria-hidden="true" />
                  ) : null}
                </button>
              ))}
            </div>
            <p className="muted" style={{ marginTop: '1rem' }}>
              {Object.values(session.answers).filter((a) => a.some((v) => v.trim())).length} /{' '}
              {session.questionIds.length} {t.answered}. {t.unanswered}
            </p>
            <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
              <button
                className="button button-secondary"
                disabled={session.paused}
                onClick={() => finishSession(session)}
              >
                {t.finish}
              </button>
              <button
                className="button button-secondary"
                onClick={() => update((p) => ({ ...p, sessions: removeSession(p.sessions) }))}
              >
                {t.discard}
              </button>
            </div>
            <p className="muted" style={{ fontSize: '.8rem', marginTop: '1rem' }}>
              {t.saved}
            </p>
          </section>
        </div>
      ) : (
        <section className="card" style={{ display: 'grid', gap: '1.5rem' }}>
          {lessonFilter && (
            <div className="notice">
              <p>
                {locale === 'az' ? 'Dərs üzrə məşq: ' : 'Lesson practice: '}
                {lessons.find((l) => l.id === lessonFilter)?.title[locale]}
              </p>
              <Link className="text-link" href={`/${locale}/practice?track=${trackId}`}>
                {locale === 'az' ? 'Bütün mövzular' : 'All topics'}
              </Link>
            </div>
          )}
          {trackId === 'pspo3' && (
            <div className="notice official-practice">
              <p>
                {locale === 'az'
                  ? 'Rəsmi məşqi Scrum.org-da et. Burada isə göndərilən bələdçilər əsasında orijinal sualları izahlarla öyrən.'
                  : 'Try official practice on Scrum.org. Here, study original explained questions based on the supplied guides.'}
              </p>
              <a
                className="text-link"
                href="https://www.scrum.org/open-assessments/product-owner-open"
                target="_blank"
                rel="noreferrer"
              >
                Product Owner Open ↗
              </a>
              <Link className="text-link" href={`/${locale}/sources`}>
                {locale === 'az'
                  ? 'Mənbələr və yoxlama vəziyyəti'
                  : 'Sources and verification status'}
              </Link>
            </div>
          )}
          {independentPractice ? (
            <p className="notice">Independent lesson practice · outside learning paths</p>
          ) : (
            <label style={{ display: 'grid', gap: '.5rem' }}>
              <span style={{ fontWeight: 600 }}>{t.track}</span>
              <select
                className="input"
                value={trackId}
                onChange={(event) => {
                  setSelectedTrack(event.target.value as TrackId);
                  setDomain('all');
                  setDifficulty('all');
                  setQuestionType('all');
                  setUnseenOnly(false);
                }}
              >
                {tracks.map((track) => (
                  <option key={track.id} value={track.id}>
                    {localize(track.name, locale)}
                  </option>
                ))}
              </select>
            </label>
          )}
          {!independentPractice && !lessonFilter && (
            <>
              <PracticeSets locale={locale} trackId={trackId} onStart={startSet} />
              {['pspo1', 'pspo2'].includes(trackId) && (
                <details>
                  <summary>
                    {locale === 'az'
                      ? 'Əlavə sayt keçidləri və giriş qeydləri'
                      : 'Supplementary website links and access notes'}
                  </summary>
                  <ExternalAssessments locale={locale} trackId={trackId} />
                </details>
              )}
              {practiceSets.some((set) => set.trackId === trackId) && (
                <h2>
                  {locale === 'az'
                    ? 'Öz sual bankımızla məşq'
                    : 'Practice with our own question bank'}
                </h2>
              )}
            </>
          )}
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend style={{ fontWeight: 600, marginBottom: '.75rem' }}>{t.mode}</legend>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '.75rem',
              }}
            >
              {(
                [
                  ['practice', t.practice, t.practiceDescription],
                  ['domain', t.domainMode, t.domainDescription],
                  ['mock', t.mock, t.mockDescription],
                  ['review', t.review, t.reviewDescription],
                ] as const
              )
                .filter(([id]) => !independentPractice || id !== 'mock')
                .map(([id, title, description]) => (
                  <label
                    key={id}
                    className="card"
                    style={{
                      padding: '1rem',
                      cursor: 'pointer',
                      borderColor: mode === id ? 'var(--accent, #c6664a)' : undefined,
                      borderWidth: mode === id ? 2 : 1,
                    }}
                  >
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '.5rem',
                        fontWeight: 600,
                      }}
                    >
                      <input
                        type="radio"
                        name="quiz-mode"
                        value={id}
                        checked={mode === id}
                        onChange={() => setMode(id)}
                      />
                      {title}
                    </span>
                    <span
                      className="muted"
                      style={{ display: 'block', fontSize: '.85rem', marginTop: '.5rem' }}
                    >
                      {description}
                    </span>
                  </label>
                ))}
            </div>
          </fieldset>
          {mode === 'domain' ? (
            <label style={{ display: 'grid', gap: '.5rem' }}>
              {t.domain}
              <select className="input" value={domain} onChange={(e) => setDomain(e.target.value)}>
                <option value="all">{t.anyDomain}</option>
                {domains.map((id) => (
                  <option key={id} value={id}>
                    {exam?.domains.find((d) => d.id === id)?.title[locale] ?? id}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {mode !== 'mock' && (
            <fieldset className="practice-filters">
              <legend>{locale === 'az' ? 'Məşqi fərdiləşdir' : 'Customize practice'}</legend>
              <div className="grid-3">
                <label>
                  {locale === 'az' ? 'Çətinlik' : 'Difficulty'}
                  <select
                    className="input"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                  >
                    <option value="all">
                      {locale === 'az' ? 'Bütün səviyyələr' : 'All levels'}
                    </option>
                    <option value="1">{locale === 'az' ? '1 · Əsaslar' : '1 · Foundations'}</option>
                    <option value="2">{locale === 'az' ? '2 · Tətbiq' : '2 · Applied'}</option>
                    <option value="3">
                      {locale === 'az' ? '3 · Mürəkkəb ssenarilər' : '3 · Complex scenarios'}
                    </option>
                  </select>
                </label>
                <label>
                  {locale === 'az' ? 'Sual növü' : 'Question format'}
                  <select
                    className="input"
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value)}
                  >
                    <option value="all">{locale === 'az' ? 'Bütün növlər' : 'All formats'}</option>
                    {(['single', 'multiple', 'ordering', 'matching', 'written'] as const).map(
                      (type) => (
                        <option key={type} value={type}>
                          {locale === 'az'
                            ? {
                                single: 'Bir düzgün cavab',
                                multiple: 'Bir neçə düzgün cavab',
                                ordering: 'Ardıcıllıq',
                                matching: 'Uyğunlaşdırma',
                                written: 'Yazılı cavab',
                              }[type]
                            : {
                                single: 'Single answer',
                                multiple: 'Multiple answers',
                                ordering: 'Ordering',
                                matching: 'Matching',
                                written: 'Written response',
                              }[type]}
                        </option>
                      ),
                    )}
                  </select>
                </label>
                <label className="practice-unseen">
                  <input
                    type="checkbox"
                    checked={unseenOnly}
                    onChange={(e) => setUnseenOnly(e.target.checked)}
                  />
                  {locale === 'az'
                    ? 'Yalnız əvvəlki məşqlərə daxil edilməyənlər'
                    : 'Only questions not used in previous sessions'}
                </label>
              </div>
              <p className="small muted">
                {locale === 'az'
                  ? 'Filtrlər öyrənmə məşqlərinə aiddir. Tam sınağın rəsmi qaydaları və mövzu bölgüsü ayrıca tətbiq edilir.'
                  : 'Filters apply to learning practice. Full mocks use their separately verified format and domain allocation.'}
              </p>
            </fieldset>
          )}
          {mode === 'review' ? (
            <div>
              <p className="muted">
                {due.filter((card) => bank.some((q) => q.id === card.questionId)).length} {t.due}
              </p>
              <label style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={onlyDue}
                  onChange={(e) => setOnlyDue(e.target.checked)}
                />
                {t.dueOnly}
              </label>
            </div>
          ) : null}
          {mode !== 'mock' ? (
            <label style={{ display: 'grid', gap: '.5rem', maxWidth: 240 }}>
              {t.count}
              <select
                className="input"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
              >
                {[5, 10, 20, 30, 40, 60, 80, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <span className="muted" style={{ fontSize: '.8rem' }}>
                {filtered.length} {t.available}
                {filtered.length < count && filtered.length > 0
                  ? ` · ${locale === 'az' ? 'bu məşqdə' : 'this session'}: ${filtered.length}`
                  : ''}
              </span>
            </label>
          ) : null}
          {mode !== 'mock' ? (
            <div style={{ display: 'grid', gap: '.75rem' }}>
              <label style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={practiceTimer}
                  onChange={(e) => setPracticeTimer(e.target.checked)}
                />
                {t.practiceTimer}
              </label>
              {practiceTimer ? (
                <>
                  <label style={{ display: 'grid', gap: '.5rem', maxWidth: 240 }}>
                    {t.duration}
                    <select
                      className="input"
                      value={practiceDuration}
                      onChange={(e) => setPracticeDuration(Number(e.target.value))}
                    >
                      {[5, 10, 20, 30, 60].map((duration) => (
                        <option key={duration} value={duration}>
                          {duration} {t.minutes}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="muted" style={{ fontSize: '.85rem' }}>
                    {t.timerHelp}
                  </p>
                </>
              ) : null}
            </div>
          ) : null}
          {mode === 'mock' && !eligibility.eligible ? (
            <p
              role="status"
              className="muted"
              style={{
                padding: '1rem',
                border: '1px solid var(--line, #e7e3de)',
                borderRadius: 12,
              }}
            >
              {blockerText[eligibility.reason!]}
            </p>
          ) : null}
          {!filtered.length && mode !== 'mock' ? (
            <p role="status" className="muted">
              {mode === 'review' ? t.noReview : t.noQuestions}
            </p>
          ) : null}
          <div>
            <button
              className="button button-primary"
              disabled={mode === 'mock' ? !eligibility.eligible : !filtered.length}
              onClick={start}
            >
              <Play size={17} aria-hidden="true" />
              {t.start}
            </button>
          </div>
          {exam ? <ExamDetails exam={exam} locale={locale} /> : null}
        </section>
      )}

      {!session ? (
        <section className="card" id="attempt-history">
          <h2 style={{ display: 'flex', gap: '.5rem', alignItems: 'center', marginBottom: '1rem' }}>
            <History size={20} aria-hidden="true" />
            {t.history}
          </h2>
          {progress.attempts.some((attempt) => attempt.total > 0) ? (
            <AttemptChart attempts={progress.attempts} locale={locale} />
          ) : null}
          {!progress.attempts.length ? (
            <p className="muted">{t.noHistory}</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {[...progress.attempts]
                .reverse()
                .slice(0, 15)
                .map((attempt) => (
                  <li
                    key={attempt.id}
                    style={{
                      display: 'flex',
                      gap: '1rem',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      padding: '1rem 0',
                      borderBottom: '1px solid var(--line, #e7e3de)',
                    }}
                  >
                    <div>
                      <strong>
                        {attempt.questionIds.some((id) =>
                          independentIds.has(questionMap.get(id)?.lessonId ?? ''),
                        )
                          ? 'Independent lesson practice'
                          : tracks.find((track) => track.id === attempt.trackId)?.name[locale]}
                        {attempt.practiceSetId &&
                          ` · ${practiceSets.find((set) => set.id === attempt.practiceSetId)?.title[locale] ?? attempt.practiceSetId}`}
                      </strong>
                      <p className="muted" style={{ fontSize: '.85rem' }}>
                        {new Date(attempt.completedAt).toLocaleDateString(
                          locale === 'az' ? 'az-AZ' : 'en-GB',
                        )}{' '}
                        ·{' '}
                        {attempt.total
                          ? `${attempt.score}/${attempt.total} (${Math.round((attempt.score / attempt.total) * 100)}%)`
                          : t.reflectionLabel}
                      </p>
                    </div>
                    <button
                      className="button button-secondary"
                      onClick={() => {
                        setResultId(attempt.id);
                        document
                          .querySelector('.quiz-workspace')
                          ?.scrollIntoView({ behavior: 'instant' });
                      }}
                    >
                      {t.detail}
                      <ArrowRight size={15} aria-hidden="true" />
                    </button>
                  </li>
                ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}

function QuestionInput({
  question,
  locale,
  answer,
  optionOrder,
  checked,
  onAnswer,
}: {
  question: QuizQuestion;
  locale: Locale;
  answer: string[];
  optionOrder: string[];
  checked: boolean;
  onAnswer: (answer: string[]) => void;
}) {
  const t = text[locale];
  const options = optionOrder
    .map((id) => question.options.find((option) => option.id === id))
    .filter((option): option is QuizQuestion['options'][number] => !!option);
  const instruction = t[question.type];
  const order = answer.length ? answer : optionOrder;

  function move(from: number, to: number) {
    const next = [...order];
    [next[from], next[to]] = [next[to], next[from]];
    onAnswer(next);
  }

  return (
    <fieldset style={{ border: 0, padding: 0, margin: 0 }} disabled={checked}>
      <legend
        aria-live="polite"
        style={{
          fontSize: 'clamp(1.15rem, 2vw, 1.5rem)',
          fontWeight: 650,
          lineHeight: 1.5,
          marginBottom: '.5rem',
        }}
      >
        {localize(question.text, locale)}
      </legend>
      <p className="muted" style={{ fontSize: '.875rem', marginBottom: '1.25rem' }}>
        {instruction}
      </p>
      {question.type === 'written' ? (
        <label style={{ display: 'grid', gap: '.5rem' }}>
          {t.answer}
          <textarea
            className="input"
            rows={8}
            maxLength={12000}
            value={answer[0] ?? ''}
            onChange={(event) => onAnswer([event.target.value])}
          />
        </label>
      ) : question.type === 'ordering' ? (
        <ol style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '.65rem' }}>
          {order.map((id, index) => (
            <li
              key={id}
              className="card"
              style={{
                display: 'flex',
                gap: '.75rem',
                alignItems: 'center',
                padding: '.85rem 1rem',
              }}
            >
              <span className="badge" aria-hidden="true">
                {index + 1}
              </span>
              <span style={{ flex: 1 }}>
                {question.options.find((option) => option.id === id)?.text[locale]}
              </span>
              <button
                type="button"
                className="button button-secondary"
                aria-label={`${t.moveUp}: ${question.options.find((option) => option.id === id)?.text[locale]}`}
                disabled={checked || index === 0}
                onClick={() => move(index, index - 1)}
                style={{ padding: '.4rem', minHeight: 40 }}
              >
                <ArrowUp size={17} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="button button-secondary"
                aria-label={`${t.moveDown}: ${question.options.find((option) => option.id === id)?.text[locale]}`}
                disabled={checked || index === order.length - 1}
                onClick={() => move(index, index + 1)}
                style={{ padding: '.4rem', minHeight: 40 }}
              >
                <ArrowDown size={17} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ol>
      ) : question.type === 'matching' ? (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {(question.prompts ?? []).map((prompt, index) => (
            <label key={index} style={{ display: 'grid', gap: '.5rem' }}>
              {localize(prompt, locale)}
              <select
                className="input"
                value={answer[index] ?? ''}
                onChange={(e) => {
                  const next = Array.from(
                    { length: question.prompts?.length ?? 0 },
                    (_, i) => answer[i] ?? '',
                  );
                  next[index] = e.target.value;
                  onAnswer(next);
                }}
              >
                <option value="">{t.choose}</option>
                {options.map((option) => (
                  <option
                    key={option.id}
                    value={option.id}
                    disabled={answer.includes(option.id) && answer[index] !== option.id}
                  >
                    {localize(option.text, locale)}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '.7rem' }}>
          {options.map((option, index) => (
            <label
              key={option.id}
              className="card"
              style={{
                display: 'flex',
                gap: '.8rem',
                alignItems: 'flex-start',
                cursor: checked ? 'default' : 'pointer',
                padding: '1rem',
                borderColor: answer.includes(option.id) ? 'var(--accent, #c6664a)' : undefined,
              }}
            >
              <input
                style={{ marginTop: '.3rem', flexShrink: 0 }}
                type={question.type === 'multiple' ? 'checkbox' : 'radio'}
                name={`answer-${question.id}`}
                checked={answer.includes(option.id)}
                onChange={() =>
                  onAnswer(
                    question.type === 'multiple'
                      ? answer.includes(option.id)
                        ? answer.filter((id) => id !== option.id)
                        : [...answer, option.id]
                      : [option.id],
                  )
                }
              />
              {!(question.providerId && /^[A-Z]\)/.test(option.text.en)) && (
                <span aria-hidden="true" className="muted" style={{ fontWeight: 600 }}>
                  {String.fromCharCode(65 + index)}.
                </span>
              )}
              <span>{localize(option.text, locale)}</span>
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
}

function AnswerFeedback({
  question,
  answer,
  locale,
}: {
  question: QuizQuestion;
  answer: string[];
  locale: Locale;
}) {
  const t = text[locale];
  const correct = gradeAnswer(question, answer);
  return (
    <div
      style={{
        background:
          correct === false
            ? 'color-mix(in srgb, var(--accent, #c6664a) 10%, var(--surface, #fff))'
            : 'color-mix(in srgb, var(--sage, #668578) 12%, var(--surface, #fff))',
        borderRadius: 12,
        padding: '1.25rem',
        display: 'grid',
        gap: '.75rem',
        color: 'var(--ink, inherit)',
      }}
      role="status"
    >
      <strong style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
        <Lightbulb size={18} aria-hidden="true" />
        {correct === null ? t.reflection : correct ? t.correct : t.incorrect}
      </strong>
      <p>{localize(question.explanation, locale)}</p>
      {question.sourceQuestionId && (
        <p className="small muted">
          {locale === 'az' ? 'Mənbədəki sual' : 'Source question'}: {question.sourceQuestionId}
        </p>
      )}
      <SourceLinks ids={question.sourceIds} locale={locale} />
      {question.type === 'written' ? (
        <ul>
          {question.rubric?.map((criterion, i) => (
            <li key={i}>{localize(criterion, locale)}</li>
          ))}
        </ul>
      ) : (
        <div>
          <p>
            <strong>{t.correctAnswer}: </strong>
            {question.correct
              .map((id) => question.options.find((o) => o.id === id)?.text[locale])
              .join(question.type === 'ordering' || question.type === 'matching' ? ' → ' : '; ')}
          </p>
          {!question.providerId && (
            <details style={{ marginTop: '.75rem' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600 }}>{t.explanation}</summary>
              <ul
                style={{
                  display: 'grid',
                  gap: '.75rem',
                  paddingLeft: '1.25rem',
                  marginTop: '.75rem',
                }}
              >
                {question.options.map((option) => (
                  <li key={option.id}>
                    <strong>{localize(option.text, locale)}</strong>
                    <br />
                    {localize(option.explanation, locale)}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
      <LessonRecommendation id={question.lessonId} locale={locale} />
    </div>
  );
}

function ExamDetails({ exam, locale }: { exam: ExamConfig; locale: Locale }) {
  const t = text[locale];
  return (
    <details style={{ borderTop: '1px solid var(--line, #e7e3de)', paddingTop: '1rem' }}>
      <summary style={{ cursor: 'pointer', fontWeight: 600 }}>{t.config}</summary>
      <div style={{ display: 'grid', gap: '.75rem', marginTop: '1rem' }}>
        <p className="badge" style={{ width: 'fit-content' }}>
          {exam.verificationStatus === 'verified'
            ? `${t.verified} · ${exam.verifiedAt}`
            : t.unverified}
        </p>
        <dl
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))',
            gap: '1rem',
          }}
        >
          <div>
            <dt className="muted">{t.questionCount}</dt>
            <dd style={{ fontWeight: 600, margin: 0 }}>{exam.questionCount ?? t.unknown}</dd>
          </div>
          <div>
            <dt className="muted">{t.duration}</dt>
            <dd style={{ fontWeight: 600, margin: 0 }}>
              {exam.durationMinutes ? `${exam.durationMinutes} ${t.minutes}` : t.unknown}
            </dd>
          </div>
          <div>
            <dt className="muted">{t.pass}</dt>
            <dd style={{ fontWeight: 600, margin: 0 }}>
              {exam.passPercent !== null ? `${exam.passPercent}%` : t.unknown}
            </dd>
          </div>
        </dl>
        <p className="muted">{localize(exam.notes, locale)}</p>
        <ul style={{ paddingLeft: '1.25rem' }}>
          {exam.sources.map((source) => (
            <li key={source.url}>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'underline' }}
              >
                {source.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}

function ResultPanel({
  result,
  questions,
  exams,
  locale,
  onAgain,
}: {
  result: QuizAttempt;
  questions: QuizQuestion[];
  exams: ExamConfig[];
  locale: Locale;
  onAgain: () => void;
}) {
  const t = text[locale];
  const exam = exams.find((item) => item.id === result.trackId);
  const items = result.questionIds
    .map((id) => questions.find((q) => q.id === id))
    .filter((q): q is QuizQuestion => !!q);
  const weak = weakAreas(result.domainScores);
  const recommendations = [
    ...new Set(
      items.filter((q) => weak.some((domain) => domain.domain === q.domain)).map((q) => q.lessonId),
    ),
  ];
  const percent = result.total ? Math.round((result.score / result.total) * 100) : null;

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <section className="card" style={{ padding: '2rem', textAlign: 'center' }}>
        <Trophy
          size={36}
          aria-hidden="true"
          style={{ margin: '0 auto 1rem', color: 'var(--accent, #c6664a)' }}
        />
        <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)' }}>
          {percent === null ? t.writtenSaved : t.resultTitle}
        </h2>
        {result.practiceSetId && (
          <p>
            {practiceSets.find((set) => set.id === result.practiceSetId)?.title[locale] ??
              result.practiceSetId}
          </p>
        )}
        {percent !== null ? (
          <>
            <p style={{ fontSize: '3rem', fontWeight: 700, lineHeight: 1.2, marginTop: '1rem' }}>
              {percent}%
            </p>
            <p className="muted">
              {result.score} / {result.total} · {t.score}
            </p>
          </>
        ) : null}
        {items.some((q) => q.type === 'written') ? (
          <p className="muted" style={{ marginTop: '1rem' }}>
            {t.writtenNote}
          </p>
        ) : null}
        <p className="muted" style={{ fontSize: '.85rem', margin: '1rem auto', maxWidth: 560 }}>
          {t.officialNote}
        </p>
        <button className="button button-primary" onClick={onAgain}>
          <RotateCcw size={16} aria-hidden="true" />
          {t.again}
        </button>
      </section>
      {result.total ? (
        <section className="card">
          <h2 style={{ marginBottom: '1rem' }}>{t.breakdown}</h2>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {Object.entries(result.domainScores).map(([domain, score]) => (
              <div key={domain}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    marginBottom: '.35rem',
                  }}
                >
                  <span>{exam?.domains.find((d) => d.id === domain)?.title[locale] ?? domain}</span>
                  <strong>
                    {score.correct}/{score.total}
                  </strong>
                </div>
                <progress
                  aria-label={exam?.domains.find((d) => d.id === domain)?.title[locale] ?? domain}
                  value={score.correct}
                  max={score.total}
                  style={{ width: '100%', accentColor: 'var(--accent, #c6664a)', height: 10 }}
                />
              </div>
            ))}
          </div>
          <h3 style={{ marginTop: '1.5rem' }}>{t.weak}</h3>
          {!weak.length ? (
            <p className="muted">{t.noWeak}</p>
          ) : (
            <>
              <ul>
                {weak.map((domain) => (
                  <li key={domain.domain}>
                    {exam?.domains.find((d) => d.id === domain.domain)?.title[locale] ??
                      domain.domain}{' '}
                    · {domain.percent}%
                  </li>
                ))}
              </ul>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', marginTop: '.75rem' }}>
                {recommendations.map((id) => (
                  <LessonRecommendation key={id} id={id} locale={locale} />
                ))}
              </div>
            </>
          )}
        </section>
      ) : null}
      <section className="card">
        <h2 style={{ marginBottom: '1rem' }}>{t.reviewAnswers}</h2>
        {items.map((question, index) => (
          <details
            key={question.id}
            style={{ borderBottom: '1px solid var(--line, #e7e3de)', padding: '1rem 0' }}
          >
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
              {index + 1}. {localize(question.text, locale)}
            </summary>
            <p style={{ margin: '1rem 0' }}>
              <strong>{t.yourAnswer}: </strong>
              {question.type === 'written'
                ? result.answers[question.id]?.[0] || t.notAnswered
                : result.answers[question.id]
                    ?.map((id) => question.options.find((option) => option.id === id)?.text[locale])
                    .join('; ') || t.notAnswered}
            </p>
            <AnswerFeedback
              question={question}
              answer={result.answers[question.id] ?? []}
              locale={locale}
            />
          </details>
        ))}
      </section>
    </div>
  );
}

function LessonRecommendation({ id, locale }: { id: string; locale: Locale }) {
  const lesson = lessons.find((item) => item.id === id);
  if (!lesson) return null;
  return (
    <Link
      className="button button-secondary"
      style={{
        width: 'fit-content',
        maxWidth: '100%',
        whiteSpace: 'normal',
        textAlign: 'left',
        flexWrap: 'wrap',
      }}
      href={`/${locale}/lessons/${id}`}
      aria-label={`${text[locale].learn}: ${lesson.title[locale]}${lesson.status === 'planned' ? (locale === 'az' ? ', məzmun planı' : ', curriculum outline') : ''}`}
    >
      <span>{lesson.title[locale]}</span>
      {lesson.status === 'planned' ? (
        <span className="badge">{locale === 'az' ? 'Məzmun planı' : 'Outline'}</span>
      ) : null}
      <ArrowRight size={15} aria-hidden="true" />
    </Link>
  );
}

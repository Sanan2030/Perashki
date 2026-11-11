import { expect, test } from '@playwright/test';
import { getQuestions } from '../../lib/assessments';

const questions = getQuestions();

test('starts a 100-question PSPO session and filters unseen questions by difficulty and format', async ({
  page,
}) => {
  await page.goto('/en/practice?track=pspo2');
  await page.getByRole('combobox', { name: /^Questions/ }).selectOption('100');
  await page.getByRole('button', { name: 'Start practicing' }).click();
  await expect(page.getByRole('button', { name: 'Question 100', exact: true })).toBeVisible();
  let saved = await page.evaluate(() => JSON.parse(localStorage.getItem('level-up.progress.v1')!));
  expect(saved.sessions.quiz.questionIds).toHaveLength(100);
  expect(new Set(saved.sessions.quiz.questionIds).size).toBe(100);
  await page.getByRole('button', { name: 'Discard session', exact: true }).click();
  await page.getByRole('combobox', { name: /^Questions/ }).selectOption('5');
  await page.getByRole('combobox', { name: 'Difficulty', exact: true }).selectOption('2');
  await page.getByRole('combobox', { name: 'Question format', exact: true }).selectOption('single');
  await page
    .getByRole('checkbox', { name: 'Only questions not used in previous sessions' })
    .check();
  await page.getByRole('button', { name: 'Start practicing' }).click();
  saved = await page.evaluate(() => JSON.parse(localStorage.getItem('level-up.progress.v1')!));
  const firstIds = saved.sessions.quiz.questionIds as string[];
  expect(firstIds).toHaveLength(5);
  expect(
    firstIds.every((id) =>
      questions.some((q) => q.id === id && q.type === 'single' && q.difficulty === 2),
    ),
  ).toBe(true);
  await page.getByRole('button', { name: 'Finish session', exact: true }).click();
  await page.getByRole('button', { name: 'Practice again', exact: true }).click();
  await page.getByRole('button', { name: 'Start practicing' }).click();
  saved = await page.evaluate(() => JSON.parse(localStorage.getItem('level-up.progress.v1')!));
  expect(saved.sessions.quiz.questionIds.every((id: string) => !firstIds.includes(id))).toBe(true);
});

test('runs the verified 50-question ECBA mock with domain allocation and keeps PSPO format unverified', async ({
  page,
}) => {
  await page.goto('/en/practice?track=ecba');
  await page.getByRole('radio', { name: /^Timed mock/ }).check();
  await page.getByRole('button', { name: 'Start practicing' }).click();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('level-up.progress.v1')!),
  );
  expect(saved.sessions.quiz.questionIds).toHaveLength(50);
  expect(saved.sessions.quiz.mode).toBe('mock');
  await expect(page.getByRole('timer')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Check answer', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Discard session', exact: true }).click();
  await page.getByRole('combobox', { name: 'Learning track', exact: true }).selectOption('pspo1');
  await expect(page.getByRole('button', { name: 'Start practicing' })).toBeDisabled();
});

test('competency study guide shows all five groups and 28 focus areas', async ({ page }) => {
  await page.goto('/en/study-guide');
  await expect(page.locator('.study-group')).toHaveCount(5);
  await expect(page.locator('.study-focus')).toHaveCount(28);
  await expect(
    page.getByRole('link', {
      name: `PSPO I · ${questions.filter((q) => q.trackId === 'pspo1').length} questions`,
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', {
      name: `PSPO II · ${questions.filter((q) => q.trackId === 'pspo2').length} questions`,
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText('no dedicated coaching lesson is published yet', { exact: false }),
  ).toBeVisible();
});

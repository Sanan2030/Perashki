import lessonData from '../../data/lessons.json' with { type: 'json' };
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('certification cards open the matching library and keep original progress', async ({
  page,
}) => {
  await page.goto('/en/lessons/stakeholder-mapping');
  await page.getByRole('button', { name: 'Mark as completed' }).click();
  await page.goto('/en');
  await page
    .locator('.certification-grid button')
    .filter({ has: page.getByText('PSPO II', { exact: true }) })
    .click();
  await expect(page).toHaveURL(/track=pspo2/);
  await expect(page.getByRole('combobox', { name: 'Track', exact: true })).toHaveValue('pspo2');
  await expect(page.locator('.library-lesson-card')).toHaveCount(
    lessonData.filter((l) => l.trackId === 'pspo2').length,
  );
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('level-up.progress.v1')!),
  );
  expect(saved.completedLessons['stakeholder-mapping']).toBeTruthy();
});

test('new source-backed lesson gives feedback, section links and focused practice', async ({
  page,
}) => {
  await page.goto('/en/lessons/pspo2-kanban');
  const toc = page.getByRole('navigation', { name: 'In this lesson' });
  await toc.getByRole('link', { name: 'Check understanding and remember' }).click();
  await expect(page).toHaveURL(/#section-10$/);
  const question = page.locator('.knowledge-question').first();
  await question.getByRole('radio', { name: 'Work Item Age.', exact: true }).check();
  await question.getByRole('button', { name: 'Check answer' }).click();
  await expect(question.getByRole('status')).toContainText('Correct.');
  await expect(question.getByRole('link', { name: /The Kanban Guide/ })).toBeVisible();
  await page.getByRole('link', { name: 'Practice this lesson', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Learning track', exact: true })).toHaveValue(
    'pspo2',
  );
  await expect(page.getByText('Lesson practice:', { exact: false })).toContainText(
    'Flow of value with Kanban',
  );
  await page.getByRole('button', { name: 'Start practicing' }).click();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('level-up.progress.v1')!),
  );
  expect(saved.sessions.quiz.questionIds.length).toBeGreaterThan(0);
});

test('sources distinguish uploaded primary texts from unavailable tests', async ({ page }) => {
  await page.goto('/en/sources');
  await expect(page.getByRole('combobox', { name: 'Active learning track' })).toBeEnabled();
  await expect(page.locator('#scrum-2020')).toHaveCount(1);
  await expect(page.locator('#scrum-2020')).toContainText('Read');
  await expect(page.locator('#po-open')).toContainText('Text unavailable');
  await expect(page.locator('#classmarker')).toContainText(
    'official status have not been verified',
  );
  await expect(page.locator('#professional-po-2018')).toContainText('2020 Guide');
});

test('landing builds the selected level gap and roadmap skill checks persist', async ({ page }) => {
  await page.goto('/en');
  await page.getByRole('button', { name: 'Junior BA', exact: true }).first().click();
  await page.getByRole('button', { name: 'Mid BA', exact: true }).last().click();
  await page.getByRole('button', { name: 'Build my roadmap', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/roadmap$/);
  await expect(page.getByText('Business Analyst · Junior → Mid')).toBeVisible();
  const moduleWidth = await page
    .locator('.roadmap-module > .card')
    .first()
    .evaluate((element) => element.getBoundingClientRect().width);
  expect(moduleWidth).toBeGreaterThan(400);
  const accessibility = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(
    accessibility.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
  ).toEqual([]);
  const checkbox = page.locator('.roadmap-skill input').first();
  await checkbox.check();
  await page.reload();
  await expect(page.locator('.roadmap-skill input').first()).toBeChecked();
  await page.setViewportSize({ width: 390, height: 844 });
  const sizes = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(sizes.document).toBeLessThanOrEqual(sizes.viewport);
});

import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import lessonData from '../../data/lessons.json' with { type: 'json' };

test('subject filters compose with track, search and content filters', async ({ page }) => {
  await page.goto('/en/lessons?subject=technical');
  const cards = page.locator('.library-lesson-card');
  await expect(page.getByRole('combobox', { name: 'Subject', exact: true })).toHaveValue(
    'technical',
  );
  await expect(cards).toHaveCount(11);
  await page.getByRole('combobox', { name: 'Content', exact: true }).selectOption('published');
  await page.getByRole('searchbox').fill('refresh token');
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText('Access tokens, refresh tokens and rotation races');
  await page.getByRole('combobox', { name: 'Track', exact: true }).selectOption('pspo2');
  await expect(page.getByRole('heading', { name: 'No matching lessons' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(cards).toHaveCount(lessonData.length);
  await page.getByRole('combobox', { name: 'Subject', exact: true }).selectOption('pspo');
  await expect(cards).toHaveCount(lessonData.filter((l) => l.trackId.startsWith('pspo')).length);
  await page.getByRole('combobox', { name: 'Track', exact: true }).selectOption('pspo2');
  await page.getByRole('searchbox').fill('feature flags');
  await expect(cards).toHaveCount(1);
  await cards
    .getByRole('link', {
      name: 'Release decisions, feature flags and the Definition of Done',
      exact: true,
    })
    .click();
  await expect(page.locator('.diagram-canvas svg')).toBeVisible();
  await expect(
    page.locator('.lesson-sidebar').getByRole('link', { name: /Pete Hodgson/ }),
  ).toBeVisible();
});

test('technical lessons provide inline feedback, curated translation and focused saved practice', async ({
  page,
}) => {
  let onlineLookups = 0;
  await page.route('**/api/translate?**', async (route) => {
    onlineLookups++;
    await route.abort();
  });
  await page.goto('/en/lessons/access-refresh-tokens');
  await expect(page.getByRole('button', { name: 'Mark as completed' })).toBeEnabled();
  const question = page.locator('.knowledge-question').first();
  await question
    .getByRole('radio', {
      name: 'Coordinate one refresh and let the requests await its outcome.',
      exact: true,
    })
    .check();
  await question.getByRole('button', { name: 'Check answer', exact: true }).click();
  await expect(question.getByRole('status')).toContainText('Correct.');
  await page.getByRole('button', { name: 'Translate', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('searchbox').fill('refresh_token');
  await dialog.getByRole('button', { name: 'Look up', exact: true }).click();
  await expect(dialog.getByRole('heading', { name: 'Refresh token', exact: true })).toBeVisible();
  await expect(dialog).toContainText('Giriş tokenini yeniləmə etimadnaməsi');
  expect(onlineLookups).toBe(0);
  await page.keyboard.press('Escape');
  await page.getByRole('link', { name: 'Practice this lesson', exact: true }).click();
  await expect(
    page.getByText('Independent lesson practice · outside learning paths', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Start practicing', exact: true }).click();
  const ids = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('level-up.progress.v1')!).sessions.quiz
        .questionIds as string[],
  );
  expect(ids).toHaveLength(4);
  expect(ids.every((id) => id.startsWith('access-refresh-tokens-extra-'))).toBe(true);
});

test('coding lesson and library filters are usable on mobile with accessible content', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/en/lessons?subject=technical');
  await expect(page.getByRole('combobox', { name: 'Subject', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.goto('/en/lessons/secure-api-coding');
  await expect(page.locator('.diagram-canvas svg')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const code = page.locator('.prose pre').first();
  await code.focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => code.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await expect(
    page.getByRole('link', { name: 'the lab source and instructions', exact: true }),
  ).toHaveAttribute('href', 'https://github.com/Sanan2030/level_up/tree/main/examples/api-lab');
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual(
    [],
  );
  await page.screenshot({ path: '/tmp/technical-coding-mobile.png', fullPage: true });
  for (const id of ['rest-apis', 'pspo2-outcome-experiments']) {
    await page.goto(`/en/lessons/${id}`);
    await expect(page.locator('.diagram-canvas svg')).toBeVisible();
    const table = page.locator('.prose table').first();
    await table.focus();
    await expect(table).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      390,
    );
    const tableResult = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(
      tableResult.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
    ).toEqual([]);
  }
});

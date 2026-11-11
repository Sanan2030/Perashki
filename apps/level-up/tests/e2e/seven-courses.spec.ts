import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('expanded technical collections compose with existing filters and stable BA/PO lessons', async ({
  page,
}) => {
  const cards = page.locator('.library-lesson-card');
  for (const [subject, count] of [
    ['databases', 3],
    ['messaging', 3],
    ['testing', 3],
    ['data-engineering', 3],
    ['cloud-security', 4],
  ] as const) {
    await page.goto(`/en/lessons?subject=${subject}`);
    await expect(page.getByRole('combobox', { name: 'Subject', exact: true })).toHaveValue(subject);
    await expect(cards).toHaveCount(count);
    await page.getByRole('combobox', { name: 'Content', exact: true }).selectOption('published');
    await expect(cards).toHaveCount(count);
  }
  await page.getByRole('searchbox').fill('SSRF');
  await expect(cards).toHaveCount(1);
  await page.getByRole('combobox', { name: 'Track', exact: true }).selectOption('po');
  await expect(page.getByRole('heading', { name: 'No matching lessons' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await page.getByRole('combobox', { name: 'Track', exact: true }).selectOption('po');
  await page.getByRole('searchbox').fill('JTBD and non-leading interviews');
  await expect(cards).toHaveCount(1);
  await cards.getByRole('link', { name: 'JTBD and non-leading interviews', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Mark as completed' })).toBeEnabled();
  await expect(page.locator('.diagram-canvas svg')).toBeVisible();
});

test('database lessons provide explained checks, focused practice and offline terminology', async ({
  page,
}) => {
  let lookups = 0;
  await page.route('**/api/translate?**', async (route) => {
    lookups++;
    await route.abort();
  });
  await page.goto('/en/lessons/db-indexes-explain');
  const check = page.locator('.knowledge-question').first();
  await check
    .getByRole('radio', { name: 'No; planner cost uses abstract estimates.', exact: true })
    .check();
  await check.getByRole('button', { name: 'Check answer', exact: true }).click();
  await expect(check.getByRole('status')).toContainText('Correct.');
  await page.getByRole('button', { name: 'Translate', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('searchbox').fill('DLQ');
  await dialog.getByRole('button', { name: 'Look up', exact: true }).click();
  await expect(
    dialog.getByRole('heading', { name: 'Dead-letter queue', exact: true }),
  ).toBeVisible();
  await expect(dialog).toContainText('Uğursuz mesajlar üçün ayrıca növbə');
  expect(lookups).toBe(0);
  await page.keyboard.press('Escape');
  await page.getByRole('link', { name: 'Practice this lesson', exact: true }).click();
  await page.getByRole('button', { name: 'Start practicing', exact: true }).click();
  const ids = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('level-up.progress.v1')!).sessions.quiz
        .questionIds as string[],
  );
  expect(ids).toHaveLength(4);
  expect(ids.every((id) => id.startsWith('db-indexes-explain-course-'))).toBe(true);
});

test('BA cases, data-engineering code and cloud security remain accessible on mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const id of ['bpmn-process', 'data-dbt-quality-lineage', 'security-threat-modeling-ssrf']) {
    await page.goto(`/en/lessons/${id}`);
    await expect(page.locator('.diagram-canvas svg')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Mark as completed' })).toBeEnabled();
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      390,
    );
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(
      result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
    ).toEqual([]);
  }
});

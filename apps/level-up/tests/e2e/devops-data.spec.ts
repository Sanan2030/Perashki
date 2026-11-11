import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import lessonData from '../../data/lessons.json' with { type: 'json' };

test('DevOps and data collections compose with existing library filters', async ({ page }) => {
  const cards = page.locator('.library-lesson-card');
  await page.goto('/en/lessons?subject=devops');
  const subject = page.getByRole('combobox', { name: 'Subject', exact: true });
  await expect(subject).toHaveValue('devops');
  await expect(cards).toHaveCount(
    lessonData.filter((lesson) => lesson.topics.includes('devops')).length,
  );
  await page.getByRole('combobox', { name: 'Content', exact: true }).selectOption('published');
  await page.getByRole('searchbox').fill('Terraform');
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText('Terraform infrastructure as code');
  await page.getByRole('combobox', { name: 'Track', exact: true }).selectOption('pspo1');
  await expect(page.getByRole('heading', { name: 'No matching lessons' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(cards).toHaveCount(lessonData.length);
  await subject.selectOption('data');
  await expect(cards).toHaveCount(7);
  await page.getByRole('searchbox').fill('SQL for business questions');
  await expect(cards).toHaveCount(1);
  await cards.getByRole('link', { name: 'SQL for business questions', exact: true }).click();
  await expect(page.locator('.diagram-canvas svg')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mark as completed' })).toBeEnabled();
  await page.goto('/en/lessons?subject=data');
  await expect(subject).toHaveValue('data');
  await expect(cards).toHaveCount(7);
});

test('new lessons provide explained checks, offline terminology and focused practice', async ({
  page,
}) => {
  let lookups = 0;
  await page.route('**/api/translate?**', async (route) => {
    lookups++;
    await route.abort();
  });
  await page.goto('/en/lessons/devops-kubernetes-delivery');
  const question = page.locator('.knowledge-question').first();
  await question.getByRole('radio', { name: 'Readiness.', exact: true }).check();
  await question.getByRole('button', { name: 'Check answer', exact: true }).click();
  await expect(question.getByRole('status')).toContainText('Correct.');
  await page.getByRole('button', { name: 'Translate', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('searchbox').fill('readiness probe');
  await dialog.getByRole('button', { name: 'Look up', exact: true }).click();
  await expect(dialog.getByRole('heading', { name: 'Readiness probe', exact: true })).toBeVisible();
  await expect(dialog).toContainText('Sorğu qəbul etməyə hazırlıq yoxlaması');
  await dialog.getByRole('searchbox').fill('p_value');
  await dialog.getByRole('button', { name: 'Look up', exact: true }).click();
  await expect(dialog.getByRole('heading', { name: 'P-value', exact: true })).toBeVisible();
  await expect(dialog).toContainText('Null fərziyyənin doğru olma ehtimalı demək deyil.');
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
  expect(ids.every((id) => id.startsWith('devops-kubernetes-delivery-practice-'))).toBe(true);
});

test('data and DevOps lesson tables and code remain usable on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const id of [
    'devops-ci-cd-artifacts',
    'data-sql-windows-cohorts',
    'data-experiments-statistics',
  ]) {
    await page.goto(`/en/lessons/${id}`);
    await expect(page.locator('.diagram-canvas svg')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const code = page.locator('.prose pre').first();
    await code.focus();
    await expect(code).toBeFocused();
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
  await page.screenshot({ path: '/tmp/devops-data-mobile.png', fullPage: true });
});

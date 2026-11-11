import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const switchName = 'Azərbaycan dili / English';

test('a selected quiz answer and flag survive switching language', async ({ page }) => {
  await page.goto('/en/practice?lesson=docker-kubernetes-masterclass');
  await page.getByRole('button', { name: 'Start practicing', exact: true }).click();
  const answer = page.locator('input[name^="answer-"]').first();
  await answer.check();
  const saved = await page.evaluate(
    () => JSON.parse(localStorage.getItem('level-up.progress.v1')!).sessions.quiz,
  );
  await page.getByRole('button', { name: 'Flag for review', exact: true }).click();
  await page.getByRole('switch', { name: switchName }).click();
  await expect(page).toHaveURL(/\/az\/practice\?lesson=docker-kubernetes-masterclass$/);
  await expect(page.locator('input[name^="answer-"]').first()).toBeChecked();
  const restored = await page.evaluate(
    () => JSON.parse(localStorage.getItem('level-up.progress.v1')!).sessions.quiz,
  );
  expect(restored.questionIds).toEqual(saved.questionIds);
  expect(restored.answers).toEqual(saved.answers);
  await expect(page.getByRole('button', { name: 'İşarələnib', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Cavabı yoxla', exact: true }).click();
  await expect(page.locator('.quiz-session-question [role="status"]')).toContainText(
    /Düzgündür!|Bu cavabı yenidən/,
  );
});

test('language switch preserves lesson, query, hash, notes and completion', async ({ page }) => {
  await page.goto('/en/lessons/product-backlog?track=po#section-3');
  await page.getByRole('button', { name: 'Mark as completed', exact: true }).click();
  await page.getByText('My personal notes', { exact: true }).click();
  await page.locator('#lesson-note').fill('My note stays the same.');
  await page.getByRole('button', { name: 'Save note', exact: true }).click();
  await page.getByRole('switch', { name: switchName }).click();
  await expect(page).toHaveURL(/\/az\/lessons\/product-backlog\?track=po#section-3$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'az');
  await expect(page.getByRole('switch', { name: switchName })).toBeChecked();
  await expect(page.locator('.prose')).toContainText('Product Backlog');
  await expect(page.locator('.prose')).not.toContainText('Məhsul İş Siyahısı');
  await expect(
    page.getByRole('button', { name: 'Tamamlandı — geri al', exact: true }),
  ).toBeVisible();
  await page.getByText('Şəxsi qeydlərim', { exact: true }).click();
  await expect(page.locator('#lesson-note')).toHaveValue('My note stays the same.');
  await page.reload();
  await expect(page.getByRole('switch', { name: switchName })).toBeChecked();
  await page.goto('/');
  await expect(page).toHaveURL(/\/az\/?$/);
  await expect(page.getByRole('heading', { name: 'Öyrənmə yol xəritəsini qur' })).toBeVisible();
  await page.getByRole('switch', { name: switchName }).press('Space');
  await expect(page).toHaveURL(/\/en\/?$/);
});

test('Azerbaijani library, glossary and masterclass retain English terms', async ({ page }) => {
  await page.goto('/az/lessons?subject=devops');
  await expect(page.getByRole('heading', { name: 'Dərs kitabxanası', exact: true })).toBeVisible();
  await page.getByRole('searchbox').fill('Vault');
  await expect(page.locator('.library-lesson-card')).toHaveCount(1);
  await page.locator('.library-lesson-card h2 a').click();
  await expect(page.locator('.prose')).toContainText('Bu, Dockerfile-dan');
  await expect(page.locator('.diagram-canvas svg')).toHaveCount(4);
  await page.getByRole('tab', { name: 'Pod-lar və rollout', exact: true }).click();
  await page.getByRole('button', { name: 'Bir Pod sil', exact: true }).click();
  await expect(page.getByRole('tabpanel').getByRole('status')).toContainText(
    'yeni kimliyə sahib əvəzedici Pod',
  );
  await page.getByRole('tab', { name: 'ConfigMap və Vault', exact: true }).click();
  await page.getByRole('combobox', { name: 'LOG_LEVEL', exact: true }).selectOption('debug');
  await expect(page.getByRole('tabpanel').getByRole('status')).toContainText(
    'köhnə dəyəri saxlayır',
  );
  await page.goto('/az/glossary');
  await page.getByRole('searchbox').fill('ConfigMap');
  await expect(page.getByRole('heading', { name: 'ConfigMap', exact: true })).toBeVisible();
  await expect(page.locator('.glossary-entry')).toContainText('məxfi');
});

test('Azerbaijani labs explain results while preserving SQL and HTTP contracts', async ({
  page,
}) => {
  await page.goto('/az/lessons/sql-basics#practice-lab');
  const sql = page.getByRole('region', { name: 'SQL laboratoriyası', exact: true });
  await sql
    .getByRole('textbox', { name: 'SQL sorğusu' })
    .fill("SELECT SUM(amount_cents) AS paid_revenue_cents FROM orders WHERE status='paid'");
  await sql.getByRole('button', { name: 'SQL-i icra et', exact: true }).click();
  await expect(sql.getByRole('region', { name: 'SQL nəticələri' })).toContainText('16500');
  await sql.getByRole('button', { name: 'SQL nəticəsini yoxla' }).click();
  await expect(sql.getByRole('status').last()).toHaveText('Bu dataset üçün nəticə düzgündür.');
  await sql.getByRole('textbox', { name: 'SQL sorğusu' }).fill('DELETE FROM orders');
  await sql.getByRole('button', { name: 'SQL-i icra et', exact: true }).click();
  await expect(sql.getByRole('alert')).toContainText('Dataset yalnız oxunur.');

  await page.goto('/az/lessons/rest-apis#practice-lab');
  const api = page.getByRole('region', { name: 'API laboratoriyası', exact: true });
  await api
    .getByRole('textbox', { name: 'Request header-ləri (JSON)' })
    .fill('{"Authorization":"Bearer demo-alice"}');
  await api.getByRole('button', { name: 'Sorğunu göndər', exact: true }).click();
  await expect(api.getByRole('status')).toHaveText('200 OK');
  await api.getByRole('button', { name: 'API nəticəsini yoxla' }).click();
  await expect(api.getByRole('status').last()).toHaveText('Sandbox nəticəsi düzgündür.');
  await api.getByText('API contract və nümunə kimliklər', { exact: true }).click();
  await expect(api).toContainText('Nümunə token-lər: Bearer demo-alice');
});

test('the language switch works with the dark theme and reduced motion', async ({ page }) => {
  await page.goto('/en');
  await page.getByRole('button', { name: 'Toggle color theme' }).click();
  await page.getByRole('switch', { name: switchName }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'az');
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual(
    [],
  );
  await page.screenshot({ path: '/tmp/language-switch-desktop-dark.png' });
});

for (const width of [360, 390])
  test(`rounded language switch is accessible on a ${width}px screen`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/az');
    const toggle = page.getByRole('switch', { name: switchName });
    await expect(toggle).toBeVisible();
    const size = await toggle.boundingBox();
    expect(size!.width).toBeLessThanOrEqual(80);
    expect(size!.height).toBeGreaterThanOrEqual(32);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    await toggle.focus();
    await expect(toggle).toBeFocused();
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(
      result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
    ).toEqual([]);
    await page.screenshot({ path: `/tmp/language-switch-${width}.png`, fullPage: true });
  });

import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const pages = [
  { name: 'landing', path: '/en' },
  { name: 'dashboard', path: '/en/dashboard' },
  { name: 'sources', path: '/en/sources' },
  { name: 'source-backed lesson', path: '/en/lessons/pspo2-kanban', diagram: true },
  { name: 'published lesson with diagram', path: '/en/lessons/stakeholder-mapping', diagram: true },
  { name: 'onboarding', path: '/en/onboarding' },
  { name: 'practice setup', path: '/en/practice' },
  { name: 'dark landing', path: '/en', dark: true },
  { name: 'dark dashboard', path: '/en/dashboard', dark: true },
  { name: 'dark lesson', path: '/en/lessons/stakeholder-mapping', diagram: true, dark: true },
  { name: 'competency study guide', path: '/en/study-guide' },
] as const;

for (const pageCase of pages) {
  test(`${pageCase.name} meets automated WCAG A/AA checks`, async ({ page }, testInfo) => {
    await page.goto(pageCase.path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    if ('dark' in pageCase) {
      await page.getByRole('button', { name: 'Toggle color theme' }).click();
      await expect(page.locator('html')).toHaveClass(/dark/);
    }
    if ('diagram' in pageCase) await expect(page.locator('.diagram-canvas svg')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const results = await new AxeBuilder({ page })
      .exclude('nextjs-portal')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    await testInfo.attach('axe-results', {
      body: JSON.stringify(results, null, 2),
      contentType: 'application/json',
    });
    const violations = results.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      nodes: violation.nodes.map((node) => ({ target: node.target, failure: node.failureSummary })),
    }));
    expect(violations).toEqual([]);
  });
}

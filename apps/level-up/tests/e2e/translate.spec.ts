import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('explains onboarding and multiword terms in both languages without an online lookup', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/translate')) requests.push(request.url());
  });
  await page.goto('/');
  await expect(page).toHaveURL(/\/en\/?$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.getByRole('button', { name: 'Translate', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Translate and understand' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('searchbox', { name: 'Word or phrase' }).fill('onboarding');
  await dialog.getByRole('button', { name: 'Look up', exact: true }).click();
  const result = dialog.getByRole('region', { name: 'Translation result' });
  await expect(result).toContainText('first useful result');
  await expect(result).toContainText('qeydiyyat');
  await expect(
    result.getByRole('heading', { name: 'English explanation', exact: true }),
  ).toBeVisible();
  await expect(
    result.getByRole('heading', { name: 'Azerbaijani explanation', exact: true }),
  ).toBeVisible();
  await expect(result.locator('[lang="az"]')).toHaveCount(3);
  await dialog.getByRole('searchbox', { name: 'Word or phrase' }).fill('Definition-of-Done');
  await dialog.getByRole('button', { name: 'Look up', exact: true }).click();
  await expect(result).toContainText('Definition of Done');
  expect(requests).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Translate', exact: true })).toBeFocused();
});

for (const locale of ['en', 'az'])
  test(`explains Monte Carlo forecasts and chart aliases locally in the ${locale} interface`, async ({
    page,
  }) => {
    const requests: string[] = [];
    await page.route('**/api/translate?*', (route) => {
      requests.push(route.request().url());
      return route.abort();
    });
    await page.goto(`/${locale}`);
    await page.locator('.translate-trigger').click();
    const dialog = page.getByRole('dialog');
    const result = dialog.locator('.translate-result');
    for (const [query, term] of [
      ['**Monte Carlo forecast**', 'Monte Carlo forecast'],
      ['CFD', 'Cumulative flow diagram'],
      ['burn-up chart', 'Burnup chart'],
      ['A / B test', 'A/B test'],
      ['95% confidence interval', 'Confidence interval'],
    ]) {
      await dialog.getByRole('searchbox').fill(query);
      await dialog.locator('button[type="submit"]').click();
      await expect(result.getByRole('heading', { name: term, exact: true })).toBeVisible();
      await expect(result.locator('[lang="az"]')).toHaveCount(3);
      await expect(result.locator('[lang="en"]')).toHaveCount(2);
      if (term === 'Monte Carlo forecast') {
        await expect(result).toContainText('distribution of possible completion dates');
        await expect(result).toContainText('tarixlərin paylanmasıdır');
        await expect(result).toContainText('zəmanət deyil');
      }
    }
    expect(requests).toEqual([]);
  });

test('prefills a selected technical phrase and stays within a mobile viewport', async ({
  page,
}) => {
  await page.goto('/en/lessons/pspo2-evidence-uncertainty');
  await expect(page.getByRole('combobox', { name: 'Active learning track' })).toBeEnabled();
  const selectedText = await page.evaluate(() => {
    const walker = document.createTreeWalker(
      document.querySelector('.prose')!,
      NodeFilter.SHOW_TEXT,
    );
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const index = node.textContent?.indexOf('Monte Carlo') ?? -1;
      if (index < 0) continue;
      const range = document.createRange();
      range.setStart(node, index);
      range.setEnd(node, index + 'Monte Carlo'.length);
      const selection = window.getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);
      break;
    }
    return window.getSelection()?.toString();
  });
  expect(selectedText).toBe('Monte Carlo');
  await page.getByRole('button', { name: 'Translate', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Translate and understand' });
  await expect(dialog.getByRole('searchbox', { name: 'Word or phrase' })).toHaveValue(
    'Monte Carlo',
  );
  await expect(dialog.getByRole('region', { name: 'Translation result' })).toBeVisible();
  await expect(
    dialog.getByRole('heading', { name: 'Monte Carlo simulation', exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => document.fonts.ready);
  const sizes = await dialog.evaluate((el) => ({
    width: el.getBoundingClientRect().width,
    scroll: el.scrollWidth,
    viewport: innerWidth,
  }));
  expect(sizes.width).toBeLessThanOrEqual(sizes.viewport);
  expect(sizes.scroll).toBeLessThanOrEqual(Math.ceil(sizes.width));
  await expect(dialog.getByRole('button', { name: 'Close translator' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Close translator' }).click();
  await expect(dialog).not.toBeVisible();
});

for (const dark of [false, true])
  test(`translator meets automated accessibility checks in ${dark ? 'dark' : 'light'} mode`, async ({
    page,
  }) => {
    await page.goto('/en');
    if (dark) await page.getByRole('button', { name: 'Toggle color theme' }).click();
    await page.getByRole('button', { name: 'Translate', exact: true }).click();
    await page.getByRole('searchbox', { name: 'Word or phrase' }).fill('onboarding');
    await page.getByRole('button', { name: 'Look up', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Translation result' })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const scan = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(
      scan.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({ target: n.target, failure: n.failureSummary })),
      })),
    ).toEqual([]);
  });

test('online dictionary results and service failures have honest visible states', async ({
  page,
}) => {
  await page.route('**/api/translate?*', (route) =>
    route.fulfill({
      json: {
        kind: 'online',
        term: 'serendipity',
        definitionEn: 'Finding something useful by chance.',
        meaningAz: 'Xoş təsadüf',
        explanationAz: 'Təsadüfən faydalı bir şey tapmaq.',
        example: { en: 'The discovery was serendipity.', az: 'Bu kəşf xoş təsadüf idi.' },
        partOfSpeech: 'noun',
        sources: [{ title: 'Test dictionary', url: 'https://dictionaryapi.dev/' }],
        machineTranslated: true,
      },
    }),
  );
  await page.goto('/en');
  await page.getByRole('button', { name: 'Translate', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Translate and understand' });
  await dialog.getByRole('searchbox', { name: 'Word or phrase' }).fill('serendipity');
  await dialog.getByRole('button', { name: 'Look up', exact: true }).click();
  await expect(dialog.getByRole('region', { name: 'Translation result' })).toContainText(
    'Xoş təsadüf',
  );
  await expect(
    dialog.getByRole('heading', { name: 'Azerbaijani explanation · machine translated' }),
  ).toBeVisible();
  await page.unroute('**/api/translate?*');
  await page.route('**/api/translate?*', (route) =>
    route.fulfill({ status: 503, json: { error: 'temporarily unavailable' } }),
  );
  await dialog.getByRole('searchbox', { name: 'Word or phrase' }).fill('unfamiliar phrase xyz');
  await dialog.getByRole('button', { name: 'Look up', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('Online lookup is unavailable');
  await expect(dialog.getByRole('region', { name: 'Translation result' })).toHaveCount(0);
});

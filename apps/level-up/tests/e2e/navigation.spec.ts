import { expect, test } from '@playwright/test';

test('Back follows repeated in-app visits and browser history, preserving query filters', async ({
  page,
}) => {
  await page.goto('/en');
  await expect(page.getByRole('button', { name: 'Build my roadmap' })).toBeEnabled();
  await page
    .locator('.certification-grid button')
    .filter({ has: page.getByText('PSPO II', { exact: true }) })
    .click();
  await expect(page).toHaveURL(/\/en\/lessons\?track=pspo2$/);
  await page
    .getByRole('navigation', { name: 'More learning tools' })
    .getByRole('link', { name: 'Settings' })
    .click();
  await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible();
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Lessons', exact: true })
    .click();
  await expect(page).toHaveURL(/\/en\/lessons$/);
  const navigation = page.getByRole('navigation', { name: 'Page navigation' });
  await navigation.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/settings$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/en\/lessons\?track=pspo2$/);
  await expect(page.getByRole('combobox', { name: 'Track', exact: true })).toHaveValue('pspo2');
  await navigation.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(navigation).toHaveCount(0);
});

test('direct links fall back to Home and both navigation controls work on mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/en/lessons/pspo2-kanban');
  await expect(page.getByRole('combobox', { name: 'Active learning track' })).toBeEnabled();
  const navigation = page.getByRole('navigation', { name: 'Page navigation' });
  await expect(navigation.getByRole('link', { name: 'Home', exact: true })).toBeVisible();
  await navigation.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page).toHaveURL(/\/en$/);
  await page.goto('/en/settings');
  await expect(page.getByRole('button', { name: 'Export JSON' })).toBeEnabled();
  const trackBounds = await page
    .getByRole('combobox', { name: 'Active learning track' })
    .boundingBox();
  const toolsBounds = await page
    .getByRole('navigation', { name: 'More learning tools' })
    .boundingBox();
  expect(toolsBounds!.y).toBeGreaterThanOrEqual(trackBounds!.y + trackBounds!.height);
  await expect(
    page
      .getByRole('navigation', { name: 'More learning tools' })
      .getByRole('link', { name: 'Settings' }),
  ).toBeInViewport();
  await page.reload();
  await expect(navigation).toBeVisible();
  await navigation.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page).toHaveURL(/\/en$/);
  await page.goto('/en/practice');
  await expect(navigation).toBeVisible();
  await navigation.getByRole('link', { name: 'Home', exact: true }).click();
  await expect(page).toHaveURL(/\/en$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('Back stays in the app after reloading and revisiting an older history entry', async ({
  page,
}) => {
  await page.goto('/en/lessons/pspo2-kanban');
  await expect(page.getByRole('combobox', { name: 'Active learning track' })).toBeEnabled();
  await page
    .getByRole('navigation', { name: 'More learning tools' })
    .getByRole('link', { name: 'Settings' })
    .click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Export JSON' })).toBeEnabled();
  await page.goBack();
  await expect(page).toHaveURL(/\/en\/lessons\/pspo2-kanban$/);
  await page
    .getByRole('navigation', { name: 'Page navigation' })
    .getByRole('button', { name: 'Back', exact: true })
    .click();
  await expect(page).toHaveURL(/\/en$/);
});

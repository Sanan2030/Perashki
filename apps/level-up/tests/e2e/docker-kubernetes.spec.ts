import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const lessonURL = '/en/lessons/docker-kubernetes-masterclass';

test('masterclass is discoverable and renders its visuals, checks and lesson practice', async ({
  page,
}) => {
  await page.goto('/en/lessons?subject=devops');
  await page.getByRole('searchbox').fill('Vault');
  const card = page.locator('.library-lesson-card');
  await expect(card).toHaveCount(1);
  await card
    .getByRole('link', { name: 'Docker & Kubernetes: from containers to Vault', exact: true })
    .click();
  const illustration = page.locator('.prose img');
  await expect(illustration).toBeVisible();
  expect(
    await illustration.evaluate((img) => (img as HTMLImageElement).naturalWidth),
  ).toBeGreaterThan(0);
  await expect(page.locator('.diagram-canvas svg')).toHaveCount(4);
  await expect(page.getByRole('button', { name: 'Mark as completed' })).toBeEnabled();
  const question = page.locator('.knowledge-question').first();
  await question
    .getByRole('radio', {
      name: 'The ReplicaSet creates a replacement Pod; desired replicas remain three.',
      exact: true,
    })
    .check();
  await question.getByRole('button', { name: 'Check answer', exact: true }).click();
  await expect(question.getByRole('status')).toContainText('Correct.');
  await page.getByRole('link', { name: 'Practice this lesson', exact: true }).click();
  await page.getByRole('button', { name: 'Start practicing', exact: true }).click();
  const ids = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('level-up.progress.v1')!).sessions.quiz
        .questionIds as string[],
  );
  expect(ids).toHaveLength(4);
  expect(ids.every((id) => id.startsWith('docker-kubernetes-masterclass-practice-'))).toBe(true);
});

test('replicas reconcile after deletion and a rollout transfers ownership to the new ReplicaSet', async ({
  page,
}) => {
  await page.goto(lessonURL);
  await page.getByRole('tab', { name: 'Pods & rollout', exact: true }).click();
  const panel = page.getByRole('tabpanel', { name: 'Pods & rollout', exact: true });
  await panel.getByLabel('Desired replicas').selectOption('2');
  await expect(panel.getByRole('status')).toContainText('Ready: 2 / desired: 2');
  await panel.getByRole('button', { name: 'Delete one Pod' }).click();
  await expect(panel.getByRole('status')).toContainText('Ready: 1 / desired: 2');
  await expect(panel.getByRole('button', { name: 'Deploy v2' })).toBeDisabled();
  await expect(panel.getByRole('status')).toContainText('replacement Pod with a new identity');
  await expect(panel.getByText('orders-v1-2-r1', { exact: true })).toBeVisible();
  await expect(panel.getByRole('status')).toContainText('Ready: 2 / desired: 2');
  await panel.getByRole('button', { name: 'Deploy v2' }).click();
  await expect(panel.getByRole('status')).toContainText('Ready: 3 / desired: 2');
  for (let i = 0; i < 3; i++)
    await panel.getByRole('button', { name: 'Next rollout step' }).click();
  await expect(panel.getByRole('status')).toContainText('Rollout complete');
  await expect(panel.getByRole('status')).toContainText('Ready: 2 / desired: 2');
  await expect(panel.getByText('0 ready Pods', { exact: true })).toBeVisible();
  await expect(panel.getByText('orders-v2-2', { exact: true })).toBeVisible();
  await panel.getByRole('button', { name: 'Reset cluster' }).click();
  await expect(panel.getByRole('status')).toContainText('Ready: 3 / desired: 3');
});

test('Service selection requires exact labels and namespace scope', async ({ page }) => {
  await page.goto(lessonURL);
  await page.getByRole('tab', { name: 'Labels & namespaces', exact: true }).click();
  const panel = page.getByRole('tabpanel', { name: 'Labels & namespaces', exact: true });
  await expect(panel.getByRole('status')).toContainText('2 matching ready Pods');
  await panel.getByLabel('Service selector').selectOption('order');
  await expect(panel.getByRole('status')).toContainText('0 matching ready Pods');
  await panel.getByLabel('Service selector').selectOption('orders');
  await panel.getByLabel('Service namespace').selectOption('production');
  await expect(panel.getByRole('status')).toContainText('1 matching ready Pod');
  await panel.getByLabel('Service selector').selectOption('catalog');
  await expect(panel.getByRole('status')).toContainText('0 matching ready Pods');
});

test('configuration snapshots and credential consumption update independently', async ({
  page,
}) => {
  await page.goto(lessonURL);
  await page.getByRole('tab', { name: 'ConfigMap & Vault', exact: true }).click();
  const panel = page.getByRole('tabpanel', { name: 'ConfigMap & Vault', exact: true });
  await panel.getByRole('combobox', { name: 'LOG_LEVEL', exact: true }).selectOption('debug');
  await expect(panel.getByText('Environment LOG_LEVEL: info', { exact: true })).toBeVisible();
  await expect(panel.getByRole('status')).toContainText(
    'Existing environment variables keep their old value',
  );
  await panel.getByRole('button', { name: 'Recreate Pod for config' }).click();
  await expect(panel.getByText('Environment LOG_LEVEL: debug', { exact: true })).toBeVisible();
  await panel.getByRole('button', { name: 'Simulate secret rotation' }).click();
  await expect(panel.getByText('Rendered credential: version 2', { exact: true })).toBeVisible();
  await expect(panel.getByText('Loaded credential: version 1', { exact: true })).toBeVisible();
  await panel.getByRole('button', { name: 'Reload credential file' }).click();
  await expect(panel.getByText('Loaded credential: version 2', { exact: true })).toBeVisible();
  await expect(panel.getByRole('status')).toContainText(
    'Application has loaded the current credential file',
  );
});

test('mobile explorer supports keyboard navigation and reduced motion without overflow or accessibility violations', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(lessonURL);
  await page.evaluate(() => document.fonts.ready);
  const first = page.getByRole('tab', { name: 'Image to cluster', exact: true });
  await first.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Pods & rollout', exact: true })).toBeFocused();
  await page.keyboard.press('Home');
  await expect(first).toBeFocused();
  await page.getByRole('button', { name: 'Next step', exact: true }).click();
  await expect(page.getByRole('tabpanel')).toContainText('2. Build an image');
  await expect(page.getByRole('button', { name: 'Play animation' })).toHaveCount(0);
  for (const tab of [
    'Image to cluster',
    'Pods & rollout',
    'Labels & namespaces',
    'ConfigMap & Vault',
  ]) {
    await page.getByRole('tab', { name: tab, exact: true }).click();
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
  await page.getByRole('tab', { name: 'Pods & rollout', exact: true }).click();
  await page.screenshot({ path: '/tmp/docker-kubernetes-mobile.png', fullPage: true });
});

test('journey animation can play and pause when motion is enabled', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(lessonURL);
  await page.getByRole('button', { name: 'Play animation' }).click();
  await expect(page.getByRole('tabpanel')).toContainText('2. Build an image', { timeout: 8000 });
  await page.getByRole('button', { name: 'Pause animation' }).click();
  await expect(page.getByRole('button', { name: 'Play animation' })).toBeVisible();
  await page.getByRole('button', { name: 'Next step', exact: true }).click();
  await expect(page.getByRole('tabpanel')).toContainText('3. Run a container');
});

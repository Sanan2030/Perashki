import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { mockEligibility } from '../../lib/quiz';
import { getExams, getQuestions } from '../../lib/assessments';
import lessonData from '../../data/lessons.json' with { type: 'json' };

const storageKey = 'level-up.progress.v1';

async function openDashboard(page: Page) {
  await page.goto('/en/dashboard');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Dashboard');
  await expect(page.locator('.page-skeleton')).toHaveCount(0);
}

test('defaults to English and opens the dashboard from the landing', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page).toHaveURL(/\/en\/?$/);
  await expect(page.getByRole('button', { name: 'Translate', exact: true })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Build your learning roadmap',
  );
  await page.getByRole('link', { name: 'My dashboard', exact: true }).click();
  await expect(page).toHaveURL(/\/en\/dashboard$/);
  await expect(page.getByRole('region', { name: 'Learning at a glance' })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: '/tmp/level-up-desktop.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('creates a level-gap roadmap and preserves an existing plan when changing track', async ({
  page,
}) => {
  await page.goto('/en/onboarding');
  await expect(page.getByRole('radio', { name: /Business Analyst/ })).toBeEnabled();
  await page.getByRole('radio', { name: /Business Analyst/ }).check();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('radio', { name: /Junior/ }).check();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('radio', { name: 'Mid', exact: true }).check();
  await page.getByLabel('Daily study time').selectOption('45');
  await page.getByRole('button', { name: 'Build my roadmap' }).click();
  await expect(page).toHaveURL(/\/en\/roadmap$/);
  await expect(page.getByRole('heading', { name: 'My learning path', exact: true })).toBeVisible();
  await expect(page.getByText('Business Analyst · Junior → Mid')).toBeVisible();
  await expect(page.locator('.roadmap-module')).not.toHaveCount(0);
  const plan = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!).profiles.ba,
    storageKey,
  );
  expect(plan).toEqual({
    trackId: 'ba',
    currentLevel: 'junior',
    targetLevel: 'mid',
    dailyMinutes: 45,
  });

  await page.getByRole('link', { name: 'Edit my plan' }).click();
  await page.getByRole('radio', { name: /Product Owner/ }).check();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('radio', { name: /Starting from zero/ }).check();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('radio', { name: 'Junior', exact: true }).check();
  await page.getByRole('button', { name: 'Build my roadmap' }).click();
  await expect(page).toHaveURL(/\/en\/roadmap$/);
  const profiles = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!).profiles,
    storageKey,
  );
  expect(profiles.ba).toEqual(plan);
  expect(profiles.po.trackId).toBe('po');
  await page.goto('/en/competencies');
  await expect(page.getByRole('combobox', { name: 'Track', exact: true })).toHaveValue('po');
  await expect(page.getByRole('combobox', { name: 'Level', exact: true })).toHaveValue('junior');
});

test('completes a lesson, bookmarks it, and preserves notes across reload and both locales', async ({
  page,
}) => {
  await page.goto('/en/lessons/stakeholder-mapping');
  await expect(page.getByRole('button', { name: 'Mark as completed' })).toBeEnabled();
  await expect(page.locator('.diagram-canvas svg')).toBeVisible();
  await page.getByRole('button', { name: 'Mark as completed' }).click();
  await page.getByRole('button', { name: 'Bookmark', exact: true }).click();
  await page.locator('.personal-notes summary').click();
  await page
    .getByLabel('What did you learn? What will you try?')
    .fill('Ask front-line staff who is affected before agreeing the scope.');
  await page.getByRole('button', { name: 'Save note', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Saved' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Completed — undo' })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Bookmark', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.locator('.personal-notes summary').click();
  await expect(page.getByLabel('What did you learn? What will you try?')).toHaveValue(
    'Ask front-line staff who is affected before agreeing the scope.',
  );
  await page.goto('/az/lessons/stakeholder-mapping');
  await expect(page).toHaveURL(/\/az\/lessons\/stakeholder-mapping$/);
  await expect(page.getByRole('button', { name: 'Tamamlandı — geri al' })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Əlfəcin', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), storageKey);
  expect(saved.completedLessons['stakeholder-mapping']).toBeTruthy();
  expect(saved.bookmarks).toContain('stakeholder-mapping');
  expect(saved.notes['stakeholder-mapping']).toContain('front-line staff');
});

test('searches lesson and glossary content and filters complete lessons', async ({ page }) => {
  await page.goto('/en/lessons');
  await page.getByRole('combobox', { name: 'Track', exact: true }).selectOption('ba');
  await page.getByRole('combobox', { name: 'Content', exact: true }).selectOption('published');
  await expect(page.locator('.library-lesson-card')).toHaveCount(
    lessonData.filter(
      (lesson) =>
        lesson.trackId === 'ba' &&
        lesson.status === 'published' &&
        (!('placement' in lesson) || lesson.placement !== 'library'),
    ).length,
  );
  await page.getByRole('searchbox').fill('stakeholder mapping');
  await expect(
    page.locator('.library-lesson-card').filter({ hasText: 'Stakeholder mapping' }),
  ).toHaveCount(1);
  await page.getByRole('searchbox').fill('stakeholder');
  await expect(page.getByRole('heading', { name: 'Related glossary terms' })).toBeVisible();
  await page.goto('/en/glossary');
  await page.getByRole('searchbox', { name: 'Search glossary' }).fill('Product Goal');
  await expect(page.locator('.glossary-entry')).not.toHaveCount(0);
  await expect(page.locator('.glossary-entry').first()).toContainText('Product Goal');
  await page.getByRole('searchbox').fill('no-such-concept-79342');
  await expect(page.getByRole('heading', { name: 'No terms found' })).toBeVisible();
});

test('practices a quiz with feedback, flags and pauses it, then persists the attempt', async ({
  page,
}) => {
  await page.goto('/en/practice');
  await page.getByRole('combobox', { name: 'Learning track', exact: true }).selectOption('ba');
  await page.getByRole('combobox', { name: /^Questions/ }).selectOption('5');
  await page.getByRole('button', { name: 'Start practicing' }).click();
  await expect(page.getByRole('button', { name: 'Flag for review' })).toBeVisible();
  await page.getByRole('button', { name: 'Flag for review' }).click();
  await expect(
    page.getByRole('button', { name: 'Flagged for review', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Session paused' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Session paused' })).toBeVisible();
  await page.getByRole('button', { name: 'Resume session', exact: true }).first().click();
  const radios = page.locator('input[name^="answer-"][type="radio"]');
  const checkboxes = page.locator('input[name^="answer-"][type="checkbox"]');
  if (await radios.count()) {
    await radios.first().check();
  } else if (await checkboxes.count()) {
    await checkboxes.first().check();
  } else if (await page.getByRole('button', { name: /^Move down:/ }).count()) {
    await page
      .getByRole('button', { name: /^Move down:/ })
      .first()
      .click();
  } else {
    const matches = page.locator('fieldset select');
    for (let index = 0; index < (await matches.count()); index++) {
      const select = matches.nth(index);
      const option = await select
        .locator('option:not([disabled])')
        .evaluateAll((items) =>
          items.map((item) => (item as HTMLOptionElement).value).find(Boolean),
        );
      await select.selectOption(option!);
    }
  }
  await page.getByRole('button', { name: 'Check answer', exact: true }).click();
  await expect(page.getByText(/Correct\.|Incorrect\./)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Explore the related lesson' })).toBeVisible();
  await page.getByRole('button', { name: 'Finish session', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Practice results' })).toBeVisible();
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), storageKey);
  expect(saved.attempts).toHaveLength(1);
  expect(saved.attempts[0].questionIds).toHaveLength(5);
  expect(saved.attempts[0].answers).not.toEqual({});
  expect(saved.sessions.quiz).toBeUndefined();
  await page.reload();
  await expect(page.getByRole('button', { name: 'View result', exact: true })).toHaveCount(1);
});

test('rejects malformed progress imports without overwriting current progress', async ({
  page,
}) => {
  await page.goto('/en/settings');
  await expect(page.getByRole('button', { name: 'Import JSON' })).toBeEnabled();
  await expect(page.getByRole('link', { name: 'Azərbaycanca', exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'English', exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Progress backup' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Translate', exact: true })).toBeVisible();
  const before = await page.evaluate((key) => localStorage.getItem(key), storageKey);
  await page.locator('input[type="file"]').setInputFiles({
    name: 'bad-progress.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{broken-json'),
  });
  await expect(page.getByRole('status')).toContainText('not a valid Level Up progress file');
  const after = await page.evaluate((key) => localStorage.getItem(key), storageKey);
  expect(after).toBe(before);
});

test('shows verified IIBA facts and keeps undersized or unverified mocks unavailable', async ({
  page,
}) => {
  await page.goto('/en/practice');
  await page.getByRole('combobox', { name: 'Learning track', exact: true }).selectOption('ecba');
  await page.getByText('Exam sources and configuration notes', { exact: true }).click();
  await expect(
    page.getByText('Verified against official sources · 2026-10-20', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('50', { exact: true })).toBeVisible();
  await expect(page.getByText('75 minutes', { exact: true })).toBeVisible();
  await page.getByRole('radio', { name: /^Timed mock/ }).check();
  const ecbaGate = mockEligibility(
    getExams().find((exam) => exam.id === 'ecba'),
    getQuestions(),
  );
  if (ecbaGate.eligible) {
    await expect(page.getByRole('button', { name: 'Start practicing' })).toBeEnabled();
  } else {
    const reason =
      ecbaGate.reason === 'domain-coverage'
        ? 'More questions are needed in each required domain before a full mock can run.'
        : 'The bank does not yet contain enough unique questions for a full mock. Short practice sessions are available.';
    await expect(page.getByText(reason, { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start practicing' })).toBeDisabled();
  }
  await page.getByRole('combobox', { name: 'Learning track', exact: true }).selectOption('pspo1');
  await expect(
    page.getByText(
      'The official format has not been verified from its source. Practice remains available.',
    ),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start practicing' })).toBeDisabled();
});

test('exports progress and imports it only after confirmation', async ({ page }) => {
  await page.goto('/en/lessons/stakeholder-mapping');
  await page.getByRole('button', { name: 'Mark as completed' }).click();
  await page.goto('/en/settings');
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON' }).click();
  const downloaded = await downloading;
  const exported = await readFile((await downloaded.path())!, 'utf8');
  const backup = JSON.parse(exported);
  expect(backup.completedLessons['stakeholder-mapping']).toBeTruthy();
  await page.evaluate((key) => localStorage.removeItem(key), storageKey);
  await page.reload();
  await page.locator('input[type="file"]').setInputFiles({
    name: 'progress.json',
    mimeType: 'application/json',
    buffer: Buffer.from(exported),
  });
  await expect(page.getByText('Confirm progress replacement')).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBeNull();
  await page.getByRole('button', { name: 'Replace and import' }).click();
  await expect(page.getByRole('status')).toHaveText('Progress imported.');
  const restored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), storageKey);
  expect(restored.completedLessons).toEqual(backup.completedLessons);
});

test('preserves unsupported saved data until the learner explicitly starts fresh', async ({
  page,
}) => {
  const original = '{"version":99,"notes":{"private":"Keep this"}}';
  await page.addInitScript(
    ({ key, raw }) => {
      if (!sessionStorage.getItem('recovery-seeded')) {
        localStorage.setItem(key, raw);
        sessionStorage.setItem('recovery-seeded', 'yes');
      }
    },
    { key: storageKey, raw: original },
  );
  await page.goto('/en/lessons/stakeholder-mapping');
  await page.getByRole('button', { name: 'Mark as completed' }).click();
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBe(original);
  await page.goto('/en/settings');
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download recovery file' }).click();
  expect(await readFile((await (await downloading).path())!, 'utf8')).toBe(original);
  await page.getByRole('button', { name: 'Start fresh', exact: true }).click();
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBe(original);
  await page.getByRole('button', { name: 'Replace and import' }).click();
  await expect(page.getByRole('status')).toHaveText('Progress imported.');
  const fresh = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), storageKey);
  expect(fresh.version).toBe(1);
  expect(fresh.completedLessons).toEqual({});
});

test('keeps the mobile layout within the viewport and supports keyboard navigation', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openDashboard(page);
  await page.evaluate(() => document.fonts.ready);
  const width = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(width.document).toBeLessThanOrEqual(width.viewport);
  await page.screenshot({ path: '/tmp/level-up-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Open navigation', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.merhele-nav')).toHaveClass(/is-open/);
  const roadmap = page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'My roadmap' });
  await roadmap.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/en\/roadmap$/);
  await expect(page.locator('.merhele-nav')).not.toHaveClass(/is-open/);
  await page.getByRole('button', { name: 'Toggle color theme' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/dark/);
});

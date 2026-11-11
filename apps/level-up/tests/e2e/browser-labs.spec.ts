import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { getQuestions } from '../../lib/assessments';
import lessons from '../../data/lessons.json' with { type: 'json' };

test('independent lessons remain searchable and preserve notes without entering a BA path or its practice bank', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const key = 'level-up.progress.v1';
    if (!localStorage.getItem(key))
      localStorage.setItem(
        key,
        JSON.stringify({
          version: 1,
          activeTrack: 'ba',
          profiles: {
            ba: { trackId: 'ba', currentLevel: 'zero', targetLevel: 'lead', dailyMinutes: 30 },
          },
          completedLessons: {
            'devops-docker-containers': '2026-10-23T10:00:00Z',
            'stakeholder-mapping': '2026-10-23T10:00:00Z',
          },
          notes: { 'sql-basics': 'Keep this SQL note' },
          bookmarks: ['sql-basics'],
          assessedSkills: [],
          attempts: [],
          reviews: [],
          activity: [],
          sessions: {},
        }),
      );
  });
  await page.goto('/en/roadmap');
  await expect(
    page.getByText('Business Analyst · Starting from zero → Lead / Senior'),
  ).toBeVisible();
  const timeline = page.locator('.roadmap-timeline');
  await expect(timeline).not.toContainText('Docker images');
  await expect(timeline).not.toContainText('SQL for business questions');
  await expect(timeline).not.toContainText('JWT validation');
  await page.goto('/en/lessons?track=library');
  await expect(page.locator('.library-lesson-card')).toHaveCount(
    lessons.filter((lesson) => 'placement' in lesson && lesson.placement === 'library').length,
  );
  await page.getByRole('searchbox').fill('SQL for business questions');
  await page.getByRole('link', { name: 'SQL for business questions', exact: true }).click();
  await page.getByText('My personal notes', { exact: true }).click();
  await expect(page.getByLabel('What did you learn? What will you try?')).toHaveValue(
    'Keep this SQL note',
  );
  await page.goto('/en/practice?track=ba');
  await page.getByRole('button', { name: 'Start practicing', exact: true }).click();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('level-up.progress.v1')!),
  );
  const independent = new Set(
    lessons
      .filter((lesson) => 'placement' in lesson && lesson.placement === 'library')
      .map((lesson) => lesson.id),
  );
  const questions = new Map(getQuestions().map((question) => [question.id, question]));
  expect(saved.sessions.quiz.questionIds.length).toBeGreaterThan(0);
  expect(
    saved.sessions.quiz.questionIds.every(
      (id: string) => !independent.has(questions.get(id)!.lessonId),
    ),
  ).toBe(true);
  expect(saved.completedLessons['devops-docker-containers']).toBeTruthy();
  expect(saved.bookmarks).toContain('sql-basics');
});

test('SQL lab runs real queries, checks results, blocks writes and recovers after a bounded timeout', async ({
  page,
}) => {
  await page.goto('/en/lessons/sql-basics#practice-lab');
  const lab = page.getByRole('region', { name: 'SQL lab', exact: true });
  await expect(lab).toBeVisible();
  await lab.getByRole('button', { name: 'Run SQL', exact: true }).click();
  await expect(lab.getByRole('region', { name: 'SQL results' })).toContainText('21500');
  await lab.getByRole('button', { name: 'Check SQL result' }).click();
  await expect(lab.getByRole('status').last()).toContainText('Not yet.');
  await lab
    .getByRole('textbox', { name: 'SQL query' })
    .fill("SELECT SUM(amount_cents) AS paid_revenue_cents FROM orders WHERE status='paid'");
  await lab.getByRole('button', { name: 'Run SQL', exact: true }).click();
  await expect(lab.getByRole('region', { name: 'SQL results' })).toContainText('16500');
  await lab.getByRole('button', { name: 'Check SQL result' }).click();
  await expect(lab.getByRole('status').last()).toHaveText('Correct result for this dataset.');
  await lab.getByRole('textbox', { name: 'SQL query' }).fill('DELETE FROM orders');
  await lab.getByRole('button', { name: 'Run SQL', exact: true }).click();
  await expect(lab.getByRole('alert')).toContainText('read-only');
  await lab
    .getByRole('textbox', { name: 'SQL query' })
    .fill('WITH RECURSIVE n(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM n) SELECT SUM(x) FROM n');
  await lab.getByRole('button', { name: 'Run SQL', exact: true }).click();
  await expect(lab.getByRole('alert')).toContainText('stopped after 3 seconds');
  await lab.getByRole('button', { name: 'Reset query' }).click();
  await lab.getByRole('combobox', { name: 'SQL exercise' }).selectOption('all-customers');
  await lab
    .getByRole('textbox', { name: 'SQL query' })
    .fill(
      "SELECT c.customer_id, COUNT(o.order_id) AS paid_orders FROM customers c LEFT JOIN orders o ON o.customer_id=c.customer_id AND o.status='paid' GROUP BY c.customer_id",
    );
  await lab.getByRole('button', { name: 'Run SQL', exact: true }).click();
  await expect(lab.getByRole('region', { name: 'SQL results' })).toContainText('u5');
  await lab.getByRole('button', { name: 'Check SQL result' }).click();
  await expect(lab.getByRole('status').last()).toHaveText('Correct result for this dataset.');
});

test('API lab sends requests, shows validation and version responses, and isolates idempotent state', async ({
  page,
  context,
}) => {
  await page.goto('/en/lessons/rest-apis#practice-lab');
  const lab = page.getByRole('region', { name: 'API lab', exact: true });
  await lab.getByRole('button', { name: 'Send request' }).click();
  await expect(lab.getByRole('status')).toHaveText('401 Unauthorized');
  await lab
    .getByRole('textbox', { name: 'Request headers (JSON)' })
    .fill('{"Authorization":"Bearer demo-alice"}');
  await lab.getByRole('button', { name: 'Send request' }).click();
  await expect(lab.getByRole('status')).toHaveText('200 OK');
  await lab.getByRole('button', { name: 'Check API result' }).click();
  await expect(lab.getByRole('status').last()).toHaveText('Correct sandbox result.');
  await lab.getByRole('combobox', { name: 'API exercise' }).selectOption('validation');
  await lab.getByRole('button', { name: 'Send request' }).click();
  await expect(lab.getByRole('status')).toHaveText('422 Unprocessable Content');
  await lab
    .getByRole('textbox', { name: 'Request body (JSON)' })
    .fill('{"sku":"COURSE","quantity":2}');
  await lab.getByRole('button', { name: 'Send request' }).click();
  await expect(lab.getByRole('status')).toHaveText('201 Created');
  await lab.getByRole('button', { name: 'Check API result' }).click();
  await expect(lab.getByRole('status').last()).toHaveText('Correct sandbox result.');
  await lab.getByRole('combobox', { name: 'API exercise' }).selectOption('idempotency');
  await lab.getByRole('button', { name: 'Send request' }).click();
  await expect(lab.getByRole('status')).toHaveText('201 Created');
  await lab.getByRole('button', { name: 'Send request' }).click();
  await expect(lab.getByLabel('Response headers')).toContainText('Idempotency-Replayed');
  await lab.getByRole('button', { name: 'Check API result' }).click();
  await expect(lab.getByRole('status').last()).toHaveText('Correct sandbox result.');
  await lab
    .getByRole('textbox', { name: 'Request body (JSON)' })
    .fill('{"sku":"BOOK","quantity":3}');
  await lab.getByRole('button', { name: 'Send request' }).click();
  await expect(lab.getByRole('status')).toHaveText('409 Conflict');
  const second = await context.newPage();
  await second.goto('/en/lessons/rest-apis#practice-lab');
  await expect(second.getByRole('region', { name: 'API lab' })).toContainText('Demo orders: 2');
  await second.close();
  await lab.getByRole('combobox', { name: 'API exercise' }).selectOption('version');
  await lab.getByRole('button', { name: 'Send request' }).click();
  await expect(lab.getByRole('status')).toHaveText('412 Precondition Failed');
  await lab.getByRole('textbox', { name: 'Request headers (JSON)' }).fill(
    JSON.stringify({
      Authorization: 'Bearer demo-alice',
      'Content-Type': 'application/json',
      'If-Match': '"v1"',
    }),
  );
  await lab.getByRole('button', { name: 'Send request' }).click();
  await expect(lab.getByRole('status')).toHaveText('200 OK');
  await lab.getByRole('button', { name: 'Check API result' }).click();
  await expect(lab.getByRole('status').last()).toHaveText('Correct sandbox result.');
});

test('both labs are usable with a keyboard on mobile in light and dark themes', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [id, name] of [
    ['sql-basics', 'SQL lab'],
    ['rest-apis', 'API lab'],
  ] as const) {
    await page.goto(`/en/lessons/${id}#practice-lab`);
    await expect(page.getByRole('region', { name, exact: true })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    if (name === 'SQL lab') {
      await page.getByRole('textbox', { name: 'SQL query' }).focus();
      await page.keyboard.press('Tab');
      await expect(page.getByRole('button', { name: 'Run SQL', exact: true })).toBeFocused();
    } else {
      await page.getByRole('textbox', { name: 'Request path' }).focus();
      await page.keyboard.press('Tab');
      await expect(page.getByRole('textbox', { name: 'Request headers (JSON)' })).toBeFocused();
    }
    for (const dark of [false, true]) {
      await page.evaluate(
        (value) => document.documentElement.classList.toggle('dark', value),
        dark,
      );
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        390,
      );
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(
        result.violations.map((item) => ({
          id: item.id,
          nodes: item.nodes.map((node) => node.target),
        })),
      ).toEqual([]);
    }
  }
});

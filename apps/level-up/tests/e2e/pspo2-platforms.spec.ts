import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import assessmentData from '../../data/external-assessments.json' with { type: 'json' };
import questionData from '../../data/questions/pspo2-platforms.json' with { type: 'json' };

for (const trackId of ['pspo1', 'pspo2'] as const) {
  for (const locale of ['az', 'en'] as const) {
    test(`${locale}: ${trackId} providers show access limits and usable lesson links on mobile`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`/${locale}/practice?track=${trackId}`);
      await page
        .getByText(
          locale === 'az'
            ? 'Əlavə sayt keçidləri və giriş qeydləri'
            : 'Supplementary website links and access notes',
          { exact: true },
        )
        .click();
      const section = page.locator('.external-assessments');
      const items = assessmentData.filter((item) => item.trackId === trackId);
      await expect(section.locator('article')).toHaveCount(trackId === 'pspo1' ? 5 : 4);
      await expect(section.getByRole('heading', { level: 2 })).toContainText(
        trackId === 'pspo1' ? 'PSPO I ' : 'PSPO II ',
      );
      for (const assessment of items) {
        const card = section.getByRole('article').filter({
          has: page.getByRole('heading', { name: assessment.name, exact: true }),
        });
        await expect(card).toContainText(assessment.offer[locale]);
        await expect(card).toContainText(assessment.access[locale]);
        await expect(card.locator('a[target="_blank"]').first()).toHaveAttribute(
          'href',
          assessment.url,
        );
        await card.locator('summary').click();
        for (const id of assessment.lessonIds)
          await expect(card.locator(`a[href="/${locale}/lessons/${id}"]`)).toBeVisible();
      }
      if (trackId === 'pspo2')
        await expect(
          section.getByRole('link', {
            name: locale === 'az' ? 'Vaxtlı sınağı aç ↗' : 'Open timed mock ↗',
          }),
        ).toHaveAttribute('href', /kwestio.*mock-exam$/);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        390,
      );
      const accessibility = await new AxeBuilder({ page })
        .include('.external-assessments')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(accessibility.violations.map((violation) => violation.id)).toEqual([]);
      await page.screenshot({ path: `/tmp/${trackId}-platforms-${locale}.png`, fullPage: true });
      await page
        .getByRole('combobox', {
          name: locale === 'az' ? 'Öyrənmə istiqaməti' : 'Learning track',
          exact: true,
        })
        .selectOption('pspo3');
      await expect(section).toHaveCount(0);
      await expect(page.getByRole('link', { name: 'Product Owner Open ↗' })).toBeVisible();
    });
  }
}

test('new lessons render diagrams and original practice saves answers, results and existing progress', async ({
  page,
}) => {
  const newIds = [...new Set(questionData.map((question) => question.lessonId))].filter(
    (id) => id !== 'pspo2-shared-quality',
  );
  for (const locale of ['en', 'az'] as const) {
    for (const id of newIds) {
      await page.goto(`/${locale}/lessons/${id}`);
      await expect(page.locator('.diagram-canvas svg')).toBeVisible();
      await expect(page.locator('.knowledge-question')).toHaveCount(4);
    }
  }
  await page.goto('/en/lessons/pspo2-backlog-economics');
  await page.getByRole('button', { name: 'Mark as completed', exact: true }).click();
  const question = page.locator('.knowledge-question').first();
  const first = questionData.find((item) => item.lessonId === 'pspo2-backlog-economics')!;
  await question
    .getByRole('radio', {
      name: first.options.find((option) => option.id === first.correct[0])!.text.en,
      exact: true,
    })
    .check();
  await question.getByRole('button', { name: 'Check answer', exact: true }).click();
  await expect(question.getByRole('status')).toContainText('Correct.');
  await page.getByRole('link', { name: 'Practice this lesson', exact: true }).click();
  await page.getByRole('button', { name: 'Start practicing', exact: true }).click();
  for (let index = 0; index < 5; index++) {
    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('level-up.progress.v1')!),
    );
    const current = questionData.find(
      (item) => item.id === saved.sessions.quiz.questionIds[index],
    )!;
    for (const correct of current.correct) {
      const name = current.options.find((option) => option.id === correct)!.text.en;
      await page
        .getByRole(current.type === 'multiple' ? 'checkbox' : 'radio', { name, exact: true })
        .check();
    }
    await page.getByRole('button', { name: 'Check answer', exact: true }).click();
    await expect(page.locator('.quiz-session-question')).toContainText('Correct.');
    await page
      .getByRole('button', { name: index === 4 ? 'See my results' : 'Next question', exact: true })
      .click();
  }
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('level-up.progress.v1')!),
  );
  expect(saved.completedLessons['pspo2-backlog-economics']).toBeTruthy();
  expect(saved.attempts.at(-1).score).toBe(5);
  expect(saved.attempts.at(-1).total).toBe(5);
  expect(saved.sessions.quiz).toBeUndefined();
});

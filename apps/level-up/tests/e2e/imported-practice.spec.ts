import { expect, test } from '@playwright/test';
import { getImportedQuestions } from '../../lib/assessments';
import practiceSets from '../../data/practice-sets.json' with { type: 'json' };

const imported = getImportedQuestions();

for (const locale of ['en', 'az'] as const) {
  test(`${locale}: imported study opens locally, grades a source answer and keeps the original bank separate`, async ({
    page,
  }) => {
    const set = practiceSets.find(
      (item) => item.id === (locale === 'en' ? 'kwestio-pspo1' : 'examdeck-pspo2'),
    )!;
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${locale}/practice?track=${set.trackId}`);
    const collection = page.locator('.native-practice-sets');
    await expect(collection.getByRole('article')).toHaveCount(2);
    const card = collection
      .getByRole('article')
      .filter({ has: page.getByRole('heading', { name: set.title[locale], exact: true }) });
    await card
      .getByRole('button', {
        name: locale === 'en' ? /^Study with explanations/ : /^İzahlarla öyrən/,
      })
      .click();
    const getSession = () =>
      page.evaluate(() => JSON.parse(localStorage.getItem('level-up.progress.v1')!).sessions.quiz);
    const session = await getSession();
    expect(session.practiceSetId).toBe(set.id);
    expect(session.feedbackMode).toBe('immediate');
    expect(session.questionIds).toHaveLength(set.questionIds.length);
    expect(
      session.questionIds.every((id: string) =>
        imported.some((q) => q.id === id && q.providerId === set.providerId),
      ),
    ).toBe(true);
    const q = imported.find((item) => item.id === session.questionIds[0])!;
    for (const correct of q.correct)
      await page
        .getByRole(q.type === 'multiple' ? 'checkbox' : 'radio', {
          name: q.options.find((o) => o.id === correct)!.text[locale],
          exact: true,
        })
        .check();
    await page
      .getByRole('button', { name: locale === 'en' ? 'Check answer' : 'Cavabı yoxla', exact: true })
      .click();
    await expect(page.locator('.quiz-session-question')).toContainText(q.explanation[locale]);
    await expect(page.locator('.quiz-session-question')).toContainText(q.sourceQuestionId!);
    await page.reload();
    expect((await getSession()).practiceSetId).toBe(set.id);
    await expect(page.locator('.quiz-session-question')).toContainText(q.explanation[locale]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      390,
    );
    await page
      .getByRole('button', {
        name: locale === 'en' ? 'Discard session' : 'Məşqi ləğv et',
        exact: true,
      })
      .click();
    await page
      .getByRole('button', {
        name: locale === 'en' ? 'Start practicing' : 'Məşqə başla',
        exact: true,
      })
      .click();
    const ownSession = await getSession();
    expect(ownSession.practiceSetId).toBeUndefined();
    expect(ownSession.questionIds.every((id: string) => !imported.some((q) => q.id === id))).toBe(
      true,
    );
  });

  test(`${locale}: provider test defers explanations, survives reload and saves the provider result`, async ({
    page,
  }) => {
    const set = practiceSets.find((item) => item.id === 'mplaza-pspo1')!;
    await page.goto(`/${locale}/practice?track=pspo1`);
    const card = page
      .locator('.native-practice-sets article')
      .filter({ has: page.getByRole('heading', { name: set.title[locale], exact: true }) });
    await card
      .getByRole('button', { name: locale === 'en' ? /^Start test/ : /^Sınağa başla/ })
      .click();
    for (let index = 0; index < set.testQuestionCount; index++) {
      if (index === 2) await page.reload();
      const session = await page.evaluate(
        () => JSON.parse(localStorage.getItem('level-up.progress.v1')!).sessions.quiz,
      );
      expect(session.practiceSetId).toBe(set.id);
      expect(session.feedbackMode).toBe('after-submit');
      const q = imported.find((item) => item.id === session.questionIds[index])!;
      await expect(
        page.getByRole('button', {
          name: locale === 'en' ? 'Check answer' : 'Cavabı yoxla',
          exact: true,
        }),
      ).toHaveCount(0);
      await expect(page.getByRole('timer')).toBeVisible();
      for (const id of q.correct)
        await page
          .getByRole(q.type === 'multiple' ? 'checkbox' : 'radio', {
            name: q.options.find((o) => o.id === id)!.text[locale],
            exact: true,
          })
          .check();
      await page
        .getByRole('button', {
          name:
            index + 1 === set.testQuestionCount
              ? locale === 'en'
                ? 'See my results'
                : 'Nəticəni göstər'
              : locale === 'en'
                ? 'Next question'
                : 'Növbəti',
          exact: true,
        })
        .click();
    }
    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('level-up.progress.v1')!),
    );
    const result = saved.attempts.at(-1);
    expect(result.practiceSetId).toBe(set.id);
    expect(result.score).toBe(12);
    expect(result.total).toBe(12);
    expect(saved.sessions.quiz).toBeUndefined();
    await expect(page.getByText('100%', { exact: true })).toBeVisible();
    await page.reload();
    const reloaded = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('level-up.progress.v1')!),
    );
    expect(reloaded.attempts.at(-1).practiceSetId).toBe(set.id);
    await expect(page.locator('#attempt-history')).toContainText(set.title[locale]);
    await page.screenshot({ path: `/tmp/imported-practice-${locale}.png`, fullPage: true });
  });
}

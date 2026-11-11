import test from 'node:test';
import assert from 'node:assert/strict';
import { generateStory, validateStoryStore, storyMarkdown, storyHTML } from '../public/stories.js';

test('a title produces editable Azure DevOps fields and a subject-specific estimate', () => {
  const exportStory = generateStory({ title: 'Müştəri siyahısının Excel ixracı', context: 'Yalnız aktiv müştərilər daxil olsun.', role: 'analitik' });
  const apiStory = generateStory({ title: 'Ödəniş API inteqrasiyası' });
  assert.equal(exportStory.category, 'Hesabat və ixrac');
  assert.match(exportStory.description, /analitik/);
  assert.match(exportStory.description, /Yalnız aktiv/);
  assert.match(exportStory.acceptance, /Azərbaycan hərfləri/);
  assert.equal(apiStory.points, 5);
  assert.match(apiStory.acceptance, /Timeout/);
  assert.match(storyMarkdown(exportStory), /## Acceptance Criteria/);
  assert.match(storyHTML(exportStory), /<h3>Description/);
  assert.equal(validateStoryStore({ version: 1, draft: exportStory, stories: [exportStory] }).stories.length, 1);
});

test('bug drafts ask for actual behavior and copied rich text escapes user HTML', () => {
  const bug = generateStory({ title: '<script>alert(1)</script> xətası', type: 'Bug' });
  assert.match(bug.description, /Faktiki davranış/);
  assert(!storyHTML(bug).includes('<script>'));
  assert.throws(() => generateStory({ title: 'x' }));
  assert.throws(() => validateStoryStore({ version: 1, stories: [{ ...bug, points: 100 }] }));
});

test('API detection requires a complete word rather than matching inside a business term', () => {
  assert.equal(generateStory({ title: 'Kapital hesabatının hazırlanması' }).category, 'Hesabat və ixrac');
});

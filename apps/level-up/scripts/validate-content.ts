import fs from 'node:fs';
import path from 'node:path';
import { serialize } from 'next-mdx-remote/serialize';
import remarkGfm from 'remark-gfm';
import { competencies, glossary, lessons, modules } from '../lib/catalog';
import { getExams, getQuestions, getImportedQuestions } from '../lib/assessments';
import { contentRoot, frontmatterSchema, walkFiles, parseMdxSource } from '../lib/content';
import { scrumCompetencies } from '../lib/study-guide';
import { sources } from '../lib/sources';
import { tracks } from '../lib/tracks';
import { externalAssessments } from '../lib/external-assessments';
import { practiceSets, selectPracticeSetQuestions } from '../lib/practice-sets';

async function validate() {
  const errors: string[] = [];
  const check = (condition: unknown, message: string) => {
    if (!condition) errors.push(message);
  };
  const unique = (items: { id: string }[], label: string) =>
    check(new Set(items.map((item) => item.id)).size === items.length, `${label}: duplicate id`);
  unique(sources, 'Sources');
  const sourceIds = new Set(sources.filter((s) => s.status === 'read').map((s) => s.id));
  unique(lessons, 'Lessons');
  unique(modules, 'Modules');
  unique(competencies, 'Competencies');
  unique(glossary, 'Glossary');
  const lessonIds = new Set(lessons.map((l) => l.id));
  unique(externalAssessments, 'External assessments');
  for (const assessment of externalAssessments) {
    check(
      sources.some((s) => s.id === assessment.sourceId),
      `${assessment.id}: source missing`,
    );
    for (const id of assessment.lessonIds)
      check(
        lessons.some((lesson) => lesson.id === id && lesson.status === 'published'),
        `${assessment.id}: related lesson ${id} is not complete`,
      );
  }
  check(
    scrumCompetencies.length === 5,
    'Professional Scrum framework requires five competency groups',
  );
  const focusAreas = scrumCompetencies.flatMap((group) => group.areas);
  unique(focusAreas, 'Scrum focus areas');
  check(focusAreas.length === 28, 'Professional Scrum framework requires 28 focus areas');
  for (const area of focusAreas)
    for (const id of area.lessonIds)
      check(lessonIds.has(id), `${area.id}: unknown study guide lesson ${id}`);
  const moduleIds = new Set(modules.map((m) => m.id));
  const fileKeys = new Set<string>();
  for (const lesson of lessons) {
    for (const id of lesson.sourceIds)
      check(sourceIds.has(id), `${lesson.id}: source not read or missing: ${id}`);
    check(moduleIds.has(lesson.moduleId), `${lesson.id}: missing module`);
    check(
      modules.find((m) => m.id === lesson.moduleId)?.lessonIds.includes(lesson.id),
      `${lesson.id}: module does not list lesson`,
    );
    check(
      modules.find((m) => m.id === lesson.moduleId)?.trackId === lesson.trackId,
      `${lesson.id}: module track mismatch`,
    );
    check(
      (modules.find((m) => m.id === lesson.moduleId)?.placement === 'library') ===
        (lesson.placement === 'library'),
      `${lesson.id}: lesson/module placement mismatch`,
    );
    if (lesson.placement !== 'library')
      for (const id of lesson.prerequisites)
        check(
          lessons.find((l) => l.id === id)?.placement !== 'library',
          `${lesson.id}: learning path requires independent lesson ${id}`,
        );
    for (const id of lesson.prerequisites)
      check(lessonIds.has(id), `${lesson.id}: unknown prerequisite ${id}`);
  }
  for (const learningModule of modules) {
    check(
      new Set(learningModule.lessonIds).size === learningModule.lessonIds.length,
      `${learningModule.id}: repeated lesson`,
    );
    for (const id of learningModule.lessonIds)
      check(lessonIds.has(id), `${learningModule.id}: unknown lesson ${id}`);
    for (const id of learningModule.prerequisites)
      check(moduleIds.has(id), `${learningModule.id}: unknown prerequisite ${id}`);
    if (learningModule.placement !== 'library')
      for (const id of learningModule.prerequisites)
        check(
          modules.find((module) => module.id === id)?.placement !== 'library',
          `${learningModule.id}: learning path depends on independent collection ${id}`,
        );
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  function visit(id: string) {
    if (visiting.has(id)) {
      errors.push(`Module prerequisite cycle: ${id}`);
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const key of modules.find((m) => m.id === id)?.prerequisites ?? []) visit(key);
    visiting.delete(id);
    visited.add(id);
  }
  modules.forEach((m) => visit(m.id));
  const files = walkFiles(contentRoot);
  for (const file of files) {
    try {
      const parsed = parseMdxSource(fs.readFileSync(file, 'utf8'));
      const meta = frontmatterSchema.parse(parsed.data);
      const key = `${meta.id}.${meta.locale}`;
      check(!fileKeys.has(key), `Duplicate content ${key}`);
      fileKeys.add(key);
      check(lessonIds.has(meta.id), `${file}: unknown lesson id`);
      check(path.basename(file) === `${key}.mdx`, `${file}: filename/frontmatter mismatch`);
      const lesson = lessons.find((l) => l.id === meta.id);
      check(meta.title === lesson?.title[meta.locale], `${key}: title differs from catalog`);
      await serialize(parsed.content, {
        blockJS: false,
        blockDangerousJS: true,
        mdxOptions: { remarkPlugins: [remarkGfm] },
      });
      if (lesson?.status === 'published') {
        check(
          (parsed.content.match(/^## /gm)?.length ?? 0) >= 10,
          `${key}: complete lesson needs template sections`,
        );
        check(parsed.content.includes('<Diagram'), `${key}: complete lesson needs diagram`);
        check(/https:\/\//.test(parsed.content), `${key}: complete lesson needs sources`);
      }
    } catch (error) {
      errors.push(`${file}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  for (const lesson of lessons)
    for (const locale of ['az', 'en'])
      check(fileKeys.has(`${lesson.id}.${locale}`), `Missing translation ${lesson.id}.${locale}`);
  for (const term of glossary)
    check(lessonIds.has(term.relatedLessonId), `${term.id}: glossary lesson missing`);
  const skillIds = competencies.flatMap((c) => c.checklist.map((s) => s.id));
  check(new Set(skillIds).size === skillIds.length, 'Skill IDs must be globally unique');
  const questions = getQuestions();
  const imported = getImportedQuestions();
  unique([...questions, ...imported], 'All question IDs');
  unique(practiceSets, 'Provider practice sets');
  const packedIds = new Set(practiceSets.flatMap((set) => set.questionIds));
  for (const set of practiceSets) selectPracticeSetQuestions(set, imported);
  for (const q of imported) {
    check(q.providerId && q.sourceQuestionId, `${q.id}: imported question lacks provenance`);
    check(packedIds.has(q.id), `${q.id}: imported question has no provider set`);
    check(q.sourceIds.includes(q.providerId!), `${q.id}: provider attribution missing`);
    check(q.text.az !== q.text.en, `${q.id}: imported question untranslated`);
    check(q.explanation.az !== q.explanation.en, `${q.id}: imported explanation untranslated`);
  }
  const exams = getExams();
  unique(questions, 'Questions');
  unique(exams, 'Exam configs');
  for (const track of tracks.filter((t) => t.category === 'certification')) {
    check(
      questions.filter((q) => q.trackId === track.id).length >= 30,
      `${track.id}: requires 30 original practice questions`,
    );
    check(
      exams.some((e) => e.id === track.id),
      `${track.id}: missing exam config`,
    );
  }
  for (const exam of exams) {
    if (exam.verificationStatus === 'verified')
      check(
        exam.verifiedAt &&
          exam.sources.length &&
          exam.format &&
          exam.questionCount &&
          exam.durationMinutes,
        `${exam.id}: verified config lacks provenance or rules`,
      );
    const weights = exam.domains.map((d) => d.weight);
    if (weights.every((w) => w !== undefined))
      check(
        Math.abs(weights.reduce((a, b) => a + b, 0) - 100) < 0.01,
        `${exam.id}: domain weights must total 100`,
      );
  }
  for (const q of [...questions, ...imported]) {
    check(q.text.az !== q.text.en, `${q.id}: Azerbaijani question duplicates English`);
    check(
      q.explanation.az !== q.explanation.en,
      `${q.id}: Azerbaijani explanation duplicates English`,
    );
    for (const id of q.sourceIds)
      check(sourceIds.has(id), `${q.id}: source not read or missing: ${id}`);
    if (q.sourceIds.length)
      check(
        lessons.find((l) => l.id === q.lessonId)?.status === 'published',
        `${q.id}: source-backed practice must link to a complete lesson`,
      );
    check(lessonIds.has(q.lessonId), `${q.id}: linked lesson missing`);
    check(
      new Set(q.options.map((o) => o.id)).size === q.options.length,
      `${q.id}: repeated option ids`,
    );
    if (q.type === 'written') {
      check(
        q.correct.length === 0 && q.options.length === 0,
        `${q.id}: written answer must be ungraded`,
      );
      check((q.rubric?.length ?? 0) > 0, `${q.id}: written response needs rubric`);
    } else {
      check(
        q.correct.length > 0 && q.correct.every((id) => q.options.some((o) => o.id === id)),
        `${q.id}: invalid answer key`,
      );
      if (q.type === 'single')
        check(q.correct.length === 1, `${q.id}: single choice requires one correct answer`);
      if (q.type === 'ordering')
        check(q.correct.length === q.options.length, `${q.id}: ordering must use all items`);
      if (q.type === 'matching')
        check(
          q.prompts?.length === q.correct.length,
          `${q.id}: matching requires one answer per prompt`,
        );
    }
    const exam = exams.find((e) => e.id === q.trackId);
    if (exam)
      check(
        exam.domains.some((d) => d.id === q.domain),
        `${q.id}: domain missing from config`,
      );
  }
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(
    `Validated ${lessons.length} lessons (${lessons.filter((l) => l.status === 'published').length} complete), ${files.length} MDX source files, ${modules.length} modules, ${competencies.length} competency matrices, ${glossary.length} terms, ${questions.length} original questions, ${imported.length} separately attributed imported questions, ${exams.length} exam configs.`,
  );
}
validate().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

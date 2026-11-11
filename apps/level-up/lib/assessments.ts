import fs from 'node:fs';
import path from 'node:path';
import { examSchema, questionSchema } from './types';
function readJsonFiles(folder: string): unknown[] {
  return fs
    .readdirSync(folder)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .flatMap((name) => {
      const result: unknown = JSON.parse(fs.readFileSync(path.join(folder, name), 'utf8'));
      return Array.isArray(result) ? result : [result];
    });
}
export function getExams() {
  return readJsonFiles(path.join(process.cwd(), 'data/exams')).map((value) =>
    examSchema.parse(value),
  );
}
export function getQuestions() {
  return readJsonFiles(path.join(process.cwd(), 'data/questions')).map((value) =>
    questionSchema.parse(value),
  );
}

export function getImportedQuestions() {
  const folder = path.join(process.cwd(), 'data/imported-questions');
  if (!fs.existsSync(folder)) return [];
  return readJsonFiles(folder).map((value) => questionSchema.parse(value));
}

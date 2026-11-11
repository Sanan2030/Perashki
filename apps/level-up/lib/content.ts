import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { z } from 'zod';
import { lessons } from './catalog';
import { localeSchema, type Locale } from './types';
const frontmatterSchema = z.object({
  id: z.string().min(1),
  locale: localeSchema,
  title: z.string().min(1),
  objectives: z.array(z.string()).min(2),
});
export const contentRoot = path.join(process.cwd(), 'content');
export function parseMdxSource(source: string): { data: unknown; content: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(source);
  if (!match) throw new Error('Lesson must begin with YAML frontmatter.');
  return { data: parseYaml(match[1]), content: source.slice(match[0].length) };
}
export function walkFiles(root: string): string[] {
  return fs
    .readdirSync(root, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory()
        ? walkFiles(path.join(root, entry.name))
        : entry.name.endsWith('.mdx')
          ? [path.join(root, entry.name)]
          : [],
    );
}
export function getContent(id: string, locale: Locale) {
  if (!/^[a-z0-9-]+$/.test(id)) return null;
  const lesson = lessons.find((l) => l.id === id);
  if (!lesson) return null;
  const files = walkFiles(contentRoot);
  const requested = files.find((file) => path.basename(file) === `${id}.${locale}.mdx`);
  const file = requested ?? files.find((file) => path.basename(file) === `${id}.en.mdx`);
  if (!file) return null;
  const parsed = parseMdxSource(fs.readFileSync(file, 'utf8'));
  const metadata = frontmatterSchema.parse(parsed.data);
  if (metadata.id !== id) throw new Error(`Mismatched lesson id: ${id}`);
  return { lesson, body: parsed.content, metadata, fallback: !requested, file };
}
export { frontmatterSchema };

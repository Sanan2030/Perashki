import { z } from 'zod';
import entries from '@/data/dictionary.json';

export const dictionaryEntrySchema = z.object({
  id: z.string().min(1),
  term: z.string().min(1),
  aliases: z.array(z.string()),
  context: z.string().min(1),
  meaningAz: z.string().min(1),
  definitionEn: z.string().min(1),
  explanationAz: z.string().min(1),
  example: z.object({ en: z.string().min(1), az: z.string().min(1) }),
});
export type DictionaryEntry = z.infer<typeof dictionaryEntrySchema>;
export const dictionary = z.array(dictionaryEntrySchema).parse(entries);
export const MAX_DICTIONARY_QUERY_LENGTH = 100;

// Lesson selections and copied Markdown may surround a term with emphasis or quotes.
// Strip only balanced outer wrappers; punctuation inside technical names is meaningful.
function unwrapDictionaryTerm(value: string): string {
  let result = value.normalize('NFKC').trim();
  const wrappers = [
    ['**', '**'],
    ['__', '__'],
    ['`', '`'],
    ['*', '*'],
    ['_', '_'],
    ['"', '"'],
    ["'", "'"],
    ['“', '”'],
    ['‘', '’'],
  ];
  for (let depth = 0; depth < 4; depth++) {
    const wrapper = wrappers.find(
      ([start, end]) =>
        result.length > start.length + end.length &&
        result.startsWith(start) &&
        result.endsWith(end),
    );
    if (!wrapper) break;
    result = result.slice(wrapper[0].length, -wrapper[1].length).trim();
  }
  return result;
}

export function normalizeDictionaryTerm(value: string): string {
  return unwrapDictionaryTerm(value)
    .toLocaleLowerCase('en')
    .replace(/[‐‑‒–—_-]/g, ' ')
    .replace(/’/g, "'")
    .replace(/\s*\/\s*/g, '/')
    .replace(/\s+/g, ' ')
    .trim();
}

export function validateDictionaryQuery(
  input: unknown,
): { valid: true; query: string } | { valid: false; message: string } {
  if (typeof input !== 'string') return { valid: false, message: 'Enter a word or short phrase.' };
  if (/[\p{Cc}\p{Cf}]/u.test(input))
    return { valid: false, message: 'Enter a word or short phrase without control characters.' };
  const query = unwrapDictionaryTerm(input).replace(/\s+/g, ' ');
  if (!query || query.length > MAX_DICTIONARY_QUERY_LENGTH)
    return {
      valid: false,
      message: `Enter between 1 and ${MAX_DICTIONARY_QUERY_LENGTH} characters.`,
    };
  if (
    /https?:|www\.|\b[a-z0-9-]+\.(?:com|org|net|app|dev)\b/i.test(query) ||
    !/^[\p{L}\p{N}][\p{L}\p{N}\s'’&()+.,/%‐‑‒–—_-]*$/u.test(query) ||
    !/\p{L}/u.test(query)
  )
    return {
      valid: false,
      message: 'Enter a word or short phrase, rather than a link or full document.',
    };
  return { valid: true, query };
}

const lookup = new Map<string, DictionaryEntry>();
for (const entry of dictionary)
  for (const key of [entry.id, entry.term, ...entry.aliases])
    lookup.set(normalizeDictionaryTerm(key), entry);

export function findDictionaryEntry(query: string): DictionaryEntry | undefined {
  const valid = validateDictionaryQuery(query);
  return valid.valid ? lookup.get(normalizeDictionaryTerm(valid.query)) : undefined;
}

export function suggestDictionaryEntries(query: string, limit = 6): DictionaryEntry[] {
  const normalized = normalizeDictionaryTerm(query);
  const count = Math.max(0, Math.min(12, limit));
  if (!normalized)
    return [
      'onboarding',
      'definition-of-done',
      'verification',
      'validation',
      'work-in-progress',
      'elicitation',
    ]
      .map((id) => dictionary.find((entry) => entry.id === id)!)
      .slice(0, count);
  return dictionary
    .filter((entry) =>
      [entry.term, ...entry.aliases].some((term) =>
        normalizeDictionaryTerm(term).includes(normalized),
      ),
    )
    .sort((a, b) => {
      const aStarts = normalizeDictionaryTerm(a.term).startsWith(normalized);
      const bStarts = normalizeDictionaryTerm(b.term).startsWith(normalized);
      return Number(bStarts) - Number(aStarts) || a.term.localeCompare(b.term);
    })
    .slice(0, count);
}

export const onlineDictionaryResultSchema = z.object({
  kind: z.literal('online'),
  term: z.string(),
  definitionEn: z.string().nullable(),
  meaningAz: z.string().nullable(),
  explanationAz: z.string().nullable(),
  example: z.object({ en: z.string(), az: z.string().nullable() }).nullable(),
  partOfSpeech: z.string().nullable(),
  sources: z.array(z.object({ title: z.string(), url: z.url() })),
  machineTranslated: z.literal(true),
});
export type OnlineDictionaryResult = z.infer<typeof onlineDictionaryResultSchema>;
export const dictionaryResponseSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('curated'), entry: dictionaryEntrySchema }),
  onlineDictionaryResultSchema,
  z.object({ kind: z.literal('not-found'), term: z.string(), message: z.string() }),
]);
export type DictionaryResponse = z.infer<typeof dictionaryResponseSchema>;

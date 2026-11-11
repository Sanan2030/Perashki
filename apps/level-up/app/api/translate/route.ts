import { z } from 'zod';
import {
  findDictionaryEntry,
  normalizeDictionaryTerm,
  validateDictionaryQuery,
  type DictionaryResponse,
  type OnlineDictionaryResult,
} from '@/lib/dictionary';

// Only these fixed public services receive explicit lookups for unknown terms.
// The caller cannot supply an upstream host, path, credentials, or language pair.
const ENGLISH_DICTIONARY = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
const DEFINITION_FALLBACK = 'https://api.datamuse.com/words';
const AZERBAIJANI_TRANSLATION = 'https://api.mymemory.translated.net/get';
const CACHE_TTL = 60 * 60 * 1000;
const cache = new Map<string, { expires: number; result: DictionaryResponse }>();
const englishSchema = z.array(
  z.object({
    word: z.string(),
    meanings: z.array(
      z.object({
        partOfSpeech: z.string().optional(),
        definitions: z.array(z.object({ definition: z.string(), example: z.string().optional() })),
      }),
    ),
  }),
);
const fallbackSchema = z.array(
  z.object({ word: z.string(), defs: z.array(z.string()).optional() }),
);
const translationSchema = z.object({
  responseStatus: z.union([z.number(), z.string()]),
  responseData: z.object({ translatedText: z.string() }),
});

async function readJson(url: URL | string): Promise<unknown | null> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(4_000),
      headers: { Accept: 'application/json' },
      redirect: 'error',
      next: { revalidate: 3_600 },
    });
    if (!response.ok || Number(response.headers.get('content-length') ?? 0) > 150_000) return null;
    const body = await response.text();
    if (body.length > 150_000) return null;
    return JSON.parse(body) as unknown;
  } catch {
    return null;
  }
}

async function translate(text: string): Promise<string | null> {
  if (!text || text.length > 450) return null;
  const url = new URL(AZERBAIJANI_TRANSLATION);
  url.searchParams.set('q', text);
  url.searchParams.set('langpair', 'en|az');
  const parsed = translationSchema.safeParse(await readJson(url));
  if (!parsed.success || Number(parsed.data.responseStatus) !== 200) return null;
  const translated = parsed.data.responseData.translatedText.trim();
  if (
    !translated ||
    translated.length > 2_000 ||
    /MYMEMORY WARNING|QUERY LENGTH LIMIT|INVALID LANGUAGE PAIR|YOU USED ALL|NO QUERY SPECIFIED/i.test(
      translated,
    )
  )
    return null;
  return translated;
}

export async function GET(request: Request) {
  const input = new URL(request.url).searchParams.get('q');
  const validation = validateDictionaryQuery(input);
  if (!validation.valid) return Response.json({ error: validation.message }, { status: 400 });
  const term = validation.query;
  const curated = findDictionaryEntry(term);
  if (curated)
    return Response.json({ kind: 'curated', entry: curated } satisfies DictionaryResponse, {
      headers: { 'Cache-Control': 'public, max-age=3600' },
    });
  const key = term.toLocaleLowerCase('en');
  const existing = cache.get(key);
  if (existing && existing.expires > Date.now()) return Response.json(existing.result);

  const [englishRaw, meaningAz] = await Promise.all([
    readJson(ENGLISH_DICTIONARY + encodeURIComponent(term.toLocaleLowerCase('en'))),
    translate(term),
  ]);
  const english = englishSchema.safeParse(englishRaw);
  const firstMeaning = english.success
    ? english.data[0]?.meanings.find((m) => m.definitions.length)
    : null;
  const definition = firstMeaning?.definitions[0];
  let definitionEn =
    definition?.definition && definition.definition.length <= 2_000 ? definition.definition : null;
  const exampleEn =
    definition?.example && definition.example.length <= 450 ? definition.example : null;
  let partOfSpeech = firstMeaning?.partOfSpeech ?? null;
  let definitionSource = definitionEn
    ? { title: 'Free Dictionary API', url: 'https://dictionaryapi.dev/' }
    : null;
  if (!definitionEn) {
    const fallbackUrl = new URL(DEFINITION_FALLBACK);
    fallbackUrl.searchParams.set('sp', term.toLocaleLowerCase('en'));
    fallbackUrl.searchParams.set('md', 'd');
    fallbackUrl.searchParams.set('max', '1');
    const parsed = fallbackSchema.safeParse(await readJson(fallbackUrl));
    const exact = parsed.success
      ? parsed.data.find(
          (item) => normalizeDictionaryTerm(item.word) === normalizeDictionaryTerm(term),
        )
      : undefined;
    const rawDefinition = exact?.defs?.[0];
    if (rawDefinition) {
      const tab = rawDefinition.indexOf('\t');
      const text = (tab >= 0 ? rawDefinition.slice(tab + 1) : rawDefinition).trim();
      if (text && text.length <= 2000) {
        definitionEn = text;
        const tag = tab >= 0 ? rawDefinition.slice(0, tab) : '';
        partOfSpeech =
          ({ n: 'noun', v: 'verb', adj: 'adjective', adv: 'adverb' } as Record<string, string>)[
            tag
          ] ?? null;
        definitionSource = { title: 'Datamuse definitions', url: 'https://www.datamuse.com/api/' };
      }
    }
  }
  const [explanationAz, exampleAz] = await Promise.all([
    definitionEn ? translate(definitionEn) : Promise.resolve(null),
    exampleEn ? translate(exampleEn) : Promise.resolve(null),
  ]);
  const result: DictionaryResponse =
    definitionEn || meaningAz
      ? ({
          kind: 'online',
          term,
          definitionEn,
          meaningAz,
          explanationAz,
          example: exampleEn ? { en: exampleEn, az: exampleAz } : null,
          partOfSpeech,
          sources: [
            ...(definitionSource ? [definitionSource] : []),
            ...(meaningAz || explanationAz
              ? [{ title: 'MyMemory machine translation', url: 'https://mymemory.translated.net/' }]
              : []),
          ],
          machineTranslated: true,
        } satisfies OnlineDictionaryResult)
      : {
          kind: 'not-found',
          term,
          message:
            'No reliable definition was returned. Try a shorter word, another spelling, or one of the study terms below.',
        };
  if (cache.size >= 200) cache.delete(cache.keys().next().value!);
  cache.set(key, {
    expires: Date.now() + (result.kind === 'not-found' ? 60_000 : CACHE_TTL),
    result,
  });
  return Response.json(result, {
    headers: { 'Cache-Control': result.kind === 'not-found' ? 'no-store' : 'public, max-age=3600' },
  });
}

import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy } from '@/proxy';
import { getLocale, locales } from '@/lib/i18n';
import { uiText } from '@/lib/ui-text';
import { getContent } from '@/lib/content';

describe('bilingual routes and reviewed copy', () => {
  it('serves explicit locales without redirecting Azerbaijani to English', () => {
    expect(locales).toEqual(['az', 'en']);
    for (const locale of locales) {
      expect(getLocale(locale)).toBe(locale);
      const response = proxy(
        new NextRequest(`https://learning.example/${locale}/lessons/product-backlog?track=po`),
      );
      expect(response.headers.get('location')).toBeNull();
    }
  });
  it('uses only a supported saved language on unprefixed routes and preserves search parameters', () => {
    const saved = proxy(
      new NextRequest('https://learning.example/lessons?subject=devops', {
        headers: { cookie: 'level-up.locale=az' },
      }),
    );
    expect(saved.headers.get('location')).toBe(
      'https://learning.example/az/lessons?subject=devops',
    );
    const invalid = proxy(
      new NextRequest('https://learning.example/', { headers: { cookie: 'level-up.locale=xx' } }),
    );
    expect(invalid.headers.get('location')).toBe('https://learning.example/en');
    expect(invalid.status).toBe(307);
  });
  it('preserves terminology and code while providing Azerbaijani explanations', () => {
    const backlog = getContent('product-backlog', 'az')!;
    expect(backlog.fallback).toBe(false);
    expect(backlog.body).toContain('Product Backlog');
    expect(backlog.body).not.toContain('Məhsul İş Siyahısı');
    const masterclass = getContent('docker-kubernetes-masterclass', 'az')!;
    expect(masterclass.fallback).toBe(false);
    expect(masterclass.body).toContain('Bu, Dockerfile-dan');
    for (const code of [
      'kind: Deployment',
      'matchLabels:',
      'secret/data/demo/orders',
      'imagePullPolicy: IfNotPresent',
    ])
      expect(masterclass.body).toContain(code);
    expect(uiText('Recreate Pod for config', 'az')).toBe('Konfiqurasiya üçün Pod-u yenilə');
    expect(uiText('Recreate Pod for config', 'en')).toBe('Recreate Pod for config');
    expect(uiText('Pod', 'az')).toBe('Pod');
  });
});

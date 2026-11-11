import { describe, expect, it } from 'vitest';
import { publicSiteUrl } from '../lib/site-url';

describe('service public URLs', () => {
  it('includes the mounted prefix in production metadata and sitemap origins', () => {
    expect(publicSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: 'workspace.example' })).toBe('https://workspace.example/tools/level-up');
    expect(publicSiteUrl({ NEXT_PUBLIC_SITE_URL: 'https://workspace.example' })).toBe('https://workspace.example/tools/level-up');
  });
  it('keeps an explicit full service URL and supports standalone root hosting', () => {
    expect(publicSiteUrl({ NEXT_PUBLIC_SITE_URL: 'https://workspace.example/tools/level-up/' })).toBe('https://workspace.example/tools/level-up');
    expect(publicSiteUrl({ NEXT_PUBLIC_SITE_URL: 'https://workspace.example', NEXT_PUBLIC_BASE_PATH: '' })).toBe('https://workspace.example');
  });
});

export function publicSiteUrl(environment: Record<string, string | undefined> = {
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH,
  VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
}) {
  const origin = environment.NEXT_PUBLIC_SITE_URL ||
    (environment.VERCEL_PROJECT_PRODUCTION_URL ? `https://${environment.VERCEL_PROJECT_PRODUCTION_URL}` : 'https://level-up.example');
  const site = new URL(origin);
  const basePath = environment.NEXT_PUBLIC_BASE_PATH ?? '/tools/level-up';
  if (site.pathname === '/' && basePath) site.pathname = basePath;
  return site.href.replace(/\/$/, '');
}

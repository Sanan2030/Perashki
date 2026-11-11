import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
  const site =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'https://level-up.example');
  return { rules: { userAgent: '*', allow: '/' }, sitemap: `${site}/sitemap.xml` };
}

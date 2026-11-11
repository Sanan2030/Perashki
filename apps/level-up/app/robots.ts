import type { MetadataRoute } from 'next';
import { publicSiteUrl } from '@/lib/site-url';
export default function robots(): MetadataRoute.Robots {
  const site = publicSiteUrl();
  return { rules: { userAgent: '*', allow: '/' }, sitemap: `${site}/sitemap.xml` };
}

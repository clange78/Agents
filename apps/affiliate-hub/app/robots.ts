import type { MetadataRoute } from 'next';
import { site } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // `/go/` is a redirect handler and `/p/` is thin, duplicative and
        // expiring. Neither belongs in an index; the collections carry the SEO.
        disallow: ['/go/', '/p/'],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}

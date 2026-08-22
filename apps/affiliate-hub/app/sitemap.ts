import type { MetadataRoute } from 'next';
import { allCollections, allNotes } from '@/lib/content';
import { canonical } from '@/lib/links';

/** Collections, notes and static pages only — never `/p/` or `/go/`. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: canonical('/'), lastModified: now, changeFrequency: 'daily', priority: 1 },
    ...allCollections.map((c) => ({
      url: canonical(`/c/${c.slug}`),
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    })),
    ...allNotes.map((n) => ({
      url: canonical(`/notes/${n.slug}`),
      lastModified: new Date(n.publishedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    { url: canonical('/notes'), lastModified: now, changeFrequency: 'weekly', priority: 0.5 },
    { url: canonical('/about'), lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: canonical('/disclosure'), lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: canonical('/privacy'), lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
    { url: canonical('/terms'), lastModified: now, changeFrequency: 'yearly', priority: 0.2 },
  ];
}

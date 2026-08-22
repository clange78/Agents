import dealsRaw from '@/content/deals.json';
import collectionsRaw from '@/content/collections.json';
import notesRaw from '@/content/notes.json';
import { parseContent, type Collection, type Deal, type Note } from './schema';

// Parsed once at module load. A malformed record (a deal with an empty note,
// an over-length metaTitle, an unknown collection) throws here, which fails
// `next build` rather than shipping a broken page.
const content = parseContent({ deals: dealsRaw, collections: collectionsRaw, notes: notesRaw });

export const allDeals: Deal[] = content.deals;
export const allCollections: Collection[] = [...content.collections].sort((a, b) => a.order - b.order);
export const allNotes: Note[] = [...content.notes]
  .filter((n) => n.status === 'published')
  .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

/** Anything a visitor may click. Expired deals are treated as dead. */
export function isLive(deal: Deal, now: Date = new Date()): boolean {
  if (deal.status !== 'live') return false;
  if (deal.expiresAt && Date.parse(deal.expiresAt) < now.getTime()) return false;
  return true;
}

export const liveDeals = (): Deal[] => allDeals.filter((d) => isLive(d));

export const getDeal = (slug: string): Deal | undefined => allDeals.find((d) => d.slug === slug);

export const getCollection = (slug: string): Collection | undefined =>
  allCollections.find((c) => c.slug === slug);

export const getNote = (slug: string): Note | undefined => allNotes.find((n) => n.slug === slug);

/** Live deals in a collection, primary-collection items first, then newest. */
export function dealsInCollection(slug: string): Deal[] {
  return liveDeals()
    .filter((d) => d.collections.includes(slug))
    .sort((a, b) => {
      const primary = Number(b.collections[0] === slug) - Number(a.collections[0] === slug);
      if (primary !== 0) return primary;
      return b.addedAt.localeCompare(a.addedAt);
    });
}

/**
 * Deals in a collection that a visitor can no longer buy. Used by the `?ended=`
 * recovery banner so an expired social post still lands somewhere useful.
 */
export function endedDealsInCollection(slug: string): Deal[] {
  return allDeals.filter((d) => !isLive(d) && d.collections.includes(slug));
}

export const featuredDeals = (limit = 8): Deal[] =>
  liveDeals()
    .filter((d) => d.featured)
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
    .slice(0, limit);

export const newestDeals = (limit = 12): Deal[] =>
  [...liveDeals()].sort((a, b) => b.addedAt.localeCompare(a.addedAt)).slice(0, limit);

export const notesForDeal = (slug: string): Note[] =>
  allNotes.filter((n) => n.dealSlugs.includes(slug));

export const collectionTitle = (slug: string): string => getCollection(slug)?.title ?? slug;

/**
 * Brand + title, minus the overlap. "Manta Sleep" + "Sleep Mask PRO" reads
 * "Manta Sleep Mask PRO" rather than stuttering, and "AeroPress" + "AeroPress
 * Original" collapses to one AeroPress.
 */
export function dealName(deal: Pick<Deal, 'brand' | 'title'>): string {
  const brandWords = deal.brand.trim().split(/\s+/);
  const titleWords = deal.title.trim().split(/\s+/);
  const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

  for (let k = Math.min(brandWords.length, titleWords.length); k > 0; k--) {
    const tail = brandWords.slice(-k);
    const head = titleWords.slice(0, k);
    if (tail.every((word, i) => same(word, head[i]!))) {
      return [...brandWords, ...titleWords.slice(k)].join(' ');
    }
  }

  return `${deal.brand} ${deal.title}`;
}

export type { Collection, Deal, Note };

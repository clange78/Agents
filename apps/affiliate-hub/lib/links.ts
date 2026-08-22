import type { Deal, Network } from './schema';
import { site } from './site';

/**
 * Where each network wants per-click attribution. Only networks we can name a
 * documented parameter for get one; the rest pass through untouched rather than
 * guessing at a param that would be silently dropped.
 */
const SUB_ID_PARAM: Partial<Record<Network, string>> = {
  impact: 'subId1',
  shareasale: 'afftrack',
  clickbank: 'tid',
};

/** Sub-IDs travel through several systems — keep them boring. */
export function sanitiseSource(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40);
  return cleaned.length > 0 ? cleaned : null;
}

/**
 * Appends the network's sub-ID parameter, preserving every tracking param the
 * program already put on the destination URL.
 *
 * `source` is the optional per-post tag from `/go/{slug}?s=ig-story`, so a click
 * can be attributed to the post that produced it.
 */
export function withSubId(destUrl: string, base: string, network: Network, source?: string | null): string {
  const param = SUB_ID_PARAM[network];
  if (!param) return destUrl;

  try {
    const url = new URL(destUrl);
    if (url.searchParams.has(param)) return destUrl; // never clobber a hand-set sub-ID
    url.searchParams.set(param, source ? `${base}-${source}` : base);
    return url.toString();
  } catch {
    return destUrl;
  }
}

/**
 * The href a card should render.
 *
 * Amazon's Operating Agreement is restrictive about third-party redirects and
 * link cloaking, so Amazon deals link straight out and skip `/go/`. Everything
 * else goes through the redirect layer, which is what makes a destination
 * swappable without touching a single published post.
 */
export function hrefFor(deal: Deal, source?: string): string {
  if (deal.network === 'amazon') return deal.destUrl;
  const s = sanitiseSource(source);
  return s ? `/go/${deal.slug}?s=${s}` : `/go/${deal.slug}`;
}

/** The durable link to put in a social post. Always absolute, always /go/. */
export const shareLink = (deal: Deal, source?: string): string => {
  const s = sanitiseSource(source);
  return `${site.url}/go/${deal.slug}${s ? `?s=${s}` : ''}`;
};

export const canonical = (path: string): string => `${site.url}${path.startsWith('/') ? path : `/${path}`}`;

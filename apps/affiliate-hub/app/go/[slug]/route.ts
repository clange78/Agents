import type { NextRequest } from 'next/server';
import { getDeal, isLive } from '@/lib/content';
import { sanitiseSource, withSubId } from '@/lib/links';
import { logClick } from '@/lib/analytics';
import { site } from '@/lib/site';

// Never prerender or cache this. The whole point of the layer is that the
// destination can change without a single published post changing.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * 302 everywhere — never 301. A 301 gets cached by the browser and you lose the
 * ability to swap a destination for everyone who already clicked once.
 */
const SEE_OTHER = 302;

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const deal = getDeal(slug);

  // Unknown slug: send them home rather than 404 a link that is live on social.
  if (!deal) return redirect(new URL('/', req.url));

  // Dead, paused or expired: hand them the collection plus a recovery banner.
  if (!isLive(deal)) {
    const collection = deal.collections[0] ?? 'what-i-actually-use';
    return redirect(new URL(`/c/${collection}?ended=${deal.slug}`, req.url));
  }

  const source = sanitiseSource(req.nextUrl.searchParams.get('s') ?? req.nextUrl.searchParams.get('src'));

  // Fire-and-forget. Not awaited: analytics must never sit in front of a click.
  logClick(deal, {
    source,
    referrer: req.headers.get('referer'),
    userAgent: req.headers.get('user-agent'),
    ip: req.headers.get('x-forwarded-for'),
    url: `${site.url}/go/${deal.slug}`,
  });

  return redirect(withSubId(deal.destUrl, site.subIdBase, deal.network, source));
}

function redirect(to: URL | string): Response {
  return new Response(null, {
    status: SEE_OTHER,
    headers: {
      Location: to.toString(),
      // Belt and braces: some intermediaries will cache a bare 302 otherwise.
      'Cache-Control': 'no-store, max-age=0',
      'Referrer-Policy': 'no-referrer-when-downgrade',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

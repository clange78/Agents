import type { Deal } from './schema';

type ClickContext = {
  source: string | null;
  referrer: string | null;
  userAgent: string | null;
  ip: string | null;
  url: string;
};

const PLAUSIBLE_HOST = process.env.PLAUSIBLE_API_HOST ?? 'https://plausible.io';

/**
 * Server-side click event. Deliberately fire-and-forget: the redirect must not
 * wait on an analytics endpoint, and an analytics outage must never break a link.
 *
 * Call it WITHOUT await.
 */
export function logClick(deal: Deal, ctx: ClickContext): void {
  void Promise.allSettled([sendPlausible(deal, ctx), sendGa4(deal, ctx)]).catch(() => {});
}

async function sendPlausible(deal: Deal, ctx: ClickContext): Promise<void> {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (!domain) return;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (ctx.userAgent) headers['User-Agent'] = ctx.userAgent;
  if (ctx.ip) headers['X-Forwarded-For'] = ctx.ip;

  await fetch(`${PLAUSIBLE_HOST}/api/event`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'outbound_click',
      domain,
      url: ctx.url,
      referrer: ctx.referrer ?? undefined,
      props: {
        slug: deal.slug,
        merchant: deal.merchant,
        network: deal.network,
        collection: deal.collections[0],
        source: ctx.source ?? 'none',
        recurring: String(Boolean(deal.recurring)),
      },
    }),
    // Never let a slow analytics host hold a socket open behind a redirect.
    signal: AbortSignal.timeout(2000),
  });
}

async function sendGa4(deal: Deal, ctx: ClickContext): Promise<void> {
  const id = process.env.GA4_MEASUREMENT_ID;
  const secret = process.env.GA4_API_SECRET;
  if (!id || !secret) return;

  await fetch(
    `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(id)}&api_secret=${encodeURIComponent(secret)}`,
    {
      method: 'POST',
      body: JSON.stringify({
        client_id: `${Date.now()}.${Math.round(Math.random() * 1e9)}`,
        events: [
          {
            name: 'outbound_click',
            params: {
              slug: deal.slug,
              merchant: deal.merchant,
              network: deal.network,
              source: ctx.source ?? 'none',
            },
          },
        ],
      }),
      signal: AbortSignal.timeout(2000),
    },
  );
}

'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

/**
 * The recovery banner. `/go/{slug}` sends dead, paused and expired deals to
 * `/c/{collection}?ended={slug}`, and this is what greets them.
 *
 * Read client-side on purpose: touching `searchParams` in the page component
 * would opt the collection page out of static rendering, and these pages are
 * the site's SEO asset.
 */
export function EndedBanner({
  titles,
  collectionTitle,
}: {
  titles: Record<string, string>;
  collectionTitle: string;
}) {
  const ended = useSearchParams().get('ended');
  const [dismissed, setDismissed] = useState(false);

  if (!ended || dismissed) return null;

  const what = titles[ended];

  return (
    <div
      role="status"
      className="mb-8 flex items-start gap-4 rounded-[14px] border border-gold/40 bg-gold/8 p-4"
    >
      <p className="flex-1 text-sm">
        <span className="font-display text-base italic">That one&rsquo;s gone.</span>{' '}
        {what ? (
          <>
            <span className="text-mute">{what}</span> isn&rsquo;t available any more — here&rsquo;s
            what&rsquo;s live in {collectionTitle} right now.
          </>
        ) : (
          <>Here&rsquo;s what&rsquo;s live in {collectionTitle} right now.</>
        )}
      </p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="font-mono text-[11px] tracking-wider text-mute uppercase hover:text-ink"
        aria-label="Dismiss"
      >
        Close
      </button>
    </div>
  );
}

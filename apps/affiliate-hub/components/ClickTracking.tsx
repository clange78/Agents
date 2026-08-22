'use client';

import { useEffect } from 'react';

type PlausibleFn = (event: string, options?: { props?: Record<string, string> }) => void;

declare global {
  interface Window {
    plausible?: PlausibleFn & { q?: unknown[] };
  }
}

/**
 * Client-side click attribution.
 *
 * `/go/` already logs server-side, but Amazon deals bypass the redirect layer
 * (their Operating Agreement is restrictive about third-party redirects), so
 * without this those clicks would be invisible. One delegated listener covers
 * every outbound anchor on the page.
 */
export function ClickTracking() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement | null)?.closest?.('a[data-deal]');
      if (!(anchor instanceof HTMLAnchorElement)) return;

      const slug = anchor.dataset.deal;
      if (!slug) return;

      const direct = !anchor.pathname.startsWith('/go/');
      window.plausible?.('outbound_click', {
        props: {
          slug,
          path: window.location.pathname,
          // `/go/` clicks are counted server-side too; this flag keeps the two
          // populations separable when you read the dashboard.
          via: direct ? 'direct' : 'go',
        },
      });
    };

    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);

  return null;
}

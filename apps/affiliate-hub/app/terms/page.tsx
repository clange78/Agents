import type { Metadata } from 'next';
import Link from 'next/link';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Terms',
  description:
    'The plain-language terms for using this site: accuracy of listings, outbound merchants, and the limits of what is advice.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="text-4xl">Terms</h1>

      <div className="mt-8 space-y-5 text-mute">
        <h2 className="pt-2 text-2xl text-ink">Accuracy</h2>
        <p>
          Everything here is published in good faith and goes out of date. Prices, discounts and
          availability change without warning, and the merchant&rsquo;s own page is always the
          authority. A weekly automated check flags links that have broken, but there will always be
          a window where something on this site is wrong.
        </p>

        <h2 className="pt-4 text-2xl text-ink">Merchants</h2>
        <p>
          When you click through, you are buying from the merchant, not from {site.name}. Their
          terms, warranty, shipping and returns policy govern that purchase, and any dispute about an
          order is between you and them.
        </p>

        <h2 className="pt-4 text-2xl text-ink">Not advice</h2>
        <p>
          Nothing on this site is medical, legal or financial advice. Opinions are mine and are based
          on my own use, which is a sample size of one.
        </p>

        <h2 className="pt-4 text-2xl text-ink">Content</h2>
        <p>
          Words and photography here are mine. Brand names and product images belong to their
          respective owners and are used to identify the products described.
        </p>

        <p className="pt-4">
          See also{' '}
          <Link href="/disclosure" className="text-moss underline underline-offset-2">
            affiliate disclosure
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-moss underline underline-offset-2">
            privacy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Affiliate Disclosure',
  description:
    'How this site makes money, what a commission does and does not change, and the rules I hold myself to about what gets listed.',
  alternates: { canonical: '/disclosure' },
};

export default function DisclosurePage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="text-4xl">Affiliate Disclosure</h1>

      <p className="font-display mt-6 text-xl leading-relaxed italic">
        {site.disclosureShort}
      </p>

      <div className="mt-8 space-y-5 text-mute">
        <p>
          Most links on {site.name} are affiliate links. If you click one and buy something, the
          merchant pays me a percentage of the sale or a flat fee. You pay exactly the same price you
          would have paid going direct, and in a few cases the partner link carries a discount the
          public page does not.
        </p>

        <h2 className="pt-4 text-2xl text-ink">What a commission does not buy</h2>
        <p>
          Placement is never for sale. No brand has ever paid to be added to a collection, to be
          featured, or to be described in a particular way. If a brand offers me money for a listing,
          the answer is no, and if they offer me money to remove a critical line, the answer is also
          no.
        </p>

        <h2 className="pt-4 text-2xl text-ink">What gets listed</h2>
        <p>
          I have to have used it. For physical products that usually means months; for software it
          means at least one full billing cycle at my own expense. When something arrives free from a
          brand I will say so on the item. When something stops earning its place, I mark it dead and
          the link starts sending you to the live collection instead of a dead page.
        </p>

        <h2 className="pt-4 text-2xl text-ink">Amazon</h2>
        <p>{site.amazonDisclosure}</p>

        <h2 className="pt-4 text-2xl text-ink">Prices and availability</h2>
        <p>
          Prices shown are what I last saw and they drift constantly. The merchant&rsquo;s page is
          always the truth. Where a programme requires it, prices and availability are refreshed
          through that programme&rsquo;s own API rather than typed in by hand.
        </p>

        <h2 className="pt-4 text-2xl text-ink">Health and money claims</h2>
        <p>
          I am a creator, not a clinician and not a financial adviser. Nothing here diagnoses, treats
          or cures anything. Talk to a doctor before you start a supplement, especially if you take
          medication or you are pregnant.
        </p>

        <h2 className="pt-4 text-2xl text-ink">Questions</h2>
        <p>
          If anything on this page is unclear, or you think a listing is wrong, tell me. See{' '}
          <Link href="/about" className="text-moss underline underline-offset-2">
            About
          </Link>{' '}
          for how to reach me.
        </p>
      </div>
    </div>
  );
}

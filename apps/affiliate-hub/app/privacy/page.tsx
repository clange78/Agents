import type { Metadata } from 'next';
import Link from 'next/link';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy',
  description:
    'What this site collects, what it deliberately does not collect, and what happens when you click an outbound affiliate link.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="text-4xl">Privacy</h1>

      <div className="mt-8 space-y-5 text-mute">
        <h2 className="pt-2 text-2xl text-ink">Analytics</h2>
        <p>
          {site.name} uses privacy-friendly analytics that do not set advertising cookies and do not
          build a cross-site profile of you. What is recorded is aggregate: pages viewed, rough
          country, referring site, and which links get clicked.
        </p>

        <h2 className="pt-4 text-2xl text-ink">Outbound links</h2>
        <p>
          Affiliate links pass through <code className="font-mono text-sm">/go/</code> on this domain
          before landing on the merchant. That hop records which link was clicked and which post sent
          you, so I can tell what is useful. Once you arrive at the merchant, that merchant&rsquo;s
          own privacy policy and cookies apply, and they are typically how a sale gets attributed
          back to me.
        </p>

        <h2 className="pt-4 text-2xl text-ink">What this site does not do</h2>
        <p>
          There are no accounts, no comment system and no third-party ad network here. Nothing you do
          on this site is sold to anyone.
        </p>

        <h2 className="pt-4 text-2xl text-ink">Email</h2>
        <p>
          If you subscribe to the newsletter, your address is held by the email provider listed on
          the{' '}
          <Link href="/c/creator-stack" className="text-moss underline underline-offset-2">
            creator stack
          </Link>{' '}
          page and used for nothing but sending you the newsletter. Every email has a one-click
          unsubscribe.
        </p>
      </div>
    </div>
  );
}

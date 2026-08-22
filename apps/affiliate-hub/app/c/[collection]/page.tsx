import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { DealGrid } from '@/components/DealCard';
import { DisclosureBanner } from '@/components/Disclosure';
import { EndedBanner } from '@/components/EndedBanner';
import { Faq } from '@/components/Faq';
import {
  allCollections,
  dealName,
  dealsInCollection,
  endedDealsInCollection,
  getCollection,
} from '@/lib/content';
import { canonical } from '@/lib/links';
import { site } from '@/lib/site';

type Props = { params: Promise<{ collection: string }> };

export function generateStaticParams() {
  return allCollections.map((c) => ({ collection: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { collection } = await params;
  const found = getCollection(collection);
  if (!found) return {};

  return {
    title: found.metaTitle,
    description: found.metaDescription,
    alternates: { canonical: `/c/${found.slug}` },
    openGraph: {
      title: found.metaTitle,
      description: found.metaDescription,
      url: canonical(`/c/${found.slug}`),
      type: 'website',
    },
  };
}

export default async function CollectionPage({ params }: Props) {
  const { collection } = await params;
  const found = getCollection(collection);
  if (!found) notFound();

  const deals = dealsInCollection(found.slug);
  const endedTitles = Object.fromEntries(
    endedDealsInCollection(found.slug).map((d) => [d.slug, dealName(d)]),
  );

  // ItemList only. No Product or AggregateRating markup: we do not own the
  // reviews, and fabricated review markup is exactly what gets affiliate sites
  // penalised.
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: found.title,
    description: found.metaDescription,
    url: canonical(`/c/${found.slug}`),
    numberOfItems: deals.length,
    itemListElement: deals.map((deal, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: dealName(deal),
      url: canonical(`/p/${deal.slug}`),
    })),
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />

      <DisclosureBanner className="mb-6" deals={deals} />

      <Suspense fallback={null}>
        <EndedBanner titles={endedTitles} collectionTitle={found.title} />
      </Suspense>

      <header className="max-w-2xl">
        <h1 className="text-4xl sm:text-5xl">{found.title}</h1>
        <p className="mt-5 text-lg leading-relaxed text-mute">{found.intro}</p>
        <p className="mt-5 font-mono text-[11px] tracking-wider text-mute uppercase">
          {deals.length} live {deals.length === 1 ? 'pick' : 'picks'}
        </p>
      </header>

      <div className="mt-10">
        <DealGrid deals={deals} source={`c-${found.slug}`} />
      </div>

      {found.faq && found.faq.length > 0 && <Faq items={found.faq} />}

      <p className="mt-16 max-w-2xl text-sm text-mute">
        Everything here is linked through {site.url.replace(/^https?:\/\//, '')}/go/, so if a product
        is discontinued the link still lands on this page instead of dying.
      </p>
    </div>
  );
}

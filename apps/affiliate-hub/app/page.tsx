import Link from 'next/link';
import type { Metadata } from 'next';
import { DealGrid } from '@/components/DealCard';
import { DisclosureBanner } from '@/components/Disclosure';
import { allCollections, dealsInCollection, featuredDeals, newestDeals } from '@/lib/content';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export default function HomePage() {
  const featured = featuredDeals(4);
  const newest = newestDeals(12);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <DisclosureBanner className="mb-8" deals={[...featured, ...newest]} />

      <section className="max-w-3xl">
        <h1 className="text-5xl leading-[1.05] sm:text-6xl">
          Everything here, I paid for and kept using.
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-mute">
          No countdown timers, no fake scarcity, no page of four hundred products I have never
          touched. Every item carries one line in my own words on why it made the cut — and if it
          stops earning its place, it comes off the list.
        </p>
        <p className="mt-6">
          <Link
            href="/c/what-i-actually-use"
            className="inline-block bg-moss px-6 py-3 font-medium text-paper hover:bg-moss-deep"
          >
            Start with what I actually use <span aria-hidden="true">→</span>
          </Link>
        </p>
      </section>

      {featured.length > 0 && (
        <section className="mt-16">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-2xl">The shelf</h2>
            <p className="font-mono text-[11px] tracking-wider text-mute uppercase">
              What I&rsquo;d hand you first
            </p>
          </div>
          <div className="mt-6">
            <DealGrid deals={featured} source="home-featured" />
          </div>
        </section>
      )}

      <section className="mt-20">
        <h2 className="text-2xl">Collections</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {allCollections.map((collection) => {
            const count = dealsInCollection(collection.slug).length;
            return (
              <Link
                key={collection.slug}
                href={`/c/${collection.slug}`}
                className="card-lift block rounded-[14px] border border-rule bg-surface p-6"
              >
                <p className="font-mono text-[10px] tracking-[0.14em] text-mute uppercase">
                  {count} live
                </p>
                <h3 className="mt-2 text-xl">{collection.title}</h3>
                <p className="mt-3 line-clamp-3 text-sm text-mute">{collection.metaDescription}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-20">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-2xl">Newest</h2>
          <p className="font-mono text-[11px] tracking-wider text-mute uppercase">
            Last {newest.length} added
          </p>
        </div>
        <div className="mt-6">
          <DealGrid deals={newest} source="home-newest" />
        </div>
      </section>

      <section className="mt-20 max-w-2xl border-t border-rule pt-10">
        <h2 className="text-2xl">How this pays for itself</h2>
        <p className="mt-4 text-mute">
          {site.disclosureShort} I only list things I have bought and used, placement is never for
          sale, and nothing on this site is dressed up as a limited-time panic.{' '}
          <Link href="/disclosure" className="text-moss underline underline-offset-2">
            The long version is here.
          </Link>
        </p>
      </section>
    </div>
  );
}

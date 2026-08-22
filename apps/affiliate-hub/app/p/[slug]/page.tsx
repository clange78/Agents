import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DealGrid } from '@/components/DealCard';
import { DisclosureBanner } from '@/components/Disclosure';
import { Price } from '@/components/Price';
import {
  allDeals,
  collectionTitle,
  dealName,
  dealsInCollection,
  getDeal,
  isLive,
  notesForDeal,
} from '@/lib/content';
import { hrefFor } from '@/lib/links';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return allDeals.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const deal = getDeal(slug);
  if (!deal) return {};

  // Product pages are thin, duplicative and expire. They are deliberately kept
  // out of the index so SEO equity concentrates on the evergreen collections.
  return {
    title: dealName(deal),
    description: deal.note,
    robots: { index: false, follow: false },
    alternates: { canonical: `/p/${deal.slug}` },
  };
}

export default async function DealPage({ params }: Props) {
  const { slug } = await params;
  const deal = getDeal(slug);
  if (!deal) notFound();

  const live = isLive(deal);
  const primary = deal.collections[0];
  const alsoIn = dealsInCollection(primary)
    .filter((d) => d.slug !== deal.slug)
    .slice(0, 4);
  const notes = notesForDeal(deal.slug);

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <DisclosureBanner className="mb-8" deals={[deal]} />

      <nav aria-label="Breadcrumb" className="mb-8 font-mono text-[11px] tracking-wider uppercase">
        <Link href={`/c/${primary}`} className="text-mute hover:text-ink">
          ← {collectionTitle(primary)}
        </Link>
      </nav>

      <div className="grid gap-10 md:grid-cols-2">
        <div className="overflow-hidden rounded-[14px] border border-rule bg-surface">
          <Image
            src={deal.image}
            alt={deal.imageAlt}
            width={800}
            height={1000}
            sizes="(min-width: 768px) 45vw, 100vw"
            className="h-full w-full object-cover"
            priority
          />
        </div>

        <div>
          <p className="font-mono text-[11px] tracking-[0.14em] text-mute uppercase">
            {deal.merchant}
            {deal.recurring && <span className="text-gold"> · recurring</span>}
          </p>

          <h1 className="mt-3 text-3xl sm:text-4xl">{dealName(deal)}</h1>

          <p className="font-display mt-6 text-xl leading-relaxed italic">
            &ldquo;{deal.note}&rdquo;
          </p>

          <div className="mt-6">
            <Price price={deal.price} wasPrice={deal.wasPrice} code={deal.code} amazon={deal.network === 'amazon'} />
          </div>

          {live ? (
            <a
              href={hrefFor(deal, `p-${deal.slug}`)}
              rel="sponsored nofollow noopener"
              target="_blank"
              data-deal={deal.slug}
              className="mt-8 block bg-moss px-6 py-4 text-center font-medium text-paper hover:bg-moss-deep"
            >
              See it at {deal.merchant} <span aria-hidden="true">→</span>
            </a>
          ) : (
            <div className="mt-8 rounded-[14px] border border-gold/40 bg-gold/8 p-5">
              <p className="font-display text-lg italic">That one&rsquo;s gone.</p>
              <p className="mt-2 text-sm text-mute">
                This one is no longer available.{' '}
                <Link href={`/c/${primary}`} className="text-moss underline underline-offset-2">
                  Here&rsquo;s what&rsquo;s live in {collectionTitle(primary)} right now.
                </Link>
              </p>
            </div>
          )}

          {deal.tags.length > 0 && (
            <ul className="mt-8 flex flex-wrap gap-2">
              {deal.tags.map((tag) => (
                <li
                  key={tag}
                  className="border border-rule px-2 py-1 font-mono text-[11px] text-mute"
                >
                  {tag}
                </li>
              ))}
            </ul>
          )}

          <p className="mt-8 font-mono text-[11px] text-mute">
            In{' '}
            {deal.collections.map((c, i) => (
              <span key={c}>
                {i > 0 && ' · '}
                <Link href={`/c/${c}`} className="hover:text-ink">
                  {collectionTitle(c)}
                </Link>
              </span>
            ))}
          </p>
        </div>
      </div>

      {notes.length > 0 && (
        <section className="mt-16 border-t border-rule pt-10">
          <h2 className="text-2xl">Written about in</h2>
          <ul className="mt-4 space-y-2">
            {notes.map((note) => (
              <li key={note.slug}>
                <Link href={`/notes/${note.slug}`} className="text-moss hover:underline">
                  {note.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {alsoIn.length > 0 && (
        <section className="mt-16 border-t border-rule pt-10">
          <h2 className="text-2xl">Also in {collectionTitle(primary)}</h2>
          <div className="mt-6">
            <DealGrid deals={alsoIn} source={`p-${deal.slug}`} />
          </div>
        </section>
      )}
    </div>
  );
}

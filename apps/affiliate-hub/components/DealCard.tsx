import Image from 'next/image';
import Link from 'next/link';
import type { Deal } from '@/lib/schema';
import { dealName } from '@/lib/content';
import { hrefFor } from '@/lib/links';
import { Price } from './Price';

/**
 * Card anatomy per §6. The endorsement note is the loudest typographic element
 * on the card — louder than the discount. On this site human judgement outranks
 * the number, and the type has to say so.
 */
export function DealCard({ deal, source }: { deal: Deal; source?: string }) {
  const href = hrefFor(deal, source);
  const external = deal.network === 'amazon';

  return (
    <article className="card-lift flex flex-col overflow-hidden rounded-[14px] border border-rule bg-surface">
      <Link
        href={`/p/${deal.slug}`}
        className="block aspect-4/5 overflow-hidden bg-paper"
        aria-label={`${dealName(deal)} — details`}
        tabIndex={-1}
      >
        <Image
          src={deal.image}
          alt={deal.imageAlt}
          width={640}
          height={800}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="h-full w-full object-cover"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <p className="font-mono text-[10px] tracking-[0.14em] text-mute uppercase">
          {deal.merchant}
          {deal.recurring && <span className="text-gold"> · recurring</span>}
        </p>

        {/* Body face, not the display serif: the endorsement below has to be the
            loudest thing on the card, and a serif title would compete with it. */}
        <h3 className="font-body text-base leading-snug font-semibold">
          <Link href={`/p/${deal.slug}`} className="line-clamp-2 hover:text-moss">
            {dealName(deal)}
          </Link>
        </h3>

        <p className="font-display text-[17px] leading-snug text-ink italic">
          &ldquo;{deal.note}&rdquo;
        </p>

        <div className="mt-auto pt-1">
          <Price price={deal.price} wasPrice={deal.wasPrice} code={deal.code} amazon={external} />
        </div>

        <a
          href={href}
          rel="sponsored nofollow noopener"
          target="_blank"
          data-deal={deal.slug}
          className="mt-1 block w-full bg-moss px-4 py-3 text-center text-sm font-medium text-paper hover:bg-moss-deep"
        >
          See it{external ? ' at Amazon' : ''} <span aria-hidden="true">→</span>
        </a>
      </div>
    </article>
  );
}

export function DealGrid({ deals, source }: { deals: Deal[]; source?: string }) {
  if (deals.length === 0) {
    return (
      <p className="rounded-[14px] border border-dashed border-rule p-8 text-center text-mute">
        Nothing live in here right now. Check back — the list moves slowly on purpose.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
      {deals.map((deal) => (
        <DealCard key={deal.slug} deal={deal} source={source} />
      ))}
    </div>
  );
}

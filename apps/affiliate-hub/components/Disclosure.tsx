import Link from 'next/link';
import type { Deal } from '@/lib/schema';
import { site } from '@/lib/site';

/**
 * FTC disclosure. Renders above the fold on `/`, every `/c/` and every `/p/` —
 * not in the footer. This is a compliance requirement, not a design choice.
 *
 * Pass `deals` for any page that renders Amazon links: the Associates Operating
 * Agreement requires its own statement, verbatim, alongside them.
 */
export function DisclosureBanner({
  className = '',
  deals,
}: {
  className?: string;
  deals?: Deal[];
}) {
  const hasAmazon = deals?.some((d) => d.network === 'amazon') ?? false;

  return (
    <div className={`font-mono text-[11px] leading-relaxed tracking-wide text-mute uppercase ${className}`}>
      <p>
        {site.disclosureShort}{' '}
        <Link href="/disclosure" className="text-moss underline underline-offset-2">
          How this works
        </Link>
      </p>
      {hasAmazon && <p className="mt-1">{site.amazonDisclosure}</p>}
    </div>
  );
}

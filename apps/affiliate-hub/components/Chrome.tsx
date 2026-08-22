import Link from 'next/link';
import { allCollections } from '@/lib/content';
import { site } from '@/lib/site';

export function Header() {
  return (
    <header className="border-b border-rule">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-5">
        <Link href="/" className="font-display text-xl font-semibold tracking-tight">
          {site.name}
        </Link>
        <nav aria-label="Collections" className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          {allCollections.map((c) => (
            <Link key={c.slug} href={`/c/${c.slug}`} className="text-mute hover:text-ink">
              {c.title}
            </Link>
          ))}
        </nav>
        <Link
          href="/disclosure"
          className="ml-auto font-mono text-[11px] tracking-wider text-mute uppercase hover:text-ink"
        >
          Disclosure
        </Link>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-rule">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:grid-cols-3">
        <div>
          <p className="font-display text-lg">{site.name}</p>
          <p className="mt-2 max-w-xs text-sm text-mute">{site.tagline}</p>
        </div>
        <nav aria-label="Collections" className="text-sm">
          <p className="font-mono text-[11px] tracking-wider text-mute uppercase">Collections</p>
          <ul className="mt-3 space-y-2">
            {allCollections.map((c) => (
              <li key={c.slug}>
                <Link href={`/c/${c.slug}`} className="hover:text-moss">
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Site" className="text-sm">
          <p className="font-mono text-[11px] tracking-wider text-mute uppercase">Site</p>
          <ul className="mt-3 space-y-2">
            <li>
              <Link href="/notes" className="hover:text-moss">
                Notes
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-moss">
                About
              </Link>
            </li>
            <li>
              <Link href="/disclosure" className="hover:text-moss">
                Affiliate disclosure
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-moss">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-moss">
                Terms
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-rule">
        <p className="mx-auto max-w-6xl px-5 py-6 font-mono text-[11px] leading-relaxed text-mute">
          {site.disclosureShort} {site.amazonDisclosure} &copy; {new Date().getFullYear()}{' '}
          {site.name}.
        </p>
      </div>
    </footer>
  );
}

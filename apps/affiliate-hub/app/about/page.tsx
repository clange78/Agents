import type { Metadata } from 'next';
import Link from 'next/link';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Who runs this list, how something earns a place on it, and how to get in touch about a listing.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="text-4xl">About</h1>

      <div className="mt-8 space-y-5 text-mute">
        <p>
          {site.name} is the answer to the question I get most: what do you actually use? It is
          deliberately small. Every item has one sentence in my own words about why it made the cut,
          and that sentence is the whole reason the page exists.
        </p>
        <p>
          Three rules keep it honest. I have to have paid for it. It has to have survived long enough
          that I would buy it again. And when it stops earning its place, it comes off — the link
          keeps working and sends you to whatever is live instead.
        </p>
        <p>
          Some links earn me a commission, which never changes your price.{' '}
          <Link href="/disclosure" className="text-moss underline underline-offset-2">
            Full disclosure here.
          </Link>
        </p>
        <p className="pt-4">
          <span className="font-mono text-[11px] tracking-wider text-mute uppercase">Contact</span>
          <br />
          Reply to any newsletter, or message me on the platform you found this on.
        </p>
      </div>
    </div>
  );
}

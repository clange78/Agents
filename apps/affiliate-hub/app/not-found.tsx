import Link from 'next/link';
import { allCollections } from '@/lib/content';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-20">
      <h1 className="text-4xl">That page isn&rsquo;t here.</h1>
      <p className="mt-4 text-mute">
        Links to individual products expire. The collections do not — try one of these.
      </p>
      <ul className="mt-8 space-y-2">
        {allCollections.map((c) => (
          <li key={c.slug}>
            <Link href={`/c/${c.slug}`} className="text-moss hover:underline">
              {c.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

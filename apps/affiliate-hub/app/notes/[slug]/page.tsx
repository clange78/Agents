import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { DealGrid } from '@/components/DealCard';
import { DisclosureBanner } from '@/components/Disclosure';
import { allNotes, getDeal, getNote, isLive } from '@/lib/content';
import { canonical } from '@/lib/links';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return allNotes.map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const note = getNote(slug);
  if (!note) return {};

  return {
    title: note.metaTitle,
    description: note.metaDescription,
    alternates: { canonical: `/notes/${note.slug}` },
    openGraph: {
      type: 'article',
      title: note.metaTitle,
      description: note.metaDescription,
      url: canonical(`/notes/${note.slug}`),
      publishedTime: note.publishedAt,
    },
  };
}

export default async function NotePage({ params }: Props) {
  const { slug } = await params;
  const note = getNote(slug);
  if (!note) notFound();

  const mentioned = note.dealSlugs
    .map((s) => getDeal(s))
    .filter((d): d is NonNullable<typeof d> => Boolean(d) && isLive(d!));

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <DisclosureBanner className="mb-8" deals={mentioned} />

      <article>
        <p className="font-mono text-[11px] tracking-wider text-mute uppercase">
          {new Date(note.publishedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
        <h1 className="mt-3 text-4xl sm:text-5xl">{note.title}</h1>

        <div className="mt-8 space-y-5 text-lg leading-relaxed text-mute">
          {note.body.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      </article>

      {mentioned.length > 0 && (
        <section className="mt-16 border-t border-rule pt-10">
          <h2 className="text-2xl">Mentioned above</h2>
          <div className="mt-6">
            <DealGrid deals={mentioned} source={`note-${note.slug}`} />
          </div>
        </section>
      )}

      <p className="mt-16">
        <Link href="/notes" className="font-mono text-[11px] tracking-wider text-mute uppercase hover:text-ink">
          ← All notes
        </Link>
      </p>
    </div>
  );
}

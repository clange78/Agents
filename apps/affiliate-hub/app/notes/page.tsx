import type { Metadata } from 'next';
import Link from 'next/link';
import { allNotes } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Notes',
  description:
    'Longer pieces on what worked, what did not, and the order I would buy things in if I were starting over.',
  alternates: { canonical: '/notes' },
};

export default function NotesIndex() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="text-4xl">Notes</h1>
      <p className="mt-4 max-w-2xl text-mute">
        Longer pieces. Mostly about the order I would buy things in, which matters more than the
        individual picks.
      </p>

      <ul className="mt-10 divide-y divide-rule border-y border-rule">
        {allNotes.map((note) => (
          <li key={note.slug} className="py-6">
            <p className="font-mono text-[11px] tracking-wider text-mute uppercase">
              {new Date(note.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <h2 className="mt-2 text-2xl">
              <Link href={`/notes/${note.slug}`} className="hover:text-moss">
                {note.title}
              </Link>
            </h2>
            <p className="mt-2 text-mute">{note.excerpt}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

import type { Collection } from '@/lib/schema';

/** Visible accordion — real text in the DOM, not a JS-only disclosure. */
export function Faq({ items }: { items: NonNullable<Collection['faq']> }) {
  if (items.length === 0) return null;

  return (
    <section className="mt-16 border-t border-rule pt-10">
      <h2 className="text-2xl">Questions</h2>
      <div className="mt-6 divide-y divide-rule border-y border-rule">
        {items.map((item) => (
          <details key={item.q} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium marker:hidden">
              {item.q}
              <span
                aria-hidden="true"
                className="font-mono text-mute transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-3 max-w-2xl text-mute">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

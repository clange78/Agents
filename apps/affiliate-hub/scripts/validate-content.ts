/**
 * Build gate. `npm run build` runs this before `next build` so a bad content
 * commit fails loudly at the top of the log instead of somewhere inside a
 * webpack trace.
 *
 * A deal with an empty note fails the build. That is deliberate: the note is
 * the entire product differentiator.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseContent } from '../lib/schema';

const read = (file: string) =>
  JSON.parse(readFileSync(resolve(import.meta.dirname, '..', 'content', file), 'utf8'));

try {
  const { deals, collections, notes } = parseContent({
    deals: read('deals.json'),
    collections: read('collections.json'),
    notes: read('notes.json'),
  });

  const live = deals.filter((d) => d.status === 'live').length;
  console.log(
    `content ok — ${deals.length} deals (${live} live), ${collections.length} collections, ${notes.length} notes`,
  );

  const placeholders = deals.filter((d) => /REPLACE[_-]ME/i.test(d.destUrl));
  if (placeholders.length > 0) {
    console.warn(
      `\n  warning: ${placeholders.length} deal(s) still carry a REPLACE_ME affiliate token:\n` +
        placeholders.map((d) => `    · ${d.slug}`).join('\n') +
        '\n  Swap these for real programme URLs before launch.\n',
    );
  }
} catch (error) {
  console.error(`\n${(error as Error).message}\n`);
  process.exit(1);
}

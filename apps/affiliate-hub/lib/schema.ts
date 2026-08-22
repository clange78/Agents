import { z } from 'zod';

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?$/, 'must be an ISO date (YYYY-MM-DD)')
  .refine((v) => !Number.isNaN(Date.parse(v)), 'must be a parseable date');

const slugRule = z
  .string()
  .min(2)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slugs are lowercase kebab-case, and are permanent');

export const networkSchema = z.enum([
  'amazon',
  'impact',
  'shareasale',
  'partnerstack',
  'clickbank',
  'direct',
]);

export const dealSchema = z
  .object({
    slug: slugRule,
    title: z.string().min(3).max(120),
    brand: z.string().min(1),
    merchant: z.string().min(1),
    network: networkSchema,
    destUrl: z.string().url().startsWith('https://', 'affiliate destinations must be https'),
    image: z.string().startsWith('/img/deals/'),
    imageAlt: z.string().min(3),
    price: z.number().positive().optional(),
    wasPrice: z.number().positive().optional(),
    currency: z.literal('USD'),
    code: z.string().min(1).optional(),
    // The note is the entire product differentiator. No note, no listing.
    note: z.string().trim().min(10, 'every deal needs a real first-person endorsement'),
    collections: z.array(slugRule).min(1, 'a deal needs at least one collection'),
    tags: z.array(z.string().min(1)),
    status: z.enum(['live', 'paused', 'dead']),
    addedAt: isoDate,
    expiresAt: isoDate.optional(),
    featured: z.boolean().optional(),
    recurring: z.boolean().optional(),
    _commissionNote: z.string().optional(),
  })
  .strict()
  .refine((d) => !(d.wasPrice && d.price) || d.wasPrice > d.price, {
    message: 'wasPrice must be greater than price',
    path: ['wasPrice'],
  })
  // Amazon's Operating Agreement only permits prices sourced from the Product
  // Advertising API and refreshed within 24 hours. A number typed into this file
  // cannot satisfy that, so Amazon deals link out for price instead.
  .refine((d) => !(d.network === 'amazon' && (d.price !== undefined || d.wasPrice !== undefined)), {
    message:
      'Amazon deals must not carry a hard-coded price — prices are only permitted via the Product Advertising API',
    path: ['price'],
  });

export const collectionSchema = z
  .object({
    slug: slugRule,
    title: z.string().min(3),
    metaTitle: z.string().min(3).max(60, 'metaTitle must be 60 characters or fewer'),
    metaDescription: z.string().min(50).max(155, 'metaDescription must be 155 characters or fewer'),
    intro: z.string().min(1),
    faq: z.array(z.object({ q: z.string().min(5), a: z.string().min(10) })).optional(),
    order: z.number().int().nonnegative(),
    heroImage: z.string().startsWith('/img/').optional(),
  })
  .strict()
  .refine(
    (c) => {
      const words = c.intro.trim().split(/\s+/).length;
      return words >= 80 && words <= 150;
    },
    { message: 'intro must be 80–150 words of real indexable copy', path: ['intro'] },
  );

export const noteSchema = z
  .object({
    slug: slugRule,
    title: z.string().min(3),
    metaTitle: z.string().min(3).max(60),
    metaDescription: z.string().min(50).max(155),
    publishedAt: isoDate,
    excerpt: z.string().min(20),
    body: z.array(z.string().min(1)).min(1),
    dealSlugs: z.array(slugRule).default([]),
    status: z.enum(['published', 'draft']),
  })
  .strict();

export type Deal = z.infer<typeof dealSchema>;
export type Collection = z.infer<typeof collectionSchema>;
export type Note = z.infer<typeof noteSchema>;
export type Network = z.infer<typeof networkSchema>;

export type ValidationIssue = { file: string; where: string; message: string };

/**
 * Parses and cross-checks all three content files. Throws with a readable,
 * aggregated report — this is what fails the build on bad content.
 */
export function parseContent(raw: { deals: unknown; collections: unknown; notes: unknown }): {
  deals: Deal[];
  collections: Collection[];
  notes: Note[];
} {
  const issues: ValidationIssue[] = [];

  // Parsed record by record rather than as one array: a single malformed deal
  // should report its own field, not blank the whole file and make every
  // cross-reference downstream look broken too.
  const collect = <T>(file: string, schema: z.ZodType<T>, value: unknown): T[] => {
    if (!Array.isArray(value)) {
      issues.push({ file, where: '(root)', message: 'expected an array of records' });
      return [];
    }

    const parsed: T[] = [];
    value.forEach((record, index) => {
      const result = schema.safeParse(record);
      if (result.success) {
        parsed.push(result.data);
        return;
      }

      const label =
        record && typeof record === 'object' && typeof (record as { slug?: unknown }).slug === 'string'
          ? (record as { slug: string }).slug
          : `#${index}`;

      for (const issue of result.error.issues) {
        issues.push({
          file,
          where: [label, ...issue.path].join('.'),
          message: issue.message,
        });
      }
    });

    return parsed;
  };

  const collections = collect('collections.json', collectionSchema, raw.collections);
  const deals = collect('deals.json', dealSchema, raw.deals);
  const notes = collect('notes.json', noteSchema, raw.notes);

  const dupes = (values: string[]) =>
    values.filter((v, i) => values.indexOf(v) !== i).filter((v, i, a) => a.indexOf(v) === i);

  for (const [file, list] of [
    ['deals.json', deals.map((d) => d.slug)],
    ['collections.json', collections.map((c) => c.slug)],
    ['notes.json', notes.map((n) => n.slug)],
  ] as const) {
    for (const dupe of dupes([...list])) {
      issues.push({ file, where: dupe, message: 'duplicate slug — slugs are the permanent URL key' });
    }
  }

  const collectionSlugs = new Set(collections.map((c) => c.slug));
  const dealSlugs = new Set(deals.map((d) => d.slug));

  for (const deal of deals) {
    for (const c of deal.collections) {
      if (!collectionSlugs.has(c)) {
        issues.push({
          file: 'deals.json',
          where: `${deal.slug}.collections`,
          message: `unknown collection "${c}"`,
        });
      }
    }
  }

  for (const note of notes) {
    for (const s of note.dealSlugs) {
      if (!dealSlugs.has(s)) {
        issues.push({ file: 'notes.json', where: `${note.slug}.dealSlugs`, message: `unknown deal "${s}"` });
      }
    }
  }

  if (issues.length > 0) {
    const report = issues.map((i) => `  · ${i.file} → ${i.where}: ${i.message}`).join('\n');
    throw new Error(`Content validation failed (${issues.length} issue(s)):\n${report}`);
  }

  return { deals, collections, notes };
}

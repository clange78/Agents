/**
 * The build gate. A deal with an empty note must fail the build — the note is
 * the entire product differentiator, and this is the rule that enforces it.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseContent } from '../lib/schema';
import { allDeals, dealName, dealsInCollection, endedDealsInCollection, isLive } from '../lib/content';
import deals from '../content/deals.json';
import collections from '../content/collections.json';
import notes from '../content/notes.json';

const base = {
  slug: 'ok-deal',
  title: 'Title',
  brand: 'Brand',
  merchant: 'Merchant',
  network: 'direct',
  destUrl: 'https://example.com/p',
  image: '/img/deals/ok-deal.webp',
  imageAlt: 'alt text',
  currency: 'USD',
  note: 'a real endorsement sentence',
  collections: ['under-25'],
  tags: [],
  status: 'live',
  addedAt: '2026-01-01',
};

const minimalCollection = {
  slug: 'under-25',
  title: 'Under $25',
  metaTitle: 'Under $25',
  metaDescription: 'x'.repeat(60),
  intro: 'word '.repeat(100).trim(),
  order: 1,
};

const parse = (dealOverrides: Record<string, unknown>) =>
  parseContent({
    deals: [{ ...base, ...dealOverrides }],
    collections: [minimalCollection],
    notes: [],
  });

describe('content validation', () => {
  it('accepts a well-formed record', () => {
    assert.equal(parse({}).deals.length, 1);
  });

  it('rejects an empty note — no note, no listing', () => {
    assert.throws(() => parse({ note: '   ' }), /endorsement/);
  });

  it('rejects a deal pointing at a collection that does not exist', () => {
    assert.throws(() => parse({ collections: ['no-such-collection'] }), /unknown collection/);
  });

  it('rejects a metaTitle over 60 characters', () => {
    assert.throws(
      () =>
        parseContent({
          deals: [base],
          collections: [{ ...minimalCollection, metaTitle: 'x'.repeat(61) }],
          notes: [],
        }),
      /60 characters/,
    );
  });

  it('rejects intro copy outside the 80–150 word window', () => {
    assert.throws(
      () =>
        parseContent({
          deals: [base],
          collections: [{ ...minimalCollection, intro: 'too short' }],
          notes: [],
        }),
      /80–150 words/,
    );
  });

  it('rejects duplicate slugs — a slug is a permanent URL key', () => {
    assert.throws(
      () =>
        parseContent({
          deals: [base, { ...base, title: 'Other' }],
          collections: [minimalCollection],
          notes: [],
        }),
      /duplicate slug/,
    );
  });

  it('rejects an unknown field rather than silently dropping it', () => {
    assert.throws(() => parse({ commissionNote: 'typo — missing underscore' }));
  });

  it('rejects a non-https destination', () => {
    assert.throws(() => parse({ destUrl: 'http://example.com/p' }));
  });
});

describe('shipped content', () => {
  it('parses', () => {
    const parsed = parseContent({ deals, collections, notes });
    assert.ok(parsed.deals.length >= 30, 'at least 30 deals loaded');
    assert.equal(parsed.collections.length, 6);
  });

  it('treats an expired deal as not live even when status says live', () => {
    const expired = { ...base, expiresAt: '2020-01-01' } as never;
    assert.equal(isLive(expired), false);
  });

  it('keeps dead and paused deals out of collection grids', () => {
    for (const c of collections) {
      assert.ok(dealsInCollection(c.slug).every((d) => d.status === 'live'));
    }
  });

  it('can name the ended deal behind a ?ended= recovery redirect', () => {
    const notLive = allDeals.filter((d) => !isLive(d));
    assert.ok(notLive.length > 0, 'fixture has a dead/paused deal');
    for (const d of notLive) {
      const primary = d.collections[0]!;
      assert.ok(endedDealsInCollection(primary).some((e) => e.slug === d.slug));
    }
  });

  it('never prints a hard-coded price on an Amazon deal (PA API only)', () => {
    for (const d of allDeals.filter((x) => x.network === 'amazon')) {
      assert.equal(d.price, undefined, `${d.slug} carries a hard-coded Amazon price`);
      assert.equal(d.wasPrice, undefined, `${d.slug} carries a hard-coded Amazon price`);
    }
  });

  it('rejects an Amazon deal with a hard-coded price at parse time', () => {
    assert.throws(
      () =>
        parseContent({
          deals: [{ ...base, network: 'amazon', destUrl: 'https://www.amazon.com/dp/X', price: 10 }],
          collections: [minimalCollection],
          notes: [],
        }),
      /Product Advertising API/,
    );
  });

  it('never ships a deal whose primary collection is missing', () => {
    const slugs = new Set(collections.map((c) => c.slug));
    for (const d of allDeals) assert.ok(slugs.has(d.collections[0]!));
  });
});

describe('dealName', () => {
  it('collapses the overlap between brand and title', () => {
    assert.equal(dealName({ brand: 'Manta Sleep', title: 'Sleep Mask PRO' }), 'Manta Sleep Mask PRO');
    assert.equal(dealName({ brand: 'AeroPress', title: 'AeroPress Original' }), 'AeroPress Original');
  });

  it('leaves an unrelated brand and title alone', () => {
    assert.equal(dealName({ brand: 'Thorne', title: 'Magnesium' }), 'Thorne Magnesium');
  });

  it('is case-insensitive about the overlap', () => {
    assert.equal(dealName({ brand: 'BON CHARGE', title: 'bon charge Glasses' }), 'BON CHARGE Glasses');
  });
});

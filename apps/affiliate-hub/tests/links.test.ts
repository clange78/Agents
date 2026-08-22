/** Sub-ID attribution and the Amazon bypass are load-bearing for revenue. */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { hrefFor, sanitiseSource, withSubId } from '../lib/links';
import type { Deal } from '../lib/schema';

const deal = (over: Partial<Deal>): Deal =>
  ({
    slug: 'x',
    title: 'T',
    brand: 'B',
    merchant: 'M',
    network: 'direct',
    destUrl: 'https://example.com/p?utm_source=x',
    image: '/img/deals/x.webp',
    imageAlt: 'x',
    currency: 'USD',
    note: 'a real endorsement sentence',
    collections: ['under-25'],
    tags: [],
    status: 'live',
    addedAt: '2026-01-01',
    ...over,
  }) as Deal;

describe('withSubId', () => {
  it('uses subId1 for Impact and keeps existing tracking params', () => {
    const out = withSubId('https://m.com/p?irclickid=abc', 'rwc', 'impact', 'ig-story');
    assert.equal(out, 'https://m.com/p?irclickid=abc&subId1=rwc-ig-story');
  });

  it('uses afftrack for ShareASale and tid for ClickBank', () => {
    assert.match(withSubId('https://m.com/p', 'rwc', 'shareasale'), /afftrack=rwc$/);
    assert.match(withSubId('https://m.com/p', 'rwc', 'clickbank'), /tid=rwc$/);
  });

  it('passes through untouched for networks with no documented sub-ID param', () => {
    const url = 'https://m.com/p?a=1';
    assert.equal(withSubId(url, 'rwc', 'partnerstack'), url);
    assert.equal(withSubId(url, 'rwc', 'direct'), url);
  });

  it('never clobbers a sub-ID the program already set by hand', () => {
    const url = 'https://m.com/p?subId1=manual';
    assert.equal(withSubId(url, 'rwc', 'impact', 'ig'), url);
  });

  it('returns the original string if the destination is unparseable', () => {
    assert.equal(withSubId('not a url', 'rwc', 'impact'), 'not a url');
  });
});

describe('sanitiseSource', () => {
  it('lowercases and strips anything that is not slug-safe', () => {
    assert.equal(sanitiseSource('IG Story!! #3'), 'igstory3');
  });

  it('caps length and returns null for empty input', () => {
    assert.equal(sanitiseSource('a'.repeat(80))?.length, 40);
    assert.equal(sanitiseSource('!!!'), null);
    assert.equal(sanitiseSource(null), null);
  });
});

describe('hrefFor', () => {
  it('sends Amazon straight out, bypassing /go/ per the Operating Agreement', () => {
    const d = deal({ network: 'amazon', destUrl: 'https://www.amazon.com/dp/X?tag=t-20' });
    assert.equal(hrefFor(d, 'home'), 'https://www.amazon.com/dp/X?tag=t-20');
  });

  it('routes every other network through the swappable redirect layer', () => {
    assert.equal(hrefFor(deal({ slug: 'thing' }), 'c-under-25'), '/go/thing?s=c-under-25');
    assert.equal(hrefFor(deal({ slug: 'thing' })), '/go/thing');
  });
});

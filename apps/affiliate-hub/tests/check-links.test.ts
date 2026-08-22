/**
 * The link checker's whole value is catching the *silent* death of a product —
 * a 200 that quietly landed on a homepage or a search page. These run against a
 * local server so the behaviour is pinned without depending on a merchant.
 */
import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import { after, before, describe, it } from 'node:test';
import type { AddressInfo } from 'node:net';
import { judge, probe } from '../scripts/check-links';
import type { Deal } from '../lib/schema';

const deal = (destUrl: string): Deal =>
  ({
    slug: 'test-deal',
    title: 'Test',
    brand: 'Brand',
    merchant: 'Merchant',
    network: 'direct',
    destUrl,
    image: '/img/deals/test-deal.webp',
    imageAlt: 'test',
    currency: 'USD',
    note: 'a real endorsement sentence',
    collections: ['under-25'],
    tags: [],
    status: 'live',
    addedAt: '2026-01-01',
  }) as Deal;

let server: Server;
let base = '';

before(async () => {
  server = createServer((req, res) => {
    const path = req.url ?? '/';
    if (path.startsWith('/product/alive')) {
      res.writeHead(200).end('ok');
    } else if (path.startsWith('/product/gone')) {
      res.writeHead(404).end('gone');
    } else if (path.startsWith('/product/moved-home')) {
      res.writeHead(301, { Location: '/' }).end();
    } else if (path.startsWith('/product/moved-search')) {
      res.writeHead(302, { Location: '/search?q=widget' }).end();
    } else if (path.startsWith('/product/head-hostile')) {
      // Plenty of real merchants answer HEAD with 405 and are perfectly healthy.
      if (req.method === 'HEAD') res.writeHead(405).end();
      else res.writeHead(200).end('ok');
    } else {
      res.writeHead(200).end('root or search');
    }
  });

  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(() => server.close());

const check = async (path: string) => {
  const d = deal(`${base}${path}`);
  const { status, finalUrl, error } = await probe(d.destUrl);
  return judge(d, status, finalUrl, error);
};

describe('link health', () => {
  it('passes a product page that still resolves', async () => {
    assert.equal((await check('/product/alive')).verdict, 'ok');
  });

  it('flags a 404 as broken', async () => {
    const r = await check('/product/gone');
    assert.equal(r.verdict, 'broken');
    assert.equal(r.reason, 'HTTP 404');
  });

  it('flags a 200 that redirected to the merchant homepage', async () => {
    const r = await check('/product/moved-home');
    assert.equal(r.verdict, 'suspect');
    assert.match(r.reason, /homepage/);
  });

  it('flags a 200 that landed on a search results page', async () => {
    const r = await check('/product/moved-search');
    assert.equal(r.verdict, 'suspect');
    assert.match(r.reason, /search/);
  });

  it('retries with GET when a merchant rejects HEAD', async () => {
    const r = await check('/product/head-hostile');
    assert.equal(r.verdict, 'ok');
    assert.equal(r.status, 200);
  });

  it('reports an unreachable host rather than calling it healthy', async () => {
    const d = deal('https://127.0.0.1:1/nope');
    const { status, finalUrl, error } = await probe(d.destUrl);
    assert.equal(judge(d, status, finalUrl, error).verdict, 'unreachable');
  });
});

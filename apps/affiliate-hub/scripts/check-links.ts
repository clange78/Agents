/**
 * Weekly link health check (spec §9).
 *
 * For every live deal: HEAD the destination, follow redirects, and record where
 * it actually landed. The interesting failure is not a 404 — it is the silent
 * one, where a discontinued product quietly 301s to the merchant's homepage or
 * a search page and the link keeps returning 200 forever.
 *
 * Writes link-report.md and exits 1 when anything needs attention, which is what
 * the GitHub Action keys off to open an issue.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseContent, type Deal } from '../lib/schema';

const TIMEOUT_MS = 20_000;
const CONCURRENCY = 5;
const UA =
  'Mozilla/5.0 (compatible; affiliate-hub-linkcheck/1.0; +https://github.com/) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';

export type Verdict = 'ok' | 'broken' | 'suspect' | 'unreachable';

export type Result = {
  deal: Deal;
  status: number | null;
  finalUrl: string | null;
  verdict: Verdict;
  reason: string;
};

const SEARCH_HINTS = ['/search', '/catalogsearch', '/find', '/s/', '/results'];
const SEARCH_PARAMS = ['q', 'k', 'query', 'keyword', 'search', 's'];

export function isHomepage(original: string, final: string): boolean {
  try {
    const a = new URL(original);
    const b = new URL(final);
    const aDepth = a.pathname.replace(/\/+$/, '');
    const bDepth = b.pathname.replace(/\/+$/, '');
    // Deep product URL that ended up at the root of the same (or any) host.
    return aDepth.length > 1 && bDepth.length === 0;
  } catch {
    return false;
  }
}

export function isSearchPage(final: string): boolean {
  try {
    const url = new URL(final);
    const path = url.pathname.toLowerCase();
    if (SEARCH_HINTS.some((hint) => path.includes(hint))) return true;
    return SEARCH_PARAMS.some((param) => url.searchParams.has(param));
  } catch {
    return false;
  }
}

export async function probe(url: string): Promise<{ status: number | null; finalUrl: string | null; error?: string }> {
  const attempt = async (method: 'HEAD' | 'GET') => {
    const response = await fetch(url, {
      method,
      redirect: 'follow',
      headers: { 'User-Agent': UA, Accept: '*/*' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return { status: response.status, finalUrl: response.url || url };
  };

  try {
    const head = await attempt('HEAD');
    // Plenty of merchants answer HEAD with 403/405 and are perfectly healthy.
    if (head.status === 403 || head.status === 405 || head.status === 501) {
      return await attempt('GET');
    }
    return head;
  } catch {
    try {
      return await attempt('GET');
    } catch (error) {
      return { status: null, finalUrl: null, error: (error as Error).message };
    }
  }
}

export function judge(deal: Deal, status: number | null, finalUrl: string | null, error?: string): Result {
  if (status === null) {
    return { deal, status, finalUrl, verdict: 'unreachable', reason: error ?? 'no response' };
  }
  if (status >= 400) {
    return { deal, status, finalUrl, verdict: 'broken', reason: `HTTP ${status}` };
  }
  if (finalUrl && isHomepage(deal.destUrl, finalUrl)) {
    return {
      deal,
      status,
      finalUrl,
      verdict: 'suspect',
      reason: 'redirected to the merchant homepage — product is probably discontinued',
    };
  }
  if (finalUrl && isSearchPage(finalUrl) && !isSearchPage(deal.destUrl)) {
    return {
      deal,
      status,
      finalUrl,
      verdict: 'suspect',
      reason: 'landed on a search results page — product is probably gone',
    };
  }
  return { deal, status, finalUrl, verdict: 'ok', reason: `HTTP ${status}` };
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      out[index] = await fn(items[index]!);
    }
  });
  await Promise.all(workers);
  return out;
}

function renderReport(results: Result[]): string {
  const failing = results.filter((r) => r.verdict !== 'ok');
  const lines: string[] = [];

  lines.push('# Link report');
  lines.push('');
  lines.push(`Checked ${results.length} live links on ${new Date().toISOString().slice(0, 10)}.`);
  lines.push('');

  if (failing.length === 0) {
    lines.push('All live links resolved to a real product page. Nothing to do.');
    lines.push('');
  } else {
    lines.push(`**${failing.length} need attention.**`);
    lines.push('');
    lines.push('| Deal | Merchant | Verdict | Detail | Landed on |');
    lines.push('| --- | --- | --- | --- | --- |');
    for (const r of failing) {
      lines.push(
        `| \`${r.deal.slug}\` | ${r.deal.merchant} | ${r.verdict} | ${r.reason} | ${r.finalUrl ?? '—'} |`,
      );
    }
    lines.push('');
    lines.push('Fix by editing `content/deals.json`:');
    lines.push('');
    lines.push('- destination moved → update `destUrl`');
    lines.push('- product discontinued → set `status` to `dead` (every old post then routes to the live collection)');
    lines.push('- programme paused → set `status` to `paused`');
    lines.push('');
  }

  lines.push('<details><summary>All checked links</summary>');
  lines.push('');
  lines.push('| Deal | Verdict | Status |');
  lines.push('| --- | --- | --- |');
  for (const r of results) {
    lines.push(`| \`${r.deal.slug}\` | ${r.verdict} | ${r.status ?? 'none'} |`);
  }
  lines.push('');
  lines.push('</details>');
  lines.push('');

  return lines.join('\n');
}

async function main() {
  const read = (file: string) =>
    JSON.parse(readFileSync(resolve(import.meta.dirname, '..', 'content', file), 'utf8'));

  const { deals } = parseContent({
    deals: read('deals.json'),
    collections: read('collections.json'),
    notes: read('notes.json'),
  });

  const live = deals.filter((d) => d.status === 'live');
  console.log(`checking ${live.length} live links…`);

  const results = await mapLimit(live, CONCURRENCY, async (deal) => {
    const { status, finalUrl, error } = await probe(deal.destUrl);
    const result = judge(deal, status, finalUrl, error);
    console.log(`  ${result.verdict.padEnd(11)} ${deal.slug} — ${result.reason}`);
    return result;
  });

  const report = renderReport(results);
  const outPath = resolve(import.meta.dirname, '..', 'link-report.md');
  writeFileSync(outPath, report, 'utf8');

  const failing = results.filter((r) => r.verdict !== 'ok');
  console.log(`\nwrote ${outPath} — ${failing.length} of ${results.length} need attention`);

  if (process.env.GITHUB_OUTPUT) {
    const { appendFileSync } = await import('node:fs');
    appendFileSync(process.env.GITHUB_OUTPUT, `failing=${failing.length}\n`);
  }

  process.exit(failing.length > 0 ? 1 : 0);
}

// Only run when invoked directly, so the pure helpers above can be unit tested.
const invokedDirectly =
  process.argv[1] !== undefined && resolve(process.argv[1]) === resolve(import.meta.filename);

if (invokedDirectly) void main();

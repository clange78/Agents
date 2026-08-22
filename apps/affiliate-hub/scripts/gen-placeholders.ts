/**
 * Generates a neutral placeholder at /public/img/deals/{slug}.webp for any deal
 * that does not have a real photograph yet, so the grid renders truthfully
 * instead of showing broken images.
 *
 * Replace these with real photography before launch. Never hotlink a merchant
 * CDN to avoid the work — most programmes forbid it.
 */
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { dealSchema } from '../lib/schema';
import { z } from 'zod';

const PAPER = '#edf0ea';
const INK = '#16211d';
const MUTE = '#6b7a72';

const dir = resolve(import.meta.dirname, '..', 'public', 'img', 'deals');
mkdirSync(dir, { recursive: true });

const deals = z
  .array(dealSchema)
  .parse(JSON.parse(readFileSync(resolve(import.meta.dirname, '..', 'content', 'deals.json'), 'utf8')));

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

let written = 0;
for (const deal of deals) {
  const file = resolve(dir, `${deal.slug}.webp`);
  if (existsSync(file) && !process.argv.includes('--force')) continue;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000">
  <rect width="800" height="1000" fill="${PAPER}"/>
  <rect x="40" y="40" width="720" height="920" fill="none" stroke="${MUTE}" stroke-opacity="0.35" stroke-width="2"/>
  <text x="400" y="470" text-anchor="middle" font-family="Georgia, serif" font-size="150" fill="${INK}" fill-opacity="0.28">${escape(
    deal.brand.slice(0, 2).toUpperCase(),
  )}</text>
  <text x="400" y="560" text-anchor="middle" font-family="monospace" font-size="26" letter-spacing="4" fill="${MUTE}">${escape(
    deal.brand.toUpperCase().slice(0, 24),
  )}</text>
  <text x="400" y="612" text-anchor="middle" font-family="monospace" font-size="19" letter-spacing="2" fill="${MUTE}" fill-opacity="0.75">PHOTO PENDING</text>
</svg>`;

  await sharp(Buffer.from(svg)).webp({ quality: 82 }).toFile(file);
  written += 1;
}

console.log(`placeholders: wrote ${written}, skipped ${deals.length - written} existing`);

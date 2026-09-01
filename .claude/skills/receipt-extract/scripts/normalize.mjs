#!/usr/bin/env node
/**
 * normalize.mjs — dedupe + validate extracted receipts, emit QuickBooks-ready CSV.
 *
 * Usage:
 *   node normalize.mjs receipts.json [--outdir ./out] [--window 2]
 *
 * Input: JSON array of raw extraction objects:
 *   { date, vendor, description, amount, category, paymentMethod,
 *     last4, reference, sourceMessageId, confidence }
 *
 * amount is the absolute value spent (positive). Expenses are written to CSV
 * as NEGATIVE, matching the QuickBooks transaction-import contract.
 *
 * Outputs:
 *   receipts.csv   — clean rows, ready to reconcile or import
 *   review.csv     — rows needing a human decision (with a reason)
 *   duplicates.csv — suppressed near-duplicate charges, with what they matched
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const COLUMNS = [
  'date', 'vendor', 'description', 'amount', 'category',
  'payment_method', 'last4', 'reference', 'source_message_id', 'confidence',
];

// Suffixes stripped when deciding whether two vendor strings are the same payee.
const VENDOR_NOISE = /\b(inc|llc|ltd|corp|co|company|com|technologies|labs|platforms)\b/g;

function normalizeVendor(raw) {
  return String(raw ?? '')
    .toLowerCase()
    .replace(/[.,'"()\[\]]/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(VENDOR_NOISE, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Money as integer cents — never compare floats. */
function toCents(raw) {
  if (raw === null || raw === undefined || raw === '') return null;
  const cleaned = String(raw).replace(/[$,\s]/g, '');
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return Math.round(Math.abs(n) * 100);
}

function toISODate(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  const ms = Math.abs(new Date(a + 'T00:00:00Z') - new Date(b + 'T00:00:00Z'));
  return ms / 86_400_000;
}

/** Richer record wins a duplicate contest: more populated fields, then longer reference. */
function richness(r) {
  const filled = [r.reference, r.last4, r.paymentMethod, r.category, r.description]
    .filter((v) => v !== null && v !== undefined && String(v).trim() !== '').length;
  return filled * 100 + String(r.reference ?? '').length;
}

function validate(rec) {
  const reasons = [];
  const date = toISODate(rec.date);
  const cents = toCents(rec.amount);
  const vendor = String(rec.vendor ?? '').trim();

  if (!date) reasons.push('missing or unparseable date');
  if (cents === null) reasons.push('missing or unparseable amount');
  if (cents === 0) reasons.push('amount is zero');
  if (!vendor) reasons.push('missing vendor');
  if (rec.confidence === 'low') reasons.push('extractor flagged low confidence');
  if (rec.needsReview) reasons.push(String(rec.needsReview));

  return { date, cents, vendor, reasons };
}

function csvCell(v) {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCSV(rows, columns) {
  return [columns.join(','), ...rows.map((r) => columns.map((c) => csvCell(r[c])).join(','))]
    .join('\n') + '\n';
}

function main() {
  const args = process.argv.slice(2);
  const inputPath = args.find((a) => !a.startsWith('--'));
  if (!inputPath) {
    console.error('usage: node normalize.mjs <receipts.json> [--outdir DIR] [--window DAYS]');
    process.exit(2);
  }
  const outdir = args.includes('--outdir') ? args[args.indexOf('--outdir') + 1] : '.';
  const window = args.includes('--window') ? Number(args[args.indexOf('--window') + 1]) : 2;

  let raw;
  try {
    raw = JSON.parse(readFileSync(inputPath, 'utf8'));
  } catch (err) {
    console.error(`could not read ${inputPath}: ${err.message}`);
    process.exit(1);
  }
  if (!Array.isArray(raw)) {
    console.error('input must be a JSON array of receipt objects');
    process.exit(1);
  }

  const clean = [];
  const review = [];

  for (const rec of raw) {
    const { date, cents, vendor, reasons } = validate(rec);
    if (reasons.length) {
      review.push({
        date: rec.date ?? '', vendor: rec.vendor ?? '', description: rec.description ?? '',
        amount: rec.amount ?? '', source_message_id: rec.sourceMessageId ?? '',
        reason: reasons.join('; '),
      });
      continue;
    }
    clean.push({
      date, cents, vendor,
      key: normalizeVendor(vendor),
      description: rec.description ?? vendor,
      category: rec.category ?? '',
      paymentMethod: rec.paymentMethod ?? '',
      last4: rec.last4 ?? '',
      reference: rec.reference ?? '',
      sourceMessageId: rec.sourceMessageId ?? '',
      confidence: rec.confidence ?? 'medium',
    });
  }

  // Dedupe: same payee + same cents + dates within `window` days = one charge
  // billed twice (e.g. a processor receipt AND a merchant receipt).
  clean.sort((a, b) => a.date.localeCompare(b.date));
  const kept = [];
  const duplicates = [];

  for (const rec of clean) {
    const match = kept.find(
      (k) => k.key === rec.key && k.cents === rec.cents && daysBetween(k.date, rec.date) <= window,
    );
    if (!match) {
      kept.push(rec);
      continue;
    }
    // Keep whichever record carries more detail; demote the other.
    const [winner, loser] = richness(rec) > richness(match) ? [rec, match] : [match, rec];
    if (winner !== match) kept[kept.indexOf(match)] = winner;
    duplicates.push({
      date: loser.date, vendor: loser.vendor, amount: (loser.cents / 100).toFixed(2),
      source_message_id: loser.sourceMessageId,
      matched_source_message_id: winner.sourceMessageId,
      matched_date: winner.date,
      note: `same payee and amount within ${window} day(s) — suppressed as a duplicate charge`,
    });
  }

  const rows = kept.map((r) => ({
    date: r.date,
    vendor: r.vendor,
    description: r.description,
    amount: (-r.cents / 100).toFixed(2), // expenses are negative
    category: r.category,
    payment_method: r.paymentMethod,
    last4: r.last4,
    reference: r.reference,
    source_message_id: r.sourceMessageId,
    confidence: r.confidence,
  }));

  mkdirSync(outdir, { recursive: true });
  writeFileSync(join(outdir, 'receipts.csv'), toCSV(rows, COLUMNS));
  writeFileSync(join(outdir, 'review.csv'), toCSV(review,
    ['date', 'vendor', 'description', 'amount', 'source_message_id', 'reason']));
  writeFileSync(join(outdir, 'duplicates.csv'), toCSV(duplicates,
    ['date', 'vendor', 'amount', 'source_message_id', 'matched_source_message_id', 'matched_date', 'note']));

  const total = rows.reduce((sum, r) => sum + Math.abs(Number(r.amount)), 0);
  console.log(`input rows      : ${raw.length}`);
  console.log(`clean receipts  : ${rows.length}  (total $${total.toFixed(2)})`);
  console.log(`duplicates      : ${duplicates.length}  -> duplicates.csv`);
  console.log(`needs review    : ${review.length}  -> review.csv`);
  console.log(`written to      : ${outdir}/receipts.csv`);
}

main();

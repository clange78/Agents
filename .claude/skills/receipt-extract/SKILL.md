---
name: receipt-extract
description: Extract expense receipts from Gmail, categorize them by date and vendor, dedupe double-billed charges, and produce a QuickBooks-ready CSV for reconciliation or import. Use when the user wants to pull receipts out of email, prepare expenses for bookkeeping, reconcile against QuickBooks, or get ready for taxes.
---

# Receipt extraction → QuickBooks

Pulls expense receipts out of Gmail, normalizes them, and emits a CSV that lines
up against a QuickBooks bank feed. Built for **sureshotvideo@gmail.com** paired
with the **Sure Shot Video Solutions** QuickBooks company.

Read `references/vendors.md` before running — it carries the sender fingerprints
and exclusion rules derived from this specific inbox.

## The problem this solves

A naive search for `subject:receipt OR subject:invoice` over 90 days of this
inbox returns ~201 threads, and **roughly 85% of them are not expenses**. They
are QuickBooks notifications for invoices *sent to customers* (Navco, Rae
Security) — accounts receivable that is already in QuickBooks. Importing them
would inflate expenses with revenue.

Two more traps confirmed in this inbox:

- **Double-billed receipts.** ClickFunnels sends two receipts for one charge —
  one from Stripe (`receipts+…@stripe.com`) and one from `payments.ai`, same
  amount, one day apart. Importing both double-books every month.
- **PDF-only amounts.** Meta and IONOS put the amount *only* in a PDF
  attachment. The email body contains no number at all.

## Procedure

### 1. Scope the run

Confirm with the user: date range, and whether the output is for
**reconciliation** (CSV to match by hand — the safe default) or **import**
(write into QuickBooks). Never import without an explicit go-ahead.

### 2. Search — vendor pass, then discovery pass

**Pass A (precision).** Query the known senders in `references/vendors.md`
directly. This is where the real expenses are; it produces almost no noise.

**Pass B (recall).** Catch new vendors:

```
{subject:receipt subject:invoice subject:"order confirmation" "amount paid" "total charged"}
  -from:quickbooks@notification.intuit.com
  after:YYYY/MM/DD before:YYYY/MM/DD
```

Anything Pass B surfaces that is not already a known vendor gets triaged by the
tests in step 3, and — once confirmed — added to `references/vendors.md`.

### 3. Filter out what is not an expense

Drop a message if **any** of these hold:

- Sender is `quickbooks@notification.intuit.com` **and** the recipient is a
  customer domain, not `sureshotvideo@gmail.com` → an invoice *he sent*. AR.
- Subject starts `Payment received: Invoice #` → customer revenue, already in QB.
- Subject is `New payment request from Sure Shot Video Solutions` → outbound AR.
- No amount **and** no order/invoice reference anywhere → marketing. Real
  offenders here: `hi@everydaydose.com` ("I'm the guy packing your order"),
  `no-reply@business.amazon.com` ("Add a backup payment").

The load-bearing test: **a receipt names a vendor, a date, and an amount he
paid.** Missing the amount does not mean guess — it means route to review.

### 4. Extract

Fetch each surviving message with `messageFormat: PLAIN_TEXT`. Vendors fall
into three classes (see `references/vendors.md` for which is which):

- **Class A — body-parseable.** Stripe, payments.ai, Google Play, Algotels,
  Lamarque Ford. Amount and date sit in clean labelled lines, e.g.
  `Amount paid\n$106.70` / `Date paid\nAug 18, 2026`.
- **Class B — PDF-only.** Meta (`Statement_<id>.pdf`) only. The body has no
  number. The Gmail connector exposes no attachment-download tool, so unless one
  is available, emit the row with `amount: null` and
  `needsReview: "amount is in PDF attachment only"` and let the user key it from
  Meta Ads Manager → Billing. Never infer it. Check `references/vendors.md`
  before assuming a vendor is PDF-only — IONOS looks like one and is not.
- **Class C — unknown sender.** Extract what is legible, set
  `confidence: "low"`, and let review catch it.

Build one JSON array of objects shaped like:

```json
{ "date": "Aug 18, 2026", "vendor": "Clickfunnels",
  "description": "Clickfunnels subscription", "amount": "$106.70",
  "category": "Dues & Subscriptions", "paymentMethod": "card", "last4": "8796",
  "reference": "1996-1326", "sourceMessageId": "1a0176e57f7058dd",
  "confidence": "high" }
```

`amount` is the positive figure paid. The script flips the sign.

### 5. Normalize, dedupe, emit

```bash
node .claude/skills/receipt-extract/scripts/normalize.mjs receipts.json --outdir ./out
```

Writes three files:

- `receipts.csv` — clean rows, amounts negative, ready to reconcile or import
- `duplicates.csv` — suppressed double-billings, each naming what it matched
- `review.csv` — rows a human must resolve, each with a reason

Dedupe rule: same normalized payee + identical amount + dates within 2 days =
one charge. The record carrying more detail wins; the other is logged, not
deleted. Widen with `--window N` if a processor lags further behind.

**Always show the user `duplicates.csv` and `review.csv`.** A silent suppression
is a bookkeeping error waiting to happen.

### 6. Match against QuickBooks

Match on **amount + date window first, vendor as tiebreaker** — bank feed
descriptors rarely match email vendor names (`CLICKFUNNELS.COM` vs
`Clickfunnels`). Sort each row into: matched, in Gmail but not QuickBooks
(missing entry), or in QuickBooks but not Gmail (no receipt on file — the ones
that matter at audit time).

To write into QuickBooks, use `quickbooks_transaction_import` with negative
amounts and `context.payee` set to the vendor. Import only rows from
`receipts.csv`, only after the user approves, and never rows from `review.csv`.

## Rules

- Never invent an amount, date, or vendor. Unknown → `review.csv`.
- Never import to QuickBooks without explicit approval in that same session.
- Outbound invoices are revenue, not expenses. When in doubt, check who the
  message was addressed to.
- Report totals honestly: state the clean total, the review count, and the
  suppressed-duplicate count together. A clean-looking total that hides eight
  unresolved rows is a false result.

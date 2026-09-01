# Vendor fingerprints — sureshotvideo@gmail.com

Verified against a full extraction of Jun 1 – Sep 1 2026. Amounts below are the
figures actually observed, useful as a sanity check on future runs. Add new
vendors as Pass B surfaces them; this file is what keeps Pass A precise.

## Class A — amount is in the email body

| Vendor | Sender | Subject pattern | Cadence | Observed | Category |
|---|---|---|---|---|---|
| ClickFunnels | `receipts+…@stripe.com` | `Your Clickfunnels receipt [#NNNN-NNNN]` | monthly, 18th | $106.70 | Dues & Subscriptions |
| ClickFunnels *(dup)* | `noreply@payments.ai` | `Receipt NO. N` | monthly, 19th | $106.70 | **suppress — see below** |
| Emergent Labs | `invoice+statements+acct_1QMlxNIhzbhimiMI@stripe.com` | `Your receipt from EMERGENT LABS INC #…` | monthly, 12th | $20.00 | Dues & Subscriptions |
| AWeber | `invoice+statements@aweber.com` | `Your receipt from AWeber #…` | monthly, 1st | $55.00 | Dues & Subscriptions |
| IONOS | `noreply@ionos.com` | `Your IONOS Invoice … Has Arrived` | monthly, 6th | $3.06 | Dues & Subscriptions |
| Google Play | `googleplay-noreply@google.com` | `Your Google Play Order Receipt from …` | monthly, 8th | $2.18 | Dues & Subscriptions |
| Algotels | `donotreply@algotels.com` | `Your Algotels Receipt #…` | one-off | $357.96 | Travel |
| Lamarque Ford | `noreply@lamarqueford.com` | `Lamarque Ford Receipt` | one-off | $97.89 | Auto — confirm service vs. parts |

Parsing notes:

- **Stripe-family** (ClickFunnels, Emergent Labs, AWeber) — `Amount paid\n$106.70`
  and `Date paid\nAug 18, 2026`, or inline `Receipt from X $20.00 Paid August 12, 2026`.
- **IONOS** — the body *does* carry `Invoice amount:\n$3.06` even though it also
  attaches a PDF. Parse the body; the attachment is redundant.
- **Google Play** — take `Total: $2.18/month`, not the `$1.99` line item; the
  difference is sales tax.
- **Lamarque Ford** — arrives as raw HTML that survives PLAIN_TEXT conversion.
  Take the `Amount:` row, not `Original Amount:` (both `$97.89` here, but they
  diverge when a surcharge applies).
- **Algotels** — take `Paid` ($357.96), not the `2 rooms x 1 night` subtotal
  ($314.00); the difference is taxes and fees.

## Class B — amount is ONLY in a PDF attachment

| Vendor | Sender | Subject pattern | Attachment | Category |
|---|---|---|---|---|
| Meta / Facebook Ads | `noreply@facebookmail.com` | `RE: Meta Invoice <id>` | `Statement_<id>.pdf` | Advertising |

The body is boilerplate with **no figures at all** — only "Attached is your self
accounted document in relation to Meta activity."

**Known limitation:** the Gmail connector in this environment exposes no
attachment-download tool (`get_message` returns attachment *ids* and filenames,
not bytes). `messageFormat: RAW` would inline the base64 PDF, but these messages
run ~1.4 MB each and will exhaust context. So Meta rows land in `review.csv`
until the amounts are keyed by hand from Meta Ads Manager → Billing, or an
attachment tool becomes available. **Never estimate them.** Meta bills roughly
twice a month, so expect ~2 rows/month unaccounted for.

## Exclude — outbound accounts receivable

All from `quickbooks@notification.intuit.com`. These are invoices Craig **sent**;
the money flows toward him and is already booked in QuickBooks.

- `Invoice - Reminder: Your payment to Sure Shot Video Solutions is due`
- `New payment request from Sure Shot Video Solutions - invoice <PO>`
- `Payment received: Invoice #<id>-(<Customer>)`

Recipient domains that confirm outbound: `navco.com`, `raesecurity.com`.
Customer replies (`invoices@navco.com`) land in the same threads — also not
expenses.

**Scale:** 90 days of `subject:receipt OR subject:invoice` returned ~201 threads.
Excluding this sender alone dropped it to 35.

## Exclude — matches receipt language but is not a receipt

| Sender | Example subject | Tell |
|---|---|---|
| `hi@everydaydose.com` | `I'm the guy packing your order.` | no amount, no order number |
| `no-reply@business.amazon.com` | `Add a backup payment to avoid order disruptions` | account notice |
| `googleplay-noreply@google.com` | `Updates to Google Play Terms of Service` | policy notice from a receipt sender |
| `donotreply@algotels.com` | `Booking Confirmed: Your stay at …` | confirmation for booking 13472439, **already receipted** — would double-count |

Note the last two: a vendor on the Class A list still sends non-receipt mail.
Sender alone never qualifies a message; the amount test decides.

## Known duplicate pair

ClickFunnels bills **once** but emails **twice**:

| Source | Subject | Date | Amount |
|---|---|---|---|
| Stripe | `Your Clickfunnels receipt [#1996-1326]` | Aug 18 | $106.70 |
| payments.ai | `Receipt NO. 13` | Aug 19 | $106.70 |

Confirmed across June (`#1075-7265` / NO. 11), July (`#1827-7431` / NO. 12), and
August (`#1996-1326` / NO. 13). The 2-day dedup window catches this and keeps the
Stripe row (richer reference plus card last4).

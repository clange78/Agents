# Vendor fingerprints — sureshotvideo@gmail.com

Derived from a live scan of Jun–Aug 2026. Add new vendors here as Pass B
surfaces them; this file is what keeps Pass A precise.

## Class A — amount is in the email body

| Vendor | Sender | Subject pattern | Cadence | Category |
|---|---|---|---|---|
| ClickFunnels | `receipts+…@stripe.com` | `Your Clickfunnels receipt [#NNNN-NNNN]` | monthly, ~18th, $106.70 | Dues & Subscriptions |
| ClickFunnels *(dup)* | `noreply@payments.ai` | `Receipt NO. N` | monthly, ~19th | **suppress — see below** |
| Emergent Labs | `invoice+statements+acct_…@stripe.com` | `Your receipt from EMERGENT LABS INC #…` | monthly, ~12th | Dues & Subscriptions |
| AWeber | `invoice+statements@aweber.com` | `Your receipt from AWeber #…` | monthly, ~1st | Dues & Subscriptions |
| Google Play | `googleplay-noreply@google.com` | `Your Google Play Order Receipt from …` | monthly, ~8th | Software |
| Algotels | `donotreply@algotels.com` | `Your Algotels Receipt #…` | one-off | Travel |
| Lamarque Ford | `noreply@lamarqueford.com` | `Lamarque Ford Receipt` | one-off | Auto — confirm repair vs. purchase |

Stripe bodies parse cleanly:

```
Amount paid
$106.70

Date paid
Aug 18, 2026, 6:30:21 PM

Payment method
- 8796
```

## Class B — amount is ONLY in a PDF attachment

| Vendor | Sender | Subject pattern | Attachment | Category |
|---|---|---|---|---|
| Meta / Facebook Ads | `noreply@facebookmail.com` | `RE: Meta Invoice <id>` | `Statement_<id>.pdf` | Advertising |
| IONOS | `noreply@ionos.com` | `Your IONOS Invoice … Has Arrived` | invoice PDF | Software |

Both bodies are boilerplate with **no figures at all** — Meta's reads only
"Attached is your self accounted document in relation to Meta activity."
Download and read the PDF, or route to `review.csv`. Never estimate.

Meta bills roughly twice a month, so expect ~2 rows/month, not 1.

## Exclude — outbound accounts receivable

All from `quickbooks@notification.intuit.com`. These are invoices Craig **sent**;
the money flows toward him and is already booked in QuickBooks.

- `Invoice - Reminder: Your payment to Sure Shot Video Solutions is due`
- `New payment request from Sure Shot Video Solutions - invoice <PO>`
- `Payment received: Invoice #<id>-(<Customer>)`

Recipient domains that confirm outbound: `navco.com`, `raesecurity.com`.
Customer replies (`invoices@navco.com`) land in the same threads — also not
expenses.

**Scale of the problem:** 90 days of `subject:receipt OR subject:invoice`
returned ~201 threads. Excluding this sender alone dropped it to 35.

## Exclude — marketing that mimics receipt language

| Sender | Example subject | Tell |
|---|---|---|
| `hi@everydaydose.com` | `I'm the guy packing your order.` | no amount, no order number |
| `no-reply@business.amazon.com` | `Add a backup payment to avoid order disruptions` | account notice, not a purchase |
| `hi@everydaydose.com` | `Your order could be free` | promotional |

These match `subject:"your order"` and slip through Pass B. The amount test
catches all of them.

## Known duplicate pair

ClickFunnels bills **once** but emails **twice**:

| Source | Subject | Date | Amount |
|---|---|---|---|
| Stripe | `Your Clickfunnels receipt [#1996-1326]` | Aug 18 | $106.70 |
| payments.ai | `Receipt NO. 13` | Aug 19 | $106.70 |

Confirmed across June (`#1075-7265` / NO. 11), July (`#1827-7431` / NO. 12), and
August (`#1996-1326` / NO. 13). The normalizer's 2-day window catches this
automatically and keeps the Stripe row (richer reference and card last4).

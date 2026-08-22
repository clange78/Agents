export const site = {
  name: 'The Short List',
  tagline: 'Hand-picked. Used first. Linked honestly.',
  /** Set NEXT_PUBLIC_SITE_URL in the environment before the first production deploy. */
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com').replace(/\/$/, ''),
  author: 'the newsletter',
  /** Base sub-ID stamped on every outbound click (spec §4). */
  subIdBase: 'rwc',
  disclosureShort: 'Some links here earn me a commission. It never changes your price.',
  /** Required verbatim by the Amazon Associates Operating Agreement. Do not reword. */
  amazonDisclosure: 'As an Amazon Associate I earn from qualifying purchases.',
} as const;

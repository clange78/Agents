/** Prices are set in mono so they read as data, not as hype. */
export function Price({
  price,
  wasPrice,
  code,
  amazon = false,
}: {
  price?: number;
  wasPrice?: number;
  code?: string;
  /** Amazon prices may only come from the PA API, so we never print one. */
  amazon?: boolean;
}) {
  if (amazon) {
    return (
      <p className="font-mono text-sm text-mute">
        Price at Amazon
        {code && (
          <span className="mt-2 block border border-gold/45 bg-gold/10 px-2 py-1 text-[11px] tracking-wider text-gold uppercase">
            Code: {code}
          </span>
        )}
      </p>
    );
  }

  if (price === undefined && !code) return null;

  const fmt = (n: number) =>
    n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
  const off = price !== undefined && wasPrice ? Math.round(((wasPrice - price) / wasPrice) * 100) : null;

  return (
    <div className="font-mono text-sm">
      {price !== undefined && (
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-ink">{fmt(price)}</span>
          {wasPrice && (
            <span className="text-mute line-through decoration-1">was {fmt(wasPrice)}</span>
          )}
          {off !== null && off > 0 && <span className="text-gold">-{off}%</span>}
        </div>
      )}
      {code && (
        <p className="mt-2">
          <span className="inline-block border border-gold/45 bg-gold/10 px-2 py-1 text-[11px] tracking-wider text-gold uppercase">
            Code: {code}
          </span>
        </p>
      )}
    </div>
  );
}

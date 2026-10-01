const nf = (digits: number) =>
  new Intl.NumberFormat('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export function formatNumber(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '—';
  const formatted = nf(digits).format(value);
  const rounded = Number(formatted.replace(/,/g, ''));
  if (rounded === 0) return nf(digits).format(0);
  return formatted;
}

export function formatMoney(value: number, currency = '$', digits = 2): string {
  if (!Number.isFinite(value)) return '—';
  const magnitude = formatNumber(Math.abs(value), digits);
  const isZero = Number(magnitude.replace(/,/g, '')) === 0;
  return `${value < 0 && !isZero ? '-' : ''}${currency}${magnitude}`;
}

export function formatPercent(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return '—';
  return `${formatNumber(value * 100, digits)}%`;
}

export function texNumber(value: number, digits = 2): string {
  return formatNumber(value, digits).replace(/,/g, '{,}');
}

export function texMoney(value: number, currency = '$', digits = 2): string {
  if (!Number.isFinite(value)) return '\\text{n/a}';
  const symbol = currency === '$' ? '\\$' : currency;
  const magnitude = texNumber(Math.abs(value), digits);
  const isZero = Number(formatNumber(Math.abs(value), digits).replace(/,/g, '')) === 0;
  return `${value < 0 && !isZero ? '-' : ''}${symbol}${magnitude}`;
}

export function texPlain(value: number, digits = 4): string {
  if (!Number.isFinite(value)) return '\\text{n/a}';
  return String(Number(value.toFixed(digits)));
}

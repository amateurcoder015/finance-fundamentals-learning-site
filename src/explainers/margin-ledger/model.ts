export type Side = 'long' | 'short';
export type LedgerStatus = 'opened' | 'open' | 'call' | 'liquidated';

export interface LedgerInputs {
  entryPrice: number;
  /** Daily settlement prices for Day 1, Day 2, ... */
  prices: number[];
  lotSize: number;
  side: Side;
  initialMargin: number;
  maintenanceMargin: number;
  /** When false, an unmet margin call leads to liquidation at the start of the next day. */
  meetCalls: boolean;
}

export interface LedgerRow {
  day: number;
  price: number;
  change: number;
  mtm: number;
  /** Variation margin deposited at the start of the day (to meet the previous day's call). */
  deposit: number;
  endBalance: number;
  /** Amount demanded at the end of this day (balance below maintenance), else 0. */
  marginCall: number;
  status: LedgerStatus;
  note: string;
}

/** The chapter's worked example: long 1 contract, lot 100, entry $50, initial $500, maintenance $350. */
export const MARGIN_EXAMPLE: LedgerInputs = {
  entryPrice: 50,
  prices: [52, 47, 49],
  lotSize: 100,
  side: 'long',
  initialMargin: 500,
  maintenanceMargin: 350,
  meetCalls: true,
};

const fin = (x: number): number => (Number.isFinite(x) ? x : 0);

export function buildLedger(i: LedgerInputs): LedgerRow[] {
  const sign = i.side === 'long' ? 1 : -1;
  const rows: LedgerRow[] = [
    { day: 0, price: fin(i.entryPrice), change: 0, mtm: 0, deposit: 0, endBalance: fin(i.initialMargin), marginCall: 0, status: 'opened', note: 'Position opened, initial margin posted' },
  ];
  const initialMargin = fin(i.initialMargin);
  const maintenanceMargin = fin(i.maintenanceMargin);
  const lotSize = fin(i.lotSize);
  let balance = initialMargin;
  let prevPrice = fin(i.entryPrice);
  let pendingCall = 0;

  for (let d = 0; d < i.prices.length; d++) {
    const day = d + 1;
    const price = fin(i.prices[d]);

    if (pendingCall > 0 && !i.meetCalls) {
      rows.push({ day, price: prevPrice, change: 0, mtm: 0, deposit: 0, endBalance: balance, marginCall: 0, status: 'liquidated', note: 'Margin call not met: position liquidated' });
      break;
    }

    const deposit = pendingCall;
    const change = price - prevPrice;
    const mtm = sign * change * lotSize + 0; // + 0 normalises -0 to 0
    balance = balance + deposit + mtm;
    const marginCall = balance < maintenanceMargin ? initialMargin - balance : 0;
    const note =
      marginCall > 0
        ? `Below maintenance: margin call for ${marginCall}`
        : mtm > 0
          ? 'Profit credited to the account'
          : mtm < 0
            ? 'Loss debited from the account'
            : 'No change';

    rows.push({ day, price, change, mtm, deposit, endBalance: balance, marginCall, status: marginCall > 0 ? 'call' : 'open', note });
    pendingCall = marginCall;
    prevPrice = price;
  }
  return rows;
}

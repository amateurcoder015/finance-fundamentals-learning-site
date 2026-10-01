import { texMoney, texPlain } from '../../lib/explainer-format';

export type OptionType = 'call' | 'put';

export interface BsInputs {
  spot: number;
  strike: number;
  /** Continuously compounded risk-free rate as a fraction. */
  rate: number;
  /** Volatility as a fraction (0.2 = 20%). */
  vol: number;
  /** Time to expiry in years. */
  time: number;
}

/** theta is per year, vega per 1.00 of volatility, rho per 1.00 of rate (the UI rescales for display). */
export interface Greeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export function normPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/**
 * Standard normal CDF (Hart's double-precision algorithm as published by West, 2005).
 * Verified against reference values to 1e-10 in tests; if a coefficient is wrong the tests fail.
 */
export function normCdf(x: number): number {
  const abs = Math.abs(x);
  let cnd: number;
  if (abs > 37) {
    cnd = 0;
  } else {
    const exponential = Math.exp((-abs * abs) / 2);
    if (abs < 7.07106781186547) {
      let build = 3.52624965998911e-2 * abs + 0.700383064443688;
      build = build * abs + 6.37396220353165;
      build = build * abs + 33.912866078383;
      build = build * abs + 112.079291497871;
      build = build * abs + 221.213596169931;
      build = build * abs + 220.206867912376;
      cnd = exponential * build;
      build = 8.83883476483184e-2 * abs + 1.75566716318264;
      build = build * abs + 16.064177579207;
      build = build * abs + 86.7807322029461;
      build = build * abs + 296.564248779674;
      build = build * abs + 637.333633378831;
      build = build * abs + 793.826512519948;
      build = build * abs + 440.413735824752;
      cnd = cnd / build;
    } else {
      let build = abs + 0.65;
      build = abs + 4 / build;
      build = abs + 3 / build;
      build = abs + 2 / build;
      build = abs + 1 / build;
      cnd = exponential / build / 2.506628274631;
    }
  }
  return x > 0 ? 1 - cnd : cnd;
}

const isDegenerate = (i: BsInputs) => i.time <= 0 || i.vol <= 0 || i.spot <= 0 || i.strike <= 0;

function d1d2(i: BsInputs): { d1: number; d2: number } {
  const sqrtT = Math.sqrt(i.time);
  const d1 = (Math.log(i.spot / i.strike) + (i.rate + (i.vol * i.vol) / 2) * i.time) / (i.vol * sqrtT);
  return { d1, d2: d1 - i.vol * sqrtT };
}

export function bsPrice(i: BsInputs, type: OptionType): number {
  const disc = Math.exp(-i.rate * Math.max(0, i.time));
  if (isDegenerate(i)) {
    // At expiry the option is worth intrinsic value; with zero volatility it is worth the discounted forward payoff.
    const forward = i.time <= 0 ? i.spot - i.strike : i.spot - i.strike * disc;
    const call = Math.max(0, forward);
    const put = Math.max(0, -forward);
    return type === 'call' ? call : put;
  }
  const { d1, d2 } = d1d2(i);
  return type === 'call'
    ? i.spot * normCdf(d1) - i.strike * disc * normCdf(d2)
    : i.strike * disc * normCdf(-d2) - i.spot * normCdf(-d1);
}

export function bsGreeks(i: BsInputs, type: OptionType): Greeks {
  if (isDegenerate(i)) {
    const itm = type === 'call' ? i.spot > i.strike : i.spot < i.strike;
    const disc = Math.exp(-i.rate * Math.max(0, i.time));
    const delta = itm ? (type === 'call' ? 1 : -1) : 0;
    const carry = itm && i.time > 0 ? i.rate * i.strike * disc : 0;
    const rho = itm ? (type === 'call' ? 1 : -1) * i.strike * Math.max(0, i.time) * disc : 0;
    return { delta, gamma: 0, theta: type === 'call' ? -carry : carry, vega: 0, rho };
  }
  const { d1, d2 } = d1d2(i);
  const sqrtT = Math.sqrt(i.time);
  const disc = Math.exp(-i.rate * i.time);
  const pdf = normPdf(d1);
  const gamma = pdf / (i.spot * i.vol * sqrtT);
  const vega = i.spot * pdf * sqrtT;
  const decay = -(i.spot * pdf * i.vol) / (2 * sqrtT);
  if (type === 'call') {
    return {
      delta: normCdf(d1),
      gamma,
      theta: decay - i.rate * i.strike * disc * normCdf(d2),
      vega,
      rho: i.strike * i.time * disc * normCdf(d2),
    };
  }
  return {
    delta: normCdf(d1) - 1,
    gamma,
    theta: decay + i.rate * i.strike * disc * normCdf(-d2),
    vega,
    rho: -i.strike * i.time * disc * normCdf(-d2),
  };
}

export function bsFormulaTex(i: BsInputs, type: OptionType, currency = '$'): string {
  const price = bsPrice(i, type);
  if (isDegenerate(i)) {
    return `V = ${texMoney(price, currency)} \\quad \\text{(at expiry or with no volatility the option is worth its intrinsic value)}`;
  }
  const { d1, d2 } = d1d2(i);
  const head = `d_1 = \\frac{\\ln(S/K)+(r+\\sigma^2/2)T}{\\sigma\\sqrt{T}} = ${texPlain(d1, 4)},\\quad d_2 = d_1-\\sigma\\sqrt{T} = ${texPlain(d2, 4)}`;
  const body =
    type === 'call'
      ? `C = S\\,N(d_1) - K e^{-rT} N(d_2) = ${texMoney(price, currency)}`
      : `P = K e^{-rT} N(-d_2) - S\\,N(-d_1) = ${texMoney(price, currency)}`;
  return `\\begin{aligned}${head}\\\\ ${body}\\end{aligned}`;
}

export interface ParityInputs {
  spot: number;
  strike: number;
  rate: number;
  time: number;
  call: number;
  put: number;
}

export type ParityStatus = 'aligned' | 'call-side-rich' | 'put-side-rich';

export interface ParityResult {
  /** C + K e^{-rT} */
  callSide: number;
  /** P + S */
  putSide: number;
  deviation: number;
  status: ParityStatus;
  action: string;
}

/** The chapter's worked example: S = K = 100, r = 5%, T = 1 year, call premium $8.00 (fair put $3.12). */
export const OPTION_EXAMPLE: ParityInputs = { spot: 100, strike: 100, rate: 0.05, time: 1, call: 8, put: 3.12 };

const presentValueOfStrike = (strike: number, rate: number, time: number) => strike * Math.exp(-rate * Math.max(0, time));

export function impliedPut(call: number, spot: number, strike: number, rate: number, time: number): number {
  return call + presentValueOfStrike(strike, rate, time) - spot;
}

export function impliedCall(put: number, spot: number, strike: number, rate: number, time: number): number {
  return put + spot - presentValueOfStrike(strike, rate, time);
}

export function parityCheck(i: ParityInputs, tolerance = 0.005): ParityResult {
  const callSide = i.call + presentValueOfStrike(i.strike, i.rate, i.time);
  const putSide = i.put + i.spot;
  const deviation = callSide - putSide;
  if (Math.abs(deviation) <= tolerance) {
    return { callSide, putSide, deviation, status: 'aligned', action: 'No arbitrage: both sides cost the same.' };
  }
  if (deviation > 0) {
    return {
      callSide,
      putSide,
      deviation,
      status: 'call-side-rich',
      action: 'Sell the call and borrow the present value of the strike; buy the put and the stock.',
    };
  }
  return {
    callSide,
    putSide,
    deviation,
    status: 'put-side-rich',
    action: 'Sell the put and the stock; buy the call and lend the present value of the strike.',
  };
}

export function extent(values: number[]): [number, number] {
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length === 0) return [0, 1];
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  if (min === max) {
    const pad = Math.abs(min) * 0.1 || 1;
    return [min - pad, max + pad];
  }
  return [min, max];
}

export function linearScale(domain: [number, number], range: [number, number]): (x: number) => number {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  if (d0 === d1) return () => (r0 + r1) / 2;
  return (x) => r0 + ((x - d0) / (d1 - d0)) * (r1 - r0);
}

export function niceTicks(min: number, max: number, count = 5): number[] {
  if (!(max > min) || count <= 0) return [min];
  const raw = (max - min) / Math.max(1, count);
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
  const normalised = raw / magnitude;
  const step = (normalised <= 1 ? 1 : normalised <= 2 ? 2 : normalised <= 5 ? 5 : 10) * magnitude;
  if (!Number.isFinite(step) || step === 0) return [min];
  const start = Math.ceil(min / step - 1e-9) * step;
  const ticks: number[] = [];
  const n = Math.min(Math.floor((max - start) / step + 1e-9), 1000);
  for (let i = 0; i <= n; i++) {
    const v = start + i * step;
    ticks.push(Number(v.toPrecision(12)) + 0);
  }
  return ticks;
}

export function linePath(points: Array<[number, number]>): string {
  const segments: string[] = [];
  let isFirstInSubpath = true;
  for (const [x, y] of points) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      isFirstInSubpath = true;
      continue;
    }
    segments.push(`${isFirstInSubpath ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`);
    isFirstInSubpath = false;
  }
  return segments.join(' ');
}

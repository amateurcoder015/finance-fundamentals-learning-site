import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Slider } from '../src/components/explainer/kit/Slider';
import { Readout } from '../src/components/explainer/kit/Readout';
import { FormulaBlock } from '../src/components/explainer/kit/FormulaBlock';
import { ChartFrame } from '../src/components/explainer/kit/ChartFrame';
import { ExampleBar } from '../src/components/explainer/kit/ExampleBar';
import { Tabs } from '../src/components/explainer/kit/Tabs';
import { ExplainerFrame } from '../src/components/explainer/kit/ExplainerFrame';

const noop = () => {};

describe('Slider', () => {
  it('renders a labelled range and a number field', () => {
    const html = renderToStaticMarkup(<Slider label="Rate" value={8} min={0} max={30} step={0.1} onChange={noop} suffix="%" />);
    expect(html).toContain('Rate');
    expect(html).toContain('type="range"');
    expect(html).toContain('type="number"');
    expect(html).toContain('aria-valuetext="8%"');
  });
  it('uses the supplied formatter for the readable value', () => {
    const html = renderToStaticMarkup(<Slider label="Years" value={5} min={0} max={40} step={1} onChange={noop} format={(v) => `${v} yr`} />);
    expect(html).toContain('5 yr');
  });
});

describe('Readout', () => {
  it('renders every item as a term/definition pair', () => {
    const html = renderToStaticMarkup(<Readout items={[{ label: 'Future value', value: '$14,693.28' }, { label: 'Interest', value: '$4,693.28', tone: 'positive' }]} />);
    expect(html).toContain('<dl');
    expect(html).toContain('Future value');
    expect(html).toContain('$14,693.28');
    expect(html).toContain('$4,693.28');
  });
});

describe('FormulaBlock', () => {
  it('renders KaTeX markup', () => {
    const html = renderToStaticMarkup(<FormulaBlock tex="x^2 + 1" />);
    expect(html).toContain('katex');
  });
  it('does not throw on invalid TeX', () => {
    expect(() => renderToStaticMarkup(<FormulaBlock tex="\\frac{" />)).not.toThrow();
  });
});

describe('ChartFrame', () => {
  const series = [
    { id: 'a', label: 'Balance', points: [[0, 100], [1, 120], [2, 150]] as Array<[number, number]>, tone: 'rust' as const },
    { id: 'b', label: 'Invested', points: [[0, 100], [2, 100]] as Array<[number, number]>, tone: 'muted' as const, dashed: true },
  ];
  it('renders paths, the summary caption and a data table', () => {
    const html = renderToStaticMarkup(<ChartFrame series={series} xLabel="Years" yLabel="Value" summary="Balance grows from 100 to 150." />);
    expect(html).toContain('<path');
    expect(html).toContain('Balance grows from 100 to 150.');
    expect(html).toContain('<details');
    expect(html).toContain('<table');
    expect(html).toContain('role="img"');
  });
  it('renders without crashing for a single constant point', () => {
    const html = renderToStaticMarkup(<ChartFrame series={[{ id: 'a', label: 'A', points: [[1, 5]] }]} xLabel="x" yLabel="y" summary="One point." />);
    expect(html).not.toContain('NaN');
  });
  it('renders markers', () => {
    const html = renderToStaticMarkup(<ChartFrame series={series} xLabel="x" yLabel="y" summary="s" markers={[{ x: 1, label: 'Today' }]} />);
    expect(html).toContain('Today');
  });
});

describe('ChartFrame robustness', () => {
  it('keeps out-of-range markers inside the plot area', () => {
    const html = renderToStaticMarkup(
      <ChartFrame series={[{ id: 'a', label: 'A', points: [[0, 1], [2, 3]] }]} xLabel="x" yLabel="y" summary="s" markers={[{ x: 50, label: 'Far' }]} />,
    );
    expect(html).toContain('Far');
    const m = html.match(/<line x1="([\d.]+)"[^>]*stroke-dasharray="4 4"/);
    expect(m).not.toBeNull();
    const x1 = Number(m![1]);
    expect(x1).toBeGreaterThanOrEqual(68);
    expect(x1).toBeLessThanOrEqual(640 - 20);
  });
  it('does not emit duplicate key warnings for duplicate x values', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderToStaticMarkup(
      <ChartFrame series={[{ id: 'a', label: 'A', points: [[1, 1], [1, 2], [1, 3]] }]} xLabel="x" yLabel="y" summary="s" markers={[{ x: 1, label: 'M' }, { x: 1, label: 'M' }]} tableRows={1} />,
    );
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('ExampleBar', () => {
  it('renders each example and a Reset button', () => {
    const html = renderToStaticMarkup(<ExampleBar examples={[{ label: 'Chapter example', apply: noop }, { label: 'With dividends', apply: noop }]} />);
    expect(html).toContain('Chapter example');
    expect(html).toContain('With dividends');
    expect(html).toContain('Reset');
  });
});

describe('Tabs', () => {
  it('renders a tablist with the active tab selected', () => {
    const html = renderToStaticMarkup(
      <Tabs tabs={[{ id: 'a', label: 'One' }, { id: 'b', label: 'Two' }]} active="b" onChange={noop}>
        <p>Panel content</p>
      </Tabs>,
    );
    expect(html).toContain('role="tablist"');
    expect(html).toContain('role="tabpanel"');
    expect(html).toMatch(/aria-selected="true"[^>]*>Two|>Two<[^]*aria-selected="true"/);
    expect(html).toContain('Panel content');
  });
});

describe('ExplainerFrame', () => {
  it('renders the title as a heading and its children', () => {
    const html = renderToStaticMarkup(<ExplainerFrame title="Time value of money"><p>Body</p></ExplainerFrame>);
    expect(html).toContain('<h3');
    expect(html).toContain('Time value of money');
    expect(html).toContain('Body');
  });
});

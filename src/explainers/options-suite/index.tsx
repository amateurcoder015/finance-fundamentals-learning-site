import React, { useState } from 'react';
import { ExplainerFrame } from '../../components/explainer/kit/ExplainerFrame';
import { Tabs } from '../../components/explainer/kit/Tabs';
import type { ExplainerProps } from '../types';
import { PayoffView } from './PayoffView';
import { GreeksView } from './GreeksView';
import { ParityView } from './ParityView';

const TABS = [
  { id: 'payoff', label: 'Strategy payoff' },
  { id: 'greeks', label: 'Price and Greeks' },
  { id: 'parity', label: 'Put-call parity' },
];

function Inner({ view, currency }: { view?: string; currency: string }) {
  const [active, setActive] = useState(TABS.some((t) => t.id === view) ? (view as string) : 'payoff');
  return (
    <Tabs
      tabs={TABS}
      active={active}
      onChange={setActive}
      panels={{
        payoff: <PayoffView currency={currency} />,
        greeks: <GreeksView currency={currency} />,
        parity: <ParityView currency={currency} />,
      }}
    />
  );
}

export default function OptionsSuite({ view, currency = '$' }: ExplainerProps) {
  return (
    <ExplainerFrame title="Options explorer" description="Build a strategy, price an option and see its Greeks, and check put-call parity.">
      <Inner view={view} currency={currency} />
    </ExplainerFrame>
  );
}

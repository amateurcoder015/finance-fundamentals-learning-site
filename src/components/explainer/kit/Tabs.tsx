import React, { useId } from 'react';

export interface TabItem {
  id: string;
  label: string;
}

export const Tabs: React.FC<{
  tabs: TabItem[];
  active: string;
  onChange: (id: string) => void;
  children?: React.ReactNode;
  /** When provided, every tab gets its own panel that stays mounted and is hidden while inactive. */
  panels?: Record<string, React.ReactNode>;
}> = ({ tabs, active, onChange, children, panels }) => {
  const base = useId();
  const onKeyDown = (e: React.KeyboardEvent) => {
    const i = tabs.findIndex((t) => t.id === active);
    let next = i;
    if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    else return;
    e.preventDefault();
    onChange(tabs[next].id);
    document.getElementById(`${base}-tab-${tabs[next].id}`)?.focus();
  };

  return (
    <div>
      <div role="tablist" aria-label="Views" onKeyDown={onKeyDown} className="mb-5 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              id={`${base}-tab-${tab.id}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={panels ? `${base}-panel-${tab.id}` : `${base}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.id)}
              className={`inline-flex min-h-[44px] items-center rounded-full border px-5 font-sans text-sm font-bold ${
                selected ? 'border-ink bg-ink text-on-accent' : 'border-rule bg-paper text-ink hover:border-ink/40'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {panels ? (
        tabs.map((tab) => (
          <div key={tab.id} id={`${base}-panel-${tab.id}`} role="tabpanel" aria-labelledby={`${base}-tab-${tab.id}`} hidden={tab.id !== active}>
            {panels[tab.id]}
          </div>
        ))
      ) : (
        <div id={`${base}-panel`} role="tabpanel" aria-labelledby={`${base}-tab-${active}`}>
          {children}
        </div>
      )}
    </div>
  );
};

export default Tabs;

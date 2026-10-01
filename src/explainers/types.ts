export interface ExplainerProps {
  view?: string;
  currency?: string;
}

export interface ExplainerMeta {
  title: string;
  views?: readonly string[];
}

/** A line on a chart, produced by pure models and drawn by the chart kit. */
export interface ModelSeries {
  id: string;
  label: string;
  points: Array<[number, number]>;
  tone?: 'ink' | 'rust' | 'success' | 'danger' | 'muted';
  dashed?: boolean;
}

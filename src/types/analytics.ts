export type AnalyticsSource = 'borrowings' | 'fines' | 'inventory' | 'members' | 'reservations';

export type AnalyticsOperator = 'equals' | 'not_equals' | 'contains' | 'gte' | 'lte';

export type AnalyticsMetric =
  'count' | 'distinct_members' | 'distinct_books' | 'sum_amount' | 'average_amount';

export interface AnalyticsFilter {
  field: string;
  operator: AnalyticsOperator;
  value: string;
}

export interface AnalyticsDefinition {
  source: AnalyticsSource;
  dateFrom?: string;
  dateTo?: string;
  filters: AnalyticsFilter[];
  metric: AnalyticsMetric;
  groupBy?: string;
  limit?: number;
}

export interface AnalyticsCatalogField {
  key: string;
  label: string;
  type: 'text' | 'date' | 'number';
  operators: AnalyticsOperator[];
}

export interface AnalyticsCatalogSource {
  key: AnalyticsSource;
  label: string;
  description: string;
  dateLabel: string;
  fields: AnalyticsCatalogField[];
  metrics: { key: AnalyticsMetric; label: string }[];
  groups: { key: string; label: string }[];
}

export interface AnalyticsResultRow {
  label: string;
  value: number;
}

export interface AnalyticsResult {
  definition: AnalyticsDefinition;
  sourceLabel: string;
  metricLabel: string;
  groupLabel: string;
  rowCount: number;
  total: number;
  rows: AnalyticsResultRow[];
  generatedAt: string;
}

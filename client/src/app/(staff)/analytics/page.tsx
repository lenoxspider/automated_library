'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  BarChart3,
  Download,
  FileJson,
  Filter,
  LineChart as LineChartIcon,
  Play,
  Plus,
  Save,
  Search,
  Trash2,
  X
} from 'lucide-react';
import api from '../../../lib/api';
import Card from '../../../components/ui/Card';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { useThemeStore } from '../../../store/themeStore';
type AnalyticsSource = 'borrowings' | 'fines' | 'inventory' | 'members' | 'reservations';
type AnalyticsMetric =
  'count' | 'distinct_members' | 'distinct_books' | 'sum_amount' | 'average_amount';
type AnalyticsOperator = 'equals' | 'not_equals' | 'contains' | 'gte' | 'lte';
type AnalyticsFilter = { field: string; operator: AnalyticsOperator; value: string };
type AnalyticsDefinition = {
  source: AnalyticsSource;
  dateFrom?: string;
  dateTo?: string;
  filters: AnalyticsFilter[];
  metric: AnalyticsMetric;
  groupBy?: string;
  limit?: number;
};
type AnalyticsCatalogField = {
  key: string;
  label: string;
  type: 'text' | 'date' | 'number';
  operators: AnalyticsOperator[];
};
type AnalyticsCatalogSource = {
  key: AnalyticsSource;
  label: string;
  description: string;
  dateLabel: string;
  fields: AnalyticsCatalogField[];
  metrics: { key: AnalyticsMetric; label: string }[];
  groups: { key: string; label: string }[];
};
type AnalyticsResult = {
  definition: AnalyticsDefinition;
  sourceLabel: string;
  metricLabel: string;
  groupLabel: string;
  rowCount: number;
  total: number;
  rows: { label: string; value: number }[];
  generatedAt: string;
};

const colors = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7', '#ec4899'];
const operatorLabels: Record<AnalyticsOperator, string> = {
  equals: 'is',
  not_equals: 'is not',
  contains: 'contains',
  gte: 'at least',
  lte: 'at most'
};

function controlClass(dark: boolean) {
  return dark
    ? 'w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none transition focus:border-indigo-500'
    : 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-indigo-500';
}

function defaultMetric(source: AnalyticsCatalogSource): AnalyticsMetric {
  return source.metrics[0]?.key ?? 'count';
}

function defaultGroup(source: AnalyticsCatalogSource) {
  return source.groups[0]?.key ?? '';
}

export default function AnalyticsPage() {
  const queryClient = useQueryClient();
  const { dark } = useThemeStore();
  const [source, setSource] = useState<AnalyticsSource>('borrowings');
  const [metric, setMetric] = useState<AnalyticsMetric>('count');
  const [groupBy, setGroupBy] = useState('borrow_date_day');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filters, setFilters] = useState<AnalyticsFilter[]>([]);
  const [result, setResult] = useState<AnalyticsResult | null>(null);
  const [chartType, setChartType] = useState<'auto' | 'bar' | 'line' | 'pie'>('auto');
  const [saveName, setSaveName] = useState('');
  const [error, setError] = useState('');

  const { data: catalogEnvelope, isLoading: catalogLoading } = useQuery<{
    data: AnalyticsCatalogSource[];
  }>({
    queryKey: ['analytics-catalog'],
    queryFn: async () => (await api.get('/analytics/catalog')).data
  });
  const { data: savedEnvelope, isLoading: savedLoading } = useQuery<{ data: any[] }>({
    queryKey: ['analytics-saved'],
    queryFn: async () => (await api.get('/analytics/saved')).data
  });

  const catalog = catalogEnvelope?.data ?? [];
  const activeSource = catalog.find((item) => item.key === source);
  const definition: AnalyticsDefinition = useMemo(
    () => ({
      source,
      metric,
      groupBy: groupBy || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      filters,
      limit: 25
    }),
    [source, metric, groupBy, dateFrom, dateTo, filters]
  );

  const runMutation = useMutation({
    mutationFn: async (nextDefinition: AnalyticsDefinition) =>
      (await api.post('/analytics/query', nextDefinition)).data.data as AnalyticsResult,
    onSuccess: (data) => {
      setResult(data);
      setError('');
    },
    onError: (err: any) => setError(err?.response?.data?.error ?? 'Unable to run this report.')
  });

  const saveMutation = useMutation({
    mutationFn: async () =>
      (await api.post('/analytics/saved', { name: saveName, definition })).data,
    onSuccess: () => {
      setSaveName('');
      queryClient.invalidateQueries({ queryKey: ['analytics-saved'] });
    },
    onError: (err: any) => setError(err?.response?.data?.error ?? 'Unable to save this report.')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/analytics/saved/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['analytics-saved'] })
  });

  const runSavedMutation = useMutation({
    mutationFn: async (id: number) =>
      (await api.post(`/analytics/saved/${id}/run`)).data.data as AnalyticsResult,
    onSuccess: (data) => {
      setResult(data);
      setError('');
    },
    onError: (err: any) => setError(err?.response?.data?.error ?? 'Unable to run the saved report.')
  });

  const setSourceAndReset = (nextSource: AnalyticsSource) => {
    const next = catalog.find((item) => item.key === nextSource);
    setSource(nextSource);
    if (next) {
      setMetric(defaultMetric(next));
      setGroupBy(defaultGroup(next));
      setFilters([]);
    }
    setResult(null);
  };

  const addFilter = () => {
    const field = activeSource?.fields[0];
    if (!field) return;
    setFilters((current) => [
      ...current,
      { field: field.key, operator: field.operators[0] ?? 'equals', value: '' }
    ]);
  };

  const updateFilter = (index: number, patch: Partial<AnalyticsFilter>) => {
    setFilters((current) =>
      current.map((filter, position) => (position === index ? { ...filter, ...patch } : filter))
    );
  };

  const removeFilter = (index: number) =>
    setFilters((current) => current.filter((_, position) => position !== index));

  const download = async (format: 'csv' | 'json' | 'pdf') => {
    try {
      const response = await api.post(`/analytics/export/${format}`, definition, {
        responseType: 'blob'
      });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `smartlib-analytics.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? `Unable to export ${format.toUpperCase()}.`);
    }
  };

  const chart = useMemo(() => {
    if (!result?.rows.length) return null;
    const inferred = result.definition.groupBy?.endsWith('_day') ? 'line' : 'bar';
    const activeChart = chartType === 'auto' ? inferred : chartType;
    const common = { data: result.rows, margin: { top: 10, right: 20, left: 0, bottom: 20 } };
    if (activeChart === 'pie') {
      return (
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={result.rows}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              outerRadius={105}
              label
            >
              {result.rows.map((row, index) => (
                <Cell key={row.label} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      );
    }
    if (activeChart === 'line') {
      return (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart {...common}>
            <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#334155' : '#e2e8f0'} />
            <XAxis dataKey="label" stroke={dark ? '#94a3b8' : '#64748b'} tick={{ fontSize: 11 }} />
            <YAxis stroke={dark ? '#94a3b8' : '#64748b'} allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#818cf8" strokeWidth={3} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      );
    }
    return (
      <ResponsiveContainer width="100%" height={320}>
        <BarChart {...common}>
          <CartesianGrid strokeDasharray="3 3" stroke={dark ? '#334155' : '#e2e8f0'} />
          <XAxis
            dataKey="label"
            stroke={dark ? '#94a3b8' : '#64748b'}
            tick={{ fontSize: 11 }}
            interval={0}
            angle={-25}
            textAnchor="end"
            height={65}
          />
          <YAxis stroke={dark ? '#94a3b8' : '#64748b'} allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="value" fill="#6366f1" radius={[5, 5, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }, [chartType, result]);

  if (catalogLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-400">
            Decision support
          </p>
          <h1
            style={{ color: dark ? '#f1f5f9' : '#111827' }}
            className="flex items-center gap-3 text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-100"
          >
            <BarChart3 className="text-indigo-600 dark:text-indigo-400" /> Analytics
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-600 dark:text-slate-400">
            Build governed, ad-hoc reports from SmartLib data. Ask questions such as daily borrowing
            volume, lost copies between dates, overdue members, or the most borrowed titles this
            semester.
          </p>
        </div>
        <div
          style={{ color: dark ? '#c7d2fe' : '#3730a3' }}
          className="rounded-lg border border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 px-4 py-3 text-xs text-indigo-700 dark:text-indigo-200"
        >
          Read-only reporting surface · queries are logged
        </div>
      </div>

      {error && (
        <div className="flex items-start justify-between rounded-lg border border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-200">
          <span>{error}</span>
          <button onClick={() => setError('')} aria-label="Dismiss error">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <Card className="border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 p-0 text-gray-900 dark:text-slate-100">
          <div className="border-b border-gray-200 dark:border-slate-700 p-5">
            <h2
              style={{ color: dark ? '#f1f5f9' : '#111827' }}
              className="flex items-center gap-2 text-lg font-semibold"
            >
              <Search size={18} className="text-indigo-600 dark:text-indigo-400" /> Query builder
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
              Choose a data source, metric, grouping, and optional filters.
            </p>
          </div>
          <div className="space-y-5 p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label
                style={{ color: dark ? '#cbd5e1' : '#374151' }}
                className="text-sm text-gray-700 dark:text-slate-300"
              >
                Data source
                <select
                  value={source}
                  onChange={(event) => setSourceAndReset(event.target.value as AnalyticsSource)}
                  className={controlClass(dark)}
                >
                  {catalog.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label
                style={{ color: dark ? '#cbd5e1' : '#374151' }}
                className="text-sm text-gray-700 dark:text-slate-300"
              >
                Metric
                <select
                  value={metric}
                  onChange={(event) => setMetric(event.target.value as AnalyticsMetric)}
                  className={controlClass(dark)}
                >
                  {activeSource?.metrics.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label
                style={{ color: dark ? '#cbd5e1' : '#374151' }}
                className="text-sm text-gray-700 dark:text-slate-300"
              >
                Group results by
                <select
                  value={groupBy}
                  onChange={(event) => setGroupBy(event.target.value)}
                  className={controlClass(dark)}
                >
                  <option value="">No grouping (single total)</option>
                  {activeSource?.groups.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  style={{ color: dark ? '#cbd5e1' : '#374151' }}
                  className="text-sm text-gray-700 dark:text-slate-300"
                >
                  From
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(event) => setDateFrom(event.target.value)}
                    className={controlClass(dark)}
                  />
                </label>
                <label
                  style={{ color: dark ? '#cbd5e1' : '#374151' }}
                  className="text-sm text-gray-700 dark:text-slate-300"
                >
                  To
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(event) => setDateTo(event.target.value)}
                    className={controlClass(dark)}
                  />
                </label>
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-white dark:bg-slate-900/60 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span
                  style={{ color: dark ? '#e2e8f0' : '#1f2937' }}
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <Filter size={16} className="text-indigo-600 dark:text-indigo-400" /> Filters
                </span>
                <button
                  onClick={addFilter}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-300 hover:text-indigo-700 dark:text-indigo-200"
                >
                  <Plus size={14} /> Add filter
                </button>
              </div>
              {filters.length === 0 ? (
                <p className="text-xs text-gray-500 dark:text-slate-500">
                  No additional filters. Date filters above are optional.
                </p>
              ) : (
                <div className="space-y-3">
                  {filters.map((filter, index) => {
                    const field =
                      activeSource?.fields.find((item) => item.key === filter.field) ??
                      activeSource?.fields[0];
                    return (
                      <div
                        key={`${filter.field}-${index}`}
                        className="grid gap-2 md:grid-cols-[1fr_1fr_1.2fr_auto]"
                      >
                        <select
                          value={filter.field}
                          onChange={(event) => updateFilter(index, { field: event.target.value })}
                          className={controlClass(dark)}
                        >
                          {activeSource?.fields.map((item) => (
                            <option key={item.key} value={item.key}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                        <select
                          value={filter.operator}
                          onChange={(event) =>
                            updateFilter(index, {
                              operator: event.target.value as AnalyticsOperator
                            })
                          }
                          className={controlClass(dark)}
                        >
                          {field?.operators.map((operator) => (
                            <option key={operator} value={operator}>
                              {operatorLabels[operator]}
                            </option>
                          ))}
                        </select>
                        <input
                          value={filter.value}
                          onChange={(event) => updateFilter(index, { value: event.target.value })}
                          placeholder="Enter a value"
                          className={controlClass(dark)}
                        />
                        <button
                          onClick={() => removeFilter(index)}
                          className="rounded-lg border border-gray-200 dark:border-slate-700 px-3 text-gray-600 dark:text-slate-400 hover:border-red-500/50 hover:text-red-300"
                          aria-label="Remove filter"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => runMutation.mutate(definition)}
                disabled={runMutation.isPending}
                className="flex items-center gap-2 rounded-lg bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-wait disabled:opacity-60"
              >
                <Play size={16} /> {runMutation.isPending ? 'Running…' : 'Run report'}
              </button>
              <span className="text-xs text-gray-500 dark:text-slate-500">
                Maximum 5,000 source records per execution
              </span>
            </div>
          </div>
        </Card>

        <Card className="border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 p-0 text-gray-900 dark:text-slate-100">
          <div className="border-b border-gray-200 dark:border-slate-700 p-5">
            <h2
              style={{ color: dark ? '#f1f5f9' : '#111827' }}
              className="flex items-center gap-2 text-lg font-semibold"
            >
              <Save size={18} className="text-emerald-600 dark:text-emerald-400" /> Saved reports
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
              Save useful questions for one-click reuse.
            </p>
          </div>
          <div className="space-y-4 p-5">
            <div className="flex gap-2">
              <input
                value={saveName}
                onChange={(event) => setSaveName(event.target.value)}
                placeholder="e.g. Borrowed books this semester"
                className={controlClass(dark)}
              />
              <button
                onClick={() => saveMutation.mutate()}
                disabled={!saveName.trim() || saveMutation.isPending}
                className="rounded-lg bg-emerald-500 px-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
              >
                <Save size={16} />
              </button>
            </div>
            {savedLoading ? (
              <LoadingSpinner />
            ) : (savedEnvelope?.data ?? []).length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-slate-500">No saved reports yet.</p>
            ) : (
              <div className="space-y-2">
                {(savedEnvelope?.data ?? []).map((saved: any) => (
                  <div
                    key={saved.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 dark:border-slate-700 px-3 py-2"
                  >
                    <button
                      onClick={() => runSavedMutation.mutate(saved.id)}
                      className="min-w-0 flex-1 truncate text-left text-sm text-gray-800 dark:text-slate-200 hover:text-indigo-600 dark:text-indigo-300"
                    >
                      {saved.name}
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(saved.id)}
                      className="text-gray-500 dark:text-slate-500 hover:text-red-300"
                      aria-label={`Delete ${saved.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card className="border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 p-0 text-gray-900 dark:text-slate-100">
        <div className="flex flex-col justify-between gap-3 border-b border-gray-200 dark:border-slate-700 p-5 md:flex-row md:items-center">
          <div>
            <h2 style={{ color: dark ? '#f1f5f9' : '#111827' }} className="text-lg font-semibold">
              Result view
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
              {result
                ? `${result.sourceLabel} · ${result.metricLabel} · grouped by ${result.groupLabel}`
                : 'Run a report to populate the table and visualization.'}
            </p>
          </div>
          {result && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => download('csv')}
                className="flex items-center gap-1 rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-xs font-semibold hover:border-indigo-400"
              >
                <Download size={14} /> CSV
              </button>
              <button
                onClick={() => download('json')}
                className="flex items-center gap-1 rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-xs font-semibold hover:border-indigo-400"
              >
                <FileJson size={14} /> JSON
              </button>
              <button
                onClick={() => download('pdf')}
                className="flex items-center gap-1 rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2 text-xs font-semibold hover:border-indigo-400"
              >
                <Download size={14} /> PDF
              </button>
            </div>
          )}
        </div>
        {!result ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 text-center text-gray-500 dark:text-slate-500">
            <BarChart3 size={42} className="text-gray-300 dark:text-slate-700" />
            <p className="text-sm">Your governed report output will appear here.</p>
          </div>
        ) : (
          <div className="grid gap-6 p-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-white dark:bg-slate-900/50 p-5">
              <div className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-slate-500">
                Total result
              </div>
              <div className="mt-2 text-4xl font-bold text-indigo-600 dark:text-indigo-300">
                {result.total.toLocaleString()}
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-slate-500">
                {result.rowCount} displayed group{result.rowCount === 1 ? '' : 's'} · generated{' '}
                {new Date(result.generatedAt).toLocaleString()}
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  onClick={() => setChartType('auto')}
                  className={`rounded-md px-2 py-1 text-xs ${chartType === 'auto' ? 'bg-indigo-500 text-white' : 'border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400'}`}
                >
                  Auto
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`rounded-md px-2 py-1 text-xs ${chartType === 'bar' ? 'bg-indigo-500 text-white' : 'border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400'}`}
                >
                  <BarChart3 size={12} className="mr-1 inline" />
                  Bar
                </button>
                <button
                  onClick={() => setChartType('line')}
                  className={`rounded-md px-2 py-1 text-xs ${chartType === 'line' ? 'bg-indigo-500 text-white' : 'border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400'}`}
                >
                  <LineChartIcon size={12} className="mr-1 inline" />
                  Line
                </button>
                <button
                  onClick={() => setChartType('pie')}
                  className={`rounded-md px-2 py-1 text-xs ${chartType === 'pie' ? 'bg-indigo-500 text-white' : 'border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400'}`}
                >
                  Pie
                </button>
              </div>
            </div>
            <div className="min-h-[320px]">{chart}</div>
            <div className="overflow-x-auto xl:col-span-2">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 dark:border-slate-700 text-xs uppercase tracking-wide text-gray-500 dark:text-slate-500">
                  <tr>
                    <th className="px-3 py-3">Group</th>
                    <th className="px-3 py-3 text-right">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row) => (
                    <tr key={row.label} className="border-b border-gray-200 dark:border-slate-800">
                      <td className="px-3 py-3 text-gray-700 dark:text-slate-300">{row.label}</td>
                      <td className="px-3 py-3 text-right font-mono text-indigo-600 dark:text-indigo-300">
                        {row.value.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

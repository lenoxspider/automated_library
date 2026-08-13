import { injectable } from 'tsyringe';
import { Prisma } from '@prisma/client';
import { AnalyticsRepository } from '../repositories/analytics.repo';
import prisma from '../config/prisma';
import { addLaplaceNoise } from './dp.service';
import {
  AnalyticsCatalogSource,
  AnalyticsDefinition,
  AnalyticsFilter,
  AnalyticsMetric,
  AnalyticsResult,
  AnalyticsResultRow,
  AnalyticsSource
} from '../types/analytics';

const EPSILON = 1.0;
const MAX_RAW_ROWS = 5000;
const DEFAULT_LIMIT = 25;

const textOperators = ['equals', 'not_equals', 'contains'] as const;
const numberOperators = ['equals', 'not_equals', 'gte', 'lte'] as const;

export const ANALYTICS_CATALOG: AnalyticsCatalogSource[] = [
  {
    key: 'borrowings',
    label: 'Book borrowings',
    description: 'Loan activity, members, books, and library locations.',
    dateLabel: 'Borrow date',
    fields: [
      { key: 'status', label: 'Loan status', type: 'text', operators: [...textOperators] },
      { key: 'member_role', label: 'Member type', type: 'text', operators: [...textOperators] },
      {
        key: 'member_account_status',
        label: 'Account status',
        type: 'text',
        operators: [...textOperators]
      },
      { key: 'book_title', label: 'Book title', type: 'text', operators: [...textOperators] },
      { key: 'author', label: 'Author', type: 'text', operators: [...textOperators] },
      { key: 'genre', label: 'Genre', type: 'text', operators: [...textOperators] },
      { key: 'branch', label: 'Branch', type: 'text', operators: [...textOperators] },
      { key: 'section', label: 'Section', type: 'text', operators: [...textOperators] },
      { key: 'shelf', label: 'Shelf', type: 'text', operators: [...textOperators] }
    ],
    metrics: [
      { key: 'count', label: 'Number of borrowing transactions' },
      { key: 'distinct_members', label: 'Distinct members' },
      { key: 'distinct_books', label: 'Distinct books' }
    ],
    groups: [
      { key: 'borrow_date_day', label: 'Borrow date (day)' },
      { key: 'status', label: 'Loan status' },
      { key: 'member_role', label: 'Member type' },
      { key: 'book_title', label: 'Book title' },
      { key: 'genre', label: 'Genre' },
      { key: 'branch', label: 'Branch' },
      { key: 'section', label: 'Section' }
    ]
  },
  {
    key: 'fines',
    label: 'Fines',
    description: 'Fine records joined to the borrowing, member, book, and location.',
    dateLabel: 'Borrowing due date',
    fields: [
      { key: 'status', label: 'Fine status', type: 'text', operators: [...textOperators] },
      { key: 'member_role', label: 'Member type', type: 'text', operators: [...textOperators] },
      { key: 'book_title', label: 'Book title', type: 'text', operators: [...textOperators] },
      { key: 'genre', label: 'Genre', type: 'text', operators: [...textOperators] },
      { key: 'branch', label: 'Branch', type: 'text', operators: [...textOperators] },
      { key: 'amount', label: 'Fine amount', type: 'number', operators: [...numberOperators] }
    ],
    metrics: [
      { key: 'count', label: 'Number of fines' },
      { key: 'sum_amount', label: 'Total fine amount' },
      { key: 'average_amount', label: 'Average fine amount' },
      { key: 'distinct_members', label: 'Distinct members with fines' }
    ],
    groups: [
      { key: 'due_date_day', label: 'Due date (day)' },
      { key: 'status', label: 'Fine status' },
      { key: 'member_role', label: 'Member type' },
      { key: 'book_title', label: 'Book title' },
      { key: 'branch', label: 'Branch' }
    ]
  },
  {
    key: 'inventory',
    label: 'Inventory copies',
    description: 'Copy status, holdings, locations, and date-aware lost-copy tracking.',
    dateLabel: 'Lost date (only applies to lost copies)',
    fields: [
      { key: 'status', label: 'Copy status', type: 'text', operators: [...textOperators] },
      { key: 'branch', label: 'Branch', type: 'text', operators: [...textOperators] },
      { key: 'section', label: 'Section', type: 'text', operators: [...textOperators] },
      { key: 'shelf', label: 'Shelf', type: 'text', operators: [...textOperators] },
      { key: 'book_title', label: 'Book title', type: 'text', operators: [...textOperators] },
      { key: 'author', label: 'Author', type: 'text', operators: [...textOperators] },
      { key: 'genre', label: 'Genre', type: 'text', operators: [...textOperators] }
    ],
    metrics: [
      { key: 'count', label: 'Number of copies' },
      { key: 'distinct_books', label: 'Distinct books represented' }
    ],
    groups: [
      { key: 'status', label: 'Copy status' },
      { key: 'branch', label: 'Branch' },
      { key: 'section', label: 'Section' },
      { key: 'book_title', label: 'Book title' },
      { key: 'lost_date_day', label: 'Lost date (day)' }
    ]
  },
  {
    key: 'members',
    label: 'Members',
    description: 'Member counts by role, account status, language, and registration date.',
    dateLabel: 'Member registration date',
    fields: [
      { key: 'role', label: 'Role', type: 'text', operators: [...textOperators] },
      {
        key: 'account_status',
        label: 'Account status',
        type: 'text',
        operators: [...textOperators]
      },
      { key: 'language', label: 'Language', type: 'text', operators: [...textOperators] }
    ],
    metrics: [{ key: 'count', label: 'Number of members' }],
    groups: [
      { key: 'role', label: 'Role' },
      { key: 'account_status', label: 'Account status' },
      { key: 'language', label: 'Language' },
      { key: 'created_date_day', label: 'Registration date (day)' }
    ]
  },
  {
    key: 'reservations',
    label: 'Reservations',
    description: 'Reservation demand by status, book, member type, and date.',
    dateLabel: 'Reservation date',
    fields: [
      { key: 'status', label: 'Reservation status', type: 'text', operators: [...textOperators] },
      { key: 'member_role', label: 'Member type', type: 'text', operators: [...textOperators] },
      { key: 'book_title', label: 'Book title', type: 'text', operators: [...textOperators] },
      { key: 'genre', label: 'Genre', type: 'text', operators: [...textOperators] }
    ],
    metrics: [
      { key: 'count', label: 'Number of reservations' },
      { key: 'distinct_members', label: 'Distinct members' },
      { key: 'distinct_books', label: 'Distinct books reserved' }
    ],
    groups: [
      { key: 'reservation_date_day', label: 'Reservation date (day)' },
      { key: 'status', label: 'Reservation status' },
      { key: 'member_role', label: 'Member type' },
      { key: 'book_title', label: 'Book title' }
    ]
  }
];

interface AnalyticsRow {
  id: number;
  memberId?: number;
  bookId?: number;
  date?: Date | null;
  amount?: number;
  values: Record<string, string | number | null | undefined>;
}

export class AnalyticsValidationError extends Error {
  statusCode = 400;
}

function sourceMeta(source: AnalyticsSource) {
  const metadata = ANALYTICS_CATALOG.find((item) => item.key === source);
  if (!metadata) throw new AnalyticsValidationError('Unsupported analytics source.');
  return metadata;
}

function isoDay(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function toDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new AnalyticsValidationError(`Invalid date: ${value}`);
  return date;
}

function valueAsString(value: string | number | null | undefined) {
  return value === null || value === undefined || value === '' ? null : String(value);
}

function matchesFilter(row: AnalyticsRow, filter: AnalyticsFilter) {
  const raw = valueAsString(row.values[filter.field]);
  const expected = filter.value.trim();
  if (raw === null) return false;
  if (filter.operator === 'equals') return raw.toLowerCase() === expected.toLowerCase();
  if (filter.operator === 'not_equals') return raw.toLowerCase() !== expected.toLowerCase();
  if (filter.operator === 'contains') return raw.toLowerCase().includes(expected.toLowerCase());
  const left = Number(raw);
  const right = Number(expected);
  if (Number.isNaN(left) || Number.isNaN(right)) return false;
  return filter.operator === 'gte' ? left >= right : left <= right;
}

function metricValue(rows: AnalyticsRow[], metric: AnalyticsMetric) {
  if (metric === 'distinct_members')
    return new Set(rows.map((row) => row.memberId).filter(Boolean)).size;
  if (metric === 'distinct_books')
    return new Set(rows.map((row) => row.bookId).filter(Boolean)).size;
  if (metric === 'sum_amount') return rows.reduce((sum, row) => sum + (row.amount ?? 0), 0);
  if (metric === 'average_amount') {
    return rows.length ? rows.reduce((sum, row) => sum + (row.amount ?? 0), 0) / rows.length : 0;
  }
  return rows.length;
}

function groupValue(row: AnalyticsRow, groupBy?: string) {
  if (!groupBy) return 'All records';
  if (groupBy.endsWith('_day')) return isoDay(row.date) ?? 'Unknown date';
  return valueAsString(row.values[groupBy]) ?? 'Unspecified';
}

function metricLabel(source: AnalyticsSource, metric: AnalyticsMetric) {
  return sourceMeta(source).metrics.find((item) => item.key === metric)?.label ?? metric;
}

function groupLabel(source: AnalyticsSource, groupBy?: string) {
  return sourceMeta(source).groups.find((item) => item.key === groupBy)?.label ?? 'All records';
}

function validateDefinition(input: AnalyticsDefinition): AnalyticsDefinition {
  const metadata = sourceMeta(input.source);
  const metric = metadata.metrics.some((item) => item.key === input.metric) ? input.metric : null;
  if (!metric)
    throw new AnalyticsValidationError('The selected metric is not available for this source.');
  if (input.groupBy && !metadata.groups.some((item) => item.key === input.groupBy)) {
    throw new AnalyticsValidationError('The selected grouping is not available for this source.');
  }
  const allowedFields = new Set(metadata.fields.map((field) => field.key));
  const filters = Array.isArray(input.filters) ? input.filters : [];
  for (const filter of filters) {
    if (!allowedFields.has(filter.field))
      throw new AnalyticsValidationError(`Unsupported filter field: ${filter.field}`);
    if (!['equals', 'not_equals', 'contains', 'gte', 'lte'].includes(filter.operator)) {
      throw new AnalyticsValidationError(`Unsupported filter operator: ${filter.operator}`);
    }
    if (typeof filter.value !== 'string' || filter.value.trim().length === 0) {
      throw new AnalyticsValidationError('Every Analytics filter needs a value.');
    }
  }
  if (input.dateFrom && input.dateTo && input.dateFrom > input.dateTo) {
    throw new AnalyticsValidationError('The start date must be before the end date.');
  }
  return {
    source: input.source,
    dateFrom: input.dateFrom || undefined,
    dateTo: input.dateTo || undefined,
    filters,
    metric,
    groupBy: input.groupBy || undefined,
    limit: Math.min(Math.max(Number(input.limit) || DEFAULT_LIMIT, 1), 100)
  };
}

@injectable()
export class AnalyticsService {
  constructor(private analyticsRepo: AnalyticsRepository) {}

  async getPopularBooks() {
    const borrowings = await this.analyticsRepo.getBorrowingsWithBookTitles();
    const counts = new Map<string, number>();
    for (const borrowing of borrowings) {
      const title = borrowing.book_copies?.books?.title ?? 'Unknown title';
      counts.set(title, (counts.get(title) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([title, trueCount]) => ({ title, count: addLaplaceNoise(trueCount, EPSILON) }));
  }

  async getPeakSearchTimes() {
    const searches = await this.analyticsRepo.getSearchTimestamps();
    const hourCounts = new Array(24).fill(0);
    for (const search of searches) {
      const hour = new Date(search.timestamp).getHours();
      if (hour >= 0 && hour < 24) hourCounts[hour] += 1;
    }
    return hourCounts.map((trueCount, hour) => ({
      hour,
      label:
        hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`,
      count: addLaplaceNoise(trueCount, EPSILON)
    }));
  }

  async getPublicStats() {
    const [totalBooks, totalUsers, totalReserves] = await Promise.all([
      prisma.books.count(),
      prisma.users.count(),
      prisma.reservations.count()
    ]);
    const uptimeHours = process.uptime() / 3600;
    return {
      totalBooks: addLaplaceNoise(totalBooks, EPSILON),
      totalUsers: addLaplaceNoise(totalUsers, EPSILON),
      totalReserves: addLaplaceNoise(totalReserves, EPSILON),
      uptime: `${Math.min(99.99, 99 + uptimeHours / 24).toFixed(2)}%`,
      search_volume: 0
    };
  }

  getCatalog() {
    return ANALYTICS_CATALOG;
  }

  async runQuery(rawDefinition: AnalyticsDefinition, userId: number): Promise<AnalyticsResult> {
    const definition = validateDefinition(rawDefinition);
    const records = await this.loadRows(definition);
    const filtered = records.filter((row) =>
      definition.filters.every((filter) => matchesFilter(row, filter))
    );
    const grouped = new Map<string, AnalyticsRow[]>();
    for (const row of filtered) {
      const key = groupValue(row, definition.groupBy);
      const group = grouped.get(key) ?? [];
      group.push(row);
      grouped.set(key, group);
    }
    const rows: AnalyticsResultRow[] = Array.from(grouped.entries())
      .map(([label, groupRows]) => ({
        label,
        value: Number(metricValue(groupRows, definition.metric).toFixed(2))
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, definition.limit ?? DEFAULT_LIMIT);
    const result: AnalyticsResult = {
      definition,
      sourceLabel: sourceMeta(definition.source).label,
      metricLabel: metricLabel(definition.source, definition.metric),
      groupLabel: groupLabel(definition.source, definition.groupBy),
      rowCount: rows.length,
      total: Number(metricValue(filtered, definition.metric).toFixed(2)),
      rows,
      generatedAt: new Date().toISOString()
    };
    await this.logQuery(userId, definition, result.rowCount);
    return result;
  }

  async listSavedReports(userId: number) {
    return prisma.saved_reports.findMany({
      where: { owner_id: userId },
      orderBy: { updated_at: 'desc' },
      select: { id: true, name: true, definition: true, created_at: true, updated_at: true }
    });
  }

  async saveReport(userId: number, name: string, definition: AnalyticsDefinition) {
    const normalized = validateDefinition(definition);
    const cleanName = name.trim().slice(0, 120);
    if (!cleanName) throw new AnalyticsValidationError('A saved report needs a name.');
    return prisma.saved_reports.create({
      data: {
        owner_id: userId,
        name: cleanName,
        definition: normalized as unknown as Prisma.InputJsonValue
      },
      select: { id: true, name: true, definition: true, created_at: true, updated_at: true }
    });
  }

  async deleteSavedReport(userId: number, id: number) {
    const deleted = await prisma.saved_reports.deleteMany({ where: { id, owner_id: userId } });
    if (!deleted.count) throw new AnalyticsValidationError('Saved report not found.');
  }

  async runSavedReport(userId: number, id: number) {
    const saved = await prisma.saved_reports.findFirst({ where: { id, owner_id: userId } });
    if (!saved) throw new AnalyticsValidationError('Saved report not found.');
    return this.runQuery(saved.definition as unknown as AnalyticsDefinition, userId);
  }

  private async logQuery(userId: number, definition: AnalyticsDefinition, rowCount: number) {
    try {
      await prisma.audit_logs.create({
        data: {
          admin_id: userId,
          action: 'analytics.query',
          details: JSON.stringify({
            source: definition.source,
            metric: definition.metric,
            groupBy: definition.groupBy,
            rowCount
          }),
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.warn('Unable to log Analytics query:', error);
    }
  }

  private async loadRows(definition: AnalyticsDefinition): Promise<AnalyticsRow[]> {
    const dateFrom = toDate(definition.dateFrom);
    const dateTo = toDate(definition.dateTo);
    const range =
      dateFrom || dateTo
        ? {
            ...(dateFrom ? { gte: dateFrom } : {}),
            ...(dateTo ? { lte: new Date(`${definition.dateTo}T23:59:59.999Z`) } : {})
          }
        : undefined;

    if (definition.source === 'borrowings') {
      const records = await prisma.borrowings.findMany({
        where: range ? { borrow_date: range } : undefined,
        take: MAX_RAW_ROWS,
        include: { users: true, book_copies: { include: { books: true } } }
      });
      return records.map((row) => ({
        id: row.id,
        memberId: row.member_id,
        bookId: row.book_copies.book_id,
        date: row.borrow_date,
        values: {
          status: row.status,
          member_role: row.users.role,
          member_account_status: row.users.account_status,
          book_title: row.book_copies.books.title,
          author: row.book_copies.books.author,
          genre: row.book_copies.books.genre,
          branch: row.book_copies.branch,
          section: row.book_copies.section,
          shelf: row.book_copies.shelf
        }
      }));
    }

    if (definition.source === 'fines') {
      const records = await prisma.fines.findMany({
        take: MAX_RAW_ROWS,
        include: {
          borrowings: { include: { users: true, book_copies: { include: { books: true } } } }
        }
      });
      return records
        .map((row) => ({
          id: row.id,
          memberId: row.borrowings.member_id,
          bookId: row.borrowings.book_copies.book_id,
          date: row.borrowings.due_date,
          amount: row.amount,
          values: {
            status: row.status,
            member_role: row.borrowings.users.role,
            book_title: row.borrowings.book_copies.books.title,
            genre: row.borrowings.book_copies.books.genre,
            branch: row.borrowings.book_copies.branch
          }
        }))
        .filter(
          (row) =>
            (!dateFrom || (row.date && row.date >= dateFrom)) &&
            (!dateTo || (row.date && row.date <= new Date(`${definition.dateTo}T23:59:59.999Z`)))
        );
    }

    if (definition.source === 'inventory') {
      const records = await prisma.book_copies.findMany({
        take: MAX_RAW_ROWS,
        include: { books: true }
      });
      return records
        .map((row) => ({
          id: row.id,
          bookId: row.book_id,
          date: row.lost_at,
          values: {
            status: row.status,
            branch: row.branch,
            section: row.section,
            shelf: row.shelf,
            book_title: row.books.title,
            author: row.books.author,
            genre: row.books.genre
          }
        }))
        .filter((row) => {
          if (!dateFrom && !dateTo) return true;
          return Boolean(
            row.date &&
            (!dateFrom || row.date >= dateFrom) &&
            (!dateTo || row.date <= new Date(`${definition.dateTo}T23:59:59.999Z`))
          );
        });
    }

    if (definition.source === 'members') {
      const records = await prisma.users.findMany({ take: MAX_RAW_ROWS });
      return records
        .map((row) => ({
          id: row.id,
          date: row.created_at,
          values: { role: row.role, account_status: row.account_status, language: row.language }
        }))
        .filter(
          (row) =>
            (!dateFrom || (row.date && row.date >= dateFrom)) &&
            (!dateTo || (row.date && row.date <= new Date(`${definition.dateTo}T23:59:59.999Z`)))
        );
    }

    const records = await prisma.reservations.findMany({
      include: { users: true, books: true },
      take: MAX_RAW_ROWS
    });
    return records
      .map((row) => {
        const parsedDate = new Date(row.reservation_date);
        return {
          id: row.id,
          memberId: row.member_id,
          bookId: row.book_id,
          date: Number.isNaN(parsedDate.getTime()) ? null : parsedDate,
          values: {
            status: row.status,
            member_role: row.users.role,
            book_title: row.books.title,
            genre: row.books.genre
          }
        };
      })
      .filter(
        (row) =>
          (!dateFrom || (row.date && row.date >= dateFrom)) &&
          (!dateTo || (row.date && row.date <= new Date(`${definition.dateTo}T23:59:59.999Z`)))
      );
  }
}

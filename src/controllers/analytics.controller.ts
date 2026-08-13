import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';
import { container } from 'tsyringe';
import { AnalyticsService, AnalyticsValidationError } from '../services/analytics.service';
import { AnalyticsDefinition } from '../types/analytics';

const analyticsService = container.resolve(AnalyticsService);

function userId(req: Request) {
  const id = Number((req as any).user?.id);
  if (!Number.isInteger(id) || id <= 0)
    throw new AnalyticsValidationError('Authenticated user is required.');
  return id;
}

function definitionFromBody(body: any): AnalyticsDefinition {
  if (!body || typeof body !== 'object')
    throw new AnalyticsValidationError('Analytics definition is required.');
  return {
    source: body.source,
    dateFrom: body.dateFrom,
    dateTo: body.dateTo,
    filters: Array.isArray(body.filters) ? body.filters : [],
    metric: body.metric,
    groupBy: body.groupBy || undefined,
    limit: body.limit
  } as AnalyticsDefinition;
}

export const getPopularBooks = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await analyticsService.getPopularBooks());
});

export const getPeakSearchTimes = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await analyticsService.getPeakSearchTimes());
});

export const getPublicStats = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await analyticsService.getPublicStats());
});

export const getCatalog = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ data: analyticsService.getCatalog() });
});

export const runQuery = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await analyticsService.runQuery(definitionFromBody(req.body), userId(req)) });
});

export const exportCsv = asyncHandler(async (req: Request, res: Response) => {
  const result = await analyticsService.runQuery(definitionFromBody(req.body), userId(req));
  const parser = new Parser({ fields: ['label', 'value'] });
  const csv = parser.parse(result.rows);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="smartlib-analytics.csv"');
  res.send(csv);
});

export const exportPdf = asyncHandler(async (req: Request, res: Response) => {
  const result = await analyticsService.runQuery(definitionFromBody(req.body), userId(req));
  const document = new PDFDocument({ margin: 40 });
  const chunks: Buffer[] = [];
  document.on('data', (chunk: Buffer) => chunks.push(chunk));
  const completed = new Promise<Buffer>((resolve, reject) => {
    document.on('end', () => resolve(Buffer.concat(chunks)));
    document.on('error', reject);
  });
  document.fontSize(18).text('SmartLib Analytics Report');
  document
    .moveDown(0.5)
    .fontSize(10)
    .text(`${result.sourceLabel} | ${result.metricLabel} | ${result.groupLabel}`);
  document.moveDown().fontSize(13).text(`Total: ${result.total}`);
  document.moveDown().fontSize(10);
  result.rows.forEach((row, index) => document.text(`${index + 1}. ${row.label}: ${row.value}`));
  document.end();
  const pdf = await completed;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="smartlib-analytics.pdf"');
  res.send(pdf);
});

export const exportJson = asyncHandler(async (req: Request, res: Response) => {
  const result = await analyticsService.runQuery(definitionFromBody(req.body), userId(req));
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="smartlib-analytics.json"');
  res.json(result);
});

export const listSavedReports = asyncHandler(async (req: Request, res: Response) => {
  res.json({ data: await analyticsService.listSavedReports(userId(req)) });
});

export const saveReport = asyncHandler(async (req: Request, res: Response) => {
  const saved = await analyticsService.saveReport(
    userId(req),
    String(req.body?.name ?? ''),
    definitionFromBody(req.body?.definition)
  );
  res.status(201).json({ data: saved });
});

export const deleteSavedReport = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new AnalyticsValidationError('Invalid saved report id.');
  await analyticsService.deleteSavedReport(userId(req), id);
  res.status(204).send();
});

export const runSavedReport = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw new AnalyticsValidationError('Invalid saved report id.');
  res.json({ data: await analyticsService.runSavedReport(userId(req), id) });
});

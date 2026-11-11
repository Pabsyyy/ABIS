import { Request, Response } from 'express';
import { generateReport, dashboardSummary, ReportFilters } from '../services/reportService';
import { reportPdfBuffer } from '../services/pdfService';
import { getSettingsSingleton } from '../services/controlNumberService';
import { buildTableExcel } from '../services/excelService';

export async function dashboardSummaryController(_req: Request, res: Response): Promise<void> {
  const summary = await dashboardSummary();
  res.json({ success: true, data: summary });
}

function parseFilters(query: Record<string, unknown>): ReportFilters {
  const filters: ReportFilters = {};
  if (typeof query.dateFrom === 'string' && query.dateFrom) filters.dateFrom = new Date(query.dateFrom);
  if (typeof query.dateTo === 'string' && query.dateTo) filters.dateTo = new Date(query.dateTo);
  if (typeof query.purok === 'string' && query.purok) filters.purok = query.purok;
  if (typeof query.classification === 'string' && query.classification) filters.classification = query.classification;
  return filters;
}

export async function generateReportController(req: Request, res: Response): Promise<void> {
  const type = String(req.params.type);
  const filters = parseFilters(req.query as Record<string, unknown>);
  try {
    const report = await generateReport(type, filters);
    res.json({ success: true, data: report });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown report type';
    res.status(400).json({ success: false, message });
  }
}

export async function exportReportController(req: Request, res: Response): Promise<void> {
  const type = String(req.params.type);
  const format = String(req.query.format ?? 'xlsx');
  const filters = parseFilters(req.query as Record<string, unknown>);

  let report;
  try {
    report = await generateReport(type, filters);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown report type';
    res.status(400).json({ success: false, message });
    return;
  }

  const filterText = [
    filters.dateFrom ? `From ${filters.dateFrom.toISOString().slice(0, 10)}` : null,
    filters.dateTo ? `To ${filters.dateTo.toISOString().slice(0, 10)}` : null,
    filters.purok ? `Purok ${filters.purok}` : null,
    filters.classification ? `Classification ${filters.classification}` : null,
  ].filter(Boolean).join(' · ');

  if (format === 'pdf') {
    const settings = await getSettingsSingleton();
    const pdf = await reportPdfBuffer({
      settings,
      title: report.title,
      subtitle: report.subtitle,
      filters: filterText || undefined,
      columns: report.columns,
      rows: report.rows,
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-report.pdf"`);
    res.send(pdf);
    return;
  }

  const excel = await buildTableExcel(report.title, report.rows);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${type}-report.xlsx"`);
  res.send(excel);
}

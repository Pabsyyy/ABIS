'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { notify } from '@/lib/notify';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Field, Select } from '@/components/ui/select';
import { PageHeader } from '@/components/ui/page-header';
import { Loader2, FileSpreadsheet, FileDown, Printer, RefreshCw } from 'lucide-react';

interface Classification {
  key: string;
  label: string;
}

interface ReportData {
  title: string;
  subtitle: string;
  columns: { key: string; label: string }[];
  rows: Record<string, string | number>[];
}

const REPORT_TYPES = [
  { value: 'population', label: 'Resident Population' },
  { value: 'demographic', label: 'Demographic (Age Group)' },
  { value: 'household', label: 'Households' },
  { value: 'classification', label: 'Resident Classification' },
  { value: 'certificate_requests', label: 'Certificate Requests' },
  { value: 'issued_certificates', label: 'Issued Certificates' },
  { value: 'services', label: 'Service Monitoring' },
];

export default function ReportsPage() {
  const [type, setType] = useState('population');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [purok, setPurok] = useState('');
  const [classification, setClassification] = useState('');
  const [puroks, setPuroks] = useState<string[]>([]);
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ name: string }[]>('/api/residents/puroks').then((res) => res.success && res.data && setPuroks(res.data.map((p) => p.name)));
    api<Classification[]>('/api/residents/classifications').then((res) => res.success && res.data && setClassifications(res.data));
  }, []);

  const queryString = useCallback(() => {
    const params = new URLSearchParams();
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    if (purok) params.set('purok', purok);
    if (classification) params.set('classification', classification);
    return params.toString();
  }, [dateFrom, dateTo, purok, classification]);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await api<ReportData>(`/api/reports/${type}?${queryString()}`);
    if (!res.success || !res.data) {
      const message = res.message ?? 'Failed to generate report';
      setError(message);
      notify.error(message);
      setReport(null);
    } else {
      setReport(res.data);
    }
    setLoading(false);
  }, [type, queryString]);

  useEffect(() => {
    void generate();
  }, [generate]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 print:max-w-none">
      <div className="print:hidden">
        <PageHeader title="Reports" description="Printable barangay reports generated live from database records." />
      </div>

      <Card className="print:hidden">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex w-64 flex-col gap-1.5">
              <Label htmlFor="reportType">Report</Label>
              <Select id="reportType" value={type} onChange={(e) => setType(e.target.value)}>
                {REPORT_TYPES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </Select>
            </div>
            <div className="w-40"><Field label="From"><Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></Field></div>
            <div className="w-40"><Field label="To"><Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></Field></div>
            <div className="w-40"><Field label="Purok"><Select value={purok} onChange={(e) => setPurok(e.target.value)}><option value="">All</option>{puroks.map((p) => <option key={p} value={p}>{p}</option>)}</Select></Field></div>
            <div className="w-48"><Field label="Classification"><Select value={classification} onChange={(e) => setClassification(e.target.value)}><option value="">All</option>{classifications.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}</Select></Field></div>
            <Button variant="outline" size="sm" className="h-10" onClick={() => void generate()}><RefreshCw size={16} /> Apply</Button>
            <Button variant="outline" size="sm" className="h-10" onClick={() => window.open(`/api/reports/${type}/export?format=xlsx&${queryString()}`, '_blank')}><FileSpreadsheet size={16} /> Excel</Button>
            <Button variant="outline" size="sm" className="h-10" onClick={() => window.open(`/api/reports/${type}/export?format=pdf&${queryString()}`, '_blank')}><FileDown size={16} /> PDF</Button>
            <Button variant="outline" size="sm" className="h-10" onClick={() => window.print()}><Printer size={16} /> Print</Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center p-16"><Loader2 className="animate-spin text-accent print:hidden" size={30} /></div>
      ) : report ? (
        <Card className="print:border-0 print:shadow-none">
          <CardContent className="p-6">
            <div className="mb-4 text-center">
              <p className="text-xs text-muted">Republic of the Philippines · Province of Ilocos Sur · Municipality of Santiago</p>
              <h2 className="text-lg font-bold text-primary">Barangay Ambucao — {report.title}</h2>
              <p className="text-xs text-muted">{report.subtitle} · Generated {new Date().toLocaleString('en-PH')}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-primary text-white">
                    {report.columns.map((col) => (
                      <th key={col.key} className="border border-primary px-3 py-2 text-left">{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.rows.length === 0 ? (
                    <tr><td colSpan={report.columns.length} className="border px-3 py-6 text-center text-muted">No records match the selected filters.</td></tr>
                  ) : (
                    report.rows.map((row, index) => (
                      <tr key={index} className={index % 2 ? 'bg-background' : 'bg-white'}>
                        {report.columns.map((col) => (
                          <td key={col.key} className="border border-border px-3 py-1.5 text-foreground">{String(row[col.key] ?? '')}</td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[11px] text-muted">Total rows: {report.rows.length}</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="print:hidden">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center text-sm text-muted">
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={() => void generate()}><RefreshCw size={16} /> Retry</Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

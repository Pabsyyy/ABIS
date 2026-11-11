'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2, RefreshCw } from 'lucide-react';

interface LogRow {
  _id: string;
  action: string;
  targetType?: string;
  targetId?: string;
  ip?: string;
  createdAt: string;
  details?: Record<string, unknown>;
  user?: { fullName: string; username: string; role: string } | null;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [action, setAction] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(meta.page), limit: String(meta.limit) });
    if (action) params.set('action', action);
    const res = await api<LogRow[]>(`/api/admin/logs?${params.toString()}`);
    if (!res.success || !res.data) {
      setError(res.message ?? 'Failed to load logs (secretary only)');
      setLogs([]);
    } else {
      setLogs(res.data);
      if (res.meta) setMeta(res.meta);
    }
    setLoading(false);
  }, [meta.page, meta.limit, action, setError]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <PageHeader title="Activity Logs" description="Audit trail of important system actions. Visible to the Barangay Secretary only." actions={<Button variant="outline" size="sm" onClick={() => void load()}><RefreshCw size={16} /> Refresh</Button>} />

      {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex flex-wrap items-end gap-2">
        <div className="flex w-72 flex-col gap-1.5">
          <Label htmlFor="action">Filter by action</Label>
          <Input id="action" value={action} onChange={(e) => { setAction(e.target.value); setMeta((m) => ({ ...m, page: 1 })); }} placeholder="e.g. auth.login, resident.create…" />
        </div>
        <Select value={String(meta.limit)} onChange={(e) => setMeta((m) => ({ ...m, limit: Number(e.target.value), page: 1 }))} className="w-32">
          {[20, 50, 100].map((n) => <option key={n} value={n}>{n} / page</option>)}
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Entries</CardTitle>
          <CardDescription>{meta.total} total entries</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-12"><Loader2 className="animate-spin text-accent" size={26} /></div>
          ) : logs.length === 0 ? (
            <p className="p-12 text-center text-sm text-muted">No log entries match the filter.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-background-light text-left text-xs uppercase text-muted">
                    <tr><th className="px-4 py-3">Time</th><th className="px-4 py-3">User</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Target</th><th className="px-4 py-3">IP</th></tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {logs.map((log) => (
                      <tr key={log._id} className="hover:bg-background">
                        <td className="px-4 py-3 text-foreground">{new Date(log.createdAt).toLocaleString('en-PH')}</td>
                        <td className="px-4 py-3 text-foreground">{log.user ? `${log.user.fullName} (${log.user.role})` : 'system'}</td>
                        <td className="px-4 py-3 font-mono text-xs text-primary">{log.action}</td>
                        <td className="px-4 py-3 text-muted">{log.targetType ?? ''}{log.targetId ? ` #${log.targetId.slice(-6)}` : ''}</td>
                        <td className="px-4 py-3 text-muted">{log.ip ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted">
                <span>page {meta.page} of {meta.totalPages}</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" disabled={meta.page <= 1} onClick={() => setMeta((m) => ({ ...m, page: m.page - 1 }))} aria-label="Previous page"><ChevronLeft size={18} /></Button>
                  <Button variant="ghost" size="icon" disabled={meta.page >= meta.totalPages} onClick={() => setMeta((m) => ({ ...m, page: m.page + 1 }))} aria-label="Next page"><ChevronRight size={18} /></Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

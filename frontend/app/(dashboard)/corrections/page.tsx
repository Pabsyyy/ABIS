'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, Select } from '@/components/ui/select';
import { PageHeader } from '@/components/ui/page-header';
import { Loader2, RefreshCw, Check, X } from 'lucide-react';

interface CorrectionRow {
  _id: string;
  field: string;
  proposedValue: string;
  status: 'pending' | 'applied' | 'rejected';
  resolutionNote?: string;
  createdAt: string;
  resident?: { firstName: string; lastName: string; purok?: string };
}

export default function CorrectionsPage() {
  const [items, setItems] = useState<CorrectionRow[]>([]);
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    const res = await api<CorrectionRow[]>(`/api/admin/correction-requests?${params.toString()}`);
    if (!res.success || !res.data) {
      setError(res.message ?? 'Failed to load correction requests');
      setItems([]);
    } else {
      setItems(res.data);
    }
    setLoading(false);
  }, [status, setError]);

  useEffect(() => {
    void load();
  }, [load]);

  const resolve = async (id: string, action: 'apply' | 'reject') => {
    const note = window.prompt(action === 'apply' ? 'Apply correction? Optional note for the audit trail:' : 'Reject correction? Optional note for the audit trail:');
    if (note === null) return;
    const res = await api(`/api/admin/correction-requests/${id}/${action}`, { method: 'POST', body: JSON.stringify({ resolutionNote: note }) });
    if (!res.success) {
      setError(res.message ?? 'Action failed');
      return;
    }
    setNotice(action === 'apply' ? 'Correction applied to the resident record.' : 'Correction rejected.');
    await load();
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <PageHeader title="Correction Requests" description="Residents ask to fix their own records; you apply or reject each one. Nothing is changed without your action." actions={<Button variant="outline" size="sm" onClick={() => void load()}><RefreshCw size={16} /> Refresh</Button>} />

      {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">{notice}</p>}

      <div className="w-48">
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="applied">Applied</option>
          <option value="rejected">Rejected</option>
          <option value="">All</option>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-12"><Loader2 className="animate-spin text-accent" size={26} /></div>
          ) : items.length === 0 ? (
            <p className="p-12 text-center text-sm text-muted">No correction requests{status ? ` (${status})` : ''}.</p>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li key={item._id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-primary">{item.resident ? `${item.resident.firstName} ${item.resident.lastName}` : 'Unknown resident'} <span className="text-xs font-normal text-muted">{item.resident?.purok ?? ''}</span></p>
                    <p className="mt-0.5 text-foreground"><span className="font-mono text-xs">{item.field}</span> → {item.proposedValue}</p>
                    <p className="text-xs text-muted">{new Date(item.createdAt).toLocaleString('en-PH')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={item.status === 'applied' ? 'success' : item.status === 'rejected' ? 'danger' : 'warning'}>{item.status}</Badge>
                    {item.status === 'pending' && (
                      <>
                        <Button size="sm" variant="success" onClick={() => void resolve(item._id, 'apply')}><Check size={14} /> Apply</Button>
                        <Button size="sm" variant="danger" onClick={() => void resolve(item._id, 'reject')}><X size={14} /> Reject</Button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

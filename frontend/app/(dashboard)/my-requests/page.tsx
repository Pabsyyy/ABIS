'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { notify } from '@/lib/notify';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/select';
import { PageHeader } from '@/components/ui/page-header';
import { CertificateRequestModal } from '@/components/certificate-request-modal';
import { Loader2, Plus, Printer } from 'lucide-react';

interface MyRequestRow {
  _id: string;
  purpose: string;
  status: string;
  createdAt: string;
  controlNumber?: string;
  certificateType?: { _id: string; name: string; fee: number };
  rejectionReason?: string;
}

interface MyIssuedRow {
  _id: string;
  controlNumber: string;
  issuedAt: string;
  releasedAt?: string;
  paymentStatus: 'unpaid' | 'paid' | 'waived';
  certificateType?: { name: string };
}

const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  pending: 'warning',
  approved: 'info',
  rejected: 'danger',
  ready_for_release: 'info',
  released: 'success',
  cancelled: 'neutral',
};

export default function MyRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<MyRequestRow[]>([]);
  const [issued, setIssued] = useState<MyIssuedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [reqRes, issuedRes] = await Promise.all([
      api<MyRequestRow[]>('/api/me/certificate-requests'),
      api<MyIssuedRow[]>('/api/me/issued'),
    ]);
    if (reqRes.message === 'Not authenticated') {
      router.replace('/login');
      return;
    }
    if (!reqRes.success && reqRes.message?.includes('linked')) {
      setError('Your account is not linked to a resident record. Please visit the Barangay Hall so staff can link your account, then sign in again.');
      setLoading(false);
      return;
    }
    if (!reqRes.success) {
      notify.error(reqRes.message ?? 'Failed to load your requests');
    } else {
      setRequests(reqRes.data ?? []);
    }
    if (issuedRes.success && issuedRes.data) setIssued(issuedRes.data);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSubmitted = (message: string) => {
    notify.success(message);
    void load();
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader title="My Requests" description="Certificate and document requests you submitted at the Barangay Hall (or from here, if enabled)." actions={<Button size="sm" onClick={() => setNewOpen(true)}><Plus size={16} /> New Request</Button>} />

      {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-12"><Loader2 className="animate-spin text-accent" size={26} /></div>
          ) : requests.length === 0 ? (
            <p className="p-12 text-center text-sm text-muted">You have not submitted any requests yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-background-light text-left text-xs uppercase text-muted">
                  <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Certificate</th><th className="px-4 py-3">Purpose</th><th className="px-4 py-3">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {requests.map((r) => (
                    <tr key={r._id} className="hover:bg-background">
                      <td className="px-4 py-3 text-foreground">{new Date(r.createdAt).toLocaleDateString('en-PH')}</td>
                      <td className="px-4 py-3 text-primary">{r.certificateType?.name ?? '—'}</td>
                      <td className="max-w-64 truncate px-4 py-3 text-foreground" title={r.purpose}>{r.purpose}</td>
                      <td className="px-4 py-3">
                        <Badge tone={STATUS_TONE[r.status] ?? 'neutral'}>{r.status.replace(/_/g, ' ')}</Badge>
                        {r.status === 'rejected' && r.rejectionReason && <p className="mt-1 text-xs text-red-600">{r.rejectionReason}</p>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-primary">My issued documents</h2>
          </div>
          {loading ? (
            <div className="flex items-center justify-center p-12"><Loader2 className="animate-spin text-accent" size={26} /></div>
          ) : issued.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted">No issued documents yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-background-light text-left text-xs uppercase text-muted">
                  <tr><th className="px-4 py-3">Control No.</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Issued</th><th className="px-4 py-3">Payment</th><th className="px-4 py-3 text-right">Document</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {issued.map((i) => (
                    <tr key={i._id} className="hover:bg-background">
                      <td className="px-4 py-3 font-mono text-xs text-primary">{i.controlNumber}</td>
                      <td className="px-4 py-3 text-foreground">{i.certificateType?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-foreground">{new Date(i.issuedAt).toLocaleDateString('en-PH')}</td>
                      <td className="px-4 py-3"><Badge tone={i.paymentStatus === 'paid' ? 'success' : i.paymentStatus === 'waived' ? 'neutral' : 'warning'}>{i.paymentStatus}</Badge></td>
                      <td className="px-4 py-3 text-right">
                        <a href={`/api/me/issued/${i._id}/pdf`} target="_blank" rel="noreferrer" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground hover:bg-background-light" title="View / print document"><Printer size={16} /></a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <CertificateRequestModal open={newOpen} onClose={() => setNewOpen(false)} onSubmitted={handleSubmitted} />
    </div>
  );
}

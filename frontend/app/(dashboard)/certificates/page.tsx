'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api, type ApiUser } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { Badge, Field, Select, Textarea } from '@/components/ui/select';
import { PageHeader } from '@/components/ui/page-header';
import { cn } from '@/lib/utils';
import { Loader2, Plus, Search, Printer, Check, X, Banknote, ChevronLeft, ChevronRight, RefreshCw, FileText } from 'lucide-react';

type Tab = 'requests' | 'issued' | 'types';

interface CertificateTypeRow {
  _id: string;
  name: string;
  description?: string;
  fee: number;
  requiresApproval: boolean;
  active: boolean;
}

interface ResidentOption {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  purok?: string;
}

interface RequestRow {
  _id: string;
  purpose: string;
  status: string;
  controlNumber?: string;
  createdAt: string;
  resident?: { firstName: string; lastName: string; purok?: string };
  certificateType?: { _id: string; name: string; fee: number; requiresApproval: boolean };
  notes?: string;
  rejectionReason?: string;
}

interface IssuedRow {
  _id: string;
  controlNumber: string;
  fee: number;
  orNumber?: string;
  paymentStatus: 'unpaid' | 'paid' | 'waived';
  issuedAt: string;
  releasedAt?: string;
  releasedTo?: string;
  resident?: { firstName: string; lastName: string; purok?: string };
  certificateType?: { name: string };
}

const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  pending: 'warning',
  approved: 'info',
  rejected: 'danger',
  issued: 'info',
  ready_for_release: 'info',
  released: 'success',
  cancelled: 'neutral',
};

function fullName(r?: { firstName: string; lastName: string }) {
  return r ? `${r.firstName} ${r.lastName}` : '—';
}

export default function CertificatesPage() {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [tab, setTab] = useState<Tab>('requests');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    api<{ user: ApiUser }>('/api/auth/me').then((res) => {
      if (res.success && res.data) setUser(res.data.user);
    });
  }, []);

  const isSecretary = user?.role === 'secretary';
  const isCaptainOrSecretary = user?.role === 'captain' || user?.role === 'secretary';

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4">
      <PageHeader title="Certificates" description="Request, approve, issue and track barangay certificates." />
      {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">{notice}</p>}

      <div className="flex gap-1 border-b border-border">
        {([
          { id: 'requests', label: 'Requests' },
          { id: 'issued', label: 'Issued & Payments' },
          ...(isSecretary ? [{ id: 'types' as const, label: 'Certificate Types' }] : []),
        ] as { id: Tab; label: string }[]).map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)} className={cn('border-b-2 px-4 py-2 text-sm font-medium transition-colors', tab === id ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-foreground')}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'requests' && <RequestsTab canApprove={isCaptainOrSecretary} isSecretary={isSecretary} setError={setError} setNotice={setNotice} />}
      {tab === 'issued' && <IssuedTab setError={setError} setNotice={setNotice} />}
      {tab === 'types' && <TypesTab setError={setError} setNotice={setNotice} />}
    </div>
  );
}

function RequestsTab({ canApprove, isSecretary, setError, setNotice }: { canApprove: boolean; isSecretary: boolean; setError: (v: string | null) => void; setNotice: (v: string | null) => void }) {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [newOpen, setNewOpen] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(meta.page), limit: String(meta.limit) });
    if (status) params.set('status', status);
    const res = await api<RequestRow[]>(`/api/certificates/requests?${params.toString()}`);
    if (!res.success || !res.data) {
      setError(res.message ?? 'Failed to load requests');
      setRequests([]);
    } else {
      setRequests(res.data);
      if (res.meta) setMeta(res.meta);
    }
    setLoading(false);
  }, [meta.page, meta.limit, status, setError]);

  useEffect(() => {
    void load();
  }, [load]);

  const action = async (url: string, body?: object, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    const res = await api(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
    if (!res.success) {
      setError(res.message ?? 'Action failed');
      return;
    }
    setNotice('Done.');
    await load();
  };

  const reject = async () => {
    if (!rejectId) return;
    const res = await api(`/api/certificates/requests/${rejectId}/reject`, { method: 'POST', body: JSON.stringify({ reason: rejectReason }) });
    if (!res.success) {
      setError(res.message ?? 'Failed to reject request');
      return;
    }
    setRejectId(null);
    setRejectReason('');
    setNotice('Request rejected.');
    await load();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cstatus">Status</Label>
          <Select id="cstatus" value={status} onChange={(e) => { setStatus(e.target.value); setMeta((m) => ({ ...m, page: 1 })); }} className="w-48">
            <option value="">All statuses</option>
            {['pending', 'approved', 'rejected', 'ready_for_release', 'released', 'cancelled'].map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </Select>
        </div>
        {isSecretary && <Button size="sm" onClick={() => setNewOpen(true)}><Plus size={16} /> New Request</Button>}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-12"><Loader2 className="animate-spin text-accent" size={26} /></div>
          ) : requests.length === 0 ? (
            <p className="p-12 text-center text-sm text-muted">No requests found.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-background-light text-left text-xs uppercase text-muted">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Resident</th>
                      <th className="px-4 py-3">Certificate</th>
                      <th className="px-4 py-3">Purpose</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {requests.map((r) => (
                      <tr key={r._id} className="hover:bg-background">
                        <td className="px-4 py-3 text-foreground">{new Date(r.createdAt).toLocaleDateString('en-PH')}</td>
                        <td className="px-4 py-3 text-primary">{fullName(r.resident)}</td>
                        <td className="px-4 py-3 text-foreground">{r.certificateType?.name ?? '—'}</td>
                        <td className="max-w-56 truncate px-4 py-3 text-foreground" title={r.purpose}>{r.purpose}</td>
                        <td className="px-4 py-3"><Badge tone={STATUS_TONE[r.status] ?? 'neutral'}>{r.status.replace(/_/g, ' ')}</Badge></td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1.5">
                            {r.status === 'pending' && canApprove && (
                              <>
                                <Button variant="ghost" size="sm" title="Approve" onClick={() => void action(`/api/certificates/requests/${r._id}/approve`, undefined, `Approve request for ${fullName(r.resident)}?`)}><Check size={16} className="text-green-700" /></Button>
                                <Button variant="ghost" size="sm" title="Reject" onClick={() => { setRejectId(r._id); setRejectReason(''); }}><X size={16} className="text-red-700" /></Button>
                              </>
                            )}
                            {r.status === 'approved' && isSecretary && (
                              <Button variant="outline" size="sm" onClick={() => void action(`/api/certificates/requests/${r._id}/issue`, undefined, 'Issue certificate and generate control number?')}><FileText size={16} /> Issue</Button>
                            )}
                            {r.status === 'ready_for_release' && isSecretary && (
                              <Button variant="outline" size="sm" onClick={() => void action(`/api/certificates/requests/${r._id}/release`, { releasedTo: 'Resident' }, 'Mark certificate as released?')}>Release</Button>
                            )}
                            {(r.status === 'pending' || r.status === 'approved') && isSecretary && (
                              <Button variant="ghost" size="sm" title="Cancel" onClick={() => void action(`/api/certificates/requests/${r._id}/cancel`, {}, 'Cancel this request?')}>Cancel</Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted">
                <span>{meta.total} request(s)</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" disabled={meta.page <= 1} onClick={() => setMeta((m) => ({ ...m, page: m.page - 1 }))} aria-label="Previous page"><ChevronLeft size={18} /></Button>
                  <Button variant="ghost" size="icon" disabled={meta.page >= meta.totalPages} onClick={() => setMeta((m) => ({ ...m, page: m.page + 1 }))} aria-label="Next page"><ChevronRight size={18} /></Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <NewRequestModal open={newOpen} onClose={() => setNewOpen(false)} onCreated={() => { setNotice('Request submitted.'); void load(); }} setError={setError} />
      <Modal open={rejectId !== null} onClose={() => setRejectId(null)} title="Reject request" description="Provide a reason. The requester can be informed at the hall.">
        <div className="flex flex-col gap-3">
          <Field label="Reason"><Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} autoFocus /></Field>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRejectId(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => void reject()} disabled={rejectReason.trim().length < 3}>Reject request</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function NewRequestModal({ open, onClose, onCreated, setError }: { open: boolean; onClose: () => void; onCreated: () => void; setError: (v: string | null) => void }) {
  const [residentQuery, setResidentQuery] = useState('');
  const [residentOptions, setResidentOptions] = useState<ResidentOption[]>([]);
  const [resident, setResident] = useState<ResidentOption | null>(null);
  const [types, setTypes] = useState<CertificateTypeRow[]>([]);
  const [certificateType, setCertificateType] = useState('');
  const [purpose, setPurpose] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    api<CertificateTypeRow[]>('/api/certificates/types').then((res) => {
      if (res.success && res.data) setTypes(res.data.filter((t) => t.active));
    });
  }, [open]);

  useEffect(() => {
    if (residentQuery.trim().length < 2) {
      setResidentOptions([]);
      return;
    }
    const handle = setTimeout(() => {
      api<ResidentOption[]>(`/api/residents?search=${encodeURIComponent(residentQuery.trim())}&limit=8`).then((res) => {
        if (res.success && res.data) setResidentOptions(res.data);
      });
    }, 250);
    return () => clearTimeout(handle);
  }, [residentQuery]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!resident) return;
    setSaving(true);
    const res = await api('/api/certificates/requests', {
      method: 'POST',
      body: JSON.stringify({ resident: resident._id, certificateType, purpose }),
    });
    setSaving(false);
    if (!res.success) {
      setError(res.message ?? 'Failed to create request');
      return;
    }
    setResident(null);
    setResidentQuery('');
    setCertificateType('');
    setPurpose('');
    onClose();
    onCreated();
  };

  return (
    <Modal wide open={open} onClose={onClose} title="New Certificate Request" description="Search the resident — their data is reused, not re-encoded.">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Resident *">
          {resident ? (
            <div className="flex items-center justify-between rounded-md border border-accent bg-background-light px-3 py-2 text-sm">
              <span><strong>{fullName(resident)}</strong> <span className="text-muted">{resident.purok ?? ''}</span></span>
              <button type="button" className="text-xs text-accent hover:underline" onClick={() => { setResident(null); setResidentQuery(''); }}>Change</button>
            </div>
          ) : (
            <>
              <Input value={residentQuery} onChange={(e) => setResidentQuery(e.target.value)} placeholder="Type first or last name…" />
              {residentOptions.length > 0 && (
                <ul className="max-h-44 overflow-y-auto rounded-md border border-border">
                  {residentOptions.map((r) => (
                    <li key={r._id}>
                      <button type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-background-light" onClick={() => { setResident(r); setResidentOptions([]); }}>
                        {fullName(r)} <span className="text-xs text-muted">{r.purok ?? ''}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </Field>

        <Field label="Certificate type *">
          <Select required value={certificateType} onChange={(e) => setCertificateType(e.target.value)}>
            <option value="">Select certificate type…</option>
            {types.map((t) => <option key={t._id} value={t._id}>{t.name} — PHP {t.fee.toFixed(2)}</option>)}
          </Select>
        </Field>

        <Field label="Purpose *"><Textarea required value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Employment, scholarship, financial assistance…" /></Field>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving || !resident || !certificateType || purpose.trim().length < 3}>{saving && <Loader2 size={16} className="animate-spin" />}Submit request</Button>
        </div>
      </form>
    </Modal>
  );
}

function IssuedTab({ setError, setNotice }: { setError: (v: string | null) => void; setNotice: (v: string | null) => void }) {
  const [items, setItems] = useState<IssuedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentFor, setPaymentFor] = useState<IssuedRow | null>(null);
  const [amount, setAmount] = useState('');
  const [orNumber, setOrNumber] = useState('');
  const [paymentSave, setPaymentSave] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: '1', limit: '50' });
    if (appliedSearch) params.set('search', appliedSearch);
    if (paymentStatus) params.set('paymentStatus', paymentStatus);
    const res = await api<IssuedRow[]>(`/api/certificates/issued?${params.toString()}`);
    if (!res.success || !res.data) {
      setError(res.message ?? 'Failed to load issued certificates');
      setItems([]);
    } else {
      setItems(res.data);
    }
    setLoading(false);
  }, [appliedSearch, paymentStatus, setError]);

  useEffect(() => {
    void load();
  }, [load]);

  const recordPayment = async () => {
    if (!paymentFor) return;
    setPaymentSave(true);
    const res = await api(`/api/certificates/issued/${paymentFor._id}/payment`, {
      method: 'POST',
      body: JSON.stringify({ amount: Number(amount || paymentFor.fee), orNumber, paymentStatus: 'paid' }),
    });
    setPaymentSave(false);
    if (!res.success) {
      setError(res.message ?? 'Failed to record payment');
      return;
    }
    setPaymentFor(null);
    setNotice('Payment recorded.');
    await load();
  };

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={(e) => { e.preventDefault(); setAppliedSearch(search.trim()); }} className="flex flex-wrap items-end gap-2">
        <div className="relative min-w-56 flex-1">
          <Search size={16} className="absolute left-3 top-3 text-muted" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search control number…" className="pl-9" />
        </div>
        <Select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="w-44">
          <option value="">All payments</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
          <option value="waived">Waived</option>
        </Select>
        <Button type="submit" variant="outline" size="sm" className="h-10"><Search size={16} /> Search</Button>
        <Button type="button" variant="ghost" size="sm" className="h-10" onClick={() => void load()}><RefreshCw size={16} /></Button>
      </form>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-12"><Loader2 className="animate-spin text-accent" size={26} /></div>
          ) : items.length === 0 ? (
            <p className="p-12 text-center text-sm text-muted">No issued certificates yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-background-light text-left text-xs uppercase text-muted">
                  <tr>
                    <th className="px-4 py-3">Control No.</th>
                    <th className="px-4 py-3">Resident</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Issued</th>
                    <th className="px-4 py-3">Fee</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((i) => (
                    <tr key={i._id} className="hover:bg-background">
                      <td className="px-4 py-3 font-mono text-xs text-primary">{i.controlNumber}</td>
                      <td className="px-4 py-3 text-foreground">{fullName(i.resident)}</td>
                      <td className="px-4 py-3 text-foreground">{i.certificateType?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-foreground">{new Date(i.issuedAt).toLocaleDateString('en-PH')}</td>
                      <td className="px-4 py-3 text-foreground">PHP {i.fee.toFixed(2)}</td>
                      <td className="px-4 py-3"><Badge tone={i.paymentStatus === 'paid' ? 'success' : i.paymentStatus === 'waived' ? 'neutral' : 'warning'}>{i.paymentStatus}</Badge></td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <a href={`/api/certificates/issued/${i._id}/pdf`} target="_blank" rel="noreferrer" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground hover:bg-background-light" title="Print / download PDF"><Printer size={16} /></a>
                          {i.paymentStatus !== 'paid' && (
                            <Button variant="ghost" size="sm" title="Record payment" onClick={() => { setPaymentFor(i); setAmount(String(i.fee)); setOrNumber(''); }}><Banknote size={16} /></Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal open={paymentFor !== null} onClose={() => setPaymentFor(null)} title="Record payment" description={`Certificate ${paymentFor?.controlNumber ?? ''}`}>
        <div className="flex flex-col gap-3">
          <Field label="Amount (PHP)"><Input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
          <Field label="Official Receipt No."><Input value={orNumber} onChange={(e) => setOrNumber(e.target.value)} placeholder="OR-000000" /></Field>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPaymentFor(null)}>Cancel</Button>
            <Button onClick={() => void recordPayment()} disabled={paymentSave}>{paymentSave && <Loader2 size={16} className="animate-spin" />}Mark as paid</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function TypesTab({ setError, setNotice }: { setError: (v: string | null) => void; setNotice: (v: string | null) => void }) {
  const [types, setTypes] = useState<CertificateTypeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [fee, setFee] = useState('0');
  const [requiresApproval, setRequiresApproval] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api<CertificateTypeRow[]>('/api/certificates/types');
    if (res.success && res.data) setTypes(res.data);
    else setError(res.message ?? 'Failed to load certificate types');
    setLoading(false);
  }, [setError]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    const res = await api('/api/certificates/types', {
      method: 'POST',
      body: JSON.stringify({ name, fee: Number(fee || 0), requiresApproval }),
    });
    if (!res.success) {
      setError(res.message ?? 'Failed to create certificate type');
      return;
    }
    setName('');
    setFee('0');
    setNotice('Certificate type created.');
    await load();
  };

  const toggle = async (t: CertificateTypeRow) => {
    const res = await api(`/api/certificates/types/${t._id}`, { method: 'PATCH', body: JSON.stringify({ active: !t.active }) });
    if (!res.success) {
      setError(res.message ?? 'Failed to update');
      return;
    }
    await load();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardContent className="p-4">
          <h2 className="mb-3 text-sm font-semibold text-primary">Add certificate type</h2>
          <form onSubmit={create} className="flex flex-col gap-3">
            <Field label="Name *"><Input required value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Field label="Fee (PHP)"><Input type="number" min={0} step="0.01" value={fee} onChange={(e) => setFee(e.target.value)} /></Field>
            <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={requiresApproval} onChange={(e) => setRequiresApproval(e.target.checked)} /> Requires Captain approval</label>
            <Button type="submit"><Plus size={16} /> Add type</Button>
          </form>
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-12"><Loader2 className="animate-spin text-accent" size={26} /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-background-light text-left text-xs uppercase text-muted">
                  <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Fee</th><th className="px-4 py-3">Approval</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Toggle</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {types.map((t) => (
                    <tr key={t._id} className="hover:bg-background">
                      <td className="px-4 py-3 font-medium text-primary">{t.name}</td>
                      <td className="px-4 py-3 text-foreground">PHP {t.fee.toFixed(2)}</td>
                      <td className="px-4 py-3 text-foreground">{t.requiresApproval ? 'Yes' : 'No'}</td>
                      <td className="px-4 py-3"><Badge tone={t.active ? 'success' : 'neutral'}>{t.active ? 'active' : 'disabled'}</Badge></td>
                      <td className="px-4 py-3 text-right"><Button variant="ghost" size="sm" onClick={() => void toggle(t)}>{t.active ? 'Disable' : 'Enable'}</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

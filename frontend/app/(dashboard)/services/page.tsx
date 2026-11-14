'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { notify } from '@/lib/notify';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { Field, Select, Textarea, Badge } from '@/components/ui/select';
import { PageHeader } from '@/components/ui/page-header';
import { Loader2, Plus, Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

interface ResidentOption {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  purok?: string;
}

interface ServiceCategory {
  _id: string;
  name: string;
  isActive: boolean;
}

interface ServiceRow {
  _id: string;
  serviceDate: string;
  description: string;
  beneficiaryInfo?: string;
  resident?: { firstName: string; lastName: string; purok?: string };
  category?: { name: string };
  recordedBy?: { fullName: string };
}

function fullName(r?: { firstName: string; lastName: string }) {
  return r ? `${r.firstName} ${r.lastName}` : '—';
}

export default function ServicesPage() {
  const [records, setRecords] = useState<ServiceRow[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(meta.page), limit: String(meta.limit) });
    if (appliedSearch) params.set('search', appliedSearch);
    if (category) params.set('category', category);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    const res = await api<ServiceRow[]>(`/api/services/records?${params.toString()}`);
    if (!res.success || !res.data) {
      notify.error(res.message ?? 'Failed to load service records');
      setRecords([]);
    } else {
      setRecords(res.data);
      if (res.meta) setMeta(res.meta);
    }
    setLoading(false);
  }, [meta.page, meta.limit, appliedSearch, category, dateFrom, dateTo]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    api<ServiceCategory[]>('/api/services/categories').then((res) => {
      if (res.success && res.data) setCategories(res.data);
    });
  }, []);

  const applySearch = (e: FormEvent) => {
    e.preventDefault();
    setAppliedSearch(search.trim());
    setMeta((m) => ({ ...m, page: 1 }));
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4">
      <PageHeader title="Services" description="Monitor barangay services delivered to residents." actions={<Button size="sm" onClick={() => setModalOpen(true)}><Plus size={16} /> Add Service Record</Button>} />

      <Card>
        <CardContent className="p-4">
          <form onSubmit={applySearch} className="flex flex-wrap items-end gap-2">
            <div className="relative min-w-56 flex-1">
              <Search size={16} className="absolute left-3 top-3 text-muted" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search resident name…" className="pl-9" />
            </div>
            <div className="w-48">
              <Select value={category} onChange={(e) => { setCategory(e.target.value); setMeta((m) => ({ ...m, page: 1 })); }}>
                <option value="">All categories</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </Select>
            </div>
            <div className="w-40"><Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setMeta((m) => ({ ...m, page: 1 })); }} aria-label="From date" /></div>
            <div className="w-40"><Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setMeta((m) => ({ ...m, page: 1 })); }} aria-label="To date" /></div>
            <Button type="submit" variant="outline" size="sm" className="h-10"><Search size={16} /> Filter</Button>
            <Button type="button" variant="ghost" size="sm" className="h-10" onClick={() => { setSearch(''); setAppliedSearch(''); setCategory(''); setDateFrom(''); setDateTo(''); setMeta((m) => ({ ...m, page: 1 })); }}><RefreshCw size={16} /></Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-12"><Loader2 className="animate-spin text-accent" size={26} /></div>
          ) : records.length === 0 ? (
            <p className="p-12 text-center text-sm text-muted">No service records found.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-background-light text-left text-xs uppercase text-muted">
                    <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Resident</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Description</th><th className="px-4 py-3">Recorded by</th></tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {records.map((r) => (
                      <tr key={r._id} className="hover:bg-background">
                        <td className="px-4 py-3 text-foreground">{new Date(r.serviceDate).toLocaleDateString('en-PH')}</td>
                        <td className="px-4 py-3 text-primary">{fullName(r.resident)}</td>
                        <td className="px-4 py-3"><Badge tone="info">{r.category?.name ?? '—'}</Badge></td>
                        <td className="max-w-96 truncate px-4 py-3 text-foreground" title={r.description}>{r.description}</td>
                        <td className="px-4 py-3 text-muted">{r.recordedBy?.fullName ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted">
                <span>{meta.total} record(s)</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" disabled={meta.page <= 1} onClick={() => setMeta((m) => ({ ...m, page: m.page - 1 }))} aria-label="Previous page"><ChevronLeft size={18} /></Button>
                  <Button variant="ghost" size="icon" disabled={meta.page >= meta.totalPages} onClick={() => setMeta((m) => ({ ...m, page: m.page + 1 }))} aria-label="Next page"><ChevronRight size={18} /></Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AddServiceModal open={modalOpen} onClose={() => setModalOpen(false)} categories={categories} onCreated={() => { notify.success('Service record added.'); void load(); }} />
    </div>
  );
}

function AddServiceModal({ open, onClose, categories, onCreated }: { open: boolean; onClose: () => void; categories: ServiceCategory[]; onCreated: () => void }) {
  const [residentQuery, setResidentQuery] = useState('');
  const [residentOptions, setResidentOptions] = useState<ResidentOption[]>([]);
  const [resident, setResident] = useState<ResidentOption | null>(null);
  const [category, setCategory] = useState('');
  const [serviceDate, setServiceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [beneficiaryInfo, setBeneficiaryInfo] = useState('');
  const [saving, setSaving] = useState(false);

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

  const fullNameLocal = (r: ResidentOption) => [r.firstName, r.middleName, r.lastName].filter(Boolean).join(' ');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!resident) return;
    setSaving(true);
    const res = await api('/api/services/records', {
      method: 'POST',
      body: JSON.stringify({ resident: resident._id, category, serviceDate, description, beneficiaryInfo: beneficiaryInfo || undefined }),
    });
    setSaving(false);
    if (!res.success) {
      notify.error(res.errors?.map((er) => `${er.field}: ${er.message}`).join('; ') ?? res.message ?? 'Failed to save service record');
      return;
    }
    setResident(null);
    setResidentQuery('');
    setCategory('');
    setDescription('');
    setBeneficiaryInfo('');
    onClose();
    onCreated();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Service Record" description="Link the service to the resident's profile.">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Resident *">
          {resident ? (
            <div className="flex items-center justify-between rounded-md border border-accent bg-background-light px-3 py-2 text-sm">
              <span><strong>{fullNameLocal(resident)}</strong></span>
              <button type="button" className="text-xs text-accent hover:underline" onClick={() => { setResident(null); setResidentQuery(''); }}>Change</button>
            </div>
          ) : (
            <>
              <Input value={residentQuery} onChange={(e) => setResidentQuery(e.target.value)} placeholder="Type first or last name…" />
              {residentOptions.length > 0 && (
                <ul className="max-h-44 overflow-y-auto rounded-md border border-border">
                  {residentOptions.map((r) => (
                    <li key={r._id}><button type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-background-light" onClick={() => { setResident(r); setResidentOptions([]); }}>{fullNameLocal(r)}</button></li>
                  ))}
                </ul>
              )}
            </>
          )}
        </Field>
        <Field label="Category *">
          <Select required value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Select category…</option>
            {categories.filter((c) => c.isActive).map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Service date *"><Input required type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} /></Field>
          <Field label="Beneficiary info"><Input value={beneficiaryInfo} onChange={(e) => setBeneficiaryInfo(e.target.value)} placeholder="e.g. 2 children" /></Field>
        </div>
        <Field label="Description *"><Textarea required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What service was provided…" /></Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving || !resident || !category || description.trim().length < 3}>{saving && <Loader2 size={16} className="animate-spin" />}Save record</Button>
        </div>
      </form>
    </Modal>
  );
}

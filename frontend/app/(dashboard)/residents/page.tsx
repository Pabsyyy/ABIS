'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { notify } from '@/lib/notify';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { Field, Select, Textarea, Badge } from '@/components/ui/select';
import { PageHeader } from '@/components/ui/page-header';
import { cn } from '@/lib/utils';
import { Loader2, Plus, Search, Archive, ArchiveRestore, Upload, Download, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

interface Resident {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  birthdate: string;
  sex: 'M' | 'F';
  civilStatus: string;
  purok?: string;
  address?: string;
  contactNumber?: string;
  email?: string;
  occupation?: string;
  monthlyIncome?: number;
  classifications: string[];
  isHouseholdHead: boolean;
  status: 'active' | 'archived';
}

interface Classification {
  key: string;
  label: string;
}

interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const CIVIL_STATUSES = ['single', 'married', 'widowed', 'separated', 'annulled', 'divorced'];
const emptyForm = {
  firstName: '',
  middleName: '',
  lastName: '',
  suffix: '',
  birthdate: '',
  sex: 'M' as 'M' | 'F',
  civilStatus: 'single',
  purok: '',
  address: '',
  contactNumber: '',
  email: '',
  occupation: '',
  monthlyIncome: '',
  classifications: [] as string[],
  isHouseholdHead: false,
  notes: '',
};

function fullName(r: Pick<Resident, 'firstName' | 'middleName' | 'lastName' | 'suffix'>) {
  return [r.firstName, r.middleName, r.lastName, r.suffix].filter(Boolean).join(' ');
}

export default function ResidentsPage() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [meta, setMeta] = useState<PageMeta>({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [purok, setPurok] = useState('');
  const [classification, setClassification] = useState('');
  const [status, setStatus] = useState<'active' | 'archived'>('active');
  const [loading, setLoading] = useState(true);
  const [classifications, setClassifications] = useState<Classification[]>([]);
  const [puroks, setPuroks] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Resident | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [importReport, setImportReport] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(meta.page),
      limit: String(meta.limit),
      status,
    });
    if (appliedSearch) params.set('search', appliedSearch);
    if (purok) params.set('purok', purok);
    if (classification) params.set('classification', classification);
    const res = await api<Resident[]>(`/api/residents?${params.toString()}`);
    if (!res.success || !res.data) {
      notify.error(res.message ?? 'Failed to load residents');
      setResidents([]);
    } else {
      setResidents(res.data);
      if (res.meta) setMeta(res.meta);
    }
    setLoading(false);
  }, [meta.page, meta.limit, status, appliedSearch, purok, classification]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    api<Classification[]>('/api/residents/classifications').then((res) => res.success && res.data && setClassifications(res.data));
    api<{ name: string }[]>('/api/residents/puroks').then((res) => {
      if (res.success && res.data) setPuroks(res.data.map((p) => p.name));
    });
  }, []);

  const applySearch = (e: FormEvent) => {
    e.preventDefault();
    setAppliedSearch(search.trim());
    setMeta((m) => ({ ...m, page: 1 }));
  };

  const toggleClassification = (key: string) => {
    setForm((f) => ({
      ...f,
      classifications: f.classifications.includes(key) ? f.classifications.filter((c) => c !== key) : [...f.classifications, key],
    }));
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (r: Resident) => {
    setEditing(r);
    setForm({
      firstName: r.firstName,
      middleName: r.middleName ?? '',
      lastName: r.lastName,
      suffix: r.suffix ?? '',
      birthdate: r.birthdate.slice(0, 10),
      sex: r.sex,
      civilStatus: r.civilStatus,
      purok: r.purok ?? '',
      address: r.address ?? '',
      contactNumber: r.contactNumber ?? '',
      email: r.email ?? '',
      occupation: r.occupation ?? '',
      monthlyIncome: r.monthlyIncome !== undefined ? String(r.monthlyIncome) : '',
      classifications: [...r.classifications],
      isHouseholdHead: r.isHouseholdHead,
      notes: '',
    });
    setModalOpen(true);
  };

  const submitForm = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      monthlyIncome: form.monthlyIncome === '' ? undefined : Number(form.monthlyIncome),
      email: form.email === '' ? '' : form.email,
    };
    const res = editing
      ? await api(`/api/residents/${editing._id}`, { method: 'PATCH', body: JSON.stringify(payload) })
      : await api('/api/residents', { method: 'POST', body: JSON.stringify(payload) });
    setSaving(false);

    if (!res.success) {
      const detail = res.errors?.map((er) => `${er.field}: ${er.message}`).join('; ') ?? res.message ?? 'Save failed';
      notify.error(detail);
      return;
    }
    notify.success(editing ? 'Resident updated.' : 'Resident added.');
    setModalOpen(false);
    await load();
  };

  const archive = async (r: Resident, doArchive: boolean) => {
    const action = doArchive ? 'archive' : 'restore';
    const confirmed = window.confirm(`${doArchive ? 'Archive' : 'Restore'} resident "${fullName(r)}"?`);
    if (!confirmed) return;
    const res = await api(`/api/residents/${r._id}/${action}`, { method: 'POST' });
    if (!res.success) {
      notify.error(res.message ?? `Failed to ${action} resident`);
      return;
    }
    notify.success(`Resident ${doArchive ? 'archived' : 'restored'}.`);
    await load();
  };

  const doExport = () => {
    window.open('/api/residents/export', '_blank');
  };

  const doImport = async (file: File) => {
    setImportReport(null);
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/residents/import', { method: 'POST', body: formData, credentials: 'include' });
    const body = (await res.json()) as { success: boolean; message?: string; data?: { created: number; duplicatesSkipped: { row: number; name: string }[]; errors: { row: number; message: string }[]; totalRows: number } };
    if (!body.success) {
      setImportReport(body.message ?? 'Import failed');
      return;
    }
    const d = body.data!;
    setImportReport(
      `Import complete: ${d.created} created, ${d.duplicatesSkipped.length} duplicates skipped, ${d.errors.length} rows rejected (of ${d.totalRows}).` +
        (d.errors.length ? ` Errors: ${d.errors.slice(0, 5).map((e) => `row ${e.row}: ${e.message}`).join(' | ')}` : '') +
        (d.duplicatesSkipped.length ? ` Duplicates: ${d.duplicatesSkipped.slice(0, 5).map((e) => `row ${e.row}: ${e.name}`).join(' | ')}` : '')
    );
    await load();
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4">
      <PageHeader
        title="Residents"
        description="Centralized resident registry. Encoding once, reusing everywhere."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={doExport}><Download size={16} /> Export Excel</Button>
            <input ref={fileRef} type="file" accept=".xlsx" className="hidden" onChange={(e) => e.target.files?.[0] && void doImport(e.target.files[0])} />
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}><Upload size={16} /> Import Excel</Button>
            <Button size="sm" onClick={openCreate}><Plus size={16} /> Add Resident</Button>
          </>
        }
      />

      {importReport && <p role="status" className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">{importReport}</p>}

      <Card>
        <CardContent className="p-4">
          <form onSubmit={applySearch} className="flex flex-wrap items-end gap-2">
            <div className="flex min-w-56 flex-1 flex-col gap-1.5">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-3 text-muted" />
                <Input id="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, contact or purok…" className="pl-9" />
              </div>
            </div>
            <div className="flex w-44 flex-col gap-1.5">
              <Label htmlFor="purok">Purok</Label>
              <Select id="purok" value={purok} onChange={(e) => { setPurok(e.target.value); setMeta((m) => ({ ...m, page: 1 })); }}>
                <option value="">All puroks</option>
                {puroks.map((p) => <option key={p} value={p}>{p}</option>)}
              </Select>
            </div>
            <div className="flex w-48 flex-col gap-1.5">
              <Label htmlFor="classification">Classification</Label>
              <Select id="classification" value={classification} onChange={(e) => { setClassification(e.target.value); setMeta((m) => ({ ...m, page: 1 })); }}>
                <option value="">All classifications</option>
                {classifications.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
              </Select>
            </div>
            <div className="flex w-40 flex-col gap-1.5">
              <Label htmlFor="status">Status</Label>
              <Select id="status" value={status} onChange={(e) => { setStatus(e.target.value as 'active' | 'archived'); setMeta((m) => ({ ...m, page: 1 })); }}>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </Select>
            </div>
            <Button type="submit" variant="outline" size="sm" className="h-10"><Search size={16} /> Search</Button>
            <Button type="button" variant="ghost" size="sm" className="h-10" onClick={() => { setSearch(''); setAppliedSearch(''); setPurok(''); setClassification(''); setMeta((m) => ({ ...m, page: 1 })); }}><RefreshCw size={16} /></Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-12"><Loader2 className="animate-spin text-accent" size={26} /></div>
          ) : residents.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted">No residents found. Try adjusting search or <button className="text-accent hover:underline" onClick={openCreate}>add a resident</button>.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-background-light text-left text-xs uppercase text-muted">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Age / Sex</th>
                      <th className="px-4 py-3">Purok</th>
                      <th className="px-4 py-3">Classifications</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {residents.map((r) => {
                      const age = Math.floor((Date.now() - new Date(r.birthdate).getTime()) / (365.25 * 24 * 3600 * 1000));
                      return (
                        <tr key={r._id} className="hover:bg-background">
                          <td className="px-4 py-3 font-medium text-primary">{fullName(r)}{r.isHouseholdHead && <span className="ml-2 text-xs text-accent">(HH Head)</span>}</td>
                          <td className="px-4 py-3 text-foreground">{age} · {r.sex === 'M' ? 'Male' : 'Female'}</td>
                          <td className="px-4 py-3 text-foreground">{r.purok ?? '—'}</td>
                          <td className="px-4 py-3">
                            <div className="flex max-w-48 flex-wrap gap-1">
                              {r.classifications.length === 0 ? <span className="text-xs text-muted">—</span> : r.classifications.slice(0, 3).map((c) => <Badge key={c} tone="info">{c.replace(/_/g, ' ')}</Badge>)}
                            </div>
                          </td>
                          <td className="px-4 py-3"><Badge tone={r.status === 'active' ? 'success' : 'neutral'}>{r.status}</Badge></td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>Edit</Button>
                              {r.status === 'active' ? (
                                <Button variant="ghost" size="sm" title="Archive" onClick={() => void archive(r, true)}><Archive size={16} /></Button>
                              ) : (
                                <Button variant="ghost" size="sm" title="Restore" onClick={() => void archive(r, false)}><ArchiveRestore size={16} /></Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted">
                <span>{meta.total} record(s) · page {meta.page} of {meta.totalPages}</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" disabled={meta.page <= 1} onClick={() => setMeta((m) => ({ ...m, page: m.page - 1 }))} aria-label="Previous page"><ChevronLeft size={18} /></Button>
                  <Button variant="ghost" size="icon" disabled={meta.page >= meta.totalPages} onClick={() => setMeta((m) => ({ ...m, page: m.page + 1 }))} aria-label="Next page"><ChevronRight size={18} /></Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Modal wide open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Resident' : 'Add Resident'} description={editing ? 'Update resident information' : 'Encode a new resident. Duplicate check applies.'}>
        <form onSubmit={submitForm} className="grid gap-4 sm:grid-cols-2">
          <Field label="First name *"><Input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></Field>
          <Field label="Middle name"><Input value={form.middleName} onChange={(e) => setForm({ ...form, middleName: e.target.value })} /></Field>
          <Field label="Last name *"><Input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></Field>
          <Field label="Suffix"><Input value={form.suffix} onChange={(e) => setForm({ ...form, suffix: e.target.value })} placeholder="Jr., Sr., III…" /></Field>
          <Field label="Birthdate *"><Input required type="date" value={form.birthdate} onChange={(e) => setForm({ ...form, birthdate: e.target.value })} /></Field>
          <Field label="Sex *"><Select value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value as 'M' | 'F' })}><option value="M">Male</option><option value="F">Female</option></Select></Field>
          <Field label="Civil status"><Select value={form.civilStatus} onChange={(e) => setForm({ ...form, civilStatus: e.target.value })}>{CIVIL_STATUSES.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}</Select></Field>
          <Field label="Purok"><Input value={form.purok} onChange={(e) => setForm({ ...form, purok: e.target.value })} placeholder="e.g. Purok 1" /></Field>
          <div className="sm:col-span-2"><Field label="Address"><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field></div>
          <Field label="Contact number"><Input value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} /></Field>
          <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Occupation"><Input value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} /></Field>
          <Field label="Monthly income (PHP)"><Input type="number" min={0} value={form.monthlyIncome} onChange={(e) => setForm({ ...form, monthlyIncome: e.target.value })} /></Field>
          <div className="sm:col-span-2">
            <Field label="Classifications">
              <div className="flex flex-wrap gap-2">
                {classifications.map((c) => {
                  const checked = form.classifications.includes(c.key);
                  return (
                    <button type="button" key={c.key} onClick={() => toggleClassification(c.key)} className={cn('rounded-full border px-3 py-1 text-xs transition-colors', checked ? 'border-accent bg-accent text-white' : 'border-border bg-white text-foreground hover:bg-background-light')}>
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground sm:col-span-2"><input type="checkbox" checked={form.isHouseholdHead} onChange={(e) => setForm({ ...form, isHouseholdHead: e.target.checked })} /> Household head</label>
          <div className="sm:col-span-2"><Field label="Notes"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field></div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving && <Loader2 size={16} className="animate-spin" />}{editing ? 'Save changes' : 'Add resident'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

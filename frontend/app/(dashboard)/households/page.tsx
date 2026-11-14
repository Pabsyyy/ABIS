'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { notify } from '@/lib/notify';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { Field, Select, Badge } from '@/components/ui/select';
import { PageHeader } from '@/components/ui/page-header';
import { Loader2, Plus, Search, RefreshCw, ChevronLeft, ChevronRight, Users, Archive } from 'lucide-react';

interface HouseholdRow {
  _id: string;
  householdNumber: string;
  purok?: string;
  address?: string;
  memberCount: number;
  status: 'active' | 'archived';
  headResident?: { _id: string; firstName: string; lastName: string };
}

interface ResidentOption {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  purok?: string;
}

function fullName(r: ResidentOption) {
  return [r.firstName, r.middleName, r.lastName].filter(Boolean).join(' ');
}

export default function HouseholdsPage() {
  const [households, setHouseholds] = useState<HouseholdRow[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [purok, setPurok] = useState('');
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<HouseholdRow & { members?: ResidentOption[] } | null>(null);
  const [createForm, setCreateForm] = useState({ householdNumber: '', purok: '', address: '', headResident: '' });
  const [headOptions, setHeadOptions] = useState<ResidentOption[]>([]);
  const [headQuery, setHeadQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [puroks, setPuroks] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(meta.page), limit: String(meta.limit) });
    if (appliedSearch) params.set('search', appliedSearch);
    if (purok) params.set('purok', purok);
    const res = await api<HouseholdRow[]>(`/api/households?${params.toString()}`);
    if (!res.success || !res.data) {
      notify.error(res.message ?? 'Failed to load households');
      setHouseholds([]);
    } else {
      setHouseholds(res.data);
      if (res.meta) setMeta(res.meta);
    }
    setLoading(false);
  }, [meta.page, meta.limit, appliedSearch, purok]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    api<{ name: string }[]>('/api/residents/puroks').then((res) => {
      if (res.success && res.data) setPuroks(res.data.map((p) => p.name));
    });
  }, []);

  useEffect(() => {
    if (headQuery.trim().length < 2) {
      setHeadOptions([]);
      return;
    }
    const handle = setTimeout(() => {
      api<ResidentOption[]>(`/api/residents?search=${encodeURIComponent(headQuery.trim())}&limit=8`).then((res) => {
        if (res.success && res.data) setHeadOptions(res.data);
      });
    }, 250);
    return () => clearTimeout(handle);
  }, [headQuery]);

  const applySearch = (e: FormEvent) => {
    e.preventDefault();
    setAppliedSearch(search.trim());
    setMeta((m) => ({ ...m, page: 1 }));
  };

  const createHousehold = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await api('/api/households', {
      method: 'POST',
      body: JSON.stringify({ ...createForm }),
    });
    setSaving(false);
    if (!res.success) {
      notify.error(res.errors?.map((er) => `${er.field}: ${er.message}`).join('; ') ?? res.message ?? 'Failed to create household');
      return;
    }
    notify.success('Household created.');
    setModalOpen(false);
    setCreateForm({ householdNumber: '', purok: '', address: '', headResident: '' });
    setHeadQuery('');
    await load();
  };

  const viewDetail = async (h: HouseholdRow) => {
    const res = await api<HouseholdRow & { members?: ResidentOption[] }>(`/api/households/${h._id}`);
    if (!res.success || !res.data) {
      notify.error(res.message ?? 'Failed to load household');
      return;
    }
    setDetail(res.data);
    setDetailOpen(true);
  };

  const archiveHousehold = async (h: HouseholdRow) => {
    if (!window.confirm(`Archive household ${h.householdNumber}?`)) return;
    const res = await api(`/api/households/${h._id}/archive`, { method: 'POST' });
    if (!res.success) {
      notify.error(res.message ?? 'Failed to archive household');
      return;
    }
    notify.success('Household archived.');
    await load();
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4">
      <PageHeader
        title="Households"
        description="Household records and composition. Residents are linked, never duplicated."
        actions={<Button size="sm" onClick={() => setModalOpen(true)}><Plus size={16} /> Create Household</Button>}
      />

      <Card>
        <CardContent className="p-4">
          <form onSubmit={applySearch} className="flex flex-wrap items-end gap-2">
            <div className="flex min-w-56 flex-1 flex-col gap-1.5">
              <Label htmlFor="hsearch">Search</Label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-3 text-muted" />
                <Input id="hsearch" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Household no., address or head name…" className="pl-9" />
              </div>
            </div>
            <div className="flex w-44 flex-col gap-1.5">
              <Label htmlFor="hpurok">Purok</Label>
              <Select id="hpurok" value={purok} onChange={(e) => { setPurok(e.target.value); setMeta((m) => ({ ...m, page: 1 })); }}>
                <option value="">All puroks</option>
                {puroks.map((p) => <option key={p} value={p}>{p}</option>)}
              </Select>
            </div>
            <Button type="submit" variant="outline" size="sm" className="h-10"><Search size={16} /> Search</Button>
            <Button type="button" variant="ghost" size="sm" className="h-10" onClick={() => { setSearch(''); setAppliedSearch(''); setPurok(''); setMeta((m) => ({ ...m, page: 1 })); }}><RefreshCw size={16} /></Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-12"><Loader2 className="animate-spin text-accent" size={26} /></div>
          ) : households.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted">No households found.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-background-light text-left text-xs uppercase text-muted">
                    <tr>
                      <th className="px-4 py-3">Household No.</th>
                      <th className="px-4 py-3">Head</th>
                      <th className="px-4 py-3">Purok</th>
                      <th className="px-4 py-3">Members</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {households.map((h) => (
                      <tr key={h._id} className="hover:bg-background">
                        <td className="px-4 py-3 font-medium text-primary">{h.householdNumber}</td>
                        <td className="px-4 py-3 text-foreground">{h.headResident ? fullName(h.headResident as ResidentOption) : '—'}</td>
                        <td className="px-4 py-3 text-foreground">{h.purok ?? '—'}</td>
                        <td className="px-4 py-3"><span className="inline-flex items-center gap-1 text-foreground"><Users size={14} /> {h.memberCount}</span></td>
                        <td className="px-4 py-3"><Badge tone={h.status === 'active' ? 'success' : 'neutral'}>{h.status}</Badge></td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => void viewDetail(h)}>View</Button>
                            <Button variant="ghost" size="sm" title="Archive" onClick={() => void archiveHousehold(h)}><Archive size={16} /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted">
                <span>{meta.total} household(s) · page {meta.page} of {meta.totalPages}</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" disabled={meta.page <= 1} onClick={() => setMeta((m) => ({ ...m, page: m.page - 1 }))} aria-label="Previous page"><ChevronLeft size={18} /></Button>
                  <Button variant="ghost" size="icon" disabled={meta.page >= meta.totalPages} onClick={() => setMeta((m) => ({ ...m, page: m.page + 1 }))} aria-label="Next page"><ChevronRight size={18} /></Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Household" description="Register a household. The head must be an existing resident.">
        <form onSubmit={createHousehold} className="flex flex-col gap-4">
          <Field label="Household number *"><Input required value={createForm.householdNumber} onChange={(e) => setCreateForm({ ...createForm, householdNumber: e.target.value.toUpperCase() })} placeholder="e.g. HH-0001" /></Field>
          <Field label="Purok"><Input value={createForm.purok} onChange={(e) => setCreateForm({ ...createForm, purok: e.target.value })} placeholder="e.g. Purok 1" /></Field>
          <Field label="Address"><Input value={createForm.address} onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })} /></Field>
          <Field label="Household head (search resident) *">
            <Input value={headQuery} onChange={(e) => { setHeadQuery(e.target.value); setCreateForm({ ...createForm, headResident: '' }); }} placeholder="Type a name…" required={!createForm.headResident} />
            {createForm.headResident && <p className="text-xs text-green-700">Selected resident id: {createForm.headResident}</p>}
            {headOptions.length > 0 && (
              <ul className="max-h-40 overflow-y-auto rounded-md border border-border">
                {headOptions.map((r) => (
                  <li key={r._id}>
                    <button type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-background-light" onClick={() => { setCreateForm({ ...createForm, headResident: r._id }); setHeadQuery(fullName(r)); setHeadOptions([]); }}>
                      {fullName(r)} <span className="text-xs text-muted">{r.purok ?? ''}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || !createForm.headResident}>{saving && <Loader2 size={16} className="animate-spin" />}Create household</Button>
          </div>
        </form>
      </Modal>

      <Modal open={detailOpen} onClose={() => setDetailOpen(false)} title={`Household ${detail?.householdNumber ?? ''}`} description="Members and composition">
        {detail && (
          <div className="flex flex-col gap-3 text-sm">
            <p><span className="text-muted">Head:</span> {detail.headResident ? fullName(detail.headResident as ResidentOption) : '—'}</p>
            <p><span className="text-muted">Purok:</span> {detail.purok ?? '—'} · <span className="text-muted">Address:</span> {detail.address ?? '—'}</p>
            <p className="font-medium text-primary">Members ({detail.members?.length ?? 0})</p>
            {!detail.members?.length ? (
              <p className="text-muted">No members recorded.</p>
            ) : (
              <ul className="divide-y divide-border rounded-md border border-border">
                {detail.members!.map((m) => (
                  <li key={m._id} className="flex items-center justify-between px-3 py-2">
                    <span className="text-foreground">{fullName(m)}</span>
                    <span className="text-xs text-muted">{m.purok ?? ''}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

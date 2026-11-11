'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, RefreshCw, ShieldCheck, ShieldOff, KeyRound, Link2 } from 'lucide-react';
import { api, type ApiUser, type ApiResponse } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { cn } from '@/lib/utils';

type Role = ApiUser['role'];
const ROLES: Role[] = ['secretary', 'treasurer', 'captain', 'resident', 'other'];

interface ResidentOption {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  purok?: string;
}

function residentFullName(r: ResidentOption) {
  return [r.firstName, r.middleName, r.lastName].filter(Boolean).join(' ');
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('treasurer');
  const [residentRef, setResidentRef] = useState('');
  const [residentQuery, setResidentQuery] = useState('');
  const [residentOptions, setResidentOptions] = useState<ResidentOption[]>([]);
  const [linkUser, setLinkUser] = useState<ApiUser | null>(null);
  const [linkQuery, setLinkQuery] = useState('');
  const [linkOptions, setLinkOptions] = useState<ResidentOption[]>([]);
  const [linkRef, setLinkRef] = useState('');
  const [linking, setLinking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res: ApiResponse<ApiUser[]> = await api('/api/users');
    if (res.message === 'Not authenticated' || (!res.success && res.message?.includes('permission'))) {
      router.replace('/dashboard');
      return;
    }
    if (!res.success || !res.data) {
      setError(res.message ?? 'Failed to load users. You must be the Barangay Secretary.');
      setLoading(false);
      return;
    }
    setUsers(res.data);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (role !== 'resident') {
      setResidentRef('');
      setResidentOptions([]);
      return;
    }
    if (residentQuery.trim().length < 2) {
      setResidentOptions([]);
      return;
    }
    const handle = setTimeout(() => {
      api<ResidentOption[]>(`/api/residents?search=${encodeURIComponent(residentQuery.trim())}&limit=8`).then((res) => {
        if (res.success && res.data) {
          setResidentOptions((res.data as ResidentOption[]).map((r) => ({ _id: r._id, firstName: r.firstName, middleName: r.middleName, lastName: r.lastName, purok: r.purok })));
        }
      });
    }, 250);
    return () => clearTimeout(handle);
  }, [role, residentQuery]);

  useEffect(() => {
    if (!linkUser) return;
    if (linkQuery.trim().length < 2) {
      setLinkOptions([]);
      return;
    }
    const handle = setTimeout(() => {
      api<ResidentOption[]>(`/api/residents?search=${encodeURIComponent(linkQuery.trim())}&limit=8`).then((res) => {
        if (res.success && res.data) {
          setLinkOptions((res.data as ResidentOption[]).map((r) => ({ _id: r._id, firstName: r.firstName, middleName: r.middleName, lastName: r.lastName, purok: r.purok })));
        }
      });
    }, 250);
    return () => clearTimeout(handle);
  }, [linkUser, linkQuery]);

  const linkAccount = async () => {
    if (!linkUser || !linkRef) return;
    setLinking(true);
    setError(null);
    const res = await api(`/api/users/${linkUser.id}`, { method: 'PATCH', body: JSON.stringify({ residentRef: linkRef }) });
    setLinking(false);
    if (!res.success) {
      setError(res.message ?? 'Failed to link account');
      return;
    }
    setNotice(`"${linkUser.username}" linked to resident record.`);
    setLinkUser(null);
    setLinkRef('');
    setLinkQuery('');
    setLinkOptions([]);
    await load();
  };





  const createUser = async (e: FormEvent) => {
    e.preventDefault();
    setNotice(null);
    setError(null);
    setSubmitting(true);
    const res = await api('/api/users', {
      method: 'POST',
      body: JSON.stringify(role === 'resident' ? { fullName, username, password, role, residentRef } : { fullName, username, password, role }),
    });
    setSubmitting(false);
    if (!res.success) {
      setError(res.errors?.map((e2) => `${e2.field}: ${e2.message}`).join('; ') ?? res.message ?? 'Failed to create user');
      return;
    }
    setNotice(`Account "${username}" created. The user must change the temporary password on first login.`);
    setFullName('');
    setUsername('');
    setPassword('');
    setRole('treasurer');
    setResidentRef('');
    setResidentQuery('');
    await load();
  };

  const toggleActive = async (user: ApiUser) => {
    setNotice(null);
    setError(null);
    const res = await api(`/api/users/${user.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: !user.isActive }),
    });
    if (!res.success) {
      setError(res.message ?? 'Failed to update account');
      return;
    }
    setNotice(`Account "${user.username}" ${user.isActive ? 'deactivated' : 'reactivated'}.`);
    await load();
  };

  const resetPassword = async (user: ApiUser) => {
    const newPassword = window.prompt(`Enter a temporary password for "${user.username}" (min 8 characters):`);
    if (!newPassword) return;
    const res = await api(`/api/users/${user.id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
    if (!res.success) {
      setError(res.message ?? 'Failed to reset password');
      return;
    }
    setNotice(`Password for "${user.username}" reset. They must change it on next login.`);
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary">User Management</h1>
          <p className="text-sm text-muted">Create and manage authorized barangay accounts. Barangay Secretary only.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()}>
          <RefreshCw size={16} /> Refresh
        </Button>
      </div>

      {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">{notice}</p>}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Add account</CardTitle>
            <CardDescription>New users must change their temporary password on first login.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createUser} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} placeholder="lowercase, no spaces" required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Temporary password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="h-10 rounded-md border border-border bg-white px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r} className="capitalize">{r}</option>
                  ))}
                </select>
              </div>
              {role === 'resident' && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="residentQuery">Link resident *</Label>
                  {residentRef ? (
                    <div className="flex items-center justify-between rounded-md border border-accent bg-background-light px-3 py-2 text-sm">
                      <span className="text-foreground">{residentOptions.find((o) => o._id === residentRef) ? residentFullName(residentOptions.find((o) => o._id === residentRef)!) : 'Selected resident'}</span>
                      <button type="button" className="text-xs text-accent hover:underline" onClick={() => { setResidentRef(''); setResidentQuery(''); }}>Change</button>
                    </div>
                  ) : (
                    <>
                      <Input id="residentQuery" value={residentQuery} onChange={(e) => setResidentQuery(e.target.value)} placeholder="Search resident name…" />
                      {residentOptions.length > 0 && (
                        <ul className="max-h-40 overflow-y-auto rounded-md border border-border">
                          {residentOptions.map((r) => (
                            <li key={r._id}>
                              <button type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-background-light" onClick={() => { setResidentRef(r._id); setResidentQuery(''); }}>
                                {residentFullName(r)} <span className="text-xs text-muted">{r.purok ?? ''}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                  <p className="text-xs text-muted">A resident account is linked to one resident record; one account per resident. Add the resident in the Residents module first.</p>
                </div>
              )}
              <Button type="submit" disabled={submitting || (role === 'resident' && !residentRef)}>
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Create account
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Authorized accounts</CardTitle>
            <CardDescription>Staff and resident accounts. Residents get self-service access only and cannot use staff functions.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center p-10"><Loader2 className="animate-spin text-accent" size={24} /></div>
            ) : users.length === 0 ? (
              <p className="p-6 text-sm text-muted">No accounts found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-background-light text-left text-xs uppercase text-muted">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Username</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-background">
                        <td className="px-4 py-3 font-medium text-primary">{user.fullName}</td>
                        <td className="px-4 py-3 text-foreground">{user.username}</td>
                        <td className="px-4 py-3 capitalize text-foreground">{user.role}{user.role === 'resident' && <span className="ml-1 text-[10px] normal-case text-muted">({user.residentRef ? 'linked' : 'not linked'})</span>}</td>
                        <td className="px-4 py-3">
                          <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
                            {user.isActive ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            {user.role === 'resident' && (
                              <Button variant="ghost" size="sm" title={user.residentRef ? 'Change linked resident' : 'Link to a resident record'} onClick={() => { setLinkUser(user); setLinkRef(user.residentRef ?? ''); setLinkQuery(''); setLinkOptions([]); }}>
                                <Link2 size={16} />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" title="Reset password" onClick={() => void resetPassword(user)}>
                              <KeyRound size={16} />
                            </Button>
                            <Button variant="ghost" size="sm" title={user.isActive ? 'Deactivate' : 'Reactivate'} onClick={() => void toggleActive(user)}>
                              {user.isActive ? <ShieldOff size={16} /> : <ShieldCheck size={16} />}
                            </Button>
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
      </div>

      <Modal open={linkUser !== null} onClose={() => setLinkUser(null)} title="Link resident account" description={linkUser ? `Link "${linkUser.username}" to a resident record. The resident must exist in the Residents module first.` : ''}>
        <div className="flex flex-col gap-3">
          <Label htmlFor="linkQuery">Search resident *</Label>
          <Input id="linkQuery" value={linkQuery} onChange={(e) => setLinkQuery(e.target.value)} placeholder="Type first or last name…" autoFocus />
          {linkRef ? (
            <p className="rounded-md border border-accent bg-background-light px-3 py-2 text-sm text-foreground">Selected resident: <span className="font-mono text-xs">{linkRef}</span></p>
          ) : linkOptions.length > 0 ? (
            <ul className="max-h-52 overflow-y-auto rounded-md border border-border">
              {linkOptions.map((r) => (
                <li key={r._id}>
                  <button type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-background-light" onClick={() => { setLinkRef(r._id); setLinkQuery(residentFullName(r)); setLinkOptions([]); }}>
                    {residentFullName(r)} <span className="text-xs text-muted">{r.purok ?? ''}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : linkQuery.trim().length >= 2 ? (
            <p className="text-xs text-muted">No residents found. Add the resident in the Residents module first.</p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setLinkUser(null)}>Cancel</Button>
            <Button onClick={() => void linkAccount()} disabled={linking || !linkRef}>{linking ? <Loader2 size={16} className="animate-spin" /> : <Link2 size={16} />}Save link</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

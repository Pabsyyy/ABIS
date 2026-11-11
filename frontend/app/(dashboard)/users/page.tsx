'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, RefreshCw, ShieldCheck, ShieldOff, KeyRound } from 'lucide-react';
import { api, type ApiUser, type ApiResponse } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type Role = ApiUser['role'];
const ROLES: Role[] = ['secretary', 'treasurer', 'captain', 'resident', 'other'];

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

  const createUser = async (e: FormEvent) => {
    e.preventDefault();
    setNotice(null);
    setError(null);
    setSubmitting(true);
    const res = await api('/api/users', {
      method: 'POST',
      body: JSON.stringify({ fullName, username, password, role }),
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
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Create account
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Authorized accounts</CardTitle>
            <CardDescription>Residents are not system users unless a limited Resident account is created here.</CardDescription>
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
                        <td className="px-4 py-3 capitalize text-foreground">{user.role}</td>
                        <td className="px-4 py-3">
                          <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
                            {user.isActive ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
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
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { api, type ApiUser } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  const [user, setUser] = useState<ApiUser | null>(null);

  useEffect(() => {
    api<{ user: ApiUser }>('/api/auth/me').then((res) => {
      if (res.success && res.data) setUser(res.data.user);
    });
  }, []);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary">Settings</h1>
        <p className="text-sm text-muted">Account and system preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My account</CardTitle>
          <CardDescription>Read-only profile. Contact the Barangay Secretary to change your role or password.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div><dt className="text-xs uppercase text-muted">Full name</dt><dd className="font-medium text-primary">{user?.fullName ?? '—'}</dd></div>
            <div><dt className="text-xs uppercase text-muted">Username</dt><dd className="font-medium text-primary">{user?.username ?? '—'}</dd></div>
            <div><dt className="text-xs uppercase text-muted">Role</dt><dd className="font-medium capitalize text-primary">{user?.role ?? '—'}</dd></div>
            <div><dt className="text-xs uppercase text-muted">Password change</dt><dd className="font-medium text-primary">{user?.mustChangePassword ? 'Required on next login' : 'Not required'}</dd></div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System settings</CardTitle>
          <CardDescription>Barangay profile, letterhead, backup, notifications and SMS arrive in Sprint 8 (Administration).</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted">
          Not available yet.
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { api, type ApiUser } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, HandHeart, ShieldCheck } from 'lucide-react';

export default function DashboardPage() {
  const [user, setUser] = useState<ApiUser | null>(null);

  useEffect(() => {
    api<{ user: ApiUser }>('/api/auth/me').then((res) => {
      if (res.success && res.data) setUser(res.data.user);
    });
  }, []);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary">Welcome{user ? `, ${user.fullName}` : ''}</h1>
        <p className="text-sm text-muted">Integrated Barangay Information System — Barangay Ambucao, Santiago, Ilocos Sur</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Residents', icon: Users, note: 'Available in Sprint 2' },
          { label: 'Certificates', icon: FileText, note: 'Available in Sprints 4–5' },
          { label: 'Services', icon: HandHeart, note: 'Available in Sprint 6' },
          { label: 'Reports', icon: ShieldCheck, note: 'Available in Sprint 7' },
        ].map(({ label, icon: Icon, note }) => (
          <Card key={label}>
            <CardHeader className="flex-row items-center justify-between p-4 pb-0">
              <CardTitle className="text-sm text-muted">{label}</CardTitle>
              <Icon size={18} className="text-accent" />
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <p className="text-base font-semibold text-primary">—</p>
              <p className="text-xs text-muted">{note}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Getting started</CardTitle>
          <CardDescription>
            Modules are delivered per sprint. Sprint 1 provides authentication and user administration.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-foreground">
          <ul className="list-inside list-disc space-y-1">
            <li>Manage authorized accounts under <strong>User Management</strong> (Barangay Secretary only).</li>
            <li>Resident profiling, households, certificates, services and reports arrive in later sprints.</li>
            <li>Role-based access is enforced on both the app and the API.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

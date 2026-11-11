'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Select, Textarea, Badge } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Loader2, Send } from 'lucide-react';

interface MyProfile {
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
  classifications: string[];
}

interface CorrectionRow {
  _id: string;
  field: string;
  proposedValue: string;
  status: 'pending' | 'applied' | 'rejected';
  resolutionNote?: string;
  createdAt: string;
}

const CORRECTABLE_FIELDS = [
  { value: 'contactNumber', label: 'Contact number' },
  { value: 'email', label: 'Email' },
  { value: 'address', label: 'Address' },
  { value: 'purok', label: 'Purok' },
  { value: 'occupation', label: 'Occupation' },
  { value: 'monthlyIncome', label: 'Monthly income' },
  { value: 'civilStatus', label: 'Civil status' },
  { value: 'suffix', label: 'Suffix' },
];

export default function MyProfilePage() {
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [corrections, setCorrections] = useState<CorrectionRow[]>([]);
  const [field, setField] = useState('contactNumber');
  const [proposedValue, setProposedValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const load = async () => {
    const [profileRes, correctionsRes] = await Promise.all([
      api<MyProfile>('/api/me/profile'),
      api<CorrectionRow[]>('/api/me/correction-requests'),
    ]);
    if (!profileRes.success || !profileRes.data) {
      setError(profileRes.message ?? 'Failed to load your profile. Please visit the Barangay Hall.');
      return;
    }
    setProfile(profileRes.data);
    if (correctionsRes.success && correctionsRes.data) setCorrections(correctionsRes.data);
  };

  useEffect(() => {
    void load();
  }, []);

  const submitCorrection = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSending(true);
    const res = await api('/api/me/correction-requests', {
      method: 'POST',
      body: JSON.stringify({ field, proposedValue }),
    });
    setSending(false);
    if (!res.success) {
      setError(res.message ?? 'Failed to submit correction request');
      return;
    }
    setNotice('Correction request submitted. The Barangay Secretary will review it.');
    setProposedValue('');
    await load();
  };

  const fullName = profile ? [profile.firstName, profile.middleName, profile.lastName, profile.suffix].filter(Boolean).join(' ') : '';

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader title="My Profile" description="Your barangay record. Only the Barangay Secretary can apply changes." />

      {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">{notice}</p>}

      {profile && (
        <Card>
          <CardHeader>
            <CardTitle>{fullName}</CardTitle>
            <CardDescription>Barangay resident record — read-only</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><dt className="text-xs uppercase text-muted">Birthdate</dt><dd>{new Date(profile.birthdate).toLocaleDateString('en-PH')}</dd></div>
              <div><dt className="text-xs uppercase text-muted">Sex</dt><dd>{profile.sex === 'M' ? 'Male' : 'Female'}</dd></div>
              <div><dt className="text-xs uppercase text-muted">Civil status</dt><dd className="capitalize">{profile.civilStatus}</dd></div>
              <div><dt className="text-xs uppercase text-muted">Purok</dt><dd>{profile.purok ?? '—'}</dd></div>
              <div><dt className="text-xs uppercase text-muted">Address</dt><dd>{profile.address ?? '—'}</dd></div>
              <div><dt className="text-xs uppercase text-muted">Contact number</dt><dd>{profile.contactNumber ?? '—'}</dd></div>
              <div><dt className="text-xs uppercase text-muted">Email</dt><dd>{profile.email ?? '—'}</dd></div>
              <div><dt className="text-xs uppercase text-muted">Occupation</dt><dd>{profile.occupation ?? '—'}</dd></div>
              <div className="sm:col-span-2"><dt className="text-xs uppercase text-muted">Classifications</dt><dd>{profile.classifications.length ? profile.classifications.join(', ') : '—'}</dd></div>
            </dl>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Request a correction</CardTitle>
          <CardDescription>If something in your record is outdated or wrong, tell the Barangay Secretary. Do not encode changes yourself.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitCorrection} className="flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="What needs fixing?">
                <Select value={field} onChange={(e) => setField(e.target.value)}>
                  {CORRECTABLE_FIELDS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </Select>
              </Field>
              <Field label="Proposed value">
                <Input value={proposedValue} onChange={(e) => setProposedValue(e.target.value)} placeholder="The correct information" required minLength={1} />
              </Field>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={sending}>{sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}Submit correction request</Button>
            </div>
          </form>

          {corrections.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium uppercase text-muted">Your correction requests</p>
              <ul className="divide-y divide-border rounded-md border border-border text-sm">
                {corrections.map((c) => (
                  <li key={c._id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                    <span className="text-foreground"><span className="font-medium">{c.field}</span>: {c.proposedValue}</span>
                    <Badge tone={c.status === 'applied' ? 'success' : c.status === 'rejected' ? 'danger' : 'warning'}>{c.status}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

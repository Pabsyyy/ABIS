'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { notify } from '@/lib/notify';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/select';
import { CertificateRequestModal } from '@/components/certificate-request-modal';
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  HelpCircle,
  IdCard,
  Loader2,
  MapPin,
  Megaphone,
  Package,
  Phone,
  Plus,
  Printer,
} from 'lucide-react';

interface OverviewProfile {
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
  createdAt: string;
}

interface CertificateTypeInfo {
  _id: string;
  name: string;
  description?: string;
  fee: number;
  requiresApproval: boolean;
}

interface RequestRow {
  _id: string;
  purpose: string;
  status: string;
  createdAt: string;
  controlNumber?: string;
  rejectionReason?: string;
  certificateType?: { _id: string; name: string; fee: number };
}

interface IssuedRow {
  _id: string;
  controlNumber: string;
  issuedAt: string;
  releasedAt?: string;
  paymentStatus: 'unpaid' | 'paid' | 'waived';
  certificateType?: { name: string };
}

interface CorrectionRow {
  _id: string;
  field: string;
  proposedValue: string;
  status: 'pending' | 'applied' | 'rejected';
  resolutionNote?: string;
  createdAt: string;
}

interface NotificationRow {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'approval' | 'alert';
  read: boolean;
  link?: string;
  createdAt: string;
}

interface Overview {
  profile: OverviewProfile;
  barangay: {
    barangayName: string;
    municipality: string;
    province: string;
    captainName?: string;
    contactNumber?: string;
    officeHours?: string;
    announcement?: string;
  };
  stats: { pending: number; approved: number; readyForPickup: number; issued: number; openCorrections: number };
  latestRequest: RequestRow | null;
  recentRequests: RequestRow[];
  recentIssued: IssuedRow[];
  recentCorrections: CorrectionRow[];
  notifications: { items: NotificationRow[]; unread: number };
  certificateTypes: CertificateTypeInfo[];
}

const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  pending: 'warning',
  approved: 'info',
  rejected: 'danger',
  ready_for_release: 'info',
  released: 'success',
  cancelled: 'neutral',
};

const STEP_INDEX: Record<string, number> = {
  pending: 0,
  approved: 1,
  ready_for_release: 3,
  released: 4,
};

const STEPS = ['Submitted', 'Approved', 'Issued', 'Ready for release', 'Released'];

const COMPLETENESS_FIELDS = [
  { key: 'contactNumber', label: 'Contact number' },
  { key: 'email', label: 'Email' },
  { key: 'address', label: 'Address' },
  { key: 'purok', label: 'Purok' },
  { key: 'occupation', label: 'Occupation' },
  { key: 'monthlyIncome', label: 'Monthly income' },
] as const;

const FAQ = [
  { q: 'How do I request a certificate?', a: 'Tap “Request certificate” on this page, choose the certificate type, and describe your purpose. The Barangay Captain reviews it before issuance.' },
  { q: 'How long does processing take?', a: 'Requests are usually reviewed within the day. Wait for a notification saying your document is ready for pickup before visiting the hall.' },
  { q: 'How much do certificates cost?', a: 'Fees depend on the certificate type and are shown in the certificate list below. Payment is recorded at the Barangay Hall.' },
  { q: 'What do I bring when picking up?', a: 'Bring a valid ID and the control number from your notification. A representative needs an authorization letter and your ID.' },
  { q: 'How do I correct my record?', a: 'Use “My Profile” and submit a correction request. Only the Barangay Secretary can apply changes to your record.' },
  { q: 'Can I print my certificate?', a: 'Yes. Once issued, open “My Requests” or the recent issued list here and tap the print icon to view the PDF.' },
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function ResidentHomePage() {
  const router = useRouter();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlinked, setUnlinked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);

  const load = useCallback(async () => {
    const meRes = await api<{ user: { role: string } }>('/api/auth/me');
    if (!meRes.success || !meRes.data?.user) {
      router.replace('/login');
      return;
    }
    if (meRes.data.user.role !== 'resident') {
      router.replace('/dashboard');
      return;
    }
    const res = await api<Overview>('/api/me/overview');
    if (!res.success || !res.data) {
      if (res.message?.includes('linked')) {
        setUnlinked(true);
      } else {
        setError(res.message ?? 'Failed to load your dashboard.');
        notify.error(res.message ?? 'Failed to load your dashboard.');
      }
      setLoading(false);
      return;
    }
    setOverview(res.data);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const markRead = async (id: string) => {
    const res = await api(`/api/me/notifications/${id}/read`, { method: 'POST' });
    if (!res.success) {
      notify.error(res.message ?? 'Failed to mark notification as read.');
      return;
    }
    setOverview((prev) => {
      if (!prev) return prev;
      const items = prev.notifications.items.map((n) => (n._id === id ? { ...n, read: true } : n));
      const unread = items.filter((n) => !n.read).length;
      return { ...prev, notifications: { items, unread } };
    });
    window.dispatchEvent(new Event('abis:refresh-notifications'));
  };

  const markAllRead = async () => {
    const res = await api('/api/me/notifications/read-all', { method: 'POST' });
    if (!res.success) {
      notify.error(res.message ?? 'Failed to mark notifications as read.');
      return;
    }
    setOverview((prev) => (prev ? { ...prev, notifications: { items: prev.notifications.items.map((n) => ({ ...n, read: true })), unread: 0 } } : prev));
    window.dispatchEvent(new Event('abis:refresh-notifications'));
  };

  const openNotification = async (notification: NotificationRow) => {
    if (!notification.read) await markRead(notification._id);
    if (notification.link) router.push(notification.link);
  };

  const handleSubmitted = (message: string) => {
    notify.success(message);
    void load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="animate-spin text-accent" size={28} />
      </div>
    );
  }

  if (unlinked) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertTriangle size={18} /> Account not linked</CardTitle>
            <CardDescription>Your resident login is not yet connected to a resident record.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm text-muted">
            <p>Please visit the Barangay Hall so the Secretary can link your account to your record. Once linked, sign in again to see your dashboard.</p>
            <div><Button variant="primary" onClick={() => router.push('/me')}>Open My Profile</Button></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <AlertTriangle size={18} /> {error ?? 'Failed to load your dashboard.'}
      </div>
    );
  }

  const { profile, barangay, stats, latestRequest, recentRequests, recentIssued, recentCorrections, notifications, certificateTypes } = overview;
  const fullName = [profile.firstName, profile.middleName, profile.lastName, profile.suffix].filter(Boolean).join(' ');
  const today = new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const filledFields = COMPLETENESS_FIELDS.filter(({ key }) => {
    const value = profile[key as keyof OverviewProfile];
    return value !== undefined && value !== null && String(value).trim() !== '' && value !== '';
  });
  const completeness = Math.round((filledFields.length / COMPLETENESS_FIELDS.length) * 100);
  const missingFields = COMPLETENESS_FIELDS.filter((f) => !filledFields.includes(f));
  const stepIndex = latestRequest ? STEP_INDEX[latestRequest.status] ?? 0 : 0;
  const terminalStatus = latestRequest && ['rejected', 'cancelled'].includes(latestRequest.status) ? latestRequest.status : null;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="rounded-lg bg-primary p-6 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-white/70">{greeting()},</p>
            <h1 className="text-2xl font-semibold">{fullName}</h1>
            <p className="mt-1 text-sm text-white/70">
              {profile.purok ? `${profile.purok} · ` : ''}Resident since {new Date(profile.createdAt).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 text-right">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white"><CheckCircle2 size={14} /> Active resident</span>
            <span className="inline-flex items-center gap-1 text-xs text-white/70"><CalendarDays size={14} /> {today}</span>
          </div>
        </div>
      </div>

      {barangay.announcement && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <Megaphone size={18} className="mt-0.5 shrink-0 text-amber-700" />
          <div>
            <p className="text-sm font-semibold text-amber-900">Barangay announcement</p>
            <p className="whitespace-pre-line text-sm text-amber-800">{barangay.announcement}</p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Pending requests', value: stats.pending, icon: Clock },
          { label: 'Awaiting issuance', value: stats.approved, icon: FileText },
          { label: 'Ready for pickup', value: stats.readyForPickup, icon: Package },
          { label: 'Issued documents', value: stats.issued, icon: ClipboardList },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex-row items-center justify-between p-4 pb-0">
              <CardTitle className="text-xs font-medium text-muted">{label}</CardTitle>
              <Icon size={16} className="text-accent" />
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <p className="text-2xl font-bold text-primary">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Button onClick={() => setRequestOpen(true)} className="h-auto justify-start gap-3 py-3"><Plus size={18} /> Request certificate</Button>
        <Button variant="outline" onClick={() => router.push('/my-requests')} className="h-auto justify-start gap-3 py-3"><ClipboardList size={18} /> My Requests</Button>
        <Button variant="outline" onClick={() => router.push('/me')} className="h-auto justify-start gap-3 py-3"><IdCard size={18} /> My Profile</Button>
        <Button variant="outline" onClick={() => router.push('/me')} className="h-auto justify-start gap-3 py-3"><AlertTriangle size={18} /> Report a correction</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Latest request</CardTitle>
            <CardDescription>Track the progress of your most recent certificate request.</CardDescription>
          </CardHeader>
          <CardContent>
            {!latestRequest ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <p className="text-sm text-muted">You have not submitted any requests yet.</p>
                <Button variant="primary" onClick={() => setRequestOpen(true)}><Plus size={16} /> Request a certificate</Button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-primary">{latestRequest.certificateType?.name ?? 'Certificate'}</p>
                    <p className="text-xs text-muted">Submitted {new Date(latestRequest.createdAt).toLocaleDateString('en-PH')} · {latestRequest.purpose}</p>
                  </div>
                  <Badge tone={STATUS_TONE[latestRequest.status] ?? 'neutral'}>{latestRequest.status.replace(/_/g, ' ')}</Badge>
                </div>
                {latestRequest.controlNumber && <p className="font-mono text-xs text-primary">Control No. {latestRequest.controlNumber}</p>}
                {terminalStatus ? (
                  <div className={`rounded-md border px-3 py-2 text-sm ${terminalStatus === 'rejected' ? 'border-red-200 bg-red-50 text-red-700' : 'border-border bg-background-light text-muted'}`}>
                    This request was {terminalStatus}.
                    {latestRequest.rejectionReason ? ` Reason: ${latestRequest.rejectionReason}` : ''}
                  </div>
                ) : (
                  <ol className="grid grid-cols-5 gap-1">
                    {STEPS.map((step, index) => {
                      const reached = index <= stepIndex;
                      return (
                        <li key={step} className="flex flex-col items-center gap-1 text-center">
                          <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${reached ? 'bg-accent text-white' : 'bg-background-light text-muted'}`}>{index + 1}</span>
                          <span className={`text-[11px] leading-tight ${reached ? 'text-primary' : 'text-muted'}`}>{step}</span>
                        </li>
                      );
                    })}
                  </ol>
                )}
                <div><Button variant="outline" size="sm" onClick={() => router.push('/my-requests')}>View all requests</Button></div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profile completeness</CardTitle>
            <CardDescription>Help the Barangay reach you with complete contact details.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">{filledFields.length} of {COMPLETENESS_FIELDS.length} details filled</span>
              <span className="font-semibold text-primary">{completeness}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-background-light">
              <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${completeness}%` }} />
            </div>
            {missingFields.length > 0 ? (
              <div className="text-sm">
                <p className="text-muted">Missing:</p>
                <p className="text-foreground">{missingFields.map((f) => f.label).join(', ')}</p>
              </div>
            ) : (
              <p className="text-sm text-green-700">Your profile is complete.</p>
            )}
            {recentCorrections.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium uppercase text-muted">Correction requests</p>
                <ul className="divide-y divide-border rounded-md border border-border text-sm">
                  {recentCorrections.slice(0, 3).map((c) => (
                    <li key={c._id} className="flex items-center justify-between gap-2 px-2 py-1.5">
                      <span className="truncate text-foreground">{c.field}</span>
                      <Badge tone={c.status === 'applied' ? 'success' : c.status === 'rejected' ? 'danger' : 'warning'}>{c.status}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div><Button variant="outline" size="sm" onClick={() => router.push('/me')}>Open My Profile</Button></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent requests</CardTitle>
            <CardDescription>Your last five certificate requests.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {recentRequests.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted">No requests yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-background-light text-left text-xs uppercase text-muted">
                    <tr><th className="px-4 py-2">Date</th><th className="px-4 py-2">Certificate</th><th className="px-4 py-2">Status</th></tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentRequests.map((r) => (
                      <tr key={r._id}>
                        <td className="px-4 py-2 text-foreground">{new Date(r.createdAt).toLocaleDateString('en-PH')}</td>
                        <td className="px-4 py-2 text-primary">{r.certificateType?.name ?? '—'}</td>
                        <td className="px-4 py-2"><Badge tone={STATUS_TONE[r.status] ?? 'neutral'}>{r.status.replace(/_/g, ' ')}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent issued documents</CardTitle>
            <CardDescription>Open and print your issued certificates.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {recentIssued.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted">No issued documents yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-background-light text-left text-xs uppercase text-muted">
                    <tr><th className="px-4 py-2">Control No.</th><th className="px-4 py-2">Type</th><th className="px-4 py-2">Payment</th><th className="px-4 py-2 text-right">PDF</th></tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentIssued.map((i) => (
                      <tr key={i._id}>
                        <td className="px-4 py-2 font-mono text-xs text-primary">{i.controlNumber}</td>
                        <td className="px-4 py-2 text-foreground">{i.certificateType?.name ?? '—'}</td>
                        <td className="px-4 py-2"><Badge tone={i.paymentStatus === 'paid' ? 'success' : i.paymentStatus === 'waived' ? 'neutral' : 'warning'}>{i.paymentStatus}</Badge></td>
                        <td className="px-4 py-2 text-right">
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
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Bell size={18} /> Notifications</CardTitle>
              <CardDescription>Updates about your requests and corrections.</CardDescription>
            </div>
            {notifications.unread > 0 && <Button variant="ghost" size="sm" onClick={() => void markAllRead()}>Mark all read</Button>}
          </CardHeader>
          <CardContent className="p-0">
            {notifications.items.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted">No updates yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {notifications.items.map((n) => (
                  <li key={n._id}>
                    <button onClick={() => void openNotification(n)} className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-background">
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-accent'}`} />
                      <span className="min-w-0">
                        <span className={`block text-sm ${n.read ? 'text-foreground' : 'font-semibold text-primary'}`}>{n.title}</span>
                        <span className="block text-xs text-muted">{n.message}</span>
                        <span className="block text-[11px] text-muted">{new Date(n.createdAt).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><HelpCircle size={18} /> Help &amp; barangay information</CardTitle>
            <CardDescription>How requests work and how to reach the barangay office.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            <div className="rounded-md border border-border bg-background-light p-3">
              <p className="font-medium text-primary">{barangay.barangayName}</p>
              <p className="flex items-center gap-2 text-muted"><MapPin size={14} /> {barangay.municipality}, {barangay.province}</p>
              {barangay.officeHours && <p className="flex items-center gap-2 text-muted"><Clock size={14} /> {barangay.officeHours}</p>}
              {barangay.contactNumber && <p className="flex items-center gap-2 text-muted"><Phone size={14} /> {barangay.contactNumber}</p>}
            </div>

            <div>
              <p className="mb-1 text-xs font-medium uppercase text-muted">How to request</p>
              <ol className="list-decimal space-y-1 pl-5 text-muted">
                <li>Submit a request and state your purpose.</li>
                <li>The Barangay Captain reviews and approves it.</li>
                <li>The Secretary issues the document and records any fee.</li>
                <li>Wait for a “ready for pickup” notification, then claim it at the hall.</li>
              </ol>
            </div>

            <div>
              <p className="mb-1 text-xs font-medium uppercase text-muted">Available certificates</p>
              {certificateTypes.length === 0 ? (
                <p className="text-muted">No certificate types are available right now.</p>
              ) : (
                <ul className="divide-y divide-border rounded-md border border-border">
                  {certificateTypes.map((t) => (
                    <li key={t._id} className="flex items-center justify-between gap-2 px-3 py-2">
                      <span>
                        <span className="block text-foreground">{t.name}</span>
                        {t.description && <span className="block text-xs text-muted">{t.description}</span>}
                      </span>
                      <span className="whitespace-nowrap text-xs font-medium text-primary">PHP {t.fee.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <p className="mb-1 text-xs font-medium uppercase text-muted">Frequently asked questions</p>
              <div className="divide-y divide-border rounded-md border border-border">
                {FAQ.map((item) => (
                  <details key={item.q} className="px-3 py-2">
                    <summary className="cursor-pointer text-foreground">{item.q}</summary>
                    <p className="mt-1 text-xs text-muted">{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <CertificateRequestModal open={requestOpen} onClose={() => setRequestOpen(false)} onSubmitted={handleSubmitted} types={certificateTypes} />
    </div>
  );
}

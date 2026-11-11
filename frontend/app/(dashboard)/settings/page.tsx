'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api, type ApiUser } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/select';
import { Loader2, Save, DatabaseBackup, History, KeyRound, AlertTriangle } from 'lucide-react';

interface SettingsData {
  barangayName: string;
  municipality: string;
  province: string;
  captainName?: string;
  contactNumber?: string;
  letterheadText?: string;
  controlNumberScheme: string;
  smsEnabled: boolean;
}

interface BackupFile {
  filename: string;
  sizeBytes: number;
  createdAt: string;
}

export default function SettingsPage() {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [restoring, setRestoring] = useState(false);

  const isSecretary = user?.role === 'secretary';

  const load = async () => {
    const [meRes, settingsRes] = await Promise.all([
      api<{ user: ApiUser }>('/api/auth/me'),
      api<SettingsData>('/api/admin/settings'),
    ]);
    if (meRes.success && meRes.data) setUser(meRes.data.user);
    if (settingsRes.success && settingsRes.data) setSettings(settingsRes.data);
    const backupRes = await api<{ files: BackupFile[] }>('/api/admin/backup/logs');
    if (backupRes.success && backupRes.data) setBackups(backupRes.data.files ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const saveSettings = async (e: FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setError(null);
    const res = await api('/api/admin/settings', { method: 'PATCH', body: JSON.stringify(settings) });
    setSaving(false);
    if (!res.success) {
      setError(res.message ?? 'Failed to save settings');
      return;
    }
    setNotice('Settings saved.');
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await api('/api/admin/me/password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) });
    if (!res.success) {
      setError(res.message ?? 'Failed to change password');
      return;
    }
    setNotice('Password changed.');
    setCurrentPassword('');
    setNewPassword('');
  };

  const createBackup = async () => {
    setError(null);
    const res = await api<{ filename: string; sizeBytes: number }>('/api/admin/backup', { method: 'POST' });
    if (!res.success) {
      setError(res.message ?? 'Backup failed');
      return;
    }
    setNotice(`Backup created: ${res.data?.filename ?? ''}`);
    await load();
  };

  const restoreBackup = async (filename: string) => {
    const confirm = window.prompt('Type RESTORE to confirm, then enter your password in the next prompt.');
    if (confirm !== 'RESTORE') return;
    const password = window.prompt('Enter your password to authorize the restore:');
    if (!password) return;
    setRestoring(true);
    setError(null);
    const res = await api('/api/admin/backup/restore', { method: 'POST', body: JSON.stringify({ filename, password, confirm: 'RESTORE' }) });
    setRestoring(false);
    if (!res.success) {
      setError(res.message ?? 'Restore failed');
      return;
    }
    setNotice('Restore completed. Please sign in again.');
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary">Settings</h1>
        <p className="text-sm text-muted">Barangay profile, account security, and database backup.</p>
      </div>

      {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">{notice}</p>}

      <Card>
        <CardHeader>
          <CardTitle>My account</CardTitle>
          <CardDescription>Read-only profile. Contact the Barangay Secretary to change your role or account status.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm">
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div><dt className="text-xs uppercase text-muted">Name</dt><dd className="font-medium text-primary">{user?.fullName ?? '—'}</dd></div>
            <div><dt className="text-xs uppercase text-muted">Username</dt><dd className="font-medium text-primary">{user?.username ?? '—'}</dd></div>
            <div><dt className="text-xs uppercase text-muted">Role</dt><dd className="font-medium capitalize text-primary">{user?.role ?? '—'}</dd></div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound size={18} /> Change my password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={changePassword} className="grid gap-4 sm:grid-cols-3">
            <Field label="Current password"><Input required type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" /></Field>
            <Field label="New password"><Input required type="password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" /></Field>
            <div className="flex items-end"><Button type="submit" variant="primary"><Save size={16} /> Change</Button></div>
          </form>
        </CardContent>
      </Card>

      {isSecretary && settings && (
        <Card>
          <CardHeader>
            <CardTitle>Barangay profile</CardTitle>
            <CardDescription>Used on printed certificates and report letterheads.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveSettings} className="grid gap-4 sm:grid-cols-2">
              <Field label="Barangay name"><Input value={settings.barangayName} onChange={(e) => setSettings({ ...settings, barangayName: e.target.value })} /></Field>
              <Field label="Captain / Punong Barangay"><Input value={settings.captainName ?? ''} onChange={(e) => setSettings({ ...settings, captainName: e.target.value })} /></Field>
              <Field label="Municipality"><Input value={settings.municipality} onChange={(e) => setSettings({ ...settings, municipality: e.target.value })} /></Field>
              <Field label="Province"><Input value={settings.province} onChange={(e) => setSettings({ ...settings, province: e.target.value })} /></Field>
              <Field label="Contact number"><Input value={settings.contactNumber ?? ''} onChange={(e) => setSettings({ ...settings, contactNumber: e.target.value })} /></Field>
              <Field label="Control number scheme"><Input value={settings.controlNumberScheme} onChange={(e) => setSettings({ ...settings, controlNumberScheme: e.target.value })} /></Field>
              <div className="sm:col-span-2"><Field label="Letterhead text"><Input value={settings.letterheadText ?? ''} onChange={(e) => setSettings({ ...settings, letterheadText: e.target.value })} placeholder="e.g. Office of the Punong Barangay" /></Field></div>
              <div className="sm:col-span-2 flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 px-4 py-2">
                <span className="text-xs text-amber-800">SMS integration is a disabled placeholder (Semaphore). It cannot send messages until officially enabled.</span>
              </div>
              <div className="sm:col-span-2 flex justify-end"><Button type="submit" disabled={saving}>{saving && <Loader2 size={16} className="animate-spin" />}<Save size={16} /> Save settings</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      {isSecretary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><DatabaseBackup size={18} /> Database backup &amp; restore</CardTitle>
            <CardDescription>Backups are timestamped JSON exports of all collections, stored in the server&apos;s backups folder.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button variant="primary" className="w-fit" onClick={() => void createBackup()}><DatabaseBackup size={16} /> Create backup now</Button>
            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground"><History size={16} /> Backup history</p>
              {backups.length === 0 ? (
                <p className="text-sm text-muted">No backups yet.</p>
              ) : (
                <ul className="divide-y divide-border rounded-md border border-border text-sm">
                  {backups.map((b) => (
                    <li key={b.filename} className="flex items-center justify-between px-3 py-2">
                      <span className="font-mono text-xs text-primary">{b.filename} <span className="text-muted">({Math.round(b.sizeBytes / 1024)} KB)</span></span>
                      <Button variant="ghost" size="sm" onClick={() => void restoreBackup(b.filename)} disabled={restoring}><AlertTriangle size={14} /> Restore</Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

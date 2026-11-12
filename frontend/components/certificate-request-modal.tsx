'use client';

import { FormEvent, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Field, Select, Textarea } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

export interface CertificateTypeOption {
  _id: string;
  name: string;
  fee: number;
  active?: boolean;
}

interface CertificateRequestModalProps {
  open: boolean;
  onClose: () => void;
  onSubmitted: (message: string) => void;
  types?: CertificateTypeOption[];
}

export function CertificateRequestModal({ open, onClose, onSubmitted, types: providedTypes }: CertificateRequestModalProps) {
  const [types, setTypes] = useState<CertificateTypeOption[]>(providedTypes ?? []);
  const [certificateType, setCertificateType] = useState('');
  const [purpose, setPurpose] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (providedTypes) {
      setTypes(providedTypes.filter((t) => t.active !== false));
      return;
    }
    api<CertificateTypeOption[]>('/api/certificates/types').then((res) => {
      if (res.success && res.data) setTypes(res.data.filter((t) => t.active !== false));
    });
  }, [open, providedTypes]);

  const close = () => {
    if (saving) return;
    setCertificateType('');
    setPurpose('');
    setError(null);
    onClose();
  };

  const submitRequest = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const res = await api('/api/me/certificate-requests', {
      method: 'POST',
      body: JSON.stringify({ certificateType, purpose }),
    });
    setSaving(false);
    if (!res.success) {
      setError(res.message ?? 'Failed to submit request');
      return;
    }
    setCertificateType('');
    setPurpose('');
    onSubmitted('Request submitted. The Captain will review it — track its status on your dashboard.');
    onClose();
  };

  return (
    <Modal open={open} onClose={close} title="New Request" description="Your request goes to the Barangay Captain for approval. You will be notified of the outcome.">
      <form onSubmit={submitRequest} className="flex flex-col gap-4">
        {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <Field label="Certificate type *">
          <Select required value={certificateType} onChange={(e) => setCertificateType(e.target.value)}>
            <option value="">Select certificate type…</option>
            {types.map((t) => <option key={t._id} value={t._id}>{t.name} — PHP {t.fee.toFixed(2)}</option>)}
          </Select>
        </Field>
        <Field label="Purpose *"><Textarea required value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Employment, scholarship…" /></Field>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={close} disabled={saving}>Cancel</Button>
          <Button type="submit" disabled={saving || !certificateType || purpose.trim().length < 3}>{saving && <Loader2 size={16} className="animate-spin" />}Submit request</Button>
        </div>
      </form>
    </Modal>
  );
}

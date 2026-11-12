'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Home, FileText, HandHeart, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface Summary {
  totalResidents: number;
  totalHouseholds: number;
  pendingRequests: number;
  issuedThisMonth: number;
  servicesThisMonth: number;
  sexDistribution: { sex: string; count: number }[];
  ageDistribution: { ageGroup: string; count: number }[];
  purokDistribution: { purok: string; count: number }[];
  classificationDistribution: { classification: string; count: number }[];
  requestTrend: { month: string; count: number }[];
}

const PIE_COLORS = ['#0B2A4A', '#1469D4', '#16A765', '#F59E0B', '#1677E8'];
const AGE_ORDER = ['0-12', '13-17', '18-30', '31-59', '60+'];

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    api<{ user: { role: string } }>('/api/auth/me').then((res) => {
      if (res.success && res.data?.user.role === 'resident') {
        router.replace('/home');
        return;
      }
      api<Summary>('/api/dashboard/summary').then((summaryRes) => {
        if (!summaryRes.success || !summaryRes.data) {
          setError(summaryRes.message ?? 'Failed to load dashboard data');
        } else {
          setSummary(summaryRes.data);
        }
        setLoading(false);
      });
    });
  }, [router]);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="h-28 animate-pulse bg-white" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <AlertCircle size={18} /> {error}
      </div>
    );
  }

  const ageData = (summary?.ageDistribution ?? [])
    .slice()
    .sort((a, b) => AGE_ORDER.indexOf(a.ageGroup) - AGE_ORDER.indexOf(b.ageGroup));

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary">Dashboard</h1>
        <p className="text-sm text-muted">Integrated overview of barangay records. All figures are live from the database.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: 'Residents', value: summary?.totalResidents ?? 0, icon: Users },
          { label: 'Households', value: summary?.totalHouseholds ?? 0, icon: Home },
          { label: 'Pending requests', value: summary?.pendingRequests ?? 0, icon: FileText },
          { label: 'Issued this month', value: summary?.issuedThisMonth ?? 0, icon: FileText },
          { label: 'Services this month', value: summary?.servicesThisMonth ?? 0, icon: HandHeart },
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Age group distribution</CardTitle>
            <CardDescription>Active residents by age group</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {ageData.length === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-muted">No resident data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ageData} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D9E6F2" />
                  <XAxis dataKey="ageGroup" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Residents" fill="#1469D4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sex distribution</CardTitle>
            <CardDescription>Active residents by sex</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {(summary?.sexDistribution.length ?? 0) === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-muted">No resident data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={summary!.sexDistribution.map((d) => ({ name: d.sex === 'M' ? 'Male' : 'Female', value: d.count }))} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70}>
                    {summary!.sexDistribution.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Purok distribution</CardTitle>
            <CardDescription>Active residents by purok</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {(summary?.purokDistribution.length ?? 0) === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-muted">No resident data yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary!.purokDistribution} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D9E6F2" />
                  <XAxis dataKey="purok" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Residents" fill="#0B2A4A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Certificate requests trend</CardTitle>
            <CardDescription>Requests per month (last 12 months)</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {(summary?.requestTrend.length ?? 0) === 0 ? (
              <p className="flex h-full items-center justify-center text-sm text-muted">No requests yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary!.requestTrend} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D9E6F2" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Requests" fill="#1677E8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

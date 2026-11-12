'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronRight, Loader2, Menu } from 'lucide-react';
import { api, type ApiUser } from '@/lib/api';
import { Sidebar } from '@/components/sidebar';

const breadcrumbLabels: Record<string, string> = {
  home: 'Home',
  me: 'My Profile',
  'my-requests': 'My Requests',
  corrections: 'Correction Requests',
  dashboard: 'Dashboard',
  residents: 'Residents',
  households: 'Households',
  certificates: 'Certificates',
  services: 'Services',
  reports: 'Reports',
  users: 'User Management',
  logs: 'Activity Logs',
  settings: 'Settings',
};

const COLLAPSE_KEY = 'abis.sidebarCollapsed';

function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted">
      {segments.map((segment, index) => (
        <span key={`${segment}-${index}`} className="flex items-center gap-1">
          {index > 0 && <ChevronRight size={14} />}
          <span className={index === segments.length - 1 ? 'font-medium text-primary' : undefined}>
            {breadcrumbLabels[segment] ?? segment}
          </span>
        </span>
      ))}
    </nav>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api<{ user: ApiUser }>('/api/auth/me').then((res) => {
      if (cancelled) return;
      if (!res.success || !res.data?.user) {
        router.replace('/login');
        return;
      }
      setUser(res.data.user);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === '1');
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      return next;
    });
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-primary/40 backdrop-blur-[2px] lg:hidden" onClick={() => setMobileOpen(false)} aria-hidden />
      )}
      <Sidebar
        user={user}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapse={toggleCollapse}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-border bg-white px-6">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            aria-expanded={mobileOpen}
            className="rounded-md p-1.5 text-muted hover:bg-background-light hover:text-foreground lg:hidden"
          >
            <Menu size={20} />
          </button>
          <Breadcrumbs />
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

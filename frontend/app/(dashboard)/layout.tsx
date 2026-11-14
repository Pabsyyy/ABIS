'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2, Menu } from 'lucide-react';
import { api, type ApiUser } from '@/lib/api';
import { Sidebar } from '@/components/sidebar';
import { siteInfo, footerLinks } from '@/lib/site';

const COLLAPSE_KEY = 'abis.sidebarCollapsed';

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
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  return (
    <div className="flex h-dvh overflow-hidden print:block print:h-auto print:overflow-visible">
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
      <div className="flex min-h-0 min-w-0 flex-1 flex-col print:block">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-white px-4 sm:px-6 lg:hidden print:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            aria-expanded={mobileOpen}
            className="rounded-md p-1.5 text-muted hover:bg-background-light hover:text-foreground"
          >
            <Menu size={20} />
          </button>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 print:overflow-visible print:p-0">{children}</main>
        <footer className="shrink-0 border-t border-border bg-white px-4 py-2 text-[11px] text-muted sm:px-6 print:hidden">
          <div className="flex flex-col gap-1">
            <div className="flex flex-col items-center justify-between gap-1 sm:flex-row">
              <p className="text-center sm:text-left">
                {siteInfo.region} · {siteInfo.province} · {siteInfo.municipality}
              </p>
              <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                {footerLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="hover:text-primary">
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex flex-col items-center justify-between gap-1 sm:flex-row">
              <span className="text-center sm:text-left">
                © {new Date().getFullYear()} {siteInfo.name}, {siteInfo.municipality.replace('Municipality of ', '')}, {siteInfo.province.replace('Province of ', '')}
              </span>
              <span className="flex flex-wrap items-center justify-center gap-2">
                <span>{siteInfo.systemName}</span>
                <span aria-hidden>·</span>
                <span>{siteInfo.version}</span>
              </span>
            </div>
            <div className="flex flex-col items-center justify-between gap-1 text-center sm:flex-row sm:text-left">
              <span className="flex flex-wrap items-center justify-center gap-2">
                <span>{siteInfo.address}</span>
                <span aria-hidden>·</span>
                <span>{siteInfo.hours}</span>
                {siteInfo.phone && (
                  <>
                    <span aria-hidden>·</span>
                    <a href={`tel:${siteInfo.phone}`} className="hover:text-primary">{siteInfo.phone}</a>
                  </>
                )}
                {siteInfo.email && (
                  <>
                    <span aria-hidden>·</span>
                    <a href={`mailto:${siteInfo.email}`} className="hover:text-primary">{siteInfo.email}</a>
                  </>
                )}
              </span>
              <span className="text-[10px]">Your personal data is protected under RA 10173 (Data Privacy Act of 2012).</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

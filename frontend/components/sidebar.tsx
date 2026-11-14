'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, HandHeart, BarChart3, UserCog, ScrollText, Settings, LogOut, UserRound, Home, ClipboardList, IdCard, ListChecks, Loader2, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api, type ApiUser } from '@/lib/api';
import { notify } from '@/lib/notify';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

type NavRole = ApiUser['role'];

const navItems = [
  { href: '/home', label: 'Home', icon: Home, roles: ['resident'] as NavRole[] },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['secretary', 'treasurer', 'captain', 'other'] as NavRole[] },
  { href: '/my-requests', label: 'My Requests', icon: ClipboardList, roles: ['resident'] as NavRole[] },
  { href: '/me', label: 'My Profile', icon: IdCard, roles: ['resident'] as NavRole[] },
  { href: '/residents', label: 'Residents', icon: Users, roles: ['secretary', 'treasurer', 'captain'] as NavRole[] },
  { href: '/households', label: 'Households', icon: Home, roles: ['secretary', 'treasurer', 'captain'] as NavRole[] },
  { href: '/certificates', label: 'Certificates', icon: FileText, roles: ['secretary', 'treasurer', 'captain'] as NavRole[] },
  { href: '/services', label: 'Services', icon: HandHeart, roles: ['secretary', 'treasurer', 'captain'] as NavRole[] },
  { href: '/reports', label: 'Reports', icon: BarChart3, roles: ['secretary', 'treasurer', 'captain'] as NavRole[] },
  { href: '/users', label: 'User Management', icon: UserCog, roles: ['secretary'] as NavRole[] },
  { href: '/logs', label: 'Activity Logs', icon: ScrollText, roles: ['secretary'] as NavRole[] },
  { href: '/corrections', label: 'Corrections', icon: ListChecks, roles: ['secretary'] as NavRole[] },
  { href: '/settings', label: 'Settings', icon: Settings, roles: ['secretary', 'treasurer', 'captain', 'other'] as NavRole[] },
];

interface SidebarProps {
  user: ApiUser;
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
}

export function Sidebar({ user, collapsed, mobileOpen, onToggleCollapse, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (user.role !== 'resident') return;
    let cancelled = false;
    const loadUnread = () => {
      api<{ notifications: unknown[]; unread: number }>('/api/me/notifications').then((res) => {
        if (!cancelled && res.success && res.data) setUnread(res.data.unread);
      });
    };
    loadUnread();
    window.addEventListener('abis:refresh-notifications', loadUnread);
    return () => {
      cancelled = true;
      window.removeEventListener('abis:refresh-notifications', loadUnread);
    };
  }, [user.role, pathname]);

  const doLogout = async () => {
    setLoggingOut(true);
    try {
      const res = await api('/api/auth/logout', { method: 'POST' });
      if (!res.success) {
        notify.error(res.message ?? 'Failed to sign out. Please try again.');
        return;
      }
      window.location.replace('/login');
    } finally {
      setLoggingOut(false);
    }
  };

  const visibleItems = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <>
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex h-dvh w-64 flex-col border-r border-secondary bg-primary text-white transition-[width,transform] duration-200 print:hidden lg:static lg:z-auto lg:translate-x-0',
        collapsed ? 'lg:w-20' : 'lg:w-64',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <div className={cn('flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5 sm:py-4', collapsed && 'lg:justify-center lg:px-2')}>
        <div className="flex items-center gap-2">
          <Image
            src="/images/santiago-seal.png"
            alt="Barangay Ambucao seal"
            width={36}
            height={36}
            priority
            className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-white/25 sm:h-9 sm:w-9"
          />
          <div className={cn('leading-tight', collapsed && 'lg:hidden')}>
            <p className="text-base font-semibold">Barangay Ambucao</p>
            <p className="text-xs text-white/60">Information System</p>
          </div>
        </div>
        <button onClick={onCloseMobile} aria-label="Close navigation" className="rounded-md p-1 text-white/70 hover:bg-white/10 hover:text-white lg:hidden">
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-5" aria-label="Main navigation">
        <ul className="flex flex-col gap-1.5">
          {visibleItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onCloseMobile}
                  title={collapsed ? label : undefined}
                  aria-label={label}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-base transition-colors',
                    collapsed && 'lg:justify-center lg:px-2',
                    active ? 'bg-accent text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <Icon size={20} strokeWidth={1.75} className="shrink-0" />
                  <span className={cn(collapsed && 'lg:hidden')}>{label}</span>
                  {href === '/home' && unread > 0 && (
                    <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-amber-400" aria-label={`${unread} unread notifications`} />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-3.5">
        <button
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'mb-2 hidden w-full items-center gap-3 rounded-md px-3 py-2.5 text-base text-white/80 transition-colors hover:bg-white/10 hover:text-white lg:flex',
            collapsed && 'lg:justify-center lg:px-2'
          )}
        >
          {collapsed ? <PanelLeftOpen size={20} strokeWidth={1.75} /> : <PanelLeftClose size={20} strokeWidth={1.75} />}
          <span className={cn(collapsed && 'lg:hidden')}>{collapsed ? 'Expand' : 'Collapse'}</span>
        </button>

        <div className={cn('mb-2 flex items-center gap-2 rounded-md bg-white/5 px-3 py-2', collapsed && 'lg:justify-center lg:px-2')}>
          <UserRound size={20} className="shrink-0 text-white/70" />
          <div className={cn('min-w-0 leading-tight', collapsed && 'lg:hidden')}>
            <p className="truncate text-sm font-medium text-white">{user.fullName}</p>
            <p className="text-xs capitalize text-white/60">{user.role}</p>
          </div>
        </div>
        <button
          onClick={() => setConfirmLogout(true)}
          disabled={loggingOut}
          title={collapsed ? 'Sign out' : undefined}
          aria-label="Sign out"
          className={cn(
            'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-base text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50',
            collapsed && 'lg:justify-center lg:px-2'
          )}
        >
          <LogOut size={20} strokeWidth={1.75} className="shrink-0" />
          <span className={cn(collapsed && 'lg:hidden')}>{loggingOut ? 'Signing out…' : 'Sign out'}</span>
        </button>
      </div>
    </aside>

    <Modal
      open={confirmLogout}
      onClose={() => {
        if (!loggingOut) setConfirmLogout(false);
      }}
      title="Sign out"
      description="Are you sure you want to logout of ABIS?"
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted">You will be returned to the login page.</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmLogout(false)} disabled={loggingOut}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => void doLogout()} disabled={loggingOut}>
            {loggingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
            Sign out
          </Button>
        </div>
      </div>
    </Modal>
    </>
  );
}

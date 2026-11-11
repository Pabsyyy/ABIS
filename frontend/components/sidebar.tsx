'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Settings, LogOut, Landmark, UserRound } from 'lucide-react';
import { useState } from 'react';
import { api, type ApiUser } from '@/lib/api';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['resident', 'secretary', 'treasurer', 'captain', 'other'] },
  { href: '/users', label: 'User Management', icon: Users, roles: ['secretary'] },
  { href: '/settings', label: 'Settings', icon: Settings, roles: ['secretary', 'treasurer', 'captain', 'resident', 'other'] },
];

export function Sidebar({ user }: { user: ApiUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = async () => {
    setLoggingOut(true);
    await api('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  };

  const visibleItems = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-secondary bg-primary text-white">
      <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4">
        <Landmark size={22} className="text-accent-light" />
        <div className="leading-tight">
          <p className="text-sm font-semibold">ABIS</p>
          <p className="text-[11px] text-white/60">Barangay Ambucao</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1">
          {visibleItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                    active ? 'bg-accent text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <Icon size={18} strokeWidth={1.75} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="mb-2 flex items-center gap-2 rounded-md bg-white/5 px-3 py-2">
          <UserRound size={18} className="shrink-0 text-white/70" />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-xs font-medium text-white">{user.fullName}</p>
            <p className="text-[11px] capitalize text-white/60">{user.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          disabled={loggingOut}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
        >
          <LogOut size={18} strokeWidth={1.75} />
          {loggingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </aside>
  );
}

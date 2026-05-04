'use client';

import { logoutAction } from '@/app/actions/auth';
import type { AdminMe } from '@/lib/types/me';
import { BrainCircuit, FolderTree, LayoutDashboard, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const baseNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/content', label: 'Content Builder', icon: FolderTree },
  { href: '/mnd', label: 'MND Protocol', icon: BrainCircuit },
  { href: '/users', label: 'Users', icon: Users },
] as const;

function isNavActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') {
    return pathname === '/dashboard';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

type AdminSidebarProps = {
  me: AdminMe | null;
};

export function AdminSidebar({ me }: AdminSidebarProps) {
  const pathname = usePathname();
  const superNav =
    me?.role === 'super_admin'
      ? ([{ href: '/settings/access-requests', label: 'Заявки доступа', icon: UserPlus }] as const)
      : [];
  const navItems = [...baseNav, ...superNav];

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-[2px_0_24px_-12px_rgba(15,23,42,0.12)]">
      <div className="border-b border-sidebar-border px-4 py-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-[0.9375rem] font-semibold tracking-tight text-sidebar-foreground"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-[0.65rem] font-bold text-sidebar-primary-foreground">
            NS
          </span>
          NeuroSync
        </Link>
        <p className="mt-2 pl-10 text-xs text-muted-foreground">Админ-панель</p>
        {me ? (
          <p
            className="mt-3 truncate rounded-md bg-sidebar-accent/80 px-2 py-1.5 pl-10 text-xs text-sidebar-accent-foreground"
            title={me.email}
          >
            {me.email}
          </p>
        ) : null}
      </div>
      <nav className="flex flex-col gap-1 p-3">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isNavActive(pathname, href)
                ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                : 'text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            )}
          >
            <Icon className="size-4 shrink-0 opacity-90" aria-hidden />
            {label}
          </Link>
        ))}
      </nav>
      <form action={logoutAction} className="mt-auto border-t border-sidebar-border p-3">
        <button
          type="submit"
          className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          Выйти
        </button>
      </form>
    </aside>
  );
}

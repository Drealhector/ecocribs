import { Nav } from '@/components/design/Nav';
import Link from 'next/link';
import { LayoutDashboard, FileText, Users, FilePlus, ScrollText } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <Nav />
      <div className="flex-1 flex">
        <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-canvas-warm">
          <nav className="p-4 space-y-1">
            <SidebarLink href="/admin" icon={<LayoutDashboard className="h-4 w-4" />} label="Overview" />
            <SidebarLink href="/admin/deals" icon={<FileText className="h-4 w-4" />} label="Deals" />
            <SidebarLink href="/admin/templates" icon={<FilePlus className="h-4 w-4" />} label="Templates" />
            <SidebarLink href="/admin/users" icon={<Users className="h-4 w-4" />} label="Team" />
            <SidebarLink href="/admin/audit" icon={<ScrollText className="h-4 w-4" />} label="Audit log" />
          </nav>
          <div className="mt-auto p-4 text-2xs text-ink-soft border-t border-border-subtle">
            <p className="mono uppercase tracking-wider mb-1">Compliance</p>
            <p>SCUML reg required before launch.</p>
            <p className="mt-1">Deed of Assignment defaults to wet-ink hybrid.</p>
          </div>
        </aside>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}

function SidebarLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-ink-muted hover:bg-canvas hover:text-ink transition-colors"
    >
      <span className="text-ink-soft">{icon}</span>
      {label}
    </Link>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Map,
  LayoutDashboard,
  Building2,
  Antenna,
  Cable,
  Triangle,
  Layers,
  LogOut,
  ChevronRight,
  MapPinned,
  Circle,
} from 'lucide-react';
import toast from 'react-hot-toast';

const nav = [
  { label: 'Peta GIS', href: '/map', icon: Map, color: '#FF6A3D' },
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, color: '#FF6A3D' },

  { sep: true, label: 'Manajemen Site' },
  { label: 'Site', href: '/site', icon: MapPinned, color: '#FF6A3D' },

  { sep: true, label: 'Manajemen Aset' },
  { label: 'ODC', href: '/odc', icon: Building2, color: '#2563EB' },
  { label: 'ODP', href: '/odp', icon: Antenna, color: '#059669' },
  { label: 'Kabel', href: '/kabel', icon: Cable, color: '#7C3AED' },
  { label: 'JC', href: '/jc', icon: Layers, color: '#D97706' },
  { label: 'Tiang', href: '/tiang', icon: Triangle, color: '#6B7280' },
];

function Brand() {
  return (
    <div className="h-16 flex items-center gap-3 px-4 border-b border-slate-200/70 dark:border-white/10">
      <div className="w-10 h-10 rounded-2xl bg-[#0D0F10] grid place-items-center shadow-lg shadow-orange-500/20 dark:bg-white/10">
        <img src="/icon.svg" alt="OSP MAPPER JAGONET" className="h-8 w-8" />
      </div>

      <div className="min-w-0">
        <div className="text-sm font-extrabold leading-4 text-slate-950 dark:text-white">
          OSP MAPPER
        </div>
        <div className="font-mono text-[10px] font-bold tracking-[0.24em] text-orange-500">
          JAGONET
        </div>
      </div>
    </div>
  );
}

function NavList({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {nav.map((item: any, i) => {
        if (item.sep) {
          return (
            <div key={i} className="px-2 pt-5 pb-1">
              <span className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider dark:text-zinc-500">
                {item.label}
              </span>
            </div>
          );
        }

        const Icon = item.icon || Circle;
        const active = pathname === item.href || pathname?.startsWith(item.href + '/');

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-300 ${
              active
                ? 'bg-orange-50 text-orange-700 font-bold shadow-sm dark:bg-orange-500/15 dark:text-orange-300'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white'
            }`}
          >
            <Icon size={17} style={{ color: active ? item.color : undefined }} />
            <span className="flex-1 truncate">{item.label}</span>
            {active && <ChevronRight size={13} className="text-orange-400" />}
          </Link>
        );
      })}
    </nav>
  );
}

function Footer() {
  const logout = () => {
    localStorage.clear();
    toast.success('Logout berhasil');

    setTimeout(() => {
      window.location.href = '/login';
    }, 400);
  };

  return (
    <div className="p-3 border-t border-slate-200/70 space-y-1 dark:border-white/10">
      <button
        onClick={logout}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
      >
        <LogOut size={14} />
        Keluar
      </button>
    </div>
  );
}

export default function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      <aside className="hidden md:flex w-64 h-full bg-white/85 border-r border-slate-200/80 backdrop-blur-xl flex-col flex-shrink-0 dark:bg-[#121516]/90 dark:border-white/10">
        <Brand />
        <NavList />
        <Footer />
      </aside>

      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          <aside className="relative z-10 w-[82vw] max-w-80 h-full bg-white border-r border-slate-200 flex flex-col animate-fade-up dark:bg-[#121516] dark:border-white/10">
            <Brand />
            <NavList onClose={onClose} />
            <Footer />
          </aside>
        </div>
      )}
    </>
  );
}
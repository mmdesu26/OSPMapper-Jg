'use client';

import { useEffect, useState } from 'react';
import { Menu, Moon, Sun, Bell, Search  } from 'lucide-react';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/Common/ThemeToggle';

const titles: Record<string, string> = {
  '/map': 'Peta GIS',
  '/dashboard': 'Dashboard',
  '/site': 'Site Management',
  '/odc': 'ODC Management',
  '/odp': 'ODP Management',
  '/kabel': 'Kabel FO',
  '/jc': 'Joint Closure',
  '/tiang': 'Tiang / Pole',
};

export default function Topbar({ onMenuToggle }: { onMenuToggle: () => void }) {
  const pathname = usePathname() || '/';
  const title = Object.entries(titles).find(([k]) => pathname.startsWith(k))?.[1] || 'OSP MAPPER JAGONET';
  const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};

  return (
    <header className="h-16 bg-white/80 border-b border-slate-200/80 flex items-center px-3 sm:px-5 gap-3 flex-shrink-0 z-[9999] backdrop-blur-xl dark:bg-[#121516]/85 dark:border-white/10">
      <button onClick={onMenuToggle} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition md:hidden dark:hover:bg-white/10 dark:text-zinc-400">
        <Menu size={18} />
      </button>
      <div className="min-w-0 flex-1">
        <div className="eyebrow hidden sm:block">Jagonet Network Asset</div>
        <h1 className="text-base sm:text-lg font-extrabold text-slate-950 truncate dark:text-white">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <div className="flex items-center gap-2 ml-1 pl-3 border-l border-slate-200 dark:border-white/10">
          <div className="avatar-btn">{user.full_name?.[0] || 'A'}</div>
          <span className="hidden md:block text-xs text-slate-600 font-bold dark:text-zinc-300">{user.full_name || 'Admin'}</span>
        </div>
      </div>
    </header>
  );
}

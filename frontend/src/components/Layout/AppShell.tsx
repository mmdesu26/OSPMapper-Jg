'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const queryClient = useMemo(() => new QueryClient(), []);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isLoginPage = pathname === '/login';

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {isLoginPage ? (
        <main className="min-h-screen bg-slate-50 text-slate-950 transition-colors duration-300 dark:bg-[#0D0F10] dark:text-white">
          {children}
        </main>
      ) : (
        <div className="h-screen overflow-hidden bg-slate-50 text-slate-950 transition-colors duration-300 dark:bg-[#0D0F10] dark:text-white">
          <div className="flex h-full">
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex min-w-0 flex-1 flex-col">
              <Topbar onMenuToggle={() => setSidebarOpen(true)} />

              <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                {children}
              </main>
            </div>
          </div>
        </div>
      )}

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2500,
          style: {
            borderRadius: '16px',
            background: '#0D0F10',
            color: '#FFFFFF',
            border: '1px solid rgba(255,255,255,0.12)',
          },
          success: {
            iconTheme: {
              primary: '#FF6A3D',
              secondary: '#FFFFFF',
            },
          },
        }}
      />
    </QueryClientProvider>
  );
}
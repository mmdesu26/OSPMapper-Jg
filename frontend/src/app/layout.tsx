import type { Metadata } from 'next';
import './globals.css';
import AppShell from '@/components/Layout/AppShell';

export const metadata: Metadata = {
  title: 'OSP MAPPER JAGONET',
  description: 'OSP network asset mapping system by Jagonet',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
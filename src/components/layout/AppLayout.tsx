import type { ReactNode } from 'react';
import Header from './Header';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-background">
        {children}
      </main>
    </div>
  );
}

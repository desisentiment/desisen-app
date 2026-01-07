import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { Header } from './Header';
import { useUiStore } from '@/store/useUiStore';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Sidebar />
      <div className="lg:ml-64">
        <Header />
        <main className="p-4 sm:p-6 lg:p-8 pb-20 sm:pb-24 lg:pb-8">
          {children}
        </main>
      </div>
      {/* BottomNav only shown on mobile */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
}

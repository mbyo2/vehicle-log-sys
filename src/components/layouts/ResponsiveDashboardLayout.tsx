
import React from 'react';
import { Sidebar } from '@/components/ui/sidebar';
import { MobileNavigation } from '@/components/navigation/MobileNavigation';
import { useIsMobile } from '@/hooks/useIsMobile';

interface ResponsiveDashboardLayoutProps {
  children: React.ReactNode;
}

export function ResponsiveDashboardLayout({ children }: ResponsiveDashboardLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen flex w-full">
      <MobileNavigation />
      
      {!isMobile && <Sidebar />}
      
      <main className={`flex-1 ${isMobile ? 'pt-16' : ''}`}>
        <div className="container mx-auto p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

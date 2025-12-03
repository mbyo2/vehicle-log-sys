import React from 'react';
import { Sidebar } from '@/components/ui/sidebar';
import { MobileNavigation } from '@/components/navigation/MobileNavigation';
import { useIsMobile } from '@/hooks/useIsMobile';
import { InAppNotificationCenter } from '@/components/notifications/InAppNotificationCenter';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';

interface ResponsiveDashboardLayoutProps {
  children: React.ReactNode;
}

export function ResponsiveDashboardLayout({ children }: ResponsiveDashboardLayoutProps) {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const currentUser = user?.get();

  return (
    <div className="min-h-screen flex w-full">
      <MobileNavigation />
      
      {!isMobile && <Sidebar />}
      
      <div className="flex-1 flex flex-col">
        {/* Header with notifications */}
        {currentUser && (
          <header className={`sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${isMobile ? 'pl-16' : ''}`}>
            <div className="container flex h-14 items-center justify-end gap-2 px-4">
              <ThemeToggle />
              <InAppNotificationCenter />
            </div>
          </header>
        )}
        
        <main className="flex-1">
          <div className="container mx-auto p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

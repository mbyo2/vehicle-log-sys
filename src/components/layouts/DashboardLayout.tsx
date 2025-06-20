
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Menu, LayoutDashboard, Car, Users, FileText, Wrench, Settings, LogOut, Calendar, Building2, MessageSquare, GraduationCap, ClipboardCheck, BarChart3, UserCog } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { UserRole } from "@/types/auth";
import { useIsMobile } from "@/hooks/use-mobile";

const navigation = {
  super_admin: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Companies', href: '/companies', icon: Building2 },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'User Management', href: '/user-management', icon: UserCog },
    { name: 'Settings', href: '/settings', icon: Settings },
  ],
  company_admin: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Fleet Management', href: '/fleet', icon: Car },
    { name: 'User Management', href: '/user-management', icon: UserCog },
    { name: 'Reports', href: '/reports', icon: FileText },
    { name: 'Service Bookings', href: '/service-bookings', icon: Calendar },
    { name: 'Documents', href: '/documents', icon: FileText },
    { name: 'Settings', href: '/settings', icon: Settings },
  ],
  supervisor: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Fleet Overview', href: '/fleet', icon: Car },
    { name: 'Trip Approvals', href: '/trip-approvals', icon: ClipboardCheck },
    { name: 'Service Bookings', href: '/service-bookings', icon: Calendar },
    { name: 'Documents', href: '/documents', icon: FileText },
  ],
  driver: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Driver Portal', href: '/driver-portal', icon: LayoutDashboard },
    { name: 'My Trips', href: '/trips', icon: Car },
    { name: 'Vehicle Status', href: '/vehicle-status', icon: Wrench },
    { name: 'Messages', href: '/driver/messages', icon: MessageSquare },
    { name: 'Training', href: '/driver/trainings', icon: GraduationCap },
    { name: 'Service Bookings', href: '/service-bookings', icon: Calendar },
  ],
};

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();

  const currentProfile = profile.get();
  const userNavigation = currentProfile ? navigation[currentProfile.role as UserRole] || [] : [];

  // Close mobile menu when changing route
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const NavLinks = () => (
    <>
      {userNavigation.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.href ||
          (item.href === '/driver-portal' && location.pathname.startsWith('/driver')) ||
          (item.href === '/driver/messages' && location.pathname === '/driver/messages') ||
          (item.href === '/driver/trainings' && location.pathname === '/driver/trainings');
          
        return (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
              isActive
                ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
                : ""
            )}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{item.name}</span>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r px-4 py-6 md:flex">
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex h-14 items-center border-b px-4 font-semibold">
            Fleet Manager
          </div>
          <nav className="flex flex-1 flex-col gap-2">
            <NavLinks />
          </nav>
          <div className="border-t pt-4">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3"
              onClick={() => signOut()}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="fixed left-4 top-4 z-40 md:hidden"
            size="icon"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-full flex-col px-4 py-6">
            <div className="flex h-14 items-center border-b px-4 font-semibold">
              Fleet Manager
            </div>
            <nav className="flex flex-1 flex-col gap-2 py-4">
              <NavLinks />
            </nav>
            <div className="border-t pt-4">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3"
                onClick={() => signOut()}
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <div className={`container ${isMobile ? 'pt-16 px-4' : 'py-6'}`}>{children}</div>
      </main>
    </div>
  );
}

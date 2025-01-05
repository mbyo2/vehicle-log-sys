import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { Menu, LayoutDashboard, Car, Users, FileText, Wrench, Bell, Settings, LogOut } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

const navigation = {
  driver: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Trips', href: '/trips', icon: Car },
    { name: 'Vehicle Status', href: '/vehicle-status', icon: Wrench },
  ],
  supervisor: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Driver Management', href: '/drivers', icon: Users },
    { name: 'Trip Approvals', href: '/trip-approvals', icon: FileText },
    { name: 'Vehicle Maintenance', href: '/maintenance', icon: Wrench },
  ],
  admin: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'User Management', href: '/users', icon: Users },
    { name: 'Vehicle Fleet', href: '/fleet', icon: Car },
    { name: 'Reports', href: '/reports', icon: FileText },
    { name: 'Settings', href: '/settings', icon: Settings },
  ],
};

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const userNavigation = profile ? navigation[profile.role] : [];

  const NavLinks = () => (
    <>
      {userNavigation.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
              location.pathname === item.href &&
                "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.name}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r px-4 py-6 md:flex">
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex h-14 items-center border-b px-4 font-semibold">
            Vehicle Management
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
              Vehicle Management
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
      <main className="flex-1 overflow-y-auto">
        <div className="container py-6">{children}</div>
      </main>
    </div>
  );
}
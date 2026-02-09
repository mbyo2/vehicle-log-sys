
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { CompanySwitcher } from '@/components/navigation/CompanySwitcher';
import {
  LayoutDashboard,
  Car,
  Users,
  Settings,
  Building,
  ClipboardCheck,
  User,
  LogOut,
  Map,
  FileText,
  Wrench,
  LineChart,
  Menu,
  X,
  UserCog,
  Shield,
  Plug,
  MessageSquare,
  GraduationCap,
  Calendar,
  MapPin
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
  badge?: string;
}

export function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const isMobile = useIsMobile();

  const navItems: NavItem[] = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: 'Companies',
      href: '/companies',
      icon: <Building className="h-5 w-5" />,
      roles: ['super_admin'],
    },
    {
      title: 'Fleet',
      href: '/fleet',
      icon: <Car className="h-5 w-5" />,
      roles: ['super_admin', 'company_admin', 'supervisor'],
    },
    {
      title: 'Drivers',
      href: '/drivers',
      icon: <Users className="h-5 w-5" />,
      roles: ['super_admin', 'company_admin', 'supervisor'],
    },
    {
      title: 'Users',
      href: '/users',
      icon: <Users className="h-5 w-5" />,
      roles: ['super_admin', 'company_admin'],
    },
    {
      title: 'User Management',
      href: '/user-management',
      icon: <UserCog className="h-5 w-5" />,
      roles: ['super_admin', 'company_admin'],
    },
    {
      title: 'Trip Management',
      href: '/trip-management',
      icon: <MapPin className="h-5 w-5" />,
      roles: ['super_admin', 'company_admin', 'supervisor'],
    },
    {
      title: 'Approvals',
      href: '/trip-approvals',
      icon: <ClipboardCheck className="h-5 w-5" />,
      roles: ['super_admin', 'company_admin', 'supervisor'],
    },
    {
      title: 'Maintenance',
      href: '/maintenance',
      icon: <Wrench className="h-5 w-5" />,
      roles: ['super_admin', 'company_admin', 'supervisor'],
    },
    {
      title: 'Reports',
      href: '/reports',
      icon: <LineChart className="h-5 w-5" />,
      roles: ['super_admin', 'company_admin', 'supervisor'],
    },
    {
      title: 'Analytics',
      href: '/analytics',
      icon: <LineChart className="h-5 w-5" />,
      roles: ['super_admin', 'company_admin', 'supervisor'],
    },
    {
      title: 'Documents',
      href: '/documents',
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: 'Service Bookings',
      href: '/service-bookings',
      icon: <Calendar className="h-5 w-5" />,
    },
    // Driver-specific
    {
      title: 'Driver Portal',
      href: '/driver-portal',
      icon: <LayoutDashboard className="h-5 w-5" />,
      roles: ['driver'],
    },
    {
      title: 'My Trips',
      href: '/trips',
      icon: <Map className="h-5 w-5" />,
      roles: ['driver'],
    },
    {
      title: 'Vehicle Status',
      href: '/vehicle-status',
      icon: <Car className="h-5 w-5" />,
      roles: ['driver'],
    },
    {
      title: 'Messages',
      href: '/driver/messages',
      icon: <MessageSquare className="h-5 w-5" />,
      roles: ['driver'],
    },
    {
      title: 'Training',
      href: '/driver/trainings',
      icon: <GraduationCap className="h-5 w-5" />,
      roles: ['driver'],
    },
    // Admin-only
    {
      title: 'Security',
      href: '/security',
      icon: <Shield className="h-5 w-5" />,
      roles: ['super_admin', 'company_admin'],
    },
    {
      title: 'Integrations',
      href: '/integrations',
      icon: <Plug className="h-5 w-5" />,
      roles: ['super_admin', 'company_admin'],
    },
    {
      title: 'Settings',
      href: '/settings',
      icon: <Settings className="h-5 w-5" />,
      roles: ['company_admin', 'super_admin'],
    },
    {
      title: 'Profile',
      href: '/profile',
      icon: <User className="h-5 w-5" />,
    },
  ];

  const userRole = profile?.get()?.role;
  const currentUser = user?.get();

  if (!currentUser || !userRole || !isMobile) {
    return null;
  }

  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  });

  const handleNavClick = () => {
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden fixed top-4 left-4 z-50 bg-background/80 backdrop-blur-sm border"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Car className="h-6 w-6" />
              <span className="font-semibold">Fleet Manager</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Company Switcher */}
          <div className="p-4 border-b">
            <CompanySwitcher userId={currentUser?.id} className="w-full" />
          </div>
          
          <ScrollArea className="flex-1 p-4">
            <nav className="space-y-1">
              {filteredNavItems.map((item, index) => (
                <Link
                  key={index}
                  to={item.href}
                  onClick={handleNavClick}
                  className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors hover:bg-accent hover:text-accent-foreground ${
                    location.pathname === item.href 
                      ? 'bg-accent text-accent-foreground' 
                      : 'text-muted-foreground'
                  }`}
                >
                  {item.icon}
                  <span className="flex-1">{item.title}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              ))}
            </nav>
          </ScrollArea>
          
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => {
                signOut();
                setIsOpen(false);
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

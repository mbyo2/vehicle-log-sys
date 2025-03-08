
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
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
  MessageSquare,
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
}

export function Sidebar() {
  const location = useLocation();
  const { user, profile, signOut } = useAuth();

  const navItems: NavItem[] = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard className="mr-2 h-4 w-4" />,
    },
    {
      title: 'Companies',
      href: '/companies',
      icon: <Building className="mr-2 h-4 w-4" />,
      roles: ['super_admin'],
    },
    {
      title: 'Fleet',
      href: '/fleet',
      icon: <Car className="mr-2 h-4 w-4" />,
      roles: ['company_admin', 'supervisor'],
    },
    {
      title: 'Users',
      href: '/users',
      icon: <Users className="mr-2 h-4 w-4" />,
      roles: ['company_admin'],
    },
    {
      title: 'Documents',
      href: '/documents',
      icon: <FileText className="mr-2 h-4 w-4" />,
      roles: ['company_admin', 'supervisor'],
    },
    {
      title: 'Trip Management',
      href: '/trip-management',
      icon: <Map className="mr-2 h-4 w-4" />,
      roles: ['company_admin', 'supervisor', 'driver'],
    },
    {
      title: 'Trip Approvals',
      href: '/trip-approvals',
      icon: <ClipboardCheck className="mr-2 h-4 w-4" />,
      roles: ['supervisor'],
    },
    {
      title: 'Trips',
      href: '/trips',
      icon: <Map className="mr-2 h-4 w-4" />,
      roles: ['driver'],
    },
    {
      title: 'Vehicle Status',
      href: '/vehicle-status',
      icon: <Car className="mr-2 h-4 w-4" />,
      roles: ['driver'],
    },
    {
      title: 'Maintenance',
      href: '/maintenance',
      icon: <Wrench className="mr-2 h-4 w-4" />,
      roles: ['company_admin', 'supervisor'],
    },
    {
      title: 'Reports',
      href: '/reports',
      icon: <LineChart className="mr-2 h-4 w-4" />,
      roles: ['company_admin', 'supervisor'],
    },
    {
      title: 'Settings',
      href: '/settings',
      icon: <Settings className="mr-2 h-4 w-4" />,
      roles: ['company_admin'],
    },
    {
      title: 'Profile',
      href: '/profile',
      icon: <User className="mr-2 h-4 w-4" />,
    },
  ];

  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true; // Items without roles are shown to everyone
    if (!profile?.role) return false; // If user role is not available, don't show role-specific items
    return item.roles.includes(profile.role);
  });

  return (
    <div className="flex h-full flex-col border-r bg-background">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <Car className="h-6 w-6" />
          <span className="text-lg">Fleet Manager</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 py-2">
        <nav className="grid gap-1 px-2">
          {filteredNavItems.map((item, index) => (
            <Button
              key={index}
              variant={location.pathname === item.href ? 'secondary' : 'ghost'}
              className={cn('justify-start', location.pathname === item.href && 'bg-primary/10')}
              asChild
            >
              <Link to={item.href}>
                {item.icon}
                {item.title}
              </Link>
            </Button>
          ))}
          <Button
            variant="ghost"
            className="justify-start text-red-500 hover:bg-red-100 hover:text-red-600"
            onClick={signOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </nav>
      </ScrollArea>
    </div>
  );
}

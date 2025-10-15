
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
  Shield,
  UserCog,
  Cog,
  Calendar,
  BarChart3,
  Megaphone,
  MessageSquare,
  GraduationCap,
  TrendingUp,
  ExternalLink,
  Inbox,
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
    // Common
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard className="mr-2 h-4 w-4" />,
    },
    
    // Super Admin
    {
      title: 'Companies',
      href: '/companies',
      icon: <Building className="mr-2 h-4 w-4" />,
      roles: ['super_admin'],
    },
    {
      title: 'Advertisements',
      href: '/advertisements',
      icon: <Megaphone className="mr-2 h-4 w-4" />,
      roles: ['super_admin'],
    },
    {
      title: 'System Security',
      href: '/security',
      icon: <Shield className="mr-2 h-4 w-4" />,
      roles: ['super_admin'],
    },
    {
      title: 'Setup',
      href: '/setup',
      icon: <Cog className="mr-2 h-4 w-4" />,
      roles: ['super_admin'],
    },
    
    // Company Admin & Supervisor
    {
      title: 'Analytics',
      href: '/analytics',
      icon: <BarChart3 className="mr-2 h-4 w-4" />,
      roles: ['company_admin', 'supervisor'],
    },
    {
      title: 'Fleet',
      href: '/fleet',
      icon: <Car className="mr-2 h-4 w-4" />,
      roles: ['company_admin', 'supervisor'],
    },
    {
      title: 'Drivers',
      href: '/drivers',
      icon: <Users className="mr-2 h-4 w-4" />,
      roles: ['company_admin', 'supervisor'],
    },
    {
      title: 'Trip Management',
      href: '/trip-management',
      icon: <Map className="mr-2 h-4 w-4" />,
      roles: ['company_admin', 'supervisor'],
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
    
    // Company Admin Only
    {
      title: 'User Management',
      href: '/user-management',
      icon: <UserCog className="mr-2 h-4 w-4" />,
      roles: ['company_admin'],
    },
    {
      title: 'Integrations',
      href: '/integrations',
      icon: <ExternalLink className="mr-2 h-4 w-4" />,
      roles: ['company_admin'],
    },
    
    // Supervisor
    {
      title: 'Trip Approvals',
      href: '/trip-approvals',
      icon: <ClipboardCheck className="mr-2 h-4 w-4" />,
      roles: ['supervisor'],
    },
    
    // Driver
    {
      title: 'Driver Portal',
      href: '/driver-portal',
      icon: <Car className="mr-2 h-4 w-4" />,
      roles: ['driver'],
    },
    {
      title: 'My Trips',
      href: '/trips',
      icon: <Map className="mr-2 h-4 w-4" />,
      roles: ['driver'],
    },
    {
      title: 'New Trip',
      href: '/new-trip',
      icon: <TrendingUp className="mr-2 h-4 w-4" />,
      roles: ['driver'],
    },
    {
      title: 'Vehicle Status',
      href: '/vehicle-status',
      icon: <Wrench className="mr-2 h-4 w-4" />,
      roles: ['driver'],
    },
    {
      title: 'Messages',
      href: '/driver/messages',
      icon: <MessageSquare className="mr-2 h-4 w-4" />,
      roles: ['driver'],
    },
    {
      title: 'Training',
      href: '/driver/trainings',
      icon: <GraduationCap className="mr-2 h-4 w-4" />,
      roles: ['driver'],
    },
    
    // Shared - Multiple Roles
    {
      title: 'Service Bookings',
      href: '/service-bookings',
      icon: <Calendar className="mr-2 h-4 w-4" />,
      roles: ['company_admin', 'supervisor', 'driver'],
    },
    {
      title: 'Documents',
      href: '/documents',
      icon: <FileText className="mr-2 h-4 w-4" />,
      roles: ['company_admin', 'supervisor', 'driver'],
    },
    {
      title: 'Settings',
      href: '/settings',
      icon: <Settings className="mr-2 h-4 w-4" />,
      roles: ['company_admin', 'super_admin'],
    },
    
    // All Users
    {
      title: 'Profile',
      href: '/profile',
      icon: <User className="mr-2 h-4 w-4" />,
    },
  ];

  // Get the actual value of profile.role using .get()
  const userRole = profile?.get()?.role;
  const currentUser = user?.get();

  if (!currentUser || !userRole) {
    return null;
  }

  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true; // Items without roles are shown to everyone
    return item.roles.includes(userRole);
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

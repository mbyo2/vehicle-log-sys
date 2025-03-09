
import React, { useState } from 'react';
import { Bell, CheckCheck, MailOpen, BellRing, AlertTriangle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNotifications, NotificationType } from '@/hooks/useNotifications';
import { format, formatDistanceToNow } from 'date-fns';

export function NotificationCenter() {
  const { notifications, markAsRead, markAllAsRead, getUnreadCount, isLoading } = useNotifications(20);
  const [isOpen, setIsOpen] = useState(false);
  
  const unreadCount = getUnreadCount();
  
  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id);
  };
  
  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };
  
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'urgent':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'vehicle_issue':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'document_expiry':
        return <MailOpen className="h-5 w-5 text-amber-500" />;
      case 'approval_required':
        return <BellRing className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-destructive text-white text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-medium">Notifications</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-xs"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsRead.isPending}
            >
              <CheckCheck className="mr-1 h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>
        
        <Tabs defaultValue="all">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="important">Important</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="focus-visible:outline-none">
            <NotificationList 
              notifications={notifications || []} 
              isLoading={isLoading}
              onMarkAsRead={handleMarkAsRead}
              filter="all"
              getNotificationIcon={getNotificationIcon}
            />
          </TabsContent>
          <TabsContent value="unread" className="focus-visible:outline-none">
            <NotificationList 
              notifications={notifications?.filter(n => n.status === 'unread') || []} 
              isLoading={isLoading}
              onMarkAsRead={handleMarkAsRead}
              filter="unread"
              getNotificationIcon={getNotificationIcon}
            />
          </TabsContent>
          <TabsContent value="important" className="focus-visible:outline-none">
            <NotificationList 
              notifications={notifications?.filter(n => n.priority === 'high') || []} 
              isLoading={isLoading}
              onMarkAsRead={handleMarkAsRead}
              filter="important"
              getNotificationIcon={getNotificationIcon}
            />
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}

interface NotificationListProps {
  notifications: any[];
  isLoading: boolean;
  onMarkAsRead: (id: string) => void;
  filter: 'all' | 'unread' | 'important';
  getNotificationIcon: (type: NotificationType) => React.ReactNode;
}

function NotificationList({ notifications, isLoading, onMarkAsRead, filter, getNotificationIcon }: NotificationListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4 h-[300px]">
        <p className="text-sm text-muted-foreground">Loading notifications...</p>
      </div>
    );
  }
  
  if (!notifications.length) {
    return (
      <div className="flex flex-col items-center justify-center p-4 h-[300px]">
        <Bell className="h-10 w-10 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          {filter === 'all' 
            ? 'No notifications yet' 
            : filter === 'unread' 
              ? 'No unread notifications' 
              : 'No important notifications'}
        </p>
      </div>
    );
  }
  
  return (
    <ScrollArea className="h-[300px]">
      {notifications.map((notification) => (
        <div 
          key={notification.id} 
          className={`p-4 border-b last:border-b-0 hover:bg-muted/50 ${notification.status === 'unread' ? 'bg-muted/30' : ''}`}
          onClick={() => notification.status === 'unread' && onMarkAsRead(notification.id)}
        >
          <div className="flex">
            <div className="mr-3">
              {getNotificationIcon(notification.type)}
            </div>
            <div className="flex-1">
              <div className="flex justify-between">
                <p className={`text-sm font-medium ${notification.status === 'unread' ? '' : 'text-muted-foreground'}`}>
                  {notification.message}
                </p>
                {notification.priority === 'high' && (
                  <Badge variant="destructive" className="ml-1">
                    urgent
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        </div>
      ))}
    </ScrollArea>
  );
}

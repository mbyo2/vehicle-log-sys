import { useState, useEffect, useCallback } from 'react';

type NotificationPermission = 'default' | 'denied' | 'granted';

interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: Record<string, unknown>;
  onClick?: () => void;
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (!('Notification' in window)) {
      return;
    }
    
    setPermission(Notification.permission);
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return 'denied' as NotificationPermission;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied' as NotificationPermission;
    }
  };

  const showNotification = useCallback((options: PushNotificationOptions) => {
    if (permission !== 'granted') {
      console.log('Notification permission not granted');
      return null;
    }

    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return null;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        tag: options.tag,
        data: options.data,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        options.onClick?.();
      };

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }, [permission]);

  const sendTestNotification = useCallback(() => {
    return showNotification({
      title: 'Test Notification',
      body: 'This is a test notification from the vehicle management system.',
    });
  }, [showNotification]);

  return {
    permission,
    requestPermission,
    showNotification,
    sendTestNotification,
    isSupported: 'Notification' in window,
  };
}

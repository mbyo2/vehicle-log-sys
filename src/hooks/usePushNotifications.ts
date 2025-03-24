
import { useState, useEffect } from 'react';

type NotificationPermission = 'default' | 'denied' | 'granted';

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
      return;
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

  const sendTestNotification = () => {
    if (permission === 'granted') {
      // Show a test notification
      const notification = new Notification('Test Notification', {
        body: 'This is a test notification from the vehicle management system.',
        icon: '/placeholder.svg'
      });

      notification.onclick = () => {
        console.log('Notification clicked');
        window.focus();
        notification.close();
      };
    }
  };

  return {
    permission,
    requestPermission,
    sendTestNotification
  };
}

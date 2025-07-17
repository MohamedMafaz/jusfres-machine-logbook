import React, { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Bell } from 'lucide-react';
import { NotificationData } from '@/types/maintenance';

const NotificationToast: React.FC = () => {
  useEffect(() => {
    console.log('Setting up notification channel...');
    
    const channel = supabase.channel('maintenance_notifications');
    
    channel
      .on('broadcast', { event: 'notification' }, (payload) => {
        console.log('Received notification:', payload);
        
        const notification = payload.payload as NotificationData;
        
        // Show toast notification
        toast({
          title: "Maintenance Update",
          description: (
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-maintenance-secondary" />
              <span>{notification.message}</span>
            </div>
          ),
          duration: 5000,
        });

        // Browser notification if permission granted
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('JusFres Maintenance Update', {
            body: notification.message,
            icon: '/favicon.ico',
            tag: 'maintenance-update'
          });
        }
      })
      .subscribe((status) => {
        console.log('Notification channel status:', status);
      });

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        console.log('Notification permission:', permission);
      });
    }

    return () => {
      console.log('Cleaning up notification channel...');
      supabase.removeChannel(channel);
    };
  }, []);

  return null; // This component doesn't render anything
};

export default NotificationToast;
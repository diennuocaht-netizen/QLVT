import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../supabase-client';
import { useAuth } from './AuthContext';
import { AppNotification } from '../types/notification';
import { playNotificationSound } from '../utils/notificationService';
import { toast } from 'sonner';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const isMountedRef = useRef(true);

  // Fetch notifications for the current authenticated user
  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      return;
    }

    setLoading(true);
    try {
      // Query notifications targeted to current user, broadcast (user_id IS NULL), or matching user's role
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        // Table may not be created yet in SQL editor
        if (error.code === '42P01') {
          console.info('ℹ️ [NotificationContext] notifications table not created yet. Run migration 32-create-notifications.sql.');
        } else {
          console.warn('⚠️ [NotificationContext] Error fetching notifications:', error.message);
        }
        return;
      }

      if (isMountedRef.current && data) {
        // Filter in case RLS returns other items or role-specific items
        const filtered = data.filter((item: AppNotification) => {
          if (item.user_id && item.user_id !== user.id) return false;
          if (item.target_role && profile?.role && item.target_role !== profile.role) return false;
          return true;
        });
        setNotifications(filtered);
      }
    } catch (err) {
      console.warn('⚠️ [NotificationContext] Load error:', err);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [user, profile?.role]);

  // Initial load
  useEffect(() => {
    isMountedRef.current = true;
    fetchNotifications();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchNotifications]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('realtime_user_notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newNotif = payload.new as AppNotification;

            // Check if relevant for this user
            const isRelevant =
              (!newNotif.user_id || newNotif.user_id === user.id) &&
              (!newNotif.target_role || !profile?.role || newNotif.target_role === profile.role);

            if (isRelevant) {
              setNotifications((prev) => {
                if (prev.some((n) => n.id === newNotif.id)) return prev;
                return [newNotif, ...prev];
              });

              // Play subtle chime sound
              playNotificationSound();

              // Display Toast notification in top right corner
              const toastFn = (toast as any)[newNotif.type] || toast.info;
              toastFn(newNotif.title, {
                description: newNotif.message,
                duration: 6000,
                action: newNotif.link
                  ? {
                      label: 'Xem ngay',
                      onClick: () => {
                        window.location.hash = '';
                        window.location.href = newNotif.link!;
                      },
                    }
                  : undefined,
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as AppNotification;
            setNotifications((prev) =>
              prev.map((n) => (n.id === updated.id ? { ...n, ...updated } : n))
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setNotifications((prev) => prev.filter((n) => n.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile?.role]);

  // Mark single notification as read
  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );

    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    } catch (err) {
      console.warn('Failed to mark notification as read in DB:', err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    try {
      await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
    } catch (err) {
      console.warn('Failed to mark all as read in DB:', err);
    }
  };

  // Delete notification
  const deleteNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    try {
      await supabase.from('notifications').delete().eq('id', id);
    } catch (err) {
      console.warn('Failed to delete notification in DB:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

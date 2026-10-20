export type NotificationType = 'info' | 'warning' | 'success' | 'error';

export interface AppNotification {
  id: string;
  user_id?: string | null;
  target_role?: 'admin' | 'manager' | 'viewer' | null;
  title: string;
  message: string;
  type: NotificationType;
  link?: string | null;
  is_read: boolean;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface CreateNotificationParams {
  userId?: string | null;
  targetRole?: 'admin' | 'manager' | 'viewer' | null;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string | null;
  metadata?: Record<string, any>;
}

import { supabase } from '../supabase-client';

// Public VAPID Key used by browser to register with Web Push Service (Google/Apple)
export const VAPID_PUBLIC_KEY = 'BNSWjGKI2y5qV-EODm7gOL5jZiq02QCor0XZDFBx-YhXj4ZqRON-wNByqWLEbroP9t-IodSA-VtpE9KV_HueEhM';

/**
 * Checks if the current browser and platform supports Web Push Notifications
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Returns current permission status ('default' | 'granted' | 'denied')
 */
export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Converts a base64url string to Uint8Array for applicationServerKey
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Converts ArrayBuffer to Base64url string
 */
function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Checks if this browser instance currently has an active Push Subscription
 */
export async function getActivePushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch (err) {
    console.warn('⚠️ [Push] Failed to get active subscription:', err);
    return null;
  }
}

/**
 * Requests notification permission from user and subscribes to Web Push Service
 */
export async function subscribeToPushNotifications(userId?: string): Promise<{
  success: boolean;
  error?: string;
  subscription?: PushSubscription;
}> {
  if (!isPushSupported()) {
    return { success: false, error: 'Thiết bị hoặc trình duyệt không hỗ trợ Web Push Notification.' };
  }

  try {
    // 1. Request user permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { 
        success: false, 
        error: permission === 'denied' 
          ? 'Bạn đã từ chối cấp quyền thông báo. Vui lòng mở Cài đặt trình duyệt để cho phép.'
          : 'Chưa cấp quyền thông báo.'
      };
    }

    // 2. Wait for Service Worker
    const registration = await navigator.serviceWorker.ready;

    // 3. Check existing subscription or create new
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
    }

    // 4. Extract keys
    const endpoint = subscription.endpoint;
    const p256dhKey = subscription.getKey('p256dh');
    const authKey = subscription.getKey('auth');

    const p256dh = arrayBufferToBase64(p256dhKey);
    const auth = arrayBufferToBase64(authKey);

    // 5. Get current authenticated user ID if not provided
    let targetUserId = userId;
    if (!targetUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      targetUserId = user?.id;
    }

    // 6. Save subscription to Supabase database
    const { error: dbError } = await supabase.from('user_push_subscriptions').upsert(
      {
        user_id: targetUserId || null,
        endpoint,
        p256dh,
        auth,
        user_agent: navigator.userAgent,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'endpoint' }
    );

    if (dbError) {
      console.warn('⚠️ [Push] Subscription created but failed to save to Supabase:', dbError.message);
      // If table does not exist yet, we still return success with warning so user can test
    } else {
      console.log('✅ [Push] Device registered for Push Notifications successfully!');
    }

    return { success: true, subscription };
  } catch (err: any) {
    console.error('❌ [Push] Error subscribing to push:', err);
    return { success: false, error: err.message || 'Lỗi khi đăng ký thông báo đẩy' };
  }
}

/**
 * Unsubscribes from Web Push and removes subscription from database
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  if (!isPushSupported()) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();

      // Remove from database
      await supabase.from('user_push_subscriptions').delete().eq('endpoint', endpoint);
      console.log('✅ [Push] Unsubscribed from push notifications.');
    }
    return true;
  } catch (err) {
    console.warn('⚠️ [Push] Error unsubscribing:', err);
    return false;
  }
}

/**
 * Triggers a local test push notification directly via the Service Worker
 */
export async function sendLocalTestNotification(): Promise<boolean> {
  if (!isPushSupported()) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification('DNCT Hub - Thông báo thử nghiệm', {
      body: 'Chúc mừng! Thiết bị của bạn đã được kết nối và nhận thông báo đẩy thành công.',
      icon: '/logo.jpg',
      badge: '/icon.svg',
      data: { url: '/' },
      vibrate: [200, 100, 200]
    });
    return true;
  } catch (err) {
    console.warn('⚠️ [Push] Failed to show local notification:', err);
    return false;
  }
}

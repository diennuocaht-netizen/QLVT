import { supabase } from '../supabase-client';
import { CreateNotificationParams } from '../types/notification';

/**
 * Plays a subtle, pleasant chime using Web Audio API (synthesizer)
 * Does not require external audio files or assets.
 */
export function playNotificationSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.05);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.25); // D6

    gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime + 0.05);
    osc1.stop(ctx.currentTime + 0.35);
    osc2.stop(ctx.currentTime + 0.4);
  } catch (e) {
    // Audio context may be restricted by browser user gesture policies, ignore silently
  }
}

/**
 * Inserts a new notification into Supabase notifications table.
 * Gracefully ignores failures so main application flow is never disrupted.
 */
export async function sendNotification(params: CreateNotificationParams): Promise<boolean> {
  try {
    const payload = {
      user_id: params.userId || null,
      target_role: params.targetRole || null,
      title: params.title.trim(),
      message: params.message.trim(),
      type: params.type || 'info',
      link: params.link || null,
      is_read: false,
      metadata: params.metadata || {},
    };

    const { error } = await supabase.from('notifications').insert([payload]);

    if (error) {
      console.warn('⚠️ [NotificationService] Failed to insert notification:', error.message);
      return false;
    }

    // Trigger Web Push to registered devices (non-blocking)
    try {
      fetch('http://localhost:3001/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: payload.title,
          message: payload.message,
          link: payload.link,
          userId: payload.user_id,
        }),
      }).catch(() => {});
    } catch (_) {}

    return true;
  } catch (err) {
    console.warn('⚠️ [NotificationService] Error sending notification:', err);
    return false;
  }
}

/**
 * Helper to format relative time in Vietnamese (e.g. "Vừa xong", "15 phút trước", "Hôm qua")
 */
export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) return 'Vừa xong';
    if (diffMin < 60) return `${diffMin} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

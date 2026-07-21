import { supabase } from '../supabase-client';

export interface ActivityLogOptions {
  action: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, any>;
}

export async function logActivity(opts: ActivityLogOptions) {
  try {
    const userRes = await supabase.auth.getUser();
    const user = userRes.data?.user;
    const userId = user?.id || null;

    // Try to get a nicer display name from users table if available
    let userName: string | null = null;
    if (userId) {
      const { data } = await supabase.from('users').select('display_name,email').eq('id', userId).maybeSingle();
      if (data) userName = data.display_name || data.email || null;
    }

    const payload = {
      user_id: userId,
      user_name: userName,
      action: opts.action,
      entity_type: opts.entityType || null,
      entity_id: opts.entityId || null,
      details: opts.details || null,
    };

    // Try primary insert (matches newer migration schema)
    try {
      const { data: primaryData, error: primaryError } = await supabase.from('activity_logs').insert([payload]);
      if (!primaryError) {
        return;
      }
      console.warn('logActivity primary insert error, attempting fallback schema:', primaryError);
    } catch (primaryErr) {
      console.warn('logActivity primary insert threw:', primaryErr);
    }

    // Fallback: older migration used different column names (user_email, description, old_values/new_values)
    try {
      const fallback = {
        user_id: userId || null,
        user_email: userName || (user ? (user as any).email : null),
        action: opts.action,
        entity_type: opts.entityType || null,
        entity_id: opts.entityId || null,
        entity_name: null,
        description: opts.details ? JSON.stringify(opts.details) : null,
        old_values: null,
        new_values: opts.details || null,
        ip_address: null,
        user_agent: null,
      };

      const { data: fbData, error: fbError } = await supabase.from('activity_logs').insert([fallback]);
      if (!fbError) {
        return;
      }
      console.warn('logActivity fallback insert error:', fbError);
    } catch (fallbackErr) {
      console.warn('logActivity fallback insert threw:', fallbackErr);
    }
  } catch (err) {
    // Never throw logging errors - just console.warn so devs can see
    console.warn('logActivity error:', err);
  }
}

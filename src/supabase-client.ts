/**
 * Supabase Client
 * 
 * Thay thế cho firebase.ts
 * Sử dụng ở toàn bộ ứng dụng
 */

import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// Get credentials from environment variables (or use fallback for Vercel)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://setljfuhprinmsqztqyd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNldGxqZnVocHJpbm1zcXp0cXlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NjU1OTQsImV4cCI6MjA5MDA0MTU5NH0.G-9i8kycOc8e8ic_tU21sCeL5YQ1R73hkmkS19wWrAM';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase credentials. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local'
  );
}

// Create Supabase client
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Expose supabase client to browser global for debugging in development only
if (import.meta.env.DEV) {
  try {
    (globalThis as any).supabase = supabase;
  } catch (e) {
    // ignore in environments where globalThis cannot be written
  }
}

// ===== HELPER FUNCTIONS =====

/**
 * Lấy current user auth info
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Lấy user profile (từ users table)
 */
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId: string, updates: any) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select();
    
    if (error) throw error;
    return data?.[0] || null;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

/**
 * Sign out
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: (event: any, session: any) => void) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return subscription;
}

/**
 * File upload to Storage
 */
export async function uploadFile(bucket: string, path: string, file: File) {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });
    
    if (error) throw error;
    return data?.path || null;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

/**
 * Get public URL for file
 */
export function getPublicFileUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || '';
}

/**
 * Delete file from Storage
 */
export async function deleteFile(bucket: string, path: string) {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

/**
 * Subscribe to real-time changes
 * 
 * Example:
 * const unsubscribe = subscribeToTable('inventory_items', (payload) => {
 *   console.log('Change received!', payload)
 * })
 */
export function subscribeToTable(
  table: string,
  callback: (payload: any) => void,
  filter?: any
) {
  const channel = supabase
    .channel(`${table}-changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: table,
        ...(filter && { filter }),
      },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Batch insert records
 */
export async function batchInsert(table: string, records: any[]) {
  try {
    const { data, error } = await supabase
      .from(table)
      .insert(records)
      .select();
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error batch inserting to ${table}:`, error);
    throw error;
  }
}

/**
 * Batch update records
 */
export async function batchUpdate(table: string, records: any[], matchKey: string = 'id') {
  try {
    const updates = records.map(record => 
      supabase
        .from(table)
        .update(record)
        .eq(matchKey, record[matchKey])
    );
    
    const results = await Promise.all(updates);
    return results.map(r => r.data).flat();
  } catch (error) {
    console.error(`Error batch updating ${table}:`, error);
    throw error;
  }
}

/**
 * Handle Supabase errors
 */
export function handleSupabaseError(error: any): string {
  if (!error) return 'Unknown error';

  // Auth errors
  if (error.message?.includes('invalid')) {
    return 'Invalid credentials or session expired';
  }
  
  // Database errors
  if (error.message?.includes('duplicate')) {
    return 'Record already exists';
  }
  if (error.message?.includes('violates')) {
    return 'Data validation error';
  }
  if (error.message?.includes('permissions')) {
    return 'Permission denied - contact administrator';
  }

  // Storage errors
  if (error.message?.includes('storage')) {
    return 'File operation failed';
  }

  // Fallback
  return error.message || 'An error occurred';
}

export default supabase;

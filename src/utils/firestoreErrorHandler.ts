import { supabase } from '../supabase-client';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface SupabaseErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  timestamp: string;
}

export async function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: SupabaseErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    timestamp: new Date().toISOString()
  }
  
  // Log error based on type
  const errorStr = error instanceof Error ? error.message : String(error);
  
  if (errorStr.includes('42P01')) {
    console.error(`❌ Table không tồn tại: ${path}`);
    console.warn(`📝 FIX: Tạo table "${path}" trong Supabase bằng SQL migration`);
  } else if (errorStr.includes('permission') || errorStr.includes('PGRST')) {
    console.error(`❌ RLS Policy Error trên table: ${path}`);
    console.warn('📝 FIX: Chạy SQL script 06-quick-rls-fix.sql trong Supabase SQL Editor');
  } else {
    console.error('❌ Error: ', JSON.stringify(errInfo));
  }
}

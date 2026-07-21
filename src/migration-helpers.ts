/**
 * SUPABASE MIGRATION HELPERS
 * 自动转换 Firebase 查询为 Supabase 等效代码
 */

import { supabase } from './supabase-client';

// Type definitions
type QueryOperator = 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte' | 'in' | 'like' | 'ilike' | 'is' | 'fts';

/**
 * 替代: collection(db, 'table_name')
 * 用法: getCollection('table_name')
 */
export async function getCollection(tableName: string) {
  const { data, error } = await supabase.from(tableName).select('*');
  if (error) throw error;
  return data;
}

/**
 * 替代: query(collection(db, 'table'), where('field', '==', value))
 * 用法: queryWhere('table', 'field', 'eq', value)
 */
export async function queryWhere(
  tableName: string,
  field: string,
  operator: QueryOperator,
  value: any
) {
  let query = supabase.from(tableName).select('*');

  switch (operator) {
    case 'eq':
      query = query.eq(field, value);
      break;
    case 'neq':
      query = query.neq(field, value);
      break;
    case 'lt':
      query = query.lt(field, value);
      break;
    case 'lte':
      query = query.lte(field, value);
      break;
    case 'gt':
      query = query.gt(field, value);
      break;
    case 'gte':
      query = query.gte(field, value);
      break;
    case 'in':
      query = query.in(field, Array.isArray(value) ? value : [value]);
      break;
    case 'like':
      query = query.like(field, value);
      break;
    case 'ilike':
      query = query.ilike(field, value);
      break;
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * 替代: onSnapshot(collection(db, 'table'), (snap) => {})
 * 用法: subscribeToTable('table', (data) => {})
 */
export function subscribeToTable(
  tableName: string,
  callback: (data: any[], type: 'INSERT' | 'UPDATE' | 'DELETE') => void
) {
  const channel = supabase
    .channel(`${tableName}_changes`)
    .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, (payload) => {
      if (payload.eventType === 'INSERT') {
        callback([payload.new], 'INSERT');
      } else if (payload.eventType === 'UPDATE') {
        callback([payload.new], 'UPDATE');
      } else if (payload.eventType === 'DELETE') {
        callback([payload.old], 'DELETE');
      }
    })
    .subscribe();

  // Return unsubscribe function
  return () => supabase.removeChannel(channel);
}

/**
 * 替代: addDoc(collection(db, 'table'), data)
 * 用法: addDocument('table', data)
 */
export async function addDocument(tableName: string, data: Record<string, any>) {
  const { data: result, error } = await supabase.from(tableName).insert([data]).select();
  if (error) throw error;
  return result?.[0];
}

/**
 * 替代: updateDoc(doc(db, 'table', id), {updates})
 * 用法: updateDocument('table', id, updates)
 */
export async function updateDocument(
  tableName: string,
  id: string,
  updates: Record<string, any>
) {
  const { data, error } = await supabase.from(tableName).update(updates).eq('id', id).select();
  if (error) throw error;
  return data?.[0];
}

/**
 * 替代: deleteDoc(doc(db, 'table', id))
 * 用法: deleteDocument('table', id)
 */
export async function deleteDocument(tableName: string, id: string) {
  const { error } = await supabase.from(tableName).delete().eq('id', id);
  if (error) throw error;
}

/**
 * 批量操作
 */
export async function batchInsert(tableName: string, data: Record<string, any>[]) {
  const { data: result, error } = await supabase.from(tableName).insert(data).select();
  if (error) throw error;
  return result;
}

export async function batchUpdate(
  tableName: string,
  updates: Array<{ id: string; data: Record<string, any> }>
) {
  const results = [];
  for (const { id, data } of updates) {
    const result = await updateDocument(tableName, id, data);
    results.push(result);
  }
  return results;
}

/**
 * Field 名称映射 (Firebase → Supabase)
 */
export const fieldNameMap: Record<string, string> = {
  // Users
  uid: 'id',
  displayName: 'display_name',
  createdAt: 'created_at',
  // Inventory Items
  initialStock: 'initial_stock',
  unitPrice: 'unit_price',
  warningThresholdLower: 'warning_threshold_lower',
  warningThresholdUpper: 'warning_threshold_upper',
  priceUpdateDate: 'price_update_date',
  // Inventory Slips
  receiptType: 'receipt_type',
  requisitionIds: 'requisition_ids',
  handoverRecordUrl: 'handover_record_url',
  completionReportUrl: 'completion_report_url',
  weekOfYear: 'week_of_year',
  // Firebase 通用
  '*_at': 'created_at / updated_at',
};

/**
 * 转换 Firebase 字段名为 Supabase
 */
export function convertFieldNames(data: any): any {
  if (!data || typeof data !== 'object') return data;

  const converted: any = {};
  for (const [key, value] of Object.entries(data)) {
    const newKey = fieldNameMap[key] || key;
    converted[newKey] = value;
  }
  return converted;
}

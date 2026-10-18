import { supabase as defaultSupabase } from '../supabase-client';

/**
 * Fetches all inventory items without being capped by Supabase PostgREST default limit (1,000 rows).
 * Uses pagination with range(from, to) to retrieve the complete inventory list.
 */
export async function fetchAllItems(client: any = defaultSupabase) {
  let allItems: any[] = [];
  let from = 0;
  const step = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await client
      .from('inventory_items')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, from + step - 1);

    if (error) {
      console.error('❌ [fetchAllItems] Error fetching range', from, from + step - 1, error);
      throw error;
    }

    if (data && data.length > 0) {
      allItems = allItems.concat(data);
      if (data.length < step) {
        hasMore = false;
      } else {
        from += step;
      }
    } else {
      hasMore = false;
    }
  }

  return { data: allItems, error: null };
}

/**
 * Generic helper to fetch all rows from any table using pagination.
 */
export async function fetchAllRows(
  tableName: string,
  client: any = defaultSupabase,
  selectQuery: string = '*',
  orderBy: string = 'created_at',
  ascending: boolean = false
) {
  let allRows: any[] = [];
  let from = 0;
  const step = 1000;
  let hasMore = true;

  while (hasMore) {
    let query = client.from(tableName).select(selectQuery);
    if (orderBy) {
      query = query.order(orderBy, { ascending });
    }
    const { data, error } = await query.range(from, from + step - 1);

    if (error) {
      console.error(`❌ [fetchAllRows] Error fetching ${tableName} range ${from} - ${from + step - 1}:`, error);
      throw error;
    }

    if (data && data.length > 0) {
      allRows = allRows.concat(data);
      if (data.length < step) {
        hasMore = false;
      } else {
        from += step;
      }
    } else {
      hasMore = false;
    }
  }

  return { data: allRows, error: null };
}

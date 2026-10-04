export async function fetchAllItems(supabase) {
  let allItems = [];
  let from = 0;
  const step = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .range(from, from + step - 1);
    
    if (error) throw error;
    if (data) {
      allItems = [...allItems, ...data];
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

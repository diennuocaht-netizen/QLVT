/**
 * Utility functions to transform data between camelCase (frontend) and snake_case (database)
 */

/**
 * Convert camelCase object to snake_case object for database
 */
export function toSnakeCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    result[snakeKey] = value;
  }
  
  return result;
}

/**
 * Convert snake_case object to camelCase object for frontend
 */
export function toCamelCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = value;
  }
  
  return result;
}

/**
 * Transform inventory item from camelCase to snake_case for saving to Supabase
 * Also handles empty date fields by converting them to null
 */
export function itemToDatabase(item: Record<string, any>) {
  const transformed = toSnakeCase(item);
  
  // Remove database-managed fields that shouldn't be updated
  delete transformed.id;
  delete transformed.created_at;
  delete transformed.updated_at;
  
  // Convert empty date strings to null (PostgreSQL cannot store empty strings as dates)
  const dateFields = ['price_update_date'];
  
  for (const field of dateFields) {
    if (field in transformed) {
      // If field is empty string, convert to null
      if (transformed[field] === '' || transformed[field] === 'mm/dd/yyyy') {
        transformed[field] = null;
      }
      // If field is a valid date string, keep it
      else if (typeof transformed[field] === 'string' && transformed[field].trim()) {
        // Try to validate it's a proper date format (ISO or mm/dd/yyyy)
        const dateValue = transformed[field].trim();
        if (dateValue && dateValue !== 'mm/dd/yyyy') {
          // Keep valid dates
          transformed[field] = dateValue;
        } else {
          transformed[field] = null;
        }
      }
    }
  }
  
  // Remove undefined fields to avoid PostgreSQL issues
  Object.keys(transformed).forEach(key => {
    if (transformed[key] === undefined) {
      delete transformed[key];
    }
  });
  
  return transformed;
}

/**
 * Transform inventory item from snake_case to camelCase from database
 */
export function itemFromDatabase(item: Record<string, any>) {
  return toCamelCase(item);
}

/**
 * Transform inventory slip from camelCase to snake_case for saving to Supabase
 */
export function slipToDatabase(slip: Record<string, any>) {
  const transformed = toSnakeCase(slip);
  
  // Remove database-managed fields that shouldn't be updated
  delete transformed.id;
  delete transformed.created_at;
  delete transformed.updated_at;
  
  // Convert empty date strings to null
  // Note: Only handle date fields that actually exist in schema
  const dateFields = ['date'];
  for (const field of dateFields) {
    if (field in transformed && (transformed[field] === '' || transformed[field] === 'mm/dd/yyyy')) {
      transformed[field] = null;
    }
  }

  // Handle nested items array - each item should also be transformed
  if (transformed.items && Array.isArray(transformed.items)) {
    transformed.items = transformed.items.map((item: Record<string, any>) => {
      const transformedItem = toSnakeCase(item);
      // Remove database-managed fields from items
      delete transformedItem.id;
      delete transformedItem.created_at;
      delete transformedItem.updated_at;
      
      // Remove undefined fields from items
      Object.keys(transformedItem).forEach(key => {
        if (transformedItem[key] === undefined) {
          delete transformedItem[key];
        }
      });
      return transformedItem;
    });
  }
  
  // Remove undefined fields from top level
  Object.keys(transformed).forEach(key => {
    if (transformed[key] === undefined) {
      delete transformed[key];
    }
  });
  
  return transformed;
}

/**
 * Transform inventory slip from snake_case to camelCase from database
 */
export function slipFromDatabase(slip: Record<string, any>) {
  const transformed = toCamelCase(slip);
  // Handle nested items array
  if (transformed.items && Array.isArray(transformed.items)) {
    transformed.items = transformed.items.map((item: Record<string, any>) => toCamelCase(item));
  }
  return transformed;
}

/**
 * Transform requisition from camelCase to snake_case for saving to Supabase
 */
export function requisitionToDatabase(req: Record<string, any>) {
  const transformed = toSnakeCase(req);
  
  // Remove database-managed fields that shouldn't be updated
  delete transformed.id;
  delete transformed.created_at;
  delete transformed.updated_at;
  
  // Convert empty date strings to null
  // Note: Only handle date fields that actually exist in schema
  const dateFields = ['date'];
  for (const field of dateFields) {
    if (field in transformed && (transformed[field] === '' || transformed[field] === 'mm/dd/yyyy')) {
      transformed[field] = null;
    }
  }
  
  // Handle nested items array
  if (transformed.items && Array.isArray(transformed.items)) {
    transformed.items = transformed.items.map((item: Record<string, any>) => {
      const transformedItem = toSnakeCase(item);
      // Keep item id if present so downstream logic can match requisition item ids
      // Remove any database-managed timestamp fields from items
      delete transformedItem.created_at;
      delete transformedItem.updated_at;
      
      // Remove undefined fields from items
      Object.keys(transformedItem).forEach(key => {
        if (transformedItem[key] === undefined) {
          delete transformedItem[key];
        }
      });
      return transformedItem;
    });
  }
  
  // Remove undefined fields from top level
  Object.keys(transformed).forEach(key => {
    if (transformed[key] === undefined) {
      delete transformed[key];
    }
  });
  
  return transformed;
}

/**
 * Transform requisition from snake_case to camelCase from database
 */
export function requisitionFromDatabase(req: Record<string, any>) {
  const transformed = toCamelCase(req);
  // Handle nested items array
  if (transformed.items && Array.isArray(transformed.items)) {
    transformed.items = transformed.items.map((item: Record<string, any>) => toCamelCase(item));
  }
  return transformed;
}

/**
 * Supabase Debug Utility
 * Giúp diagnosis các vấn đề với việc lưu dữ liệu
 */

import { supabase } from '../supabase-client';

/**
 * Kiểm tra trạng thái authentication
 */
export async function checkAuthStatus() {
  console.log('=== CHECK AUTH STATUS ===');
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('❌ Auth error:', error);
      return { authenticated: false, user: null, error };
    }

    if (!user) {
      console.warn('⚠️ No authenticated user');
      return { authenticated: false, user: null };
    }

    console.log('✅ Authenticated user:');
    console.log('  - ID:', user.id);
    console.log('  - Email:', user.email);
    console.log('  - Role:', user.role);

    // Check if user exists in users table
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('❌ User profile not found:', profileError);
      return { authenticated: true, user, profile: null, profileError };
    }

    console.log('✅ User profile found:', userProfile);
    return { authenticated: true, user, profile: userProfile };
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return { authenticated: false, error };
  }
}

/**
 * Kiểm tra RLS policies
 */
export async function checkRLSPolicies() {
  console.log('\n=== CHECK RLS POLICIES ===');
  try {
    // Test insert permission on inventory_items
    const testItem = {
      code: 'TEST_' + Date.now(),
      name: 'Test Item',
      unit: 'cái',
      category: 'Test',
      classification: 'Test',
      quantity: 0,
      initial_stock: 0,
      unit_price: 0,
    };

    console.log('🧪 Testing INSERT permission on inventory_items...');
    const { data, error } = await supabase
      .from('inventory_items')
      .insert([testItem])
      .select();

    if (error) {
      console.error('❌ INSERT failed:', error);
      console.error('   Code:', error.code);
      console.error('   Message:', error.message);
      return { insertAllowed: false, error };
    }

    console.log('✅ INSERT allowed, record:', data);

    // Clean up test record
    if (data && data.length > 0) {
      await supabase
        .from('inventory_items')
        .delete()
        .eq('id', data[0].id);
      console.log('🧹 Cleaned up test record');
    }

    return { insertAllowed: true };
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return { insertAllowed: false, error };
  }
}

/**
 * Kiểm tra transformation data
 */
export async function testDataTransform() {
  console.log('\n=== TEST DATA TRANSFORM ===');
  try {
    const { itemToDatabase } = await import('./dataTransform');

    const testItem = {
      id: 'test-123',
      code: 'VT-001',
      name: 'Test Item',
      unit: 'cái',
      category: 'Test',
      classification: 'Test',
      initialStock: 100,
      unitPrice: 50000,
      warningThresholdLower: 10,
      warningThresholdUpper: 500,
      priceUpdateDate: '2024-01-01',
      notes: 'Test notes'
    };

    const transformed = itemToDatabase(testItem);
    
    console.log('✅ Transform successful:');
    console.log('   Before:', testItem);
    console.log('   After:', transformed);

    return { success: true, transformed };
  } catch (error) {
    console.error('❌ Transform failed:', error);
    return { success: false, error };
  }
}

/**
 * Check if table has RLS enabled
 */
export async function checkTableRLS() {
  console.log('\n=== CHECK TABLE RLS STATUS ===');
  try {
    // Query pg_class to see RLS status
    const { data, error } = await supabase
      .rpc('check_rls_status', {
        table_name: 'inventory_items'
      })
      .catch(() => ({ data: null, error: { message: 'RPC not available' } }));

    if (data || !error) {
      console.log('✅ RLS status check executed');
    } else {
      console.log('⚠️ Cannot check RLS status directly, attempting alternative method...');
      
      // Try reading from a restricted table to infer RLS status
      const { error: readError } = await supabase
        .from('inventory_items')
        .select('id')
        .limit(1);
      
      if (readError?.code === 'PGRST301') {
        console.log('✅ RLS is ENABLED (permission denied as expected)');
        return { rlsEnabled: true };
      } else {
        console.log('⚠️ Cannot determine RLS status');
        return { rlsEnabled: null };
      }
    }
    
    return { rlsEnabled: true };
  } catch (error) {
    console.error('❌ Error checking RLS:', error);
    return { rlsEnabled: null, error };
  }
}

/**
 * Run all diagnostic checks
 */
export async function runFullDiagnostics() {
  console.log('\n\n╔═══════════════════════════════════════════╗');
  console.log('║   SUPABASE FULL DIAGNOSTICS               ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  const results = {
    auth: await checkAuthStatus(),
    transform: await testDataTransform(),
    rls: await checkRLSPolicies(),
  };

  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║   DIAGNOSTICS SUMMARY                     ║');
  console.log('╚═══════════════════════════════════════════╝\n');
  
  const authStatus = results.auth.authenticated ? '✅ OK' : '❌ FAILED';
  const transformStatus = results.transform.success !== false ? '✅ OK' : '❌ FAILED';
  const rlsStatus = results.rls.insertAllowed ? '✅ OK' : '❌ FAILED';
  
  console.log('Authentication:', authStatus);
  console.log('Data Transform:', transformStatus);
  console.log('RLS Policies:', rlsStatus);

  console.log('\n📋 Detailed Results:\n');
  
  if (!results.auth.authenticated) {
    console.error('❌ Auth Issue: User is not authenticated. Please login first.');
    if (results.auth.profileError) {
      console.log('   └─ Profile Error:', results.auth.profileError.message);
    }
  } else {
    console.log('✅ Auth: User authenticated as', results.auth.user?.email);
    if (results.auth.profile) {
      console.log('   └─ Profile exists:', results.auth.profile.display_name);
    } else {
      console.log('   ⚠️ Profile NOT found - will be created on next operation');
    }
  }

  if (results.transform.success === false) {
    console.error('❌ Transform Issue:', results.transform.error);
  }

  if (!results.rls.insertAllowed) {
    console.error('❌ RLS Issue: INSERT permission denied');
    if (results.rls.error) {
      console.log('   └─ Error Code:', results.rls.error.code);
      console.log('   └─ Error Message:', results.rls.error.message);
      console.log('   └─ Error Hint:', results.rls.error.hint);
    }
  }

  console.log('\n💡 NEXT STEPS:\n');
  
  if (!results.auth.authenticated) {
    console.log('1. 🔐 Login to the application first');
  }
  
  if (!results.rls.insertAllowed) {
    console.log('1. 🛠️  Run SQL script: supabase-migration/06-quick-rls-fix.sql');
    console.log('2. 🔄 Reload the page (Ctrl+F5)');
    console.log('3. 🧪 Run this diagnostic again');
  }
  
  if (results.auth.authenticated && (!results.auth.profile || results.auth.profile === null)) {
    console.log('1. 🔄 Logout and login again to create user profile');
    console.log('   OR run in SQL Editor:');
    console.log(`   INSERT INTO users VALUES ('${results.auth.user?.id}', '${results.auth.user?.email}', '${results.auth.user?.email}', 'admin', NOW(), NOW());`);
  }

  return results;
}

// Export for easy access in console
(globalThis as any).supabaseDebug = {
  checkAuthStatus,
  checkRLSPolicies,
  checkTableRLS,
  testDataTransform,
  runFullDiagnostics
};

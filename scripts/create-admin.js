#!/usr/bin/env node
/**
 * Direct script to create admin account
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://setljfuhprinmsqztqyd.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY is not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function createAdmin() {
  try {
    const email = 'hoang.toan2409@gmail.com';
    const password = 'Toan@1992';
    const displayName = 'Hoang Toan';

    console.log('⏳ Creating admin account...\n');

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      throw new Error(`Auth error: ${authError.message}`);
    }

    console.log(`✅ Auth user created: ${authData.user.id}`);

    // Create user profile
    const { error: profileError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email,
          display_name: displayName,
          role: 'admin',
          created_at: new Date().toISOString(),
        },
      ]);

    if (profileError) {
      throw new Error(`Profile error: ${profileError.message}`);
    }

    console.log('✅ User profile created!\n');
    console.log('📋 Admin Account Information:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Name: ${displayName}`);
    console.log(`   Role: admin`);
    console.log('\n✨ Ready to login at http://localhost:3002/\n');

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

createAdmin();

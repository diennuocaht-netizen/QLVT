#!/usr/bin/env node
/**
 * Script để tạo nhiều user một lúc
 * Usage: SUPABASE_SERVICE_ROLE_KEY="your_key" node scripts/bulk-create-users.js
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://setljfuhprinmsqztqyd.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY is not set');
  console.error('\nSet it with:');
  console.error('  PowerShell: $env:SUPABASE_SERVICE_ROLE_KEY = "your_key"');
  console.error('  CMD: set SUPABASE_SERVICE_ROLE_KEY=your_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// List of users to create
const usersToCreate = [
  {
    email: 'hvtoan249@gmail.com',
    password: 'Toan@1992',
    displayName: 'Toàn Viewer',
    role: 'viewer'
  },
  // Add more users below as needed:
  // {
  //   email: 'manager@email.com',
  //   password: 'Manager@123456',
  //   displayName: 'Manager User',
  //   role: 'manager'
  // },
];

async function createUsers() {
  console.log('🔐 Tạo người dùng trong Supabase\n');

  let successCount = 0;
  let errorCount = 0;

  for (const user of usersToCreate) {
    try {
      console.log(`⏳ Creating ${user.email}...`);

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
      });

      if (authError) {
        throw new Error(`Auth error: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('User creation failed');
      }

      console.log(`   ✅ Auth user created: ${authData.user.id}`);

      // Create user profile in database
      const { error: profileError } = await supabase
        .from('users')
        .update({ 
          id: authData.user.id,
          role: user.role
        })
        .eq('email', user.email);

      if (profileError) {
        // If update fails, try insert
        const { error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: authData.user.id,
              email: user.email,
              display_name: user.displayName,
              role: user.role,
              created_at: new Date().toISOString(),
            }
          ]);

        if (insertError) throw insertError;
      }

      console.log(`   ✅ User profile created\n`);
      successCount++;

    } catch (error) {
      console.error(`   ❌ Error: ${error.message}\n`);
      errorCount++;
    }
  }

  console.log('\n📋 Summary:');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);

  if (successCount > 0) {
    console.log('\n🎉 Users created successfully!');
    console.log('\n📝 Login credentials:');
    usersToCreate.forEach((user, index) => {
      if (index < successCount) {
        console.log(`\n   User ${index + 1}:`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Password: ${user.password}`);
        console.log(`   Role: ${user.role}`);
      }
    });
    console.log('\n👉 Ready to login at http://localhost:3002/\n');
  }
}

createUsers();

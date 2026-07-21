#!/usr/bin/env node
/**
 * Script to create users in Supabase (requires SERVICE_ROLE_KEY)
 * Usage: node scripts/create-user.js
 */

import { createClient } from '@supabase/supabase-js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt) => new Promise((resolve) => {
  rl.question(prompt, resolve);
});

async function main() {
  console.log('🔐 Tạo Người dùng mới trong Supabase\n');

  // Get credentials
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://setljfuhprinmsqztqyd.supabase.co';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    console.error('❌ Lỗi: SUPABASE_SERVICE_ROLE_KEY không được cấu hình.');
    console.error('\n📝 Hướng dẫn cấu hình:');
    console.error('1. Vào https://app.supabase.com → project của bạn');
    console.error('2. Settings → API → Service Role Key');
    console.error('3. Copy key và chạy: export SUPABASE_SERVICE_ROLE_KEY="your_key_here"');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Input from user
  const email = await question('📧 Email: ');
  const password = await question('🔑 Mật khẩu: ');
  const displayName = await question('👤 Họ tên (tuỳ chọn): ');
  const roleInput = await question('🎯 Phân quyền (viewer/manager/admin) [viewer]: ');
  const role = roleInput || 'viewer';

  rl.close();

  try {
    console.log('\n⏳ Đang tạo người dùng...');

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      throw new Error(`Auth error: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error('User creation failed');
    }

    console.log(`✅ Auth user created: ${authData.user.id}`);

    // Create user profile
    const { error: profileError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email,
          display_name: displayName || email.split('@')[0],
          role,
          created_at: new Date().toISOString(),
        },
      ]);

    if (profileError) {
      throw new Error(`Profile error: ${profileError.message}`);
    }

    console.log(`✅ User profile created successfully!\n`);
    console.log(`📋 Thông tin người dùng:`);
    console.log(`   Email: ${email}`);
    console.log(`   Mật khẩu: ${password}`);
    console.log(`   Họ tên: ${displayName || 'N/A'}`);
    console.log(`   Phân quyền: ${role}`);
    console.log(`\n👉 Hãy gửi email và mật khẩu cho người dùng để họ có thể đăng nhập.`);
  } catch (error) {
    console.error(`\n❌ Lỗi: ${error.message}`);
    process.exit(1);
  }
}

main();

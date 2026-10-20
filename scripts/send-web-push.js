#!/usr/bin/env node
/**
 * Script gửi Web Push Notification trực tiếp đến người dùng qua web-push
 * Usage:
 *   node scripts/send-web-push.js --title="Cảnh báo tồn kho" --message="Vật tư ắc quy dưới 5 cái" --link="/inventory/items"
 */

import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read env.local if available
let env = {};
try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  envContent.split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && !k.startsWith('#')) env[k.trim()] = v.join('=').trim();
  });
} catch (_) {}

const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || 'https://setljfuhprinmsqztqyd.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BNSWjGKI2y5qV-EODm7gOL5jZiq02QCor0XZDFBx-YhXj4ZqRON-wNByqWLEbroP9t-IodSA-VtpE9KV_HueEhM';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'QAjeHk2MbxbLhlQGSLR5Ee9XINRyOlP2MiODoBk3ueQ';

webpush.setVapidDetails(
  'mailto:admin@dnct.vn',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

const supabase = createClient(supabaseUrl, supabaseKey);

// Parse CLI arguments
const args = process.argv.slice(2).reduce((acc, curr) => {
  if (curr.startsWith('--')) {
    const [k, v] = curr.substring(2).split('=');
    acc[k] = v || true;
  }
  return acc;
}, {});

const title = args.title || 'DNCT Hub Thông báo';
const message = args.message || 'Hệ thống có thông báo mới cần bạn kiểm tra.';
const link = args.link || '/';
const targetUserId = args.userId || null;

async function sendPush() {
  console.log('🚀 [WebPush] Bắt đầu gửi thông báo đẩy:');
  console.log(`   Tiêu đề: ${title}`);
  console.log(`   Nội dung: ${message}`);
  console.log(`   Đường dẫn: ${link}`);

  try {
    let query = supabase.from('user_push_subscriptions').select('*');
    if (targetUserId) {
      query = query.eq('user_id', targetUserId);
    }

    const { data: subscriptions, error } = await query;

    if (error) {
      throw new Error(`Lỗi truy vấn cơ sở dữ liệu: ${error.message}`);
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('ℹ️ Không có thiết bị nào được đăng ký trong user_push_subscriptions.');
      console.log('👉 Hãy mở ứng dụng trên điện thoại/máy tính, bấm vào biểu tượng Chuông và bật "Thông báo đẩy" trước.');
      return;
    }

    console.log(`📡 Tìm thấy ${subscriptions.length} thiết bị đăng ký. Đang phát tín hiệu...`);

    const payload = JSON.stringify({
      title,
      message,
      link,
      timestamp: Date.now()
    });

    let successCount = 0;
    let failedCount = 0;

    for (const sub of subscriptions) {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };

      try {
        await webpush.sendNotification(pushConfig, payload);
        successCount++;
        console.log(`   ✅ Gửi thành công tới: ${sub.endpoint.substring(0, 45)}...`);
      } catch (err) {
        failedCount++;
        console.warn(`   ❌ Thất bại (${err.statusCode || err.message}): ${sub.endpoint.substring(0, 45)}...`);
        // If subscription is expired or unsubscribed (410 or 404), delete from database
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from('user_push_subscriptions').delete().eq('id', sub.id);
          console.log(`      🗑️ Đã xóa subscription hết hạn khỏi database.`);
        }
      }
    }

    console.log(`\n🎉 Hoàn thành: ${successCount} thành công, ${failedCount} thất bại.`);
  } catch (err) {
    console.error('❌ Lỗi khi gửi Web Push:', err.message);
  }
}

sendPush();

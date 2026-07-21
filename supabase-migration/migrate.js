#!/usr/bin/env node

/**
 * FIREBASE → SUPABASE DATA MIGRATION SCRIPT
 * 
 * Sử dụng:
 * 1. Cài đặt dependencies: npm install firebase @supabase/supabase-js
 * 2. Set environment variables trong .env.local
 * 3. Chạy: node supabase-migration/migrate.js
 */

const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// ===== CONFIGURATION =====

const firebaseConfig = {
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  apiKey: process.env.VITE_FIREBASE_API_KEY,
};

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Validate credentials
if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: VITE_SUPABASE_URL, VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// ===== INITIALIZE CLIENTS =====

// Note: Firebase Admin SDK cần service account JSON
// Alternative: Dùng Firebase REST API với credentials

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// ===== MIGRATION FUNCTIONS =====

/**
 * 1. Migrate Users
 */
async function migrateUsers(fbUsers) {
  console.log('🔄 Migrating Users...');
  
  try {
    const { data, error } = await supabase
      .from('users')
      .upsert(fbUsers.map(u => ({
        email: u.email,
        display_name: u.displayName || u.email.split('@')[0],
        role: u.role || 'viewer',
        created_at: u.createdAt,
        updated_at: new Date().toISOString(),
      })), 
      { onConflict: 'email' }
    );

    if (error) throw error;
    console.log(`✅ Migrated ${fbUsers.length} users`);
  } catch (error) {
    console.error('❌ User migration failed:', error.message);
    throw error;
  }
}

/**
 * 2. Migrate Inventory Items
 */
async function migrateInventoryItems(fbItems) {
  console.log('🔄 Migrating Inventory Items...');
  
  try {
    const items = fbItems.map(item => ({
      code: item.code,
      name: item.name,
      unit: item.unit,
      category: item.category,
      classification: item.classification,
      quantity: item.quantity || 0,
      initial_stock: item.initialStock || 0,
      unit_price: item.unitPrice || 0,
      warning_threshold_lower: item.warningThresholdLower,
      warning_threshold_upper: item.warningThresholdUpper,
      price_update_date: item.priceUpdateDate,
      notes: item.notes,
      created_at: item.createdAt || new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('inventory_items')
      .upsert(items, { onConflict: 'code' });

    if (error) throw error;
    console.log(`✅ Migrated ${fbItems.length} inventory items`);
  } catch (error) {
    console.error('❌ Inventory items migration failed:', error.message);
    throw error;
  }
}

/**
 * 3. Migrate Subsystems
 */
async function migrateSubsystems(fbSubsystems) {
  console.log('🔄 Migrating Subsystems...');
  
  try {
    const subsystems = fbSubsystems.map(s => ({
      name: s.name,
      created_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('inventory_subsystems')
      .upsert(subsystems, { onConflict: 'name' });

    if (error) throw error;
    console.log(`✅ Migrated ${fbSubsystems.length} subsystems`);
  } catch (error) {
    console.error('❌ Subsystems migration failed:', error.message);
    throw error;
  }
}

/**
 * 4. Migrate Cost Codes
 */
async function migrateCostCodes(fbCostCodes) {
  console.log('🔄 Migrating Cost Codes...');
  
  try {
    const costCodes = fbCostCodes.map(cc => ({
      code: cc.code,
      classification: cc.classification,
      subsystem: cc.subsystem,
      purpose: cc.purpose,
      method: cc.method,
      name: `${cc.code} - ${cc.purpose}`,
      created_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('inventory_cost_codes')
      .upsert(costCodes, { onConflict: 'code' });

    if (error) throw error;
    console.log(`✅ Migrated ${fbCostCodes.length} cost codes`);
  } catch (error) {
    console.error('❌ Cost codes migration failed:', error.message);
    throw error;
  }
}

/**
 * 5. Migrate Requisitions
 */
async function migrateRequisitions(fbRequisitions) {
  console.log('🔄 Migrating Requisitions...');
  
  try {
    const requisitions = fbRequisitions.map(req => ({
      id: req.id,
      code: req.code,
      created_by: req.createdBy,
      date: req.date,
      type: req.type,
      purpose: req.purpose,
      status: req.status || 'Mới tạo',
      notes: req.notes,
      items: req.items || [],
      created_at: req.createdAt || new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('inventory_requisitions')
      .upsert(requisitions, { onConflict: 'code' });

    if (error) throw error;
    console.log(`✅ Migrated ${fbRequisitions.length} requisitions`);
  } catch (error) {
    console.error('❌ Requisitions migration failed:', error.message);
    throw error;
  }
}

/**
 * 6. Migrate Inventory Slips
 */
async function migrateInventorySlips(fbSlips) {
  console.log('🔄 Migrating Inventory Slips...');
  
  try {
    const slips = fbSlips.map(slip => ({
      id: slip.id,
      code: slip.code,
      type: slip.type,
      date: slip.date,
      created_by: slip.createdBy,
      reason: slip.reason,
      receipt_type: slip.receiptType,
      status: slip.status || 'Đang mở',
      requisition_ids: slip.requisitionIds || [],
      handover_record_url: slip.handoverRecordUrl,
      completion_report_url: slip.completionReportUrl,
      week_of_year: slip.weekOfYear,
      items: slip.items || [],
      created_at: slip.createdAt || new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('inventory_slips')
      .upsert(slips, { onConflict: 'code' });

    if (error) throw error;
    console.log(`✅ Migrated ${fbSlips.length} inventory slips`);
  } catch (error) {
    console.error('❌ Inventory slips migration failed:', error.message);
    throw error;
  }
}

/**
 * 7. Migrate Documents
 */
async function migrateDocuments(fbDocuments) {
  console.log('🔄 Migrating Documents...');
  
  try {
    const documents = fbDocuments.map(doc => ({
      id: doc.id,
      code: doc.code,
      system_code: doc.systemCode,
      system: doc.system,
      document_type: doc.documentType,
      title: doc.title,
      version: doc.version,
      issue_date: doc.issueDate,
      update_date: doc.updateDate,
      file_url: doc.fileUrl,
      author_name: doc.authorName,
      status: doc.status || 'draft',
      history: doc.history || [],
      created_at: doc.createdAt || new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('documents')
      .upsert(documents, { onConflict: 'code' });

    if (error) throw error;
    console.log(`✅ Migrated ${fbDocuments.length} documents`);
  } catch (error) {
    console.error('❌ Documents migration failed:', error.message);
    throw error;
  }
}

/**
 * 8. Migrate Devices
 */
async function migrateDevices(fbDevices) {
  console.log('🔄 Migrating Devices...');
  
  try {
    const devices = fbDevices.map(device => ({
      id: device.id,
      code: device.code,
      name: device.name,
      specs: device.specs || {},
      status: device.status,
      location: device.location,
      created_at: device.createdAt || new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('devices')
      .upsert(devices, { onConflict: 'code' });

    if (error) throw error;
    console.log(`✅ Migrated ${fbDevices.length} devices`);
  } catch (error) {
    console.error('❌ Devices migration failed:', error.message);
    throw error;
  }
}

// ===== MAIN MIGRATION FUNCTION =====

async function runMigration() {
  console.log('\n🚀 Starting Firebase → Supabase Migration...\n');

  try {
    // IMPORTANT: Chuẩn bị dữ liệu Firebase ở đây
    // Bạn sẽ load từ Firebase Firestore hoặc JSON export file
    
    // Example (cần modify based on actual Firebase data):
    const fbData = {
      users: [],           // Load từ Firebase users collection
      inventoryItems: [],  // Load từ Firebase inventory_items
      subsystems: [],      // Load từ Firebase inventory_subsystems
      costCodes: [],       // Load từ Firebase inventory_cost_codes
      requisitions: [],    // Load từ Firebase inventory_requisitions
      slips: [],           // Load từ Firebase inventory_slips
      documents: [],       // Load từ Firebase documents
      devices: [],         // Load từ Firebase devices
    };

    // Run migrations
    if (fbData.users.length > 0) await migrateUsers(fbData.users);
    if (fbData.inventoryItems.length > 0) await migrateInventoryItems(fbData.inventoryItems);
    if (fbData.subsystems.length > 0) await migrateSubsystems(fbData.subsystems);
    if (fbData.costCodes.length > 0) await migrateCostCodes(fbData.costCodes);
    if (fbData.requisitions.length > 0) await migrateRequisitions(fbData.requisitions);
    if (fbData.slips.length > 0) await migrateInventorySlips(fbData.slips);
    if (fbData.documents.length > 0) await migrateDocuments(fbData.documents);
    if (fbData.devices.length > 0) await migrateDevices(fbData.devices);

    console.log('\n✅ Migration completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runMigration();
}

module.exports = {
  migrateUsers,
  migrateInventoryItems,
  migrateSubsystems,
  migrateCostCodes,
  migrateRequisitions,
  migrateInventorySlips,
  migrateDocuments,
  migrateDevices,
};

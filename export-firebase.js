/**
 * Firebase Firestore Export Script
 * Exports all collections to JSON for Supabase migration
 */

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin SDK
// You need to download service account key from Firebase Console
// Settings → Service Accounts → Generate new private key

async function exportFirestoreData() {
  try {
    // Check if service account file exists
    const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');
    
    if (!fs.existsSync(serviceAccountPath)) {
      console.error('❌ Error: firebase-service-account.json not found!');
      console.log('\n📋 Steps to get service account key:');
      console.log('1. Go to Firebase Console → Settings ⚙️');
      console.log('2. Click "Service Accounts" tab');
      console.log('3. Click "Generate new private key"');
      console.log('4. Save file as firebase-service-account.json in project root');
      process.exit(1);
    }

    const serviceAccountRaw = fs.readFileSync(serviceAccountPath, 'utf8');
    const serviceAccount = JSON.parse(serviceAccountRaw);

    // Initialize Firebase Admin
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
    });

    const db = admin.firestore();

    // Collection names to export
    const collections = [
      'users',
      'inventory_items',
      'inventory_slips',
      'inventory_requisitions',
      'inventory_subsystems',
      'inventory_requisition_types',
      'inventory_cost_codes',
      'documents',
      'devices'
    ];

    console.log('🚀 Starting Firebase Firestore export...\n');

    const exportData = {};
    let totalRecords = 0;

    for (const colName of collections) {
      try {
        const snapshot = await db.collection(colName).get();
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        exportData[colName] = docs;
        const count = docs.length;
        totalRecords += count;

        console.log(`✅ ${colName.padEnd(30)} : ${count} records`);
      } catch (error) {
        console.log(`⚠️  ${colName.padEnd(30)} : Error - ${error.message}`);
      }
    }

    // Save to JSON file
    const outputPath = path.join(__dirname, 'firebase-export.json');
    fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));

    console.log(`\n📁 Export completed!`);
    console.log(`📊 Total records: ${totalRecords}`);
    console.log(`💾 Saved to: ${outputPath}`);
    console.log('\n✨ Next step: Run migration script to import into Supabase');

    // Close Firebase connection
    await admin.app().delete();
    process.exit(0);

  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  }
}

exportFirestoreData();

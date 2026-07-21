/**
 * List all Firestore collections
 */

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function listCollections() {
  try {
    const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');
    const serviceAccountRaw = fs.readFileSync(serviceAccountPath, 'utf8');
    const serviceAccount = JSON.parse(serviceAccountRaw);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
    });

    const db = admin.firestore();

    console.log('📚 Listing all Firestore collections...\n');

    // List collections at root level
    const collections = await db.listCollections();
    
    if (collections.length === 0) {
      console.log('❌ No collections found!');
      console.log('\n⚠️  Possible issues:');
      console.log('  1. Database is empty');
      console.log('  2. Service account permissions issue');
      console.log('  3. Collection names are different from expected');
    } else {
      console.log(`✅ Found ${collections.length} collections:\n`);
      
      for (const col of collections) {
        const colName = col.id;
        try {
          const snapshot = await col.get();
          const docCount = snapshot.size;
          console.log(`  📦 ${colName.padEnd(35)} : ${docCount} documents`);
          
          // Show first document as sample
          if (docCount > 0) {
            const firstDoc = snapshot.docs[0];
            console.log(`      Sample ID: ${firstDoc.id}`);
            console.log(`      Fields: ${Object.keys(firstDoc.data()).join(', ')}`);
          }
        } catch (error) {
          console.log(`  ❌ ${colName.padEnd(35)} : Error - ${error.message}`);
        }
      }
    }

    await admin.app().delete();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

listCollections();

#!/usr/bin/env node
/**
 * Google Drive Authentication & Access Validator
 * Check if credentials and folder access are properly configured
 */

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('\n🔐 Google Drive Authentication & Access Check\n');
console.log('=' .repeat(60));

// Step 1: Check credentials file
console.log('\n📋 STEP 1: Checking Google Service Account Credentials');

const credentialPaths = [
  'dnct-492207-9346fa26ec4f.json',
  path.join(process.cwd(), 'dnct-492207-9346fa26ec4f.json'),
  path.join(__dirname, '..', 'dnct-492207-9346fa26ec4f.json'),
];

let credentials = null;
let credentialPath = null;

for (const credPath of credentialPaths) {
  if (fs.existsSync(credPath)) {
    try {
      credentials = JSON.parse(fs.readFileSync(credPath, 'utf8'));
      credentialPath = credPath;
      console.log(`  ✅ Found credentials: ${credPath}`);
      console.log(`     📧 Service Account: ${credentials.client_email}`);
      console.log(`     🆔 Project ID: ${credentials.project_id}`);
      console.log(`     🔑 Has private key: ${!!credentials.private_key}`);
      break;
    } catch (e) {
      console.log(`  ⚠️  Error parsing ${credPath}: ${e.message}`);
    }
  }
}

if (!credentials) {
  console.log(`  ❌ Credentials file NOT found in:`);
  credentialPaths.forEach(p => console.log(`     - ${p}`));
  process.exit(1);
}

// Step 2: Test authentication
console.log('\n🔓 STEP 2: Testing Google Drive Authentication');

try {
  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  const drive = google.drive({ version: 'v3', auth });
  
  console.log(`  ✅ JWT authentication initialized`);
  console.log(`     Email: ${credentials.client_email}`);

  // Test by getting about info
  const aboutRes = await drive.about.get({ fields: 'user' });
  console.log(`  ✅ Authentication successful!`);
  console.log(`     User: ${aboutRes.data.user.displayName}`);

} catch (error) {
  console.log(`  ❌ Authentication failed: ${error.message}`);
  console.log(`     This usually means:`);
  console.log(`     - Private key is invalid or corrupted`);
  console.log(`     - Google Drive API not enabled in project`);
  console.log(`     - Credentials file is wrong`);
  process.exit(1);
}

// Step 3: Test folder access
console.log('\n📁 STEP 3: Checking Google Drive Folder Access');

const FOLDER_ID = '1PiFRRSlyZbYg5hysyjJAmJSH_4W5ddX0';

try {
  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  const drive = google.drive({ version: 'v3', auth });

  // Check if folder exists and is accessible
  const folderRes = await drive.files.get({
    fileId: FOLDER_ID,
    fields: 'id, name, mimeType, owners, permissions',
  });

  console.log(`  ✅ Folder is accessible!`);
  console.log(`     Folder name: ${folderRes.data.name}`);
  console.log(`     Folder ID: ${folderRes.data.id}`);
  console.log(`     Type: ${folderRes.data.mimeType}`);
  
  if (folderRes.data.owners && folderRes.data.owners.length > 0) {
    console.log(`     Owner: ${folderRes.data.owners[0].displayName}`);
  }

} catch (error) {
  console.log(`  ❌ Cannot access folder! Error: ${error.message}`);
  console.log(`\n     This usually means:`);
  console.log(`     1. ✋ FOLDER NOT SHARED WITH SERVICE ACCOUNT`);
  console.log(`     2. Service account email: ${credentials.client_email}`);
  console.log(`     3. Folder ID may be wrong: ${FOLDER_ID}`);
  console.log(`\n     💡 TO FIX:`);
  console.log(`     1. Open Google Drive folder in browser`);
  console.log(`     2. Click "Share" button`);
  console.log(`     3. Add service account email with EDITOR role`);
  console.log(`     4. ${credentials.client_email}`);
  console.log(`     5. Confirm by clicking "Share"`);
  process.exit(1);
}

// Step 4: Test upload permission
console.log('\n⬆️  STEP 4: Testing Upload Permission');

try {
  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  const drive = google.drive({ version: 'v3', auth });

  // Try to create a test file (but delete it immediately)
  const testFile = await drive.files.create({
    requestBody: {
      name: `.test-${Date.now()}.txt`,
      parents: [FOLDER_ID],
      description: 'Test file - will be deleted',
    },
    media: {
      mimeType: 'text/plain',
      body: 'Test content',
    },
    fields: 'id, webViewLink',
  });

  console.log(`  ✅ Upload permission test passed!`);
  console.log(`     Test file ID: ${testFile.data.id}`);

  // Clean up - delete test file
  await drive.files.delete({ fileId: testFile.data.id });
  console.log(`  🧹 Cleaned up test file`);

} catch (error) {
  console.log(`  ❌ Upload failed! Error: ${error.message}`);
  console.log(`\n     This usually means:`);
  console.log(`     1. Service account doesn't have EDITOR role`);
  console.log(`     2. Folder sharing is read-only`);
  console.log(`     3. Drive API quota exceeded`);
  process.exit(1);
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n✅ ALL CHECKS PASSED!\n');
console.log('Folder Details:');
console.log(`  📁 Folder ID: ${FOLDER_ID}`);
console.log(`  📧 Service Account: ${credentials.client_email}`);
console.log(`  🔐 Authentication: ✅ Working`);
console.log(`  📤 Upload Permission: ✅ Working`);
console.log('');
console.log('You can now use Google Drive uploads! 🚀\n');
console.log('=' .repeat(60) + '\n');

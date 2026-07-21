#!/usr/bin/env node
/**
 * Advanced Google Drive Permission Debugger
 * Checks parent folder, folder permissions, and inheritance
 */

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('\n🔧 Advanced Google Drive Permission Debugger\n');
console.log('='.repeat(70));

// Load credentials
let credentials = null;
const credentialPaths = [
  'dnct-492207-9346fa26ec4f.json',
  path.join(process.cwd(), 'dnct-492207-9346fa26ec4f.json'),
  path.join(__dirname, '..', 'dnct-492207-9346fa26ec4f.json'),
];

for (const credPath of credentialPaths) {
  if (fs.existsSync(credPath)) {
    credentials = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    console.log(`✅ Loaded credentials from: ${credPath}\n`);
    break;
  }
}

if (!credentials) {
  console.error('❌ Credentials not found!');
  process.exit(1);
}

const FOLDER_ID = '1PiFRRSlyZbYg5hysyjJAmJSH_4W5ddX0';
const SERVICE_ACCOUNT_EMAIL = credentials.client_email;

// Create auth
const auth = new google.auth.JWT({
  email: SERVICE_ACCOUNT_EMAIL,
  key: credentials.private_key,
  scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

async function runDiagnostics() {
  try {
    // 1. Check folder details
    console.log('📁 CHECK 1: Folder Details');
    const folderRes = await drive.files.get({
      fileId: FOLDER_ID,
      fields: 'id, name, parents, mimeType, webViewLink',
    });

    console.log(`  ✅ Folder: ${folderRes.data.name}`);
    console.log(`     ID: ${folderRes.data.id}`);
    console.log(`     URL: ${folderRes.data.webViewLink}`);
    if (folderRes.data.parents && folderRes.data.parents.length > 0) {
      console.log(`     Parent ID: ${folderRes.data.parents[0]}`);
    }

    // 2. Check folder permissions
    console.log('\n🔐 CHECK 2: Folder Permissions');
    const permRes = await drive.permissions.list({
      fileId: FOLDER_ID,
      fields: 'permissions(id, emailAddress, role, type)',
    });

    const permissions = permRes.data.permissions || [];
    console.log(`  📋 Total permissions: ${permissions.length}`);
    
    let serviceAccountFound = false;
    permissions.forEach((perm, idx) => {
      const email = perm.emailAddress || perm.type;
      const role = perm.role;
      console.log(`     [${idx + 1}] ${email} - ${role}`);
      
      if (email === SERVICE_ACCOUNT_EMAIL) {
        serviceAccountFound = true;
        if (role !== 'owner' && role !== 'organizer' && role !== 'editor') {
          console.log(`     ⚠️  WARNING: Service account has ${role} role, not editor!`);
        }
      }
    });

    if (!serviceAccountFound) {
      console.log(`  ⚠️  WARNING: Service account NOT in permissions list!`);
    }

    // 3. Check parent folder (if exists)
    console.log('\n👨‍👩‍👧 CHECK 3: Parent Folder Permissions');
    if (folderRes.data.parents && folderRes.data.parents.length > 0) {
      const parentId = folderRes.data.parents[0];
      const parentRes = await drive.files.get({
        fileId: parentId,
        fields: 'id, name, webViewLink',
      });

      console.log(`  ✅ Parent folder: ${parentRes.data.name}`);
      
      try {
        const parentPermRes = await drive.permissions.list({
          fileId: parentId,
          fields: 'permissions(emailAddress, role, type)',
        });

        const parentPerms = parentPermRes.data.permissions || [];
        const hasServiceAccess = parentPerms.some(p => 
          p.emailAddress === SERVICE_ACCOUNT_EMAIL
        );

        if (hasServiceAccess) {
          console.log(`  ✅ Service account has access to parent folder`);
        } else {
          console.log(`  ⚠️  Service account does NOT have access to parent!`);
          console.log(`     This might prevent uploads!`);
        }
      } catch (e) {
        console.log(`  ⚠️  Could not check parent permissions: ${e.message}`);
      }
    }

    // 4. Try real upload with detailed error
    console.log('\n⬆️  CHECK 4: Attempting Real Upload (with full error details)');
    
    try {
      const testContent = Buffer.from('Test file content - ' + Date.now());
      
      const uploadRes = await drive.files.create({
        requestBody: {
          name: `.debug-test-${Date.now()}.txt`,
          parents: [FOLDER_ID],
          description: 'Debug test - will be deleted',
        },
        media: {
          mimeType: 'text/plain',
          body: Readable.from([testContent]),
        },
        fields: 'id',
      });

      console.log(`  ✅ Upload successful! File ID: ${uploadRes.data.id}`);
      
      // Delete test file
      await drive.files.delete({ fileId: uploadRes.data.id });
      console.log(`  🧹 Cleaned up test file`);

    } catch (uploadError) {
      console.log(`  ❌ Upload failed!`);
      console.log(`     Error: ${uploadError.message}`);
      
      if (uploadError.message.includes('Insufficient permissions')) {
        console.log(`\n  💡 SOLUTIONS:`);
        console.log(`     1. Make sure service account has EDITOR role (not just view)`);
        console.log(`     2. If parent folder is shared with VIEWER role, it overrides folder`);
        console.log(`     3. Give service account EDITOR on PARENT folder too`);
        console.log(`     4. Wait 2-3 minutes for Google to propagate permissions`);
        console.log(`     5. Service Account: ${SERVICE_ACCOUNT_EMAIL}`);
      }
    }

    // 5. Summary
    console.log('\n' + '='.repeat(70));
    console.log('\n📋 SUMMARY\n');
    console.log(`Service Account: ${SERVICE_ACCOUNT_EMAIL}`);
    console.log(`Folder: ${folderRes.data.name}`);
    console.log(`Folder ID: ${FOLDER_ID}`);
    if (folderRes.data.parents) {
      console.log(`Parent: ${folderRes.data.parents[0]}`);
    }
    console.log('\n' + '='.repeat(70) + '\n');

  } catch (error) {
    console.error('❌ Diagnostic error:', error.message);
    process.exit(1);
  }
}

runDiagnostics();

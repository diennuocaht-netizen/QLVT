#!/usr/bin/env node
/**
 * Find and display folder hierarchy
 * Shows all parent folders that need permissions
 */

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let credentials = null;
const credentialPaths = [
  'dnct-492207-9346fa26ec4f.json',
  path.join(process.cwd(), 'dnct-492207-9346fa26ec4f.json'),
  path.join(__dirname, '..', 'dnct-492207-9346fa26ec4f.json'),
];

for (const credPath of credentialPaths) {
  if (fs.existsSync(credPath)) {
    credentials = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    break;
  }
}

const auth = new google.auth.JWT({
  email: credentials.client_email,
  key: credentials.private_key,
  scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

const SERVICE_ACCOUNT = credentials.client_email;
const FOLDER_ID = '1PiFRRSlyZbYg5hysyjJAmJSH_4W5ddX0';

async function getFolderHierarchy(folderId, level = 0) {
  try {
    const res = await drive.files.get({
      fileId: folderId,
      fields: 'id, name, parents, webViewLink',
    });

    const indent = '  '.repeat(level);
    console.log(`${indent}📁 ${res.data.name}`);
    console.log(`${indent}   ID: ${res.data.id}`);
    console.log(`${indent}   URL: ${res.data.webViewLink}`);

    // Check permissions
    try {
      const permRes = await drive.permissions.list({
        fileId: folderId,
        fields: 'permissions(emailAddress, role, type)',
      });

      const hasServiceAccount = permRes.data.permissions.some(
        p => p.emailAddress === SERVICE_ACCOUNT && p.role === 'editor'
      );

      if (hasServiceAccount) {
        console.log(`${indent}   ✅ Service account has EDITOR access`);
      } else {
        const hasSomeAccess = permRes.data.permissions.some(
          p => p.emailAddress === SERVICE_ACCOUNT
        );
        if (hasSomeAccess) {
          const existing = permRes.data.permissions.find(
            p => p.emailAddress === SERVICE_ACCOUNT
          );
          console.log(`${indent}   ⚠️  Service account has ${existing.role.toUpperCase()} access (need EDITOR)`);
        } else {
          console.log(`${indent}   ❌ Service account NOT shared`);
        }
      }
    } catch (e) {
      console.log(`${indent}   ⚠️  Could not check permissions`);
    }

    // Get parent
    if (res.data.parents && res.data.parents.length > 0) {
      console.log(`${indent}   ↑ Parent:`);
      const parentId = res.data.parents[0];
      await getFolderHierarchy(parentId, level + 1);
    } else {
      console.log(`${indent}   ↑ Root folder (no parent)`);
    }

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

console.log('\n📊 Folder Hierarchy & Permissions\n');
console.log('='.repeat(60));
console.log(`\nService Account: ${SERVICE_ACCOUNT}\n`);

getFolderHierarchy(FOLDER_ID).then(() => {
  console.log('\n' + '='.repeat(60));
  console.log('\n📝 INSTRUCTIONS:\n');
  console.log('All folders shown above need EDITOR access for:');
  console.log(`   ${SERVICE_ACCOUNT}\n`);
  console.log('To fix:');
  console.log('1. Go to each folder that shows ❌ or ⚠️');
  console.log('2. Right-click → Share');
  console.log('3. Add or update permissions for service account');
  console.log('4. Change role to EDITOR');
  console.log('5. Click Share to confirm\n');
  console.log('=' .repeat(60) + '\n');
});

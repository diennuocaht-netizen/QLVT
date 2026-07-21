#!/usr/bin/env node

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TOKEN_PATH = path.join(__dirname, '../oauth-token.json');

/**
 * Initialize Google Drive using OAuth token
 */
function initializeGoogleDriveOAuth() {
  if (!fs.existsSync(TOKEN_PATH)) {
    throw new Error(
      `OAuth token not found at ${TOKEN_PATH}\n` +
      `Please run: node scripts/oauth-setup.js first`
    );
  }

  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));

  const auth = new google.auth.OAuth2();
  auth.setCredentials(token);

  return {
    auth,
    drive: google.drive({ version: 'v3', auth }),
  };
}

/**
 * Upload file to Google Drive using OAuth
 */
async function testOAuthUpload() {
  console.log('\n📤 Testing OAuth Google Drive Upload\n');
  console.log('============================================================\n');

  try {
    const { drive: driveApi } = initializeGoogleDriveOAuth();
    const folderId = '1PiFRRSlyZbYg5hysyjJAmJSH_4W5ddX0';

    // Create test file content
    const testContent = Buffer.from(`Test OAuth upload at ${new Date().toISOString()}`);

    // Create file directly in folder (with OAuth, this works!)
    console.log('📝 Creating file in folder...');
    const fileMetadata = {
      name: `oauth-test-${Date.now()}.txt`,
      description: 'Test file for OAuth upload',
      parents: [folderId],
    };

    const response = await driveApi.files.create({
      requestBody: fileMetadata,
      media: {
        mimeType: 'text/plain',
        body: Readable.from([testContent]),
      },
      fields: 'id, name, webViewLink, mimeType, size, createdTime',
    });

    const fileId = response.data.id;
    console.log(`✅ File created successfully!`);
    console.log(`   File ID: ${fileId}`);
    console.log(`   File name: ${response.data.name}`);
    console.log(`   Web link: ${response.data.webViewLink}`);
    console.log(`   Size: ${response.data.size} bytes`);

    // Set file to be viewable by anyone with the link
    console.log('\n🔐 Setting file permissions...');
    try {
      await driveApi.permissions.create({
        fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
      console.log(`✅ File is now publicly viewable`);
    } catch (permError) {
      console.warn(`⚠️  Could not set public access: ${permError.message}`);
    }

    console.log('\n============================================================');
    console.log('✅ OAuth Upload Test Successful!\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error in OAuth upload test:');
    console.error(`   ${error.message}`);
    console.error('\n============================================================\n');
    process.exit(1);
  }
}

// Run test
testOAuthUpload();

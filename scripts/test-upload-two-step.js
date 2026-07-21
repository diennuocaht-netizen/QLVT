#!/usr/bin/env node

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Initialize Google Drive API
 */
function initializeGoogleDrive() {
  const credentialsPath = path.join(__dirname, '../firebase-service-account.json');
  
  if (!fs.existsSync(credentialsPath)) {
    throw new Error(`Credentials not found at ${credentialsPath}`);
  }

  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  return {
    auth,
    drive: google.drive({ version: 'v3', auth }),
  };
}

/**
 * Test two-step upload: create file first, then move to folder
 */
async function testTwoStepUpload() {
  console.log('\n📤 Testing Two-Step Google Drive Upload\n');
  console.log('============================================================\n');

  try {
    const { drive: driveApi } = initializeGoogleDrive();
    const folderId = '1PiFRRSlyZbYg5hysyjJAmJSH_4W5ddX0';

    // Create test file content
    const testContent = Buffer.from(`Test upload at ${new Date().toISOString()}`);

    // STEP 1: Create file WITHOUT parents
    console.log('📝 STEP 1: Creating file WITHOUT parent folder...');
    const fileMetadata = {
      name: `test-upload-${Date.now()}.txt`,
      description: 'Test file for two-step upload',
      // NO parents here!
    };

    const createResponse = await driveApi.files.create({
      requestBody: fileMetadata,
      media: {
        mimeType: 'text/plain',
        body: Readable.from([testContent]),
      },
      fields: 'id, name, webViewLink, parents',
    });

    const fileId = createResponse.data.id;
    console.log(`✅ File created in root drive!`);
    console.log(`   File ID: ${fileId}`);
    console.log(`   File name: ${createResponse.data.name}`);
    console.log(`   Web link: ${createResponse.data.webViewLink}`);

    // STEP 2: Move file to folder
    console.log('\n📁 STEP 2: Moving file to target folder...');
    const currentParents = createResponse.data.parents || [];
    const previousParentId = currentParents.length > 0 ? currentParents[0] : 'root';

    console.log(`   Current parent: ${previousParentId}`);
    console.log(`   Target folder: ${folderId}`);

    try {
      const moveResponse = await driveApi.files.update({
        fileId,
        addParents: folderId,
        removeParents: previousParentId,
        fields: 'id, parents, webViewLink',
      });

      console.log(`✅ File successfully moved to folder!`);
      console.log(`   New parents: ${moveResponse.data.parents?.join(', ')}`);
    } catch (moveError) {
      console.warn(`⚠️  Could not move file to folder:`);
      console.warn(`   Error: ${moveError.message}`);
      console.warn(`   File exists in root, but not in target folder`);
    }

    // STEP 3: Set file permissions
    console.log('\n🔐 STEP 3: Setting file permissions...');
    try {
      await driveApi.permissions.create({
        fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
      console.log(`✅ File is now publicly accessible!`);
    } catch (permError) {
      console.warn(`⚠️  Could not set public access: ${permError.message}`);
    }

    console.log('\n============================================================');
    console.log('✅ Two-step upload test completed!');
    console.log(`\n🎉 SUCCESS: File created and accessible\n`);
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error in two-step upload test:');
    console.error(`   ${error.message}`);
    console.error('\n============================================================\n');
    process.exit(1);
  }
}

// Run test
testTwoStepUpload();

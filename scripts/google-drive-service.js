/**
 * Google Drive Upload Service
 * Handles uploading files to Google Drive using service account credentials
 */

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load service account credentials from the file in the root directory
function loadCredentials() {
  try {
    // Look for the credential file in multiple locations
    const credentialPaths = [
      'dnct-492207-9346fa26ec4f.json',
      path.join(process.cwd(), 'dnct-492207-9346fa26ec4f.json'),
      path.join(__dirname, '..', 'dnct-492207-9346fa26ec4f.json'),
    ];

    console.log('🔍 Searching for credentials in:');
    for (const credPath of credentialPaths) {
      console.log(`  - ${credPath}`);
      if (fs.existsSync(credPath)) {
        const credentials = JSON.parse(fs.readFileSync(credPath, 'utf8'));
        console.log('✅ Loaded Google credentials from:', credPath);
        return credentials;
      }
    }

    throw new Error(`Google credentials file not found. Checked paths:\n${credentialPaths.join('\n')}`);
  } catch (error) {
    console.error('❌ Failed to load Google credentials:', error.message);
    throw error;
  }
}

let auth = null;
let drive = null;

/**
 * Initialize Google Drive API
 */
export function initializeGoogleDrive() {
  try {
    if (auth && drive) {
      return { auth, drive };
    }

    const credentials = loadCredentials();

    // Create JWT auth
    auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    // Create Drive API instance
    drive = google.drive({ version: 'v3', auth });

    console.log('✅ Google Drive API initialized');
    return { auth, drive };
  } catch (error) {
    console.error('❌ Error initializing Google Drive:', error.message);
    throw error;
  }
}

/**
 * Upload file to Google Drive
 * @param {Buffer} fileBuffer - File content as buffer
 * @param {string} fileName - Original file name
 * @param {string} mimeType - File MIME type
 * @param {string} folderId - Google Drive folder ID
 * @returns {Promise<Object>} File metadata with webViewLink
 */
export async function uploadToGoogleDrive(fileBuffer, fileName, mimeType, folderId) {
  try {
    const { drive: driveApi } = initializeGoogleDrive();

    // Create file metadata WITHOUT parents first
    const fileMetadata = {
      name: `${new Date().getTime()}-${fileName}`,
      description: `Uploaded from inventory management system at ${new Date().toISOString()}`,
    };

    console.log(`📤 Uploading to Google Drive: ${fileMetadata.name}`);
    console.log(`📁 Target Folder ID: ${folderId}`);
    console.log(`📎 File size: ${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB`);

    // Upload file WITHOUT specifying parent
    const response = await driveApi.files.create({
      requestBody: fileMetadata,
      media: {
        mimeType,
        body: Readable.from([fileBuffer]),
      },
      fields: 'id, name, webViewLink, mimeType, size, createdTime, parents',
    });

    const fileId = response.data.id;
    const webViewLink = response.data.webViewLink;

    console.log('✅ File uploaded successfully');
    console.log(`📎 File ID: ${fileId}`);

    // Now move/add it to the folder
    try {
      console.log(`📁 Moving file to folder: ${folderId}`);
      
      // Get current parents (should be user's root)
      const currentParents = response.data.parents || [];
      const currentParentStr = currentParents.length > 0 ? currentParents[0] : 'root';
      
      // Move file to target folder
      await driveApi.files.update({
        fileId,
        addParents: folderId,
        removeParents: currentParentStr,
        fields: 'id, parents, webViewLink',
      });

      console.log(`✅ File moved to target folder successfully`);
    } catch (moveError) {
      console.warn(`⚠️  Could not move file to folder: ${moveError.message}`);
      console.warn(`ℹ️  File was created but not in target folder`);
      // Continue - file is still valid, just not in the folder
    }

    // Set file to be viewable by anyone with the link (optional)
    try {
      await driveApi.permissions.create({
        fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
      console.log('✅ File is now publicly viewable');
    } catch (permError) {
      console.warn('⚠️ Could not set public access:', permError.message);
      // Continue anyway - file is still accessible via the link
    }

    return {
      success: true,
      fileId,
      fileName: response.data.name,
      webViewLink,
      mimeType: response.data.mimeType,
      size: response.data.size,
      createdTime: response.data.createdTime,
    };
  } catch (error) {
    console.error('❌ Error uploading to Google Drive:', error.message);
    throw new Error(`Failed to upload to Google Drive: ${error.message}`);
  }
}

export default {
  initializeGoogleDrive,
  uploadToGoogleDrive,
};

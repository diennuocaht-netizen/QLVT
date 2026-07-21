#!/usr/bin/env node

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TOKEN_PATH = path.join(__dirname, '../oauth-token.json');

const SCOPES = ['https://www.googleapis.com/auth/drive'];

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
 * @param {Buffer} fileBuffer - File content as buffer
 * @param {string} fileName - Original file name
 * @param {string} mimeType - File MIME type
 * @param {string} folderId - Google Drive folder ID
 * @returns {Promise<Object>} File metadata with webViewLink
 */
export async function uploadToGoogleDriveOAuth(fileBuffer, fileName, mimeType, folderId) {
  try {
    const { drive: driveApi } = initializeGoogleDriveOAuth();

    // Create file metadata WITH parents (OAuth allows this!)
    const fileMetadata = {
      name: `${new Date().getTime()}-${fileName}`,
      parents: [folderId],
      description: `Uploaded from inventory management system at ${new Date().toISOString()}`,
    };

    console.log(`📤 Uploading to Google Drive: ${fileMetadata.name}`);
    console.log(`📁 Folder ID: ${folderId}`);
    console.log(`📎 File size: ${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB`);

    // Upload file
    const response = await driveApi.files.create({
      requestBody: fileMetadata,
      media: {
        mimeType,
        body: Readable.from([fileBuffer]),
      },
      fields: 'id, name, webViewLink, mimeType, size, createdTime',
    });

    const fileId = response.data.id;
    const webViewLink = response.data.webViewLink;

    console.log('✅ File uploaded successfully');
    console.log(`📎 File ID: ${fileId}`);
    console.log(`🔗 Web View Link: ${webViewLink}`);

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
      // Continue anyway - file is still accessible
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

export { initializeGoogleDriveOAuth };

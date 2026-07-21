#!/usr/bin/env node

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import url from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SCOPES = ['https://www.googleapis.com/auth/drive'];
const CREDENTIALS_PATH = path.join(__dirname, '../oauth-credentials.json');
const TOKEN_PATH = path.join(__dirname, '../oauth-token.json');

/**
 * Load or request or refresh the saved credentials
 */
async function authorize() {
  console.log('\n🔐 OAuth Setup for Google Drive\n');
  console.log('============================================================\n');

  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.error('❌ OAuth credentials file not found!');
    console.error(`📁 Please download it from Google Cloud Console`);
    console.error(`   and save to: ${CREDENTIALS_PATH}\n`);
    process.exit(1);
  }

  const content = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
  const { client_id, client_secret, redirect_uris } = content.installed;

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Check if we have a saved token
  if (fs.existsSync(TOKEN_PATH)) {
    const savedToken = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    oAuth2Client.setCredentials(savedToken);
    console.log('✅ Using saved OAuth token\n');
    return oAuth2Client;
  }

  // Need to get a new token
  console.log('📝 First time setup - you need to authorize this app\n');
  return new Promise((resolve, reject) => {
    // Create local server for OAuth callback
    const server = http.createServer(async (req, res) => {
      const queryUrl = url.parse(req.url, true);
      const code = queryUrl.query.code;

      if (code) {
        // Exchange auth code for tokens
        try {
          const { tokens } = await oAuth2Client.getToken(code);
          oAuth2Client.setCredentials(tokens);

          // Save token for future use
          fs.writeFileSync(
            TOKEN_PATH,
            JSON.stringify(tokens, null, 2)
          );

          res.end('✅ Authorization successful! You can close this window.');
          server.close();

          console.log('✅ OAuth token saved successfully!\n');
          console.log(`📁 Token saved to: ${TOKEN_PATH}\n`);
          console.log('🎉 You can now use OAuth for Google Drive uploads\n');

          resolve(oAuth2Client);
        } catch (error) {
          console.error('❌ Error getting token:', error.message);
          res.end('❌ Authorization failed!');
          server.close();
          reject(error);
        }
      } else {
        res.end('❌ No authorization code received');
        server.close();
        reject(new Error('No authorization code'));
      }
    });

    server.listen(3000, () => {
      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
      });

      console.log('📖 Opening browser for authorization...\n');
      console.log(`🔗 Or visit this URL: ${authUrl}\n`);

      // Try to open browser
      import('open').then(({ default: open }) => {
        open(authUrl).catch(() => {
          console.log('💡 If browser doesn\'t open, copy the URL above\n');
        });
      }).catch(() => {
        console.log('💡 Please open the URL above in your browser\n');
      });
    });
  });
}

// Run authorization
authorize()
  .then(() => {
    console.log('============================================================\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Authorization failed:', error.message);
    process.exit(1);
  });

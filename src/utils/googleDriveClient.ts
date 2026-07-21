/**
 * Simple Google Drive Upload Client (Browser-based)
 * Uses Google Identity Services + Google Drive REST API
 * No backend needed!
 */

// Configuration - UPDATE THESE VALUES
const CONFIG = {
  CLIENT_ID: '175211297621-k8odpmhflpfjifd8mgvf9484ca3e97ks.apps.googleusercontent.com', // OAuth Client ID (Web Application)
  FOLDER_ID: '1PiFRRSlyZbYg5hysyjJAmJSH_4W5ddX0', // Your Google Drive folder
};

interface UploadResult {
  success: boolean;
  fileId: string;
  fileName: string;
  webViewLink: string;
  mimeType: string;
  size: number;
  createdTime: string;
}

/**
 * Load Google Identity Services library
 */
const loadGoogleIdentity = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if ((window as any).google?.accounts?.oauth2) {
      console.log('✅ Google Identity Services already loaded');
      resolve();
      return;
    }

    console.log('📥 Loading Google Identity Services...');

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = false;
    
    let timeoutId: NodeJS.Timeout;

    script.onload = () => {
      console.log('✅ Google Identity Services script loaded');
      
      // Poll for google.accounts.oauth2 to be available
      let attempts = 0;
      const maxAttempts = 50; // Up to 2.5 seconds
      
      const checkGoogle = () => {
        attempts++;
        
        if ((window as any).google?.accounts?.oauth2) {
          console.log(`✅ google.accounts.oauth2 is available (attempt ${attempts})`);
          clearTimeout(timeoutId);
          resolve();
        } else if (attempts >= maxAttempts) {
          console.error(`❌ google.accounts.oauth2 never became available after 50 attempts`);
          clearTimeout(timeoutId);
          reject(new Error('google.accounts.oauth2 not available after max attempts'));
        } else {
          // Try again in 50ms
          timeoutId = setTimeout(checkGoogle, 50);
        }
      };
      
      // Start checking
      checkGoogle();
    };
    
    script.onerror = () => {
      console.error('❌ Failed to load Google Identity Services script');
      reject(new Error('Failed to load Google Identity Services'));
    };

    console.log('📝 Appending script to head');
    document.head.appendChild(script);
  });
};

/**
 * Initialize Google OAuth
 */
export const initializeGoogleOAuth = async (clientId: string): Promise<void> => {
  await loadGoogleIdentity();
  CONFIG.CLIENT_ID = clientId;
  console.log('✅ Google Identity Services loaded');
};

/**
 * Get access token by showing Google login popup
 */
export const getAccessToken = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!CONFIG.CLIENT_ID) {
      reject(new Error('Client ID not configured'));
      return;
    }

    console.log('🔐 Initializing token client...');

    try {
      const google = (window as any).google;
      if (!google?.accounts?.oauth2) {
        throw new Error('google.accounts.oauth2 not available');
      }

      let isResolved = false;

      // Add a timeout fallback in case popup is blocked
      const timeoutId = setTimeout(() => {
        if (!isResolved) {
          console.error('❌ Token request timed out or popup blocked');
          reject(new Error('Token request timed out or popup blocked'));
        }
      }, 30000); // 30s timeout

      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CONFIG.CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: (response: any) => {
          isResolved = true;
          clearTimeout(timeoutId);
          console.log('📝 Token callback received');
          if (response.access_token) {
            console.log('✅ Access token obtained');
            resolve(response.access_token);
          } else {
            console.error('❌ No access token in response:', response);
            reject(new Error('Failed to get access token'));
          }
        },
        error_callback: (error: any) => {
          isResolved = true;
          clearTimeout(timeoutId);
          console.error('❌ Token client error (e.g. popup closed):', error);
          reject(error);
        }
      });

      console.log('🔗 Requesting access token (opening popup)...');
      tokenClient.requestAccessToken();
    } catch (error) {
      console.error('❌ Error initializing token client:', error);
      reject(error);
    }
  });
};

/**
 * Upload file to Google Drive
 * @param file - File to upload
 * @param folderId - Optional Google Drive folder ID (defaults to CONFIG.FOLDER_ID)
 */
export const uploadToGoogleDrive = async (file: File, folderId?: string): Promise<UploadResult> => {
  try {
    const targetFolderId = folderId || CONFIG.FOLDER_ID;
    
    console.log('📤 [Browser Upload] Starting upload:', {
      fileName: file.name,
      fileSize: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      mimeType: file.type,
      folderId: targetFolderId,
    });

    // Ensure Google Identity is loaded
    console.log('🔍 Checking Google Identity Services...');
    if (!CONFIG.CLIENT_ID) {
      throw new Error('Client ID not configured');
    }
    
    await loadGoogleIdentity();
    console.log('✅ Google Identity Services ready');

    // Get access token
    console.log('🔐 Requesting Google authorization...');
    const accessToken = await getAccessToken();
    console.log('✅ Authorization granted');

    // Create file metadata
    const metadata = {
      name: `${new Date().getTime()}-${file.name}`,
      parents: [targetFolderId],
      mimeType: file.type || 'application/octet-stream',
    };

    // Create multipart upload body
    const boundary = '===============7330845974216740156==';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const body =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: ' + (file.type || 'application/octet-stream') + '\r\n\r\n';

    const footer = closeDelimiter;

    // Upload
    console.log('📤 [Browser Upload] Uploading file...');
    const multipartBody = new Blob([body, file, footer], {
      type: `multipart/related; boundary="${boundary}"`,
    });

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,mimeType,size,createdTime',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary="${boundary}"`,
        },
        body: multipartBody,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ [Browser Upload] Upload successful');
    console.log('📎 File details:', {
      fileId: result.id,
      webViewLink: result.webViewLink,
    });

    return {
      success: true,
      fileId: result.id,
      fileName: result.name,
      webViewLink: result.webViewLink,
      mimeType: result.mimeType,
      size: result.size,
      createdTime: result.createdTime,
    };
  } catch (error) {
    console.error('❌ [Browser Upload] Error:', error);
    throw error;
  }
};

/**
 * Delete file from Google Drive
 * @param fileId - ID of the file to delete
 */
export const deleteFromGoogleDrive = async (fileId: string): Promise<boolean> => {
  try {
    console.log(`🗑️ [Browser Delete] Starting delete for file ID: ${fileId}`);

    // Ensure Google Identity is loaded
    console.log('🔍 Checking Google Identity Services...');
    if (!CONFIG.CLIENT_ID) {
      throw new Error('Client ID not configured');
    }
    
    await loadGoogleIdentity();
    console.log('✅ Google Identity Services ready');

    // Get access token (might open popup if session expired)
    console.log('🔐 Requesting Google authorization for deletion...');
    const accessToken = await getAccessToken();
    console.log('✅ Authorization granted');

    // Call DELETE API
    console.log('🗑️ [Browser Delete] Calling Google Drive API...');
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      // 404 means the file is already deleted or not found, which is fine for our use case
      if (response.status === 404) {
        console.warn('⚠️ [Browser Delete] File not found (already deleted?)');
        return true;
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    console.log('✅ [Browser Delete] Delete successful');
    return true;
  } catch (error) {
    console.error('❌ [Browser Delete] Error:', error);
    throw error; // Let the caller handle the error
  }
};


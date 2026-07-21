<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/759af4a6-0cc8-47aa-81e3-49de87799b77

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Firebase Setup

### Deploy Storage Rules (Required for file uploads)

Before using file upload features, you must deploy Firebase Storage rules:

**Option 1: Using Firebase CLI (Recommended)**
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy Storage rules
firebase deploy --only storage
```

**Option 2: Manual setup in Firebase Console**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: `gen-lang-client-0559726829`
3. Go to **Storage** → **Rules**
4. Replace content with rules from `storage.rules`
5. Click **Publish**

### Add Authorized Domains

For local development and production:
1. Firebase Console → **Authentication** → **Authorized domains**
2. Add your HTTP origins:
   - `localhost:3000`
   - `192.168.2.150:3000` (or your local IP:port)
   - Your production domain

See [FIREBASE_UPLOAD_GUIDE.md](FIREBASE_UPLOAD_GUIDE.md) for detailed troubleshooting.

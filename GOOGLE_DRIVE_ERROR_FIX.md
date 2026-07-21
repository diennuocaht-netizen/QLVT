# Fix Google Drive Upload Error

## ⚠️ Error You Saw
```
❌ Lỗi upload - Tuy cập bị từ chối. Vui lòng đăng nhập.
```

This means the API server is **not running** or **not responding**.

---

## ✅ Quick Fix (3 Steps)

### Step 1: Run the API Server
Open a **new terminal** and run:
```bash
npm run api
```

You should see:
```
🚀 User API Server running on http://localhost:3001
📝 POST http://localhost:3001/api/users/create
📤 POST http://localhost:3001/api/drive/upload
🔍 GET  http://localhost:3001/api/health
```

**Keep this terminal running!**

### Step 2: Start the Frontend (if not already running)
Open **another terminal** and run:
```bash
npm run dev
```

You should see:
```
VITE v6.4.1  ready in XXX ms
➜  Local:   http://localhost:3004/
```

### Step 3: Test Upload
1. Reload page at `http://localhost:3004`
2. Go to: **Phiếu Nhập Kho → [Create/Edit Slip] → Upload File**
3. Select a file (JPG/PNG/PDF, max 5MB)
4. Click **Upload** button

---

## 🔍 Verify Setup is Correct

Run this command to check everything:
```bash
node scripts/diagnose.js
```

You should see all ✅ checks passing.

---

## 🛠️ Troubleshooting

### Problem 1: "Cannot reach API server"
**Symptom:** Error message says "Không kết nối được tới API server"

**Solutions:**
1. ✅ Make sure `npm run api` is running in another terminal
2. ✅ Check that port 3001 is not blocked:
   ```bash
   netstat -ano | findstr :3001
   ```
   If port is in use, kill the process:
   ```bash
   taskkill /PID <PID> /F
   ```
3. ✅ Try accessing: `http://localhost:3001/api/health` in browser
   - Should show: `{"status":"ok","message":"...","timestamp":"..."}`

### Problem 2: "Google authentication failed"
**Symptom:** Error mentions "Lỗi xác thực Google Drive"

**Solutions:**
1. ✅ Verify credentials file exists:
   ```bash
   ls dnct-492207-9346fa26ec4f.json
   ```
2. ✅ File must be in project root directory
3. ✅ Run diagnostic: `node scripts/diagnose.js`
4. ✅ Check API server console for error logs

### Problem 3: "Permission denied on folder"
**Symptom:** Upload fails after reaching API server

**Solutions:**
1. ✅ Google Drive folder must be shared with service account
2. ✅ Give service account Editor access to folder
3. ✅ Folder ID must be: `1PiFRRSlyZbYg5hysyjJAmJSH_4W5ddX0`
4. ✅ Check API server console for detailed error

### Problem 4: "File size error"
**Symptom:** "Kích thước file không được vượt quá 5MB"

**Solutions:**
- Maximum file size is 5MB
- Images are automatically compressed
- For large PDFs, split into multiple files

---

## 📊 Understanding the Flow

```
Frontend                API Server              Google Drive
   ↓                        ↓                         ↓
User selects file    Receives file          Authenticates
   ↓                        ↓                         ↓
Compresses if needed  Validates file type   Uploads file
   ↓                        ↓                         ↓
Sends to /api/drive   Loads credentials     Returns link
/upload               ↓
   ↓                 Initiates upload
Waits...                    ↓
   ←—————— Returns link ←————
   ↓
Saves to Supabase
```

---

## 🔔 Console Logs to Watch For

**Successful upload** - You should see in browser console:
```
🚀 [HandoverRecord] Starting upload to Google Drive
✅ [HandoverRecord] API server is responding
📤 [HandoverRecord] Uploading file to API
✅ [HandoverRecord] Upload completed
📎 [HandoverRecord] Drive Link: https://drive.google.com/...
```

**Successful upload** - API server console:
```
📤 [Google Drive Upload] Received request
📤 [Google Drive Upload] Processing: Anh1.png
   Size: 0.40 MB
   MIME: image/png
   Folder ID: 1PiFRRSlyZbYg5hysyjJAmJSH_4W5ddX0
📤 Uploading to Google Drive
✅ File uploaded successfully
📎 File ID: abc123xyz...
🔗 Web View Link: https://drive.google.com/file/d/abc123/view
✅ File is now publicly viewable
✅ [Google Drive Upload] Success - File ID
```

---

## 🎯 What Files Are Used

| File | Purpose |
|------|---------|
| `scripts/user-api-server.js` | Express server with `/api/drive/upload` endpoint |
| `scripts/google-drive-service.js` | Google Drive authentication & upload |
| `dnct-492207-9346fa26ec4f.json` | Google Service Account credentials |
| `src/components/inventory/HandoverRecordUploadModal.tsx` | Frontend upload component |

---

## 📞 Still Having Issues?

1. **Run diagnostic:**
   ```bash
   node scripts/diagnose.js
   ```

2. **Check API server logs** - Look for errors in terminal where you ran `npm run api`

3. **Check browser console logs** - Open DevTools (F12) in browser

4. **Verify both servers running:**
   - Terminal 1: `npm run api` → Should see "running on port 3001"
   - Terminal 2: `npm run dev` → Should see "running on port 3004"

---

## ✨ Once Working

After successful upload, you'll see:
- ✅ File appears in your Google Drive folder
- ✅ Link is saved to Supabase database
- ✅ Success message in the modal
- ✅ Can click "Close" and see the receipt saved

---

**Remember: Always run `npm run api` in a separate terminal first!**

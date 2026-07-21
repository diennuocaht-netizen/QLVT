# Firebase Upload Issues - Hướng dẫn sửa lỗi

## 🔴 Lỗi thường gặp

### 1. "Missing or insufficient permissions"
**Nguyên nhân**: Firebase Storage Security Rules không được cấu hình

**Giải pháp**:

#### Cách 1: Deploy Rules bằng Firebase CLI
```bash
# Cài đặt Firebase CLI (nếu chưa có)
npm install -g firebase-tools

# Login vào Firebase
firebase login

# Deploy Storage Rules
firebase deploy --only storage
```

#### Cách 2: Setup Rules trong Firebase Console
1. Vào [Firebase Console](https://console.firebase.google.com)
2. Chọn Project: `gen-lang-client-0559726829`
3. Vào **Storage** → **Rules**
4. Thay thế nội dung bằng rules trong file `storage.rules`:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to read/write handover records
    match /handover-records/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && request.resource.size < 5 * 1024 * 1024
        && request.resource.contentType.matches('image/jpeg|image/png|image/webp|application/pdf');
    }

    // Deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

5. Click **Publish**

### 2. CORS Error - "has been blocked by CORS policy"
**Nguyên nhân**: Địa chỉ local domain không được thêm vào Firebase Console

**Giải pháp**:
1. Vào Firebase Console → **Settings** (⚙️)
2. Chọn tab **Authentication** → **Authorized domains**
3. Thêm các domain:
   - `192.168.2.150:3000` (local development)
   - `localhost:3000` (local development)
   - Domain production của bạn

### 3. "Uncaught Error in snapshot listener"
**Nguyên nhân**: Firestore rules quá restrictive

**Kiểm tra**: Xem console browser → DevTools → Check Firestore read permissions

---

## ✅ Kiểm tra cấu hình

### Cách 1: Test upload bằng Console
```javascript
// Chạy trong DevTools Console
import { getStorage, ref, uploadBytes } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const storage = getStorage();
const auth = getAuth();

console.log('User:', auth.currentUser?.email);
console.log('Authenticated:', !!auth.currentUser);
```

### Cách 2: Kiểm tra Storage Rules hiện tại
```bash
firebase rules:list
```

---

## 📋 Checklist trước upload

- [ ] User đã login (chạy `auth.currentUser` trong console)
- [ ] File size < 5MB
- [ ] File type: JPG, PNG, WebP, hoặc PDF
- [ ] Firebase Storage Rules đã deploy
- [ ] Domain `192.168.2.150:3000` trong Authorized domains

# 🔧 QUICK REFERENCE COMMANDS

## FIREBASE DATA EXPORT

### Option A: Using Firebase CLI
```bash
# If you have firebase-tools installed
firebase firestore:export ./firebase-backup \
  --project=your-project-id

# Shows output like:
# 📦 Exported to: ./firebase-backup
# ✅ Successfully exported collections
```

### Option B: Manual Export from Console
1. Go Firebase Console → Firestore → ⋮ → Export collections
2. Select all collections
3. Choose Cloud Storage location or download JSON
4. Download exported file

### Option C: Using Node.js Script
```bash
# Create temporary script to export
node << 'EOF'
const admin = require('firebase-admin');
const serviceAccount = require('./path-to-key.json'); // Your Firebase credentials

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://your-project.firebaseio.com'
});

const db = admin.firestore();

async function exportAll() {
  const collections = [
    'users', 'inventory_items', 'inventory_slips',
    'inventory_requisitions', 'inventory_subsystems',
    'inventory_requisition_types', 'inventory_cost_codes',
    'documents', 'devices'
  ];

  const backup = {};
  
  for (const col of collections) {
    const snap = await db.collection(col).get();
    backup[col] = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log(`✅ ${col}: ${snap.size} documents`);
  }

  // Save to file
  const fs = require('fs');
  fs.writeFileSync('firebase-backup.json', JSON.stringify(backup, null, 2));
  console.log('📁 Exported to firebase-backup.json');
  process.exit(0);
}

exportAll().catch(err => {
  console.error('❌ Export failed:', err);
  process.exit(1);
});
EOF
```

---

## SUPABASE DATA IMPORT

### Step 1: Prepare Environment
```bash
# Install dependencies (if not done)
npm install @supabase/supabase-js

# Copy credentials to .env.local
cat > .env.local << 'EOF'
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJ...
EOF
```

### Step 2: Run Migration
```bash
# From project root
node supabase-migration/migrate.js

# Expected output:
# ⏳ Starting migration...
# ✅ Users: 5 records
# ✅ Inventory Items: 50 records
# ✅ Inventory Slips: 120 records
# ✅ Inventory Requisitions: 80 records
# ✅ Cost Codes: 20 records
# ✅ Subsystems: 8 records
# ✅ Requisition Types: 4 records
# ✅ Documents: 15 records
# ✅ Devices: 30 records
# ✨ Migration complete!
```

### Step 3: Verify Data
```bash
# In Supabase SQL Editor, paste this:
SELECT 
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL SELECT 'inventory_items', COUNT(*) FROM inventory_items
UNION ALL SELECT 'inventory_slips', COUNT(*) FROM inventory_slips
UNION ALL SELECT 'inventory_requisitions', COUNT(*) FROM inventory_requisitions
UNION ALL SELECT 'inventory_subsystems', COUNT(*) FROM inventory_subsystems
UNION ALL SELECT 'inventory_requisition_types', COUNT(*) FROM inventory_requisition_types
UNION ALL SELECT 'inventory_cost_codes', COUNT(*) FROM inventory_cost_codes
UNION ALL SELECT 'documents', COUNT(*) FROM documents
UNION ALL SELECT 'devices', COUNT(*) FROM devices;

# Should match Firebase export counts
```

---

## COMMON DEVELOPMENT COMMANDS

### Install Supabase Client
```bash
npm install @supabase/supabase-js
```

### Start Dev Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Test Login Flow
```typescript
// In browser console
const { data } = await supabase.auth.getSession();
console.log(data.session.user); // Check if logged in
```

### Check Real-Time Subscription
```typescript
// In browser console
supabase.getChannels(); // Should see channels for each table
```

### Reset Supabase Data (⚠️ CAUTION)
```sql
-- In Supabase SQL Editor
-- Delete all data in reverse dependency order:
DELETE FROM devices;
DELETE FROM documents;
DELETE FROM inventory_slips;
DELETE FROM inventory_requisitions;
DELETE FROM inventory_items;
DELETE FROM inventory_cost_codes;
DELETE FROM inventory_subsystems;
DELETE FROM inventory_requisition_types;
DELETE FROM users WHERE id NOT IN (SELECT auth.uid());

-- Then re-run migration
```

---

## ENV VARIABLES

### Development (.env.local)
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Notes
- `.env.local` is gitignored (don't commit!)
- Get from Supabase Settings → API tab
- ANON_KEY: for client-side (public safe)
- SERVICE_ROLE_KEY: for server-side only (keep secret!)

---

## FIREBASE TO SUPABASE MAPPING

### Environment Variables
```
OLD: firebase.ts (firebaseConfig)
NEW: supabase-client.ts (Supabase client initialization)

OLD: REACT_APP_FIREBASE_API_KEY (public)
NEW: VITE_SUPABASE_ANON_KEY (public)
```

### Auth Flow
```
OLD: signInWithPopup(auth, GoogleAuthProvider)
NEW: supabase.auth.signInWithOAuth({ provider: 'google' })

OLD: auth.onAuthStateChanged()
NEW: supabase.auth.onAuthStateChange()

OLD: signOut(auth)
NEW: supabase.auth.signOut()
```

### Firestore Collections → PostgreSQL Tables
```
OLD: collection(db, 'users').doc(uid)
NEW: supabase.from('users').select().eq('id', uid)

OLD: addDoc(collection(db, 'inventory_items'), data)
NEW: supabase.from('inventory_items').insert([data])

OLD: updateDoc(doc(db, 'inventory_slips', id), updates)
NEW: supabase.from('inventory_slips').update(updates).eq('id', id)

OLD: deleteDoc(doc(db, 'inventory_requisitions', id))
NEW: supabase.from('inventory_requisitions').delete().eq('id', id)

OLD: onSnapshot(collection(db, 'inventory_items'), callback)
NEW: supabase.from('inventory_items').on('*', callback).subscribe()
```

### Storage
```
OLD: uploadBytes(ref(storage, 'handover-records/path'), file)
NEW: supabase.storage.from('handover-records').upload('path', file)

OLD: getDownloadURL(ref(storage, path))
NEW: supabase.storage.from('bucket').getPublicUrl('path')
```

### Error Handling
```
OLD: if (error.code === 'permission-denied')
NEW: if (error.message.includes('permission'))

OLD: firebase.firestore.FirestoreError
NEW: PostgrestError interface (error.code: 'PGRST' prefix)
```

---

## FILE STRUCTURE AFTER MIGRATION

```
src/
├── supabase-client.ts          ← NEW (replaces firebase.ts)
├── contexts/
│   └── AuthContext.tsx          ← MODIFIED (Supabase Auth)
├── components/
│   └── inventory/
│       ├── SlipModal.tsx        ← MODIFIED (new queries)
│       ├── RequisitionModal.tsx ← MODIFIED (new queries)
│       └── ItemModal.tsx        ← MODIFIED (new queries)
├── pages/
│   ├── InventoryDashboard.tsx  ← MODIFIED (real-time)
│   ├── InventoryReceipts.tsx   ← MODIFIED (CRUD + real-time)
│   ├── InventoryIssues.tsx     ← MODIFIED (CRUD + real-time)
│   ├── InventoryRequisitions.tsx ← MODIFIED (CRUD + real-time)
│   └── ...other pages
└── utils/
    └── firestoreErrorHandler.ts ← MODIFIED (error handling)

supabase-migration/
├── 01-schema.sql               ← EXECUTED (DB schema)
├── migrate.js                  ← EXECUTED (data import)
├── .env.supabase.example       ← TEMPLATE (rename to .env.local)
├── MIGRATION_GUIDE.md          ← REFERENCE
└── IMPLEMENTATION_CHECKLIST.md ← YOU ARE HERE

.env.local (NOT COMMITTED)
├── VITE_SUPABASE_URL
├── VITE_SUPABASE_ANON_KEY
└── VITE_SUPABASE_SERVICE_ROLE_KEY
```

---

## COMMON ERRORS & FIXES

### ❌ "Row-level security (RLS) policy blocks access"
```
→ User doesn't have proper role in users table
→ Check: SELECT * FROM users WHERE id = auth.uid();
→ Fix: Update role or adjust RLS policy
```

### ❌ "Duplicate value violates unique constraint"
```
→ Trying to insert duplicate code/email
→ Check: SELECT code FROM inventory_items WHERE code = 'ABC123';
→ Fix: Update migrate.js to use upsert instead of insert
```

### ❌ "Column doesn't exist"
```
→ Schema wasn't fully executed
→ Fix: Re-run schema.sql from supabase-migration/
```

### ❌ "CORS error on file upload"
```
→ Storage bucket not configured properly
→ Fix: Verify bucket is created in Supabase Storage tab
→ Verify RLS policy allows public read
```

### ❌ "Subscription failed to connect"
```
→ Real-time WebSocket connection issue
→ Check: Network tab in DevTools
→ Fix: Check Supabase project health, retry subscription
```

---

## PROGRESS MARKERS

✅ = Complete
🟡 = In Progress  
❌ = Failed
⏳ = Pending

Check `IMPLEMENTATION_CHECKLIST.md` for detailed progress.

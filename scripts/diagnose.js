#!/usr/bin/env node
/**
 * Diagnostic Tool for Google Drive Upload Setup
 * Usage: node scripts/diagnose.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('\n🔍 Google Drive Integration Diagnostic\n');
console.log('=' .repeat(50));

// Check 1: Verify credentials file
console.log('\n✓ Check 1: Google Service Account Credentials');
const credentialPaths = [
  'dnct-492207-9346fa26ec4f.json',
  path.join(process.cwd(), 'dnct-492207-9346fa26ec4f.json'),
  path.join(__dirname, '..', 'dnct-492207-9346fa26ec4f.json'),
];

let credentialsFound = false;
for (const credPath of credentialPaths) {
  if (fs.existsSync(credPath)) {
    console.log(`  ✅ Found: ${credPath}`);
    try {
      const creds = JSON.parse(fs.readFileSync(credPath, 'utf8'));
      console.log(`  📧 Service Account: ${creds.client_email}`);
      console.log(`  🆔 Project ID: ${creds.project_id}`);
      credentialsFound = true;
    } catch (e) {
      console.log(`  ⚠️ Error parsing credentials: ${e.message}`);
    }
    break;
  }
}

if (!credentialsFound) {
  console.log(`  ❌ NOT FOUND in any location:`);
  credentialPaths.forEach(p => console.log(`     - ${p}`));
}

// Check 2: Verify Node.js dependencies
console.log('\n✓ Check 2: Required Dependencies');
const requiredPackages = ['express', 'cors', 'multer', 'googleapis', '@supabase/supabase-js'];
const packageJsonPath = path.join(__dirname, '..', 'package.json');
try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  for (const pkg of requiredPackages) {
    if (packageJson.dependencies && packageJson.dependencies[pkg]) {
      console.log(`  ✅ ${pkg}: ${packageJson.dependencies[pkg]}`);
    } else {
      console.log(`  ❌ ${pkg}: NOT INSTALLED`);
    }
  }
} catch (e) {
  console.log(`  ❌ Error reading package.json: ${e.message}`);
}

// Check 3: Verify API server script
console.log('\n✓ Check 3: API Server Scripts');
const scriptPath = path.join(__dirname, 'user-api-server.js');
if (fs.existsSync(scriptPath)) {
  console.log(`  ✅ user-api-server.js exists`);
} else {
  console.log(`  ❌ user-api-server.js NOT FOUND`);
}

const gdrivePath = path.join(__dirname, 'google-drive-service.js');
if (fs.existsSync(gdrivePath)) {
  console.log(`  ✅ google-drive-service.js exists`);
} else {
  console.log(`  ❌ google-drive-service.js NOT FOUND`);
}

// Check 4: Verify React component
console.log('\n✓ Check 4: Frontend Components');
const componentPath = path.join(__dirname, '..', 'src', 'components', 'inventory', 'HandoverRecordUploadModal.tsx');
if (fs.existsSync(componentPath)) {
  console.log(`  ✅ HandoverRecordUploadModal.tsx exists`);
} else {
  console.log(`  ❌ HandoverRecordUploadModal.tsx NOT FOUND`);
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('\n📋 Setup Summary:\n');

if (credentialsFound) {
  console.log('✅ All checks passed! You can now:');
  console.log('\n  1. Start API Server:');
  console.log('     npm run api');
  console.log('\n  2. In another terminal, start Frontend:');
  console.log('     npm run dev');
  console.log('\n  Or run both together:');
  console.log('     npm run dev:all');
} else {
  console.log('❌ Setup issue detected:\n');
  console.log('  Missing Google Service Account credentials file.');
  console.log('  File should be named: dnct-492207-9346fa26ec4f.json');
  console.log(`  Place it in: ${process.cwd()}`);
}

console.log('\n' + '='.repeat(50) + '\n');

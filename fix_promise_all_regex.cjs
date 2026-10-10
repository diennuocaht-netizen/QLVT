const fs = require('fs');
let content = fs.readFileSync('src/pages/InventorySettings.tsx', 'utf8');

const regex = /const \[subsystemsRes, reqTypesRes, costCodesRes, driveSettingsRes, locationsRes, auditTemplatesRes, itemsRes\] = await Promise\.all\(\[\s*supabase\.from\('inventory_subsystems'\)\.select\('\*'\),\s*supabase\.from\('inventory_requisition_types'\)\.select\('\*'\),\s*supabase\.from\('inventory_cost_codes'\)\.select\('\*'\),\s*supabase\.from\('inventory_drive_settings'\)\.select\('\*'\),\s*supabase\.from\('inventory_locations'\)\.select\('\*'\),?\s*\]\);/;

const replacement = `const [subsystemsRes, reqTypesRes, costCodesRes, driveSettingsRes, locationsRes, auditTemplatesRes, itemsRes] = await Promise.all([
          supabase.from('inventory_subsystems').select('*'),
          supabase.from('inventory_requisition_types').select('*'),
          supabase.from('inventory_cost_codes').select('*'),
          supabase.from('inventory_drive_settings').select('*'),
          supabase.from('inventory_locations').select('*').order('code'),
          supabase.from('inventory_audit_templates').select('*'),
          supabase.from('inventory_items').select('id, code, name'),
        ]);`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync('src/pages/InventorySettings.tsx', content, 'utf8');
  console.log('Fixed Promise.all');
} else {
  console.log('Could not find match to fix Promise.all');
}

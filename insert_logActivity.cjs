const fs = require('fs');
const file = 'src/pages/MeasuredEquipments.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetSave = `        if (editingItem) {
        const { error } = await supabase
          .from('measured_equipments')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingItem.id);
        if (error) throw error;
      }`;
      
// Because indentation might be weird, use regex
const regexSave = /if\s*\(editingItem\)\s*\{\s*const\s*\{\s*error\s*\}\s*=\s*await\s*supabase[\s\S]*?\.eq\('id',\s*editingItem\.id\);\s*if\s*\(error\)\s*throw\s*error;/m;

const match = content.match(regexSave);
if (match) {
  content = content.replace(regexSave, match[0] + `
        // Log changes
        const changes = [];
        if (editingItem.name !== formData.name) changes.push(\`Tên: \${editingItem.name} -> \${formData.name}\`);
        if (editingItem.code !== formData.code) changes.push(\`Mã: \${editingItem.code} -> \${formData.code}\`);
        if (editingItem.location !== formData.location) changes.push(\`Vị trí\`);
        if (editingItem.status !== formData.status) changes.push(\`Trạng thái\`);
        if (editingItem.type !== formData.type) changes.push(\`Loại\`);
        
        if (changes.length > 0) {
          import('../utils/activityLogger').then(m => m.logActivity({
            action: 'update_measured_equipment',
            entityType: 'measured_equipment',
            entityId: editingItem.id,
            details: 'Cập nhật thiết bị: ' + changes.join(', ')
          }));
        }
  `);
  console.log('Log added to update');
} else {
  console.log('Update block not found');
}

fs.writeFileSync(file, content, 'utf8');

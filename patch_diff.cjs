const fs = require('fs');
const file = 'src/components/DeviceProfileModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /\/\/ Diff subComponents[\s\S]*?if \(changes\.length > 0\) \{/;

const newDiffLogic = `// Diff subComponents
          const oldSubs = device.sub_components || [];
          const newSubs = subComponents || [];
          
          let added = 0;
          let removed = 0;
          let edited = 0;
          let compDetails = [];

          // Find added and edited
          for (let i = 0; i < newSubs.length; i++) {
            const newItem = newSubs[i];
            const oldItem = oldSubs.find((o) => o.id === newItem.id);
            if (!oldItem) {
              added++;
              compDetails.push(\`Thêm [\${newItem.label || 'Phụ tải'}]\`);
            } else {
              const itemChanges = [];
              if (oldItem.label !== newItem.label) itemChanges.push('Nhãn');
              if (oldItem.name !== newItem.name) itemChanges.push('Tên MCB');
              if (oldItem.location !== newItem.location) itemChanges.push('Vị trí');
              if (oldItem.model !== newItem.model) itemChanges.push('Model');
              if (oldItem.current !== newItem.current) itemChanges.push('Dòng ĐM');
              if (oldItem.powersTo !== newItem.powersTo) itemChanges.push('Cấp nguồn cho');
              
              if (itemChanges.length > 0) {
                edited++;
                compDetails.push(\`Sửa [\${newItem.label || 'Phụ tải'}]: \${itemChanges.join(', ')}\`);
              }
            }
          }
          
          // Find removed
          for (let i = 0; i < oldSubs.length; i++) {
            if (!newSubs.find((n) => n.id === oldSubs[i].id)) {
              removed++;
              compDetails.push(\`Xóa [\${oldSubs[i].label || 'Phụ tải'}]\`);
            }
          }

          if (added > 0 || removed > 0 || edited > 0) {
            changes.push(\`Thay đổi phụ tải (\${added} thêm, \${removed} xóa, \${edited} sửa): \${compDetails.join('; ')}\`);
          }
          
          if (changes.length > 0) {`;

if (regex.test(content)) {
    content = content.replace(regex, newDiffLogic);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Replaced subComponent diff logic successfully.');
} else {
    console.log('Regex did not match.');
}

const fs = require('fs');
const file = 'src/components/hr/EventDetailsModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Hide footer in tasks tab. The footer code is:
// {activeTab === 'general' && (
//   <div className="p-6 border-t ...">
// It is already conditionally rendered for 'general' only!
// Wait! Is it? Let's check.
// If it is, why did they say "bấm vào cập nhật trong hạng mục để cập nhật chứ không phải vào chỉnh sửa"?
// Maybe they meant: they want a standalone "Task Update" modal?
// Or maybe they just wanted a button directly on the Event Card to update tasks.

// Let's make activeTab default to 'tasks' if they are viewing an existing event!
content = content.replace(
  "const [activeTab, setActiveTab] = useState<'general' | 'tasks'>('general');",
  "const [activeTab, setActiveTab] = useState<'general' | 'tasks'>(event ? 'tasks' : 'general');"
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed activeTab default.');

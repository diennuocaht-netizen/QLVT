const fs = require('fs');
const file = 'src/pages/HREvents.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add import
if (!content.includes('import { EventDetailsModal }')) {
    content = content.replace("import { logActivity } from '../utils/activityLogger';", "import { logActivity } from '../utils/activityLogger';\nimport { EventDetailsModal } from '../components/hr/EventDetailsModal';");
}

// Replace placeholder modal with real one
const modalPlaceholderRegex = /\{isModalOpen && \([\s\S]*?\}\)/;
const realModal = `{isModalOpen && (
        <EventDetailsModal 
          event={editingEvent} 
          onClose={() => setIsModalOpen(false)} 
          onSaved={() => {
             setIsModalOpen(false);
             fetchEvents();
          }}
        />
      )}`;

content = content.replace(modalPlaceholderRegex, realModal);

fs.writeFileSync(file, content, 'utf8');
console.log('HREvents.tsx updated with real modal.');

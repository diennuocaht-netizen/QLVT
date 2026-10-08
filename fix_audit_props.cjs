const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/AuditModal.tsx', 'utf8');

content = content.replace(
  'interface AuditModalProps {\n  isOpen: boolean;\n  onClose: () => void;\n  onSuccess: () => void;\n}',
  'interface AuditModalProps {\n  isOpen: boolean;\n  onClose: () => void;\n  onSuccess: () => void;\n  audit?: any | null;\n}'
);

content = content.replace(
  'export const AuditModal: React.FC<AuditModalProps> = ({ isOpen, onClose, onSuccess }) => {',
  'export const AuditModal: React.FC<AuditModalProps> = ({ isOpen, onClose, onSuccess, audit }) => {'
);

fs.writeFileSync('src/components/inventory/AuditModal.tsx', content, 'utf8');
console.log('Props updated');

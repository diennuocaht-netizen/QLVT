const fs = require('fs');
let content = fs.readFileSync('src/pages/Projects.tsx', 'utf8');

// 1. Replace viewingProject state with viewingProjectId
content = content.replace(
  /const \[viewingProject, setViewingProject\] = useState<any>\(null\);/,
  "const [viewingProjectId, setViewingProjectId] = useState<string | null>(null);\n  const viewingProject = useMemo(() => projects.find((p: any) => p.id === viewingProjectId), [projects, viewingProjectId]);"
);

// 2. Replace setters
content = content.replace(
  /setViewingProject\(project\)/g,
  "setViewingProjectId(project.id)"
);

content = content.replace(
  /onClose=\{\(\) => setIsDetailsOpen\(false\)\}/g,
  "onClose={() => { setIsDetailsOpen(false); setViewingProjectId(null); }}"
);

fs.writeFileSync('src/pages/Projects.tsx', content, 'utf8');
console.log('Fixed viewingProject logic in Projects.tsx');

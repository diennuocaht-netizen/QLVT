const fs = require('fs');
let content = fs.readFileSync('src/components/projects/ProjectTasksTab.tsx', 'utf8');

if (!content.includes('useQueryClient')) {
  content = content.replace(
    "import { logActivity } from '../../utils/activityLogger';",
    "import { logActivity } from '../../utils/activityLogger';\nimport { useQueryClient } from '@tanstack/react-query';"
  );
  
  content = content.replace(
    "export const ProjectTasksTab: React.FC<ProjectTasksTabProps> = ({ project }) => {",
    "export const ProjectTasksTab: React.FC<ProjectTasksTabProps> = ({ project }) => {\n  const queryClient = useQueryClient();"
  );
  
  content = content.replace(
    "setHasChanges(false);",
    "setHasChanges(false);\n        queryClient.invalidateQueries({ queryKey: ['projects'] });"
  );
  
  fs.writeFileSync('src/components/projects/ProjectTasksTab.tsx', content, 'utf8');
  console.log('Added useQueryClient to ProjectTasksTab.tsx');
} else {
  console.log('Already includes useQueryClient');
}

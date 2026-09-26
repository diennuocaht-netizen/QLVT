const fs = require('fs');
const file = 'src/components/projects/ProjectDetailsModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// Imports
content = content.replace(
  "import { ProjectTasksTab } from './ProjectTasksTab';",
  "import { ProjectTasksTab } from './ProjectTasksTab';\nimport { ProjectGanttChart } from './ProjectGanttChart';\nimport { ProjectActivityLog } from './ProjectActivityLog';"
);
content = content.replace(
  "import { X, Calendar, Clock, Phone, Mail, Building, User, FileText, Upload, AlertTriangle, Paperclip, Link as LinkIcon, ListTodo } from 'lucide-react';",
  "import { X, Calendar, Clock, Phone, Mail, Building, User, FileText, Upload, AlertTriangle, Paperclip, Link as LinkIcon, ListTodo, BarChart, History } from 'lucide-react';"
);

// State
content = content.replace(
  "const [activeTab, setActiveTab] = useState<'info' | 'tasks' | 'contacts' | 'documents'>('info');",
  "const [activeTab, setActiveTab] = useState<'info' | 'gantt' | 'tasks' | 'contacts' | 'documents' | 'logs'>('info');"
);

// Tab buttons
const infoTabRegex = /<button[\s\S]*?onClick=\{\(\) => setActiveTab\('info'\)\}[\s\S]*?<\/button>/;
const ganttTabBtn = `
            <button
              onClick={() => setActiveTab('gantt')}
              className={\`py-4 px-6 text-sm font-medium border-b-2 flex items-center \${activeTab === 'gantt' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}\`}
            >
              <BarChart className="w-4 h-4 mr-2" /> Gantt Chart
            </button>`;
content = content.replace(infoTabRegex, "$&" + ganttTabBtn);

const docsTabRegex = /<button[\s\S]*?onClick=\{\(\) => setActiveTab\('documents'\)\}[\s\S]*?<\/button>/;
const logsTabBtn = `
            <button
              onClick={() => setActiveTab('logs')}
              className={\`py-4 px-6 text-sm font-medium border-b-2 flex items-center \${activeTab === 'logs' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}\`}
            >
              <History className="w-4 h-4 mr-2" /> Nhật ký
            </button>`;
content = content.replace(docsTabRegex, "$&" + logsTabBtn);

// Tab contents
const tasksPanelRegex = /\{activeTab === 'tasks' && \([\s\S]*?<ProjectTasksTab project=\{project\} \/>\s*\)\}/;
const ganttPanel = `
          {activeTab === 'gantt' && (
            <ProjectGanttChart project={project} />
          )}
`;
const logsPanel = `
          {activeTab === 'logs' && (
            <ProjectActivityLog projectId={project.id} />
          )}
`;
content = content.replace(tasksPanelRegex, ganttPanel + "\n$&");
content = content.replace(tasksPanelRegex, "$&\n" + logsPanel);

fs.writeFileSync(file, content, 'utf8');
console.log('ProjectDetailsModal updated with new tabs');

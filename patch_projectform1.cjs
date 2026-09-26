const fs = require('fs');
const file = 'src/components/projects/ProjectForm.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add task schema
const taskSchemaCode = `const taskSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Nhập tên hạng mục'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  progress: z.number().min(0).max(100).default(0),
  status: z.enum(['pending', 'in_progress', 'completed', 'delayed']).default('pending')
});

`;
content = content.replace('const contactSchema =', taskSchemaCode + 'const contactSchema =');

// Update projectSchema
content = content.replace(
  "completion_date: z.string().min(1, 'Vui lAng ch?n ngAy hoAn thAnh'),",
  "start_date: z.string().optional(),\n  completion_date: z.string().min(1, 'Vui lAng ch?n ngAy hoAn thAnh'),"
);
content = content.replace(
  "contacts: z.array(contactSchema).default([]),",
  "contacts: z.array(contactSchema).default([]),\n  tasks: z.array(taskSchema).default([]),"
);

// Add tasks state and default values
content = content.replace(
  "const [contacts, setContacts] = useState<any[]>(project?.contacts || []);",
  "const [contacts, setContacts] = useState<any[]>(project?.contacts || []);\n  const [tasks, setTasks] = useState<any[]>(project?.tasks || []);"
);

content = content.replace(
  "description: project?.description || '',",
  "start_date: project?.start_date || '',\n      description: project?.description || '',"
);

content = content.replace(
  "contacts: project?.contacts || [],",
  "contacts: project?.contacts || [],\n      tasks: project?.tasks || [],"
);

// Include tasks in submit data
content = content.replace(
  "data.contacts = contacts;",
  "data.contacts = contacts;\n      data.tasks = tasks;"
);

// Add start date to UI
const completionDateUI = `<div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">NgAy hoAn thAnh *</label>`; // need to use regex
const startAndCompletionUI = `
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ngày bắt đầu</label>
                    <input
                      type="date"
                      {...register('start_date')}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ngày hoàn thành (Kết thúc) *</label>
                    <input
                      type="date"
                      {...register('completion_date')}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    {errors.completion_date && <p className="mt-1 text-xs text-red-600">{errors.completion_date.message}</p>}
                  </div>
                </div>
`;

content = content.replace(/<div>\s*<label className="block text-sm font-medium text-gray-700">Ng\w+y ho[\s\S]*?\{errors\.completion_date\.message\}<\/p>\}[\s\S]*?<\/div>/m, startAndCompletionUI);


// Add Tasks tab/section in the UI
// The form has "Thong tin chung" and maybe "Nguoi lien he" 
// Let's check how the UI is laid out first
fs.writeFileSync(file, content, 'utf8');
console.log('OK patched part 1');

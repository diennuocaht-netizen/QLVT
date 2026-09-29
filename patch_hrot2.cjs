const fs = require('fs');
const file = 'src/pages/HRTasks.tsx';
let content = fs.readFileSync(file, 'utf8');

const fetchShiftsOld = `  const fetchShiftTypes = async () => {
    const { data } = await supabase.from('shift_types').select('*').order('order_index');
    if (data) setShiftTypes(data);
  };`;

const fetchShiftsNew = `  const fetchShiftTypes = async () => {
    const { data } = await supabase.from('shift_types').select('*').order('order_index');
    if (data && data.length > 0) {
      setShiftTypes(data);
      // Auto-select first shift if none selected
      if (selectedShiftId === 'all') {
         setSelectedShiftId(data[0].id);
      }
    }
  };`;

content = content.replace(fetchShiftsOld, fetchShiftsNew);

// Also fix created_by to explicitly use null
content = content.replace("created_by: profile?.id", "created_by: profile?.id || null");

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed HRTasks shift selection and checklist logic.');

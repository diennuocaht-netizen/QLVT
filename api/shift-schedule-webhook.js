import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://setljfuhprinmsqztqyd.supabase.co';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNldGxqZnVocHJpbm1zcXp0cXlkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ2NTU5NCwiZXhwIjoyMDkwMDQxNTk0fQ.ysPpSfRlTALCIc5FSw0ovN_xPUfC01z_8_NtWMaeSuQ';

const supabase = createClient(supabaseUrl, supabaseKey);

// Normalization function for Vietnamese names
const normalizeVnName = (str) => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Health check / GET
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      message: 'DNCT Hub - Google Sheet Shift Schedule Webhook is active and running on Vercel!',
      timestamp: new Date().toISOString(),
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let sheetId = req.body?.sheetId || req.query?.sheetId;

    // If not provided in request, load from database settings
    if (!sheetId) {
      const { data } = await supabase
        .from('shift_google_sheet_settings')
        .select('sheet_id')
        .limit(1)
        .maybeSingle();
      if (data && data.sheet_id) sheetId = data.sheet_id;
    }

    if (!sheetId) {
      // Fallback: check inventory_drive_settings
      const { data: driveData } = await supabase
        .from('inventory_drive_settings')
        .select('folder_id')
        .eq('document_type', 'Bảng phân ca Google Sheet')
        .maybeSingle();
      if (driveData && driveData.folder_id) sheetId = driveData.folder_id;
    }

    if (!sheetId) {
      return res.status(400).json({ error: 'No Google Sheet ID found in request or settings' });
    }

    // 1. Fetch employees and shift types from Supabase
    const [empRes, typesRes] = await Promise.all([
      supabase.from('shift_employees').select('*').order('order_index'),
      supabase.from('shift_types').select('*').order('order_index'),
    ]);
    if (empRes.error) throw empRes.error;
    if (typesRes.error) throw typesRes.error;

    const employees = empRes.data || [];
    const shiftTypes = typesRes.data || [];
    if (employees.length === 0) throw new Error('No employees found in database');

    // 2. Fetch workbook from Google Sheet export
    const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;
    const response = await fetch(exportUrl);
    if (!response.ok) throw new Error(`Google Sheet fetch failed with status ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(Buffer.from(arrayBuffer), { type: 'buffer' });

    // 3. Process current month and next month
    const now = new Date();
    const monthsToSync = [
      { month: now.getMonth() + 1, year: now.getFullYear() },
      {
        month: ((now.getMonth() + 1) % 12) + 1,
        year: now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear(),
      },
    ];

    let totalAssignmentsSynced = 0;
    const syncedSheets = [];

    for (const { month, year } of monthsToSync) {
      const cleanMonth = month.toString();
      const padMonth = month.toString().padStart(2, '0');
      const fullYear = year.toString();
      const shortYear = year.toString().slice(-2);

      // Find matching sheet
      let sheetName = workbook.SheetNames.find((s) => {
        const norm = normalizeVnName(s).replace(/[\s\-_/]/g, '');
        const hasMonth =
          norm.includes(`t${cleanMonth}`) ||
          norm.includes(`t${padMonth}`) ||
          norm.includes(`thang${cleanMonth}`);
        const hasYear = norm.includes(fullYear) || norm.includes(shortYear);
        return hasMonth && hasYear;
      });

      if (!sheetName && workbook.SheetNames.length === 1 && month === now.getMonth() + 1) {
        sheetName = workbook.SheetNames[0];
      } else if (!sheetName) {
        sheetName = workbook.SheetNames.find((s) => {
          const norm = normalizeVnName(s).replace(/[\s\-_/]/g, '');
          return norm.includes(`t${cleanMonth}`) || norm.includes(`t${padMonth}`);
        });
      }

      if (!sheetName) continue;

      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Find header row with days 1..31
      let headerRowIdx = -1;
      const dateColMap = {};
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        let foundDays = 0;
        const tempMap = {};
        if (Array.isArray(row)) {
          for (let j = 0; j < row.length; j++) {
            const val = parseInt(row[j]);
            if (!isNaN(val) && val >= 1 && val <= 31) {
              tempMap[val] = j;
              foundDays++;
            }
          }
        }
        if (foundDays >= 28) {
          headerRowIdx = i;
          Object.assign(dateColMap, tempMap);
          break;
        }
      }

      if (headerRowIdx === -1) continue;

      // Match employees and extract assignments
      const upsertRows = [];
      const daysInMonth = new Date(year, month, 0).getDate();

      for (let i = headerRowIdx + 1; i < data.length; i++) {
        const row = data[i];
        if (!Array.isArray(row)) continue;

        let matchedEmp;
        for (const cell of row) {
          if (typeof cell === 'string' && cell.trim().length > 0) {
            const normCell = normalizeVnName(cell);
            matchedEmp = employees.find((e) => normalizeVnName(e.full_name) === normCell);
            if (matchedEmp) break;
          }
        }

        if (matchedEmp) {
          for (let day = 1; day <= daysInMonth; day++) {
            const colIdx = dateColMap[day];
            if (colIdx !== undefined) {
              const cellVal = row[colIdx];
              const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day
                .toString()
                .padStart(2, '0')}`;
              if (typeof cellVal === 'string' && cellVal.trim().length > 0) {
                const shiftCode = cellVal.trim().toUpperCase();
                const sType = shiftTypes.find((t) => t.code.toUpperCase() === shiftCode);
                upsertRows.push({
                  employee_id: matchedEmp.id,
                  date: dateStr,
                  shift_type_id: sType ? sType.id : null,
                });
              }
            }
          }
        }
      }

      if (upsertRows.length > 0) {
        const BATCH_SIZE = 200;
        for (let i = 0; i < upsertRows.length; i += BATCH_SIZE) {
          const batch = upsertRows.slice(i, i + BATCH_SIZE);
          await supabase
            .from('shift_assignments')
            .upsert(batch, { onConflict: 'employee_id,date' });
        }
        totalAssignmentsSynced += upsertRows.length;
        syncedSheets.push({ sheetName, month, year, count: upsertRows.length });
      }
    }

    // 4. Update status in database
    try {
      await supabase
        .from('shift_google_sheet_settings')
        .update({
          last_synced_at: new Date().toISOString(),
          last_sync_status: 'success',
          last_sync_message: `Webhook Vercel: Đồng bộ thành công ${totalAssignmentsSynced} lượt ca từ các Sheet: ${syncedSheets
            .map((s) => s.sheetName)
            .join(', ')}`,
          last_sync_count: totalAssignmentsSynced,
          updated_at: new Date().toISOString(),
        })
        .eq('sheet_id', sheetId);
    } catch {}

    return res.status(200).json({
      success: true,
      message: `Đồng bộ thành công qua Webhook trên Vercel!`,
      totalAssignmentsSynced,
      syncedSheets,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

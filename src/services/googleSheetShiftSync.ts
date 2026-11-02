import { supabase } from '../supabase-client';
import type { ShiftEmployee, ShiftType } from '../types/shift';

export interface GoogleSheetSettings {
  id?: string;
  sheet_url: string;
  sheet_id: string;
  sheet_name_pattern?: string;
  auto_sync: boolean;
  sync_interval_minutes: number;
  last_synced_at?: string | null;
  last_sync_status?: 'success' | 'error' | 'pending';
  last_sync_message?: string | null;
  last_sync_count?: number;
  webhook_secret?: string;
}

const LOCAL_STORAGE_KEY = 'dnct_shift_google_sheet_settings';

/**
 * Trích xuất Google Spreadsheet ID từ URL bất kỳ
 */
export function extractSpreadsheetId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const clean = urlOrId.trim();

  // Nếu người dùng nhập trực tiếp ID (khoảng 30-60 ký tự không chứa / hay dấu chấm)
  if (/^[a-zA-Z0-9-_]{30,60}$/.test(clean)) {
    return clean;
  }

  // Regex trích xuất ID từ URL Google Sheets
  const match = clean.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }

  return null;
}

/**
 * Chuẩn hóa chuỗi tiếng Việt (bỏ dấu, thường hóa, bỏ khoảng trắng thừa) để so khớp chính xác
 */
export function normalizeVietnameseName(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Tải cấu hình Google Sheet từ Supabase (hoặc fallback localStorage)
 */
export async function loadGoogleSheetSettings(): Promise<GoogleSheetSettings | null> {
  try {
    // 1. Thử đọc từ bảng chuyên dụng shift_google_sheet_settings
    const { data, error } = await supabase
      .from('shift_google_sheet_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return data as GoogleSheetSettings;
    }

    // 2. Fallback: đọc từ inventory_drive_settings
    const { data: driveData } = await supabase
      .from('inventory_drive_settings')
      .select('*')
      .eq('document_type', 'Bảng phân ca Google Sheet')
      .maybeSingle();

    if (driveData && driveData.folder_id) {
      return {
        id: driveData.id,
        sheet_url: driveData.folder_name || `https://docs.google.com/spreadsheets/d/${driveData.folder_id}`,
        sheet_id: driveData.folder_id,
        auto_sync: true,
        sync_interval_minutes: 15,
        last_synced_at: driveData.updated_at,
        last_sync_status: 'success',
      };
    }
  } catch (err) {
    console.warn('Cannot load settings from DB, trying localStorage:', err);
  }

  // 3. Fallback: localStorage
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}

  return null;
}

/**
 * Lưu cấu hình Google Sheet vào Supabase (và cache vào localStorage)
 */
export async function saveGoogleSheetSettings(
  settings: Partial<GoogleSheetSettings> & { sheet_url: string; sheet_id: string }
): Promise<GoogleSheetSettings> {
  const fullSettings: GoogleSheetSettings = {
    sheet_url: settings.sheet_url,
    sheet_id: settings.sheet_id,
    sheet_name_pattern: settings.sheet_name_pattern || 'auto',
    auto_sync: settings.auto_sync !== false,
    sync_interval_minutes: settings.sync_interval_minutes || 15,
    last_synced_at: settings.last_synced_at || null,
    last_sync_status: settings.last_sync_status || 'pending',
    last_sync_message: settings.last_sync_message || null,
    last_sync_count: settings.last_sync_count || 0,
    webhook_secret: settings.webhook_secret || crypto.randomUUID(),
  };

  // Lưu vào localStorage trước
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(fullSettings));
  } catch {}

  // Lưu vào Supabase bảng chuyên dụng
  try {
    const { data: existing } = await supabase
      .from('shift_google_sheet_settings')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (existing?.id) {
      const { data, error } = await supabase
        .from('shift_google_sheet_settings')
        .update({
          ...fullSettings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();
      if (!error && data) return data as GoogleSheetSettings;
    } else {
      const { data, error } = await supabase
        .from('shift_google_sheet_settings')
        .insert([{
          ...fullSettings,
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();
      if (!error && data) return data as GoogleSheetSettings;
    }
  } catch (err) {
    console.warn('shift_google_sheet_settings table update error, updating fallback:', err);
  }

  // Fallback: lưu vào inventory_drive_settings
  try {
    await supabase.from('inventory_drive_settings').upsert({
      document_type: 'Bảng phân ca Google Sheet',
      folder_id: fullSettings.sheet_id,
      folder_name: fullSettings.sheet_url,
      description: 'Cấu hình liên kết Google Sheet phân ca',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'document_type' });
  } catch (err) {
    console.warn('inventory_drive_settings update failed:', err);
  }

  return fullSettings;
}

/**
 * Tải file XLSX nhị phân từ Google Sheet
 */
export async function fetchGoogleSheetWorkbook(sheetId: string): Promise<any> {
  const XLSX = await import('xlsx');
  const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;

  let arrayBuffer: ArrayBuffer | null = null;

  // 1. Thử tải trực tiếp (Google Sheets cho phép CORS với export?format=xlsx)
  try {
    const response = await fetch(exportUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });

    if (response.ok) {
      arrayBuffer = await response.arrayBuffer();
    }
  } catch (directErr) {
    console.warn('Direct Google Sheet fetch failed, trying proxy:', directErr);
  }

  // 2. Nếu tải trực tiếp bị chặn do mạng hoặc firewall, gọi proxy qua server port 3001
  if (!arrayBuffer) {
    const proxyBase =
      typeof window !== 'undefined' && window.location.hostname !== 'localhost'
        ? `${window.location.protocol}//${window.location.hostname}:3001`
        : 'http://localhost:3001';

    const proxyUrl = `${proxyBase}/api/shift-schedule/proxy-xlsx?sheetId=${encodeURIComponent(sheetId)}`;
    const proxyRes = await fetch(proxyUrl);
    if (!proxyRes.ok) {
      throw new Error(`Không thể tải dữ liệu từ Google Sheet. Vui lòng đảm bảo link đã mở chia sẻ xem công khai (Anyone with link can view).`);
    }
    arrayBuffer = await proxyRes.arrayBuffer();
  }

  return XLSX.read(arrayBuffer, { type: 'array' });
}

/**
 * Tìm Sheet phù hợp nhất cho tháng/năm cần đồng bộ
 */
export function findMatchingSheetName(
  sheetNames: string[],
  month: number,
  year: number,
  patternPreference?: string
): string | null {
  if (!sheetNames || sheetNames.length === 0) return null;

  // Nếu người dùng chỉ định một tên sheet cụ thể và nó tồn tại
  if (patternPreference && patternPreference !== 'auto') {
    const exact = sheetNames.find((s) => s.trim().toLowerCase() === patternPreference.trim().toLowerCase());
    if (exact) return exact;
  }

  const cleanMonth = month.toString();
  const padMonth = month.toString().padStart(2, '0');
  const fullYear = year.toString();
  const shortYear = year.toString().slice(-2);

  // 1. Ưu tiên cao: Chứa cả tháng và năm (ví dụ "T11-2026", "T11/2026", "T11 2026", "11-2026")
  const bestMatch = sheetNames.find((s) => {
    const norm = normalizeVietnameseName(s).replace(/[\s\-_/]/g, '');
    const hasMonth = norm.includes(`t${cleanMonth}`) || norm.includes(`t${padMonth}`) || norm.includes(`thang${cleanMonth}`) || norm.includes(`thang${padMonth}`);
    const hasYear = norm.includes(fullYear) || norm.includes(shortYear);
    return hasMonth && hasYear;
  });
  if (bestMatch) return bestMatch;

  // 2. Chứa tháng và năm dạng số (ví dụ "11-2026" hoặc "11.2026")
  const numericMatch = sheetNames.find((s) => {
    const norm = s.trim().replace(/[\s\-_/.]/g, '');
    return (norm.includes(`${cleanMonth}${fullYear}`) || norm.includes(`${padMonth}${fullYear}`) ||
            norm.includes(`${cleanMonth}${shortYear}`) || norm.includes(`${padMonth}${shortYear}`));
  });
  if (numericMatch) return numericMatch;

  // 3. Chứa "Tháng X" hoặc "TX"
  const monthOnlyMatch = sheetNames.find((s) => {
    const norm = normalizeVietnameseName(s).replace(/[\s\-_/]/g, '');
    return norm === `t${cleanMonth}` || norm === `t${padMonth}` || norm === `thang${cleanMonth}` || norm === `thang${padMonth}`;
  });
  if (monthOnlyMatch) return monthOnlyMatch;

  // 4. Nếu chỉ có duy nhất 1 sheet trong file
  if (sheetNames.length === 1) {
    return sheetNames[0];
  }

  // 5. Mặc định trả về sheet đầu tiên
  return sheetNames[0];
}

export interface SyncResult {
  success: boolean;
  message: string;
  matchedEmployeesCount: number;
  totalAssignmentsCount: number;
  sheetName: string;
  month: number;
  year: number;
}

/**
 * Phân tích cú pháp bảng tính và đồng bộ ca trực vào Supabase
 */
export async function syncShiftScheduleFromGoogleSheet(
  sheetId: string,
  targetMonth: number,
  targetYear: number,
  options?: {
    employees?: ShiftEmployee[];
    shiftTypes?: ShiftType[];
    preferredSheetName?: string;
  }
): Promise<SyncResult> {
  const XLSX = await import('xlsx');

  // 1. Lấy danh sách nhân viên và loại ca nếu chưa truyền vào
  let employees = options?.employees;
  let shiftTypes = options?.shiftTypes;

  if (!employees || employees.length === 0) {
    const { data: empData, error: empErr } = await supabase
      .from('shift_employees')
      .select('*')
      .order('order_index');
    if (empErr) throw empErr;
    employees = empData || [];
  }

  if (!shiftTypes || shiftTypes.length === 0) {
    const { data: typesData, error: typesErr } = await supabase
      .from('shift_types')
      .select('*')
      .order('order_index');
    if (typesErr) throw typesErr;
    shiftTypes = typesData || [];
  }

  if (employees.length === 0) {
    throw new Error('Chưa có nhân viên nào trong danh mục nhân sự phân ca.');
  }

  // 2. Tải workbook từ Google Sheet
  const workbook = await fetchGoogleSheetWorkbook(sheetId);
  if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('File Google Sheet không chứa bảng tính hợp lệ nào.');
  }

  // 3. Tìm sheet tương ứng với tháng/năm
  const sheetName = findMatchingSheetName(
    workbook.SheetNames,
    targetMonth,
    targetYear,
    options?.preferredSheetName
  );

  if (!sheetName) {
    throw new Error(`Không tìm thấy Sheet phân ca cho tháng ${targetMonth}/${targetYear}. Danh sách Sheets hiện có: ${workbook.SheetNames.join(', ')}`);
  }

  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    throw new Error(`Không thể mở sheet "${sheetName}".`);
  }

  // Chuyển đổi sang mảng 2 chiều
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
  if (!data || data.length === 0) {
    throw new Error(`Sheet "${sheetName}" không có dữ liệu.`);
  }

  // 4. Tìm dòng tiêu đề chứa ngày 1..28+
  let headerRowIdx = -1;
  const dateColMap: Record<number, number> = {};

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    let foundDays = 0;
    const tempMap: Record<number, number> = {};

    if (Array.isArray(row)) {
      for (let j = 0; j < row.length; j++) {
        const cellVal = parseInt(row[j] as any);
        if (!isNaN(cellVal) && cellVal >= 1 && cellVal <= 31) {
          tempMap[cellVal] = j;
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

  if (headerRowIdx === -1) {
    throw new Error(`Không tìm thấy dòng chứa ngày (từ 1 đến 28..31) trong Sheet "${sheetName}".`);
  }

  // 5. So khớp từng dòng nhân viên và lập danh sách ca trực
  const upsertRows: Array<{
    employee_id: string;
    date: string;
    shift_type_id: string | null;
  }> = [];

  let matchedEmployeesCount = 0;
  const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();

  for (let i = headerRowIdx + 1; i < data.length; i++) {
    const row = data[i];
    if (!Array.isArray(row)) continue;

    // Tìm xem ô nào trong dòng khớp với tên nhân viên
    let matchedEmp: ShiftEmployee | undefined;
    for (const cell of row) {
      if (typeof cell === 'string' && cell.trim().length > 0) {
        const normCell = normalizeVietnameseName(cell);
        matchedEmp = employees.find((e) => {
          const normEmp = normalizeVietnameseName(e.full_name);
          return normCell === normEmp;
        });
        if (matchedEmp) break;
      }
    }

    if (matchedEmp) {
      matchedEmployeesCount++;

      for (let day = 1; day <= daysInMonth; day++) {
        const colIdx = dateColMap[day];
        if (colIdx !== undefined) {
          const cellVal = row[colIdx];
          const dateStr = `${targetYear}-${targetMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

          if (typeof cellVal === 'string' && cellVal.trim().length > 0) {
            const shiftCode = cellVal.trim().toUpperCase();
            const sType = shiftTypes.find((t) => t.code.toUpperCase() === shiftCode);

            if (sType) {
              upsertRows.push({
                employee_id: matchedEmp.id,
                date: dateStr,
                shift_type_id: sType.id,
              });
            } else {
              // Mã ca không tìm thấy trong danh mục -> lưu null hoặc bỏ qua
              upsertRows.push({
                employee_id: matchedEmp.id,
                date: dateStr,
                shift_type_id: null,
              });
            }
          }
        }
      }
    }
  }

  if (upsertRows.length === 0) {
    throw new Error(`Không tìm thấy dữ liệu ca nào cho các nhân viên trong Sheet "${sheetName}". Hãy kiểm tra xem họ tên nhân viên trên Sheet có khớp với danh mục nhân sự không.`);
  }

  // 6. Ghi dữ liệu vào Supabase
  // Chia nhỏ thành các batch 200 dòng để tránh payload quá lớn
  const BATCH_SIZE = 200;
  for (let i = 0; i < upsertRows.length; i += BATCH_SIZE) {
    const batch = upsertRows.slice(i, i + BATCH_SIZE);
    const { error: upsertErr } = await supabase
      .from('shift_assignments')
      .upsert(batch, { onConflict: 'employee_id,date' });

    if (upsertErr) throw upsertErr;
  }

  // 7. Cập nhật trạng thái sync thành công
  try {
    await supabase
      .from('shift_google_sheet_settings')
      .update({
        last_synced_at: new Date().toISOString(),
        last_sync_status: 'success',
        last_sync_message: `Đồng bộ thành công ${matchedEmployeesCount} nhân sự (${upsertRows.length} lượt ca) từ Sheet "${sheetName}"`,
        last_sync_count: upsertRows.length,
        updated_at: new Date().toISOString(),
      })
      .eq('sheet_id', sheetId);
  } catch {}

  return {
    success: true,
    message: `Đã đồng bộ thành công lịch làm việc của ${matchedEmployeesCount} nhân sự (${upsertRows.length} lượt ca) từ Sheet "${sheetName}"!`,
    matchedEmployeesCount,
    totalAssignmentsCount: upsertRows.length,
    sheetName,
    month: targetMonth,
    year: targetYear,
  };
}

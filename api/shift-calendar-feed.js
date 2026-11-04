import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://setljfuhprinmsqztqyd.supabase.co';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNldGxqZnVocHJpbm1zcXp0cXlkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDQ2NTU5NCwiZXhwIjoyMDkwMDQxNTk0fQ.ysPpSfRlTALCIc5FSw0ovN_xPUfC01z_8_NtWMaeSuQ';

const supabase = createClient(supabaseUrl, supabaseKey);

const OWNER_CALENDAR_TOKEN = 'dnct_owner_2409_cal_token';

// Khung giờ mặc định của các ca trực
const DEFAULT_SHIFT_TIMES = {
  'M': { startTime: '06:00', endTime: '14:00', isNextDay: false },
  'A': { startTime: '14:00', endTime: '22:00', isNextDay: false },
  'N': { startTime: '22:00', endTime: '06:00', isNextDay: true },
  'AD': { startTime: '08:00', endTime: '17:00', isNextDay: false },
  'HC': { startTime: '08:00', endTime: '17:00', isNextDay: false },
  'H': { startTime: '08:00', endTime: '17:00', isNextDay: false },
};

function getShiftTimeWindow(shiftType) {
  if (!shiftType) return null;
  const code = (shiftType.code || '').trim().toUpperCase();
  if (DEFAULT_SHIFT_TIMES[code]) {
    return DEFAULT_SHIFT_TIMES[code];
  }
  const name = (shiftType.name || '').toUpperCase();
  if (name.includes('ĐÊM') || shiftType.is_night_shift) {
    return { startTime: '22:00', endTime: '06:00', isNextDay: true };
  }
  if (name.includes('SÁNG') || name.includes('CA M')) {
    return { startTime: '06:00', endTime: '14:00', isNextDay: false };
  }
  if (name.includes('CHIỀU') || name.includes('CA A')) {
    return { startTime: '14:00', endTime: '22:00', isNextDay: false };
  }
  if (name.includes('HÀNH CHÍNH') || name.includes('HC')) {
    return { startTime: '08:00', endTime: '17:00', isNextDay: false };
  }
  return { startTime: '08:00', endTime: '16:00', isNextDay: false };
}

function formatIcalDateTime(dateStr, timeStr, addDays = 0) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, min] = timeStr.split(':').map(Number);
  const d = new Date(year, month - 1, day + addDays, hour, min, 0);
  const yyyy = d.getFullYear().toString();
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  const dd = d.getDate().toString().padStart(2, '0');
  const hh = d.getHours().toString().padStart(2, '0');
  const ii = d.getMinutes().toString().padStart(2, '0');
  return `${yyyy}${mm}${dd}T${hh}${ii}00`;
}

function formatIcalDate(dateStr, addDays = 0) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day + addDays);
  const yyyy = d.getFullYear().toString();
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  const dd = d.getDate().toString().padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { token, empId, alarm, includeOff } = req.query;

    // Xác thực quyền: Hiện tại tính năng chỉ mở cho Owner với Token bí mật
    if (!token || token !== OWNER_CALENDAR_TOKEN) {
      return res.status(403).send('Forbidden: Token lịch không hợp lệ hoặc bạn không có quyền truy cập.');
    }

    const alarmMinutes = parseInt(alarm, 10) || 60;
    const includeOffDays = includeOff === '1' || includeOff === 'true';

    // Khoảng thời gian lấy lịch: từ đầu tháng trước đến hết 3 tháng tới
    const now = new Date();
    const fromDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const toDate = new Date(now.getFullYear(), now.getMonth() + 4, 0);
    const fromStr = fromDate.toISOString().split('T')[0];
    const toStr = toDate.toISOString().split('T')[0];

    // Query dữ liệu từ Supabase
    let query = supabase
      .from('shift_assignments')
      .select('id, employee_id, date, shift_type_id, note, employee:shift_employees(id, full_name, role), shift_type:shift_types(id, code, name, text_color, is_night_shift, is_off_day, is_leave_day)')
      .gte('date', fromStr)
      .lte('date', toStr);

    if (empId && empId !== 'all') {
      query = query.eq('employee_id', empId);
    }

    const { data: assignments, error } = await query;
    if (error) {
      console.error('Error fetching shift assignments:', error);
      return res.status(500).send('Database error');
    }

    // Tên lịch hiển thị trên iPhone/Google Calendar
    let calendarTitle = 'Lịch Ca Trực - DNCT';
    if (empId && empId !== 'all' && assignments && assignments.length > 0) {
      const empName = assignments[0]?.employee?.full_name;
      if (empName) calendarTitle = `Lịch Trực - ${empName}`;
    }

    const nowStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//DNCT Hub//Shift Schedule//VI',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${calendarTitle}`,
      'X-WR-TIMEZONE:Asia/Ho_Chi_Minh',
      'X-PUBLISHED-TTL:PT30M',
      'REFRESH-INTERVAL;VALUE=DURATION:PT30M',
      'BEGIN:VTIMEZONE',
      'TZID:Asia/Ho_Chi_Minh',
      'X-LIC-LOCATION:Asia/Ho_Chi_Minh',
      'BEGIN:STANDARD',
      'TZOFFSETFROM:+0700',
      'TZOFFSETTO:+0700',
      'TZNAME:ICT',
      'DTSTART:19700101T000000',
      'END:STANDARD',
      'END:VTIMEZONE',
    ];

    for (const item of assignments || []) {
      const shift = item.shift_type;
      const emp = item.employee;
      if (!shift) continue;

      const isOffOrLeave = shift.is_off_day || shift.is_leave_day || ['O', 'AL', 'PH', 'OFF'].includes((shift.code || '').toUpperCase());

      if (isOffOrLeave && !includeOffDays) {
        continue;
      }

      const uid = `shift-${item.id || `${item.employee_id}-${item.date}`}@dnct.vercel.app`;
      const empName = emp?.full_name || 'Nhân sự';
      const shiftCode = shift.code || '';
      const shiftName = shift.name || `Ca ${shiftCode}`;

      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${uid}`);
      lines.push(`DTSTAMP:${nowStamp}`);

      if (isOffOrLeave) {
        const startDate = formatIcalDate(item.date, 0);
        const endDate = formatIcalDate(item.date, 1);
        lines.push(`DTSTART;VALUE=DATE:${startDate}`);
        lines.push(`DTEND;VALUE=DATE:${endDate}`);
        lines.push(`SUMMARY:[${shiftCode}] ${shiftName} - ${empName}`);
        lines.push('TRANSP:TRANSPARENT');
      } else {
        const window = getShiftTimeWindow(shift);
        const startDT = formatIcalDateTime(item.date, window?.startTime || '08:00', 0);
        const endDT = formatIcalDateTime(item.date, window?.endTime || '16:00', window?.isNextDay ? 1 : 0);

        lines.push(`DTSTART;TZID=Asia/Ho_Chi_Minh:${startDT}`);
        lines.push(`DTEND;TZID=Asia/Ho_Chi_Minh:${endDT}`);
        lines.push(`SUMMARY:[${shiftCode}] ${shiftName} - ${empName}`);
        lines.push('TRANSP:OPAQUE');

        if (alarmMinutes > 0) {
          lines.push('BEGIN:VALARM');
          lines.push(`TRIGGER:-PT${alarmMinutes}M`);
          lines.push('ACTION:DISPLAY');
          lines.push(`DESCRIPTION:Nhắc nhở: Chuẩn bị vào ${shiftName}`);
          lines.push('END:VALARM');
        }
      }

      const noteText = item.note ? `\\n* Ghi chú: ${item.note.replace(/\n/g, ' ')}` : '';
      const description = `Ca trực: ${shiftName} (${shiftCode})\\nNhân sự: ${empName} (${emp?.role || 'Kỹ thuật'})\\nNgày: ${item.date}${noteText}\\nHệ thống quản lý: DNCT Hub (https://dnct.vercel.app)`;
      lines.push(`DESCRIPTION:${description}`);
      lines.push('LOCATION:DNCT Hub - Trung tâm điều hành & Kỹ thuật');
      lines.push('STATUS:CONFIRMED');
      lines.push('END:VEVENT');
    }

    lines.push('END:VCALENDAR');

    const icsContent = lines.join('\r\n');

    // Headers dành riêng cho Lịch điện thoại (iCalendar)
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline; filename="shift-schedule.ics"');
    res.setHeader('Cache-Control', 'public, max-age=900, stale-while-revalidate=1800');

    return res.status(200).send(icsContent);
  } catch (err) {
    console.error('Server error in shift-calendar-feed:', err);
    return res.status(500).send('Internal Server Error');
  }
}

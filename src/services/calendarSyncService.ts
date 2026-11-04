/**
 * Service xử lý tạo dữ liệu lịch iCalendar (RFC 5545) chuẩn quốc tế
 * Hỗ trợ Apple Calendar (iOS), Google Calendar, Outlook và mọi ứng dụng lịch.
 */

import type { ShiftAssignment, ShiftEmployee, ShiftType } from '../types/shift';

export const OWNER_CALENDAR_TOKEN = 'dnct_owner_2409_cal_token';

/**
 * Cấu hình khung giờ mặc định của ca trực theo tiêu chuẩn DNCT
 */
export interface ShiftTimeWindow {
  startTime: string; // HH:mm (24h)
  endTime: string;   // HH:mm (24h)
  isNextDay?: boolean; // Ca đêm vắt sang sáng hôm sau
}

export const DEFAULT_SHIFT_TIMES: Record<string, ShiftTimeWindow> = {
  // Ca M (Sáng): 06:00 - 14:00
  'M': { startTime: '06:00', endTime: '14:00', isNextDay: false },
  // Ca A (Chiều): 14:00 - 22:00
  'A': { startTime: '14:00', endTime: '22:00', isNextDay: false },
  // Ca N (Đêm): 22:00 - 06:00 ngày hôm sau
  'N': { startTime: '22:00', endTime: '06:00', isNextDay: true },
  // Ca Hành chính / AD / HC: 08:00 - 17:00
  'AD': { startTime: '08:00', endTime: '17:00', isNextDay: false },
  'HC': { startTime: '08:00', endTime: '17:00', isNextDay: false },
  'H': { startTime: '08:00', endTime: '17:00', isNextDay: false },
};

/**
 * Lấy khung giờ cho một loại ca (dựa trên code hoặc name)
 */
export function getShiftTimeWindow(shiftType?: ShiftType | null): ShiftTimeWindow | null {
  if (!shiftType) return null;
  const code = (shiftType.code || '').trim().toUpperCase();
  if (DEFAULT_SHIFT_TIMES[code]) {
    return DEFAULT_SHIFT_TIMES[code];
  }

  // Phỏng đoán theo tên nếu code tùy biến
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

  // Mặc định ca 8 tiếng bắt đầu lúc 08:00 nếu không rõ
  return { startTime: '08:00', endTime: '16:00', isNextDay: false };
}

/**
 * Định dạng ngày giờ theo chuẩn iCalendar: YYYYMMDDTHHMMSS
 */
export function formatIcalDateTime(dateStr: string, timeStr: string, addDays: number = 0): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, min] = timeStr.split(':').map(Number);
  
  const d = new Date(year, month - 1, day + addDays, hour, min, 0);
  const yyyy = d.getFullYear().toString();
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  const dd = d.getDate().toString().padStart(2, '0');
  const hh = d.getHours().toString().padStart(2, '0');
  const ii = d.getMinutes().toString().padStart(2, '0');
  const ss = '00';

  return `${yyyy}${mm}${dd}T${hh}${ii}${ss}`;
}

/**
 * Định dạng ngày cả ngày (All-Day Event): YYYYMMDD
 */
export function formatIcalDate(dateStr: string, addDays: number = 0): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day + addDays);
  const yyyy = d.getFullYear().toString();
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  const dd = d.getDate().toString().padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

export interface GenerateIcsOptions {
  calendarTitle?: string;
  alarmMinutes?: number; // Ví dụ 60 phút trước ca
  includeOffDays?: boolean; // Có bao gồm ngày OFF/Nghỉ phép không
  assignments: Array<ShiftAssignment & {
    employee?: ShiftEmployee;
    shift_type?: ShiftType;
  }>;
}

/**
 * Tạo nội dung file .ics chuẩn RFC 5545
 */
export function generateIcalendarContent(options: GenerateIcsOptions): string {
  const {
    calendarTitle = 'Lịch Ca Trực - DNCT Hub',
    alarmMinutes = 60,
    includeOffDays = false,
    assignments = []
  } = options;

  const nowStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DNCT Hub//Shift Schedule//VI',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${calendarTitle}`,
    'X-WR-TIMEZONE:Asia/Ho_Chi_Minh',
    'X-PUBLISHED-TTL:PT5M',
    'REFRESH-INTERVAL;VALUE=DURATION:PT5M',
  ];

  // Định nghĩa múi giờ Asia/Ho_Chi_Minh (GMT+7)
  lines.push(
    'BEGIN:VTIMEZONE',
    'TZID:Asia/Ho_Chi_Minh',
    'X-LIC-LOCATION:Asia/Ho_Chi_Minh',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0700',
    'TZOFFSETTO:+0700',
    'TZNAME:ICT',
    'DTSTART:19700101T000000',
    'END:STANDARD',
    'END:VTIMEZONE'
  );

  for (const item of assignments) {
    const shift = item.shift_type;
    const emp = item.employee;
    if (!shift) continue;

    const isOffOrLeave = shift.is_off_day || shift.is_leave_day || ['O', 'AL', 'PH', 'OFF'].includes(shift.code.toUpperCase());

    // Nếu là ngày nghỉ nhưng người dùng không chọn xuất ngày nghỉ
    if (isOffOrLeave && !includeOffDays) {
      continue;
    }

    // Sử dụng employee_id và date làm UID cố định để thiết bị tự động ghi đè ca mới khi có thay đổi
    const uid = `shift-${item.employee_id}-${item.date}@dnct.vercel.app`;
    const empName = emp?.full_name || 'Nhân sự';
    const shiftCode = shift.code || '';
    const shiftName = shift.name || `Ca ${shiftCode}`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${nowStamp}`);

    if (isOffOrLeave) {
      // Sự kiện cả ngày (All-Day)
      const startDate = formatIcalDate(item.date, 0);
      const endDate = formatIcalDate(item.date, 1); // Theo chuẩn iCal, all-day event kết thúc ngày tiếp theo
      lines.push(`DTSTART;VALUE=DATE:${startDate}`);
      lines.push(`DTEND;VALUE=DATE:${endDate}`);
      lines.push(`SUMMARY:[${shiftCode}] ${shiftName} - ${empName}`);
      lines.push('TRANSP:TRANSPARENT'); // Không đánh dấu bận
    } else {
      // Sự kiện có giờ vào - giờ ra
      const window = getShiftTimeWindow(shift);
      const startDT = formatIcalDateTime(item.date, window?.startTime || '08:00', 0);
      const endDT = formatIcalDateTime(item.date, window?.endTime || '16:00', window?.isNextDay ? 1 : 0);

      lines.push(`DTSTART;TZID=Asia/Ho_Chi_Minh:${startDT}`);
      lines.push(`DTEND;TZID=Asia/Ho_Chi_Minh:${endDT}`);
      lines.push(`SUMMARY:[${shiftCode}] ${shiftName} - ${empName}`);
      lines.push('TRANSP:OPAQUE'); // Đánh dấu bận (Busy)

      // Cài chuông báo / nhắc nhở (Alarm)
      if (alarmMinutes > 0) {
        lines.push('BEGIN:VALARM');
        lines.push(`TRIGGER:-PT${alarmMinutes}M`);
        lines.push('ACTION:DISPLAY');
        lines.push(`DESCRIPTION:Nhắc nhở: Chuẩn bị vào ${shiftName}`);
        lines.push('END:VALARM');
      }
    }

    // Mô tả chi tiết & địa điểm
    const noteText = item.note ? `\\n* Ghi chú: ${item.note.replace(/\n/g, ' ')}` : '';
    const description = `Ca trực: ${shiftName} (${shiftCode})\\nNhân sự: ${empName} (${emp?.role || 'Kỹ thuật'})\\nNgày: ${item.date}${noteText}\\nHệ thống quản lý: DNCT Hub (https://dnct.vercel.app)`;
    lines.push(`DESCRIPTION:${description}`);
    lines.push('LOCATION:DNCT Hub - Trung tâm điều hành & Kỹ thuật');
    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Tạo URL đăng ký lịch webcal & https cho người dùng
 */
export function buildCalendarSyncUrls(options: {
  baseUrl?: string;
  token: string;
  employeeId?: string;
  alarmMinutes?: number;
  includeOffDays?: boolean;
}) {
  const {
    baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://dnct.vercel.app',
    token,
    employeeId,
    alarmMinutes = 60,
    includeOffDays = false,
  } = options;

  const url = new URL('/api/shift-calendar-feed', baseUrl);
  url.searchParams.set('token', token);
  if (employeeId) {
    url.searchParams.set('empId', employeeId);
  }
  if (alarmMinutes !== 60) {
    url.searchParams.set('alarm', alarmMinutes.toString());
  }
  if (includeOffDays) {
    url.searchParams.set('includeOff', '1');
  }

  const httpsUrl = url.toString();
  // webcal protocol: thay https:// bằng webcal://
  const webcalUrl = httpsUrl.replace(/^https?:\/\//, 'webcal://');

  // Link mở nhanh trên Google Calendar Web (tự động điền link đăng ký)
  const googleCalendarSubscribeUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(httpsUrl)}`;

  return {
    httpsUrl,
    webcalUrl,
    googleCalendarSubscribeUrl,
  };
}

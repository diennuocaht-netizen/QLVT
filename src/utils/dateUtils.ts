/**
 * Utility functions for date and time calculations in Vietnam timezone (Asia/Ho_Chi_Minh - GMT+7).
 */

export const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';

/**
 * Returns formatted date string in YYYY-MM-DD for Vietnam timezone.
 */
export const getVietnamDateString = (d: Date = new Date()): string => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: VIETNAM_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(d);
};

/**
 * Returns previous day's date string in YYYY-MM-DD for Vietnam timezone.
 */
export const getVietnamYesterdayString = (d: Date = new Date()): string => {
  const yesterday = new Date(d.getTime() - 24 * 60 * 60 * 1000);
  return getVietnamDateString(yesterday);
};

/**
 * Returns current minutes of the day in Vietnam (0 - 1439).
 */
export const getVietnamMinutesOfDay = (d: Date = new Date()): number => {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: VIETNAM_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(d);
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
  return hour * 60 + minute;
};

/**
 * Returns current shift code ('M' | 'A' | 'N') according to the 15-minute advance rule:
 * - Ca M (06:00 - 14:00): From 05:45 to before 13:45 (minutes: 345 to 824)
 * - Ca A (14:00 - 22:00): From 13:45 to before 21:45 (minutes: 825 to 1304)
 * - Ca N (22:00 - 06:00): From 21:45 to before 05:45 (minutes: >= 1305 or < 345)
 */
export const getCurrentShiftCode = (d: Date = new Date()): 'M' | 'A' | 'N' => {
  const minutes = getVietnamMinutesOfDay(d);
  if (minutes >= 345 && minutes < 825) return 'M';
  if (minutes >= 825 && minutes < 1305) return 'A';
  return 'N';
};

/**
 * Returns a human-friendly status description for the shift:
 * e.g.: "Sắp vào ca (14:00)" or "Đang trực (06:00 - 14:00)"
 */
export const getShiftStatusDescription = (shiftCode: string, d: Date = new Date()): { label: string; isUpcoming: boolean } => {
  const minutes = getVietnamMinutesOfDay(d);
  if (shiftCode === 'M') {
    if (minutes >= 345 && minutes < 360) {
      return { label: 'Sắp vào ca (06:00)', isUpcoming: true };
    }
    if (minutes >= 360 && minutes < 840) {
      return { label: 'Đang trực (06:00 - 14:00)', isUpcoming: false };
    }
  } else if (shiftCode === 'A') {
    if (minutes >= 825 && minutes < 840) {
      return { label: 'Sắp vào ca (14:00)', isUpcoming: true };
    }
    if (minutes >= 840 && minutes < 1320) {
      return { label: 'Đang trực (14:00 - 22:00)', isUpcoming: false };
    }
  } else if (shiftCode === 'N') {
    if (minutes >= 1305 && minutes < 1320) {
      return { label: 'Sắp vào ca (22:00)', isUpcoming: true };
    }
    if (minutes >= 1320 || minutes < 360) {
      return { label: 'Đang trực (22:00 - 06:00)', isUpcoming: false };
    }
  }
  return { label: '', isUpcoming: false };
};

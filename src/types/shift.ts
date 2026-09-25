export interface ShiftTeam {
  id: string;
  name: string;
  color_code: string;
  order_index: number;
}

export interface ShiftEmployee {
  id: string;
  full_name: string;
  role: string;
  team_id: string | null;
  order_index: number;
  team?: ShiftTeam;
}

export interface ShiftType {
  id: string;
  code: string;
  name: string;
  text_color: string;
  bg_color: string;
  is_night_shift: boolean;
  is_off_day: boolean;
  is_leave_day: boolean;
  order_index: number;
}

export interface ShiftAssignment {
  id: string;
  employee_id: string;
  date: string; // YYYY-MM-DD
  shift_type_id: string | null;
  note: string | null;
}

export interface ShiftMonthlyNote {
  id: string;
  employee_id: string;
  month_year: string; // YYYY-MM
  note: string | null;
}

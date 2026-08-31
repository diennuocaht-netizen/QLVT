export type MeasurementFieldType = 'text' | 'number' | 'boolean' | 'select';

export interface MeasurementField {
  id: string;
  label: string;
  type: MeasurementFieldType;
  unit?: string; // Ví dụ: V, A, °C, %
  options?: string[]; // Cho select
  required: boolean;
}

export interface MeasurementForm {
  id: string;
  name: string;
  description: string | null;
  fields: MeasurementField[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface MeasurementRecord {
  id: string;
  device_id: string;
  form_id: string;
  record_data: Record<string, any>;
  recorded_at: string;
  recorded_by?: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

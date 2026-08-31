export interface ChecklistItem {
  id: string;
  label: string;
}

export interface MeasurementField {
  id: string;
  label: string;
  type: 'number' | 'text' | 'boolean';
  unit?: string;
  required?: boolean;
  group?: string;
}

export interface MeasurementForm {
  id: string;
  name: string;
  description?: string;
  checklist_items: ChecklistItem[];
  measurement_fields: MeasurementField[];
  created_at: string;
  updated_at: string;
}

export interface MeasurementRecord {
  id: string;
  record_name: string;
  form_id: string;
  record_data: any; // Complex JSON structure
  recorded_by: string;
  notes?: string;
  recorded_at: string;
  created_at: string;
  updated_at: string;
}

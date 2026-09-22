ALTER TABLE measurement_forms
ADD COLUMN IF NOT EXISTS checklist_metadata JSONB;

-- Drop existing measurement_records since we are restructuring significantly
DROP TABLE IF EXISTS measurement_records;
DROP TABLE IF EXISTS measurement_forms;

CREATE TABLE measurement_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    checklist_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    measurement_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE measurement_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_name TEXT NOT NULL,
    form_id UUID REFERENCES measurement_forms(id) ON DELETE CASCADE,
    record_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    recorded_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE measurement_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurement_records ENABLE ROW LEVEL SECURITY;

-- Policies for measurement_forms
CREATE POLICY "Cho phép tất cả người dùng xem measurement_forms" ON measurement_forms FOR SELECT USING (true);
CREATE POLICY "Cho phép admin tạo measurement_forms" ON measurement_forms FOR INSERT WITH CHECK (true);
CREATE POLICY "Cho phép admin sửa measurement_forms" ON measurement_forms FOR UPDATE USING (true);
CREATE POLICY "Cho phép admin xóa measurement_forms" ON measurement_forms FOR DELETE USING (true);

-- Policies for measurement_records
CREATE POLICY "Cho phép tất cả người dùng xem measurement_records" ON measurement_records FOR SELECT USING (true);
CREATE POLICY "Cho phép tất cả người dùng tạo measurement_records" ON measurement_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Cho phép người dùng sửa measurement_records" ON measurement_records FOR UPDATE USING (true);
CREATE POLICY "Cho phép người dùng xóa measurement_records" ON measurement_records FOR DELETE USING (true);

-- Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE measurement_forms;
ALTER PUBLICATION supabase_realtime ADD TABLE measurement_records;

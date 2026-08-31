CREATE TABLE IF NOT EXISTS measured_equipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    location TEXT,
    status TEXT DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE measured_equipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cho phép tất cả người dùng xem measured_equipments" ON measured_equipments FOR SELECT USING (true);
CREATE POLICY "Cho phép tất cả người dùng tạo measured_equipments" ON measured_equipments FOR INSERT WITH CHECK (true);
CREATE POLICY "Cho phép người dùng sửa measured_equipments" ON measured_equipments FOR UPDATE USING (true);
CREATE POLICY "Cho phép người dùng xóa measured_equipments" ON measured_equipments FOR DELETE USING (true);

-- Fix measurement_records table to point to measured_equipments instead of devices
ALTER TABLE measurement_records DROP CONSTRAINT IF EXISTS measurement_records_device_id_fkey;
ALTER TABLE measurement_records RENAME COLUMN device_id TO equipment_id;
ALTER TABLE measurement_records ADD CONSTRAINT measurement_records_equipment_id_fkey FOREIGN KEY (equipment_id) REFERENCES measured_equipments(id) ON DELETE CASCADE;

ALTER PUBLICATION supabase_realtime ADD TABLE measured_equipments;

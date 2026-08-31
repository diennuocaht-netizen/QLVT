CREATE TABLE equipment_maintenance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_id UUID REFERENCES measured_equipments(id) ON DELETE CASCADE,
    maintenance_date DATE NOT NULL,
    description TEXT NOT NULL,
    replaced_parts TEXT,
    performed_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE equipment_maintenance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cho phép tất cả người dùng xem maintenance logs" ON equipment_maintenance_logs FOR SELECT USING (true);
CREATE POLICY "Cho phép tất cả người dùng tạo maintenance logs" ON equipment_maintenance_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Cho phép tất cả người dùng sửa maintenance logs" ON equipment_maintenance_logs FOR UPDATE USING (true);
CREATE POLICY "Cho phép tất cả người dùng xóa maintenance logs" ON equipment_maintenance_logs FOR DELETE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE equipment_maintenance_logs;

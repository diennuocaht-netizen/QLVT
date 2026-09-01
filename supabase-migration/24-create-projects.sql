-- Tạo bảng lưu trữ thông tin dự án
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL, -- Mã dự án
    name TEXT NOT NULL, -- Tên dự án
    description TEXT, -- Mô tả
    completion_date DATE, -- Thời gian hoàn thành
    warranty_date DATE, -- Thời gian bảo hành
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')), -- Trạng thái
    contacts JSONB DEFAULT '[]'::jsonb, -- Thông tin liên hệ: [{name, role, phone, email, company, notes}]
    attachments JSONB DEFAULT '[]'::jsonb, -- Tài liệu đính kèm: [{name, url, uploaded_at, size}]
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS (Row Level Security)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cho phép tất cả người dùng xem dự án" ON projects FOR SELECT USING (true);
CREATE POLICY "Cho phép tất cả người dùng tạo dự án" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Cho phép người dùng sửa dự án" ON projects FOR UPDATE USING (true);
CREATE POLICY "Cho phép admin xóa dự án" ON projects FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- Trigger auto-update timestamp
CREATE TRIGGER projects_update_timestamp
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_users_timestamp();

-- Thêm tính năng liên kết dự án vào tài liệu ISO (nếu chưa có)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'linked_projects') THEN
        ALTER TABLE documents ADD COLUMN linked_projects JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Thêm realtime cho projects
ALTER PUBLICATION supabase_realtime ADD TABLE projects;

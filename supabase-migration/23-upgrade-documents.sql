-- Thêm các trường dữ liệu nâng cao cho documents
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS linked_equipments JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'public' CHECK (access_level IN ('public', 'internal', 'restricted')),
  ADD COLUMN IF NOT EXISTS allowed_users JSONB DEFAULT '[]'::jsonb;

-- Bảng bình luận tài liệu
CREATE TABLE IF NOT EXISTS document_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cho phép đọc/ghi dựa trên authenticated (frontend sẽ tự filter logic)
ALTER TABLE document_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read comments" ON document_comments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert comments" ON document_comments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY "Users can delete own comments" ON document_comments
  FOR DELETE USING (auth.uid() = user_id OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin');

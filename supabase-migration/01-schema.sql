-- =====================================================
-- SUPABASE MIGRATION SCHEMA
-- Chạy các SQL queries này trong Supabase SQL Editor
-- =====================================================

-- ===== 1. USERS TABLE =====
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE users IS 'User profiles linked to Supabase Auth';
COMMENT ON COLUMN users.role IS 'Role-based access control: admin|manager|viewer';

-- Create trigger để auto-update updated_at
CREATE OR REPLACE FUNCTION update_users_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_update_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_users_timestamp();

-- ===== 2. INVENTORY ITEMS =====
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  unit TEXT,
  category TEXT,
  classification TEXT,
  quantity DECIMAL(10,2) DEFAULT 0,
  initial_stock DECIMAL(10,2) DEFAULT 0,
  unit_price DECIMAL(12,2) DEFAULT 0,
  warning_threshold_lower DECIMAL(10,2),
  warning_threshold_upper DECIMAL(10,2),
  price_update_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER inventory_items_update_timestamp
BEFORE UPDATE ON inventory_items
FOR EACH ROW
EXECUTE FUNCTION update_users_timestamp();

-- ===== 3. INVENTORY SUBSYSTEMS =====
CREATE TABLE IF NOT EXISTS inventory_subsystems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== 4. INVENTORY REQUISITION TYPES =====
CREATE TABLE IF NOT EXISTS inventory_requisition_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== 5. INVENTORY COST CODES =====
CREATE TABLE IF NOT EXISTS inventory_cost_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  classification TEXT,
  subsystem TEXT,
  purpose TEXT,
  method TEXT,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== 6. INVENTORY REQUISITIONS =====
CREATE TABLE IF NOT EXISTS inventory_requisitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  created_by TEXT NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL,
  purpose TEXT,
  status TEXT DEFAULT 'Mới tạo' CHECK (status IN ('Mới tạo', 'Đã duyệt', 'Từ chối', 'Đã nhập 1 phần', 'Đã nhập đủ', 'Đã đóng')),
  notes TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER inventory_requisitions_update_timestamp
BEFORE UPDATE ON inventory_requisitions
FOR EACH ROW
EXECUTE FUNCTION update_users_timestamp();

-- Create index for faster queries
CREATE INDEX idx_requisitions_status ON inventory_requisitions(status);
CREATE INDEX idx_requisitions_date ON inventory_requisitions(date);
CREATE INDEX idx_requisitions_created_by ON inventory_requisitions(created_by);

-- ===== 7. INVENTORY SLIPS (Phiếu nhập/xuất) =====
CREATE TABLE IF NOT EXISTS inventory_slips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Receipt', 'Issue')),
  date DATE NOT NULL,
  created_by TEXT NOT NULL,
  reason TEXT,
  receipt_type TEXT CHECK (receipt_type IS NULL OR receipt_type IN ('Theo tờ trình', 'Nhận ngoài')),
  status TEXT DEFAULT 'Đang mở' CHECK (status IN ('Đang mở', 'Đã đóng', 'Đã hoàn thành')),
  requisition_ids UUID[] DEFAULT ARRAY[]::UUID[],
  handover_record_url TEXT,
  completion_report_url TEXT,
  week_of_year TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER inventory_slips_update_timestamp
BEFORE UPDATE ON inventory_slips
FOR EACH ROW
EXECUTE FUNCTION update_users_timestamp();

-- Create indexes
CREATE INDEX idx_slips_type ON inventory_slips(type);
CREATE INDEX idx_slips_status ON inventory_slips(status);
CREATE INDEX idx_slips_date ON inventory_slips(date);
CREATE INDEX idx_slips_created_by ON inventory_slips(created_by);
CREATE INDEX idx_slips_week ON inventory_slips(week_of_year);

-- ===== 8. DOCUMENTS =====
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  system_code TEXT,
  system TEXT,
  document_type TEXT,
  title TEXT NOT NULL,
  version TEXT,
  issue_date DATE,
  update_date DATE,
  file_url TEXT,
  author_name TEXT,
  author_id UUID,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  history JSONB DEFAULT '[]'::jsonb,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TRIGGER documents_update_timestamp
BEFORE UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION update_users_timestamp();

CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_code ON documents(code);
CREATE INDEX idx_documents_author ON documents(author_id);

-- ===== 9. DEVICES =====
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  specs JSONB,
  status TEXT,
  location TEXT,
  author_id UUID,
  sub_components JSONB DEFAULT '[]'::jsonb,
  history_logs JSONB DEFAULT '[]'::jsonb,
  change_logs JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TRIGGER devices_update_timestamp
BEFORE UPDATE ON devices
FOR EACH ROW
EXECUTE FUNCTION update_users_timestamp();

CREATE INDEX idx_devices_code ON devices(code);
CREATE INDEX idx_devices_status ON devices(status);
CREATE INDEX idx_devices_author ON devices(author_id);

-- ===== 10. ENABLE ROW LEVEL SECURITY (RLS) =====
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

-- ===== 11. CREATE RLS POLICIES =====

-- Users: Everyone can read, only own profile update
CREATE POLICY "Users can read all profiles" ON users FOR SELECT
USING (TRUE);

CREATE POLICY "Users can update own profile" ON users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id AND role = (SELECT role FROM users WHERE id = auth.uid()));

CREATE POLICY "Admin can update all profiles" ON users FOR UPDATE
USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Inventory Items: Authenticated can read, manager+ can modify
CREATE POLICY "Authenticated can read items" ON inventory_items FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Manager+ can insert items" ON inventory_items FOR INSERT
WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "Manager+ can update items" ON inventory_items FOR UPDATE
USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "Manager+ can delete items" ON inventory_items FOR DELETE
USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager'));

-- Inventory Slips: Authenticated can read, manager+ can modify
CREATE POLICY "Authenticated can read slips" ON inventory_slips FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Manager+ can insert slips" ON inventory_slips FOR INSERT
WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "Manager+ can update slips" ON inventory_slips FOR UPDATE
USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "Admin can delete slips" ON inventory_slips FOR DELETE
USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Inventory Requisitions: Authenticated can read, manager+ can modify
CREATE POLICY "Authenticated can read requisitions" ON inventory_requisitions FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Manager+ can insert requisitions" ON inventory_requisitions FOR INSERT
WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "Manager+ can update requisitions" ON inventory_requisitions FOR UPDATE
USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "Admin can delete requisitions" ON inventory_requisitions FOR DELETE
USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Documents: Authenticated can read, manager+ can modify
CREATE POLICY "Authenticated can read documents" ON documents FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Manager+ can insert documents" ON documents FOR INSERT
WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "Manager+ can update documents" ON documents FOR UPDATE
USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "Admin can delete documents" ON documents FOR DELETE
USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Devices: Authenticated can read, manager+ can modify
CREATE POLICY "Authenticated can read devices" ON devices FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Manager+ can insert devices" ON devices FOR INSERT
WITH CHECK ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "Manager+ can update devices" ON devices FOR UPDATE
USING ((SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "Admin can delete devices" ON devices FOR DELETE
USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- ===== 12. STORAGE BUCKETS =====
-- Run these in Supabase Dashboard → Storage → New Bucket

/*
CREATE STORAGE:
1. handover-records (Private)
   - Authorized users can upload/download
   - Max 5MB per file
   - Allowed types: images, PDFs

2. document-files (Private)
   - Authorized users can upload/download
   - Max 100MB per file
   - All file types

3. device-images (Private)
   - Authorized users can upload/download
   - Images only
*/

-- ===== 13. STORAGE POLICIES =====

-- Handover Records
CREATE POLICY "Authenticated can upload handover records" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'handover-records');

CREATE POLICY "Authenticated can read handover records" ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'handover-records');

-- Document Files
CREATE POLICY "Authenticated can upload documents" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'document-files');

CREATE POLICY "Authenticated can read documents" ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'document-files');

-- ===== 14. VIEWS FOR COMMON QUERIES =====

-- View: Current stock calculation
CREATE OR REPLACE VIEW v_inventory_current_stock AS
SELECT 
  ii.id,
  ii.code,
  ii.name,
  ii.initial_stock,
  COALESCE(receipts.total, 0) as total_receipts,
  COALESCE(issues.total, 0) as total_issues,
  ii.initial_stock + COALESCE(receipts.total, 0) - COALESCE(issues.total, 0) as current_stock
FROM inventory_items ii
LEFT JOIN (
  SELECT items->>'itemId' as item_id, SUM((items->>'quantity')::DECIMAL) as total
  FROM inventory_slips, jsonb_array_elements(items) as items
  WHERE type = 'Receipt' AND status != 'Đang mở'
  GROUP BY items->>'itemId'
) receipts ON ii.id::text = receipts.item_id
LEFT JOIN (
  SELECT items->>'itemId' as item_id, SUM((items->>'quantity')::DECIMAL) as total
  FROM inventory_slips, jsonb_array_elements(items) as items
  WHERE type = 'Issue' AND status != 'Đang mở'
  GROUP BY items->>'itemId'
) issues ON ii.id::text = issues.item_id;

-- =====================================================
-- END OF SCHEMA
-- =====================================================

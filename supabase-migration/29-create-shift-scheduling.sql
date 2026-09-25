CREATE TABLE shift_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    color_code TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE shift_employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    role TEXT,
    team_id UUID REFERENCES shift_teams(id) ON DELETE SET NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE shift_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    text_color TEXT DEFAULT '#000000',
    bg_color TEXT DEFAULT 'transparent',
    is_night_shift BOOLEAN DEFAULT false,
    is_off_day BOOLEAN DEFAULT false,
    is_leave_day BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0
);

CREATE TABLE shift_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES shift_employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    shift_type_id UUID REFERENCES shift_types(id) ON DELETE SET NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(employee_id, date)
);

CREATE TABLE shift_monthly_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES shift_employees(id) ON DELETE CASCADE,
    month_year TEXT NOT NULL, -- Format: 'YYYY-MM'
    note TEXT,
    UNIQUE(employee_id, month_year)
);

-- Enable RLS
ALTER TABLE shift_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_monthly_notes ENABLE ROW LEVEL SECURITY;

-- Simple Policies for authenticated users
CREATE POLICY "Allow all authenticated users to read shift_teams" ON shift_teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all authenticated users to modify shift_teams" ON shift_teams FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to read shift_employees" ON shift_employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all authenticated users to modify shift_employees" ON shift_employees FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to read shift_types" ON shift_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all authenticated users to modify shift_types" ON shift_types FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to read shift_assignments" ON shift_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all authenticated users to modify shift_assignments" ON shift_assignments FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to read shift_monthly_notes" ON shift_monthly_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow all authenticated users to modify shift_monthly_notes" ON shift_monthly_notes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert default shift types based on the image
INSERT INTO shift_types (code, name, text_color, bg_color, is_night_shift, is_off_day, is_leave_day, order_index) VALUES
('M', 'Ca M (Sáng)', '#000000', 'transparent', false, false, false, 1),
('A', 'Ca A (Chiều)', '#000000', 'transparent', false, false, false, 2),
('N', 'Ca N (Đêm)', '#ef4444', 'transparent', true, false, false, 3), -- red text
('O', 'Nghỉ OFF', '#ef4444', 'transparent', false, true, false, 4), -- red text
('AD', 'Hành chính', '#000000', 'transparent', false, false, false, 5),
('AL', 'Nghỉ Phép', '#ef4444', '#fef08a', false, false, true, 6), -- red text, yellow bg
('PH', 'Nghỉ Lễ', '#22c55e', 'transparent', false, false, true, 7); -- green text

-- Add to publication
ALTER PUBLICATION supabase_realtime ADD TABLE shift_teams, shift_employees, shift_types, shift_assignments;

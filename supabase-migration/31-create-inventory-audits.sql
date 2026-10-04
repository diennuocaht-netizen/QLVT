-- Create inventory_audits table
CREATE TABLE public.inventory_audits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code varchar(50) NOT NULL UNIQUE,
  date date NOT NULL,
  created_by varchar(100) NOT NULL,
  status varchar(50) NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create inventory_audit_items table
CREATE TABLE public.inventory_audit_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_id uuid NOT NULL REFERENCES public.inventory_audits(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  system_stock numeric NOT NULL,
  actual_stock numeric NOT NULL,
  difference numeric NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Set up RLS
ALTER TABLE public.inventory_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_audit_items ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage audits
CREATE POLICY "Allow authenticated users full access to inventory_audits"
  ON public.inventory_audits
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access to inventory_audit_items"
  ON public.inventory_audit_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

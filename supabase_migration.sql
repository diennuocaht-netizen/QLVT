create table if not exists public.inventory_reconciliations (
  id uuid default gen_random_uuid() primary key,
  code text not null unique,
  start_date date not null,
  end_date date not null,
  created_by text not null,
  status text not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.inventory_reconciliation_items (
  id uuid default gen_random_uuid() primary key,
  reconciliation_id uuid references public.inventory_reconciliations(id) on delete cascade not null,
  item_id uuid references public.inventory_items(id) on delete cascade not null,
  bravo_receipts numeric default 0,
  app_receipts numeric default 0,
  bravo_issues numeric default 0,
  app_completed_issues numeric default 0,
  app_wip_issues numeric default 0,
  bravo_stock numeric default 0,
  app_stock numeric default 0,
  physical_stock numeric,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS policies
alter table public.inventory_reconciliations enable row level security;
alter table public.inventory_reconciliation_items enable row level security;

create policy "Enable all for authenticated users on inventory_reconciliations"
  on public.inventory_reconciliations for all
  to authenticated
  using (true)
  with check (true);

create policy "Enable all for authenticated users on inventory_reconciliation_items"
  on public.inventory_reconciliation_items for all
  to authenticated
  using (true)
  with check (true);

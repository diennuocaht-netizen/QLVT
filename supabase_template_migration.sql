create table if not exists public.inventory_audit_templates (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  item_ids text[] not null default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.inventory_audit_templates enable row level security;

create policy "Enable all for authenticated users on inventory_audit_templates"
  on public.inventory_audit_templates for all
  to authenticated
  using (true)
  with check (true);

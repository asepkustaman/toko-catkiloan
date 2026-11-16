-- PaintStore: skema multi-toko dengan akses hanya untuk anggota toko yang login.
-- Jalankan sekali di Supabase Dashboard > SQL Editor.

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 120),
  created_at timestamptz not null default now()
);

create table if not exists public.store_members (
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'manager', 'cashier')),
  created_at timestamptz not null default now(),
  primary key (store_id, user_id)
);

create table if not exists public.store_settings (
  store_id uuid primary key references public.stores(id) on delete cascade,
  address text,
  phone text,
  receipt_footer text not null default 'Terima kasih atas kunjungan Anda!',
  low_stock_threshold numeric(12, 3) not null default 5 check (low_stock_threshold >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 80),
  created_at timestamptz not null default now(),
  unique (store_id, name),
  unique (id, store_id)
);

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 160),
  contact text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, store_id)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  category_id uuid,
  vendor_id uuid,
  name text not null check (length(trim(name)) between 1 and 180),
  barcode text,
  unit text not null default 'kg' check (unit in ('kg', 'pcs')),
  buy_price numeric(14, 2) not null default 0 check (buy_price >= 0),
  sell_price numeric(14, 2) not null default 0 check (sell_price >= 0),
  stock numeric(14, 3) not null default 0 check (stock >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, store_id),
  foreign key (category_id, store_id) references public.categories(id, store_id) on delete set null (category_id),
  foreign key (vendor_id, store_id) references public.vendors(id, store_id) on delete set null (vendor_id)
);

alter table public.products add column if not exists color text;

create unique index if not exists products_store_barcode_unique
  on public.products (store_id, barcode)
  where barcode is not null and length(trim(barcode)) > 0;
create index if not exists products_store_name_idx on public.products (store_id, name);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  code text not null,
  subtotal numeric(14, 2) not null check (subtotal >= 0),
  total numeric(14, 2) not null check (total >= 0),
  cost_total numeric(14, 2) not null check (cost_total >= 0),
  amount_paid numeric(14, 2) not null check (amount_paid >= total),
  change_amount numeric(14, 2) not null check (change_amount >= 0),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (store_id, code),
  unique (id, store_id)
);
create index if not exists sales_store_created_idx on public.sales (store_id, created_at desc);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  sale_id uuid not null,
  product_id uuid,
  product_name text not null,
  quantity numeric(14, 3) not null check (quantity > 0),
  unit_price numeric(14, 2) not null check (unit_price >= 0),
  unit_cost numeric(14, 2) not null check (unit_cost >= 0),
  created_at timestamptz not null default now(),
  foreign key (sale_id, store_id) references public.sales(id, store_id) on delete cascade,
  foreign key (product_id, store_id) references public.products(id, store_id) on delete set null (product_id)
);
create index if not exists sale_items_sale_idx on public.sale_items (sale_id);

create table if not exists public.stock_entries (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid,
  vendor_id uuid,
  quantity numeric(14, 3) not null check (quantity > 0),
  unit_cost numeric(14, 2) not null check (unit_cost >= 0),
  occurred_on date not null default current_date,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (product_id, store_id) references public.products(id, store_id) on delete set null (product_id),
  foreign key (vendor_id, store_id) references public.vendors(id, store_id) on delete set null (vendor_id)
);
create index if not exists stock_entries_store_date_idx on public.stock_entries (store_id, occurred_on desc);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid,
  movement_type text not null check (movement_type in ('purchase', 'sale', 'adjustment')),
  quantity_delta numeric(14, 3) not null check (quantity_delta <> 0),
  reference_id uuid,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (product_id, store_id) references public.products(id, store_id) on delete set null (product_id)
);
create index if not exists inventory_movements_store_date_idx on public.inventory_movements (store_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists store_settings_set_updated_at on public.store_settings;
drop trigger if exists vendors_set_updated_at on public.vendors;
drop trigger if exists products_set_updated_at on public.products;
create trigger store_settings_set_updated_at before update on public.store_settings for each row execute function public.set_updated_at();
create trigger vendors_set_updated_at before update on public.vendors for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();

create or replace function public.is_store_member(p_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.store_members sm
    where sm.store_id = p_store_id
      and sm.user_id = (select auth.uid())
  );
$$;

create or replace function public.is_store_manager(p_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.store_members sm
    where sm.store_id = p_store_id
      and sm.user_id = (select auth.uid())
      and sm.role in ('owner', 'manager')
  );
$$;

revoke all on function public.is_store_member(uuid) from public;
revoke all on function public.is_store_manager(uuid) from public;
grant execute on function public.is_store_member(uuid) to authenticated;
grant execute on function public.is_store_manager(uuid) to authenticated;

create or replace function public.create_store_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_store_id uuid;
  v_store_name text;
begin
  v_store_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'store_name'), ''), 'Toko Baru');
  if length(v_store_name) > 120 then
    raise exception 'Nama toko maksimal 120 karakter';
  end if;

  insert into public.stores (name) values (v_store_name) returning id into v_store_id;
  insert into public.store_members (store_id, user_id, role) values (v_store_id, new.id, 'owner');
  insert into public.store_settings (store_id) values (v_store_id);
  insert into public.categories (store_id, name)
  values
    (v_store_id, 'Cat Tembok'),
    (v_store_id, 'Cat Kayu & Besi'),
    (v_store_id, 'Cat Dasar'),
    (v_store_id, 'Cat Khusus'),
    (v_store_id, 'Aksesoris');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_paintstore on auth.users;
create trigger on_auth_user_created_paintstore
  after insert on auth.users
  for each row execute function public.create_store_for_new_user();

create or replace function public.checkout_sale(
  p_store_id uuid,
  p_items jsonb,
  p_amount_paid numeric default 0
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item record;
  v_product public.products%rowtype;
  v_sale_id uuid := gen_random_uuid();
  v_subtotal numeric(14, 2) := 0;
  v_cost_total numeric(14, 2) := 0;
  v_total numeric(14, 2);
  v_amount_paid numeric(14, 2) := coalesce(p_amount_paid, 0);
  v_sale_date date := (now() at time zone 'Asia/Jakarta')::date;
  v_sale_prefix text;
  v_sale_number bigint;
begin
  if not public.is_store_member(p_store_id) then
    raise exception 'Anda tidak memiliki akses ke toko ini';
  end if;
  if jsonb_typeof(p_items) is distinct from 'array' then
    raise exception 'Format keranjang transaksi tidak valid';
  end if;
  if jsonb_array_length(p_items) = 0 then
    raise exception 'Keranjang transaksi kosong';
  end if;
  if v_amount_paid < 0 then
    raise exception 'Pembayaran tidak boleh negatif';
  end if;

  for v_item in
    select (item.value ->> 'product_id')::uuid as product_id,
           sum((item.value ->> 'quantity')::numeric) as quantity
    from jsonb_array_elements(p_items) as item(value)
    group by (item.value ->> 'product_id')::uuid
    order by (item.value ->> 'product_id')::uuid
  loop
    if v_item.quantity <= 0 then
      raise exception 'Jumlah produk harus lebih dari nol';
    end if;
    select * into v_product
      from public.products
      where id = v_item.product_id and store_id = p_store_id
      for update;
    if not found then
      raise exception 'Produk tidak ditemukan';
    end if;
    if v_product.stock < v_item.quantity then
      raise exception 'Stok % tidak mencukupi', v_product.name;
    end if;
    v_subtotal := v_subtotal + (v_product.sell_price * v_item.quantity);
    v_cost_total := v_cost_total + (v_product.buy_price * v_item.quantity);
  end loop;

  v_total := v_subtotal;
  if v_amount_paid < v_total then
    raise exception 'Pembayaran kurang dari total transaksi';
  end if;

  v_sale_prefix := 'S-' || to_char(v_sale_date, 'YYMMDD') || '-';
  perform pg_advisory_xact_lock(hashtext(p_store_id::text), hashtext(v_sale_date::text));
  select coalesce(max(substring(code from length(v_sale_prefix) + 1)::bigint), 0) + 1
    into v_sale_number
    from public.sales
    where store_id = p_store_id
      and left(code, length(v_sale_prefix)) = v_sale_prefix
      and substring(code from length(v_sale_prefix) + 1) ~ '^[0-9]+$';

  insert into public.sales (
    id, store_id, code, subtotal, total, cost_total,
    amount_paid, change_amount, created_by
  )
  values (
    v_sale_id, p_store_id,
    v_sale_prefix || lpad(v_sale_number::text, 3, '0'),
    v_subtotal, v_total, v_cost_total, v_amount_paid, v_amount_paid - v_total, (select auth.uid())
  );

  for v_item in
    select (item.value ->> 'product_id')::uuid as product_id,
           sum((item.value ->> 'quantity')::numeric) as quantity
    from jsonb_array_elements(p_items) as item(value)
    group by (item.value ->> 'product_id')::uuid
    order by (item.value ->> 'product_id')::uuid
  loop
    select * into v_product from public.products where id = v_item.product_id and store_id = p_store_id;
    insert into public.sale_items (
      store_id, sale_id, product_id, product_name, quantity, unit_price, unit_cost
    )
    values (
      p_store_id, v_sale_id, v_product.id, v_product.name, v_item.quantity,
      v_product.sell_price, v_product.buy_price
    );
    update public.products
      set stock = stock - v_item.quantity
      where id = v_product.id and store_id = p_store_id;
    insert into public.inventory_movements (
      store_id, product_id, movement_type, quantity_delta, reference_id, created_by
    )
    values (
      p_store_id, v_product.id, 'sale', -v_item.quantity, v_sale_id, (select auth.uid())
    );
  end loop;
  return v_sale_id;
end;
$$;

create or replace function public.record_stock_entry(
  p_store_id uuid,
  p_product_id uuid,
  p_vendor_id uuid,
  p_quantity numeric,
  p_unit_cost numeric,
  p_occurred_on date default current_date,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product public.products%rowtype;
  v_entry_id uuid := gen_random_uuid();
begin
  if not public.is_store_member(p_store_id) then
    raise exception 'Anda tidak memiliki akses ke toko ini';
  end if;
  if not public.is_store_manager(p_store_id) then
    raise exception 'Hanya pemilik atau pengelola toko yang dapat mencatat stok masuk';
  end if;
  if p_quantity is null or p_quantity <= 0 or p_unit_cost is null or p_unit_cost < 0 then
    raise exception 'Jumlah harus lebih dari nol dan harga beli tidak boleh negatif';
  end if;

  select * into v_product
    from public.products
    where id = p_product_id and store_id = p_store_id
    for update;
  if not found then
    raise exception 'Produk tidak ditemukan';
  end if;
  if p_vendor_id is not null and not exists (
    select 1 from public.vendors where id = p_vendor_id and store_id = p_store_id
  ) then
    raise exception 'Vendor tidak ditemukan';
  end if;

  insert into public.stock_entries (
    id, store_id, product_id, vendor_id, quantity, unit_cost, occurred_on, note, created_by
  )
  values (
    v_entry_id, p_store_id, p_product_id, p_vendor_id, p_quantity, p_unit_cost,
    coalesce(p_occurred_on, current_date), nullif(trim(p_note), ''), (select auth.uid())
  );
  update public.products
    set stock = stock + p_quantity, buy_price = p_unit_cost
    where id = p_product_id and store_id = p_store_id;
  insert into public.inventory_movements (
    store_id, product_id, movement_type, quantity_delta, reference_id, note, created_by
  )
  values (
    p_store_id, p_product_id, 'purchase', p_quantity, v_entry_id, nullif(trim(p_note), ''), (select auth.uid())
  );
  return v_entry_id;
end;
$$;

revoke all on function public.checkout_sale(uuid, jsonb, numeric) from public;
revoke all on function public.record_stock_entry(uuid, uuid, uuid, numeric, numeric, date, text) from public;
grant execute on function public.checkout_sale(uuid, jsonb, numeric) to authenticated;
grant execute on function public.record_stock_entry(uuid, uuid, uuid, numeric, numeric, date, text) to authenticated;

alter table public.stores enable row level security;
alter table public.store_members enable row level security;
alter table public.store_settings enable row level security;
alter table public.categories enable row level security;
alter table public.vendors enable row level security;
alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.stock_entries enable row level security;
alter table public.inventory_movements enable row level security;

drop policy if exists stores_select_member on public.stores;
drop policy if exists stores_update_owner on public.stores;
drop policy if exists stores_update_manager on public.stores;
create policy stores_select_member on public.stores for select to authenticated using (public.is_store_member(id));
create policy stores_update_manager on public.stores for update to authenticated using (public.is_store_manager(id)) with check (public.is_store_manager(id));

drop policy if exists members_select_store on public.store_members;
create policy members_select_store on public.store_members for select to authenticated using (user_id = (select auth.uid()) or public.is_store_member(store_id));

drop policy if exists settings_select_member on public.store_settings;
drop policy if exists settings_update_member on public.store_settings;
drop policy if exists settings_update_manager on public.store_settings;
create policy settings_select_member on public.store_settings for select to authenticated using (public.is_store_member(store_id));
create policy settings_update_manager on public.store_settings for update to authenticated using (public.is_store_manager(store_id)) with check (public.is_store_manager(store_id));

drop policy if exists categories_select_member on public.categories;
drop policy if exists categories_insert_member on public.categories;
drop policy if exists categories_insert_manager on public.categories;
drop policy if exists categories_update_member on public.categories;
drop policy if exists categories_update_manager on public.categories;
drop policy if exists categories_delete_member on public.categories;
drop policy if exists categories_delete_manager on public.categories;
create policy categories_select_member on public.categories for select to authenticated using (public.is_store_member(store_id));
create policy categories_insert_manager on public.categories for insert to authenticated with check (public.is_store_manager(store_id));
create policy categories_update_manager on public.categories for update to authenticated using (public.is_store_manager(store_id)) with check (public.is_store_manager(store_id));
create policy categories_delete_manager on public.categories for delete to authenticated using (public.is_store_manager(store_id));

drop policy if exists vendors_select_member on public.vendors;
drop policy if exists vendors_insert_member on public.vendors;
drop policy if exists vendors_insert_manager on public.vendors;
drop policy if exists vendors_update_member on public.vendors;
drop policy if exists vendors_update_manager on public.vendors;
drop policy if exists vendors_delete_member on public.vendors;
drop policy if exists vendors_delete_manager on public.vendors;
create policy vendors_select_member on public.vendors for select to authenticated using (public.is_store_member(store_id));
create policy vendors_insert_manager on public.vendors for insert to authenticated with check (public.is_store_manager(store_id));
create policy vendors_update_manager on public.vendors for update to authenticated using (public.is_store_manager(store_id)) with check (public.is_store_manager(store_id));
create policy vendors_delete_manager on public.vendors for delete to authenticated using (public.is_store_manager(store_id));

drop policy if exists products_select_member on public.products;
drop policy if exists products_insert_member on public.products;
drop policy if exists products_insert_manager on public.products;
drop policy if exists products_update_member on public.products;
drop policy if exists products_update_manager on public.products;
drop policy if exists products_delete_member on public.products;
drop policy if exists products_delete_manager on public.products;
create policy products_select_member on public.products for select to authenticated using (public.is_store_member(store_id));
create policy products_insert_manager on public.products for insert to authenticated with check (public.is_store_manager(store_id));
create policy products_update_manager on public.products for update to authenticated using (public.is_store_manager(store_id)) with check (public.is_store_manager(store_id));
create policy products_delete_manager on public.products for delete to authenticated using (public.is_store_manager(store_id));

drop policy if exists sales_select_member on public.sales;
create policy sales_select_member on public.sales for select to authenticated using (public.is_store_member(store_id));

drop policy if exists sale_items_select_member on public.sale_items;
create policy sale_items_select_member on public.sale_items for select to authenticated using (public.is_store_member(store_id));

drop policy if exists stock_entries_select_member on public.stock_entries;
create policy stock_entries_select_member on public.stock_entries for select to authenticated using (public.is_store_member(store_id));

drop policy if exists inventory_movements_select_member on public.inventory_movements;
create policy inventory_movements_select_member on public.inventory_movements for select to authenticated using (public.is_store_member(store_id));

grant select, update on public.stores to authenticated;
grant select on public.store_members to authenticated;
grant select, update on public.store_settings to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.vendors to authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select on public.sales, public.sale_items, public.stock_entries, public.inventory_movements to authenticated;

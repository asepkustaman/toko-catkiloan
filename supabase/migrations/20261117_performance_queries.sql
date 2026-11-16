begin;

create index if not exists vendors_store_name_idx
  on public.vendors (store_id, name);

create or replace function public.get_dashboard_summary(p_store_id uuid)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'Asia/Jakarta')::date;
  v_result jsonb;
begin
  if not public.is_store_member(p_store_id) then
    raise exception 'Anda tidak memiliki akses ke toko ini';
  end if;

  with daily_sales as (
    select (s.created_at at time zone 'Asia/Jakarta')::date as sale_date,
           sum(s.total) as total
    from public.sales s
    where s.store_id = p_store_id
      and s.created_at >= ((v_today - 6)::timestamp at time zone 'Asia/Jakarta')
      and s.created_at < ((v_today + 1)::timestamp at time zone 'Asia/Jakarta')
    group by (s.created_at at time zone 'Asia/Jakarta')::date
  ),
  today_sales as (
    select count(*) as transaction_count, coalesce(sum(s.total), 0) as total
    from public.sales s
    where s.store_id = p_store_id
      and s.created_at >= (v_today::timestamp at time zone 'Asia/Jakarta')
      and s.created_at < ((v_today + 1)::timestamp at time zone 'Asia/Jakarta')
  ),
  recent_sales as (
    select s.id, s.code, s.created_at, s.total,
           (select count(*)::integer from public.sale_items si where si.sale_id = s.id) as item_count
    from public.sales s
    where s.store_id = p_store_id
    order by s.created_at desc
    limit 5
  )
  select jsonb_build_object(
    'today_count', (select transaction_count from today_sales),
    'today_total', (select total from today_sales),
    'week', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'key', to_char(day, 'YYYY-MM-DD'),
          'total', coalesce(daily_sales.total, 0)
        )
        order by day
      )
      from generate_series(v_today - 6, v_today, interval '1 day') as days(day)
      left join daily_sales on daily_sales.sale_date = day::date
    ), '[]'::jsonb),
    'recent', coalesce((
      select jsonb_agg(to_jsonb(recent_sales) order by recent_sales.created_at desc)
      from recent_sales
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

create or replace function public.get_sales_page(
  p_store_id uuid,
  p_from date default null,
  p_to date default null,
  p_search text default '',
  p_offset integer default 0,
  p_limit integer default 50
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if not public.is_store_member(p_store_id) then
    raise exception 'Anda tidak memiliki akses ke toko ini';
  end if;
  if p_offset < 0 or p_limit < 1 or p_limit > 500 then
    raise exception 'Rentang halaman tidak valid';
  end if;
  if p_from is not null and p_to is not null and p_from > p_to then
    raise exception 'Rentang tanggal tidak valid';
  end if;

  with filtered_sales as materialized (
    select s.id, s.store_id, s.code, s.subtotal, s.total, s.cost_total,
           s.amount_paid, s.change_amount, s.created_by, s.created_at
    from public.sales s
    where s.store_id = p_store_id
      and (p_from is null or s.created_at >= (p_from::timestamp at time zone 'Asia/Jakarta'))
      and (p_to is null or s.created_at < ((p_to + 1)::timestamp at time zone 'Asia/Jakarta'))
      and (coalesce(p_search, '') = '' or s.code ilike '%' || p_search || '%')
  ),
  page_rows as (
    select f.*,
           (select count(*)::integer from public.sale_items si where si.sale_id = f.id) as item_count
    from filtered_sales f
    order by f.created_at desc
    limit p_limit offset p_offset
  ),
  report_totals as (
    select count(*) as transaction_count,
           coalesce(sum(f.total), 0) as revenue,
           coalesce(sum(f.cost_total), 0) as cost
    from filtered_sales f
  ),
  stock_totals as (
    select coalesce(sum(se.quantity * se.unit_cost), 0) as expense
    from public.stock_entries se
    where se.store_id = p_store_id
      and (p_from is null or se.occurred_on >= p_from)
      and (p_to is null or se.occurred_on <= p_to)
  )
  select jsonb_build_object(
    'total_count', (select transaction_count from report_totals),
    'revenue', (select revenue from report_totals),
    'cost', (select cost from report_totals),
    'stock_expense', (select expense from stock_totals),
    'rows', coalesce((
      select jsonb_agg(to_jsonb(page_rows) order by page_rows.created_at desc)
      from page_rows
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

create or replace function public.get_stock_entries_page(
  p_store_id uuid,
  p_date date default null,
  p_offset integer default 0,
  p_limit integer default 50
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if not public.is_store_member(p_store_id) then
    raise exception 'Anda tidak memiliki akses ke toko ini';
  end if;
  if p_offset < 0 or p_limit < 1 or p_limit > 500 then
    raise exception 'Rentang halaman tidak valid';
  end if;

  with filtered_entries as materialized (
    select se.id, se.store_id, se.product_id, se.vendor_id, se.quantity,
           se.unit_cost, se.occurred_on, se.note, se.created_by, se.created_at,
           p.name as product_name, v.name as vendor_name
    from public.stock_entries se
    left join public.products p on p.id = se.product_id and p.store_id = se.store_id
    left join public.vendors v on v.id = se.vendor_id and v.store_id = se.store_id
    where se.store_id = p_store_id
      and (p_date is null or se.occurred_on = p_date)
  ),
  page_rows as (
    select f.*
    from filtered_entries f
    order by f.occurred_on desc, f.created_at desc
    limit p_limit offset p_offset
  ),
  entry_totals as (
    select count(*) as entry_count,
           coalesce(sum(f.quantity * f.unit_cost), 0) as total_cost
    from filtered_entries f
  )
  select jsonb_build_object(
    'total_count', (select entry_count from entry_totals),
    'total_cost', (select total_cost from entry_totals),
    'rows', coalesce((
      select jsonb_agg(to_jsonb(page_rows) order by page_rows.occurred_on desc, page_rows.created_at desc)
      from page_rows
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.get_dashboard_summary(uuid) from public;
revoke all on function public.get_sales_page(uuid, date, date, text, integer, integer) from public;
revoke all on function public.get_stock_entries_page(uuid, date, integer, integer) from public;
grant execute on function public.get_dashboard_summary(uuid) to authenticated;
grant execute on function public.get_sales_page(uuid, date, date, text, integer, integer) to authenticated;
grant execute on function public.get_stock_entries_page(uuid, date, integer, integer) to authenticated;

commit;

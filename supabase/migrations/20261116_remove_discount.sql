begin;

drop function if exists public.checkout_sale(uuid, jsonb, numeric, numeric);
drop function if exists public.checkout_sale(uuid, jsonb, numeric);

create function public.checkout_sale(
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

revoke all on function public.checkout_sale(uuid, jsonb, numeric) from public;
grant execute on function public.checkout_sale(uuid, jsonb, numeric) to authenticated;

commit;

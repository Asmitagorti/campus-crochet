-- Run in Supabase SQL Editor before deploying the flat-delivery checkout.
-- Poll mode stays unchanged. Historic delivery rates and orders are preserved.

create table if not exists public.saved_checkout_details (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  phone text not null check (phone ~ '^[6-9][0-9]{9}$'),
  address_choice text not null check (address_choice in ('Aditya Surampalem', 'Others')),
  address_line1 text not null default '',
  area_street text not null default '',
  city text not null default '',
  state text not null default '',
  delivery_pin text not null default '',
  landmark text not null default '',
  updated_at timestamptz not null default now()
);
alter table public.saved_checkout_details enable row level security;
revoke all on public.saved_checkout_details from public, anon, authenticated;
grant select, insert, update on public.saved_checkout_details to service_role;

-- The preview and shop_create_order both call this function. Order creation
-- compares the quoted amount with the client amount before reserving payment.
create or replace function public.shop_quote_delivery(p_items jsonb, p_pin text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare item jsonb; product public.products%rowtype;
  subtotal bigint := 0; delivery bigint := 0; line_qty integer;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1
    or jsonb_array_length(p_items) > 20 then raise exception 'Invalid bag.'; end if;
  if p_pin is not null and p_pin !~ '^[1-9][0-9]{5}$' then
    raise exception 'Please enter a valid six-digit delivery PIN.';
  end if;
  for item in select value from jsonb_array_elements(p_items) loop
    if coalesce(item->>'quantity', '') !~ '^[0-9]+$' then raise exception 'Invalid quantity.'; end if;
    line_qty := (item->>'quantity')::integer;
    if line_qty < 1 or line_qty > 20 then raise exception 'Invalid quantity.'; end if;
    select * into product from public.products where product_id = (item->>'productId')::uuid;
    if not found or product.is_available is not true then raise exception 'An item is unavailable.'; end if;
    subtotal := subtotal + round(product.price * line_qty * 100)::bigint;
  end loop;
  if p_pin is not null and subtotal <= 49900 then delivery := 6900; end if;
  return jsonb_build_object('subtotalPaise', subtotal, 'postagePaise', 0,
    'deliveryPaise', delivery, 'totalPaise', subtotal + delivery,
    'weightGrams', 0, 'slabGrams', null, 'originPin', '533001');
end $$;

revoke execute on function public.shop_quote_delivery(jsonb,text) from public, anon, authenticated;
grant execute on function public.shop_quote_delivery(jsonb,text) to service_role;

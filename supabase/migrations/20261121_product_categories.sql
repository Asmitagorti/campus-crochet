-- Run in Supabase SQL Editor before deploying the multi-category storefront.
-- Existing products and orders are preserved; each product starts with its current category.

alter table public.products add column if not exists categories text[];
update public.products
  set categories = array[coalesce(nullif(trim(category), ''), 'Accessories')]
  where categories is null or cardinality(categories) = 0;
alter table public.products alter column categories set default array['Accessories']::text[];
alter table public.products alter column categories set not null;
do $$ begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.products'::regclass
    and conname = 'products_categories_count') then
    alter table public.products add constraint products_categories_count
      check (cardinality(categories) between 1 and 8);
  end if;
end $$;

create or replace function public.shop_save_product(
  p_id uuid, p_expected integer, p_fields jsonb, p_images jsonb
) returns uuid language plpgsql security definer set search_path = public as $$
declare saved_id uuid; current_revision integer; grams integer; category_names text[];
begin
  grams := nullif(p_fields->>'packedWeightGrams', '')::integer;
  if grams is not null and (grams < 1 or grams > 50000) then raise exception 'Invalid packed weight.'; end if;
  if jsonb_typeof(p_fields->'categories') = 'array' then
    select array_agg(value order by ordinality) into category_names
      from jsonb_array_elements_text(p_fields->'categories') with ordinality;
  else
    category_names := array[p_fields->>'category'];
  end if;
  if category_names is null or cardinality(category_names) not between 1 and 8
    or exists (select 1 from unnest(category_names) as c(name)
      where c.name is null or length(trim(c.name)) not between 2 and 50)
    or (select count(distinct lower(c.name)) from unnest(category_names) as c(name)) <> cardinality(category_names)
  then raise exception 'Choose one to eight distinct categories.'; end if;
  if p_id is null then
    insert into public.products(slug, name, category, categories, short_description, full_description,
      price, stock_quantity, packed_weight_grams, processing_time_days, is_available, details, display_colors, revision)
    values(p_fields->>'slug', p_fields->>'name', category_names[1], category_names,
      p_fields->>'note', p_fields->>'description', (p_fields->>'price')::numeric,
      (p_fields->>'stock')::bigint, grams, 7, (p_fields->>'active')::boolean,
      p_fields->'details', p_fields->'colors', 1)
      returning product_id into saved_id;
  else
    select revision into current_revision from public.products where product_id = p_id for update;
    if not found then raise exception 'Product not found.'; end if;
    if current_revision <> p_expected then raise exception 'Product changed. Refresh before saving.'; end if;
    update public.products set name = p_fields->>'name', category = category_names[1], categories = category_names,
      short_description = p_fields->>'note', full_description = p_fields->>'description',
      price = (p_fields->>'price')::numeric, stock_quantity = (p_fields->>'stock')::bigint,
      packed_weight_grams = grams, is_available = (p_fields->>'active')::boolean,
      details = p_fields->'details', display_colors = p_fields->'colors',
      revision = revision + 1, updated_at = now()
      where product_id = p_id returning product_id into saved_id;
  end if;
  delete from public.product_images where product_id = saved_id;
  insert into public.product_images(product_id, image_url, display_order)
    select saved_id, value, (ordinality - 1)::integer
    from jsonb_array_elements_text(p_images) with ordinality;
  return saved_id;
end $$;

revoke execute on function public.shop_save_product(uuid,integer,jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.shop_save_product(uuid,integer,jsonb,jsonb) to service_role;

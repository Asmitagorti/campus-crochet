-- Run in Supabase SQL Editor before publishing the next shop draft.
-- Existing orders and poll mode remain unchanged. All shop pieces are made to order.

alter table public.products alter column stock_quantity drop not null;
update public.products set stock_quantity = null where stock_quantity is not null;
update public.shop_product_drafts
  set data = data - 'stock', base_stock = null
  where data ? 'stock' or base_stock is not null;

create or replace function public.shop_publish_and_open(p_expected integer)
returns void language plpgsql security definer set search_path = '' as $$
declare draft record; names text[]; content jsonb; state_mode text;
  draft_revision integer;
begin
  select mode into state_mode from public.site_runtime where id = true for update;
  if state_mode is distinct from 'poll' then
    raise exception 'Show the poll before publishing shop changes.';
  end if;
  select revision into draft_revision from public.shop_draft_state where id = true for update;
  if draft_revision is distinct from p_expected then
    raise exception 'Shop draft changed. Refresh and review the preview before publishing.';
  end if;
  if not exists (select 1 from public.shop_product_drafts where data->>'active' = 'true') then
    raise exception 'Show at least one product in the shop draft before publishing.';
  end if;
  for draft in select * from public.shop_product_drafts order by draft_id loop
    if jsonb_typeof(draft.data->'categories') is distinct from 'array'
      or jsonb_typeof(draft.data->'gallery') is distinct from 'array' then
      raise exception 'A draft product has invalid categories or pictures.';
    end if;
    select array_agg(value order by ordinality) into names
      from jsonb_array_elements_text(draft.data->'categories') with ordinality;
    if coalesce(cardinality(names), 0) not between 1 and 8
      or jsonb_array_length(draft.data->'gallery') not between 1 and 8 then
      raise exception 'A draft product needs categories and pictures.';
    end if;
    insert into public.products as live(product_id, slug, name, category, categories,
      short_description, full_description, price, stock_quantity, packed_weight_grams,
      processing_time_days, is_available, details, display_colors, revision)
    values(draft.draft_id, draft.slug, draft.data->>'name', names[1], names,
      draft.data->>'note', draft.data->>'description', (draft.data->>'price')::numeric,
      null, (draft.data->>'packedWeightGrams')::integer,
      7, (draft.data->>'active')::boolean, draft.data->'details', draft.data->'colors', 1)
    on conflict (product_id) do update set
      name = excluded.name, category = excluded.category, categories = excluded.categories,
      short_description = excluded.short_description, full_description = excluded.full_description,
      price = excluded.price, stock_quantity = null,
      packed_weight_grams = excluded.packed_weight_grams,
      is_available = excluded.is_available, details = excluded.details,
      display_colors = excluded.display_colors,
      revision = live.revision + 1, updated_at = now();
    delete from public.product_images where product_id = draft.draft_id;
    insert into public.product_images(product_id, image_url, display_order)
      select draft.draft_id, value, (ordinality - 1)::integer
      from jsonb_array_elements_text(draft.data->'gallery') with ordinality;
  end loop;
  select data into content from public.shop_content_drafts where key = 'settings';
  if content is null then raise exception 'Shop content draft is missing.'; end if;
  insert into public.site_content as live(key, data, revision)
    values('settings', content, 1)
    on conflict (key) do update set data = excluded.data,
      revision = live.revision + 1, updated_at = now();
  for draft in select * from public.shop_journey_drafts order by slug loop
    insert into public.journey as live(slug, data, published, revision)
      values(draft.slug, draft.data, draft.published, 1)
      on conflict (slug) do update set data = excluded.data,
        published = excluded.published, revision = live.revision + 1,
        updated_at = now();
  end loop;
  update public.shop_draft_state set dirty = false, last_published_at = now(), updated_at = now()
    where id = true;
  update public.site_runtime set mode = 'shop', updated_at = now() where id = true;
end $$;
revoke execute on function public.shop_publish_and_open(integer) from public, anon, authenticated;
grant execute on function public.shop_publish_and_open(integer) to service_role;

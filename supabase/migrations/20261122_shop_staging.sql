-- Run once in Supabase SQL Editor before deploying the private shop preview.
-- Existing public products and site content stay in place. The current poll mode
-- stays unchanged until the admin publishes the draft and opens the shop.

create table if not exists public.shop_product_drafts (
  draft_id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  base_stock bigint,
  revision integer not null default 1,
  updated_at timestamptz not null default now()
);
alter table public.shop_product_drafts add column if not exists base_stock bigint;
create table if not exists public.shop_content_drafts (
  key text primary key,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  revision integer not null default 0,
  updated_at timestamptz not null default now()
);
create table if not exists public.shop_journey_drafts (
  slug text primary key,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  published boolean not null default false,
  revision integer not null default 0,
  updated_at timestamptz not null default now()
);
create table if not exists public.shop_draft_state (
  id boolean primary key default true check (id),
  dirty boolean not null default false,
  revision integer not null default 0,
  last_published_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.shop_draft_state add column if not exists revision integer not null default 0;

-- Seed drafts from the current shop. Re-running this file preserves later edits.
insert into public.shop_product_drafts(draft_id, slug, data, base_stock, revision)
select p.product_id, p.slug,
  jsonb_build_object(
    'name', p.name, 'note', coalesce(p.short_description, ''),
    'category', p.category, 'categories', coalesce(to_jsonb(p.categories), jsonb_build_array(p.category)),
    'description', coalesce(p.full_description, ''), 'price', p.price,
    'stock', p.stock_quantity, 'packedWeightGrams', p.packed_weight_grams,
    'active', p.is_available, 'details', p.details, 'colors', p.display_colors,
    'gallery', coalesce((select jsonb_agg(i.image_url order by i.display_order)
      from public.product_images i where i.product_id = p.product_id), '[]'::jsonb)
  ), p.stock_quantity, p.revision
from public.products p where p.slug is not null
on conflict (draft_id) do nothing;
insert into public.shop_content_drafts(key, data, revision)
select key, data, revision from public.site_content where key = 'settings'
on conflict (key) do nothing;
insert into public.shop_content_drafts(key, data) values('settings', '{}'::jsonb)
on conflict (key) do nothing;
insert into public.shop_journey_drafts(slug, data, published, revision)
select slug, data, published, revision from public.journey
on conflict (slug) do nothing;
insert into public.shop_draft_state(id) values(true) on conflict (id) do nothing;

alter table public.shop_product_drafts enable row level security;
alter table public.shop_content_drafts enable row level security;
alter table public.shop_journey_drafts enable row level security;
alter table public.shop_draft_state enable row level security;
revoke all on public.shop_product_drafts, public.shop_content_drafts, public.shop_journey_drafts,
  public.shop_draft_state from public, anon, authenticated;
grant all on public.shop_product_drafts, public.shop_content_drafts, public.shop_journey_drafts,
  public.shop_draft_state to service_role;

create or replace function public.shop_mark_draft_dirty()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.shop_draft_state set dirty = true, revision = revision + 1,
    updated_at = now() where id = true;
  return new;
end $$;
drop trigger if exists shop_product_draft_changed on public.shop_product_drafts;
create trigger shop_product_draft_changed after insert or update or delete on public.shop_product_drafts
  for each row execute function public.shop_mark_draft_dirty();
drop trigger if exists shop_content_draft_changed on public.shop_content_drafts;
create trigger shop_content_draft_changed after insert or update or delete on public.shop_content_drafts
  for each row execute function public.shop_mark_draft_dirty();
drop trigger if exists shop_journey_draft_changed on public.shop_journey_drafts;
create trigger shop_journey_draft_changed after insert or update or delete on public.shop_journey_drafts
  for each row execute function public.shop_mark_draft_dirty();
revoke execute on function public.shop_mark_draft_dirty() from public, anon, authenticated;

-- Only the password-protected admin API calls this service-role function.
-- Publishing and opening the selling website happen in one transaction.
drop function if exists public.shop_publish_and_open();
create or replace function public.shop_publish_and_open(p_expected integer)
returns void language plpgsql security definer set search_path = '' as $$
declare draft record; names text[]; content jsonb; state_mode text;
  current_stock bigint; published_stock bigint; draft_revision integer;
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
    select stock_quantity into current_stock from public.products
      where product_id = draft.draft_id for update;
    if found then
      -- Keep sales and payment reservations made while the old shop was live.
      -- An admin stock edit is applied as a change from the last publication.
      published_stock := greatest(0, coalesce(current_stock, 0)
        + (draft.data->>'stock')::bigint - coalesce(draft.base_stock, current_stock, 0));
    else
      published_stock := (draft.data->>'stock')::bigint;
    end if;
    insert into public.products as live(product_id, slug, name, category, categories,
      short_description, full_description, price, stock_quantity, packed_weight_grams,
      processing_time_days, is_available, details, display_colors, revision)
    values(draft.draft_id, draft.slug, draft.data->>'name', names[1], names,
      draft.data->>'note', draft.data->>'description', (draft.data->>'price')::numeric,
      published_stock, (draft.data->>'packedWeightGrams')::integer,
      7, (draft.data->>'active')::boolean, draft.data->'details', draft.data->'colors', 1)
    on conflict (product_id) do update set
      name = excluded.name, category = excluded.category, categories = excluded.categories,
      short_description = excluded.short_description, full_description = excluded.full_description,
      price = excluded.price, stock_quantity = excluded.stock_quantity,
      packed_weight_grams = excluded.packed_weight_grams,
      is_available = excluded.is_available, details = excluded.details,
      display_colors = excluded.display_colors,
      revision = live.revision + 1, updated_at = now();
    delete from public.product_images where product_id = draft.draft_id;
    insert into public.product_images(product_id, image_url, display_order)
      select draft.draft_id, value, (ordinality - 1)::integer
      from jsonb_array_elements_text(draft.data->'gallery') with ordinality;
    update public.shop_product_drafts
      set data = jsonb_set(data, '{stock}', to_jsonb(published_stock)),
        base_stock = published_stock, updated_at = now()
      where draft_id = draft.draft_id;
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

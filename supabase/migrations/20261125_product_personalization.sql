-- Run in Supabase SQL Editor before deploying the personalization UI.
-- Existing products and orders remain intact. New colour choices stay in the
-- private shop draft until the admin publishes changes to the live shop.

alter table public.products add column if not exists color_options jsonb not null default '[]'::jsonb;
alter table public.products drop constraint if exists products_color_options_valid;
alter table public.products add constraint products_color_options_valid
  check (jsonb_typeof(color_options) = 'array' and jsonb_array_length(color_options) <= 12);

-- The existing publish transaction copies the normal product fields and then
-- updates shop_draft_state.last_published_at. Copy colour choices at that same
-- point, within the same transaction, without replacing the payment-safe
-- publish function or switching the public site mode.
create or replace function public.shop_publish_color_options()
returns trigger language plpgsql security definer set search_path = '' as $$
declare draft record; options jsonb;
begin
  for draft in select draft_id, data from public.shop_product_drafts loop
    options := coalesce(draft.data->'colorOptions', '[]'::jsonb);
    if jsonb_typeof(options) is distinct from 'array' or jsonb_array_length(options) > 12 then
      raise exception 'A draft product has invalid colour choices.';
    end if;
    update public.products set color_options = options where product_id = draft.draft_id;
  end loop;
  return new;
end $$;
drop trigger if exists shop_publish_color_options on public.shop_draft_state;
create trigger shop_publish_color_options after update of last_published_at on public.shop_draft_state
  for each row when (old.last_published_at is distinct from new.last_published_at)
  execute function public.shop_publish_color_options();
revoke execute on function public.shop_publish_color_options() from public, anon, authenticated;

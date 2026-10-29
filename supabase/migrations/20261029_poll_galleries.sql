-- Add up to eight photos per poll item. Existing items and votes are preserved.
-- Run after 20261028_final_poll_ballots.sql in Supabase SQL Editor.
begin;

alter table public.poll_options
  add column if not exists image_urls text[] not null default '{}'::text[];

-- The existing guard freezes published rows, so backfill while its trigger is
-- absent inside this transaction, then restore a guard that permits additions.
drop trigger if exists poll_options_draft_only on public.poll_options;
update public.poll_options set image_urls = array[image_url]
  where cardinality(image_urls) = 0;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'poll_options_gallery_valid') then
    alter table public.poll_options add constraint poll_options_gallery_valid
      check (cardinality(image_urls) <= 8 and
        (cardinality(image_urls) = 0 or image_urls[1] = image_url));
  end if;
end $$;

create or replace function public.poll_options_draft_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
declare current_status text; target_round uuid;
begin
  target_round := case when tg_op = 'DELETE' then old.round_id else new.round_id end;
  select status into current_status from public.poll_rounds where id = target_round for share;
  if current_status = 'draft' then
    if tg_op = 'DELETE' then return old; end if;
    -- Keep the older single-photo admin form usable during the rollout.
    if tg_op = 'UPDATE' and new.image_url is distinct from old.image_url
      and new.image_urls = old.image_urls then
      new.image_urls := array[new.image_url];
    end if;
    return new;
  end if;
  -- An open choice keeps its original name and first photo. Admins may hide it
  -- or append detail photos, but cannot replace photos already shown to voters.
  if current_status = 'open' and tg_op = 'UPDATE'
    and (to_jsonb(new) - 'hidden_at' - 'image_urls') =
        (to_jsonb(old) - 'hidden_at' - 'image_urls')
    and new.image_urls[1:cardinality(old.image_urls)] = old.image_urls then
    return new;
  end if;
  raise exception 'Published poll items cannot be edited or deleted.';
end $$;

create trigger poll_options_draft_only before insert or update or delete on public.poll_options
  for each row execute function public.poll_options_draft_guard();

create or replace function public.poll_append_option_images(
  p_round uuid, p_option uuid, p_images text[]
) returns text[] language plpgsql security definer set search_path = '' as $$
declare round_status text; item public.poll_options%rowtype;
  previous_images text[]; combined text[];
begin
  if p_images is null or cardinality(p_images) not between 1 and 8
    or array_position(p_images, null) is not null then
    raise exception 'Choose between one and eight pictures.';
  end if;
  select status into round_status from public.poll_rounds where id = p_round for update;
  if round_status is distinct from 'open' then
    raise exception 'Only an open poll item can receive more pictures.';
  end if;
  select * into item from public.poll_options
    where id = p_option and round_id = p_round for update;
  if not found then raise exception 'Poll item not found.'; end if;
  previous_images := case when cardinality(item.image_urls) = 0
    then array[item.image_url] else item.image_urls end;
  combined := previous_images || p_images;
  if cardinality(combined) > 8 or
    (select count(distinct url) from unnest(combined) as pictures(url)) <> cardinality(combined) then
    raise exception 'Keep up to eight different pictures per poll item.';
  end if;
  update public.poll_options set image_urls = combined where id = p_option;
  return combined;
end $$;

revoke execute on function public.poll_append_option_images(uuid,uuid,text[]) from public, anon, authenticated;
grant execute on function public.poll_append_option_images(uuid,uuid,text[]) to service_role;

commit;

-- Reorder pictures already saved on an open poll item. The original cover
-- remains first; the same exact picture URLs must remain attached.
-- Run after 20261029_poll_galleries.sql in Supabase SQL Editor.
begin;

drop trigger if exists poll_options_draft_only on public.poll_options;
-- Older clients could still have created single-photo items during rollout.
update public.poll_options set image_urls = array[image_url]
  where cardinality(image_urls) = 0;

create or replace function public.poll_options_draft_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
declare current_status text; target_round uuid;
begin
  target_round := case when tg_op = 'DELETE' then old.round_id else new.round_id end;
  select status into current_status from public.poll_rounds where id = target_round for share;
  if current_status = 'draft' then
    if tg_op = 'DELETE' then return old; end if;
    if tg_op = 'UPDATE' and new.image_url is distinct from old.image_url
      and new.image_urls = old.image_urls then
      new.image_urls := array[new.image_url];
    end if;
    return new;
  end if;
  if current_status = 'open' and tg_op = 'UPDATE'
    and (to_jsonb(new) - 'hidden_at' - 'image_urls') =
        (to_jsonb(old) - 'hidden_at' - 'image_urls')
    and new.image_urls[1] = old.image_url
    and (
      -- Adding pictures still only appends to the existing sequence.
      new.image_urls[1:cardinality(old.image_urls)] = old.image_urls
      or (
        -- Reordering retains every existing picture exactly once.
        cardinality(new.image_urls) = cardinality(old.image_urls)
        and array(select url from unnest(new.image_urls) as pictures(url) order by url)
          = array(select url from unnest(old.image_urls) as pictures(url) order by url)
      )
    ) then
    return new;
  end if;
  raise exception 'Published poll items cannot be edited or deleted.';
end $$;

create trigger poll_options_draft_only before insert or update or delete on public.poll_options
  for each row execute function public.poll_options_draft_guard();

create or replace function public.poll_reorder_option_images(
  p_round uuid, p_option uuid, p_images text[]
) returns text[] language plpgsql security definer set search_path = '' as $$
declare round_status text; item public.poll_options%rowtype; current_images text[];
begin
  if p_images is null or cardinality(p_images) not between 1 and 8
    or array_position(p_images, null) is not null then
    raise exception 'Choose between one and eight pictures.';
  end if;
  select status into round_status from public.poll_rounds where id = p_round for update;
  if round_status is distinct from 'open' then
    raise exception 'Only an open poll item can be reordered.';
  end if;
  select * into item from public.poll_options
    where id = p_option and round_id = p_round for update;
  if not found then raise exception 'Poll item not found.'; end if;
  current_images := case when cardinality(item.image_urls) = 0
    then array[item.image_url] else item.image_urls end;
  if p_images[1] is distinct from item.image_url
    or cardinality(p_images) <> cardinality(current_images)
    or array(select url from unnest(p_images) as pictures(url) order by url)
      is distinct from array(select url from unnest(current_images) as pictures(url) order by url) then
    raise exception 'Keep the cover and all existing pictures.';
  end if;
  update public.poll_options set image_urls = p_images where id = p_option;
  return p_images;
end $$;

revoke execute on function public.poll_reorder_option_images(uuid,uuid,text[]) from public, anon, authenticated;
grant execute on function public.poll_reorder_option_images(uuid,uuid,text[]) to service_role;

commit;

-- Campus Crochet: final ballots and reversible removal of published poll items.
-- Run after 20261028_poll_mode.sql. Existing options and ballots are preserved.

alter table public.poll_options add column if not exists hidden_at timestamptz;

create or replace function public.poll_options_draft_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
declare current_status text; target_round uuid;
begin
  target_round := case when tg_op = 'DELETE' then old.round_id else new.round_id end;
  select status into current_status from public.poll_rounds where id = target_round for share;
  if current_status = 'draft' then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  -- Published names and pictures are frozen. Only visibility can change.
  if current_status = 'open' and tg_op = 'UPDATE'
    and (to_jsonb(new) - 'hidden_at') = (to_jsonb(old) - 'hidden_at') then
    return new;
  end if;
  raise exception 'Published poll items cannot be edited or deleted.';
end $$;

create or replace function public.poll_set_option_hidden(
  p_round uuid, p_option uuid, p_hidden boolean
) returns void language plpgsql security definer set search_path = '' as $$
declare round_status text; current_option public.poll_options%rowtype;
begin
  select status into round_status from public.poll_rounds where id = p_round for update;
  if round_status is distinct from 'open' then raise exception 'Only an open poll item can be hidden or restored.'; end if;
  select * into current_option from public.poll_options
    where round_id = p_round and id = p_option for update;
  if not found then raise exception 'Poll item not found.'; end if;
  if p_hidden is null then raise exception 'Choose whether to hide or restore this item.'; end if;
  if p_hidden and current_option.hidden_at is null and
    (select count(*) from public.poll_options where round_id = p_round and hidden_at is null) <= 2 then
    raise exception 'Keep at least two items visible while the poll is open.';
  end if;
  update public.poll_options set hidden_at = case when p_hidden then coalesce(hidden_at, now()) else null end
    where round_id = p_round and id = p_option;
end $$;

create or replace function public.poll_submit_ballot(p_round uuid, p_user uuid, p_options uuid[])
returns void language plpgsql security definer set search_path = '' as $$
declare state public.site_runtime%rowtype; round_status text;
  option_count integer; saved uuid[]; requested uuid[];
begin
  if coalesce(array_length(p_options, 1), 0) not between 1 and 20
    or array_position(p_options, null) is not null
    or (select count(distinct option_id) from unnest(p_options) as chosen(option_id)) <> array_length(p_options, 1) then
    raise exception 'Choose between one and twenty different items.';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_round::text || p_user::text, 0));
  select array_agg(option_id order by option_id) into requested from unnest(p_options) as chosen(option_id);
  if exists(select 1 from public.poll_ballots where round_id = p_round and user_id = p_user) then
    select array_agg(option_id order by option_id) into saved from public.poll_votes
      where round_id = p_round and user_id = p_user;
    if saved = requested then return; end if;
    raise exception 'Your vote is final for this poll and cannot be changed.';
  end if;
  -- A retry of an already saved ballot is valid even after the shop reopens.
  -- New ballots still require the active, open poll and serialize with admin switches.
  select * into state from public.site_runtime where id = true for share;
  if not found or state.mode <> 'poll' or state.active_poll_id is distinct from p_round then
    raise exception 'This poll is not open for voting.';
  end if;
  select status into round_status from public.poll_rounds where id = p_round for share;
  if round_status is distinct from 'open' then raise exception 'This poll is not open for voting.'; end if;
  -- Lock the selected rows so an admin hide and a new vote cannot pass each other.
  select count(*) into option_count from (
    select id from public.poll_options where round_id = p_round
      and hidden_at is null and id = any(p_options) order by id for share
  ) visible_options;
  if option_count <> array_length(p_options, 1) then
    raise exception 'One or more selected items are no longer available.';
  end if;
  insert into public.poll_ballots(round_id, user_id) values(p_round, p_user);
  insert into public.poll_votes(round_id, user_id, option_id)
    select p_round, p_user, option_id from unnest(p_options) as chosen(option_id);
end $$;

-- The app reads these tables directly but writes ballots only through the RPC.
revoke all on public.poll_ballots, public.poll_votes from service_role;
grant select on public.poll_ballots, public.poll_votes to service_role;
revoke execute on function public.poll_set_option_hidden(uuid,uuid,boolean) from public, anon, authenticated;
revoke execute on function public.poll_submit_ballot(uuid,uuid,uuid[]) from public, anon, authenticated;
grant execute on function public.poll_set_option_hidden(uuid,uuid,boolean) to service_role;
grant execute on function public.poll_submit_ballot(uuid,uuid,uuid[]) to service_role;

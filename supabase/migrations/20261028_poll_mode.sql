-- Campus Crochet: manual poll/shop switch. Run after 20261027_delivery_pricing.sql.
-- Starts in POLL mode with a coming-soon page and no checkout.
create table if not exists public.poll_rounds (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 3 and 120),
  description text not null default '' check (length(description) <= 1000),
  status text not null default 'draft' check (status in ('draft', 'open', 'closed')),
  created_at timestamptz not null default now(),
  opened_at timestamptz,
  closed_at timestamptz
);
create unique index if not exists poll_one_open_round on public.poll_rounds ((true)) where status = 'open';

create table if not exists public.site_runtime (
  id boolean primary key default true check (id),
  mode text not null default 'poll' check (mode in ('shop', 'poll')),
  active_poll_id uuid references public.poll_rounds(id),
  updated_at timestamptz not null default now()
);
insert into public.site_runtime(id, mode) values(true, 'poll') on conflict (id) do nothing;

create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.poll_rounds(id) on delete cascade,
  title text not null check (length(trim(title)) between 2 and 100),
  description text not null default '' check (length(description) <= 500),
  image_url text not null check (length(image_url) between 10 and 2048),
  position integer not null default 0 check (position between 0 and 1000),
  created_at timestamptz not null default now(),
  unique(round_id, id)
);
create index if not exists poll_options_order on public.poll_options(round_id, position, created_at);

create table if not exists public.poll_ballots (
  round_id uuid not null references public.poll_rounds(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(round_id, user_id)
);
create table if not exists public.poll_votes (
  round_id uuid not null,
  user_id uuid not null,
  option_id uuid not null,
  primary key(round_id, user_id, option_id),
  foreign key(round_id, user_id) references public.poll_ballots(round_id, user_id) on delete cascade,
  foreign key(round_id, option_id) references public.poll_options(round_id, id) on delete restrict
);
create index if not exists poll_votes_count on public.poll_votes(round_id, option_id);

alter table public.poll_rounds enable row level security;
alter table public.site_runtime enable row level security;
alter table public.poll_options enable row level security;
alter table public.poll_ballots enable row level security;
alter table public.poll_votes enable row level security;
revoke all on public.poll_rounds, public.site_runtime, public.poll_options,
  public.poll_ballots, public.poll_votes from public, anon, authenticated;
grant all on public.poll_rounds, public.site_runtime, public.poll_options,
  public.poll_ballots, public.poll_votes to service_role;

-- Once published, candidates are frozen; the owner can create a new draft round.
create or replace function public.poll_options_draft_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
declare current_status text; target_round uuid;
begin
  target_round := case when tg_op = 'DELETE' then old.round_id else new.round_id end;
  select status into current_status from public.poll_rounds where id = target_round for share;
  if current_status is distinct from 'draft' then raise exception 'Published poll options cannot be changed.'; end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;
drop trigger if exists poll_options_draft_only on public.poll_options;
create trigger poll_options_draft_only before insert or update or delete on public.poll_options
  for each row execute function public.poll_options_draft_guard();

-- Site-mode row locks serialize an admin switch with new order inserts.
create or replace function public.poll_block_new_orders()
returns trigger language plpgsql security definer set search_path = '' as $$
declare current_mode text;
begin
  select mode into current_mode from public.site_runtime where id = true for share;
  if current_mode is distinct from 'shop' then
    raise exception 'Shopping is unavailable while the design poll is open.';
  end if;
  return new;
end $$;
drop trigger if exists poll_orders_shop_only on public.orders;
create trigger poll_orders_shop_only before insert on public.orders
  for each row execute function public.poll_block_new_orders();

-- Claims and gateway attachments share the same mode lock as transitions. A switch
-- waits for in-flight preparations to attach or for their two-minute lease to expire.
create or replace function public.shop_claim_gateway(p_id uuid, p_claim uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare o public.orders%rowtype; current_mode text;
begin
  select mode into current_mode from public.site_runtime where id = true for share;
  if current_mode is distinct from 'shop' then raise exception 'Shopping is unavailable while the design poll is open.'; end if;
  select * into o from public.orders where order_id = p_id for update;
  if not found or o.payment_status <> 'pending' or o.order_status <> 'pending' then
    raise exception 'This checkout can no longer start.';
  end if;
  if o.razorpay_order_id is not null then raise exception 'Payment already started.'; end if;
  if o.gateway_claim is not null and o.gateway_claimed_at > now() - interval '2 minutes' then
    raise exception 'Payment is being prepared. Please wait a moment.';
  end if;
  update public.orders set gateway_claim = p_claim, gateway_claimed_at = now() where order_id = p_id;
end $$;

create or replace function public.cc_attach_gateway(p_id uuid, p_claim uuid, p_gateway text)
returns void language plpgsql security definer set search_path = '' as $$
declare current_mode text;
begin
  select mode into current_mode from public.site_runtime where id = true for share;
  if current_mode is distinct from 'shop' then raise exception 'Shopping is unavailable while the design poll is open.'; end if;
  update public.orders set razorpay_order_id = p_gateway, gateway_claim = null, gateway_claimed_at = null
    where order_id = p_id and gateway_claim = p_claim
      and payment_status = 'pending' and order_status = 'pending';
  if not found then raise exception 'Payment preparation expired. Contact support.'; end if;
end $$;
revoke execute on function public.shop_claim_gateway(uuid,uuid) from public, anon, authenticated;
revoke execute on function public.cc_attach_gateway(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.shop_claim_gateway(uuid,uuid) to service_role;
grant execute on function public.cc_attach_gateway(uuid,uuid,text) to service_role;

create or replace function public.poll_admin_transition(p_action text, p_round uuid default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare state public.site_runtime%rowtype; chosen public.poll_rounds%rowtype;
begin
  select * into state from public.site_runtime where id = true for update;
  if not found then raise exception 'Site mode is not configured.'; end if;
  if p_action in ('open','resume','hold','close') and state.mode = 'shop' and exists (
    select 1 from public.orders where payment_status = 'pending' and order_status = 'pending'
      and gateway_claim is not null and gateway_claimed_at > now() - interval '2 minutes'
      and razorpay_order_id is null
  ) then
    raise exception 'A checkout is preparing payment. Try the switch again in a moment.';
  end if;
  if p_action = 'open' then
    select * into chosen from public.poll_rounds where id = p_round for update;
    if not found or chosen.status <> 'draft' then raise exception 'Choose a draft poll.'; end if;
    if (select count(*) from public.poll_options where round_id = p_round) < 2 then
      raise exception 'Add at least two designs before opening the poll.';
    end if;
    if state.active_poll_id is not null then raise exception 'Close the current poll first.'; end if;
    update public.poll_rounds set status = 'open', opened_at = now() where id = p_round;
    update public.site_runtime set mode = 'poll', active_poll_id = p_round, updated_at = now() where id = true;
  elsif p_action = 'shop' or p_action = 'pause' then
    update public.site_runtime set mode = 'shop', updated_at = now() where id = true;
  elsif p_action = 'hold' then
    update public.site_runtime set mode = 'poll', updated_at = now() where id = true;
  elsif p_action = 'resume' then
    if state.active_poll_id is null then raise exception 'No poll is ready to resume.'; end if;
    select * into chosen from public.poll_rounds where id = state.active_poll_id for update;
    if chosen.status <> 'open' then raise exception 'This poll is closed.'; end if;
    update public.site_runtime set mode = 'poll', updated_at = now() where id = true;
  elsif p_action = 'close' then
    if state.active_poll_id is null then raise exception 'No open poll exists.'; end if;
    update public.poll_rounds set status = 'closed', closed_at = now() where id = state.active_poll_id and status = 'open';
    update public.site_runtime set mode = 'poll', active_poll_id = null, updated_at = now() where id = true;
  else
    raise exception 'Invalid poll action.';
  end if;
  return (select to_jsonb(s) from public.site_runtime s where id = true);
end $$;

create or replace function public.poll_submit_ballot(p_round uuid, p_user uuid, p_options uuid[])
returns void language plpgsql security definer set search_path = '' as $$
declare state public.site_runtime%rowtype; option_count integer;
begin
  select * into state from public.site_runtime where id = true for share;
  if not found or state.mode <> 'poll' or state.active_poll_id is distinct from p_round then
    raise exception 'This poll is not open for voting.';
  end if;
  if coalesce(array_length(p_options, 1), 0) not between 1 and 20
    or array_position(p_options, null) is not null then
    raise exception 'Choose between one and twenty designs.';
  end if;
  select count(*) into option_count from public.poll_options where round_id = p_round and id = any(p_options);
  if option_count <> array_length(p_options, 1) then raise exception 'One or more selected designs are invalid.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_round::text || p_user::text, 0));
  insert into public.poll_ballots(round_id, user_id) values(p_round, p_user)
    on conflict(round_id, user_id) do update set updated_at = now();
  delete from public.poll_votes where round_id = p_round and user_id = p_user;
  insert into public.poll_votes(round_id, user_id, option_id)
    select p_round, p_user, selected from unnest(p_options) as selected;
end $$;

create or replace function public.poll_results(p_round uuid)
returns jsonb language sql security definer set search_path = '' as $$
  select jsonb_build_object(
    'totalVoters', (select count(*) from public.poll_ballots b where b.round_id = p_round),
    'options', coalesce((select jsonb_agg(jsonb_build_object('id', counts.id, 'votes', counts.votes)
      order by counts.position, counts.id)
      from (select o.id, o.position, count(v.option_id) as votes
        from public.poll_options o left join public.poll_votes v
          on v.round_id = o.round_id and v.option_id = o.id
        where o.round_id = p_round group by o.id, o.position) counts), '[]'::jsonb)
  );
$$;

revoke execute on function public.poll_options_draft_guard() from public, anon, authenticated;
revoke execute on function public.poll_block_new_orders() from public, anon, authenticated;
revoke execute on function public.poll_admin_transition(text,uuid) from public, anon, authenticated;
revoke execute on function public.poll_submit_ballot(uuid,uuid,uuid[]) from public, anon, authenticated;
revoke execute on function public.poll_results(uuid) from public, anon, authenticated;
grant execute on function public.poll_admin_transition(text,uuid) to service_role;
grant execute on function public.poll_submit_ballot(uuid,uuid,uuid[]) to service_role;
grant execute on function public.poll_results(uuid) to service_role;

-- First-party approximate visitor statistics. No account, IP address, or page path is stored.
create table if not exists public.site_analytics_ticks (
  visitor_id uuid not null,
  bucket_at timestamptz not null,
  active_seconds integer not null default 0 check (active_seconds between 0 and 30),
  primary key(visitor_id, bucket_at)
);
create index if not exists site_analytics_ticks_time on public.site_analytics_ticks(bucket_at);
alter table public.site_analytics_ticks enable row level security;
revoke all on public.site_analytics_ticks from public, anon, authenticated;
grant all on public.site_analytics_ticks to service_role;

create table if not exists public.site_analytics_visits (
  visitor_id uuid not null,
  visit_id uuid not null,
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key(visitor_id, visit_id)
);
create index if not exists site_analytics_visits_start on public.site_analytics_visits(started_at);
create index if not exists site_analytics_visits_seen on public.site_analytics_visits(last_seen_at);
create table if not exists public.site_analytics_optouts (
  visitor_hash text primary key,
  blocked_at timestamptz not null default now()
);
alter table public.site_analytics_visits enable row level security;
alter table public.site_analytics_optouts enable row level security;
revoke all on public.site_analytics_visits, public.site_analytics_optouts from public, anon, authenticated;
grant all on public.site_analytics_visits, public.site_analytics_optouts to service_role;

drop function if exists public.site_record_activity(uuid,integer);
create or replace function public.site_record_activity(p_visitor uuid, p_visit uuid, p_seconds integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare bucket timestamptz;
begin
  if p_visitor is null or p_visit is null or p_seconds not between 0 and 30 then
    raise exception 'Invalid activity interval.';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('analytics/' || p_visitor::text, 0));
  if exists (select 1 from public.site_analytics_optouts where visitor_hash = md5(p_visitor::text)) then
    return false;
  end if;
  insert into public.site_analytics_visits(visitor_id, visit_id) values(p_visitor, p_visit)
    on conflict(visitor_id, visit_id) do update set last_seen_at = now();
  bucket := date_trunc('minute', now()) + floor(extract(second from now()) / 30) * interval '30 seconds';
  insert into public.site_analytics_ticks(visitor_id, bucket_at, active_seconds)
    values(p_visitor, bucket, p_seconds)
    on conflict(visitor_id, bucket_at) do update
      set active_seconds = greatest(public.site_analytics_ticks.active_seconds, excluded.active_seconds);
  delete from public.site_analytics_ticks where bucket_at < now() - interval '180 days';
  delete from public.site_analytics_visits where last_seen_at < now() - interval '180 days';
  return true;
end $$;

create or replace function public.site_analytics_summary()
returns jsonb language sql security definer set search_path = '' as $$
  with recent as (
    select visitor_id, bucket_at, active_seconds,
      bucket_at at time zone 'Asia/Kolkata' as local_at
    from public.site_analytics_ticks where bucket_at >= now() - interval '90 days'
  )
  select jsonb_build_object(
    'todayVisitors', (select count(distinct visitor_id) from recent where local_at::date = (now() at time zone 'Asia/Kolkata')::date),
    'weekVisitors', (select count(distinct visitor_id) from recent where date_trunc('week', local_at) = date_trunc('week', now() at time zone 'Asia/Kolkata')),
    'todayVisits', (select count(*) from public.site_analytics_visits where (started_at at time zone 'Asia/Kolkata')::date = (now() at time zone 'Asia/Kolkata')::date),
    'weekVisits', (select count(*) from public.site_analytics_visits where date_trunc('week', started_at at time zone 'Asia/Kolkata') = date_trunc('week', now() at time zone 'Asia/Kolkata')),
    'todayActiveMinutes', (select coalesce(round(sum(active_seconds)::numeric / 60, 1), 0) from recent where local_at::date = (now() at time zone 'Asia/Kolkata')::date),
    'hourly', coalesce((select jsonb_agg(jsonb_build_object('period', hour, 'visitors', visitors, 'visits',
        (select count(*) from public.site_analytics_visits v where date_trunc('hour', v.started_at at time zone 'Asia/Kolkata') = h.hour),
        'activeMinutes', active_minutes) order by hour)
      from (select date_trunc('hour', local_at) as hour, count(distinct visitor_id) as visitors,
        round(sum(active_seconds)::numeric / 60, 1) as active_minutes from recent
        where local_at >= (now() at time zone 'Asia/Kolkata') - interval '24 hours'
        group by 1) h), '[]'::jsonb),
    'daily', coalesce((select jsonb_agg(jsonb_build_object('period', day, 'visitors', visitors, 'visits',
        (select count(*) from public.site_analytics_visits v where (v.started_at at time zone 'Asia/Kolkata')::date = d.day),
        'activeMinutes', active_minutes) order by day)
      from (select local_at::date as day, count(distinct visitor_id) as visitors,
        round(sum(active_seconds)::numeric / 60, 1) as active_minutes from recent
        where local_at >= (now() at time zone 'Asia/Kolkata') - interval '30 days'
        group by 1) d), '[]'::jsonb),
    'weekly', coalesce((select jsonb_agg(jsonb_build_object('period', week, 'visitors', visitors, 'visits',
        (select count(*) from public.site_analytics_visits v where date_trunc('week', v.started_at at time zone 'Asia/Kolkata')::date = w.week),
        'activeMinutes', active_minutes) order by week)
      from (select date_trunc('week', local_at)::date as week, count(distinct visitor_id) as visitors,
        round(sum(active_seconds)::numeric / 60, 1) as active_minutes from recent
        group by 1) w), '[]'::jsonb)
  );
$$;

create or replace function public.site_delete_visitor_activity(p_visitor uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_visitor is null then raise exception 'Invalid visitor.'; end if;
  perform pg_advisory_xact_lock(hashtextextended('analytics/' || p_visitor::text, 0));
  insert into public.site_analytics_optouts(visitor_hash) values(md5(p_visitor::text)) on conflict do nothing;
  delete from public.site_analytics_ticks where visitor_id = p_visitor;
  delete from public.site_analytics_visits where visitor_id = p_visitor;
end
$$;
revoke execute on function public.site_record_activity(uuid,uuid,integer) from public, anon, authenticated;
revoke execute on function public.site_analytics_summary() from public, anon, authenticated;
revoke execute on function public.site_delete_visitor_activity(uuid) from public, anon, authenticated;
grant execute on function public.site_record_activity(uuid,uuid,integer) to service_role;
grant execute on function public.site_analytics_summary() to service_role;
grant execute on function public.site_delete_visitor_activity(uuid) to service_role;

-- Retain no more than 180 days of visitor activity.
delete from public.site_analytics_ticks where bucket_at < now() - interval '180 days';
delete from public.site_analytics_visits where last_seen_at < now() - interval '180 days';

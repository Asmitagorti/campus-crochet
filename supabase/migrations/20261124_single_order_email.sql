-- One automatic email per paid shop order: confirmation only.
-- Run in Supabase SQL Editor before or alongside the matching site deployment.
-- Sent completion jobs remain as history; unsent ones are removed.
begin;

create or replace function public.shop_update_fulfillment(
  p_id uuid, p_version integer, p_status text, p_actor uuid
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare o public.orders%rowtype; allowed text[] := array[
  'payment_received', 'yarn_selected', 'crocheting', 'quality_check',
  'ready', 'completed', 'dispatched', 'collected'
];
begin
  select * into o from public.orders where order_id = p_id for update;
  if not found then raise exception 'Order not found'; end if;
  if o.version <> p_version then raise exception 'This order changed. Refresh before saving.'; end if;
  if o.payment_status <> 'captured' then raise exception 'Only verified paid orders can be updated.'; end if;
  if o.order_status in ('cancelled', 'collected', 'dispatched') then raise exception 'This order is closed.'; end if;
  if not (p_status = any(allowed)) then raise exception 'Invalid fulfillment status.'; end if;
  if array_position(allowed, p_status) < array_position(allowed, o.order_status) then
    raise exception 'Tracking cannot move backwards.';
  end if;
  if p_status in ('dispatched', 'collected') and o.order_status <> 'completed' then
    raise exception 'Mark the order finished before handoff.';
  end if;
  if p_status = 'dispatched' and o.delivery_choice is distinct from 'Others' then
    raise exception 'Only home delivery orders can be dispatched.';
  end if;
  if p_status = 'collected' and o.delivery_choice = 'Others' then
    raise exception 'Home delivery orders should be dispatched.';
  end if;
  if p_status = o.order_status then return to_jsonb(o); end if;
  update public.orders set order_status = p_status,
    completed_at = case when p_status in ('completed', 'dispatched', 'collected')
      then coalesce(completed_at, now()) else completed_at end,
    version = version + 1, updated_at = now()
    where order_id = p_id returning * into o;
  update public.order_items set item_status = p_status where order_id = p_id;
  insert into public.order_events(order_id, status, note, actor_id)
    values(p_id, p_status, 'Fulfillment updated.', p_actor);
  if o.custom_request_id is not null and p_status in ('crocheting', 'ready', 'completed', 'dispatched', 'collected') then
    update public.custom_requests set
      status = case when p_status = 'crocheting' then 'in_production'
        when p_status = 'ready' then 'ready' else 'completed' end,
      version = version + 1, updated_at = now() where id = o.custom_request_id;
  end if;
  return to_jsonb(o);
end $$;
revoke execute on function public.shop_update_fulfillment(uuid,integer,text,uuid) from public, anon, authenticated;
grant execute on function public.shop_update_fulfillment(uuid,integer,text,uuid) to service_role;

create or replace function public.shop_claim_order_emails(p_limit integer default 10)
returns setof public.notification_jobs language sql security definer set search_path = '' as $$
  update public.notification_jobs set status = 'sending', claimed_at = now(), attempts = attempts + 1
  where id in (
    select id from public.notification_jobs
    where kind = 'order_confirmation' and attempts < 8
      and ((status in ('pending', 'failed') and next_attempt_at <= now())
        or (status = 'sending' and claimed_at < now() - interval '10 minutes'))
    order by created_at for update skip locked limit least(greatest(p_limit, 1), 20)
  ) returning *;
$$;
revoke execute on function public.shop_claim_order_emails(integer) from public, anon, authenticated;
grant execute on function public.shop_claim_order_emails(integer) to service_role;

create or replace function public.shop_repair_order_emails()
returns integer language plpgsql security definer set search_path = '' as $$
declare o record; repaired integer := 0;
begin
  for o in select order_id, customer_snapshot from public.orders
    where checkout_fingerprint is not null and payment_status = 'captured'
      and not exists (select 1 from public.notification_jobs j
        where j.event_key = 'order_confirmation/' || orders.order_id)
  loop
    begin
      insert into public.notification_jobs(event_key, kind, recipient, payload)
        values('order_confirmation/' || o.order_id, 'order_confirmation',
          o.customer_snapshot->>'email', public.shop_order_email_payload(o.order_id))
        on conflict do nothing;
      if found then repaired := repaired + 1; end if;
      update public.orders set email_queue_error = null
        where order_id = o.order_id and email_queue_error is not null;
    exception when others then
      update public.orders set email_queue_error = left(sqlerrm, 500) where order_id = o.order_id;
    end;
  end loop;
  return repaired;
end $$;
revoke execute on function public.shop_repair_order_emails() from public, anon, authenticated;
grant execute on function public.shop_repair_order_emails() to service_role;

delete from public.notification_jobs
where kind = 'order_completion' and status is distinct from 'sent';

commit;

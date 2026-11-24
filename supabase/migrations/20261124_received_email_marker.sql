-- The studio confirms delivery manually; no customer email is sent by this function.
-- Run in Supabase SQL Editor before deploying the matching site code.
begin;

alter table public.orders add column if not exists received_at timestamptz;

create or replace function public.shop_mark_received(
  p_id uuid, p_version integer, p_actor uuid
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare o public.orders%rowtype;
begin
  select * into o from public.orders where order_id = p_id for update;
  if not found then raise exception 'Order not found.'; end if;
  if o.payment_status <> 'captured' or o.order_status <> 'dispatched' then
    raise exception 'Only a paid dispatched order can be marked received.';
  end if;
  if o.received_at is not null then return to_jsonb(o); end if;
  if o.version <> p_version then raise exception 'This order changed. Refresh before saving.'; end if;
  update public.orders set received_at = now(), version = version + 1, updated_at = now()
    where order_id = p_id returning * into o;
  insert into public.order_events(order_id, status, note, actor_id)
    values(p_id, 'dispatched', 'Studio confirmed parcel delivery.', p_actor);
  return to_jsonb(o);
end $$;

revoke execute on function public.shop_mark_received(uuid,integer,uuid) from public, anon, authenticated;
grant execute on function public.shop_mark_received(uuid,integer,uuid) to service_role;

commit;

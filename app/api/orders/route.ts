import { getServiceRoleClient } from '@/lib/server-db';
import { requireSession, requireAdmin, isAdmin } from '@/lib/auth';
import { allRows, readBody, failure, ApiError, UUID, ensureProfile, customerSnapshot, text } from '@/lib/api';
import { toOrder } from '@/lib/models';
import { deliverNotifications } from '@/lib/notifications';
export async function GET(request:Request) {
 try {
  const user=await requireSession(), db=getServiceRoleClient(), params=new URL(request.url).searchParams;
  const requestedUser=params.get('user_id');
  if(requestedUser && requestedUser!==user.id && !isAdmin(user)) throw new ApiError('Access denied',403);
  const rows=await allRows((start,end)=>{
   let q=db.from('orders').select('*,customer:users(full_name,email,phone_number,branch,year),order_items(*,product:products(*,product_images(*),product_colors(*)))').order('ordered_at',{ascending:false}).order('order_id').range(start,end);
   if(!isAdmin(user)||requestedUser) q=q.eq('user_id',requestedUser||user.id);
   return q;
  });
  const orders=rows.map(r=>toOrder(r as Record<string,unknown>));
  const ids=orders.map(o=>o.order_id);
  if(ids.length) {
   // Chunk IN clauses to stay below gateway URL limits.
   for(let offset=0;offset<ids.length;offset+=100) {
    const chunk=ids.slice(offset,offset+100);
    const events=await allRows((s,e)=>db.from('order_events').select('*').in('order_id',chunk).order('created_at').order('id').range(s,e));
    for(const o of orders.filter(o=>chunk.includes(o.order_id))) o.order_events=events.filter(v=>v.order_id===o.order_id);
   }
  }
  return Response.json(orders);
 } catch(e) { return failure(e); }
}
export async function POST(request:Request) {
 try {
  const user=await requireSession(), body=await readBody(request);
  if(!Array.isArray(body.items)||!body.items.length||body.items.length>50) throw new ApiError('Your cart is empty or too large');
  const key=text(body.checkout_key);
  if(!UUID.test(key)) throw new ApiError('A checkout reference is required');
  for(const i of body.items) {
   if(!i || !UUID.test(i.productId)||!Number.isInteger(i.quantity)||i.quantity<1||i.quantity>20||typeof i.color!=='string'||i.color.length>80) throw new ApiError('Invalid item or quantity');
  }
  await ensureProfile(user);
  const db=getServiceRoleClient();
  const {data:id,error}=await db.rpc('cc_create_order',{p_user:user.id,p_items:body.items,p_key:key,p_customer:customerSnapshot(user)});
  if(error) throw error;
  const {data:order,error:loadError}=await db.from('orders').select('*').eq('order_id',id).single();
  if(loadError) throw loadError;
  return Response.json({order:{...order,id:order.order_id},server_total:Number(order.total_price)});
 } catch(e) {return failure(e);}
}
export async function PATCH(request:Request) {
 try {
  const user=await requireAdmin(),b=await readBody(request);
  if(!UUID.test(text(b.order_id))||!Number.isInteger(b.version)||typeof b.order_status!=='string') throw new ApiError('Order, version and status are required');
  const {data,error}=await getServiceRoleClient().rpc('cc_update_order',{p_id:b.order_id,p_version:b.version,p_status:b.order_status,p_note:text(b.tracking_note,2000),p_location:text(b.pickup_location,500),p_instructions:text(b.pickup_instructions,2000),p_actor:user.id});
  if(error) throw error;
  await deliverNotifications().catch(()=>{});
  return Response.json(data);
 }catch(e){return failure(e);}
}

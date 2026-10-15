import {randomUUID} from 'node:crypto';
import {requireSession} from '@/lib/auth';
import {failure,readBody,text,UUID,ApiError} from '@/lib/api';
import {getServiceRoleClient} from '@/lib/server-db';
import {gateway,type GatewayOrder} from '@/lib/razorpay';
export async function POST(request:Request){
 try{const u=await requireSession(),b=await readBody(request),db=getServiceRoleClient();
 const id=text(b.order_id||(b.notes as {order_id?:string})?.order_id);
 if(!UUID.test(id))throw new ApiError('Select a valid order');
 const {data:owned,error:findError}=await db.from('orders').select('order_id,user_id').eq('order_id',id).single();
 if(findError)throw findError;if(owned.user_id!==u.id)throw new ApiError('Access denied',403);
 if(!process.env.RAZORPAY_KEY_ID||!process.env.RAZORPAY_KEY_SECRET)throw new ApiError('Online payment is not configured. Contact support.',503);
 const claim=randomUUID();const {data:o,error}=await db.rpc('cc_claim_gateway',{p_id:id,p_claim:claim});if(error)throw error;
 let rz:GatewayOrder;
 if(o.razorpay_order_id)rz=await gateway<GatewayOrder>(`/orders/${encodeURIComponent(o.razorpay_order_id)}`);
 else {
  try{
   rz=await gateway<GatewayOrder>('/orders','POST',{amount:Math.round(Number(o.total_price)*100),currency:'INR',receipt:id,notes:{order_id:id}});
   const {error:saveError}=await db.rpc('cc_attach_gateway',{p_id:id,p_claim:claim,p_gateway:rz.id});if(saveError)throw saveError;
  }catch(e){await db.from('orders').update({gateway_claim:null,gateway_claimed_at:null}).eq('order_id',id).eq('gateway_claim',claim);throw e;}
 }
 return Response.json({order_id:rz.id,amount:rz.amount,currency:rz.currency,key_id:process.env.RAZORPAY_KEY_ID});
 }catch(e){return failure(e);}
}

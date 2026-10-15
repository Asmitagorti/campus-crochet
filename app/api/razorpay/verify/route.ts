import {createHmac,timingSafeEqual} from 'node:crypto';
import {requireSession} from '@/lib/auth';
import {getServiceRoleClient} from '@/lib/server-db';
import {failure,readBody,text,UUID,ApiError} from '@/lib/api';
import {gateway,capturePayment,type GatewayPayment} from '@/lib/razorpay';
export async function POST(request:Request){
 try{const u=await requireSession(),b=await readBody(request),secret=process.env.RAZORPAY_KEY_SECRET;
 if(!secret)throw new ApiError('Payment gateway is not configured',503);
 const oid=text(b.order_id),rz=text(b.razorpay_order_id),pid=text(b.razorpay_payment_id),sig=text(b.razorpay_signature);
 if(!UUID.test(oid)||!/^order_[A-Za-z0-9]+$/.test(rz)||!/^pay_[A-Za-z0-9]+$/.test(pid)||!/^[a-f0-9]{64}$/i.test(sig))throw new ApiError('Invalid payment reference');
 const {data:o,error}=await getServiceRoleClient().from('orders').select('user_id,razorpay_order_id').eq('order_id',oid).single();
 if(error)throw error;if(o.user_id!==u.id)throw new ApiError('Access denied',403);
 if(o.razorpay_order_id!==rz)throw new ApiError('Payment is not linked to this order');
 const expected=createHmac('sha256',secret).update(`${rz}|${pid}`).digest('hex');
 if(!timingSafeEqual(Buffer.from(expected),Buffer.from(sig)))throw new ApiError('Invalid payment signature');
 const p=await gateway<GatewayPayment>(`/payments/${pid}`);
 if(p.order_id!==rz)throw new ApiError('Payment reference mismatch');
 const saved=await capturePayment(p);if(saved!==oid)throw new ApiError('Payment reference mismatch');
 return Response.json({success:true});
 }catch(e){return failure(e);}
}

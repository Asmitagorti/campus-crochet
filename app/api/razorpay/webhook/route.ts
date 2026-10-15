import {createHmac,timingSafeEqual} from 'node:crypto';
import {capturePayment,type GatewayPayment} from '@/lib/razorpay';
import {failure} from '@/lib/api';
export async function POST(request:Request){
 const secret=process.env.RAZORPAY_WEBHOOK_SECRET;
 if(!secret)return Response.json({error:'Webhook not configured'},{status:503});
 const raw=await request.text(),sig=request.headers.get('x-razorpay-signature')||'';
 const expected=createHmac('sha256',secret).update(raw).digest('hex');
 if(!/^[a-f0-9]{64}$/i.test(sig)||!timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return Response.json({error:'Invalid signature'},{status:400});
 try{const event=JSON.parse(raw);if(event.event==='payment.captured'){
 const p=event.payload?.payment?.entity as GatewayPayment|undefined;if(!p?.id||!p.order_id)return Response.json({error:'Invalid payment event'},{status:400});
 await capturePayment(p);
 }return Response.json({received:true});}catch(e){return failure(e);}
}

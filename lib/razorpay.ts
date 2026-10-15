import 'server-only';
import {getServiceRoleClient} from './server-db';
export interface GatewayOrder {id:string;amount:number;currency:string;status:string;}
export interface GatewayPayment {id:string;order_id:string;amount:number;currency:string;status:string;}
export async function gateway<T>(path:string,method='GET',body?:unknown):Promise<T>{
 const id=process.env.RAZORPAY_KEY_ID,secret=process.env.RAZORPAY_KEY_SECRET;
 if(!id||!secret)throw new Error('Payment gateway is not configured');
 const r=await fetch(`https://api.razorpay.com/v1${path}`,{method,headers:{Authorization:`Basic ${Buffer.from(id+':'+secret).toString('base64')}`,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(20000),cache:'no-store'});
 const data=await r.json();if(!r.ok)throw new Error(data.error?.description||'Payment provider could not process this request');return data as T;
}
export async function capturePayment(p:GatewayPayment){
 if(p.status!=='captured')throw new Error('Payment has not been captured yet. Please refresh tracking shortly.');
 const {data,error}=await getServiceRoleClient().rpc('cc_capture_payment',{p_gateway:p.order_id,p_payment:p.id,p_amount:p.amount,p_currency:p.currency});
 if(error)throw error;return data as string;
}

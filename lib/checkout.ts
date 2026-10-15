'use client';
import {api} from './client-api';
import type {AuthUser} from '@/types';
type RzResponse={razorpay_order_id:string;razorpay_payment_id:string;razorpay_signature:string};
declare global{interface Window{Razorpay?:new(options:Record<string,unknown>)=>{open:()=>void;on:(event:string,handler:(data:{error?:{description?:string}})=>void)=>void};}}
let scriptPromise:Promise<void>|null=null;
async function loadScript(){
 if(window.Razorpay)return;
 if(!scriptPromise)scriptPromise=new Promise<void>((resolve,reject)=>{
 const script=document.createElement('script');script.src='https://checkout.razorpay.com/v1/checkout.js';script.async=true;
 const timer=setTimeout(()=>{script.remove();reject(new Error('Checkout took too long to load. Try again.'));},20000);
 script.onload=()=>{clearTimeout(timer);if(window.Razorpay)resolve();else reject(new Error('Checkout is unavailable'));};
 script.onerror=()=>{clearTimeout(timer);script.remove();reject(new Error('Checkout is unavailable. Check your connection.'));};document.head.appendChild(script);
 }).catch(e=>{scriptPromise=null;throw e;});return scriptPromise;
}
export async function payOrder(orderId:string,user:AuthUser){
 const rz=await api<{order_id:string;amount:number;currency:string;key_id:string}>('/api/razorpay/create-order',{method:'POST',body:JSON.stringify({order_id:orderId})});
 await loadScript();
 await new Promise<void>((resolve,reject)=>{
 const rzp=new window.Razorpay!({key:rz.key_id,amount:rz.amount,currency:rz.currency,order_id:rz.order_id,name:'Campus Crochet',
 description:'Handmade order',prefill:{name:user.name,email:user.email,contact:user.phone||''},theme:{color:'#315d4c'},
 handler:(response:RzResponse)=>{void api('/api/razorpay/verify',{method:'POST',body:JSON.stringify({...response,order_id:orderId})}).then(()=>resolve()).catch(reject);},
 modal:{ondismiss:()=>reject(new Error('Payment was closed. Your order is saved; you can try again from My orders.'))}});
 rzp.on('payment.failed',data=>reject(new Error(data.error?.description||'Payment failed. Please try again.')));rzp.open();
 });
}

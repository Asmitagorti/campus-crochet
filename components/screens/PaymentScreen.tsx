'use client';
import {useRef,useState} from 'react';import Link from 'next/link';
import type {Navigate,CartItem,AuthUser} from '@/types';import {useProducts,useOrdersForUser} from '@/lib/hooks';import {api} from '@/lib/client-api';import {payOrder} from '@/lib/checkout';import {Notice,PageHeader,money} from '../ui';
export default function Payment({cart,user,onPaymentSaved,onRequireLogin,existingOrderId}:{navigate:Navigate;cart:CartItem[];user:AuthUser|null;onPaymentSaved:()=>void;onRequireLogin?:()=>void;existingOrderId?:string|null}){
 const {products,loading,error:productError}=useProducts(),{orders,error:orderError}=useOrdersForUser(existingOrderId?user?.id:null);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[done,setDone]=useState(false),[agreed,setAgreed]=useState(false);
 const locked=useRef(false);
 const details=cart.map(i=>({...i,product:products.find(p=>p.id===i.productId)})),order=orders.find(o=>o.order_id===existingOrderId);
 const total=existingOrderId?order?.total_price:details.reduce((s,i)=>s+(i.product?.price||0)*i.quantity,0);
 async function pay(){if(!user||locked.current||!agreed)return;locked.current=true;setBusy(true);setError('');try{
 const purchased=cart.map(i=>({...i}));let id=existingOrderId,alreadyPaid=false;
 if(!id){
 const fingerprint=JSON.stringify(cart);const storageKey='cc-checkout/'+user.id;
 let saved:{fingerprint:string;key:string}|null=null;try{saved=JSON.parse(localStorage.getItem(storageKey)||'null');}catch{}
 const key=saved?.fingerprint===fingerprint?saved.key:crypto.randomUUID();localStorage.setItem(storageKey,JSON.stringify({fingerprint,key}));
 const created=await api<{order:{order_id:string;order_status:string;payment_status:string};server_total:number}>('/api/orders',{method:'POST',body:JSON.stringify({items:purchased,checkout_key:key})});
 if(created.order.order_status==='cancelled'){localStorage.removeItem(storageKey);throw new Error('This unpaid checkout expired. Press Pay again to start a fresh checkout.');}id=created.order.order_id;alreadyPaid=created.order.payment_status==='captured';
 }
 if(!alreadyPaid)await payOrder(id,user);setDone(true);onPaymentSaved();if(!existingOrderId)localStorage.removeItem('cc-checkout/'+user.id);
 }catch(e){setError(e instanceof Error?e.message:'Unable to complete payment');}finally{setBusy(false);locked.current=false;}}
 if(!user)return <main className="container form-page"><PageHeader title="Sign in to checkout"/><p>Your order and tracking are saved to your account.</p><button className="btn" onClick={onRequireLogin}>Sign in</button></main>;
 return <main className="container form-page"><PageHeader eyebrow="Secure checkout" title={done?'Your order is in the queue.':'One last look.'}/>
 {done?<section className="form-card"><Notice>Payment received. Follow your handmade piece in My orders.</Notice><Link href="/orders" className="btn">Track my order</Link></section>:<section className="form-card">{(error||productError||orderError)&&<Notice error>{error||productError||orderError}</Notice>}
 {existingOrderId?order?<><p>Order #{order.order_id}</p><p><strong>{money(order.total_price)}</strong></p></>:<Notice>Loading your saved order...</Notice>:loading?<Notice>Loading order details...</Notice>:details.map(i=><div className="summary-line" key={i.productId+i.color}><div>{i.product?.name||'Unavailable item'}<small>{i.color} · Quantity {i.quantity}</small></div><strong>{money((i.product?.price||0)*i.quantity)}</strong></div>)}
 <div className="summary-total"><span>Total</span><strong>{money(total||0)}</strong></div><p className="muted">Campus pickup. The final price is calculated from the current collection when the order is created.</p>
 <label className="checkbox-label"><input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)}/><span>I have read the <Link href="/ordering-policy">ordering & pickup details</Link>.</span></label>
 <button className="btn" disabled={busy||!agreed||!total||loading||(!existingOrderId&&details.some(i=>!i.product))||(!!order&&order.payment_status!=='pending')} onClick={pay}>{busy?'Preparing payment...':`Pay ${money(total||0)}`}</button>
 <p className="muted">You can return to a saved unpaid order from <Link href="/orders">My orders</Link>.</p></section>}</main>;
}

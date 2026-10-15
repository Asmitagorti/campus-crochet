'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {api} from './client-api';import type {CartItem} from '@/types';
type Saved={items:CartItem[];version:number};
function valid(v:unknown):CartItem[]{return Array.isArray(v)?v.filter(i=>i&&typeof i.productId==='string'&&typeof i.color==='string'&&Number.isInteger(i.quantity)&&i.quantity>0&&i.quantity<=20):[];}
function guest():CartItem[]{try{return valid(JSON.parse(localStorage.getItem('cc-guest-cart')||localStorage.getItem('campus_crochet_cart')||'[]'));}catch{return [];}}
export function useCart(userId:string|undefined){
 const [state,setState]=useState<{id:string|undefined;items:CartItem[]}>({id:userId,items:[]}),[issue,setIssue]=useState<{id:string|undefined;message:string}|null>(null),[busy,setBusy]=useState(false);
 const queue=useRef(Promise.resolve()),identity=useRef(userId),generation=useRef(0);
 useEffect(()=>{identity.current=userId;generation.current++;},[userId]);
 const refresh=useCallback(async()=>{
 await Promise.resolve();const revision=generation.current;
 try{const data=userId?(await api<Saved>('/api/cart?user_id='+encodeURIComponent(userId))).items:guest();if(identity.current===userId&&revision===generation.current){setState({id:userId,items:valid(data)});setIssue(null);}}
 catch(e){if(identity.current===userId&&revision===generation.current)setIssue({id:userId,message:e instanceof Error?e.message:'Unable to load your cart'});}},[userId]);
 useEffect(()=>{const initialTimer=setTimeout(()=>void refresh(),0);const visible=()=>{if(document.visibilityState==='visible')void refresh();};const timer=setInterval(visible,20000);window.addEventListener('storage',refresh);window.addEventListener('focus',refresh);window.addEventListener('online',refresh);document.addEventListener('visibilitychange',visible);return()=>{clearTimeout(initialTimer);clearInterval(timer);window.removeEventListener('storage',refresh);window.removeEventListener('focus',refresh);window.removeEventListener('online',refresh);document.removeEventListener('visibilitychange',visible);};},[refresh]);
 const mutate=useCallback((change:(items:CartItem[])=>CartItem[],importGuest=false)=>{
 const id=userId;
 queue.current=queue.current.then(async()=>{
 if(identity.current!==id)return;generation.current++;setBusy(true);setIssue(null);
 try{
  if(!id){const next=change(guest());localStorage.setItem('cc-guest-cart',JSON.stringify(next));localStorage.removeItem('campus_crochet_cart');setState({id,items:next});return;}
  for(let attempt=0;attempt<3;attempt++){
   const saved=await api<Saved>('/api/cart?user_id='+encodeURIComponent(id));if(identity.current!==id)return;const next=change(valid(saved.items));
   try{const updated=await api<Saved>('/api/cart',{method:'PUT',body:JSON.stringify({user_id:id,version:saved.version,items:next})});if(identity.current!==id)return;setState({id,items:updated.items});if(importGuest){localStorage.removeItem('cc-guest-cart');localStorage.removeItem('campus_crochet_cart');}return;}
   catch(e){if(attempt===2||!(e instanceof Error)||!e.message.includes('CONFLICT'))throw e;}
  }
 }catch(e){if(identity.current===id)setIssue({id,message:e instanceof Error?e.message:'Unable to update your cart'});}finally{generation.current++;setBusy(false);}
 }).catch(()=>{});
 },[userId]);
 useEffect(()=>{if(!userId)return;const pending=guest();if(pending.length){mutate(items=>{const next=items.map(i=>({...i}));for(const i of pending){const found=next.find(x=>x.productId===i.productId&&x.color===i.color);if(found)found.quantity=Math.min(20,Math.max(found.quantity,i.quantity));else next.push(i);}return next;},true);}},[userId,mutate]);
 const error=issue&&issue.id===userId?issue.message:'';
 return{cart:state.id===userId?state.items:[],error,busy,refresh,add:(productId:string,color:string,quantity=1)=>mutate(items=>{const exists=items.find(i=>i.productId===productId&&i.color===color);return exists?items.map(i=>i===exists?{...i,quantity:Math.min(20,i.quantity+quantity)}:i):[...items,{productId,color,quantity:Math.max(1,Math.min(20,quantity))}];}),update:(productId:string,color:string,quantity:number)=>mutate(items=>items.flatMap(i=>i.productId===productId&&i.color===color?(quantity>0?[{...i,quantity:Math.min(20,quantity)}]:[]):[i])),remove:(productId:string,color:string)=>mutate(items=>items.filter(i=>i.productId!==productId||i.color!==color)),clear:()=>mutate(()=>[])};
}

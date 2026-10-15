'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {api} from './client-api';
import {supabase} from './supabase';
import type {Product,Order} from '@/types';
export function useResource<T>(url:string|null,initial:T){
 const initialRef=useRef(initial),seq=useRef(0);
 const [state,setState]=useState({url,data:initial,loading:!!url,error:''});
 const load=useCallback(async()=>{const n=++seq.current;if(!url){setState({url,data:initialRef.current,loading:false,error:''});return;}
 try{const data=await api<T>(url);if(n===seq.current)setState({url,data,loading:false,error:''});}
 catch(e){if(n===seq.current)setState(s=>({url,data:s.url===url?s.data:initialRef.current,loading:false,error:e instanceof Error?e.message:'Unable to load information'}));}},[url]);
 useEffect(()=>{void load();const tick=()=>{if(document.visibilityState==='visible')void load();};const timer=setInterval(tick,20000);window.addEventListener('focus',tick);window.addEventListener('online',tick);document.addEventListener('visibilitychange',tick);return()=>{seq.current++;clearInterval(timer);window.removeEventListener('focus',tick);window.removeEventListener('online',tick);document.removeEventListener('visibilitychange',tick);};},[load]);
 return{data:state.url===url?state.data:initialRef.current,loading:state.url===url?state.loading:!!url,error:state.url===url?state.error:'',refetch:load};
}
export function useProducts(){const r=useResource<Product[]>('/api/products',[]);return{products:r.data,loading:r.loading,error:r.error,refetch:r.refetch};}
export function useOrdersForUser(id:string|null|undefined){const {data,loading,error,refetch}=useResource<Order[]>(id?'/api/orders?user_id='+encodeURIComponent(id):null,[]);
 useEffect(()=>{if(!id)return;const channel=supabase.channel('orders-'+id).on('postgres_changes',{event:'*',schema:'public',table:'orders',filter:'user_id=eq.'+id},()=>void refetch()).subscribe();return()=>{void supabase.removeChannel(channel);};},[id,refetch]);
 return{orders:data,loading,error,refetch};}

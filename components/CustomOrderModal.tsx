'use client';
import {useEffect,useRef,useState} from 'react';
import type {AuthUser,CustomRequest} from '@/types';
import {api} from '@/lib/client-api';
import {Notice} from './ui';
export default function CustomOrderModal({user,onClose,onRequireLogin,embedded=false}:{user:AuthUser|null;onClose:()=>void;onRequireLogin:()=>void;embedded?:boolean}){
 const [form,setForm]=useState({name:user?.name||'',item_name:'',description:'',colors:'',occasion:'',budget:'',reference_image:''}),[busy,setBusy]=useState(false),[error,setError]=useState(''),[sent,setSent]=useState<CustomRequest|null>(null);
 const key=useRef<string>(''),dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const current=dialog.current;if(!embedded)current?.showModal();return()=>current?.close();},[embedded]);
 const field=(k:keyof typeof form,v:string)=>setForm(f=>({...f,[k]:v}));
 async function submit(e:React.FormEvent){e.preventDefault();if(!user){onRequireLogin();return;}setBusy(true);setError('');key.current||=crypto.randomUUID();try{
 const saved=await api<CustomRequest>('/api/custom-requests',{method:'POST',body:JSON.stringify({...form,name:form.name||user.name,budget:form.budget?Number(form.budget):undefined,submission_key:key.current})});setSent(saved);
 }catch(e){setError(e instanceof Error?e.message:'Unable to submit request');}finally{setBusy(false);}}
 const content=<><div className="modal-top"><span className="eyebrow">Something made for you</span>{!embedded&&<button className="link-button" onClick={onClose}>Close</button>}</div>
 {sent?<><h1>Request received</h1><Notice>Your request has been submitted. View its status in My Requests.</Notice><p className="muted">Reference: {sent.id}</p><button className="btn" onClick={onClose}>View my requests</button></>:<><h1>Your idea, in yarn.</h1><p className="muted">Describe the piece you have in mind. Save your request and follow its progress from your account.</p>
 <form className="form-stack" onSubmit={submit}>{error&&<Notice error>{error}</Notice>}<div className="form-grid"><label>Your name<input required maxLength={150} autoComplete="name" value={form.name||user?.name||''} onChange={e=>field('name',e.target.value)}/></label><label>What would you like made?<input required maxLength={200} placeholder="A flower keychain, a small tote..." value={form.item_name} onChange={e=>field('item_name',e.target.value)}/></label></div>
 <label>Tell us about the design<textarea required rows={5} maxLength={4000} placeholder="Shape, size, details, and anything that matters to you." value={form.description} onChange={e=>field('description',e.target.value)}/></label>
 <fieldset className="form-group"><legend>Colours, budget & references <small>Optional details for your piece.</small></legend><div className="form-grid"><label>Preferred colours<input maxLength={300} placeholder="Sage green and cream" value={form.colors} onChange={e=>field('colors',e.target.value)}/></label><label>Budget (INR)<input min={0} step="0.01" type="number" placeholder="Your preferred budget" value={form.budget} onChange={e=>field('budget',e.target.value)}/></label><label>Occasion<input maxLength={150} placeholder="A birthday, an everyday gift..." value={form.occasion} onChange={e=>field('occasion',e.target.value)}/></label><label>Reference image link<input type="url" placeholder="https://..." value={form.reference_image} onChange={e=>field('reference_image',e.target.value)}/></label></div></fieldset>
 <div className="form-foot"><p className="muted">{user?`Saved to your account: ${user.email}`:'Sign in to save and track your request.'}</p><button className="btn" disabled={busy}>{busy?'Saving request...':user?'Submit request':'Sign in to submit'}</button></div></form></>}
 </>;
 return embedded?<section className="form-card">{content}</section>:<dialog ref={dialog} onCancel={onClose} className="modal modal-wide">{content}</dialog>;
}

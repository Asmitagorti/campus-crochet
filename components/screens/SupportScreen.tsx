'use client';
import {useRef,useState} from 'react';
import type {AuthUser} from '@/types';
import {api} from '@/lib/client-api';
import {Notice,PageHeader} from '../ui';
export default function Support({user,onRequireLogin}:{user:AuthUser|null;onRequireLogin:()=>void}){
 const [subject,setSubject]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[ticket,setTicket]=useState('');const key=useRef('');
 async function submit(e:React.FormEvent){e.preventDefault();if(!user){onRequireLogin();return;}setBusy(true);setError('');key.current||=crypto.randomUUID();try{const id=await api<string>('/api/support',{method:'POST',body:JSON.stringify({subject,message,submission_key:key.current})});setTicket(id);}catch(e){setError(e instanceof Error?e.message:'Unable to send your question');}finally{setBusy(false);}}
 return <main className="container form-page"><PageHeader eyebrow="Here to help" title="Questions about your piece?">Write to <a href="mailto:support@campus-crochet.tech">support@campus-crochet.tech</a> or save a support question below.</PageHeader><section className="form-card">{ticket?<Notice>Your question has been saved and queued for our support inbox. Reference: {ticket}</Notice>:<form className="form-stack" onSubmit={submit}>{error&&<Notice error>{error}</Notice>}<label>Subject<input required maxLength={200} value={subject} onChange={e=>setSubject(e.target.value)}/></label><label>Your question<textarea required maxLength={4000} rows={6} value={message} onChange={e=>setMessage(e.target.value)}/></label><p className="muted">Include your order number if your question is about a purchase.</p><button className="btn" disabled={busy}>{busy?'Saving...':user?'Send question':'Sign in to send'}</button></form>}</section></main>;
}

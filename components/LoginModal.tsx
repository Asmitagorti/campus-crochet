'use client';
import {useEffect,useId,useRef,useState} from 'react';
import type {AuthUser} from '@/types';
import {supabase} from '@/lib/supabase';
import {api,syncSession} from '@/lib/client-api';
import {Notice} from './ui';
export default function LoginModal({onLogin,onDismiss}:{mode:'modal'|'toast';onLogin:(user:AuthUser)=>void;onDismiss:()=>void}){
 const [step,setStep]=useState<'email'|'code'|'profile'>('email'),[email,setEmail]=useState(''),[code,setCode]=useState(''),[type,setType]=useState<'magiclink'|'signup'|'email'>('magiclink'),[busy,setBusy]=useState(false),[error,setError]=useState(''),[name,setName]=useState(''),[phone,setPhone]=useState(''),[college,setCollege]=useState(''),[department,setDepartment]=useState(''),[year,setYear]=useState('');
 const dialog=useRef<HTMLDialogElement>(null);
 const emailInput=useRef<HTMLInputElement>(null);
 const titleId=useId();
 useEffect(()=>{const current=dialog.current,previousOverflow=document.body.style.overflow;current?.showModal();emailInput.current?.focus();document.body.style.overflow='hidden';return()=>{current?.close();document.body.style.overflow=previousOverflow;};},[]);
 async function finish(){await syncSession();const {user}=await api<{user:AuthUser|null}>('/api/session');if(!user)throw new Error('Please verify your email again');onLogin(user);}
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');try{
 if(step==='email'){const r=await fetch('/api/auth/send-otp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})});const b=await r.json();if(!r.ok)throw new Error(b.error);setType(b.verificationType==='signup'?'signup':b.verificationType==='email'?'email':'magiclink');setStep('code');}
 else if(step==='code'){
 const {data,error}=await supabase.auth.verifyOtp({email:email.trim().toLowerCase(),token:code,type});if(error)throw error;if(!data.user)throw new Error('Verification failed');
 await syncSession();const {user}=await api<{user:AuthUser|null}>('/api/session');
 if(user?.role==='admin'||data.user.user_metadata?.name){await finish();}else{setStep('profile');}
 }else{
 const {error}=await supabase.auth.updateUser({data:{name:name.trim(),phone:phone.trim(),college,department,year}});if(error)throw error;await finish();
 }
 }catch(e){setError(e instanceof Error?e.message:'Unable to sign in');}finally{setBusy(false);}}
 return <dialog ref={dialog} className="modal" aria-labelledby={titleId} onCancel={onDismiss}><div className="modal-top"><span className="eyebrow">Campus Crochet</span><button className="link-button" onClick={onDismiss} aria-label="Close sign-in">Close</button></div><h2 id={titleId}>{step==='email'?'Welcome back':step==='code'?'Check your inbox':'A little about you'}</h2><p className="muted">{step==='email'?'Sign in with your college email. Administrators use their approved email address.':step==='code'?`Enter the code sent to ${email}.`:'These details help us arrange your campus pickup.'}</p>
 <form onSubmit={submit} className="form-stack">{error&&<Notice error>{error}</Notice>}
 {step==='email'&&<label>Email address<input ref={emailInput} autoFocus required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>}
 {step==='code'&&<><label>Sign-in code<input autoFocus required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,10}" maxLength={10} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))}/></label><button type="button" className="link-button" onClick={()=>{setStep('email');setCode('');}}>Change email or request another code</button></>}
 {step==='profile'&&<><label>Full name<input required autoComplete="name" value={name} onChange={e=>setName(e.target.value)} maxLength={150}/></label><label>Phone number<input type="tel" required pattern="[0-9+ ()-]{10,16}" autoComplete="tel" value={phone} onChange={e=>setPhone(e.target.value)}/></label><label>College<select required value={college} onChange={e=>setCollege(e.target.value)}><option value="">Select your college</option><option>Aditya Engineering College</option><option>Aditya College of Engineering and Technology</option><option>Aditya University</option><option>Aditya College of Engineering</option></select></label><div className="form-grid"><label>Department<input value={department} onChange={e=>setDepartment(e.target.value)}/></label><label>Year<select value={year} onChange={e=>setYear(e.target.value)}><option value="">Select</option>{[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}</select></label></div></>}
 <button className="btn" disabled={busy}>{busy?'Please wait...':step==='email'?'Send sign-in code':step==='code'?'Verify & sign in':'Save & continue'}</button></form></dialog>;
}

import type {ReactNode} from 'react';
import type {OrderLifecycleStatus} from '@/types';
export function Notice({children,error=false}:{children:ReactNode;error?:boolean}){return <div className={error?'notice error':'notice'} role={error?'alert':'status'}>{children}</div>;}
export function Empty({title,children}:{title:string;children:ReactNode}){return <div className="empty"><h2>{title}</h2><p>{children}</p></div>;}
export function PageHeader({eyebrow,title,children,action}:{eyebrow?:string;title:string;children?:ReactNode;action?:ReactNode}){return <div className="page-heading"><div>{eyebrow&&<p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{children&&<p className="muted">{children}</p>}</div>{action}</div>;}
export const stages:OrderLifecycleStatus[]=['pending','payment_received','yarn_selected','crocheting','quality_check','ready','completed','collected'];
export const labels:Record<string,string>={pending:'Awaiting payment',payment_received:'Payment received',yarn_selected:'Yarn selected',crocheting:'Being crocheted',quality_check:'Quality check',ready:'Ready for pickup',completed:'Production complete',collected:'Collected',cancelled:'Cancelled',accepted:'Quote available',counter_offered:'Updated quote',student_accepted:'Quote accepted',paid:'Payment received',in_production:'In production',rejected:'Request declined'};
export function Status({value}:{value:string}){return <span className={'status status-'+value}>{labels[value]||value.replaceAll('_',' ')}</span>;}
export const money=(v:number)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(v);
export const date=(v?:string)=>v?new Date(v).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}):'Not recorded';

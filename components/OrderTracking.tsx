import type {Order} from '@/types';import {Status,date,stages,labels} from './ui';
export default function OrderTracking({order}:{order:Order}){
 const idx=stages.indexOf(order.order_status);
 return <><ol className="tracking-stages" aria-label="Production stages">{stages.filter(s=>!['pending','collected'].includes(s)).map(s=><li key={s} aria-current={s===order.order_status?'step':undefined} className={stages.indexOf(s)<=idx?'stage reached':'stage'}><span className="stitch-dot" aria-hidden="true"/><span>{labels[s]}</span></li>)}</ol>
 {order.pickup_location&&<div className="pickup-box"><h3>Campus pickup</h3><p>{order.pickup_location}</p>{order.pickup_instructions&&<p>{order.pickup_instructions}</p>}</div>}
 <details className="tracking-history"><summary>Tracking history</summary>{order.order_events?.length?<ol>{[...order.order_events].reverse().map(e=><li key={e.id}><div><Status value={e.status}/><time>{date(e.created_at)}</time></div>{e.note&&<p>{e.note}</p>}</li>)}</ol>:<p>No tracking updates have been recorded yet.</p>}</details></>;
}

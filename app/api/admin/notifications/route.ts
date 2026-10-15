import {requireAdmin} from '@/lib/auth';
import {getServiceRoleClient} from '@/lib/server-db';
import {failure,allRows,readBody,text,UUID,ApiError} from '@/lib/api';
import {deliverNotifications} from '@/lib/notifications';
export async function GET(){try{await requireAdmin();return Response.json(await allRows((s,e)=>getServiceRoleClient().from('notification_jobs').select('id,event_key,kind,recipient,status,attempts,last_error,sent_at,created_at').order('created_at',{ascending:false}).order('id').range(s,e)));}catch(e){return failure(e);}}
export async function POST(request:Request){try{await requireAdmin();const b=await readBody(request);if(!UUID.test(text(b.id)))throw new ApiError('Select a notification');
 const {error}=await getServiceRoleClient().from('notification_jobs').update({status:'pending',attempts:0,next_attempt_at:new Date().toISOString()}).eq('id',b.id).eq('status','failed');if(error)throw error;
 await deliverNotifications();return Response.json({ok:true});}catch(e){return failure(e);}}

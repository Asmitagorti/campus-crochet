import {requireSession} from '@/lib/auth';
import {getServiceRoleClient} from '@/lib/server-db';
import {failure,readBody,text,ApiError,ensureProfile,UUID} from '@/lib/api';
import {deliverNotifications} from '@/lib/notifications';
export async function POST(request:Request) {
 try {const u=await requireSession(),b=await readBody(request);
 const subject=text(b.subject,200),message=text(b.message,4000);
 if(!subject||!message||!UUID.test(text(b.submission_key)))throw new ApiError('Subject and message are required');
 await ensureProfile(u);
 const {data,error}=await getServiceRoleClient().rpc('cc_submit_support',{p_user:u.id,p_key:b.submission_key,p_name:u.name,p_email:u.email,p_subject:subject,p_message:message});
 if(error)throw error;await deliverNotifications().catch(()=>{});return Response.json(data);
 }catch(e){return failure(e);}
}

import {getServiceRoleClient} from '@/lib/server-db';
import {requireSession,isAdmin} from '@/lib/auth';
import {allRows,failure,readBody,text,ApiError,UUID,ensureProfile} from '@/lib/api';
import {deliverNotifications} from '@/lib/notifications';
export async function GET() {
 try { const user=await requireSession(),db=getServiceRoleClient();
  const rows=await allRows((s,e)=>{let q=db.from('custom_requests').select('*').order('created_at',{ascending:false}).order('id').range(s,e);if(!isAdmin(user))q=q.eq('user_id',user.id);return q;});
  return Response.json(rows);
 }catch(e){return failure(e);}
}
export async function POST(request:Request) {
 try {
  const user=await requireSession(),b=await readBody(request);
  const name=text(b.name,150),item=text(b.item_name,200),description=text(b.description,4000);
  if(!name||!item||!description)throw new ApiError('Name, item and design description are required');
  if(b.budget!==undefined && (typeof b.budget!=='number'||!Number.isFinite(b.budget)||b.budget<0))throw new ApiError('Enter a valid budget');
  if(!UUID.test(text(b.submission_key)))throw new ApiError('Submission reference is required');
  const image=text(b.reference_image,1000);
  if(image && !/^https:\/\//.test(image))throw new ApiError('Reference image must use an HTTPS URL');
  await ensureProfile(user);
  const {data,error}=await getServiceRoleClient().rpc('cc_submit_request',{p_user:user.id,p_key:b.submission_key,p_fields:{name,email:user.email,item_name:item,description,colors:text(b.colors,300),occasion:text(b.occasion,150),budget:b.budget??null,reference_image:image}});
  if(error)throw error;
  await deliverNotifications().catch(()=>{});
  return Response.json(data);
 }catch(e){return failure(e);}
}
export async function PATCH(request:Request) {
 try {
  const u=await requireSession(),b=await readBody(request),db=getServiceRoleClient();
  if(!UUID.test(text(b.request_id))||!Number.isInteger(b.version))throw new ApiError('Request and version are required');
  const {data:current,error:findError}=await db.from('custom_requests').select('*').eq('id',b.request_id).single();
  if(findError)throw findError;
  if(!isAdmin(u)&&current.user_id!==u.id)throw new ApiError('Access denied',403);
  const status=text(b.status),update:Record<string,unknown>={status,version:current.version+1,updated_at:new Date().toISOString()};
  const transitions:Record<string,string[]>={pending:['accepted','counter_offered','rejected'],counter_offered:['accepted','counter_offered','rejected'],accepted:['counter_offered','rejected']};
  if(isAdmin(u)) {
   if(!transitions[current.status]?.includes(status))throw new ApiError('Use the linked order to update production tracking');
   if(status!=='rejected'&&(typeof b.admin_price!=='number'||!Number.isFinite(b.admin_price)||b.admin_price<=0))throw new ApiError('Enter a positive quoted price');
   update.admin_price=status==='rejected'?current.admin_price:b.admin_price;update.admin_notes=text(b.admin_notes,2000);
  } else {
   if(status!=='student_accepted'||!['accepted','counter_offered'].includes(current.status))throw new ApiError('This request is not awaiting acceptance');
   update.student_response='accepted';
  }
  const {data,error}=await db.from('custom_requests').update(update).eq('id',b.request_id).eq('version',b.version).select().maybeSingle();
  if(error)throw error;if(!data)throw new ApiError('This request changed. Refresh before saving.',409);
  return Response.json(data);
 }catch(e){return failure(e);}
}

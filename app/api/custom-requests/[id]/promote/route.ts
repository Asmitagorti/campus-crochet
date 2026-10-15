import {requireSession} from '@/lib/auth';
import {getServiceRoleClient} from '@/lib/server-db';
import {failure,customerSnapshot,ensureProfile,UUID,ApiError} from '@/lib/api';
export async function POST(_request:Request,{params}:{params:Promise<{id:string}>}) {
 try {const u=await requireSession(),{id}=await params;if(!UUID.test(id))throw new ApiError('Invalid request');
 await ensureProfile(u);const db=getServiceRoleClient();
 const {data:orderId,error}=await db.rpc('cc_custom_order',{p_id:id,p_user:u.id,p_customer:customerSnapshot(u)});
 if(error)throw error;return Response.json({order_id:orderId});
 }catch(e){return failure(e);}
}

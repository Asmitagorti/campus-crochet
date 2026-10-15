import {timingSafeEqual} from 'node:crypto';
import {deliverNotifications} from '@/lib/notifications';
import {failure} from '@/lib/api';
import {getServiceRoleClient} from '@/lib/server-db';
export async function GET(request:Request){const secret=process.env.CRON_SECRET,a=Buffer.from(request.headers.get('authorization')||''),b=Buffer.from(`Bearer ${secret||''}`);
 if(!secret||a.length!==b.length||!timingSafeEqual(a,b))return Response.json({error:'Unauthorized'},{status:401});
 try{const {error}=await getServiceRoleClient().rpc('cc_cancel_expired');if(error)throw error;await deliverNotifications();return Response.json({ok:true});}catch(e){return failure(e);}}

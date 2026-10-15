import {requireSession} from '@/lib/auth';
import {getServiceRoleClient} from '@/lib/server-db';
import {failure,readBody,ApiError,ensureProfile,UUID} from '@/lib/api';
export async function GET(request:Request) {
 try {const u=await requireSession(),expected=new URL(request.url).searchParams.get('user_id');
 if(expected&&expected!==u.id)throw new ApiError('Your account changed. Reload your cart before trying again.',409);
 const {data,error}=await getServiceRoleClient().from('carts').select('*').eq('user_id',u.id).maybeSingle();if(error)throw error;return Response.json(data||{user_id:u.id,items:[],version:0});}catch(e){return failure(e);}
}
export async function PUT(request:Request) {
 try {const u=await requireSession(),b=await readBody(request);
 if(b.user_id!==u.id)throw new ApiError('Your account changed. Reload your cart before trying again.',409);
 if(!Number.isInteger(b.version)||!Array.isArray(b.items)||b.items.length>50||b.items.some(i=>!i||!UUID.test(i.productId)||typeof i.color!=='string'||i.color.length>80||!Number.isInteger(i.quantity)||i.quantity<1||i.quantity>20))throw new ApiError('Invalid cart');
 if(new Set(b.items.map(i=>i.productId+'/'+i.color)).size!==b.items.length)throw new ApiError('Duplicate cart items');
 await ensureProfile(u);
 const {data,error}=await getServiceRoleClient().rpc('cc_save_cart',{p_user:u.id,p_version:b.version,p_items:b.items});if(error)throw error;return Response.json(data);
 }catch(e){return failure(e);}
}

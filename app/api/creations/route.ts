import {requireAdmin} from '@/lib/auth';import {getServiceRoleClient} from '@/lib/server-db';import {allRows,failure,readBody,text,UUID,ApiError} from '@/lib/api';
export async function GET(){try{await requireAdmin();const db=getServiceRoleClient();
 const items=await allRows((s,e)=>db.from('order_items').select('*,order:orders!inner(order_id,order_status,completed_at),product:products(name)').in('order.order_status',['completed','collected']).order('order_item_id').range(s,e));
 const stored=await allRows((s,e)=>db.from('creations').select('*').order('id').range(s,e));
 const rows=await Promise.all(items.map(async i=>{const c=stored.find(c=>c.order_item_id===i.order_item_id);let url=c?.image_url;
 if(url&&!url.startsWith('https://')){const {data,error}=await db.storage.from('creation-photos').createSignedUrl(url,3600);if(error)throw error;url=data.signedUrl;}
 return{id:c?.id||i.order_item_id,order_item_id:i.order_item_id,image_url:url||'',caption:c?.caption||'',is_public:c?.is_public||false,product_name:i.product.name,selected_color:i.selected_color,order_id:i.order.order_id,completed_at:i.order.completed_at};}));
 return Response.json(rows);
 }catch(e){return failure(e);}}
export async function PATCH(request:Request){try{await requireAdmin();const b=await readBody(request),id=text(b.order_item_id);if(!UUID.test(id))throw new ApiError('Invalid item');
 const db=getServiceRoleClient();const {data:item,error:findError}=await db.from('order_items').select('order:orders!inner(order_status)').eq('order_item_id',id).single();if(findError)throw findError;
 const order=(Array.isArray(item.order)?item.order[0]:item.order);if(!order||!['completed','collected'].includes(order.order_status))throw new ApiError('Only completed pieces can be archived');
 const {data:c}=await db.from('creations').select('image_url').eq('order_item_id',id).maybeSingle();
 if(b.is_public===true&&!c?.image_url)throw new ApiError('Add a final photograph before publishing');
 const {error}=await db.from('creations').upsert({order_item_id:id,caption:text(b.caption,1000),is_public:b.is_public===true,updated_at:new Date().toISOString()},{onConflict:'order_item_id'});if(error)throw error;return Response.json({ok:true});
 }catch(e){return failure(e);}}
export async function POST(request:Request){try{await requireAdmin();const form=await request.formData(),file=form.get('file'),id=String(form.get('order_item_id')||'');
 if(!(file instanceof File)||!UUID.test(id)||file.size>5*1024*1024||!['image/jpeg','image/png','image/webp'].includes(file.type))throw new ApiError('Choose a JPG, PNG or WebP photograph under 5 MB');
 const bytes=Buffer.from(await file.arrayBuffer());const valid=file.type==='image/jpeg'?bytes[0]===255&&bytes[1]===216:file.type==='image/png'?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';if(!valid)throw new ApiError('Invalid image file');
 const db=getServiceRoleClient();const {data:item,error:findError}=await db.from('order_items').select('order:orders!inner(order_status)').eq('order_item_id',id).single();if(findError)throw findError;const o=Array.isArray(item.order)?item.order[0]:item.order;if(!['completed','collected'].includes(o.order_status))throw new ApiError('Only completed pieces can be archived');
 const path=id+'/'+crypto.randomUUID()+'.'+(file.type==='image/jpeg'?'jpg':file.type.split('/')[1]);const {error:uploadError}=await db.storage.from('creation-photos').upload(path,bytes,{contentType:file.type});if(uploadError)throw uploadError;
 const {error}=await db.from('creations').upsert({order_item_id:id,image_url:path,updated_at:new Date().toISOString()},{onConflict:'order_item_id'});if(error){await db.storage.from('creation-photos').remove([path]);throw error;}return Response.json({ok:true});
 }catch(e){return failure(e);}}

import {getServiceRoleClient} from '@/lib/server-db';
import {allRows,failure} from '@/lib/api';

export async function GET(){
 try{
  const db=getServiceRoleClient();
  const rows=await allRows((s,e)=>db.from('creations').select('id,caption,image_url,updated_at,item:order_items!inner(product:products(name),order:orders!inner(order_status))').eq('is_public',true).not('image_url','is',null).in('item.order.order_status',['completed','collected']).order('updated_at',{ascending:false}).order('id').range(s,e));
  const gallery=await Promise.all(rows.map(async row=>{
   let url=row.image_url;
   if(!url.startsWith('https://')){const {data,error}=await db.storage.from('creation-photos').createSignedUrl(url,3600);if(error)throw error;url=data.signedUrl;}
   const item=Array.isArray(row.item)?row.item[0]:row.item;
   const product=Array.isArray(item.product)?item.product[0]:item.product;
   return{id:row.id,caption:row.caption,image_url:url,product_name:product.name};
  }));
  return Response.json(gallery,{headers:{'Cache-Control':'no-store'}});
 }catch(e){return failure(e);}
}

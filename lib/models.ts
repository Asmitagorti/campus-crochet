import type { Product, Order } from '@/types';
export interface DbProduct { product_id:string;name:string;price:number|string;category:string;full_description?:string;short_description?:string;stock_quantity?:number;processing_time_days?:number;is_available?:boolean;updated_at?:string;product_images?:{image_id:string;image_url:string;display_order:number;alt_text?:string}[];product_colors?:{color_id:string;color_name:string}[]; }
export function toProduct(p:DbProduct): Product {
 return { id:p.product_id,name:p.name,price:Number(p.price),category:p.category,description:p.full_description||p.short_description||'',
 colors:(p.product_colors||[]).map(c=>c.color_name),image:[...(p.product_images||[])].sort((a,b)=>a.display_order-b.display_order)[0]?.image_url||'',
 images:[...(p.product_images||[])].sort((a,b)=>a.display_order-b.display_order).map(i=>({url:i.image_url,alt:i.alt_text||p.name})),stock:p.stock_quantity,processing_time_days:p.processing_time_days,processing_time:p.processing_time_days ? `${p.processing_time_days} working days`:undefined,is_available:p.is_available,updated_at:p.updated_at };
}
export const PRODUCT_SELECT='*,product_images(*),product_colors(*)';
export function toOrder(row: Record<string,unknown>): Order {
 const user = (Array.isArray(row.customer) ? row.customer[0] : row.customer) as Record<string,string>|undefined;
 const snapshot = row.customer_snapshot as Record<string,string>|undefined;
 return { ...row, id:String(row.order_id),order_id:String(row.order_id),user_id:String(row.user_id),payment_status:row.payment_status as Order['payment_status'],order_status:row.order_status as Order['order_status'],total_price:Number(row.total_price), version:Number(row.version||0),
 customer_snapshot: { name:user?.full_name||'',email:user?.email||'',phone:user?.phone_number||'',department:user?.branch||'',year:user?.year==null?'':String(user.year),...snapshot },
 order_items: ((row.order_items||[]) as Record<string,unknown>[]).map(i=>({ ...i, id:String(i.order_item_id),order_id:String(i.order_id),product_id:String(i.product_id),selected_color:String(i.selected_color||''),quantity:Number(i.quantity),price_at_purchase:Number(i.price_at_purchase),products:i.product?toProduct((Array.isArray(i.product)?i.product[0]:i.product) as DbProduct):undefined }))
 } as Order;
}

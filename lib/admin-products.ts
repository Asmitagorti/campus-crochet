import 'server-only';
import {getServiceRoleClient} from './server-db';
import {ApiError,text,UUID} from './api';
export async function saveProduct(body:Record<string,unknown>,id?:string){
 if(id&&!UUID.test(id))throw new ApiError('Invalid product');
 const name=text(body.name,200),category=text(body.category,80),price=body.price,stock=body.stock_quantity,days=body.processing_time_days;
 if(!name||!category||typeof price!=='number'||!Number.isFinite(price)||price<=0)throw new ApiError('Name, collection and positive price are required');
 if(stock!==null&&(!Number.isInteger(stock)||Number(stock)<0))throw new ApiError('Stock must be a non-negative whole number or blank');
 if(!Number.isInteger(days)||Number(days)<0)throw new ApiError('Processing time must be a non-negative whole number');
 const images=Array.isArray(body.images)?body.images.filter((v):v is string=>typeof v==='string'&&!!v.trim()).slice(0,12):[];
 if(images.some(v=>!/^https:\/\//.test(v)))throw new ApiError('Image links must use HTTPS');
 const colors=Array.isArray(body.colors)?Array.from(new Set(body.colors.filter((v):v is string=>typeof v==='string'&&!!v.trim()).map(v=>v.trim().slice(0,80)))).slice(0,24):[];
 const {data,error}=await getServiceRoleClient().rpc('cc_save_product',{p_id:id||null,p_fields:{name,category,price,stock_quantity:stock,processing_time_days:days,full_description:text(body.full_description,4000),is_available:body.is_available===true},p_colors:colors,p_images:images});if(error)throw error;return data;
}

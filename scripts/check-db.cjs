/* eslint-disable @typescript-eslint/no-require-imports */
const {loadEnvConfig}=require('@next/env');
const {readFileSync}=require('node:fs');
loadEnvConfig(process.cwd(),false,{info(){},error(){}});

// Read schema metadata only: no customer records, writes or RPC execution.
(async()=>{
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw new Error('Supabase URL and service-role key are required in your ignored environment file.');
 const response=await fetch(`${url}/rest/v1/`,{headers:{apikey:key,Authorization:`Bearer ${key}`,Accept:'application/openapi+json'},signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw new Error(`Database schema inspection failed (${response.status}). Check project availability and server credentials.`);
 const schema=await response.json(),definitions=schema.definitions||{},paths=schema.paths||{};
 const tables={
  users:['user_id','email','full_name','year'],
  products:['product_id','price','stock_quantity','is_available'],
  product_images:['product_id','image_url','display_order'],
  product_colors:['product_id','color_name'],
  orders:['order_id','customer_snapshot','pickup_location','pickup_instructions','tracking_note','updated_at','version','checkout_key','custom_request_id','stock_reserved','gateway_claim','gateway_claimed_at'],
  order_items:['order_item_id','order_id','product_id','quantity','price_at_purchase'],
  custom_requests:['id','user_id','submission_key','version','status'],
  order_events:['id','order_id','status'],
  support_tickets:['id','user_id','submission_key'],
  notification_jobs:['id','event_key','status','attempts','next_attempt_at'],
  carts:['user_id','items','version'],
  creations:['id','order_item_id','image_url','is_public'],
  request_limits:['key','attempts','reset_at']
 };
 const missing=[];
 for(const [table,columns] of Object.entries(tables)){
  if(!definitions[table]){missing.push(`Table: ${table}`);continue;}
  for(const column of columns)if(!definitions[table].properties?.[column])missing.push(`Column: ${table}.${column}`);
 }
 const sql=readFileSync('supabase/migrations/202610040001_store_operations.sql','utf8');
 for(const match of sql.matchAll(/create or replace function public\.(cc_\w+)\(/g))if(!paths[`/rpc/${match[1]}`])missing.push(`Function: ${match[1]}`);
 if(missing.length){
  console.log('Database upgrade required:');for(const item of missing)console.log(`- ${item}`);
  console.log('Apply supabase/migrations/202610040001_store_operations.sql in SQL Editor, or set SUPABASE_ACCESS_TOKEN locally and run npm run db:migrate.');
  process.exitCode=1;
 }else console.log('Required database tables, columns and functions are available. Authenticated workflow tests are still required.');
 console.log('Payment credentials:',process.env.RAZORPAY_KEY_ID&&process.env.RAZORPAY_KEY_SECRET&&process.env.RAZORPAY_WEBHOOK_SECRET?'configured':'missing');
 console.log('Notification retry secret:',process.env.CRON_SECRET?'configured':'missing');
})().catch(error=>{console.error(error.message);process.exitCode=1;});

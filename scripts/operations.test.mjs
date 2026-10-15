import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';

test('PostgreSQL commerce migration and transactions', async t => {
 const db=new PGlite();
 try {
  await db.exec(`
   create role anon; create role authenticated; create role service_role bypassrls;
   create schema auth; create schema storage;
   create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
   grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;
   create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
   create table users(user_id uuid primary key default gen_random_uuid(),email text,full_name text,phone_number text,branch text,year smallint,role text default 'customer');
   create table products(product_id uuid primary key default gen_random_uuid(),name text,category text,price numeric,stock_quantity bigint,processing_time_days bigint,full_description text,short_description text,is_available boolean,updated_at timestamptz default now());
   create table orders(order_id uuid primary key default gen_random_uuid(),user_id uuid references users(user_id),total_price numeric,payment_status text,order_status text,payment_method text,razorpay_order_id text,razorpay_payment_id text,ordered_at timestamptz default now(),completed_at timestamp);
   create table order_items(order_item_id uuid primary key default gen_random_uuid(),order_id uuid references orders(order_id),product_id uuid references products(product_id),selected_color text,quantity bigint,price_at_purchase numeric,processing_time_days bigint,item_status text);
   create table product_colors(color_id uuid primary key default gen_random_uuid(),product_id uuid references products(product_id),color_name text);
   create table product_images(image_id uuid primary key default gen_random_uuid(),product_id uuid references products(product_id),image_url text,display_order bigint);
  `);
  await db.exec(await readFile('supabase/migrations/202610040001_store_operations.sql','utf8'));
  const u=randomUUID(),other=randomUUID(),p=randomUUID(),key=randomUUID();
  await db.query('insert into users(user_id,email,full_name) values($1,$2,$3),($4,$5,$6)',[u,'student@acet.ac.in','Student',other,'other@acet.ac.in','Other']);
  await db.query('insert into products(product_id,name,category,price,stock_quantity,processing_time_days,is_available) values($1,$2,$3,100,10,3,true)',[p,'Test piece','Test']);
  await db.query('insert into product_colors(product_id,color_name) values($1,$2)',[p,'Sage']);
  const items=JSON.stringify([{productId:p,color:'Sage',quantity:2}]);
  const snapshot=JSON.stringify({name:'Student',email:'student@acet.ac.in'});
  const create=async(k=key,it=items)=>(await db.query('select cc_create_order($1,$2,$3,$4) id',[u,it,k,snapshot])).rows[0].id;
  let oid;
  await t.test('checkout retries do not duplicate orders or reserve stock twice',async()=>{
   oid=await create();assert.equal(await create(),oid);
   assert.equal((await db.query('select stock_quantity from products where product_id=$1',[p])).rows[0].stock_quantity,8);
   assert.equal((await db.query('select total_price from orders where order_id=$1',[oid])).rows[0].total_price,'200');
  });
  await t.test('fractional and aggregated excessive quantities are rejected',async()=>{
   await assert.rejects(create(randomUUID(),JSON.stringify([{productId:p,color:'Sage',quantity:1.5}])),/Quantity/);
   await assert.rejects(create(randomUUID(),JSON.stringify([{productId:p,color:'Sage',quantity:6},{productId:p,color:'Sage',quantity:6}])),/Insufficient stock/);
  });
  await t.test('gateway preparation is serialized and payment amounts are verified',async()=>{
   const claim=randomUUID();await db.query('select cc_claim_gateway($1,$2)',[oid,claim]);
   await assert.rejects(db.query('select cc_claim_gateway($1,$2)',[oid,randomUUID()]),/being prepared/);
   await db.query('select cc_attach_gateway($1,$2,$3)',[oid,claim,'order_test']);
   await assert.rejects(db.query('select cc_capture_payment($1,$2,1,$3)',['order_test','pay_test','INR']),/amount/);
   await db.query('select cc_capture_payment($1,$2,20000,$3)',['order_test','pay_test','INR']);
  });
  const update=async(status,version=1,location='Library reception')=>db.query('select cc_update_order($1,$2,$3,$4,$5,$6,$7)',[oid,version,status,'Tracking note',location,'Collect between 2 and 4 pm',u]);
  await t.test('tracking conflicts and missing pickup locations are rejected',async()=>{
   await assert.rejects(update('completed',0),/CONFLICT/);
   await assert.rejects(update('completed',1,''),/pickup location/);
   await update('completed');
  });
  await t.test('duplicate capture cannot reset production tracking or duplicate pickup emails',async()=>{
   await db.query('select cc_capture_payment($1,$2,20000,$3)',['order_test','pay_test','INR']);
   assert.equal((await db.query('select order_status from orders where order_id=$1',[oid])).rows[0].order_status,'completed');
   await update('completed',2);
   assert.equal((await db.query("select count(*)::int n from notification_jobs where kind='pickup'")).rows[0].n,1);
   await assert.rejects(db.query('select cc_capture_payment($1,$2,20000,$3)',['order_test','pay_different','INR']),/Different payment/);
  });
  await t.test('custom request saves notification atomically and creates only an unpaid order',async()=>{
   const k=randomUUID(),fields=JSON.stringify({name:'Student',email:'student@acet.ac.in',item_name:'Custom bookmark',description:'A leaf',budget:200});
   const a=(await db.query('select cc_submit_request($1,$2,$3) r',[u,k,fields])).rows[0].r;
   const b=(await db.query('select cc_submit_request($1,$2,$3) r',[u,k,fields])).rows[0].r;assert.equal(a.id,b.id);
   await db.query("update custom_requests set status='student_accepted',admin_price=150 where id=$1",[a.id]);
   const custom=(await db.query('select cc_custom_order($1,$2,$3) id',[a.id,u,snapshot])).rows[0].id;
   assert.equal((await db.query('select cc_custom_order($1,$2,$3) id',[a.id,u,snapshot])).rows[0].id,custom);
   assert.equal((await db.query('select payment_status from orders where order_id=$1',[custom])).rows[0].payment_status,'pending');
  });
  await t.test('cart versions prevent changes in one tab overwriting another',async()=>{
   await db.query('select cc_save_cart($1,0,$2)',[u,items]);
   await assert.rejects(db.query('select cc_save_cart($1,0,$2)',[u,'[]']),/CONFLICT/);
   assert.equal((await db.query('select items from carts where user_id=$1',[u])).rows[0].items.length,1);
  });
  await t.test('notification jobs are claimed once and support retries do not duplicate tickets',async()=>{
   const k=randomUUID();await db.query('select cc_submit_support($1,$2,$3,$4,$5,$6)',[u,k,'Student','student@acet.ac.in','Pickup question','Where is the pickup?']);
   await db.query('select cc_submit_support($1,$2,$3,$4,$5,$6)',[u,k,'Student','student@acet.ac.in','Pickup question','Where is the pickup?']);
   assert.equal((await db.query('select count(*)::int n from support_tickets')).rows[0].n,1);
   assert.ok((await db.query('select * from cc_claim_notifications(10)')).rows.length>=3);
   assert.equal((await db.query('select * from cc_claim_notifications(10)')).rows.length,0);
  });
  await t.test('customers cannot execute administrative RPCs or read another customer’s orders',async()=>{
   await db.query("select set_config('request.jwt.claim.sub',$1,false)",[other]);
   await db.exec('set role authenticated');
   assert.equal((await db.query('select * from orders')).rows.length,0);
   await assert.rejects(db.query('select cc_claim_notifications(10)'),/permission denied/);
   await db.exec('reset role');
  });
  await t.test('expired unpaid orders return reserved stock',async()=>{
   const id=await create(randomUUID());await db.query("update orders set ordered_at=now()-interval '31 minutes' where order_id=$1",[id]);
   await db.query('select cc_cancel_expired()');
   assert.equal((await db.query('select stock_quantity from products where product_id=$1',[p])).rows[0].stock_quantity,8);
   assert.equal((await db.query('select order_status from orders where order_id=$1',[id])).rows[0].order_status,'cancelled');
  });
  await t.test('gateway-linked orders remain payable after the reservation window',async()=>{
   const id=await create(randomUUID());await db.query("update orders set ordered_at=now()-interval '31 minutes',razorpay_order_id='order_late' where order_id=$1",[id]);
   await db.query('select cc_cancel_expired()');
   assert.equal((await db.query('select order_status from orders where order_id=$1',[id])).rows[0].order_status,'pending');
   await db.query('select cc_capture_payment($1,$2,20000,$3)',['order_late','pay_late','INR']);
   assert.equal((await db.query('select payment_status from orders where order_id=$1',[id])).rows[0].payment_status,'captured');
  });
  await t.test('capture clears only bought quantities once and preserves cart additions',async()=>{
   const id=await create(randomUUID());
   await db.query("update orders set razorpay_order_id='order_cart' where order_id=$1",[id]);
   await db.query('update carts set items=$1 where user_id=$2',[JSON.stringify([{productId:p,color:'Sage',quantity:3}]),u]);
   await db.query('select cc_capture_payment($1,$2,20000,$3)',['order_cart','pay_cart','INR']);
   assert.equal((await db.query('select items from carts where user_id=$1',[u])).rows[0].items[0].quantity,1);
   await db.query('select cc_capture_payment($1,$2,20000,$3)',['order_cart','pay_cart','INR']);
   assert.equal((await db.query('select items from carts where user_id=$1',[u])).rows[0].items[0].quantity,1);
  });
 }finally{await db.close();}
});

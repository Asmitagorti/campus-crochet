/* eslint-disable @typescript-eslint/no-require-imports */
const {loadEnvConfig}=require('@next/env');
const {readFileSync}=require('node:fs');
const {createHash}=require('node:crypto');
loadEnvConfig(process.cwd(),false,{info(){},error(){}});
(async()=>{
 const token=process.env.SUPABASE_ACCESS_TOKEN;
 const ref=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0];
 if(!token)throw new Error('Set SUPABASE_ACCESS_TOKEN in your ignored .env, or run the migration in Supabase SQL Editor. The service-role key cannot run DDL.');
 const sql=readFileSync('supabase/migrations/202610040001_store_operations.sql','utf8');
 const hash=createHash('sha256').update(sql).digest('hex');
 const endpoint=`https://api.supabase.com/v1/projects/${encodeURIComponent(ref)}/database/query`;
 const run=async query=>{const response=await fetch(endpoint,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({query})});const body=await response.json();if(!response.ok)throw new Error(body.message||'Database migration failed');return body;};
 await run('create table if not exists public.cc_migrations (name text primary key, hash text not null, applied_at timestamptz not null default now()); revoke all on public.cc_migrations from anon, authenticated;');
 const applied=await run("select hash from public.cc_migrations where name='202610040001_store_operations'");
 if(applied.length){if(applied[0].hash!==hash)throw new Error('This migration was already applied with different contents. Create a new migration.');console.log('Migration already applied.');return;}
 // The SQL includes BEGIN/COMMIT; record its exact version in the same transaction.
 await run(sql.replace(/commit;\s*$/i,`insert into public.cc_migrations(name,hash) values('202610040001_store_operations','${hash}');\ncommit;`));
 console.log('Store operations migration applied successfully.');
})().catch(e=>{console.error(e.message);process.exitCode=1;});

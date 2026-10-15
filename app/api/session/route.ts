import {cookies} from 'next/headers';
import {getSession} from '@/lib/auth';
import {failure,ensureProfile} from '@/lib/api';
export async function GET(){const user=await getSession();return Response.json({user});}
export async function POST(request:Request){
 const b=await request.json().catch(()=>null),token=b?.access_token;
 if(typeof token!=='string'||token.length>10000)return Response.json({error:'A valid access token is required'},{status:400});
 try{
 const r=await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`,{headers:{apikey:process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'',Authorization:`Bearer ${token}`},cache:'no-store',signal:AbortSignal.timeout(8000)});
 if(!r.ok)return Response.json({error:'Please sign in again.'},{status:401});
 const u=await r.json();if(!u.id||!u.email_confirmed_at)return Response.json({error:'Verify your email to continue.'},{status:401});
 const cookieStore=await cookies();cookieStore.set('cc-session',token,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:60*60});
 const user=await getSession();if(user)await ensureProfile(user);return Response.json({ok:true,user});
 }catch(e){return failure(e);}
}
export async function DELETE(){(await cookies()).delete('cc-session');return Response.json({ok:true});}

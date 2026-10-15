import {createHash} from 'node:crypto';
import {getServiceRoleClient} from '@/lib/server-db';
import {isAdminEmail} from '@/lib/auth';
import {readBody,text,failure,ApiError} from '@/lib/api';
import {sendOTPEmail} from '@/lib/resend';
import {allowOtp} from '@/lib/otp-limit';
const domains=['acet.ac.in','aec.ac.in','aus.ac.in','aec.edu.in','acmt.edu.in'];
export async function POST(request:Request){
 try{const b=await readBody(request),email=text(b.email,254).toLowerCase();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new ApiError('Enter a valid email address');
 const domain=email.split('@')[1];
 if(!isAdminEmail(email)&&!domains.some(d=>domain===d||domain.endsWith('.'+d)))throw new ApiError('Use your official college email');
 const db=getServiceRoleClient();
 const key='otp/'+createHash('sha256').update(email).digest('hex');
 const allowed=await allowOtp(()=>db.rpc('cc_rate_limit',{p_key:key,p_limit:3,p_seconds:600}),key);
 if(!allowed)throw new ApiError('Too many sign-in attempts. Try again in 10 minutes.',429);
 let link=await db.auth.admin.generateLink({type:'magiclink',email});
 if(link.error&&(/not found/i.test(link.error.message)||link.error.status===404)){
 const created=await db.auth.admin.createUser({email,email_confirm:true});if(created.error)throw created.error;
 link=await db.auth.admin.generateLink({type:'magiclink',email});
 }
 if(link.error||!link.data?.properties?.email_otp)throw new ApiError('Unable to prepare a sign-in code. Try again shortly.',503);
 const sent=await sendOTPEmail({to:email,otp:link.data.properties.email_otp});if(!sent.success)throw new ApiError(sent.error||'Unable to send the sign-in code',503);
 return Response.json({ok:true,verificationType:link.data.properties.verification_type||'magiclink'});
 }catch(e){return failure(e);}
}

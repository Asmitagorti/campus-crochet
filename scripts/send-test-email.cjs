/* eslint-disable @typescript-eslint/no-require-imports */
const {loadEnvConfig}=require('@next/env');
const {Resend}=require('resend');
loadEnvConfig(process.cwd(),false,{info(){},error(){}});
(async()=>{
 const resend=new Resend(process.env.RESEND_API_KEY);
 const {data,error}=await resend.emails.send({from:process.env.RESEND_FROM_EMAIL,to:'support@campus-crochet.tech',replyTo:'support@campus-crochet.tech',subject:'Campus Crochet email configuration check',text:'This setup check confirms Campus Crochet can send email using the verified campus-crochet.tech domain. Custom requests and support tickets will be sent to this inbox after the database migration is applied.'},{idempotencyKey:'configuration-check/20261004'});
 if(error)throw new Error(error.message);console.log('Resend accepted the configuration email:',data.id);
 const result=await resend.emails.get(data.id);if(result.data)console.log('Latest delivery event:',result.data.last_event);
})().catch(e=>{console.error(e.message);process.exitCode=1;});

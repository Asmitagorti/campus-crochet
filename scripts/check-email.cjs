/* eslint-disable @typescript-eslint/no-require-imports */
const { loadEnvConfig } = require('@next/env');
const {Resolver}=require('node:dns/promises');
loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
(async () => {
  const r = await fetch('https://api.resend.com/domains', {headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`}});
  const body = await r.json();
  console.log('Resend domain check:', r.status);
  if(r.ok) console.log((body.data||[]).map(d=>({name:d.name,status:d.status})));
  else console.log(body.message || 'Domain inspection unavailable');
  const resolver=new Resolver();resolver.setServers(['1.1.1.1','8.8.8.8']);
  try {const mx=await resolver.resolveMx('campus-crochet.tech');console.log('Inbound MX records:',mx);}
  catch(e){if(e.code==='ENODATA'||e.code==='ENOTFOUND'){console.log('No inbound MX records found. Configure the Zoho MX records for campus-crochet.tech.');process.exitCode=1;}else throw e;}
})().catch(e=>{console.log(e.message);process.exitCode=1;});

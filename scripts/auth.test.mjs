import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
// Compile the actual helper so the tests also run on supported Node 20 versions.
const source=await readFile(new URL('../lib/otp-limit.ts',import.meta.url),'utf8');
const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
const {allowOtp,createWindowLimiter}=await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

const missing={data:null,error:{code:'PGRST202',message:'Function not found'}};
test('development login remains limited when the migration is missing',async()=>{
 const local=createWindowLimiter(3,600000);
 const results=await Promise.all(Array.from({length:4},()=>allowOtp(async()=>missing,'same-account','development',local)));
 assert.deepEqual(results,[true,true,true,false]);
});
test('production never falls back to an in-process OTP limit',async()=>{
 let used=false;
 await assert.rejects(allowOtp(async()=>missing,'account','production',()=>{used=true;return true;}));
 assert.equal(used,false);
});
test('database failures and exhausted database limits fail closed',async()=>{
 await assert.rejects(allowOtp(async()=>({data:null,error:{code:'08006',message:'Disconnected'}}),'account','development',()=>true));
 assert.equal(await allowOtp(async()=>({data:false,error:null}),'account','development',()=>true),false);
 assert.equal(await allowOtp(async()=>({data:true,error:null}),'account','production',()=>false),true);
});
test('development OTP window expires and isolates accounts',()=>{
 let now=0;const allow=createWindowLimiter(3,600000,()=>now);
 assert.equal(allow('a'),true);assert.equal(allow('a'),true);assert.equal(allow('a'),true);assert.equal(allow('a'),false);
 assert.equal(allow('b'),true);now=600000;assert.equal(allow('a'),true);
});

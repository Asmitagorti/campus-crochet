import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';

// Exercise the actual route, with the identity provider and database substituted.
const source=await readFile(new URL('../app/api/cart/route.ts',import.meta.url),'utf8');
const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
const user='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222';
class ApiError extends Error{constructor(message,status=400){super(message);this.status=status;}}
function route(){
 const calls=[];
 const query={select(){return this;},eq(column,id){calls.push({column,id});return this;},async maybeSingle(){return{data:null,error:null};}};
 const dependencies={
  '@/lib/auth':{requireSession:async()=>({id:user})},
  '@/lib/server-db':{getServiceRoleClient:()=>({from:()=>query,rpc:async(name,args)=>{calls.push({name,args});return{data:{items:args.p_items,version:args.p_version+1},error:null};}})},
  '@/lib/api':{ApiError,UUID:/^[0-9a-f-]{36}$/i,readBody:request=>request.json(),ensureProfile:async()=>{calls.push('profile');},failure:error=>Response.json({error:error.message},{status:error.status||500})}
 };
 const compiled={exports:{}};
 new Function('require','module','exports',outputText)(name=>{assert.ok(dependencies[name],`Unexpected dependency: ${name}`);return dependencies[name];},compiled,compiled.exports);
 return{...compiled.exports,calls};
}
function write(body){return new Request('https://example.test/api/cart',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});}
test('cart reads reject requests belonging to the account that signed out',async()=>{
 const handler=route(),response=await handler.GET(new Request(`https://example.test/api/cart?user_id=${other}`));
 assert.equal(response.status,409);assert.deepEqual(handler.calls,[]);
});
test('a cart write cannot cross accounts when a session changes between requests',async()=>{
 const handler=route();
 for(const id of [other,undefined])assert.equal((await handler.PUT(write({user_id:id,version:0,items:[]}))).status,409);
 assert.deepEqual(handler.calls,[]);
});
test('an empty account cart carries its owner and reads only the signed-in user',async()=>{
 const handler=route(),response=await handler.GET(new Request(`https://example.test/api/cart?user_id=${user}`));
 assert.equal(response.status,200);assert.deepEqual(await response.json(),{user_id:user,items:[],version:0});
 assert.deepEqual(handler.calls,[{column:'user_id',id:user}]);
});
test('valid cart writes retain database version checks and use the authenticated owner',async()=>{
 const handler=route(),response=await handler.PUT(write({user_id:user,version:4,items:[]}));
 assert.equal(response.status,200);assert.deepEqual(await response.json(),{items:[],version:5});
 assert.deepEqual(handler.calls,['profile',{name:'cc_save_cart',args:{p_user:user,p_version:4,p_items:[]}}]);
});

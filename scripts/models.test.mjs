import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
const source=await readFile(new URL('../lib/models.ts',import.meta.url),'utf8');
const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
const {toOrder}=await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
test('legacy orders display the customer year from the database profile',()=>{
 const order=toOrder({order_id:'order',user_id:'user',total_price:'150.00',customer:{full_name:'Student',email:'student@acet.ac.in',year:2},customer_snapshot:{}});
 assert.equal(order.customer_snapshot.year,'2');assert.equal(order.total_price,150);
});
test('saved purchase logistics take precedence over subsequently edited profiles',()=>{
 const order=toOrder({order_id:'order',user_id:'user',total_price:150,customer:{full_name:'Updated name',year:3},customer_snapshot:{name:'Purchased name',year:'2'}});
 assert.equal(order.customer_snapshot.name,'Purchased name');assert.equal(order.customer_snapshot.year,'2');
});

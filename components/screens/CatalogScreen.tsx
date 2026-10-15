'use client';
import {useState} from 'react';import Link from 'next/link';
import type {Navigate} from '@/types';import {useProducts} from '@/lib/hooks';import {Empty,Notice,PageHeader,money} from '../ui';
export default function Catalog({initialCategory,onAddToCart}: {navigate:Navigate;initialCategory?:string;onAddToCart:(id:string,color:string,qty:number)=>void;onCustomOrder?:()=>void}){
 const {products,loading,error}=useProducts(),[category,setCategory]=useState(initialCategory||''),[query,setQuery]=useState(''),[added,setAdded]=useState('');
 const categories=Array.from(new Set(products.map(p=>p.category))).sort();
 const filtered=products.filter(p=>(!category||p.category===category)&&p.name.toLowerCase().includes(query.toLowerCase()));
 return <main className="container section"><PageHeader eyebrow="The collection" title="Small things. Full of character.">Choose your colours and find something to make your day.</PageHeader>
 <div className="collection-toolbar"><div className="tabs" aria-label="Filter collections"><button aria-pressed={!category} className={!category?'active':''} onClick={()=>setCategory('')}>All pieces</button>{categories.map(c=><button key={c} aria-pressed={category===c} className={category===c?'active':''} onClick={()=>setCategory(c)}>{c}</button>)}</div><label className="search-label"><span className="sr-only">Find a piece</span><input type="search" placeholder="Find a piece..." value={query} onChange={e=>setQuery(e.target.value)}/></label></div>
 {added&&<Notice>Added to your cart. <Link href="/cart">View cart</Link></Notice>}
 {error?<Notice error>{error}</Notice>:loading?<Notice>Loading collections...</Notice>:filtered.length?<div className="product-grid">{filtered.map(p=><article className="product-card" key={p.id}><Link href={'/products/'+p.id}><div className="product-image">{p.image?<img src={p.image} alt={p.name} loading="lazy"/>:<span>Photograph coming soon</span>}</div></Link><div className="product-card-info"><p className="eyebrow">{p.category}</p><Link href={'/products/'+p.id}><h2>{p.name}</h2></Link><div className="card-price"><span>{money(p.price)}</span><button className="link-button" disabled={p.stock===0} onClick={()=>{onAddToCart(p.id,p.colors[0]||'Default',1);setAdded(p.name);}}>{p.stock===0?'Unavailable':'Add to cart'}</button></div></div></article>)}</div>:<Empty title="No pieces here yet">Try another collection or <Link href="/custom-request">describe a custom piece</Link>.</Empty>}
 </main>;
}

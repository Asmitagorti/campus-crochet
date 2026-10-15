'use client';
import {useEffect,useId,useRef,useState} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import type {Page,Navigate,AuthUser,CartItem} from '@/types';
export default function Navbar({page,user,cart,onLoginClick,onLogout}:{page:Page;navigate:Navigate;user:AuthUser|null;cart:CartItem[];onLoginClick:()=>void;onLogout:()=>void}){
 const pathname=usePathname(),navId=useId(),menu=useRef<HTMLButtonElement>(null);
 const [openPath,setOpenPath]=useState<string|null>(null);const open=openPath===pathname,count=cart.reduce((n,i)=>n+i.quantity,0);
 useEffect(()=>{if(!open)return;const close=(event:KeyboardEvent)=>{if(event.key==='Escape'){setOpenPath(null);menu.current?.focus();}};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close);},[open]);
 return <header className="site-nav"><a className="skip-link" href="#page-content">Skip to content</a><div className="nav-inner"><Link href="/" className="wordmark" aria-label="Campus Crochet home"><span className="brand-mark" aria-hidden="true">cc</span><span>Campus Crochet<small>Made here. Made for you.</small></span></Link>
 <div className="mobile-nav-actions"><Link href="/cart" className="mobile-cart" aria-label={`Cart, ${count} items`}>Cart{count>0&&<span className="cart-count">{count}</span>}</Link><button ref={menu} className="menu-toggle btn-secondary" onClick={()=>setOpenPath(open?null:pathname)} aria-expanded={open} aria-controls={navId}>{open?'Close':'Menu'}</button></div>
 <nav id={navId} className={open?'nav-links is-open':'nav-links'} aria-label="Main navigation" onClick={()=>setOpenPath(null)}>
 <Link href="/collections" aria-current={page==='catalog'||page==='product'?'page':undefined}>Collections</Link><Link href="/about" aria-current={page==='about'?'page':undefined}>Our story</Link>
 <Link href="/orders" aria-current={page==='dashboard'?'page':undefined}>My orders</Link><Link className="desktop-cart" href="/cart" aria-current={page==='cart'?'page':undefined}>Cart{count>0?` (${count})`:''}</Link>
 {user?.role==='admin'&&<Link href="/admin" aria-current={page==='admin'?'page':undefined}>Admin</Link>}
 {user?<><span className="nav-name">{user.name.split(' ')[0]}</span><button className="link-button" onClick={onLogout}>Sign out</button></>:<button className="btn" onClick={onLoginClick}>Sign in</button>}
 </nav></div></header>;
}

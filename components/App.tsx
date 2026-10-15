'use client';
import {useCallback,useEffect,useState} from 'react';
import {usePathname,useRouter,useSearchParams} from 'next/navigation';
import type {AuthUser,Navigate} from '@/types';
import {api,syncSession} from '@/lib/client-api';
import {supabase} from '@/lib/supabase';
import {useCart} from '@/lib/use-cart';
import {hrefForPage,pageForPath} from '@/lib/navigation';
import Navbar from './Navbar';import Footer from './Footer';import LoginModal from './LoginModal';import CustomOrderModal from './CustomOrderModal';
import Gallery from './screens/GalleryScreen';
import Home from './screens/HomeScreen';import Catalog from './screens/CatalogScreen';import Product from './screens/ProductDetailScreen';import Orders from './screens/CustomerDashboardScreen';import Admin from './screens/AdminDashboardScreen';import Creations from './screens/PastCreationsScreen';import Payment from './screens/PaymentScreen';import About from './screens/AboutScreen';import Cart from './screens/CartScreen';import Support from './screens/SupportScreen';import Policy from './screens/PolicyScreen';import ProductManager from './screens/AddProductScreen';import {Notice} from './ui';
export default function App(){
 const path=usePathname(),params=useSearchParams(),router=useRouter(),page=pageForPath(path);
 const [user,setUser]=useState<AuthUser|null>(null),[authLoading,setAuthLoading]=useState(true),[login,setLogin]=useState(false),[authError,setAuthError]=useState('');
 const cart=useCart(user?.id);
 const navigate:Navigate=useCallback((target,data)=>router.push(hrefForPage(target,data)),[router]);
 useEffect(()=>{
 let mounted=true,sequence=0;
 async function restore(){const n=++sequence;try{await syncSession();const r=await api<{user:AuthUser|null}>('/api/session');if(mounted&&n===sequence){setUser(r.user);setAuthError('');}}catch(e){if(mounted&&n===sequence)setAuthError(e instanceof Error?e.message:'Unable to restore your session');}finally{if(mounted&&n===sequence)setAuthLoading(false);}}
 void restore();
 const {data:{subscription}}=supabase.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'){sequence++;setUser(null);setAuthLoading(false);void fetch('/api/session',{method:'DELETE'});}else if(session){setTimeout(()=>void restore(),0);}});
 const onFocus=()=>void restore();window.addEventListener('focus',onFocus);
 return()=>{mounted=false;subscription.unsubscribe();window.removeEventListener('focus',onFocus);};
 },[]);
 async function logout(){await supabase.auth.signOut({scope:'local'});await fetch('/api/session',{method:'DELETE'});setUser(null);router.push('/');}
 const openLogin=()=>setLogin(true),adminPage=['admin','add-product','past-creations'].includes(page||'');
 return <><Navbar page={page||'home'} navigate={navigate} user={user} cart={cart.cart} onLoginClick={openLogin} onLogout={logout}/>
 <div id="page-content" tabIndex={-1}>{authError&&<div className="container"><Notice error>{authError}</Notice></div>}{cart.error&&<div className="container"><Notice error>{cart.error}</Notice></div>}
 {page==='home'&&<Home navigate={navigate} onCustomOrder={()=>navigate('custom-request')} onAddToCart={cart.add}/>}
 {page==='catalog'&&<Catalog key={params.get('category')||'all'} navigate={navigate} initialCategory={params.get('category')||undefined} onAddToCart={cart.add} onCustomOrder={()=>navigate('custom-request')}/>}
 {page==='product'&&<Product key={path} navigate={navigate} productId={path.split('/')[2]||null} onAddToCart={cart.add}/>}
 {page==='dashboard'&&<Orders navigate={navigate} user={user} onLoginClick={openLogin} authLoading={authLoading}/>}
 {adminPage&&(authLoading?<main className="container"><Notice>Verifying administrator access...</Notice></main>:user?.role==='admin'?(page==='admin'?<Admin navigate={navigate} onLogout={logout}/>:page==='past-creations'?<Creations navigate={navigate}/>:<ProductManager navigate={navigate}/>):<main className="container"><Notice>Sign in with the administrator email to access this area.</Notice><button className="btn" onClick={openLogin}>Verify admin email</button></main>)}
 {page==='payment'&&<Payment key={params.get('order')||'cart'} navigate={navigate} cart={cart.cart} user={user} onPaymentSaved={()=>void cart.refresh()} onRequireLogin={openLogin} existingOrderId={params.get('order')}/>}
 {page==='gallery'&&<Gallery/>}
 {page==='about'&&<About navigate={navigate}/>}
 {page==='cart'&&<Cart navigate={navigate} cart={cart.cart} onUpdateQty={cart.update} onRemove={cart.remove} user={user} onRequireLogin={openLogin}/>}
 {page==='support'&&<Support user={user} onRequireLogin={openLogin}/>}
 {page==='policy'&&<Policy/>}
 {page==='custom-request'&&<main className="container form-page"><CustomOrderModal embedded user={user} onClose={()=>navigate('dashboard')} onRequireLogin={openLogin}/></main>}
 </div><Footer navigate={navigate}/>{login&&<LoginModal mode="modal" onLogin={u=>{setUser(u);setLogin(false);if(u.role==='admin')navigate('admin');}} onDismiss={()=>setLogin(false)}/>}
 </>;
}

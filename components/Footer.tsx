import Link from 'next/link';
import type {Navigate} from '@/types';
export default function Footer(_props:{navigate:Navigate;onCustomOrder?:()=>void}){
 return <footer className="site-footer"><div className="footer-grid"><div><Link href="/" className="footer-brand">Campus Crochet</Link><p>Small things, made with care.<br/>Handmade on campus in Surampalem.</p><a href="mailto:support@campus-crochet.tech">support@campus-crochet.tech</a></div>
 <div><h2>Shop</h2><Link href="/collections">Collections</Link><Link href="/creations">Past creations</Link><Link href="/custom-request">Custom requests</Link></div>
 <div><h2>Here to help</h2><Link href="/orders">Track my orders</Link><Link href="/ordering-policy">Ordering & pickup</Link><Link href="/support">Support</Link><Link href="/about">Our story</Link></div></div>
 <div className="footer-bottom"><span>© {new Date().getFullYear()} Campus Crochet</span><span>Student-made. Campus pickup.</span></div></footer>;
}

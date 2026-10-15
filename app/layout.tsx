import type {Metadata} from 'next';import {Suspense} from 'react';import App from '@/components/App';import './globals.css';
export const metadata:Metadata={title:'Campus Crochet | Handmade on campus',description:'Student-made crochet, thoughtful gifts and custom pieces. Made to order in Surampalem, with campus pickup.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body><Suspense fallback={<main className="container">Loading Campus Crochet...</main>}><App/></Suspense>{children}</body></html>;}

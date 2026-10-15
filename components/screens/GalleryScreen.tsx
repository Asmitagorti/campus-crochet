'use client';
import Link from 'next/link';
import {useResource} from '@/lib/hooks';
import {Empty,Notice,PageHeader} from '../ui';
type Piece={id:string;caption:string;image_url:string;product_name:string};
export default function Gallery(){
 const {data,loading,error}=useResource<Piece[]>('/api/gallery',[]);
 return <main className="container section"><PageHeader eyebrow="From the studio archive" title="Made, loved, remembered."/><p className="muted">Finished pieces photographed by the studio.</p>
 {error?<Notice error>{error}</Notice>:loading?<Notice>Loading past creations...</Notice>:!data.length?<Empty title="The archive is growing"><p>Finished photographs will appear here when the studio publishes them.</p><Link href="/collections">Explore collections</Link></Empty>:<div className="product-grid">{data.map(p=><figure className="product-card" key={p.id}><div className="product-image"><img src={p.image_url} alt={p.caption||p.product_name} loading="lazy"/></div><figcaption className="product-card-info"><h2>{p.product_name}</h2>{p.caption&&<p>{p.caption}</p>}</figcaption></figure>)}</div>}
 </main>;
}

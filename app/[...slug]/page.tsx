import {notFound} from 'next/navigation';
const routes=['collections','creations','orders','admin','admin/products','admin/creations','checkout','about','cart','support','ordering-policy','custom-request'];
export default async function Page({params}:{params:Promise<{slug:string[]}>}){const {slug}=await params;const path=slug.join('/');if(!routes.includes(path)&&!/^products\/[0-9a-f-]{36}$/i.test(path))notFound();return null;}
